/**
 * AutoDoc Markdown Renderer Module
 * Renders document models to Markdown format with profile-based content
 */
const PROFILE_ADMIN = 'admin';
const PROFILE_USER = 'user';
const PROFILE_ONBOARDING = 'onboarding';

const { groupScriptsByFolder, isGlobalFolderKey } = require('./scriptGroups');

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
	 * @param {object} docModel
	 * @param {string} key
	 * @returns {boolean}
	 */
	adminChapterHidden(docModel, key) {
		const h = docModel && docModel.adminHiddenChapters;
		return Array.isArray(h) && h.includes(key);
	}

	/**
	 * @param {object} docModel
	 * @param {string} key
	 * @returns {boolean}
	 */
	userChapterHidden(docModel, key) {
		const h = docModel && docModel.userHiddenChapters;
		return Array.isArray(h) && h.includes(key);
	}

	/**
	 * @param {object} docModel
	 * @param {string} key
	 * @returns {boolean}
	 */
	onboardingChapterHidden(docModel, key) {
		const h = docModel && docModel.onboardingHiddenChapters;
		return Array.isArray(h) && h.includes(key);
	}

	/**
	 * @param {object} docModel
	 * @param {string} profile
	 * @returns {boolean}
	 */
	manualContextVisibleForMarkdown(docModel, profile) {
		const mc = docModel.manualContext;
		if (!mc) {
			return false;
		}
		const t = v => v && String(v).trim();
		if (profile === PROFILE_USER) {
			const core =
				!this.userChapterHidden(docModel, 'manual') && (t(mc.description) || t(mc.contact) || t(mc.notes));
			const g = !this.userChapterHidden(docModel, 'guestHelp') && t(mc.guestHelpNote);
			const r = !this.userChapterHidden(docModel, 'routines') && t(mc.homeRoutinesNote);
			return !!(core || g || r);
		}
		if (profile === PROFILE_ONBOARDING) {
			const core =
				!this.onboardingChapterHidden(docModel, 'manual') &&
				(t(mc.description) || t(mc.contact) || t(mc.notes));
			const g = !this.onboardingChapterHidden(docModel, 'guestHelp') && t(mc.guestHelpNote);
			const r = !this.onboardingChapterHidden(docModel, 'routines') && t(mc.homeRoutinesNote);
			return !!(core || g || r);
		}
		return false;
	}

	/**
	 * @param {object} docModel
	 * @param {string} profile
	 * @returns {string}
	 */
	renderCustomSectionsMarkdown(docModel, profile) {
		if (profile === PROFILE_ADMIN && this.adminChapterHidden(docModel, 'custom')) {
			return '';
		}
		if (profile === PROFILE_USER && this.userChapterHidden(docModel, 'custom')) {
			return '';
		}
		if (profile === PROFILE_ONBOARDING && this.onboardingChapterHidden(docModel, 'custom')) {
			return '';
		}
		const list = (docModel && docModel.customDocSections) || [];
		const rows = list.filter(s => !s.profiles || !s.profiles.length || s.profiles.includes(profile));
		if (rows.length === 0) {
			return '';
		}
		const i18n = this.i18n;
		let md = `## ${i18n.t('customDocSectionsTitle') || 'Custom sections'}\n\n<a id="custom-doc-sections"></a>\n\n`;
		for (const s of rows) {
			const body = String(s.bodyMarkdown || '')
				.replace(/^\uFEFF/, '')
				.replace(/^[\r\n]+/, '');
			md += `<a id="${s.anchorId}"></a>\n\n### ${s.title}\n\n${body}\n\n---\n\n`;
		}
		return md;
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

		// AI summary (if available) — matches selected documentation profile
		const aiBlock =
			profile === PROFILE_USER
				? docModel.ai?.user
				: profile === PROFILE_ONBOARDING
					? docModel.ai?.onboarding
					: null;
		if (
			aiBlock &&
			((profile === PROFILE_USER && !this.userChapterHidden(docModel, 'ai')) ||
				(profile === PROFILE_ONBOARDING && !this.onboardingChapterHidden(docModel, 'ai')))
		) {
			markdown += this.renderAiSection(aiBlock);
		}

		// Table of contents
		markdown += this.renderTableOfContents(profile, docModel);

		// Onboarding profile: Quick start first
		if (profile === PROFILE_ONBOARDING && !this.onboardingChapterHidden(docModel, 'quickstart')) {
			markdown += this.renderQuickStart(docModel);
		}

		const systemHidden =
			(profile === PROFILE_ADMIN && this.adminChapterHidden(docModel, 'system')) ||
			(profile === PROFILE_USER && this.userChapterHidden(docModel, 'system')) ||
			(profile === PROFILE_ONBOARDING && this.onboardingChapterHidden(docModel, 'system'));
		if (!systemHidden) {
			markdown += this.renderSystemChapter(docModel, profile);
		}

		const adaptersHidden =
			(profile === PROFILE_ADMIN && this.adminChapterHidden(docModel, 'adapters')) ||
			(profile === PROFILE_USER && this.userChapterHidden(docModel, 'adapters')) ||
			(profile === PROFILE_ONBOARDING && this.onboardingChapterHidden(docModel, 'adapters'));
		if (!adaptersHidden) {
			markdown += this.renderAdaptersChapter(docModel, profile);
		}

		if (profile !== PROFILE_ONBOARDING) {
			const roomsHidden =
				(profile === PROFILE_ADMIN && this.adminChapterHidden(docModel, 'rooms')) ||
				(profile === PROFILE_USER && this.userChapterHidden(docModel, 'rooms'));
			if (!roomsHidden) {
				markdown += this.renderRoomsChapter(docModel, profile);
			}
		}

		if (profile !== PROFILE_ONBOARDING) {
			const scriptsHidden =
				(profile === PROFILE_ADMIN && this.adminChapterHidden(docModel, 'scripts')) ||
				(profile === PROFILE_USER && this.userChapterHidden(docModel, 'scripts'));
			if (!scriptsHidden) {
				markdown += this.renderScriptsChapter(docModel, profile);
			}
		}

		if (
			profile === PROFILE_ADMIN &&
			!this.adminChapterHidden(docModel, 'schedule') &&
			docModel.scheduleObjects &&
			docModel.scheduleObjects.length > 0
		) {
			markdown += this.renderScheduleObjectsChapter(docModel);
		}

		if (profile === PROFILE_ADMIN) {
			if (
				!this.adminChapterHidden(docModel, 'manual') &&
				this.manualContextHasPublicFields(docModel.manualContext)
			) {
				markdown += this.renderManualContext(docModel.manualContext);
			}
		} else if (this.manualContextVisibleForMarkdown(docModel, profile)) {
			markdown += this.renderManualContext(docModel.manualContext, {
				skipManualCore:
					profile === PROFILE_USER
						? this.userChapterHidden(docModel, 'manual')
						: this.onboardingChapterHidden(docModel, 'manual'),
				skipGuestHelp:
					profile === PROFILE_USER
						? this.userChapterHidden(docModel, 'guestHelp')
						: this.onboardingChapterHidden(docModel, 'guestHelp'),
				skipRoutines:
					profile === PROFILE_USER
						? this.userChapterHidden(docModel, 'routines')
						: this.onboardingChapterHidden(docModel, 'routines'),
			});
		}

		markdown += this.renderCustomSectionsMarkdown(docModel, profile);

		// Maintenance chapter (Admin only)
		if (profile === PROFILE_ADMIN && !this.adminChapterHidden(docModel, 'maintenance')) {
			markdown += this.renderMaintenanceChapter(docModel);
		}

		if (profile !== PROFILE_ONBOARDING) {
			const troubleHidden =
				(profile === PROFILE_ADMIN && this.adminChapterHidden(docModel, 'troubleshooting')) ||
				(profile === PROFILE_USER && this.userChapterHidden(docModel, 'troubleshooting'));
			if (!troubleHidden) {
				markdown += this.renderTroubleshooting(docModel, profile);
			}
		}

		// Appendices (only for Admin profile)
		if (profile === PROFILE_ADMIN && !this.adminChapterHidden(docModel, 'appendices')) {
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
	 * @param {object} docModel Document model
	 * @returns {string} Table of contents markdown
	 */
	renderTableOfContents(profile, docModel) {
		const i18n = this.i18n;
		let toc = `## ${i18n.t('tableOfContents')}

`;
		const h = profile === PROFILE_ADMIN ? k => this.adminChapterHidden(docModel, k) : () => false;
		const customRows = (docModel && docModel.customDocSections) || [];
		const customForProfile = customRows.filter(
			s => !s.profiles || !s.profiles.length || s.profiles.includes(profile),
		);
		const customToc =
			customForProfile.length > 0 ? customForProfile.map(s => `- [${s.title}](#${s.anchorId})`).join('\n') : '';

		if (profile === PROFILE_ONBOARDING) {
			const oh = k => this.onboardingChapterHidden(docModel, k);
			let n = 1;
			const ob = [];
			if (!oh('quickstart')) {
				ob.push(`${n++}. [Quick Start](#quick-start)`);
			}
			if (!oh('system')) {
				ob.push(`${n++}. [${i18n.t('systemOverview')}](#system-overview)`);
			}
			if (!oh('adapters')) {
				ob.push(`${n++}. [${i18n.t('adapterInstances')}](#adapter-instances)`);
			}
			if (this.manualContextVisibleForMarkdown(docModel, PROFILE_ONBOARDING)) {
				ob.push(`${n++}. [${i18n.t('manualInformation')}](#manual-information)`);
			}
			if (customForProfile.length && !oh('custom')) {
				ob.push(`${n++}. [${i18n.t('customDocSectionsTitle') || 'Custom sections'}](#custom-doc-sections)`);
			}
			toc += `${ob.join('\n')}\n`;
			if (customToc && !oh('custom')) {
				toc += `\n${i18n.t('customDocSectionsTitle') || 'Custom sections'}:\n${customToc}\n`;
			}
		} else if (profile === PROFILE_USER) {
			const uh = k => this.userChapterHidden(docModel, k);
			let n = 1;
			const ub = [];
			if (!uh('system')) {
				ub.push(`${n++}. [${i18n.t('systemOverview')}](#system-overview)`);
			}
			if (!uh('adapters')) {
				ub.push(`${n++}. [${i18n.t('adapterInstances')}](#adapter-instances)`);
			}
			if (!uh('rooms')) {
				ub.push(`${n++}. [${i18n.t('roomsAndFunctions')}](#rooms-and-functions)`);
			}
			if (!uh('scripts')) {
				ub.push(`${n++}. [${i18n.t('scripts')}](#scripts)`);
			}
			if (this.manualContextVisibleForMarkdown(docModel, PROFILE_USER)) {
				ub.push(`${n++}. [${i18n.t('manualInformation')}](#manual-information)`);
			}
			if (!uh('troubleshooting')) {
				ub.push(`${n++}. [Troubleshooting](#troubleshooting)`);
			}
			if (customForProfile.length && !uh('custom')) {
				ub.push(`${n++}. [${i18n.t('customDocSectionsTitle') || 'Custom sections'}](#custom-doc-sections)`);
			}
			toc += `${ub.join('\n')}\n`;
			if (customToc && !uh('custom')) {
				toc += `\n${i18n.t('customDocSectionsTitle') || 'Custom sections'}:\n${customToc}\n`;
			}
		} else {
			// PROFILE_ADMIN — mirror render order; numbering is approximate when entries are hidden
			let n = 1;
			const lines = [];
			if (!h('system')) {
				lines.push(`${n++}. [${i18n.t('systemOverview')}](#system-overview)`);
			}
			if (!h('adapters')) {
				lines.push(`${n++}. [${i18n.t('adapterInstances')}](#adapter-instances)`);
			}
			if (!h('rooms')) {
				lines.push(`${n++}. [${i18n.t('roomsAndFunctions')}](#rooms-and-functions)`);
			}
			if (!h('scripts')) {
				lines.push(`${n++}. [${i18n.t('scripts')}](#scripts)`);
			}
			if (!h('schedule') && docModel.scheduleObjects && docModel.scheduleObjects.length > 0) {
				lines.push(`${n++}. [${i18n.t('scheduleTypeObjects')}](#schedule-type-objects)`);
			}
			const mc = docModel.manualContext;
			const hasManual =
				mc && (mc.description || mc.contact || mc.notes || mc.guestHelpNote || mc.homeRoutinesNote);
			if (!h('manual') && hasManual) {
				lines.push(`${n++}. [${i18n.t('manualInformation')}](#manual-information)`);
			}
			if (customForProfile.length && !h('custom')) {
				lines.push(`${n++}. [${i18n.t('customDocSectionsTitle') || 'Custom sections'}](#custom-doc-sections)`);
			}
			if (!h('maintenance')) {
				lines.push(`${n++}. [${i18n.t('maintenance')}](#maintenance)`);
			}
			if (!h('troubleshooting')) {
				lines.push(`${n++}. [Troubleshooting](#troubleshooting)`);
			}
			if (!h('appendices')) {
				lines.push(`${n++}. [${i18n.t('appendices')}](#appendices)`);
			}
			toc += `${lines.join('\n')}\n`;
			if (customToc && !h('custom')) {
				toc += `\n${i18n.t('customDocSectionsTitle') || 'Custom sections'}:\n${customToc}\n`;
			}
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
${system.primaryHost.nodeVersion ? `- **${i18n.t('nodeVersion')}:** ${system.primaryHost.nodeVersion}` : ''}
${system.primaryHost.npmVersion ? `- **${i18n.t('npmVersion')}:** ${system.primaryHost.npmVersion}` : ''}

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
${system.hosts
	.map(host => {
		let line = `- **${host.name}** (${host.platform}) - js-controller ${host.version}`;
		if (host.nodeVersion) {
			line += `, Node ${host.nodeVersion}`;
		}
		if (host.npmVersion) {
			line += `, npm ${host.npmVersion}`;
		}
		return line;
	})
	.join('\n')}
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
						const bits = [
							`\`${instance.id}\` (${instance.enabled ? i18n.t('enabled') : i18n.t('disabled')}) v${instance.version || '?'}`,
						];
						if (instance.mode && instance.mode !== 'daemon') {
							bits.push(`${i18n.t('instanceRunMode')}: ${instance.mode}`);
						}
						if (instance.scheduleCron && String(instance.scheduleCron).trim()) {
							bits.push(`${i18n.t('instanceScheduleCron')}: \`${instance.scheduleCron}\``);
						}
						if (instance.restartSchedule && String(instance.restartSchedule).trim()) {
							bits.push(`${i18n.t('instanceRestartCron')}: \`${instance.restartSchedule}\``);
						}
						markdown += `  - ${bits.join(' — ')}
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

		if (
			(profile === PROFILE_USER || profile === PROFILE_ONBOARDING) &&
			scriptsData.aiAutomationOverview &&
			String(scriptsData.aiAutomationOverview).trim()
		) {
			markdown += `### ${i18n.t('automationOverviewAi')}\n\n${scriptsData.aiAutomationOverview}\n\n`;
		}

		if (scriptsData.totalScripts === 0) {
			markdown += `_${i18n.t('noScriptsDefined')}_\n\n`;
		} else {
			const list = profile === PROFILE_USER ? scriptsData.scripts.filter(s => s.enabled) : scriptsData.scripts;

			const emitScript = script => {
				const statusMark = script.enabled ? '✅' : '⏸';
				markdown += `#### ${statusMark} ${script.name}`;
				if (profile !== PROFILE_ADMIN) {
					const folderLabel = this.scriptFolderLabel(script.folder);
					markdown += ` _(${folderLabel})_`;
				}
				markdown += '\n';

				if (script.desc) {
					markdown += `${script.desc}\n`;
				}
				if (script.aiSummary && profile !== PROFILE_ADMIN) {
					markdown += `> **${i18n.t('scriptAiSummary')}:** ${script.aiSummary}\n\n`;
				}

				if (profile === PROFILE_ADMIN) {
					markdown += `- **${i18n.t('scriptTrigger')}:** ${script.triggerType}
- **${i18n.t('scriptStatus')}:** ${script.enabled ? i18n.t('active') : i18n.t('inactive')}
`;
					if (script.engine && String(script.engine).trim()) {
						markdown += `- **${i18n.t('scriptEngineInstance')}:** ${script.engine}\n`;
					}
					if (script.stateRefs && script.stateRefs.length > 0) {
						markdown += `- **State refs:** ${script.stateRefs.join(', ')}\n`;
					}
				}
				markdown += '\n';
			};

			if (profile === PROFILE_ADMIN) {
				markdown += `${i18n.t('scriptsByFolderIntro')}\n\n`;
				for (const g of groupScriptsByFolder(list)) {
					const folderTitle = g.folder == null ? i18n.t('scriptFolderRoot') : g.folder;
					markdown += `### ${folderTitle} (${g.scripts.length})\n\n`;
					if (isGlobalFolderKey(g.folderKey)) {
						markdown += `*${i18n.t('scriptsGlobalFolderHint')}*\n\n`;
					}
					for (const script of g.scripts) {
						emitScript(script);
					}
				}
			} else {
				for (const script of list) {
					emitScript(script);
				}
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
	 * Admin: ioBroker objects from getObjectView(system, schedule).
	 *
	 * @param {object} docModel
	 * @returns {string}
	 */
	renderScheduleObjectsChapter(docModel) {
		const list = docModel.scheduleObjects || [];
		if (list.length === 0) {
			return '';
		}
		const i18n = this.i18n;
		let md = `## ${i18n.t('scheduleTypeObjects')}\n\n${i18n.t('scheduleTypeObjectsIntro')}\n\n`;
		md += `| ${i18n.t('name')} | ${i18n.t('description')} | ${i18n.t('scriptStatus')} |\n|---|---|---|\n`;
		for (const s of list) {
			const st = s.enabled ? i18n.t('active') : i18n.t('inactive');
			md += `| \`${s.id}\` **${s.name}** | ${(s.desc || '—').replace(/\|/g, '\\|')} | ${st} |\n`;
		}
		md += '\n---\n';
		return md;
	}

	/**
	 * Render manual context chapter
	 *
	 * @param {object} manualContext Manual context from config
	 * @param {{ skipManualCore?: boolean, skipGuestHelp?: boolean, skipRoutines?: boolean }} [skip]
	 * @returns {string} Manual context markdown
	 */
	renderManualContext(manualContext, skip = {}) {
		const sk = {
			skipManualCore: false,
			skipGuestHelp: false,
			skipRoutines: false,
			...skip,
		};
		const i18n = this.i18n;
		const parts = [];

		if (!sk.skipManualCore && manualContext.description) {
			parts.push(`### ${i18n.t('description')}
${manualContext.description}

`);
		}

		if (!sk.skipManualCore && manualContext.contact) {
			parts.push(`### ${i18n.t('contact')}
${manualContext.contact}

`);
		}

		if (!sk.skipManualCore && manualContext.notes) {
			parts.push(`### ${i18n.t('additionalNotes')}
${manualContext.notes}

`);
		}

		if (!sk.skipGuestHelp && manualContext.guestHelpNote && String(manualContext.guestHelpNote).trim()) {
			parts.push(`### ${i18n.t('guestHelpTitle')}
${manualContext.guestHelpNote}

`);
		}

		if (!sk.skipRoutines && manualContext.homeRoutinesNote && String(manualContext.homeRoutinesNote).trim()) {
			parts.push(`### ${i18n.t('homeRoutinesTitle')}
_${i18n.t('homeRoutinesIntro')}_

${manualContext.homeRoutinesNote}

`);
		}

		if (parts.length === 0) {
			return '';
		}

		return `## ${i18n.t('manualInformation')}

${parts.join('')}---
`;
	}

	/**
	 * @param {object} [mc]
	 * @returns {boolean}
	 */
	manualContextHasPublicFields(mc) {
		if (!mc) {
			return false;
		}
		const t = v => v && String(v).trim();
		return !!(t(mc.description) || t(mc.contact) || t(mc.notes) || t(mc.guestHelpNote) || t(mc.homeRoutinesNote));
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
