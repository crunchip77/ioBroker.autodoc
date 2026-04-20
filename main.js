'use strict';
/*
 * Created with @iobroker/create-adapter v3.1.2
 */

const fs = require('fs');
const path = require('path');
const { createHash } = require('node:crypto');
const utils = require('@iobroker/adapter-core');
const QRCode = require('qrcode');

// Import modular components
const Discovery = require('./lib/discovery');
const DocumentModel = require('./lib/documentModel');
const MarkdownRenderer = require('./lib/markdownRenderer');
const HtmlRenderer = require('./lib/htmlRenderer');
const I18n = require('./lib/i18n');
const VersionTracker = require('./lib/versionTracker');
const Notifier = require('./lib/notifier');
const AiEnhancer = require('./lib/aiEnhancer');

/** When `documentationStatesMode` is metadata — full exports live only under adapter /files. */
const DOCS_STATE_METADATA_PLACEHOLDER =
	'[AutoDoc] Full content is stored only in adapter files (autodoc-latest.md, autodoc-latest.json, autodoc-admin.html). Open Files in Admin or use info.htmlUrl*.';
/** Valid minimal JSON for `documentation.json` state when not duplicating the full export. */
const DOCS_JSON_METADATA_PLACEHOLDER =
	'{"_autodoc":"Full document model is in autodoc-latest.json under adapter files — not duplicated in states."}';

/**
 * SHA-256 hex digest of a UTF-8 string (for export identity without storing large payloads).
 *
 * @param {string} s
 * @returns {string}
 */
function sha256HexUtf8(s) {
	return createHash('sha256').update(String(s), 'utf8').digest('hex');
}

