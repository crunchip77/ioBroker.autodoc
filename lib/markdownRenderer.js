/**
 * AutoDoc Markdown Renderer Module
 * Renders document models to Markdown format with profile-based content
 */
const PROFILE_ADMIN = 'admin';
const PROFILE_USER = 'user';
const PROFILE_ONBOARDING = 'onboarding';

/**
 * MarkdownRenderer renders the document model to Markdown text.
 *
 * @param {object} adapter ioBroker adapter instance
 * @param {object} i18n i18n instance for translations
 */
class MarkdownRenderer {
	/**
	 * @param {object} adapter ioBroker adapter instance
	 * @param {object} i18n i18n instance for translations
	 */
	constructor(adapter, i18n) {
		this.adapter = adapter;
		this.i18n = i18n;
	}

	/**
	 * Check if profile includes detail level
	 *
	 * @param {string} profile Current profile
	 * @param {string} detailLevel Detail level (admin, user, basic)
	 * @returns {boolean} True if detail should be shown
	 */
	shouldShowDetail(profile, detailLevel) {
		const levels = {
			[PROFILE_ADMIN]: ['admin', 'user', 'basic'],
			[PROFILE_USER]: ['user', 'basic'],
			[PROFILE_ONBOARDING]: ['basic'],
		};
		return (levels[profile] || levels[PROFILE_ADMIN]).includes(detailLevel);
	}

