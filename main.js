'use strict';
/*
 * Created with @iobroker/create-adapter v3.1.2
 */

const utils = require('@iobroker/adapter-core');

// Import modular components
const Discovery = require('./lib/discovery');
const DocumentModel = require('./lib/documentModel');
const MarkdownRenderer = require('./lib/markdownRenderer');

const PROFILE_ADMIN = 'admin';
const PROFILE_USER = 'user';
const PROFILE_ONBOARDING = 'onboarding';

const AVAILABLE_PROFILES = [PROFILE_ADMIN, PROFILE_USER, PROFILE_ONBOARDING];

const DOCUMENT_SCHEMA_VERSION = '1.0.0';

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
		this.markdownRenderer = new MarkdownRenderer(this);

		this.on('ready', this.onReady.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
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

		if (this.config.autoGenerateOnStart) {
			await this.generateDocumentation('startup');
		}

		await this.setStateAsync('info.connection', { val: true, ack: true });
		this.log.info('AutoDoc adapter started');
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances.
	 *
	 * @param {() => void} callback Function that finalizes adapter shutdown.
	 */
	onUnload(callback) {
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
			'documentation.lastMarkdownFile': {
				name: 'Last generated markdown filename',
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
	 * Resolve active target profile from config.
	 *
	 * @returns {string} Active profile.
	 */
	getActiveProfile() {
		const rawProfile = typeof this.config.profile === 'string' ? this.config.profile.trim() : '';

		return AVAILABLE_PROFILES.includes(rawProfile) ? rawProfile : PROFILE_ADMIN;
	}

	/**
	 * Create an empty initialized state summary.
	 *
	 * @returns {object} Empty initialized summary.
	 */
	createEmptyStateSummary() {
		return {
			total: 0,
			writable: 0,
			readonly: 0,
			readwrite: 0,
			writeonly: 0,
			roles: [],
			sampleStates: [],
		};
	}

	/**
	 * Read and summarize all state objects from the object database.
	 *
	 * @returns {Promise<object>} Collected state summary.
	 */
	async readStateObjectsSummary() {
		try {
			const result = await this.getObjectViewAsync('system', 'state', {});
			const rows = Array.isArray(result?.rows) ? result.rows : [];
			const summary = this.createEmptyStateSummary();
			const roleMap = {};

			for (const row of rows) {
				const obj = row?.value || null;
				if (!obj?._id || !obj.common) {
					continue;
				}

				const role = obj.common.role || 'undefined';
				const type = obj.common.type || 'mixed';
				const read = obj.common.read !== false;
				const write = obj.common.write === true;

				summary.total++;

				if (write) {
					summary.writable++;
				}

				if (read && !write) {
					summary.readonly++;
				} else if (read && write) {
					summary.readwrite++;
				} else if (!read && write) {
					summary.writeonly++;
				}

				roleMap[role] = (roleMap[role] || 0) + 1;

				if (summary.sampleStates.length < 10) {
					summary.sampleStates.push({
						id: obj._id,
						role,
						type,
						read,
						write,
					});
				}
			}

			summary.roles = Object.entries(roleMap)
				.map(([role, count]) => ({ role, count }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 10);

			return summary;
		} catch (error) {
			this.log.warn(`Could not read state objects summary: ${error.message}`);
			return this.createEmptyStateSummary();
		}
	}

	/**
	 * Determine a functional role for an adapter instance.
	 *
	 * @param {string} name Adapter short name.
	 * @returns {string} Functional role.
	 */
	detectAdapterRole(name) {
		const normalized = String(name || '').toLowerCase();

		if (['admin', 'javascript', 'vis', 'vis-2', 'web', 'lovelace'].includes(normalized)) {
			return 'visualization';
		}

		if (['mqtt', 'zigbee', 'zwave2', 'matter', 'shelly', 'sonoff', 'modbus'].includes(normalized)) {
			return 'communication';
		}

		if (['influxdb', 'history', 'sql', 'db2'].includes(normalized)) {
			return 'data';
		}

		if (['telegram', 'pushover', 'email', 'signal-cmb'].includes(normalized)) {
			return 'notification';
		}

		if (['alexa2', 'sayit', 'text2command'].includes(normalized)) {
			return 'voice';
		}

		if (['hm-rpc', 'hmip', 'heatingcontrol'].includes(normalized)) {
			return 'heating';
		}

		if (['radar2', 'tr-064', 'ical'].includes(normalized)) {
			return 'automation';
		}

		return 'general';
	}

	/**
	 * Determine functional domains for an adapter instance.
	 *
	 * @param {string} name Adapter short name.
	 * @returns {string[]} Related domains.
	 */
	detectAdapterDomains(name) {
		const normalized = String(name || '').toLowerCase();
		const domains = new Set();

		if (['zigbee', 'shelly', 'sonoff', 'mqtt', 'matter'].includes(normalized)) {
			domains.add('iot');
		}

		if (['hm-rpc', 'hmip', 'heatingcontrol'].includes(normalized)) {
			domains.add('heizung');
		}

		if (['influxdb', 'grafana', 'history'].includes(normalized)) {
			domains.add('monitoring');
		}

		if (['telegram', 'pushover', 'email'].includes(normalized)) {
			domains.add('benachrichtigung');
		}

		if (['radar2', 'ical'].includes(normalized)) {
			domains.add('anwesenheit');
		}

		if (['vis', 'vis-2', 'web', 'lovelace'].includes(normalized)) {
			domains.add('bedienung');
		}

		if (domains.size === 0) {
			domains.add('allgemein');
		}

		return [...domains];
	}

	/**
	 * Calculate a simple relevance score for an adapter.
	 *
	 * @param {string} role Functional role.
	 * @param {boolean} enabled Enabled state.
	 * @returns {number} Relevance score.
	 */
	calculateRelevanceScore(role, enabled) {
		const baseByRole = {
			visualization: 90,
			communication: 90,
			data: 75,
			notification: 70,
			voice: 65,
			heating: 80,
			automation: 85,
			general: 50,
		};

		const base = baseByRole[role] || 50;
		return enabled ? base : Math.max(10, base - 25);
	}

	/**
	 * Read and normalize adapter instances.
	 *
	 * @returns {Promise<object[]>} Normalized adapter instances.
	 */
	async readAdapterInstances() {
		try {
			const instanceView = await this.getObjectViewAsync('system', 'instance', {});
			const rows = Array.isArray(instanceView?.rows) ? instanceView.rows : [];

			return rows
				.map(row => row?.value || null)
				.filter(obj => obj?._id && obj.common)
				.map(obj => {
					const name = obj.common.name || '';
					const role = this.detectAdapterRole(name);

					return {
						id: obj._id,
						name,
						title:
							typeof obj.common.titleLang === 'object' && typeof obj.common.titleLang?.en === 'string'
								? obj.common.titleLang.en
								: obj.common.title || name || obj._id,
						version: obj.common.version || 'unknown',
						enabled: obj.common.enabled === true,
						mode: obj.common.mode || 'daemon',
						host: obj.common.host || 'unknown',
						role,
						relevanceScore: this.calculateRelevanceScore(role, obj.common.enabled === true),
						purpose: `Adapter ${name || obj._id} unterstützt die Rolle ${role}.`,
						domains: this.detectAdapterDomains(name),
					};
				});
		} catch (error) {
			this.log.warn(`Could not read adapter instances: ${error.message}`);
			return [];
		}
	}

	/**
	 * Read normalized system metadata.
	 *
	 * @returns {Promise<object>} Normalized system metadata.
	 */
	async readSystemMeta() {
		let language = 'unknown';
		let hostName = this.host || 'unknown';
		let hostPlatform = 'unknown';
		let hostVersion = 'unknown';

		try {
			const systemConfig = await this.getForeignObjectAsync('system.config');
			if (systemConfig?.common?.language) {
				language = systemConfig.common.language;
			}
		} catch (error) {
			this.log.warn(`Could not read system.config: ${error.message}`);
		}

		try {
			const hostObject = await this.getForeignObjectAsync(`system.host.${this.host}`);
			if (hostObject?.common) {
				hostName = hostObject.common.hostname || hostObject.common.name || this.host || 'unknown';
				hostPlatform = hostObject.common.platform || hostObject.common.os || 'unknown';
				hostVersion = hostObject.common.installedVersion || hostObject.common.version || 'unknown';
			}
		} catch (error) {
			this.log.warn(`Could not read host information: ${error.message}`);
		}

		return {
			language,
			hostName,
			hostPlatform,
			hostVersion,
		};
	}

	/**
	 * Build chapter definitions for the active profile.
	 *
	 * @param {string} profile Active profile.
	 * @returns {Array<object>} Chapter definitions.
	 */
	buildChapters(profile) {
		const base = [
			{
				id: 'project-overview',
				title: 'Projektüberblick',
				audiences: AVAILABLE_PROFILES,
				summary: 'Projektname, Zielsystem, Kurzbeschreibung und Zusatzhinweise.',
				items: ['Projektname', 'Zielsystem', 'Kurzbeschreibung', 'Zusatzhinweise'],
			},
			{
				id: 'system-setup',
				title: 'Systemaufbau',
				audiences: [PROFILE_ADMIN, PROFILE_ONBOARDING],
				summary: 'Hosts, Kernkomponenten, Plattform und Grundstruktur.',
				items: ['Hosts', 'Versionen', 'Kernkomponenten'],
			},
			{
				id: 'important-adapters',
				title: 'Wichtige Adapter und Dienste',
				audiences: [PROFILE_ADMIN, PROFILE_USER, PROFILE_ONBOARDING],
				summary: 'Priorisierte Adapter statt vollständiger Rohdatenliste.',
				items: ['Top-Adapter', 'Rollen', 'Hosts', 'Bedeutung'],
			},
			{
				id: 'daily-use',
				title: 'Bedienung im Alltag',
				audiences: [PROFILE_USER, PROFILE_ONBOARDING],
				summary: 'Alltagssicht für Nutzer und neue Anwender.',
				items: ['Panels', 'Sprachsteuerung', 'Licht', 'Heizung'],
			},
			{
				id: 'maintenance',
				title: 'Wartung und Adminwissen',
				audiences: [PROFILE_ADMIN],
				summary: 'Technische Hinweise für Betrieb, Backup und Fehlersuche.',
				items: ['kritische Adapter', 'Hosts', 'Backup', 'Fehlersuche'],
			},
			{
				id: 'troubleshooting',
				title: 'Troubleshooting',
				audiences: [PROFILE_ADMIN, PROFILE_ONBOARDING],
				summary: 'Bekannte Hinweise und erste Prüfpunkte.',
				items: ['bekannte Probleme', 'Prüfpunkte', 'Zuständigkeiten'],
			},
			{
				id: 'appendix',
				title: 'Anhang',
				audiences: [PROFILE_ADMIN],
				summary: 'Technische Detaildaten und Zusammenfassungen.',
				items: ['State-Summary', 'Adapterdetails'],
			},
		];

		return base.filter(chapter => chapter.audiences.includes(profile));
	}

	/**
	 * Build domain summaries from adapters.
	 *
	 * @param {object[]} adapters Normalized adapters.
	 * @returns {Array<object>} Domain summaries.
	 */
	buildDomains(adapters) {
		const domainMap = new Map();

		for (const adapter of adapters) {
			for (const domainId of adapter.domains) {
				if (!domainMap.has(domainId)) {
					domainMap.set(domainId, {
						id: domainId,
						title: domainId.charAt(0).toUpperCase() + domainId.slice(1),
						description: `Automatisch erkannter Funktionsbereich ${domainId}.`,
						relatedAdapters: [],
					});
				}

				domainMap.get(domainId).relatedAdapters.push(adapter.id);
			}
		}

		return [...domainMap.values()].sort((a, b) => a.title.localeCompare(b.title));
	}

	/**
	 * Build manual context structure from current config.
	 *
	 * @returns {object} Manual context block.
	 */
	buildManualContext() {
		const note = (this.config.additionalNotes || '').trim();

		return {
			rooms: [],
			guestInfo: note ? [note] : [],
			familyInfo: note ? [note] : [],
			adminInfo: note ? [note] : [],
			onboardingInfo: note ? [note] : [],
			knownIssues: [],
		};
	}

	/**
	 * Build the canonical documentation model from raw data and config.
	 *
	 * @param {object} rawData Raw discovery data.
	 * @param {string} trigger Generation trigger.
	 * @returns {Promise<object>} Structured documentation model.
	 */
	async buildDocumentModel(rawData, trigger) {
		const generatedAt = new Date().toISOString();
		const adapterVersion = this.version || 'unknown';
		const profile = this.getActiveProfile();
		const projectName = (this.config.projectName || '').trim() || 'Unnamed project';
		const targetSystem = (this.config.targetSystem || 'ioBroker').trim();
		const projectDescription = (this.config.projectDescription || '').trim() || 'No project description provided.';
		const additionalNotes = (this.config.additionalNotes || '').trim() || 'No additional notes provided.';
		const onlyEnabledInstances = this.config.onlyEnabledInstances === true;
		const hideInstanceDetailsInMarkdown = this.config.hideInstanceDetailsInMarkdown === true;
		const maxDocumentedInstances = Number(this.config.maxDocumentedInstances || 0);

		let adapters = [...rawData.adapterInstances];

		if (onlyEnabledInstances) {
			adapters = adapters.filter(adapter => adapter.enabled);
		}

		if (maxDocumentedInstances > 0) {
			adapters = adapters.slice(0, maxDocumentedInstances);
		}

		const enabledInstanceCount = adapters.filter(adapter => adapter.enabled).length;
		const disabledInstanceCount = adapters.filter(adapter => !adapter.enabled).length;

		const hostMap = new Map();

		for (const adapter of adapters) {
			if (!hostMap.has(adapter.host)) {
				hostMap.set(adapter.host, {
					id: `system.host.${adapter.host}`,
					name: adapter.host,
					platform:
						adapter.host === rawData.systemMeta.hostName ? rawData.systemMeta.hostPlatform : 'unknown',
					version: adapter.host === rawData.systemMeta.hostName ? rawData.systemMeta.hostVersion : 'unknown',
					runtimeContext: 'ioBroker',
					adapterCount: 0,
				});
			}

			hostMap.get(adapter.host).adapterCount++;
		}

		return {
			schemaVersion: DOCUMENT_SCHEMA_VERSION,
			meta: {
				generatedAt,
				adapterVersion,
				trigger,
				profile,
				language: rawData.systemMeta.language || 'unknown',
				targetFormat: 'json',
			},
			project: {
				name: projectName,
				targetSystem,
				description: projectDescription,
				additionalNotes,
				responsibilities: [],
			},
			system: {
				hosts: [...hostMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
				statistics: {
					instanceCount: adapters.length,
					enabledInstanceCount,
					disabledInstanceCount,
					totalStateObjects: rawData.stateSummary.total,
					writableStateObjects: rawData.stateSummary.writable,
					readonlyStateObjects: rawData.stateSummary.readonly,
				},
				coreComponents: ['ioBroker'],
				language: rawData.systemMeta.language,
				primaryHost: {
					name: rawData.systemMeta.hostName,
					platform: rawData.systemMeta.hostPlatform,
					version: rawData.systemMeta.hostVersion,
				},
			},
			adapters,
			domains: this.buildDomains(adapters),
			manualContext: this.buildManualContext(),
			profiles: {
				active: profile,
				available: AVAILABLE_PROFILES,
			},
			chapters: this.buildChapters(profile),
			appendices: {
				stateSummary: rawData.stateSummary,
			},
			filters: {
				onlyEnabledInstances,
				hideInstanceDetailsInMarkdown,
				maxDocumentedInstances,
			},
		};
	}

	/**
	 * Render markdown from the canonical documentation model.
	 *
	 * @param {object} docModel Structured documentation model.
	 * @returns {string} Markdown output.
	 */
	renderMarkdown(docModel) {
		const { project, meta, system, adapters, appendices, filters, domains, chapters, manualContext } = docModel;

		const stateSummary = appendices.stateSummary;

		const writablePercent =
			stateSummary.total > 0 ? ((stateSummary.writable / stateSummary.total) * 100).toFixed(1) : '0.0';

		const readonlyPercent =
			stateSummary.total > 0 ? ((stateSummary.readonly / stateSummary.total) * 100).toFixed(1) : '0.0';

		const markdownLines = [
			`# ${project.name}`,
			'',
			'## Projektüberblick',
			project.description,
			'',
			'## Zielsystem',
			project.targetSystem,
			'',
			'## Zusätzliche Hinweise',
			project.additionalNotes,
			'',
			'## Generierung',
			`- Schema-Version: ${docModel.schemaVersion}`,
			`- Adapter-Version: ${meta.adapterVersion}`,
			`- Generiert am: ${meta.generatedAt}`,
			`- Trigger: ${meta.trigger}`,
			`- Profil: ${meta.profile}`,
			`- Sprache: ${meta.language}`,
			'',
			'## Kapitel',
		];

		for (const chapter of chapters) {
			markdownLines.push(`- ${chapter.title}: ${chapter.summary}`);
		}

		markdownLines.push('');
		markdownLines.push('## Systeminformationen');
		markdownLines.push(`- Systemsprache: ${system.language || 'unbekannt'}`);
		markdownLines.push(`- Primärer Host: ${system.primaryHost.name || 'unbekannt'}`);
		markdownLines.push(`- Plattform: ${system.primaryHost.platform || 'unbekannt'}`);
		markdownLines.push(`- Version: ${system.primaryHost.version || 'unbekannt'}`);

		markdownLines.push('');
		markdownLines.push('## Verwendete Filter');
		markdownLines.push(`- Nur aktivierte Instanzen dokumentieren: ${filters.onlyEnabledInstances ? 'ja' : 'nein'}`);
		markdownLines.push(
			`- Instanzdetails im Markdown ausblenden: ${filters.hideInstanceDetailsInMarkdown ? 'ja' : 'nein'}`,
		);
		markdownLines.push(
			`- Maximale Anzahl dokumentierter Instanzen: ${
				filters.maxDocumentedInstances > 0 ? filters.maxDocumentedInstances : 'unbegrenzt'
			}`,
		);

		markdownLines.push('');
		markdownLines.push('## Instanzübersicht');
		markdownLines.push(`- Dokumentierte Instanzen: ${system.statistics.instanceCount}`);
		markdownLines.push(`- Aktivierte Instanzen: ${system.statistics.enabledInstanceCount}`);
		markdownLines.push(`- Deaktivierte Instanzen: ${system.statistics.disabledInstanceCount}`);

		markdownLines.push('');
		markdownLines.push('## Hosts');

		if (system.hosts.length === 0) {
			markdownLines.push('- Keine Hosts erkannt');
		} else {
			for (const host of system.hosts) {
				markdownLines.push(
					`- ${host.name}: Adapter=${host.adapterCount}, Plattform=${host.platform}, Version=${host.version}`,
				);
			}
		}

		markdownLines.push('');
		markdownLines.push('## Funktionsbereiche');

		if (domains.length === 0) {
			markdownLines.push('- Keine Funktionsbereiche erkannt');
		} else {
			for (const domain of domains) {
				markdownLines.push(`- ${domain.title}: ${domain.relatedAdapters.length} Adapter`);
			}
		}

		markdownLines.push('');
		markdownLines.push('## State-Objekt-Zusammenfassung');
		markdownLines.push(`- Gesamtzahl der State-Objekte: ${stateSummary.total}`);
		markdownLines.push(`- Schreibbare State-Objekte: ${stateSummary.writable} (${writablePercent} %)`);
		markdownLines.push(`- Nur lesbare State-Objekte: ${stateSummary.readonly} (${readonlyPercent} %)`);
		markdownLines.push(`- Lese-/schreibbare State-Objekte: ${stateSummary.readwrite}`);
		markdownLines.push(`- Nur schreibbare State-Objekte: ${stateSummary.writeonly}`);

		markdownLines.push('');
		markdownLines.push('## Häufigste State-Rollen');

		if (stateSummary.roles.length === 0) {
			markdownLines.push('- Keine State-Rollen gefunden');
		} else {
			for (const entry of stateSummary.roles) {
				markdownLines.push(`- ${entry.role}: ${entry.count}`);
			}
		}

		if (!filters.hideInstanceDetailsInMarkdown) {
			markdownLines.push('');
			markdownLines.push('## Dokumentierte Adapter-Instanzen');

			if (adapters.length === 0) {
				markdownLines.push('- Keine Instanzen gefunden');
			} else {
				for (const adapter of adapters) {
					markdownLines.push(`- ${adapter.id}`);
					markdownLines.push(`  - Titel: ${adapter.title}`);
					markdownLines.push(`  - Name: ${adapter.name}`);
					markdownLines.push(`  - Version: ${adapter.version}`);
					markdownLines.push(`  - Host: ${adapter.host}`);
					markdownLines.push(`  - Aktiviert: ${adapter.enabled ? 'ja' : 'nein'}`);
					markdownLines.push(`  - Modus: ${adapter.mode}`);
					markdownLines.push(`  - Rolle: ${adapter.role}`);
					markdownLines.push(`  - Relevanz: ${adapter.relevanceScore}`);
					markdownLines.push(`  - Zweck: ${adapter.purpose}`);
				}
			}
		}

		markdownLines.push('');
		markdownLines.push('## Manueller Kontext');
		markdownLines.push(`- Admin-Hinweise: ${manualContext.adminInfo.join(' | ') || 'keine'}`);
		markdownLines.push(`- Familie-Hinweise: ${manualContext.familyInfo.join(' | ') || 'keine'}`);
		markdownLines.push(`- Gäste-Hinweise: ${manualContext.guestInfo.join(' | ') || 'keine'}`);
		markdownLines.push(`- Onboarding-Hinweise: ${manualContext.onboardingInfo.join(' | ') || 'keine'}`);

		markdownLines.push('');
		markdownLines.push('## Beispielhafte State-Objekte');
		markdownLines.push(
			'Dieser Abschnitt zeigt eine kleine Auswahl erkannter State-Objekte zur schnellen Orientierung.',
		);

		if (stateSummary.sampleStates.length === 0) {
			markdownLines.push('- Keine Beispiel-States verfügbar');
		} else {
			for (const sample of stateSummary.sampleStates) {
				markdownLines.push(`- ${sample.id}`);
				markdownLines.push(`  - Rolle: ${sample.role}`);
				markdownLines.push(`  - Typ: ${sample.type}`);
				markdownLines.push(`  - Lesen: ${sample.read ? 'ja' : 'nein'}`);
				markdownLines.push(`  - Schreiben: ${sample.write ? 'ja' : 'nein'}`);
			}
		}

		return markdownLines.join('\n');
	}

	/**
	 * Render JSON from the canonical documentation model.
	 *
	 * @param {object} docModel Structured documentation model.
	 * @returns {string} JSON output.
	 */
	renderJson(docModel) {
		return JSON.stringify(docModel, null, 2);
	}

	/**
	 * Build human readable summary string.
	 *
	 * @param {object} docModel Structured documentation model.
	 * @returns {string} Summary string.
	 */
	buildSummary(docModel) {
		const stateSummary = docModel.appendices.stateSummary;

		return `Dokumentation für "${docModel.project.name}" erzeugt: ${docModel.system.statistics.instanceCount} Instanzen, ${docModel.system.statistics.enabledInstanceCount} aktiviert, ${docModel.system.statistics.disabledInstanceCount} deaktiviert, ${stateSummary.total} State-Objekte (${stateSummary.writable} schreibbar, ${stateSummary.readonly} nur lesbar).`;
	}

	/**
	 * Persist generated documentation and info states.
	 *
	 * @param {object} docModel Structured documentation model.
	 * @param {string} markdown Markdown output.
	 * @param {string} json JSON output.
	 * @returns {Promise<void>} Promise that resolves when states are written.
	 */
	async persistDocumentation(docModel, markdown, json) {
		try {
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const basePath = `${this.namespace}.files`;

			// Save Markdown file directly
			const markdownFilename = `autodoc-${timestamp}.md`;
			await this.writeFileAsync(basePath, markdownFilename, markdown);
			this.log.info(`Markdown documentation saved to /files/${this.namespace}/${markdownFilename}`);

			// Save JSON file directly
			const jsonFilename = `autodoc-${timestamp}.json`;
			await this.writeFileAsync(basePath, jsonFilename, json);
			this.log.info(`JSON documentation saved to /files/${this.namespace}/${jsonFilename}`);

			// Update info states (keep metadata as states for quick access)
			const summary = this.buildSummary(docModel);
			const stateSummaryJson = JSON.stringify(docModel.appendices.stateSummary, null, 2);
			const hostSummaryJson = JSON.stringify(docModel.system.hosts, null, 2);

			await this.setStateAsync('documentation.lastMarkdownFile', { val: markdownFilename, ack: true });
			await this.setStateAsync('documentation.lastJsonFile', { val: jsonFilename, ack: true });
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

			// Use modular markdown rendering
			const markdown = this.markdownRenderer.renderMarkdown(docModel);

			// Create JSON representation
			const json = JSON.stringify(docModel, null, 2);

			// Persist documentation (now saves to files directly)
			await this.persistDocumentation(docModel, markdown, json);

			this.log.info(`Documentation generated via ${trigger}`);
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