class Autodoc extends utils.Adapter {
	/**
	 * @param {object} [options] Adapter options.
	 */
	constructor(options) {
		super({
			...options,
			name: 'autodoc',
		});

		// Initialize modular components
		this.discovery = new Discovery(this);
		this.documentModel = new DocumentModel(this);
		this.i18n = new I18n();
		this.markdownRenderer = new MarkdownRenderer(this, this.i18n);
		this.htmlRenderer = new HtmlRenderer(this, this.i18n);
		this.versionTracker = new VersionTracker(this);
		this.notifier = new Notifier(this);
		this.aiEnhancer = new AiEnhancer(this);

		// Timer for periodic auto-generation
		this.autoGenerateInterval = null;

		// Debounce timer for event-based generation
		this.eventGenerateDebounce = null;

		/** Prevents overlapping runs (startup + manual + sendTo would otherwise fight Ollama and file writes). */
		this._documentationGenerationInProgress = false;

		this.on('ready', this.onReady.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		this.on('objectChange', this.onObjectChange.bind(this));
		this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		await this.createStates();

		await this.setObjectNotExistsAsync('files', {
			type: 'meta',
			common: {
				name: 'Files',
				type: 'meta.user',
			},
			native: {},
		});

		await this.setStateAsync('info.connection', { val: false, ack: true });

		this.log.info('AutoDoc adapter starting');
		await this.checkMultihostPlacement();
		this.log.debug(`config projectName: ${this.config.projectName || ''}`);
		this.log.debug(`config targetSystem: ${this.config.targetSystem || ''}`);
		this.log.debug(`config autoGenerateOnStart: ${this.config.autoGenerateOnStart}`);
		this.log.debug(`config onlyEnabledInstances: ${this.config.onlyEnabledInstances}`);
		this.log.debug(`config hideInstanceDetailsInMarkdown: ${this.config.hideInstanceDetailsInMarkdown}`);
		this.log.debug(`config maxDocumentedInstances: ${this.config.maxDocumentedInstances}`);

		await this.subscribeStatesAsync('action.generate');
		await this.subscribeStatesAsync('action.download*');

		// Subscribe to adapter instance object changes for event-based generation
		if (this.config.autoGenerateOnEvents) {
			await this.subscribeForeignObjectsAsync('system.adapter.*');
			this.log.info('Subscribed to adapter instance changes for event-based generation');
		}

		// Set documentation language
		const language = this.config.language || 'en';
		this.i18n.setLanguage(language);
		this.log.debug(`Using documentation language: ${language}`);

		// Check if HTML template has changed since last generation — force regenerate if so
		const { RENDERER_VERSION } = require('./lib/htmlRenderer');
		const storedTemplateVersion = await this.getStateAsync('info.templateVersion');
		const templateChanged = !storedTemplateVersion || storedTemplateVersion.val !== RENDERER_VERSION;
		if (templateChanged) {
			this.log.info(
				`HTML template updated (${storedTemplateVersion ? storedTemplateVersion.val : 'none'} → ${RENDERER_VERSION}), forcing regeneration`,
			);
		}

		// Run first generation in the background so slow steps (e.g. two Ollama calls) do not block
		// onReady — otherwise info.connection stays false and the instance stays red for minutes or forever on error.
		if (this.config.autoGenerateOnStart || templateChanged) {
			const reasons = [];
			if (this.config.autoGenerateOnStart) {
				reasons.push('autoGenerateOnStart');
			}
			if (templateChanged) {
				reasons.push('renderer/template version mismatch');
			}
			this.log.info(
				`Queuing documentation generation on startup (${reasons.join(', ')}) — runs in background; watch for "Documentation generated via startup"`,
			);
			this.generateDocumentation('startup').catch(error => {
				this.log.error(`Startup documentation generation failed: ${error.message}`);
			});
		} else {
			this.log.info(
				'Skipping startup documentation: autoGenerateOnStart is false and info.templateVersion already matches the current HTML renderer — HTML files are unchanged until you enable startup generation, trigger manual generate, or install an adapter version with a new renderer',
			);
		}

		// Setup periodic auto-generation if interval is configured
		if (this.config.autoGenerateInterval && this.config.autoGenerateInterval > 0) {
			const intervalMs = this.config.autoGenerateInterval * 60 * 60 * 1000;
			this.log.info(
				`Setting up automatic documentation generation every ${this.config.autoGenerateInterval} hours`,
			);
			const updateNextGeneration = async () => {
				const next = new Date(Date.now() + intervalMs);
				await this.setStateAsync('info.nextGeneration', { val: next.toISOString(), ack: true });
			};
			await updateNextGeneration();
			this.autoGenerateInterval = setInterval(async () => {
				this.log.debug('Auto-generating documentation on schedule');
				try {
					await this.generateDocumentation('scheduled');
				} catch (error) {
					this.log.error(`Scheduled documentation generation failed: ${error.message}`);
				}
				await updateNextGeneration();
			}, intervalMs);
		}

		await this.setStateAsync('info.connection', { val: true, ack: true });
		this.log.info('AutoDoc adapter started');
	}

	/**
	 * Is called when a subscribed foreign object changes.
	 * Triggers debounced documentation regeneration on adapter install/enable/disable.
	 *
	 * @param {string} id Object ID.
	 * @param {object | null} obj New object value, or null if deleted.
	 */
	onObjectChange(id, obj) {
		// Only react to adapter instance objects (system.adapter.NAME.NUMBER)
		if (!id.startsWith('system.adapter.') || id.split('.').length !== 4) {
			return;
		}

		const adapterName = id.split('.')[2];
		if (adapterName === 'autodoc') {
			return;
		}

		const event = obj === null ? 'removed' : 'changed';
		this.log.debug(`Adapter instance ${id} ${event} - scheduling documentation update`);

		// Debounce: wait 30 seconds after the last change before regenerating
		if (this.eventGenerateDebounce) {
			clearTimeout(this.eventGenerateDebounce);
		}

		this.eventGenerateDebounce = setTimeout(async () => {
			this.eventGenerateDebounce = null;
			this.log.info('Regenerating documentation after adapter change');
			try {
				await this.generateDocumentation('event');
			} catch (error) {
				this.log.error(`Event-based documentation generation failed: ${error.message}`);
			}
		}, 30000);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances.
	 *
	 * @param {() => void} callback Function that finalizes adapter shutdown.
	 */
	onUnload(callback) {
		// Clear periodic auto-generation timer
		if (this.autoGenerateInterval) {
			clearInterval(this.autoGenerateInterval);
			this.autoGenerateInterval = null;
		}

		// Clear event debounce timer
		if (this.eventGenerateDebounce) {
			clearTimeout(this.eventGenerateDebounce);
			this.eventGenerateDebounce = null;
		}

		this.setStateAsync('info.connection', { val: false, ack: true })
			.then(() => callback())
			.catch(() => callback());
	}

	/**
	 * Create custom states for the adapter.
	 */
	async createStates() {
		const definitions = {
			'action.generate': {
				name: 'Generate documentation',
				type: 'boolean',
				role: 'button',
				read: false,
				write: true,
				def: false,
			},
			'action.downloadMarkdown': {
				name: 'Download markdown documentation',
				type: 'boolean',
				role: 'button',
				read: false,
				write: true,
				def: false,
			},
			'action.downloadJson': {
				name: 'Download JSON documentation',
				type: 'boolean',
				role: 'button',
				read: false,
				write: true,
				def: false,
			},
			'action.downloadHtml': {
				name: 'Download HTML documentation',
				type: 'boolean',
				role: 'button',
				read: false,
				write: true,
				def: false,
			},
			'documentation.lastMarkdownFile': {
				name: 'Last generated markdown filename',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			'documentation.lastHtmlFile': {
				name: 'Last generated HTML filename',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			'documentation.lastJsonFile': {
				name: 'Last generated JSON filename',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			'documentation.markdown': {
				name: 'Last generated markdown content',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			'documentation.html': {
				name: 'Last generated HTML content',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			'documentation.json': {
				name: 'Last generated JSON content',
				type: 'string',
				role: 'json',
				read: true,
				write: false,
				def: '{}',
			},
			'documentation.stateSummary': {
				name: 'State objects summary (JSON)',
				type: 'string',
				role: 'json',
				read: true,
				write: false,
				def: '{}',
			},
			'documentation.exportHashes': {
				name: 'SHA-256 of latest MD / JSON / Admin HTML exports (hex)',
				type: 'string',
				role: 'json',
				read: true,
				write: false,
				def: '{}',
			},
			'info.lastGeneration': {
				name: 'Last generation timestamp',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			'info.nextGeneration': {
				name: 'Next scheduled generation timestamp',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			'info.lastTrigger': {
				name: 'Last generation trigger',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			'info.templateVersion': {
				name: 'HTML renderer version used for last generation',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			'info.summary': {
				name: 'Documentation summary',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			'info.systemLanguage': {
				name: 'System language',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			'info.instanceCount': {
				name: 'Number of adapter instances',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
				def: 0,
			},
			'info.enabledInstanceCount': {
				name: 'Number of enabled adapter instances',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
				def: 0,
			},
			'info.disabledInstanceCount': {
				name: 'Number of disabled adapter instances',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
				def: 0,
			},
			'info.instanceHosts': {
				name: 'Instance host summary',
				type: 'string',
				role: 'json',
				read: true,
				write: false,
				def: '{}',
			},
			'info.hostName': {
				name: 'Host name',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			'info.hostPlatform': {
				name: 'Host platform',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			'info.hostVersion': {
				name: 'Host version',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			'info.totalStateObjects': {
				name: 'Total number of detected state objects',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
				def: 0,
			},
			'info.writableStateObjects': {
				name: 'Number of writable state objects',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
				def: 0,
			},
			'info.readonlyStateObjects': {
				name: 'Number of read-only state objects',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
				def: 0,
			},
			'info.htmlUrl': {
				name: 'Direct URL to latest HTML documentation (primary profile)',
				type: 'string',
				role: 'url',
				read: true,
				write: false,
				def: '',
			},
			'info.htmlUrlAdmin': {
				name: 'Direct URL to Admin HTML documentation',
				type: 'string',
				role: 'url',
				read: true,
				write: false,
				def: '',
			},
			'info.htmlUrlUser': {
				name: 'Direct URL to User/Family HTML documentation',
				type: 'string',
				role: 'url',
				read: true,
				write: false,
				def: '',
			},
			'info.htmlUrlOnboarding': {
				name: 'Direct URL to Onboarding HTML documentation',
				type: 'string',
				role: 'url',
				read: true,
				write: false,
				def: '',
			},
			'versioning.lastDocumentModel': {
				name: 'Last generated document model (JSON)',
				type: 'string',
				role: 'json',
				read: true,
				write: false,
				def: '{}',
			},
			'versioning.latestVersion': {
				name: 'Latest documentation version',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			'versioning.changeCount': {
				name: 'Number of changes in latest version',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
				def: 0,
			},
			'versioning.changelog': {
				name: 'Complete changelog history',
				type: 'string',
				role: 'json',
				read: true,
				write: false,
				def: '[]',
			},
		};

		for (const [id, common] of Object.entries(definitions)) {
			await this.setObjectNotExistsAsync(id, {
				type: 'state',
				common: common,
				native: {},
			});
		}
	}

	/**
	 * Build human readable summary string.
	 *
	 * @param {object} docModel Structured documentation model.
	 * @returns {string} Summary string.
	 */
	buildSummary(docModel) {
		const stateSummary = docModel.appendices.stateSummary;

		return `Dokumentation für "${docModel.system.projectName}" erzeugt: ${docModel.system.statistics.instanceCount} Instanzen, ${docModel.system.statistics.enabledInstanceCount} aktiviert, ${docModel.system.statistics.disabledInstanceCount} deaktiviert, ${stateSummary.total} State-Objekte (${stateSummary.writable} schreibbar, ${stateSummary.readonly} nur lesbar).`;
	}

	/**
	 * Delete oldest timestamped autodoc files, keeping only the newest `maxFiles` of each type.
	 *
	 * @param {string} basePath ioBroker file namespace path.
	 * @param {number} maxFiles Maximum number of timestamped files to keep per type.
	 * @returns {Promise<void>}
	 */
	async rotateFiles(basePath, maxFiles) {
		try {
			const files = await this.readDirAsync(basePath, '');
			const names = files.map(f => f.file);

			// md and json: autodoc-TIMESTAMP.md / .json
			for (const ext of ['md', 'json']) {
				const pattern = /^autodoc-\d{4}-\d{2}-\d{2}T/;
				const typed = names.filter(n => n.endsWith(`.${ext}`) && pattern.test(n)).sort();
				if (typed.length > maxFiles) {
					const toDelete = typed.slice(0, typed.length - maxFiles);
					for (const name of toDelete) {
						try {
							await this.delFileAsync(basePath, name);
							this.log.debug(`Rotated old file: ${name}`);
						} catch (e) {
							this.log.warn(`Could not delete old file ${name}: ${e.message}`);
						}
					}
				}
			}

			// html: autodoc-{profile}-TIMESTAMP.html (three profiles)
			for (const profile of ['admin', 'user', 'onboarding']) {
				const pattern = new RegExp(`^autodoc-${profile}-\\d{4}-\\d{2}-\\d{2}T`);
				const typed = names.filter(n => n.endsWith('.html') && pattern.test(n)).sort();
				if (typed.length > maxFiles) {
					const toDelete = typed.slice(0, typed.length - maxFiles);
					for (const name of toDelete) {
						try {
							await this.delFileAsync(basePath, name);
							this.log.debug(`Rotated old file: ${name}`);
						} catch (e) {
							this.log.warn(`Could not delete old file ${name}: ${e.message}`);
						}
					}
				}
			}
		} catch (e) {
			this.log.warn(`File rotation failed: ${e.message}`);
		}
	}

	/**
	 * Warn if AutoDoc is running on a non-primary host in a multihost setup.
	 * AutoDoc should run on the master to ensure correct filesystem export and npm access.
	 *
	 * @returns {Promise<void>}
	 */
	async checkMultihostPlacement() {
		try {
			const hostsView = await this.getObjectViewAsync('system', 'host', {});
			const hostIds = (hostsView && hostsView.rows ? hostsView.rows : [])
				.map(r => r.id)
				.filter(Boolean)
				.sort();
			if (hostIds.length <= 1) {
				return;
			}

			const currentHostId = `system.host.${this.host}`;
			if (hostIds[0] !== currentHostId) {
				this.log.warn(
					`Multihost setup detected (${hostIds.length} hosts). AutoDoc is running on "${this.host}" which may not be the master host. ` +
						`For correct filesystem export and npm access, AutoDoc should run on the master. ` +
						`Detected hosts: ${hostIds.map(h => h.replace('system.host.', '')).join(', ')}`,
				);
			}
		} catch (e) {
			this.log.debug(`Multihost check skipped: ${e.message}`);
		}
	}

	/**
	 * @returns {boolean} True when large documentation strings are not stored in object states.
	 */
	isDocumentationStatesMetadataOnly() {
		const m = String(this.config.documentationStatesMode || 'full').toLowerCase();
		return m === 'metadata' || m === 'metadata_only' || m === 'files_only';
	}

	/**
	 * Read a UTF-8 file from this adapter's ioBroker file namespace.
	 *
	 * @param {string} basePath e.g. `autodoc.0.files`
	 * @param {string} filename File name under that namespace
	 * @returns {Promise<string>}
	 */
	async readAdapterFileUtf8(basePath, filename) {
		const res = await this.readFileAsync(basePath, filename);
		if (res == null) {
			return '';
		}
		const raw = res.file !== undefined ? res.file : res;
		if (Buffer.isBuffer(raw)) {
			return raw.toString('utf8');
		}
		if (typeof raw === 'string') {
			return raw;
		}
		return String(raw);
	}

	/**
	 * Build a direct URL to autodoc-latest.html via the web or admin adapter.
	 *
	 * @returns {Promise<string>} URL string or empty string if not determinable.
	 */
	async buildBaseUrl() {
		try {
			// User-configured base URL takes priority (solves Docker/hostname issues)
			if (this.config.baseUrl) {
				let base = this.config.baseUrl.trim().replace(/\/$/, '');
				if (!base.startsWith('http://') && !base.startsWith('https://')) {
					base = `http://${base}`;
				}
				return base;
			}

			// Auto-detect: try web adapter for port, fall back to admin
			const host = this.host || 'localhost';
			const webObj = await this.getForeignObjectAsync('system.adapter.web.0');
			if (webObj && webObj.native) {
				const port = webObj.native.port || 8082;
				const secure = webObj.native.secure ? 'https' : 'http';
				return `${secure}://${host}:${port}`;
			}

			return `http://${host}:8081`;
		} catch (e) {
			this.log.warn(`Could not build base URL: ${e.message}`);
			return '';
		}
	}

	/**
	 * Persist generated documentation and info states.
	 *
	 * @param {object} docModel Structured documentation model.
	 * @param {string} markdown Markdown output.
	 * @param {{ admin: string, user: string, onboarding: string }} htmlAll HTML per profile.
	 * @param {string} json JSON output.
	 * @param {string} [prebuiltBaseUrl] Pre-built base URL (avoids a second buildBaseUrl() call).
	 * @returns {Promise<void>} Promise that resolves when states are written.
	 */
	async persistDocumentation(docModel, markdown, htmlAll, json, prebuiltBaseUrl) {
		try {
			const now = new Date();
			const pad = n => String(n).padStart(2, '0');
			const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
			const basePath = `${this.namespace}.files`;

			// Save timestamped markdown + json
			const markdownFilename = `autodoc-${timestamp}.md`;
			await this.writeFileAsync(basePath, markdownFilename, markdown);
			this.log.info(`Markdown saved to /files/${this.namespace}/${markdownFilename}`);

			const jsonFilename = `autodoc-${timestamp}.json`;
			await this.writeFileAsync(basePath, jsonFilename, json);

			// Save all three HTML profiles (timestamped)
			const profiles = ['admin', 'user', 'onboarding'];
			for (const profile of profiles) {
				const content = htmlAll[profile];
				if (content) {
					const filename = `autodoc-${profile}-${timestamp}.html`;
					await this.writeFileAsync(basePath, filename, content);
					this.log.info(`HTML (${profile}) saved to /files/${this.namespace}/${filename}`);
				}
			}

			// Save fixed "latest" files for direct access
			await this.writeFileAsync(basePath, 'autodoc-latest.md', markdown);
			await this.writeFileAsync(basePath, 'autodoc-latest.json', json);
			await this.writeFileAsync(basePath, 'autodoc-admin.html', htmlAll.admin);
			await this.writeFileAsync(basePath, 'autodoc-user.html', htmlAll.user);
			await this.writeFileAsync(basePath, 'autodoc-onboarding.html', htmlAll.onboarding);
			// Keep autodoc-latest.html pointing to the admin profile for backward compat
			await this.writeFileAsync(basePath, 'autodoc-latest.html', htmlAll.admin);

			// Rotate old timestamped files
			const maxFiles = this.config.maxStoredFiles > 0 ? this.config.maxStoredFiles : 5;
			await this.rotateFiles(basePath, maxFiles);

			// Optional filesystem export — write HTML files to a real OS path outside ioBroker's DB
			await this.exportToFilesystem(htmlAll);

			// Build and store profile URLs (use pre-built URL from generateDocumentation if available)
			const baseUrl = prebuiltBaseUrl !== undefined ? prebuiltBaseUrl : await this.buildBaseUrl();
			const filePath = profile => `/files/${this.namespace}.files/autodoc-${profile}.html`;
			await this.setStateAsync('info.htmlUrlAdmin', { val: `${baseUrl}${filePath('admin')}`, ack: true });
			await this.setStateAsync('info.htmlUrlUser', { val: `${baseUrl}${filePath('user')}`, ack: true });
			await this.setStateAsync('info.htmlUrlOnboarding', {
				val: `${baseUrl}${filePath('onboarding')}`,
				ack: true,
			});
			// Legacy state: keep pointing to admin
			const htmlUrl = `${baseUrl}${filePath('admin')}`;
			await this.setStateAsync('info.htmlUrl', { val: htmlUrl, ack: true });

			// Update info states (keep metadata as states for quick access)
			const summary = this.buildSummary(docModel);
			const stateSummaryJson = JSON.stringify(docModel.appendices.stateSummary, null, 2);
			const hostSummaryJson = JSON.stringify(docModel.system.hosts, null, 2);

			await this.setStateAsync('documentation.lastMarkdownFile', { val: markdownFilename, ack: true });
			await this.setStateAsync('documentation.lastHtmlFile', {
				val: `autodoc-admin-${timestamp}.html`,
				ack: true,
			});
			await this.setStateAsync('documentation.lastJsonFile', { val: jsonFilename, ack: true });

			const metadataOnly = this.isDocumentationStatesMetadataOnly();
			if (metadataOnly) {
				this.log.info(
					'Documentation states: metadata-only mode — markdown/HTML/JSON are not duplicated in object states (see /files autodoc-latest.*).',
				);
				await this.setStateAsync('documentation.markdown', { val: DOCS_STATE_METADATA_PLACEHOLDER, ack: true });
				await this.setStateAsync('documentation.html', { val: DOCS_STATE_METADATA_PLACEHOLDER, ack: true });
				await this.setStateAsync('documentation.json', { val: DOCS_JSON_METADATA_PLACEHOLDER, ack: true });
			} else {
				await this.setStateAsync('documentation.markdown', { val: markdown, ack: true });
				await this.setStateAsync('documentation.html', { val: htmlAll.admin, ack: true });
				await this.setStateAsync('documentation.json', { val: json, ack: true });
			}

			const exportHashes = {
				'autodoc-latest.md': sha256HexUtf8(markdown),
				'autodoc-latest.json': sha256HexUtf8(json),
				'autodoc-admin.html': sha256HexUtf8(htmlAll.admin),
			};
			await this.setStateAsync('documentation.exportHashes', {
				val: JSON.stringify(exportHashes),
				ack: true,
			});

			await this.setStateAsync('documentation.stateSummary', { val: stateSummaryJson, ack: true });

			await this.setStateAsync('info.summary', { val: summary, ack: true });
			await this.setStateAsync('info.lastTrigger', { val: docModel.meta.trigger, ack: true });
			await this.setStateAsync('info.lastGeneration', { val: docModel.meta.generatedAt, ack: true });
			await this.setStateAsync('info.templateVersion', {
				val: require('./lib/htmlRenderer').RENDERER_VERSION,
				ack: true,
			});
			await this.setStateAsync('info.systemLanguage', { val: docModel.meta.language, ack: true });
			await this.setStateAsync('info.instanceCount', {
				val: docModel.system.statistics.instanceCount,
				ack: true,
			});
			await this.setStateAsync('info.enabledInstanceCount', {
				val: docModel.system.statistics.enabledInstanceCount,
				ack: true,
			});
			await this.setStateAsync('info.disabledInstanceCount', {
				val: docModel.system.statistics.disabledInstanceCount,
				ack: true,
			});
			await this.setStateAsync('info.instanceHosts', { val: hostSummaryJson, ack: true });
			await this.setStateAsync('info.hostName', { val: docModel.system.primaryHost.name, ack: true });
			await this.setStateAsync('info.hostPlatform', { val: docModel.system.primaryHost.platform, ack: true });
			await this.setStateAsync('info.hostVersion', { val: docModel.system.primaryHost.version, ack: true });
			await this.setStateAsync('info.totalStateObjects', {
				val: docModel.appendices.stateSummary.total,
				ack: true,
			});
			await this.setStateAsync('info.writableStateObjects', {
				val: docModel.appendices.stateSummary.writable,
				ack: true,
			});
			await this.setStateAsync('info.readonlyStateObjects', {
				val: docModel.appendices.stateSummary.readonly,
				ack: true,
			});
		} catch (error) {
			this.log.error(`Error persisting documentation: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Export HTML profiles to a real filesystem path (opt-in via config.exportPath).
	 * Runs after the ioBroker file write — failures produce a warning but do not abort generation.
	 *
	 * @param {{ admin: string, user: string, onboarding: string }} htmlAll HTML per profile.
	 * @returns {Promise<void>}
	 */
	async exportToFilesystem(htmlAll) {
		const exportPath = (this.config.exportPath || '').trim();
		if (!exportPath) {
			return;
		}

		try {
			await fs.promises.mkdir(exportPath, { recursive: true });
			const profiles = ['admin', 'user', 'onboarding'];
			for (const profile of profiles) {
				const content = htmlAll[profile];
				if (!content) {
					continue;
				}
				const dest = path.join(exportPath, `autodoc-${profile}.html`);
				await fs.promises.writeFile(dest, content, 'utf8');
			}
			this.log.info(`Filesystem export written to: ${exportPath}`);
		} catch (e) {
			this.log.warn(`Filesystem export failed (${exportPath}): ${e.message} — ioBroker output unaffected`);
		}
	}

	/**
	 * Generate and store documentation.
	 *
	 * @param {string} trigger Generation trigger source.
	 */
	async generateDocumentation(trigger) {
		if (this._documentationGenerationInProgress) {
			this.log.warn(
				`Documentation generation is already running — ignoring duplicate trigger "${trigger}". With Ollama, one run can take many minutes (two model calls + optional German polish). Wait for "Documentation generated via …" before starting another.`,
			);
			return;
		}
		this._documentationGenerationInProgress = true;
		try {
			this.log.info(
				`Documentation generation (${trigger}): 1/5 — discovery (scanning system, may take a bit on large installs)…`,
			);
			const rawData = await this.discovery.collectRawData();

			this.log.info(`Documentation generation (${trigger}): 2/5 — building document model…`);
			const docModel = await this.documentModel.buildDocumentModel(rawData, trigger);

			const version = this.versionTracker.generateVersion();
			docModel.meta.version = version;

			const previousDocModel = await this.versionTracker.getPreviousVersion();
			const changeData = this.versionTracker.compareVersions(docModel, previousDocModel);

			docModel.changelog = await this.versionTracker.getChangelog();

			this.log.info(
				`Documentation generation (${trigger}): 3/5 — AI enhancement (disabled=instant; else two LLM calls — local Ollama often several minutes each)…`,
			);
			docModel.ai = await this.aiEnhancer.enhance(docModel);

			this.log.info(`Documentation generation (${trigger}): 4/5 — rendering Markdown and HTML…`);
			const markdown = this.markdownRenderer.renderMarkdown(docModel);

			// Pre-build URLs and QR code SVGs so HTML is fully self-contained (no CDN)
			const baseUrl = await this.buildBaseUrl();
			const profileFilePath = profile => `/files/${this.namespace}.files/autodoc-${profile}.html`;
			const renderUrls = {
				admin: baseUrl ? `${baseUrl}${profileFilePath('admin')}` : '',
				user: baseUrl ? `${baseUrl}${profileFilePath('user')}` : '',
				onboarding: baseUrl ? `${baseUrl}${profileFilePath('onboarding')}` : '',
			};
			const renderQrSvgs = {};
			for (const [profile, url] of Object.entries(renderUrls)) {
				if (url) {
					try {
						renderQrSvgs[profile] = await QRCode.toString(url, { type: 'svg', margin: 1, width: 120 });
					} catch (e) {
						this.log.debug(`QR code generation skipped for ${profile}: ${e.message}`);
					}
				}
			}
			const renderOptions = { urls: renderUrls, qrSvgs: renderQrSvgs };

			const htmlAll = this.htmlRenderer.renderAllHtml(docModel, renderOptions);
			const json = JSON.stringify(docModel, null, 2);

			this.log.info(`Documentation generation (${trigger}): 5/5 — writing files and updating states…`);
			await this.persistDocumentation(docModel, markdown, htmlAll, json, baseUrl);

			await this.versionTracker.storeCurrentVersion(docModel);

			const changelogEntry = this.versionTracker.buildChangelogEntry(version, changeData);
			await this.versionTracker.appendChangelog(changelogEntry);

			await this.notifier.send(docModel, changeData);

			this.log.info(`Documentation generated via ${trigger} (v${version}) - ${changeData.summary}`);
		} catch (error) {
			this.log.error(`Error generating documentation: ${error.message}`);
			throw error;
		} finally {
			this._documentationGenerationInProgress = false;
		}
	}

	/**
	 * Copy latest documentation from adapter files to a fixed filename (e.g. autodoc.md).
	 * Prefers content from `autodoc-latest.*` files; falls back to legacy full state only if not a metadata placeholder.
	 *
	 * @param {string} stateId State id suffix e.g. `documentation.markdown` (no namespace).
	 * @param {string} filename Target filename under the adapter file namespace.
	 */
	async downloadFile(stateId, filename) {
		const basePath = `${this.namespace}.files`;
		const sourceMap = {
			'documentation.markdown': 'autodoc-latest.md',
			'documentation.json': 'autodoc-latest.json',
			'documentation.html': 'autodoc-admin.html',
		};
		const sourceName = sourceMap[stateId];
		if (!sourceName) {
			this.log.warn(`Download: unknown state mapping for ${stateId}`);
			return;
		}
		try {
			let content = '';
			try {
				content = await this.readAdapterFileUtf8(basePath, sourceName);
			} catch (e) {
				this.log.debug(`readAdapterFileUtf8(${sourceName}): ${e.message}`);
			}
			if (!String(content || '').trim()) {
				const state = await this.getStateAsync(stateId);
				const sv = state && state.val != null ? String(state.val) : '';
				if (sv.startsWith('[AutoDoc]')) {
					// metadata-only placeholder
				} else if (stateId === 'documentation.json' && sv === DOCS_JSON_METADATA_PLACEHOLDER) {
					// metadata-only JSON placeholder
				} else if (sv) {
					content = sv;
				}
			}
			if (!String(content || '').trim()) {
				this.log.warn(`No content for download (${sourceName}). Generate documentation first.`);
				return;
			}
			await this.writeFileAsync(basePath, filename, String(content));
			this.log.info(`File ${filename} written to /files/${this.namespace}/${filename}`);
		} catch (error) {
			this.log.error(`Download failed for ${filename}: ${error.message}`);
		}
	}

	/**
	 * Is called if a subscribed state changes.
	 *
	 * @param {string} id State ID.
	 * @param {ioBroker.State | null | undefined} state State object.
	 */
	async onStateChange(id, state) {
		if (!state) {
			return;
		}

		if (id === `${this.namespace}.action.generate` && state.ack === false && state.val === true) {
			this.log.info('Manual generate command received');
			try {
				await this.generateDocumentation('manual');
			} catch (err) {
				this.log.error(`Manual generation failed: ${err.message}`);
			}
			await this.setStateAsync('action.generate', { val: false, ack: true });
			return;
		}

		if (id === `${this.namespace}.action.downloadMarkdown` && state.ack === false && state.val === true) {
			this.log.info('Manual markdown download command received');
			try {
				await this.downloadFile('documentation.markdown', 'autodoc.md');
			} catch (err) {
				this.log.error(`Markdown download failed: ${err.message}`);
			}
			await this.setStateAsync('action.downloadMarkdown', { val: false, ack: true });
			return;
		}

		if (id === `${this.namespace}.action.downloadJson` && state.ack === false && state.val === true) {
			this.log.info('Manual JSON download command received');
			try {
				await this.downloadFile('documentation.json', 'autodoc.json');
			} catch (err) {
				this.log.error(`JSON download failed: ${err.message}`);
			}
			await this.setStateAsync('action.downloadJson', { val: false, ack: true });
			return;
		}

		if (id === `${this.namespace}.action.downloadHtml` && state.ack === false && state.val === true) {
			this.log.info('Manual HTML download command received');
			try {
				await this.downloadFile('documentation.html', 'autodoc.html');
			} catch (err) {
				this.log.error(`HTML download failed: ${err.message}`);
			}
			await this.setStateAsync('action.downloadHtml', { val: false, ack: true });
		}
	}
	/**
	 * Handle sendTo messages — used by the "Generate now" button and external scripts.
	 *
	 * @param {object} obj Message object from ioBroker.
	 */
	async onMessage(obj) {
		if (!obj || typeof obj !== 'object' || !obj.command) {
			return;
		}

		if (obj.command === 'generateNow') {
			this.log.info('Generate-now requested via sendTo');
			if (obj.callback) {
				this.sendTo(obj.from, obj.command, { result: 'ok' }, obj.callback);
			}
			this.generateDocumentation('manual').catch(err => {
				this.log.error(`sendTo generate failed: ${err.message}`);
			});
			return;
		}

		if (obj.command === 'getStatus') {
			try {
				const lastGen = await this.getStateAsync('info.lastGeneration');
				const nextGen = await this.getStateAsync('info.nextGeneration');
				const lastTrigger = await this.getStateAsync('info.lastTrigger');
				const lastVal = lastGen && lastGen.val ? String(lastGen.val) : '';
				const nextVal = nextGen && nextGen.val ? String(nextGen.val) : '';
				const triggerVal = lastTrigger && lastTrigger.val ? String(lastTrigger.val) : '';
				const display = lastVal
					? `${lastVal}${triggerVal ? ` (${triggerVal})` : ''}${nextVal ? ` · Next: ${nextVal}` : ''}`
					: 'Not yet generated';
				if (obj.callback) {
					this.sendTo(obj.from, obj.command, display, obj.callback);
				}
			} catch {
				if (obj.callback) {
					this.sendTo(obj.from, obj.command, 'Error reading status', obj.callback);
				}
			}
		}
	}
}

if (require.main !== module) {
	/**
	 * @param {Partial<utils.AdapterOptions>} [options] Adapter options.
	 * @returns {Autodoc} Adapter instance.
	 */
	module.exports = options => new Autodoc(options);
} else {
	new Autodoc();
}