	/**
	 * Render complete document model to Markdown
	 *
	 * @param {object} docModel Document model
	 * @returns {string} Markdown content
	 */
	renderMarkdown(docModel) {
		const config = this.adapter.config;
		const profile = config.profile || PROFILE_ADMIN;

		let markdown = '';

		// Title and metadata
		markdown += this.renderHeader(docModel, profile);

		// Table of contents
		markdown += this.renderTableOfContents(profile);

		// Onboarding profile: Quick start first
		if (profile === PROFILE_ONBOARDING) {
			markdown += this.renderQuickStart(docModel);
		}

		// System chapter (detail level varies by profile)
		markdown += this.renderSystemChapter(docModel, profile);

		// Adapters chapter
		markdown += this.renderAdaptersChapter(docModel, profile);

		// Manual context
		if (config.manualContext) {
			markdown += this.renderManualContext(config.manualContext);
		}

		// Troubleshooting for User and Admin profiles
		if (profile !== PROFILE_ONBOARDING) {
			markdown += this.renderTroubleshooting(docModel, profile);
		}

		// Appendices (only for Admin profile)
		if (profile === PROFILE_ADMIN) {
			markdown += this.renderAppendices(docModel);
		}

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
	 * @param {string} profile Documentation profile
	 * @returns {string} Table of contents markdown
	 */
	renderTableOfContents(profile) {
		const i18n = this.i18n;
		let toc = `## ${i18n.t('tableOfContents')}

`;

		if (profile === PROFILE_ONBOARDING) {
			toc += `1. [Quick Start](#quick-start)
2. [${i18n.t('systemOverview')}](#system-overview)
3. [${i18n.t('adapterInstances')}](#adapter-instances)
4. [${i18n.t('manualInformation')}](#manual-information)
`;
		} else if (profile === PROFILE_USER) {
			toc += `1. [${i18n.t('systemOverview')}](#system-overview)
2. [${i18n.t('adapterInstances')}](#adapter-instances)
3. [${i18n.t('manualInformation')}](#manual-information)
4. [Troubleshooting](#troubleshooting)
`;
		} else {
			// PROFILE_ADMIN
			toc += `1. [${i18n.t('systemOverview')}](#system-overview)
2. [${i18n.t('adapterInstances')}](#adapter-instances)
3. [${i18n.t('manualInformation')}](#manual-information)
4. [Troubleshooting](#troubleshooting)
5. [${i18n.t('appendices')}](#appendices)
`;
		}

		toc += '\n---\n';
		return toc;
	}

	/**
	 * Render quick start section for Onboarding profile
	 *
	 * @param {object} docModel Document model
	 * @returns {string} Quick start markdown
	 */
	renderQuickStart(docModel) {
		const system = docModel.system;
		return `## Quick Start

Welcome to your ioBroker documentation! Here's what you need to know:

### Your System
- **Project:** ${system.projectName}
- **Primary Server:** ${system.primaryHost.name}
- **Active Adapters:** ${system.statistics.enabledInstanceCount} out of ${system.statistics.instanceCount}

### Next Steps
1. Review your installed adapters below
2. Check the manual information section for guidance
3. Most adapters run automatically - no configuration needed

---
`;
	}

	/**
	 * Render system overview chapter with profile-aware detail level
	 *
	 * @param {object} docModel Document model
	 * @param {string} profile Documentation profile
	 * @returns {string} System chapter markdown
	 */
	renderSystemChapter(docModel, profile) {
		const system = docModel.system;
		const stats = system.statistics;
		const i18n = this.i18n;

		let markdown = `## ${i18n.t('systemOverview')}

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
`;

		// Admin profile: Show all details
		if (this.shouldShowDetail(profile, 'admin')) {
			markdown += `- **${i18n.t('totalStateObjects')}:** ${stats.totalStateObjects}
- **${i18n.t('writableStates')}:** ${stats.writableStateObjects}
- **${i18n.t('readOnlyStates')}:** ${stats.readonlyStateObjects}

### ${i18n.t('hosts')}
${system.hosts.map(host => `- **${host.name}** (${host.platform}) - v${host.version}`).join('\n')}
`;
		}

		markdown += '\n---\n';
		return markdown;
	}

	/**
	 * Render adapters chapter with profile-aware details
	 *
	 * @param {object} docModel Document model
	 * @param {string} profile Documentation profile
	 * @returns {string} Adapters chapter markdown
	 */
	renderAdaptersChapter(docModel, profile) {
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
			// User profile: Skip disabled adapters
			if (profile === PROFILE_USER && adapter.enabledInstances === 0) {
				continue;
			}

			markdown += `#### ${adapter.name}
`;

			if (this.shouldShowDetail(profile, 'admin')) {
				markdown += `- **${i18n.t('totalInstances')}:** ${adapter.totalInstances}
- **${i18n.t('enabledInstances')}:** ${adapter.enabledInstances}
`;
			} else if (profile === PROFILE_USER) {
				markdown += `- **Status:** ${adapter.enabledInstances > 0 ? 'Active' : 'Inactive'}
`;
			}

			// Instance details based on profile and config
			if (!config.hideInstanceDetailsInMarkdown && this.shouldShowDetail(profile, 'admin')) {
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
	 * Render troubleshooting section for User and Admin profiles
	 *
	 * @param {object} docModel Document model
	 * @param {string} profile Documentation profile
	 * @returns {string} Troubleshooting markdown
	 */
	renderTroubleshooting(docModel, profile) {
		const i18n = this.i18n;
		const system = docModel.system;

		if (profile === PROFILE_ONBOARDING) {
			return '';
		}

		let markdown = `## Troubleshooting

### Common Issues

#### Adapter not responding
- Check adapter is enabled in the Adapters section above
- Verify the primary host "${system.primaryHost.name}" is running
- Check system resources (CPU, Memory, Disk Space)

#### State Objects not updating
- Verify the adapter instance is enabled
- Check adapter configuration and logs
- Look for any error messages in the ioBroker admin panel

`;

		// Admin profile: Add technical troubleshooting
		if (profile === PROFILE_ADMIN) {
			markdown += `#### Collector Status
- Total instances detected: ${docModel.system.statistics.instanceCount}
- State objects scanned: ${docModel.appendices.stateSummary.total}
- Last update: ${new Date(docModel.appendices.collectionTimestamp).toLocaleString()}

#### Performance Notes
- ${i18n.t('totalStateObjects')}: ${docModel.appendices.stateSummary.total}
- ${i18n.t('writableStates')}: ${docModel.appendices.stateSummary.writable}
- ${i18n.t('readOnlyStates')}: ${docModel.appendices.stateSummary.readonly}

#### System Information
- Platform: ${system.primaryHost.platform}
- Node Version: ${system.primaryHost.version}
- Host: ${system.primaryHost.name}
`;
		}

		markdown += '\n---\n';
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
