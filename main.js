'use strict';
/*
 * Created with @iobroker/create-adapter v3.1.2
 */

const utils = require('@iobroker/adapter-core');

// Import modular components
const Discovery = require('./lib/discovery');
const DocumentModel = require('./lib/documentModel');
const MarkdownRenderer = require('./lib/markdownRenderer');
const HtmlRenderer = require('./lib/htmlRenderer');
const I18n = require('./lib/i18n');
const VersionTracker = require('./lib/versionTracker');

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

		// Timer for periodic auto-generation
		this.autoGenerateInterval = null;

		// Debounce timer for event-based generation
		this.eventGenerateDebounce = null;

		this.on('ready', this.onReady.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		this.on('objectChange', this.onObjectChange.bind(this));
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

		if (this.config.autoGenerateOnStart) {
			await this.generateDocumentation('startup');
		}

		// Setup periodic auto-generation if interval is configured
		if (this.config.autoGenerateInterval && this.config.autoGenerateInterval > 0) {
			const intervalMs = this.config.autoGenerateInterval * 60 * 60 * 1000; // Convert hours to milliseconds
			this.log.info(
				`Setting up automatic documentation generation every ${this.config.autoGenerateInterval} hours`,
			);
			this.autoGenerateInterval = setInterval(async () => {
				this.log.debug('Auto-generating documentation on schedule');
				try {
					await this.generateDocumentation('scheduled');
				} catch (error) {
					this.log.error(`Scheduled documentation generation failed: ${error.message}`);
				}
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
			'info.lastGeneration': {
				name: 'Last generation timestamp',
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
				common,
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
	 * Persist generated documentation and info states.
	 *
	 * @param {object} docModel Structured documentation model.
	 * @param {string} markdown Markdown output.
	 * @param {string} html HTML output.
	 * @param {string} json JSON output.
	 * @returns {Promise<void>} Promise that resolves when states are written.
	 */
	async persistDocumentation(docModel, markdown, html, json) {
		try {
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const basePath = `${this.namespace}.files`;

			// Save Markdown file
			const markdownFilename = `autodoc-${timestamp}.md`;
			await this.writeFileAsync(basePath, markdownFilename, markdown);
			this.log.info(`Markdown documentation saved to /files/${this.namespace}/${markdownFilename}`);

			// Save HTML file
			const htmlFilename = `autodoc-${timestamp}.html`;
			await this.writeFileAsync(basePath, htmlFilename, html);
			this.log.info(`HTML documentation saved to /files/${this.namespace}/${htmlFilename}`);

			// Save JSON file
			const jsonFilename = `autodoc-${timestamp}.json`;
			await this.writeFileAsync(basePath, jsonFilename, json);
			this.log.info(`JSON documentation saved to /files/${this.namespace}/${jsonFilename}`);

			// Update info states (keep metadata as states for quick access)
			const summary = this.buildSummary(docModel);
			const stateSummaryJson = JSON.stringify(docModel.appendices.stateSummary, null, 2);
			const hostSummaryJson = JSON.stringify(docModel.system.hosts, null, 2);

			await this.setStateAsync('documentation.lastMarkdownFile', { val: markdownFilename, ack: true });
			await this.setStateAsync('documentation.lastHtmlFile', { val: htmlFilename, ack: true });
			await this.setStateAsync('documentation.lastJsonFile', { val: jsonFilename, ack: true });
			await this.setStateAsync('documentation.markdown', { val: markdown, ack: true });
			await this.setStateAsync('documentation.html', { val: html, ack: true });
			await this.setStateAsync('documentation.json', { val: json, ack: true });
			await this.setStateAsync('documentation.stateSummary', { val: stateSummaryJson, ack: true });

			await this.setStateAsync('info.summary', { val: summary, ack: true });
			await this.setStateAsync('info.lastTrigger', { val: docModel.meta.trigger, ack: true });
			await this.setStateAsync('info.lastGeneration', { val: docModel.meta.generatedAt, ack: true });
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
	 * Generate and store documentation.
	 *
	 * @param {string} trigger Generation trigger source.
	 */
	async generateDocumentation(trigger) {
		try {
			// Use modular discovery
			const rawData = await this.discovery.collectRawData();

			// Use modular document model building
			const docModel = await this.documentModel.buildDocumentModel(rawData, trigger);

			// Generate version for this documentation
			const version = this.versionTracker.generateVersion();
			docModel.meta.version = version;

			// Version tracking: Compare with previous version
			const previousDocModel = await this.versionTracker.getPreviousVersion();
			const changeData = this.versionTracker.compareVersions(docModel, previousDocModel);

			// Use modular markdown rendering
			const markdown = this.markdownRenderer.renderMarkdown(docModel);

			// Use modular HTML rendering
			const html = this.htmlRenderer.renderHtml(docModel);

			// Create JSON representation
			const json = JSON.stringify(docModel, null, 2);

			// Persist documentation (saves to files directly)
			await this.persistDocumentation(docModel, markdown, html, json);

			// Store current version for next comparison
			await this.versionTracker.storeCurrentVersion(docModel);

			// Add changelog entry
			const changelogEntry = this.versionTracker.buildChangelogEntry(version, changeData);
			await this.versionTracker.appendChangelog(changelogEntry);

			this.log.info(`Documentation generated via ${trigger} (v${version}) - ${changeData.summary}`);
		} catch (error) {
			this.log.error(`Error generating documentation: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Write file content to the ioBroker file storage.
	 *
	 * @param {string} stateId State ID containing the content.
	 * @param {string} filename Target filename.
	 */
	async downloadFile(stateId, filename) {
		try {
			const state = await this.getStateAsync(stateId);

			if (!state || state.val === null || state.val === undefined || state.val === '') {
				this.log.warn(`No content available for download from state ${stateId}`);
				return;
			}

			await this.writeFileAsync(`${this.namespace}.files`, filename, String(state.val));
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
			await this.generateDocumentation('manual');
			await this.setStateAsync('action.generate', { val: false, ack: true });
			return;
		}

		if (id === `${this.namespace}.action.downloadMarkdown` && state.ack === false && state.val === true) {
			this.log.info('Manual markdown download command received');
			await this.downloadFile('documentation.markdown', 'autodoc.md');
			await this.setStateAsync('action.downloadMarkdown', { val: false, ack: true });
			return;
		}

		if (id === `${this.namespace}.action.downloadJson` && state.ack === false && state.val === true) {
			this.log.info('Manual JSON download command received');
			await this.downloadFile('documentation.json', 'autodoc.json');
			await this.setStateAsync('action.downloadJson', { val: false, ack: true });
			return;
		}

		if (id === `${this.namespace}.action.downloadHtml` && state.ack === false && state.val === true) {
			this.log.info('Manual HTML download command received');
			await this.downloadFile('documentation.html', 'autodoc.html');
			await this.setStateAsync('action.downloadHtml', { val: false, ack: true });
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
