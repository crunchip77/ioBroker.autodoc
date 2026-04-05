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

		// AI summary (if available)
		if (docModel.ai) {
			markdown += this.renderAiSection(docModel.ai);
		}

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

		// Rooms chapter (not for Onboarding)
		if (profile !== PROFILE_ONBOARDING) {
			markdown += this.renderRoomsChapter(docModel, profile);
		}

		// Scripts chapter (not for Onboarding)
		if (profile !== PROFILE_ONBOARDING) {
			markdown += this.renderScriptsChapter(docModel, profile);
		}

		// Manual context
		if (config.manualContext) {
			markdown += this.renderManualContext(config.manualContext);
		}

		// Maintenance chapter (Admin only)
		if (profile === PROFILE_ADMIN) {
			markdown += this.renderMaintenanceChapter(docModel);
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
	 * Render AI-generated summary section.
	 *
	 * @param {{narrative: string, recommendations: string}} ai AI content
	 * @returns {string} AI section markdown
	 */
	renderAiSection(ai) {
		let md = '> **AI Summary**\n';
		if (ai.narrative) {
			md += `>\n> ${ai.narrative.replace(/\n/g, '\n> ')}\n`;
		}
		if (ai.recommendations) {
			md += `>\n> **Recommendations:**\n> ${ai.recommendations.replace(/\n/g, '\n> ')}\n`;
		}
		md += '\n---\n';
		return md;
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
3. [${i18n.t('roomsAndFunctions')}](#rooms-and-functions)
4. [${i18n.t('scripts')}](#scripts)
5. [${i18n.t('manualInformation')}](#manual-information)
6. [Troubleshooting](#troubleshooting)
`;
		} else {
			// PROFILE_ADMIN
			toc += `1. [${i18n.t('systemOverview')}](#system-overview)
2. [${i18n.t('adapterInstances')}](#adapter-instances)
3. [${i18n.t('roomsAndFunctions')}](#rooms-and-functions)
4. [${i18n.t('scripts')}](#scripts)
5. [${i18n.t('maintenance')}](#maintenance)
6. [${i18n.t('manualInformation')}](#manual-information)
7. [Troubleshooting](#troubleshooting)
8. [${i18n.t('appendices')}](#appendices)
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

			if (profile === PROFILE_ADMIN) {
				// Admin: technical heading with name, title as subtitle, full details
				markdown += `#### ${adapter.name}${adapter.title && adapter.title !== adapter.name ? ` — ${adapter.title}` : ''}
`;
				if (adapter.desc) {
					markdown += `> ${adapter.desc}\n`;
				}
				markdown += `- **${i18n.t('totalInstances')}:** ${adapter.totalInstances}
- **${i18n.t('enabledInstances')}:** ${adapter.enabledInstances}
`;
				if (!config.hideInstanceDetailsInMarkdown) {
					for (const instance of adapter.instances) {
						markdown += `  - \`${instance.id}\` (${instance.enabled ? i18n.t('enabled') : i18n.t('disabled')}) v${instance.version || '?'}
`;
					}
				}
			} else if (profile === PROFILE_USER) {
				// User: human title prominent, description as main text, simple status
				const displayName = adapter.title && adapter.title !== adapter.name ? adapter.title : adapter.name;
				markdown += `#### ${displayName}
`;
				if (adapter.desc) {
					markdown += `${adapter.desc}\n`;
				}
				markdown += `- **Status:** ${adapter.enabledInstances > 0 ? i18n.t('enabled') : i18n.t('disabled')}
`;
			} else if (profile === PROFILE_ONBOARDING) {
				// Onboarding: welcoming, description only, no technical details
				const displayName = adapter.title && adapter.title !== adapter.name ? adapter.title : adapter.name;
				const statusText =
					adapter.enabledInstances > 0 ? 'Runs automatically — no action needed' : 'Currently inactive';
				markdown += `#### ${displayName}
`;
				if (adapter.desc) {
					markdown += `${adapter.desc}\n`;
				}
				markdown += `_${statusText}_\n`;
			}

			markdown += '\n';
		}

		markdown += '---\n';
		return markdown;
	}

	/**
	 * Render rooms and functions chapter
	 *
	 * @param {object} docModel Document model
	 * @param {string} profile Documentation profile
	 * @returns {string} Rooms chapter markdown
	 */
	renderRoomsChapter(docModel, profile) {
		const roomsData = docModel.rooms;
		const i18n = this.i18n;

		let markdown = `## ${i18n.t('roomsAndFunctions')}

### ${i18n.t('overview')}
- **${i18n.t('totalRooms')}:** ${roomsData.totalRooms}
- **${i18n.t('totalFunctions')}:** ${roomsData.totalFunctions}

`;

		if (roomsData.totalRooms === 0) {
			markdown += `_${i18n.t('noRoomsDefined')}_\n\n`;
		} else {
			markdown += `### ${i18n.t('rooms')}\n\n`;
			for (const room of roomsData.rooms) {
				markdown += `#### ${room.name}\n`;
				markdown += `- **${i18n.t('memberCount')}:** ${room.memberCount}\n`;

				// Admin: list individual members with their functions
				if (profile === PROFILE_ADMIN && room.devices.length > 0) {
					for (const member of room.devices) {
						const fnText = member.functions.length > 0 ? ` _(${member.functions.join(', ')})_` : '';
						markdown += `  - \`${member.id}\`${fnText}\n`;
					}
				}
				markdown += '\n';
			}

			// Admin: also list functions
			if (profile === PROFILE_ADMIN && roomsData.functions.length > 0) {
				markdown += `### ${i18n.t('functions')}\n\n`;
				for (const fn of roomsData.functions) {
					markdown += `- **${fn.name}** — ${fn.memberCount} ${i18n.t('memberCount')}\n`;
				}
				markdown += '\n';
			}
		}

		markdown += '---\n';
		return markdown;
	}

	/**
	 * Render scripts chapter
	 *
	 * @param {object} docModel Document model
	 * @param {string} profile Documentation profile
	 * @returns {string} Scripts chapter markdown
	 */
	renderScriptsChapter(docModel, profile) {
		const scriptsData = docModel.scripts;
		const i18n = this.i18n;

		let markdown = `## ${i18n.t('scripts')}

### ${i18n.t('overview')}
- **${i18n.t('totalScripts')}:** ${scriptsData.totalScripts}
- **${i18n.t('enabledScripts')}:** ${scriptsData.enabledScripts}
- **${i18n.t('disabledScripts')}:** ${scriptsData.disabledScripts}

`;

		if (scriptsData.totalScripts === 0) {
			markdown += `_${i18n.t('noScriptsDefined')}_\n\n`;
		} else {
			// User profile: only active scripts, no technical details
			const list = profile === PROFILE_USER ? scriptsData.scripts.filter(s => s.enabled) : scriptsData.scripts;

			for (const script of list) {
				const statusMark = script.enabled ? '✅' : '⏸';
				markdown += `#### ${statusMark} ${script.name}`;
				const folderLabel = this.scriptFolderLabel(script.folder);
				markdown += ` _(${folderLabel})_`;
				markdown += '\n';

				if (script.desc) {
					markdown += `${script.desc}\n`;
				}

				if (profile === PROFILE_ADMIN) {
					markdown += `- **${i18n.t('scriptTrigger')}:** ${script.triggerType}
- **${i18n.t('scriptStatus')}:** ${script.enabled ? i18n.t('active') : i18n.t('inactive')}
`;
					if (script.stateRefs && script.stateRefs.length > 0) {
						markdown += `- **State refs:** ${script.stateRefs.join(', ')}\n`;
					}
				}
				markdown += '\n';
			}

			// Cross-reference: shared states (admin only)
			if (profile === PROFILE_ADMIN) {
				const sharedStates = (scriptsData.stateCrossRef || []).filter(e => e.scripts.length > 1);
				if (sharedStates.length > 0) {
					markdown += `### Shared States\n\n`;
					markdown += `| State ID | Used by |\n|---|---|\n`;
					for (const entry of sharedStates) {
						markdown += `| \`${entry.stateId}\` | ${entry.scripts.join(', ')} |\n`;
					}
					markdown += '\n';
				}
			}
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
	 * Render maintenance and diagnostics chapter (Admin only)
	 *
	 * @param {object} docModel Document model
	 * @returns {string} Maintenance chapter markdown
	 */
	renderMaintenanceChapter(docModel) {
		const m = docModel.maintenance;
		const i18n = this.i18n;

		const checkLabels = {
			scriptsWithoutDescription: i18n.t('scriptsWithoutDescription'),
			disabledInstances: i18n.t('disabledInstancesHint'),
		};

		let markdown = `## ${i18n.t('maintenance')}

### ${i18n.t('maintenanceChecklist')}

**${i18n.t('documentationScore')}: ${m.score}%**

`;

		for (const item of m.checklist) {
			const icon = item.ok ? '✅' : '⚠️';
			const label = checkLabels[item.key] || item.key;
			const countText = item.ok ? '' : ` (${item.count})`;
			markdown += `- ${icon} ${label}${countText}\n`;
		}

		markdown += '\n';

		if (m.scriptsWithoutDescription.length > 0) {
			markdown += `### ${i18n.t('scriptsWithoutDescription')}\n`;
			for (const s of m.scriptsWithoutDescription) {
				const folderText = s.folder ? ` _(${s.folder})_` : '';
				markdown += `- **${s.name}**${folderText}\n`;
			}
			markdown += '\n';
		}

		if (m.disabledInstances.length > 0) {
			markdown += `### ${i18n.t('disabledInstancesHint')}\n`;
			for (const inst of m.disabledInstances) {
				markdown += `- \`${inst.id}\`${inst.title && inst.title !== inst.name ? ` — ${inst.title}` : ''}\n`;
			}
			markdown += '\n';
		}

		if (m.checklist.every(c => c.ok)) {
			markdown += `_${i18n.t('allGood')}_\n\n`;
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

		let markdown = `## ${i18n.t('troubleshooting')}

| ${i18n.t('troubleshootLogsLabel')} | ${i18n.t('troubleshootLogsValue')} |
| ${i18n.t('troubleshootObjectsLabel')} | ${i18n.t('troubleshootObjectsValue', system.primaryHost.name)} |

`;

		if (profile === PROFILE_ADMIN) {
			markdown += `### ${i18n.t('collectorStatus')}
- ${i18n.t('instancesDetected')}: ${docModel.system.statistics.instanceCount}
- ${i18n.t('stateObjectsScanned')}: ${docModel.appendices.stateSummary.total}
- ${i18n.t('platform')}: ${system.primaryHost.platform}
- ${i18n.t('nodeVersion')}: ${system.primaryHost.version}
`;
		}

		markdown += '\n---\n';
		return markdown;
	}

	/**
	 * Return a human-readable folder label for a script.
	 *
	 * @param {string|null} folder Raw folder string from discovery (null = root)
	 * @returns {string} Translated folder label
	 */
	scriptFolderLabel(folder) {
		const i18n = this.i18n;
		if (!folder) {
			return i18n.t('scriptFolderRoot');
		}
		if (folder === 'common') {
			return i18n.t('scriptFolderCommon');
		}
		if (folder === 'global') {
			return i18n.t('scriptFolderGlobal');
		}
		return folder;
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
