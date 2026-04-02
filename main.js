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

		await this.setObjectNotExistsAsync('info.totalStateObjects', {
			type: 'state',
			common: {
				name: 'Total number of detected state objects',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
				def: 0,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync('info.writableStateObjects', {
			type: 'state',
			common: {
				name: 'Number of writable state objects',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
				def: 0,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync('info.readonlyStateObjects', {
			type: 'state',
			common: {
				name: 'Number of read-only state objects',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
				def: 0,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync('documentation.stateSummary', {
			type: 'state',
			common: {
				name: 'Generated state object summary',
				type: 'string',
				role: 'json',
				read: true,
				write: false,
				def: '{}',
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
     * Read and summarize all state objects from the object database.
     *
     * @returns {Promise<{
     *   total: number,
     *   writable: number,
     *   readonly: number,
     *   readwrite: number,
     *   writeonly: number,
     *   roles: Array<{role: string, count: number}>,
     *   sampleStates: Array<{id: string, role: string, type: string, read: boolean, write: boolean}>
     * }>} State object summary.
     */
    async readStateObjectsSummary() {
        try {
            const result = await this.getObjectViewAsync('system', 'state', {});
            const rows = Array.isArray(result && result.rows) ? result.rows : [];

            const summary = {
                total: 0,
                writable: 0,
                readonly: 0,
                readwrite: 0,
                writeonly: 0,
                roles: [],
                sampleStates: [],
            };

            const roleMap = {};

            for (const row of rows) {
                const obj = row && row.value ? row.value : null;
                if (!obj || !obj._id || !obj.common) {
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
	 * @param {string} trigger
	 */
	async generateDocumentation(trigger) {
			const projectName = (this.config.projectName || '').trim() || 'Unnamed project';
			const targetSystem = (this.config.targetSystem || 'ioBroker').trim();
			const projectDescription = (this.config.projectDescription || '').trim() || 'No project description provided.';
			const additionalNotes = (this.config.additionalNotes || '').trim() || 'No additional notes provided.';
			const generatedAt = new Date().toISOString();

			const onlyEnabledInstances = this.config.onlyEnabledInstances === true;
			const hideInstanceDetailsInMarkdown = this.config.hideInstanceDetailsInMarkdown === true;
			const maxDocumentedInstances = Number(this.config.maxDocumentedInstances || 0);

			let systemLanguage = 'unknown';
			let hostName = this.host || 'unknown';
			let hostPlatform = 'unknown';
			let hostVersion = 'unknown';

			try {
					const systemConfig = await this.getForeignObjectAsync('system.config');
					if (systemConfig && systemConfig.common && systemConfig.common.language) {
							systemLanguage = systemConfig.common.language;
					}
			} catch (error) {
					this.log.warn(`Could not read system.config: ${error.message}`);
			}

			try {
					const hostObject = await this.getForeignObjectAsync(`system.host.${this.host}`);
					if (hostObject && hostObject.common) {
							hostName = hostObject.common.name || hostName;
							hostPlatform = hostObject.common.platform || 'unknown';
							hostVersion = hostObject.common.installedVersion || hostObject.common.version || 'unknown';
					}
			} catch (error) {
					this.log.warn(`Could not read host information: ${error.message}`);
			}

			let instanceRows = [];
			try {
					const instanceView = await this.getObjectViewAsync('system', 'instance', {});
					instanceRows = Array.isArray(instanceView && instanceView.rows) ? instanceView.rows : [];
			} catch (error) {
					this.log.warn(`Could not read adapter instances: ${error.message}`);
			}

			const allInstances = instanceRows
					.map(row => row && row.value ? row.value : null)
					.filter(obj => obj && obj._id && obj.common)
					.map(obj => ({
							id: obj._id,
							name: obj.common.name || '',
							title: obj.common.titleLang?.en || obj.common.title || obj.common.name || obj._id,
							version: obj.common.version || 'unknown',
							enabled: obj.common.enabled === true,
							mode: obj.common.mode || 'daemon',
							host: obj.common.host || 'unknown',
					}));

			let documentedInstances = [...allInstances];

			if (onlyEnabledInstances) {
					documentedInstances = documentedInstances.filter(instance => instance.enabled);
			}

			if (maxDocumentedInstances > 0) {
					documentedInstances = documentedInstances.slice(0, maxDocumentedInstances);
			}

			const enabledInstanceCount = documentedInstances.filter(instance => instance.enabled).length;
			const disabledInstanceCount = documentedInstances.filter(instance => !instance.enabled).length;

			const instanceHostsMap = {};
			for (const instance of documentedInstances) {
					if (!instanceHostsMap[instance.host]) {
							instanceHostsMap[instance.host] = {
									total: 0,
									enabled: 0,
									disabled: 0,
							};
					}

					instanceHostsMap[instance.host].total++;

					if (instance.enabled) {
							instanceHostsMap[instance.host].enabled++;
					} else {
							instanceHostsMap[instance.host].disabled++;
					}
			}

			const stateSummary = await this.readStateObjectsSummary();

			const filterSummary = {
					onlyEnabledInstances,
					hideInstanceDetailsInMarkdown,
					maxDocumentedInstances,
			};

			const markdownLines = [
					`# ${projectName}`,
					'',
					'## Overview',
					projectDescription,
					'',
					'## Target system',
					targetSystem,
					'',
					'## Additional notes',
					additionalNotes,
					'',
					'## Generated by',
					'AutoDoc ioBroker adapter',
					'',
					'## Generated at',
					generatedAt,
					'',
					'## System information',
					`- Language: ${systemLanguage}`,
					`- Host name: ${hostName}`,
					`- Host platform: ${hostPlatform}`,
					`- Host version: ${hostVersion}`,
					'',
					'## Applied filters',
					`- Only enabled instances: ${onlyEnabledInstances}`,
					`- Hide instance details in markdown: ${hideInstanceDetailsInMarkdown}`,
					`- Maximum documented instances: ${maxDocumentedInstances}`,
					'',
					'## Instance summary',
					`- Documented instances: ${documentedInstances.length}`,
					`- Enabled instances: ${enabledInstanceCount}`,
					`- Disabled instances: ${disabledInstanceCount}`,
					'',
					'## Instance hosts',
			];

			const sortedHosts = Object.entries(instanceHostsMap).sort((a, b) => a[0].localeCompare(b[0]));
			if (sortedHosts.length === 0) {
					markdownLines.push('- No documented instances found');
			} else {
					for (const [host, info] of sortedHosts) {
							markdownLines.push(`- ${host}: total=${info.total}, enabled=${info.enabled}, disabled=${info.disabled}`);
					}
			}

			markdownLines.push('');
			markdownLines.push('## State object summary');
			markdownLines.push(`- Total state objects: ${stateSummary.total}`);
			markdownLines.push(`- Writable state objects: ${stateSummary.writable}`);
			markdownLines.push(`- Read-only state objects: ${stateSummary.readonly}`);
			markdownLines.push(`- Read/write state objects: ${stateSummary.readwrite}`);
			markdownLines.push(`- Write-only state objects: ${stateSummary.writeonly}`);
			markdownLines.push('');

			markdownLines.push('## Top state roles');
			if (stateSummary.roles.length === 0) {
					markdownLines.push('- No state roles found');
			} else {
					for (const entry of stateSummary.roles) {
							markdownLines.push(`- ${entry.role}: ${entry.count}`);
					}
			}

			if (!hideInstanceDetailsInMarkdown) {
					markdownLines.push('');
					markdownLines.push('## Documented instances');

					if (documentedInstances.length === 0) {
							markdownLines.push('- No instances found');
					} else {
							for (const instance of documentedInstances) {
									markdownLines.push(`- ${instance.id}`);
									markdownLines.push(`  - Title: ${instance.title}`);
									markdownLines.push(`  - Name: ${instance.name}`);
									markdownLines.push(`  - Version: ${instance.version}`);
									markdownLines.push(`  - Host: ${instance.host}`);
									markdownLines.push(`  - Enabled: ${instance.enabled}`);
									markdownLines.push(`  - Mode: ${instance.mode}`);
							}
					}
			}

			markdownLines.push('');
			markdownLines.push('## Sample state objects');

			if (stateSummary.sampleStates.length === 0) {
					markdownLines.push('- No sample states available');
			} else {
					for (const sample of stateSummary.sampleStates) {
							markdownLines.push(`- ${sample.id}`);
							markdownLines.push(`  - Role: ${sample.role}`);
							markdownLines.push(`  - Type: ${sample.type}`);
							markdownLines.push(`  - Read: ${sample.read}`);
							markdownLines.push(`  - Write: ${sample.write}`);
					}
			}

			const markdown = markdownLines.join('\n');

			const jsonDocument = {
					project: {
							name: projectName,
							targetSystem,
							description: projectDescription,
							additionalNotes,
					},
					generated: {
							at: generatedAt,
							by: 'AutoDoc ioBroker adapter',
							trigger,
					},
					system: {
							language: systemLanguage,
					},
					host: {
							name: hostName,
							platform: hostPlatform,
							version: hostVersion,
					},
					filters: filterSummary,
					instances: {
							total: documentedInstances.length,
							enabled: enabledInstanceCount,
							disabled: disabledInstanceCount,
							hosts: instanceHostsMap,
							items: documentedInstances,
					},
					states: stateSummary,
			};

			const json = JSON.stringify(jsonDocument, null, 2);
			const stateSummaryJson = JSON.stringify(stateSummary, null, 2);
			const hostSummaryJson = JSON.stringify(instanceHostsMap, null, 2);
			const summary = `Documentation for "${projectName}" generated: ${documentedInstances.length} instances, ${stateSummary.total} state objects`;

			await this.setStateAsync('documentation.markdown', { val: markdown, ack: true });
			await this.setStateAsync('documentation.json', { val: json, ack: true });
			await this.setStateAsync('documentation.stateSummary', { val: stateSummaryJson, ack: true });

			await this.setStateAsync('info.summary', { val: summary, ack: true });
			await this.setStateAsync('info.lastTrigger', { val: trigger, ack: true });
			await this.setStateAsync('info.lastGeneration', { val: generatedAt, ack: true });

			await this.setStateAsync('info.systemLanguage', { val: systemLanguage, ack: true });
			await this.setStateAsync('info.instanceCount', { val: documentedInstances.length, ack: true });
			await this.setStateAsync('info.enabledInstanceCount', { val: enabledInstanceCount, ack: true });
			await this.setStateAsync('info.disabledInstanceCount', { val: disabledInstanceCount, ack: true });
			await this.setStateAsync('info.instanceHosts', { val: hostSummaryJson, ack: true });

			await this.setStateAsync('info.hostName', { val: hostName, ack: true });
			await this.setStateAsync('info.hostPlatform', { val: hostPlatform, ack: true });
			await this.setStateAsync('info.hostVersion', { val: hostVersion, ack: true });

			await this.setStateAsync('info.totalStateObjects', { val: stateSummary.total, ack: true });
			await this.setStateAsync('info.writableStateObjects', { val: stateSummary.writable, ack: true });
			await this.setStateAsync('info.readonlyStateObjects', { val: stateSummary.readonly, ack: true });

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
