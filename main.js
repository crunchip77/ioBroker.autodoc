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

			const writablePercent = stateSummary.total > 0 ? ((stateSummary.writable / stateSummary.total) * 100).toFixed(1) : '0.0';
			const readonlyPercent = stateSummary.total > 0 ? ((stateSummary.readonly / stateSummary.total) * 100).toFixed(1) : '0.0';

			const filterSummary = {
					onlyEnabledInstances,
					hideInstanceDetailsInMarkdown,
					maxDocumentedInstances,
			};

      const markdownLines = [
          `# ${projectName}`,
          '',
          '## Projektübersicht',
          projectDescription && projectDescription !== 'No project description provided.'
              ? projectDescription
              : 'Für dieses Projekt wurde noch keine Beschreibung hinterlegt.',
          '',
          '## Zielsystem',
          targetSystem,
          '',
          '## Zusätzliche Hinweise',
          additionalNotes && additionalNotes !== 'No additional notes provided.'
              ? additionalNotes
              : 'Es wurden keine zusätzlichen Hinweise hinterlegt.',
          '',
          '## Generiert von',
          'AutoDoc ioBroker Adapter',
          '',
          '## Generiert am',
          generatedAt,
          '',
          '## Systeminformationen',
          `- Systemsprache: ${systemLanguage || 'unbekannt'}`,
          `- Hostname: ${hostName || 'unbekannt'}`,
          `- Plattform: ${hostPlatform || 'unbekannt'}`,
          `- Version: ${hostVersion || 'unbekannt'}`,
          '',
          '## Verwendete Filter',
          `- Nur aktivierte Instanzen dokumentieren: ${onlyEnabledInstances ? 'ja' : 'nein'}`,
          `- Instanzdetails im Markdown ausblenden: ${hideInstanceDetailsInMarkdown ? 'ja' : 'nein'}`,
          `- Maximale Anzahl dokumentierter Instanzen: ${maxDocumentedInstances > 0 ? maxDocumentedInstances : 'unbegrenzt'}`,
          '',
          '## Instanzübersicht',
          `- Dokumentierte Instanzen: ${documentedInstances.length}`,
          `- Aktivierte Instanzen: ${enabledInstanceCount}`,
          `- Deaktivierte Instanzen: ${disabledInstanceCount}`,
          '',
          '## Instanzen pro Host',
      ];

      const sortedHosts = Object.entries(instanceHostsMap).sort((a, b) => a[0].localeCompare(b[0]));
      if (sortedHosts.length === 0) {
          markdownLines.push('- Keine dokumentierten Instanzen gefunden');
      } else {
          for (const [host, info] of sortedHosts) {
              markdownLines.push(`- ${host}: gesamt=${info.total}, aktiviert=${info.enabled}, deaktiviert=${info.disabled}`);
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

      if (!hideInstanceDetailsInMarkdown) {
          markdownLines.push('');
          markdownLines.push('## Dokumentierte Adapter-Instanzen');

          if (documentedInstances.length === 0) {
              markdownLines.push('- Keine Instanzen gefunden');
          } else {
              for (const instance of documentedInstances) {
                  markdownLines.push(`- ${instance.id}`);
                  markdownLines.push(`  - Titel: ${instance.title}`);
                  markdownLines.push(`  - Name: ${instance.name}`);
                  markdownLines.push(`  - Version: ${instance.version}`);
                  markdownLines.push(`  - Host: ${instance.host}`);
                  markdownLines.push(`  - Aktiviert: ${instance.enabled ? 'ja' : 'nein'}`);
                  markdownLines.push(`  - Modus: ${instance.mode}`);
              }
          }
      }

      markdownLines.push('');
      markdownLines.push('## Beispielhafte State-Objekte');
      markdownLines.push('Dieser Abschnitt zeigt eine kleine Auswahl erkannter State-Objekte zur schnellen Orientierung.');

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

      const markdown = markdownLines.join('\n');

			const json = JSON.stringify(jsonDocument, null, 2);
			const stateSummaryJson = JSON.stringify(stateSummary, null, 2);
			const hostSummaryJson = JSON.stringify(instanceHostsMap, null, 2);
			const summary = `Dokumentation für "${projectName}" erzeugt: ${documentedInstances.length} Instanzen, ${enabledInstanceCount} aktiviert, ${disabledInstanceCount} deaktiviert, ${stateSummary.total} State-Objekte (${stateSummary.writable} schreibbar, ${stateSummary.readonly} nur lesbar).`;

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
