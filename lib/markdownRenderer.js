/**
 * AutoDoc Markdown Renderer Module
 * Renders document models to Markdown format
 */

/**
 * @param {object} adapter ioBroker adapter instance
 * @param {object} i18n i18n instance for translations
 */
class MarkdownRenderer {
	constructor(adapter, i18n) {
		this.adapter = adapter;
		this.i18n = i18n;
	}

	/**
	 * Render complete document model to Markdown
	 *
	 * @param {object} docModel Document model
	 * @returns {string} Markdown content
	 */
	renderMarkdown(docModel) {
		const config = this.adapter.config;
		const profile = config.profile || 'admin';

		let markdown = '';

		// Title and metadata
		markdown += this.renderHeader(docModel, profile);

		// Table of contents
		markdown += this.renderTableOfContents();

		// System chapter
		markdown += this.renderSystemChapter(docModel);

		// Adapters chapter
		markdown += this.renderAdaptersChapter(docModel, profile);

		// Manual context
		if (config.manualContext) {
			markdown += this.renderManualContext(config.manualContext);
		}

		// Appendices
		markdown += this.renderAppendices(docModel);

		return markdown;
	}

	/**
	 * Render document header
	 *
	 * @param {object} docModel Document model
	 * @param {string} profile Target profile
	 * @returns {string} Header markdown
	 */
	renderHeader(docModel, profile) {
		const config = this.adapter.config;
		const i18n = this.i18n;

		return `# ${i18n.t('projectDocumentation', config.projectName || 'ioBroker System')}

**${i18n.t('generated')}:** ${new Date(docModel.meta.generatedAt).toLocaleString()}
**${i18n.t('profile')}:** ${profile}
**${i18n.t('system')}:** ${config.targetSystem || 'Production'}
**${i18n.t('trigger')}:** ${docModel.meta.trigger}

---
`;
	}

	/**
	 * Render table of contents
	 *
	 * @returns {string} Table of contents markdown
	 */
	renderTableOfContents() {
		const i18n = this.i18n;
		return `## ${i18n.t('tableOfContents')}

1. [${i18n.t('systemOverview')}](#system-overview)
2. [${i18n.t('adapterInstances')}](#adapter-instances)
3. [${i18n.t('manualInformation')}](#manual-information)
4. [${i18n.t('appendices')}](#appendices)

---
`;
	}

	/**
	 * Render system overview chapter
	 *
	 * @param {object} docModel Document model
	 * @returns {string} System chapter markdown
	 */
	renderSystemChapter(docModel) {
		const system = docModel.system;
		const stats = system.statistics;
		const i18n = this.i18n;

		return `## ${i18n.t('systemOverview')}

### ${i18n.t('projectInformation')}
- **${i18n.t('projectName')}:** ${system.projectName}
- **${i18n.t('targetSystem')}:** ${system.targetSystem}

### ${i18n.t('primaryHost')}
- **${i18n.t('name')}:** ${system.primaryHost.name}
- **${i18n.t('platform')}:** ${system.primaryHost.platform}
- **${i18n.t('version')}:** ${system.primaryHost.version}

### ${i18n.t('systemStatistics')}
- **${i18n.t('totalAdapterInstances')}:** ${stats.instanceCount}
- **${i18n.t('enabledInstances')}:** ${stats.enabledInstanceCount}
- **${i18n.t('disabledInstances')}:** ${stats.disabledInstanceCount}
- **${i18n.t('totalStateObjects')}:** ${stats.totalStateObjects}
- **${i18n.t('writableStates')}:** ${stats.writableStateObjects}
- **${i18n.t('readOnlyStates')}:** ${stats.readonlyStateObjects}

### ${i18n.t('hosts')}
${system.hosts.map(host => `- **${host.name}** (${host.platform}) - v${host.version}`).join('\n')}

---
`;
	}

	/**
	 * Render adapters chapter
	 *
	 * @param {object} docModel Document model
	 * @param {string} _profile Target profile
	 * @returns {string} Adapters chapter markdown
	 */
	renderAdaptersChapter(docModel, _profile) {
		const adapters = docModel.adapters;
		const config = this.adapter.config;
		const i18n = this.i18n;

		let markdown = `## ${i18n.t('adapterInstances')}

### ${i18n.t('overview')}
- **${i18n.t('totalAdapters')}:** ${adapters.totalAdapters}
- **${i18n.t('totalInstances')}:** ${adapters.adapters.reduce((sum, adapter) => sum + adapter.totalInstances, 0)}

### ${i18n.t('adapterDetails')}

`;

		for (const adapter of adapters.adapters) {
			markdown += `#### ${adapter.name}
- **${i18n.t('totalInstances')}:** ${adapter.totalInstances}
- **${i18n.t('enabledInstances')}:** ${adapter.enabledInstances}

`;

			// Instance details based on profile and config
			if (!config.hideInstanceDetailsInMarkdown) {
				for (const instance of adapter.instances) {
					markdown += `- **${instance.id}** (${instance.enabled ? i18n.t('enabled') : i18n.t('disabled')}) - ${instance.version || 'unknown version'}
`;
				}
			}

			markdown += '\n';
		}

		markdown += '---\n';
		return markdown;
	}

	/**
	 * Render manual context chapter
	 *
	 * @param {object} manualContext Manual context from config
	 * @returns {string} Manual context markdown
	 */
	renderManualContext(manualContext) {
		const i18n = this.i18n;
		let markdown = `## ${i18n.t('manualInformation')}

`;

		if (manualContext.description) {
			markdown += `### ${i18n.t('description')}
${manualContext.description}

`;
		}

		if (manualContext.contact) {
			markdown += `### ${i18n.t('contact')}
${manualContext.contact}

`;
		}

		if (manualContext.notes) {
			markdown += `### ${i18n.t('additionalNotes')}
${manualContext.notes}

`;
		}

		markdown += '---\n';
		return markdown;
	}

	/**
	 * Render appendices
	 *
	 * @param {object} docModel Document model
	 * @returns {string} Appendices markdown
	 */
	renderAppendices(docModel) {
		const appendices = docModel.appendices;
		const i18n = this.i18n;

		return `## ${i18n.t('appendices')}

### ${i18n.t('stateObjectsSummary')}
- **${i18n.t('total')}:** ${appendices.stateSummary.total}
- **${i18n.t('writable')}:** ${appendices.stateSummary.writable}
- **${i18n.t('readOnly')}:** ${appendices.stateSummary.readonly}

### ${i18n.t('collectionInformation')}
- **${i18n.t('collectedAt')}:** ${new Date(appendices.collectionTimestamp).toLocaleString()}
- **${i18n.t('schemaVersion')}:** ${docModel.meta.schemaVersion}

---
*${i18n.t('generatedBy')}${docModel.meta.version}*
`;
	}
}

module.exports = MarkdownRenderer;
