'use strict';

/*
 * Created with @iobroker/create-adapter v3.1.2
 */

const utils = require('@iobroker/adapter-core');

class Autodoc extends utils.Adapter {
	/**
	 * @param {Partial<utils.AdapterOptions>} [options] Adapter options.
	 */
	constructor(options) {
		super({
			...options,
			name: 'autodoc',
		});

		this.on('ready', this.onReady.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		await this.createStates();
		await this.setStateAsync('info.connection', { val: false, ack: true });

		this.log.info('AutoDoc adapter starting');
		this.log.debug(`config projectName: ${this.config.projectName || ''}`);
		this.log.debug(`config targetSystem: ${this.config.targetSystem || ''}`);
		this.log.debug(`config autoGenerateOnStart: ${this.config.autoGenerateOnStart}`);
		this.log.debug(`config onlyEnabledInstances: ${this.config.onlyEnabledInstances}`);
		this.log.debug(`config hideInstanceDetailsInMarkdown: ${this.config.hideInstanceDetailsInMarkdown}`);
		this.log.debug(`config maxDocumentedInstances: ${this.config.maxDocumentedInstances}`);

		await this.subscribeStatesAsync('action.generate');

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
		await this.setObjectNotExistsAsync('action.generate', {
			type: 'state',
			common: {
				name: 'Generate documentation',
				type: 'boolean',
				role: 'button',
				read: false,
				write: true,
				def: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync('info.lastGeneration', {
			type: 'state',
			common: {
				name: 'Last generation timestamp',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			native: {},
		});

		await this.setObjectNotExistsAsync('info.lastTrigger', {
			type: 'state',
			common: {
				name: 'Last generation trigger',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			native: {},
		});

		await this.setObjectNotExistsAsync('info.summary', {
			type: 'state',
			common: {
				name: 'Documentation summary',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			native: {},
		});

		await this.setObjectNotExistsAsync('info.systemLanguage', {
			type: 'state',
			common: {
				name: 'System language',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			native: {},
		});

		await this.setObjectNotExistsAsync('info.instanceCount', {
			type: 'state',
			common: {
				name: 'Number of adapter instances',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
				def: 0,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync('info.enabledInstanceCount', {
			type: 'state',
			common: {
				name: 'Number of enabled adapter instances',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
				def: 0,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync('info.disabledInstanceCount', {
			type: 'state',
			common: {
				name: 'Number of disabled adapter instances',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
				def: 0,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync('info.instanceHosts', {
			type: 'state',
			common: {
				name: 'Instance host summary',
				type: 'string',
				role: 'json',
				read: true,
				write: false,
				def: '{}',
			},
			native: {},
		});

		await this.setObjectNotExistsAsync('info.hostName', {
			type: 'state',
			common: {
				name: 'Host name',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			native: {},
		});

		await this.setObjectNotExistsAsync('info.hostPlatform', {
			type: 'state',
			common: {
				name: 'Host platform',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			native: {},
		});

		await this.setObjectNotExistsAsync('info.hostVersion', {
			type: 'state',
			common: {
				name: 'Host version',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			native: {},
		});

		await this.setObjectNotExistsAsync('documentation.markdown', {
			type: 'state',
			common: {
				name: 'Generated markdown documentation',
				type: 'string',
				role: 'text',
				read: true,
				write: false,
				def: '',
			},
			native: {},
		});

		await this.setObjectNotExistsAsync('documentation.json', {
			type: 'state',
			common: {
				name: 'Generated JSON documentation',
				type: 'string',
				role: 'json',
				read: true,
				write: false,
				def: '{}',
			},
			native: {},
		});
	}

	/**
	 * Read selected system information from ioBroker.
	 *
	 * @returns {Promise<{language: string, country: string, city: string}>} Selected system information.
	 */
	async readSystemInfo() {
		try {
			const systemConfig = await this.getForeignObjectAsync('system.config');
			const common = systemConfig && systemConfig.common ? systemConfig.common : {};

			return {
				language: common.language || '',
				country: common.country || '',
				city: common.city || '',
			};
		} catch (error) {
			this.log.warn(`Could not read system.config: ${error.message}`);
			return {
				language: '',
				country: '',
				city: '',
			};
		}
	}

	/**
	 * Read this adapter instance object.
	 *
	 * @returns {Promise<ioBroker.InstanceObject | null>} Instance object.
	 */
	async readOwnInstanceObject() {
		try {
			const instanceObject = await this.getForeignObjectAsync(`system.adapter.${this.namespace}`);
			return instanceObject || null;
		} catch (error) {
			this.log.warn(`Could not read own instance object: ${error.message}`);
			return null;
		}
	}

	/**
	 * Read host information based on the current adapter instance.
	 *
	 * @returns {Promise<{id: string, name: string, hostname: string, platform: string, version: string}>} Host information.
	 */
	async readHostInfo() {
		try {
			const instanceObject = await this.readOwnInstanceObject();
			const hostId = instanceObject && instanceObject.common ? instanceObject.common.host : '';

			if (!hostId) {
				return {
					id: '',
					name: '',
					hostname: '',
					platform: '',
					version: '',
				};
			}

			const hostObject = await this.getForeignObjectAsync(hostId);
			const common = hostObject && hostObject.common ? hostObject.common : {};

			return {
				id: hostId,
				name: common.name || '',
				hostname: common.hostname || '',
				platform: common.platform || '',
				version: common.version || '',
			};
		} catch (error) {
			this.log.warn(`Could not read host information: ${error.message}`);
			return {
				id: '',
				name: '',
				hostname: '',
				platform: '',
				version: '',
			};
		}
	}

	/**
	 * Read available adapter instances from the object database.
	 *
	 * @returns {Promise<Array<{id: string, name: string, adapter: string, title: string, version: string, host: string, enabled: boolean}>>} Adapter instance list.
	 */
	async readAdapterInstances() {
		try {
			const result = await this.getObjectViewAsync('system', 'instance', {});
			const rows = Array.isArray(result && result.rows) ? result.rows : [];
			const adapterCache = {};
			const instances = [];

			for (const row of rows) {
				const obj = row && row.value ? row.value : null;
				if (!obj || !obj._id || !obj.common) {
					continue;
				}

				const instanceName = obj._id.replace('system.adapter.', '');
				const adapterName = obj.common.name || instanceName.split('.').slice(0, -1).join('.');

				if (!adapterCache[adapterName]) {
					try {
						adapterCache[adapterName] = await this.getForeignObjectAsync(`system.adapter.${adapterName}`);
					} catch {
						adapterCache[adapterName] = null;
					}
				}

				const adapterObject = adapterCache[adapterName];
				const adapterCommon = adapterObject && adapterObject.common ? adapterObject.common : {};

				instances.push({
					id: obj._id,
					name: instanceName,
					adapter: adapterName,
					title:
						adapterCommon.title || (adapterCommon.titleLang && adapterCommon.titleLang.en) || adapterName,
					version: adapterCommon.version || '',
					host: obj.common.host || '',
					enabled: !!obj.common.enabled,
				});
			}

			return instances.sort((a, b) => a.name.localeCompare(b.name));
		} catch (error) {
			this.log.warn(`Could not read adapter instances: ${error.message}`);
			return [];
		}
	}

	/**
	 * Build host summary for adapter instances.
	 *
	 * @param {Array<{id: string, name: string, adapter: string, title: string, version: string, host: string, enabled: boolean}>} adapterInstances Adapter instance list.
	 * @returns {{total: number, enabled: number, disabled: number, hosts: Array<{host: string, total: number, enabled: number, disabled: number}>}} Host summary.
	 */
	buildInstanceSummary(adapterInstances) {
		const summary = {
			total: adapterInstances.length,
			enabled: 0,
			disabled: 0,
			hosts: [],
		};

		const hostMap = {};

		for (const instance of adapterInstances) {
			if (instance.enabled) {
				summary.enabled++;
			} else {
				summary.disabled++;
			}

			const hostName = instance.host || 'unknown';

			if (!hostMap[hostName]) {
				hostMap[hostName] = {
					host: hostName,
					total: 0,
					enabled: 0,
					disabled: 0,
				};
			}

			hostMap[hostName].total++;

			if (instance.enabled) {
				hostMap[hostName].enabled++;
			} else {
				hostMap[hostName].disabled++;
			}
		}

		summary.hosts = Object.values(hostMap).sort((a, b) => a.host.localeCompare(b.host));
		return summary;
	}

	/**
	 * Build filter metadata from adapter configuration and current result set.
	 *
	 * @param {number} originalCount Number of instances before filtering and limiting.
	 * @param {number} resultCount Number of instances after filtering and limiting.
	 * @returns {{onlyEnabledInstances: boolean, hideInstanceDetailsInMarkdown: boolean, maxDocumentedInstances: number, originalInstanceCount: number, resultingInstanceCount: number, limited: boolean}} Filter metadata.
	 */
	buildFilterMetadata(originalCount, resultCount) {
		const maxDocumentedInstances = Number(this.config.maxDocumentedInstances) || 0;

		return {
			onlyEnabledInstances: !!this.config.onlyEnabledInstances,
			hideInstanceDetailsInMarkdown: !!this.config.hideInstanceDetailsInMarkdown,
			maxDocumentedInstances,
			originalInstanceCount: originalCount,
			resultingInstanceCount: resultCount,
			limited: maxDocumentedInstances > 0 && resultCount < originalCount,
		};
	}

	/**
	 * Build markdown documentation from adapter config and system data.
	 *
	 * @param {{language: string, country: string, city: string}} systemInfo Selected system information.
	 * @param {{id: string, name: string, hostname: string, platform: string, version: string}} hostInfo Host information.
	 * @param {Array<{id: string, name: string, title: string, version: string, host: string, enabled: boolean}>} adapterInstances Adapter instance list.
	 * @param {{total: number, enabled: number, disabled: number, hosts: Array<{host: string, total: number, enabled: number, disabled: number}>}} instanceSummary Instance summary.
	 * @param {{onlyEnabledInstances: boolean, hideInstanceDetailsInMarkdown: boolean, maxDocumentedInstances: number, originalInstanceCount: number, resultingInstanceCount: number, limited: boolean}} filterMetadata Filter metadata.
	 * @returns {string} Generated markdown documentation.
	 */
	buildMarkdown(systemInfo, hostInfo, adapterInstances, instanceSummary, filterMetadata) {
		const projectName = (this.config.projectName || '').trim() || 'Unnamed project';
		const targetSystem = (this.config.targetSystem || 'ioBroker').trim();
		const projectDescription = (this.config.projectDescription || '').trim() || 'No project description provided.';
		const additionalNotes = (this.config.additionalNotes || '').trim() || 'No additional notes provided.';
		const generatedAt = new Date().toISOString();

		const locationParts = [systemInfo.city, systemInfo.country].filter(Boolean);
		const location = locationParts.length ? locationParts.join(', ') : 'Not available';

		const hostSummaryLines = instanceSummary.hosts.length
			? instanceSummary.hosts
					.map(
						host =>
							`- ${host.host}: total=${host.total}, enabled=${host.enabled}, disabled=${host.disabled}`,
					)
					.join('\n')
			: '- No host summary available';

		const showInstanceDetails = !this.config.hideInstanceDetailsInMarkdown;

		const instanceLines = adapterInstances.length
			? adapterInstances
					.map(
						instance =>
							`- ${instance.name} | title: ${instance.title || 'n/a'} | version: ${instance.version || 'n/a'} | host: ${instance.host || 'n/a'} | ${instance.enabled ? 'enabled' : 'disabled'}`,
					)
					.join('\n')
			: '- No adapter instances found';

		const filterLines = [
			`- Only enabled instances: ${filterMetadata.onlyEnabledInstances ? 'yes' : 'no'}`,
			`- Hide instance details in markdown: ${filterMetadata.hideInstanceDetailsInMarkdown ? 'yes' : 'no'}`,
			`- Maximum documented instances: ${filterMetadata.maxDocumentedInstances > 0 ? filterMetadata.maxDocumentedInstances : 'unlimited'}`,
			`- Original instance count: ${filterMetadata.originalInstanceCount}`,
			`- Resulting instance count: ${filterMetadata.resultingInstanceCount}`,
			`- Result limited: ${filterMetadata.limited ? 'yes' : 'no'}`,
		].join('\n');

		return `# ${projectName}

## Overview
${projectDescription}

## Target system
${targetSystem}

## Additional notes
${additionalNotes}

## ioBroker system information
- Language: ${systemInfo.language || 'Not available'}
- Location: ${location}
- Adapter instances: ${instanceSummary.total}
- Enabled instances: ${instanceSummary.enabled}
- Disabled instances: ${instanceSummary.disabled}

## Instance host summary
${hostSummaryLines}

## Applied filters
${filterLines}

## Host information
- Host object: ${hostInfo.id || 'Not available'}
- Host name: ${hostInfo.hostname || hostInfo.name || 'Not available'}
- Platform: ${hostInfo.platform || 'Not available'}
- Version: ${hostInfo.version || 'Not available'}

${
	showInstanceDetails
		? `## Installed adapter instances
${instanceLines}

`
		: ''
}## Generated by
AutoDoc ioBroker adapter

## Generated at
${generatedAt}
`;
	}

	/**
	 * Build JSON documentation from adapter config and system data.
	 *
	 * @param {{language: string, country: string, city: string}} systemInfo Selected system information.
	 * @param {{id: string, name: string, hostname: string, platform: string, version: string}} hostInfo Host information.
	 * @param {Array<{id: string, name: string, title: string, version: string, host: string, enabled: boolean}>} adapterInstances Adapter instance list.
	 * @param {{total: number, enabled: number, disabled: number, hosts: Array<{host: string, total: number, enabled: number, disabled: number}>}} instanceSummary Instance summary.
	 * @param {{onlyEnabledInstances: boolean, hideInstanceDetailsInMarkdown: boolean, maxDocumentedInstances: number, originalInstanceCount: number, resultingInstanceCount: number, limited: boolean}} filterMetadata Filter metadata.
	 * @param {string} trigger Source that triggered the generation.
	 * @returns {string} Generated JSON documentation string.
	 */
	buildJsonDocumentation(systemInfo, hostInfo, adapterInstances, instanceSummary, filterMetadata, trigger) {
		const payload = {
			project: {
				name: (this.config.projectName || '').trim() || 'Unnamed project',
				description: (this.config.projectDescription || '').trim() || 'No project description provided.',
				targetSystem: (this.config.targetSystem || 'ioBroker').trim(),
				additionalNotes: (this.config.additionalNotes || '').trim() || 'No additional notes provided.',
			},
			ioBroker: {
				system: systemInfo,
				host: hostInfo,
				instanceSummary,
				instances: adapterInstances,
			},
			meta: {
				adapter: this.name,
				namespace: this.namespace,
				trigger,
				generatedAt: new Date().toISOString(),
				filters: filterMetadata,
			},
		};

		return JSON.stringify(payload, null, 2);
	}

	/**
	 * Generate and store documentation.
	 *
	 * @param {string} trigger Source that triggered the generation.
	 */
	async generateDocumentation(trigger) {
		const projectName = (this.config.projectName || '').trim() || 'Unnamed project';
		const systemInfo = await this.readSystemInfo();
		const hostInfo = await this.readHostInfo();
		const allAdapterInstances = await this.readAdapterInstances();

		const filteredInstances = this.config.onlyEnabledInstances
			? allAdapterInstances.filter(instance => instance.enabled)
			: allAdapterInstances;

		const maxInstances = Number(this.config.maxDocumentedInstances) || 0;
		const adapterInstances = maxInstances > 0 ? filteredInstances.slice(0, maxInstances) : filteredInstances;

		const instanceSummary = this.buildInstanceSummary(adapterInstances);
		const filterMetadata = this.buildFilterMetadata(allAdapterInstances.length, adapterInstances.length);
		const markdown = this.buildMarkdown(systemInfo, hostInfo, adapterInstances, instanceSummary, filterMetadata);
		const jsonDocumentation = this.buildJsonDocumentation(
			systemInfo,
			hostInfo,
			adapterInstances,
			instanceSummary,
			filterMetadata,
			trigger,
		);
		const timestamp = new Date().toISOString();

		let summary = `Documentation for "${projectName}" generated (${instanceSummary.total} instances, ${instanceSummary.enabled} enabled, ${instanceSummary.disabled} disabled`;

		if (this.config.onlyEnabledInstances) {
			summary += ', filtered: enabled only';
		}

		if (maxInstances > 0) {
			summary += `, limited to ${maxInstances}`;
		}

		summary += ')';

		await this.setStateAsync('documentation.markdown', { val: markdown, ack: true });
		await this.setStateAsync('documentation.json', { val: jsonDocumentation, ack: true });
		await this.setStateAsync('info.summary', { val: summary, ack: true });
		await this.setStateAsync('info.lastTrigger', { val: trigger, ack: true });
		await this.setStateAsync('info.lastGeneration', { val: timestamp, ack: true });
		await this.setStateAsync('info.systemLanguage', { val: systemInfo.language || '', ack: true });
		await this.setStateAsync('info.instanceCount', { val: instanceSummary.total, ack: true });
		await this.setStateAsync('info.enabledInstanceCount', { val: instanceSummary.enabled, ack: true });
		await this.setStateAsync('info.disabledInstanceCount', { val: instanceSummary.disabled, ack: true });
		await this.setStateAsync('info.instanceHosts', {
			val: JSON.stringify(instanceSummary.hosts, null, 2),
			ack: true,
		});
		await this.setStateAsync('info.hostName', { val: hostInfo.hostname || hostInfo.name || '', ack: true });
		await this.setStateAsync('info.hostPlatform', { val: hostInfo.platform || '', ack: true });
		await this.setStateAsync('info.hostVersion', { val: hostInfo.version || '', ack: true });

		this.log.info(`Documentation generated via ${trigger}`);
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
