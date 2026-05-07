/**
 * AutoDoc Markdown Renderer Module
 * Renders document models to Markdown format with profile-based content
 */
const PROFILE_ADMIN = 'admin';
const PROFILE_USER = 'user';
const PROFILE_ONBOARDING = 'onboarding';

const { groupScriptsByFolder, isGlobalFolderKey } = require('./scriptGroups');
const { formatOperatingSystemLine } = require('./hostDisplay');
const {
	DEFAULT_ADMIN_CHAPTER_ORDER,
	USER_HTML_CHAPTER_KEYS,
	ONBOARDING_HTML_CHAPTER_KEYS,
} = require('./docTemplateConfig');
const { guestHelpChapterHasContent } = require('./guestHelpContent');
const { hasFamilyDiagnosisSnapshot, isNodeVersionFlaggedForDiagnosis } = require('./diagnosisSnapshot');
const { onboardingGuestShowsScriptNames } = require('./guestScriptPrivacy');
const { sliceQuickStartForOnboarding } = require('./quickStartGuide');

/**
 * Escape pipe characters for Markdown pipe tables (single-line cells).
 *
 * @param {*} v
 * @returns {string}
 */
function mdTableCell(v) {
	return String(v == null ? '' : v)
		.replace(/\|/g, '\\|')
		.replace(/\r?\n/g, ' ')
		.trim();
}

/**
 * Escapes user-controlled text for safe use inside Markdown **bold** (inner segment only).
 *
 * @param {*} v
 * @returns {string}
 */
function mdEscapeBoldInner(v) {
	return String(v == null ? '' : v)
		.replace(/\r?\n/g, ' ')
		.replace(/\\/g, '\\\\')
		.replace(/([`*_])/g, '\\$1');
}

/**
 * Escapes a single-line fragment used in Markdown outside code (list lines, heading text) so `*`, `_`, etc. do not break emphasis.
 *
 * @param {*} v
 * @returns {string}
 */
function mdEscapePlainLine(v) {
	return String(v == null ? '' : v)
		.replace(/\r?\n/g, ' ')
		.replace(/\\/g, '\\\\')
		.replace(/([`*_[\]])/g, '\\$1');
}

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
			const mer = !this.userChapterHidden(docModel, 'mermaid') && t(mc.mermaidDiagram);
			const merAuto = !this.userChapterHidden(docModel, 'mermaidAuto') && t(mc.autoHostTopologyMermaid);
			const g =
				!this.userChapterHidden(docModel, 'guestHelp') &&
				guestHelpChapterHasContent(mc, docModel, PROFILE_USER);
			const r = !this.userChapterHidden(docModel, 'routines') && t(mc.homeRoutinesNote);
			const pb = !this.userChapterHidden(docModel, 'ownerPlaybook') && t(mc.ownerPlaybookNote);
			return !!(core || mer || merAuto || g || r || pb);
		}
		if (profile === PROFILE_ONBOARDING) {
			const core =
				!this.onboardingChapterHidden(docModel, 'manual') &&
				(t(mc.description) || t(mc.contact) || t(mc.notes));
			// auto-topology never shown in onboarding — only manual mermaid counts here
			const mer = !this.onboardingChapterHidden(docModel, 'mermaid') && t(mc.mermaidDiagram);
			const g =
				!this.onboardingChapterHidden(docModel, 'guestHelp') &&
				guestHelpChapterHasContent(mc, docModel, PROFILE_ONBOARDING);
			const r = !this.onboardingChapterHidden(docModel, 'routines') && t(mc.homeRoutinesNote);
			const pb = !this.onboardingChapterHidden(docModel, 'ownerPlaybook') && t(mc.ownerPlaybookNote);
			return !!(core || mer || g || r || pb);
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

		// Table of contents
		markdown += this.renderTableOfContents(profile, docModel);

		if (profile === PROFILE_ADMIN) {
			const order = (docModel && docModel.adminChapterOrder) || DEFAULT_ADMIN_CHAPTER_ORDER;
			for (const key of order) {
				markdown += this.renderAdminMarkdownKey(docModel, key);
			}
			return markdown;
		}

		if (profile === PROFILE_USER) {
			const order = (docModel && docModel.userChapterOrder) || USER_HTML_CHAPTER_KEYS;
			for (const key of order) {
				markdown += this.renderUserMarkdownKey(docModel, key);
			}
			return markdown;
		}

		// PROFILE_ONBOARDING
		const order = (docModel && docModel.onboardingChapterOrder) || ONBOARDING_HTML_CHAPTER_KEYS;
		for (const key of order) {
			markdown += this.renderOnboardingMarkdownKey(docModel, key);
		}
		return markdown;
	}

	/**
	 * Dispatch one User-profile chapter for Markdown.
	 * 'manual' renders the full manualContext block (incl. mermaid, guestHelp, routines, ownerPlaybook);
	 * individual sub-keys return '' to avoid double rendering.
	 *
	 * @param {object} docModel
	 * @param {string} key
	 * @returns {string} Markdown fragment
	 */
	renderUserMarkdownKey(docModel, key) {
		const h = k => this.userChapterHidden(docModel, k);
		switch (key) {
			case 'manual': {
				if (!this.manualContextVisibleForMarkdown(docModel, PROFILE_USER)) {
					return '';
				}
				return this.renderManualContext(
					docModel.manualContext,
					{
						skipManualCore: h('manual'),
						skipMermaid: h('mermaid'),
						skipMermaidAuto: h('mermaidAuto'),
						skipGuestHelp: h('guestHelp'),
						skipRoutines: h('routines'),
						skipOwnerPlaybook: h('ownerPlaybook'),
					},
					{
						adminTroubleshootLinks: false,
						docModelForSnapshot: docModel,
						troubleshootOmitProfile: 'user',
					},
				);
			}
			case 'mermaid':
			case 'guestHelp':
			case 'routines':
			case 'ownerPlaybook':
				return ''; // rendered as part of 'manual' above
			case 'ai': {
				const aiBlock = docModel.ai?.user;
				if (!aiBlock || h('ai')) {
					return '';
				}
				return this.renderAiSection(aiBlock);
			}
			case 'atAGlance':
				if (h('atAGlance') || !(docModel.quickStart && docModel.quickStart.hasContent)) {
					return '';
				}
				return this.renderUserAtAGlanceMarkdown(docModel);
			case 'system':
				if (h('system')) {
					return '';
				}
				return this.renderSystemChapter(docModel, PROFILE_USER);
			case 'adapters':
				if (h('adapters')) {
					return '';
				}
				return this.renderAdaptersChapter(docModel, PROFILE_USER);
			case 'rooms':
				if (h('rooms')) {
					return '';
				}
				return this.renderRoomsChapter(docModel, PROFILE_USER);
			case 'scripts':
				if (h('scripts')) {
					return '';
				}
				return this.renderScriptsChapter(docModel, PROFILE_USER);
			case 'custom':
				return this.renderCustomSectionsMarkdown(docModel, PROFILE_USER);
			case 'troubleshooting':
				if (h('troubleshooting')) {
					return '';
				}
				return this.renderTroubleshooting(docModel, PROFILE_USER);
			default:
				return '';
		}
	}

	/**
	 * Dispatch one Onboarding-profile chapter for Markdown.
	 *
	 * @param {object} docModel
	 * @param {string} key
	 * @returns {string} Markdown fragment
	 */
	renderOnboardingMarkdownKey(docModel, key) {
		const h = k => this.onboardingChapterHidden(docModel, k);
		switch (key) {
			case 'welcome':
				return ''; // header rendered before the loop
			case 'quickstart':
				if (h('quickstart')) {
					return '';
				}
				return this.renderQuickStart(docModel);
			case 'manual': {
				if (!this.manualContextVisibleForMarkdown(docModel, PROFILE_ONBOARDING)) {
					return '';
				}
				return this.renderManualContext(
					docModel.manualContext,
					{
						skipManualCore: h('manual'),
						skipMermaid: h('mermaid'),
						skipMermaidAuto: true, // auto-topology never shown in onboarding
						skipGuestHelp: h('guestHelp'),
						skipRoutines: h('routines'),
						skipOwnerPlaybook: h('ownerPlaybook'),
					},
					{
						adminTroubleshootLinks: false,
						docModelForSnapshot: docModel,
						troubleshootOmitProfile: 'onboarding',
					},
				);
			}
			case 'mermaid':
			case 'guestHelp':
			case 'routines':
			case 'ownerPlaybook':
				return ''; // rendered as part of 'manual' above
			case 'ai': {
				const aiBlock = docModel.ai?.onboarding;
				if (!aiBlock || h('ai')) {
					return '';
				}
				return this.renderAiSection(aiBlock);
			}
			case 'system':
				if (h('system')) {
					return '';
				}
				return this.renderSystemChapter(docModel, PROFILE_ONBOARDING);
			case 'adapters':
				if (h('adapters')) {
					return '';
				}
				return this.renderAdaptersChapter(docModel, PROFILE_ONBOARDING);
			case 'custom':
				return this.renderCustomSectionsMarkdown(docModel, PROFILE_ONBOARDING);
			default:
				return '';
		}
	}

	/**
	 * @param {object} docModel
	 * @param {string} key
	 * @returns {string} Markdown fragment (admin profile)
	 */
	renderAdminMarkdownKey(docModel, key) {
		switch (key) {
			case 'manual': {
				if (this.adminChapterHidden(docModel, 'manual') || !this.manualContextHasPublicFields(docModel)) {
					return '';
				}
				return this.renderManualContext(
					docModel.manualContext,
					{
						skipMermaid: this.adminChapterHidden(docModel, 'mermaid'),
						skipMermaidAuto: this.adminChapterHidden(docModel, 'mermaidAuto'),
					},
					{
						adminTroubleshootLinks: true,
						troubleshootOmitProfile: 'admin',
					},
				);
			}
			case 'system': {
				if (this.adminChapterHidden(docModel, 'system')) {
					return '';
				}
				return this.renderSystemChapter(docModel, PROFILE_ADMIN);
			}
			case 'adapters': {
				if (this.adminChapterHidden(docModel, 'adapters')) {
					return '';
				}
				return this.renderAdaptersChapter(docModel, PROFILE_ADMIN);
			}
			case 'rooms': {
				if (this.adminChapterHidden(docModel, 'rooms')) {
					return '';
				}
				return this.renderRoomsChapter(docModel, PROFILE_ADMIN);
			}
			case 'scripts': {
				if (this.adminChapterHidden(docModel, 'scripts')) {
					return '';
				}
				return this.renderScriptsChapter(docModel, PROFILE_ADMIN);
			}
			case 'schedule': {
				if (
					this.adminChapterHidden(docModel, 'schedule') ||
					!docModel.scheduleObjects ||
					docModel.scheduleObjects.length === 0
				) {
					return '';
				}
				return this.renderScheduleObjectsChapter(docModel);
			}
			case 'userdata': {
				if (
					this.adminChapterHidden(docModel, 'userdata') ||
					!docModel.userData ||
					docModel.userData.length === 0
				) {
					return '';
				}
				return this.renderUserDataMarkdown(docModel.userData);
			}
			case 'aliases': {
				if (
					this.adminChapterHidden(docModel, 'aliases') ||
					!docModel.aliases ||
					docModel.aliases.length === 0
				) {
					return '';
				}
				return this.renderAliasMarkdown(docModel.aliases);
			}
			case 'maintenance': {
				if (this.adminChapterHidden(docModel, 'maintenance')) {
					return '';
				}
				return this.renderMaintenanceChapter(docModel);
			}
			case 'troubleshooting': {
				if (this.adminChapterHidden(docModel, 'troubleshooting')) {
					return '';
				}
				return this.renderTroubleshooting(docModel, PROFILE_ADMIN);
			}
			case 'appendices': {
				if (this.adminChapterHidden(docModel, 'appendices')) {
					return '';
				}
				return this.renderAppendices(docModel);
			}
			case 'custom': {
				return this.renderCustomSectionsMarkdown(docModel, PROFILE_ADMIN);
			}
			case 'diagnosis': {
				if (this.adminChapterHidden(docModel, 'diagnosis')) {
					return '';
				}
				return this.renderDiagnosis(docModel);
			}
			case 'changelog':
				return '';
			default:
				return '';
		}
	}

	/**
	 * One numbered TOC line for admin profile, or null if the chapter is omitted (hidden or no MD for key).
	 *
	 * @param {object} docModel
	 * @param {(k: string) => boolean} h
	 * @param {string} key
	 * @param {number} n
	 * @returns {string | null}
	 */
	buildAdminTocLineForKey(docModel, h, key, n) {
		const i18n = this.i18n;
		switch (key) {
			case 'manual': {
				if (h('manual') || !this.manualContextHasPublicFields(docModel)) {
					return null;
				}
				return `${n}. [${i18n.t('manualInformation')}](#manual-information)`;
			}
			case 'system': {
				if (h('system')) {
					return null;
				}
				return `${n}. [${i18n.t('systemOverview')}](#system-overview)`;
			}
			case 'adapters': {
				if (h('adapters')) {
					return null;
				}
				return `${n}. [${i18n.t('adapterInstances')}](#adapter-instances)`;
			}
			case 'rooms': {
				if (h('rooms')) {
					return null;
				}
				return `${n}. [${i18n.t('roomsAndFunctions')}](#rooms-and-functions)`;
			}
			case 'scripts': {
				if (h('scripts')) {
					return null;
				}
				const scriptsData = docModel.scripts || {};
				const scriptList = scriptsData.scripts || [];
				const scriptsWithRefs = scriptList.filter(s => s.stateRefs && s.stateRefs.length > 0);
				const sharedStates = (scriptsData.stateCrossRef || []).filter(e => e.scripts && e.scripts.length > 1);
				const sub = [];
				if (scriptsWithRefs.length > 0) {
					sub.push(`   - [${i18n.t('stateReferences')}](#state-references)`);
				}
				if (sharedStates.length > 0) {
					sub.push(`   - [${i18n.t('sharedStates')}](#shared-states)`);
				}
				return [`${n}. [${i18n.t('scripts')}](#scripts)`, ...sub].filter(Boolean).join('\n');
			}
			case 'schedule': {
				if (h('schedule') || !docModel.scheduleObjects || docModel.scheduleObjects.length === 0) {
					return null;
				}
				return `${n}. [${i18n.t('scheduleTypeObjects')}](#schedule-type-objects)`;
			}
			case 'userdata': {
				if (h('userdata') || !docModel.userData || docModel.userData.length === 0) {
					return null;
				}
				return `${n}. [${i18n.t('userDefinedVariables')}](#userdata)`;
			}
			case 'aliases': {
				if (h('aliases') || !docModel.aliases || docModel.aliases.length === 0) {
					return null;
				}
				return `${n}. [${i18n.t('aliases')}](#aliases)`;
			}
			case 'maintenance': {
				if (h('maintenance')) {
					return null;
				}
				return `${n}. [${i18n.t('maintenance')}](#maintenance)`;
			}
			case 'troubleshooting': {
				if (h('troubleshooting')) {
					return null;
				}
				return `${n}. [Troubleshooting](#troubleshooting)`;
			}
			case 'appendices': {
				if (h('appendices')) {
					return null;
				}
				return `${n}. [${i18n.t('appendices')}](#appendices)`;
			}
			case 'custom': {
				const customRows = (docModel && docModel.customDocSections) || [];
				const customForProfile = customRows.filter(
					s => !s.profiles || !s.profiles.length || s.profiles.includes(PROFILE_ADMIN),
				);
				if (!customForProfile.length || h('custom')) {
					return null;
				}
				return `${n}. [${i18n.t('customDocSectionsTitle') || 'Custom sections'}](#custom-doc-sections)`;
			}
			case 'diagnosis': {
				if (h('diagnosis')) {
					return null;
				}
				return `${n}. [${i18n.t('diagnosis')}](#diagnosis)`;
			}
			case 'changelog':
				return null;
			default:
				return null;
		}
	}

	/**
	 * One numbered TOC line for User profile, or null if the chapter is omitted.
	 *
	 * @param {object} docModel
	 * @param {string} key
	 * @param {number} n Current number
	 * @param {object[]} customForProfile Pre-filtered custom sections for this profile
	 * @returns {string | null}
	 */
	buildUserTocLineForKey(docModel, key, n, customForProfile) {
		const i18n = this.i18n;
		const h = k => this.userChapterHidden(docModel, k);
		switch (key) {
			case 'atAGlance':
				if (h('atAGlance') || !(docModel.quickStart && docModel.quickStart.hasContent)) {
					return null;
				}
				return `${n}. [${i18n.t('atAGlanceTitle')}](#at-a-glance)`;
			case 'manual':
				if (!this.manualContextVisibleForMarkdown(docModel, PROFILE_USER)) {
					return null;
				}
				return `${n}. [${i18n.t('manualInformation')}](#manual-information)`;
			case 'mermaid':
			case 'guestHelp':
			case 'routines':
			case 'ownerPlaybook':
				return null; // part of 'manual'
			case 'ai':
				return null; // rendered in header area, not in numbered TOC
			case 'system':
				if (h('system')) {
					return null;
				}
				return `${n}. [${i18n.t('systemOverview')}](#system-overview)`;
			case 'adapters':
				if (h('adapters')) {
					return null;
				}
				return `${n}. [${i18n.t('adapterInstances')}](#adapter-instances)`;
			case 'rooms':
				if (h('rooms')) {
					return null;
				}
				return `${n}. [${i18n.t('roomsAndFunctions')}](#rooms-and-functions)`;
			case 'scripts': {
				if (h('scripts')) {
					return null;
				}
				const scriptsData = docModel.scripts || {};
				const scriptList = scriptsData.scripts || [];
				const scriptsWithRefs = scriptList.filter(s => s.stateRefs && s.stateRefs.length > 0);
				const sharedStates = (scriptsData.stateCrossRef || []).filter(e => e.scripts && e.scripts.length > 1);
				const sub = [];
				if (scriptsWithRefs.length > 0) {
					sub.push(`   - [${i18n.t('stateReferences')}](#state-references)`);
				}
				if (sharedStates.length > 0) {
					sub.push(`   - [${i18n.t('sharedStates')}](#shared-states)`);
				}
				return [`${n}. [${i18n.t('scripts')}](#scripts)`, ...sub].filter(Boolean).join('\n');
			}
			case 'troubleshooting':
				if (h('troubleshooting')) {
					return null;
				}
				return `${n}. [Troubleshooting](#troubleshooting)`;
			case 'custom':
				if (!customForProfile.length || h('custom')) {
					return null;
				}
				return `${n}. [${i18n.t('customDocSectionsTitle') || 'Custom sections'}](#custom-doc-sections)`;
			default:
				return null;
		}
	}

	/**
	 * One numbered TOC line for Onboarding profile, or null if the chapter is omitted.
	 *
	 * @param {object} docModel
	 * @param {string} key
	 * @param {number} n Current number
	 * @param {object[]} customForProfile Pre-filtered custom sections for this profile
	 * @returns {string | null}
	 */
	buildOnboardingTocLineForKey(docModel, key, n, customForProfile) {
		const i18n = this.i18n;
		const h = k => this.onboardingChapterHidden(docModel, k);
		switch (key) {
			case 'welcome':
				return null; // part of header
			case 'ai':
				return null; // rendered in header area, not in numbered TOC
			case 'quickstart':
				if (h('quickstart')) {
					return null;
				}
				return `${n}. [${i18n.t('quickStart')}](#quick-start)`;
			case 'system':
				if (h('system')) {
					return null;
				}
				return `${n}. [${i18n.t('systemOverview')}](#system-overview)`;
			case 'adapters':
				if (h('adapters')) {
					return null;
				}
				return `${n}. [${i18n.t('adapterInstances')}](#adapter-instances)`;
			case 'manual':
				if (!this.manualContextVisibleForMarkdown(docModel, PROFILE_ONBOARDING)) {
					return null;
				}
				return `${n}. [${i18n.t('manualInformation')}](#manual-information)`;
			case 'mermaid':
			case 'guestHelp':
			case 'routines':
			case 'ownerPlaybook':
				return null; // part of 'manual'
			case 'custom':
				if (!customForProfile.length || h('custom')) {
					return null;
				}
				return `${n}. [${i18n.t('customDocSectionsTitle') || 'Custom sections'}](#custom-doc-sections)`;
			default:
				return null;
		}
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
			const order = (docModel && docModel.onboardingChapterOrder) || ONBOARDING_HTML_CHAPTER_KEYS;
			const lines = [];
			let n = 1;
			for (const k of order) {
				const line = this.buildOnboardingTocLineForKey(docModel, k, n, customForProfile);
				if (line) {
					lines.push(line);
					n += 1;
				}
			}
			toc += `${lines.join('\n')}\n`;
			const oh = k => this.onboardingChapterHidden(docModel, k);
			if (customToc && !oh('custom')) {
				toc += `\n${i18n.t('customDocSectionsTitle') || 'Custom sections'}:\n${customToc}\n`;
			}
		} else if (profile === PROFILE_USER) {
			const order = (docModel && docModel.userChapterOrder) || USER_HTML_CHAPTER_KEYS;
			const lines = [];
			let n = 1;
			for (const k of order) {
				const line = this.buildUserTocLineForKey(docModel, k, n, customForProfile);
				if (line) {
					lines.push(line);
					n += 1;
				}
			}
			toc += `${lines.join('\n')}\n`;
			const uh = k => this.userChapterHidden(docModel, k);
			if (customToc && !uh('custom')) {
				toc += `\n${i18n.t('customDocSectionsTitle') || 'Custom sections'}:\n${customToc}\n`;
			}
		} else {
			// PROFILE_ADMIN — mirror {@link #renderAdminMarkdownKey} / HTML chapter order
			const order = (docModel && docModel.adminChapterOrder) || DEFAULT_ADMIN_CHAPTER_ORDER;
			const lines = [];
			let n = 1;
			for (const k of order) {
				const line = this.buildAdminTocLineForKey(docModel, h, k, n);
				if (line) {
					lines.push(line);
					n += 1;
				}
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
	 * @param {object} item — quick start system line descriptor
	 * @param {boolean} [forOnboardingGuest] When true, apply guest privacy for script lines.
	 * @returns {string}
	 */
	_formatQuickStartSystemLine(item, forOnboardingGuest) {
		const i18n = this.i18n;
		if (!item || !item.kind) {
			return '';
		}
		if (forOnboardingGuest && item.kind === 'script' && !onboardingGuestShowsScriptNames(this.adapter.config)) {
			return '';
		}
		switch (item.kind) {
			case 'roomCount':
				return i18n.t('qsRoomCount', item.n);
			case 'function':
				return i18n.t('qsFunctionRow', item.name, item.memberCount);
			case 'script':
				return i18n.t('qsScriptRow', item.name, item.desc);
			default:
				return '';
		}
	}

	/**
	 * User profile — same `quickStart` model as Onboarding (Markdown anchor matches HTML id).
	 *
	 * @param {object} docModel Document model
	 * @returns {string} Markdown
	 */
	renderUserAtAGlanceMarkdown(docModel) {
		const i18n = this.i18n;
		const qs = docModel.quickStart || { hasContent: false, systemItems: [], roomGuides: [] };
		if (!qs.hasContent) {
			return '';
		}
		const showRoomsLink = (qs.roomGuides || []).length > 0 && !this.userChapterHidden(docModel, 'rooms');
		const roomsCrossMd = showRoomsLink
			? `${i18n.t('qsSeeFullRoomsBefore')}[${i18n.t('roomsAndFunctions')}](#rooms-and-functions)${i18n.t('qsSeeFullRoomsAfter')}\n\n`
			: '';
		const sysBullets = (qs.systemItems || [])
			.map(it => {
				const line = this._formatQuickStartSystemLine(it, false);
				return line ? `- ${mdEscapePlainLine(line)}` : '';
			})
			.filter(Boolean)
			.join('\n');
		const roomBits = (qs.roomGuides || [])
			.map(rg => {
				const head = `#### ${mdEscapePlainLine(rg.name)} (${i18n.t('qsRoomCardDevices', rg.deviceCount)})`;
				const hi = (rg.highlights || [])
					.map(h => {
						const val = h.valueText ? ` — ${mdEscapePlainLine(h.valueText)}` : '';
						return `- ${h.icon || '📦'} **${mdEscapeBoldInner(h.deviceName)}**${val}`;
					})
					.join('\n');
				return `${head}\n\n${hi}`;
			})
			.join('\n\n');
		let md = `## ${i18n.t('atAGlanceTitle')}

<a id="at-a-glance"></a>

${i18n.t('atAGlanceIntro')}

${roomsCrossMd}`;
		if (sysBullets) {
			md += `### ${i18n.t('qsSystemTitle')}

${sysBullets}

`;
		}
		if (roomBits) {
			md += `### ${i18n.t('qsRoomGuidesTitle')}

${roomBits}

`;
		}
		md += '---\n\n';
		return md;
	}

	/**
	 * Render quick start section for Onboarding profile
	 *
	 * @param {object} docModel Document model
	 * @returns {string} Quick start markdown
	 */
	renderQuickStart(docModel) {
		const i18n = this.i18n;
		const system = docModel.system;
		const stats = system.statistics;
		const fullQs = docModel.quickStart || { hasContent: false, systemItems: [], roomGuides: [] };
		const qs = sliceQuickStartForOnboarding(fullQs);

		let structured = '';
		if (qs.hasContent) {
			const sysBullets = (qs.systemItems || [])
				.map(it => {
					const line = this._formatQuickStartSystemLine(it, true);
					return line ? `- ${mdEscapePlainLine(line)}` : '';
				})
				.filter(Boolean)
				.join('\n');
			const roomBits = (qs.roomGuides || [])
				.map(rg => {
					const head = `#### ${mdEscapePlainLine(rg.name)} (${i18n.t('qsRoomCardDevices', rg.deviceCount)})`;
					const hi = (rg.highlights || [])
						.map(h => {
							const val = h.valueText ? ` — ${mdEscapePlainLine(h.valueText)}` : '';
							return `- ${h.icon || '📦'} **${mdEscapeBoldInner(h.deviceName)}**${val}`;
						})
						.join('\n');
					return `${head}\n\n${hi}`;
				})
				.join('\n\n');
			const parts = [i18n.t('quickStartStructuredIntro')];
			if (sysBullets) {
				parts.push(`### ${i18n.t('qsSystemTitle')}\n\n${sysBullets}`);
			}
			if (roomBits) {
				parts.push(`### ${i18n.t('qsRoomGuidesTitle')}\n\n${roomBits}`);
			}
			structured = `${parts.join('\n\n')}\n\n`;
		}

		return `## ${i18n.t('quickStart')}

<a id="quick-start"></a>

${i18n.t('quickStartWelcome')}

${structured}
### ${i18n.t('systemStatistics')}
- **${i18n.t('activeAdapters')}:** ${stats.enabledInstanceCount}
- **${i18n.t('totalInstances')}:** ${stats.instanceCount}

### ${i18n.t('nextSteps')}
1. ${i18n.t('nextStepsOnboarding1')}
2. ${i18n.t('nextStepsOnboarding2')}
3. ${i18n.t('nextStepsOnboarding3')}

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
- **${i18n.t('hostRuntimePlatform')}:** ${system.primaryHost.platform}
- **${i18n.t('version')}:** ${system.primaryHost.version}
${system.primaryHost.nodeVersion ? `- **${i18n.t('nodeVersion')}:** ${system.primaryHost.nodeVersion}` : ''}
${system.primaryHost.npmVersion ? `- **${i18n.t('npmVersion')}:** ${system.primaryHost.npmVersion}` : ''}
${system.primaryHost.operatingSystem ? `- **${i18n.t('operatingSystem')}:** ${system.primaryHost.operatingSystem}` : ''}

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
		const osLine = formatOperatingSystemLine(host);
		let line = `- **${host.name}** — ${i18n.t('hostRuntimePlatform')}: ${host.platform}, ${i18n.t('operatingSystem')}: ${osLine || '—'} — js-controller ${host.version}`;
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
		const totalInstances = adapters.adapters.reduce((sum, a) => sum + a.totalInstances, 0);

		let markdown = `## ${i18n.t('adapterInstances')}

- **${i18n.t('totalAdapters')}:** ${adapters.totalAdapters}
- **${i18n.t('totalInstances')}:** ${totalInstances}

`;

		if (profile === PROFILE_ADMIN) {
			const enabledAdapters = adapters.adapters.filter(a => a.enabledInstances > 0);
			const disabledAdapters = adapters.adapters.filter(a => a.enabledInstances === 0);

			const sectionLabel = `${i18n.t('adapterDetails')} (${enabledAdapters.length}\u00a0${i18n.t('enabledShort')}${disabledAdapters.length > 0 ? `, ${disabledAdapters.length}\u00a0${i18n.t('disabled')}` : ''})`;
			markdown += `<details>\n<summary><strong>${sectionLabel}</strong></summary>\n\n`;
			// Compact overview table
			markdown += `| ${i18n.t('name')} | ${i18n.t('description')} | | ${i18n.t('totalInstances')} / ${i18n.t('enabledShort')} |\n`;
			markdown += `|---|---|---|---|\n`;
			for (const adapter of enabledAdapters) {
				const displayName =
					adapter.title && adapter.title !== adapter.name
						? `**${adapter.title}** \`${adapter.name}\``
						: `**${adapter.name}**`;
				const badges = [];
				if (adapter.connectionType && adapter.connectionType !== 'none' && adapter.connectionType !== '') {
					badges.push(
						adapter.connectionType === 'local'
							? i18n.t('connTypeLocal')
							: adapter.connectionType === 'cloud'
								? i18n.t('connTypeCloud')
								: adapter.connectionType,
					);
				}
				if (
					adapter.dataSource &&
					adapter.dataSource !== 'none' &&
					adapter.dataSource !== '' &&
					adapter.dataSource !== 'assumption'
				) {
					badges.push(
						adapter.dataSource === 'push'
							? i18n.t('dataPush')
							: adapter.dataSource === 'poll'
								? i18n.t('dataPoll')
								: adapter.dataSource,
					);
				}
				if (adapter.tier) {
					badges.push(
						adapter.tier === 1
							? i18n.t('tierStable')
							: adapter.tier === 2
								? i18n.t('tierTested')
								: i18n.t('tierExperimental'),
					);
				}
				const badgeStr = badges.length > 0 ? badges.join(' · ') : '';
				const desc = adapter.desc || '—';
				markdown += `| ${displayName} | ${desc} | ${badgeStr} | ${adapter.totalInstances} / ${adapter.enabledInstances} |\n`;
			}
			markdown += '\n';

			// Instance details for enabled adapters
			if (!config.hideInstanceDetailsInMarkdown) {
				for (const adapter of enabledAdapters) {
					const displayName =
						adapter.title && adapter.title !== adapter.name
							? `${adapter.title} (\`${adapter.name}\`)`
							: `\`${adapter.name}\``;
					markdown += `#### ${displayName}\n`;
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
						markdown += `  - ${bits.join(' — ')}\n`;
					}
					const manualNote =
						docModel.manualContext &&
						docModel.manualContext.adapters &&
						docModel.manualContext.adapters[adapter.name];
					if (manualNote) {
						markdown += `\n  > ${manualNote}\n`;
					}
					markdown += '\n';
				}
			}

			// Disabled adapters in collapsible block
			if (disabledAdapters.length > 0) {
				const disabledLabel = i18n.t('disabledAdaptersGroup').replace('{0}', disabledAdapters.length);
				markdown += `<details>\n<summary>${disabledLabel}</summary>\n\n`;
				markdown += `| ${i18n.t('name')} | ${i18n.t('description')} | | ${i18n.t('totalInstances')} |\n`;
				markdown += `|---|---|---|---|\n`;
				for (const adapter of disabledAdapters) {
					const displayName =
						adapter.title && adapter.title !== adapter.name
							? `**${adapter.title}** \`${adapter.name}\``
							: `**${adapter.name}**`;
					const badges = [];
					if (adapter.connectionType && adapter.connectionType !== 'none' && adapter.connectionType !== '') {
						badges.push(
							adapter.connectionType === 'local'
								? i18n.t('connTypeLocal')
								: adapter.connectionType === 'cloud'
									? i18n.t('connTypeCloud')
									: adapter.connectionType,
						);
					}
					if (
						adapter.dataSource &&
						adapter.dataSource !== 'none' &&
						adapter.dataSource !== '' &&
						adapter.dataSource !== 'assumption'
					) {
						badges.push(
							adapter.dataSource === 'push'
								? i18n.t('dataPush')
								: adapter.dataSource === 'poll'
									? i18n.t('dataPoll')
									: adapter.dataSource,
						);
					}
					if (adapter.tier) {
						badges.push(
							adapter.tier === 1
								? i18n.t('tierStable')
								: adapter.tier === 2
									? i18n.t('tierTested')
									: i18n.t('tierExperimental'),
						);
					}
					const badgeStr = badges.length > 0 ? badges.join(' · ') : '';
					const desc = adapter.desc || '—';
					markdown += `| ${displayName} | ${desc} | ${badgeStr} | ${adapter.totalInstances} |\n`;
				}
				markdown += `\n</details>\n\n`;
			}
			markdown += `\n</details>\n\n`;
		} else if (profile === PROFILE_USER) {
			// User: compact table — active adapters only, description prominent
			const activeCount = adapters.adapters.filter(a => a.enabledInstances > 0).length;
			const userLabel = `${i18n.t('adapterDetails')} (${activeCount}\u00a0${i18n.t('enabledShort')})`;
			markdown += `<details>\n<summary><strong>${userLabel}</strong></summary>\n\n`;
			markdown += `| ${i18n.t('name')} | ${i18n.t('description')} |\n`;
			markdown += `|---|---|\n`;
			for (const adapter of adapters.adapters) {
				if (adapter.enabledInstances === 0) {
					continue;
				}
				const displayName = adapter.title && adapter.title !== adapter.name ? adapter.title : adapter.name;
				const desc = adapter.desc || '—';
				const manualNote =
					docModel.manualContext &&
					docModel.manualContext.adapters &&
					docModel.manualContext.adapters[adapter.name]
						? ` — _${docModel.manualContext.adapters[adapter.name]}_`
						: '';
				markdown += `| **${displayName}** | ${desc}${manualNote} |\n`;
			}
			markdown += `\n</details>\n\n`;
		} else if (profile === PROFILE_ONBOARDING) {
			// Onboarding: simple bullet list, welcoming tone
			const obCount = adapters.adapters.filter(a => a.enabledInstances > 0).length;
			const obLabel = `${i18n.t('adapterDetails')} (${obCount}\u00a0${i18n.t('enabledShort')})`;
			markdown += `<details>\n<summary><strong>${obLabel}</strong></summary>\n\n`;
			for (const adapter of adapters.adapters) {
				if (adapter.enabledInstances === 0) {
					continue;
				}
				const displayName = adapter.title && adapter.title !== adapter.name ? adapter.title : adapter.name;
				const desc = adapter.desc ? ` — ${adapter.desc}` : '';
				markdown += `- **${displayName}**${desc}\n`;
			}
			markdown += `\n</details>\n\n`;
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

<a id="scripts"></a>

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
				}
				markdown += '\n';
			};

			if (profile === PROFILE_ADMIN) {
				markdown += `${i18n.t('scriptsByFolderIntro')}\n\n`;
				for (const g of groupScriptsByFolder(list)) {
					const folderTitle = g.folder == null ? i18n.t('scriptFolderRoot') : g.folder;
					const count = g.scripts.length;
					markdown += '<details>\n<summary>';
					markdown += `**${folderTitle}** (${count})`;
					markdown += '</summary>\n\n';
					if (isGlobalFolderKey(g.folderKey)) {
						markdown += `*${i18n.t('scriptsGlobalFolderHint')}*\n\n`;
					}
					for (const script of g.scripts) {
						emitScript(script);
					}
					markdown += '\n</details>\n\n';
				}

				const scriptsWithRefs = list.filter(s => s.stateRefs && s.stateRefs.length > 0);
				if (scriptsWithRefs.length > 0) {
					const refTotal = scriptsWithRefs.reduce(
						(n, s) => n + (s.stateRefs && s.stateRefs.length ? s.stateRefs.length : 0),
						0,
					);
					markdown += `<a id="state-references"></a>\n\n### ${i18n.t('stateReferences')}\n\n`;
					markdown += `${i18n.t('stateReferencesDesc')}\n\n`;
					markdown += '<details>\n<summary>';
					markdown += i18n.t('stateReferencesExpandSummary', scriptsWithRefs.length, refTotal);
					markdown += '</summary>\n\n';
					markdown += `| ${i18n.t('script')} | ${i18n.t('scriptDescription')} | ${i18n.t('referencedStates')} |\n|---|---|---|\n`;
					for (const script of scriptsWithRefs) {
						const folderLbl = this.scriptFolderLabel(script.folder);
						const nameCell = mdTableCell(`${script.name} (${folderLbl})`);
						const descRaw = script.desc && String(script.desc).trim();
						const descCell = mdTableCell(descRaw || '—');
						const refs = (script.stateRefs || []).map(r => `\`${mdTableCell(r)}\``).join(', ');
						markdown += `| ${nameCell} | ${descCell} | ${refs} |\n`;
					}
					markdown += '\n</details>\n\n';
				}

				const sharedStates = (scriptsData.stateCrossRef || []).filter(e => e.scripts && e.scripts.length > 1);
				if (sharedStates.length > 0) {
					markdown += `<a id="shared-states"></a>\n\n### ${i18n.t('sharedStates')}\n\n`;
					markdown += `${i18n.t('sharedStatesDesc')}\n\n`;
					markdown += '<details>\n<summary>';
					markdown += i18n.t('sharedStatesExpandSummary', sharedStates.length);
					markdown += '</summary>\n\n';
					markdown += `| ${i18n.t('stateId')} | ${i18n.t('usedByScripts')} |\n|---|---|\n`;
					for (const entry of sharedStates) {
						const scriptsCol = mdTableCell(entry.scripts.join(', '));
						markdown += `| \`${mdTableCell(entry.stateId)}\` | ${scriptsCol} |\n`;
					}
					markdown += '\n</details>\n\n';
				}
			} else {
				for (const script of list) {
					emitScript(script);
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
		let md = `<a id="schedule-type-objects"></a>\n\n## ${i18n.t('scheduleTypeObjects')}\n\n${i18n.t('scheduleTypeObjectsIntro')}\n\n`;
		md += `| ${i18n.t('name')} | ${i18n.t('description')} | ${i18n.t('scriptStatus')} |\n|---|---|---|\n`;
		for (const s of list) {
			const st = s.enabled ? i18n.t('active') : i18n.t('inactive');
			md += `| \`${s.id}\` **${s.name}** | ${(s.desc || '—').replace(/\|/g, '\\|')} | ${st} |\n`;
		}
		md += '\n---\n';
		return md;
	}

	/**
	 * Markdown block: auto documentation links + optional quick-fact lines (Phase 5.x.1).
	 *
	 * @param {object} manualContext
	 * @param {boolean} includeAdmin Include link to admin HTML (Markdown export for Admin profile)
	 * @param {'admin'|'user'|'onboarding'|null} [omitLinkForProfile] Same as HTML: no self-link to the current export profile
	 * @returns {string}
	 */
	renderTroubleshootGuestMarkdown(manualContext, includeAdmin, omitLinkForProfile = null) {
		const i18n = this.i18n;
		const t = v => v && String(v).trim();
		let out = '';
		const pl = manualContext && manualContext.troubleshootPublicLinks;
		if (pl) {
			const items = [];
			if (includeAdmin && t(pl.admin) && omitLinkForProfile !== 'admin') {
				items.push(`- [${i18n.t('troubleshootLinkAdmin')}](${pl.admin})`);
			}
			if (t(pl.user) && omitLinkForProfile !== 'user' && omitLinkForProfile !== 'onboarding') {
				items.push(`- [${i18n.t('troubleshootLinkUser')}](${pl.user})`);
			}
			if (t(pl.onboarding) && omitLinkForProfile !== 'onboarding') {
				items.push(`- [${i18n.t('troubleshootLinkOnboarding')}](${pl.onboarding})`);
			}
			if (items.length) {
				out += `#### ${i18n.t('troubleshootPublicLinksHeading')}

_${i18n.t('troubleshootPublicLinksIntro')}_

${items.join('\n')}

`;
			}
		}
		const rows = [
			[i18n.t('troubleshootWifiLabel'), t(manualContext && manualContext.troubleshootWifiHint)],
			[i18n.t('troubleshootPowerLabel'), t(manualContext && manualContext.troubleshootPowerHint)],
			[i18n.t('troubleshootWaterLabel'), t(manualContext && manualContext.troubleshootWaterHint)],
			[i18n.t('troubleshootExtraLabel'), t(manualContext && manualContext.troubleshootExtraHint)],
		].filter(([, v]) => v);
		if (rows.length) {
			out += `#### ${i18n.t('troubleshootQuickFactsTitle')}

`;
			for (const [label, value] of rows) {
				out += `- **${label}** ${value}\n`;
			}
			out += '\n';
		}
		return out;
	}

	/**
	 * Family-facing checklist when Admin diagnosis would flag the Node.js runtime.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} Markdown fragment or empty
	 */
	renderDiagnosisSnapshotMarkdown(docModel) {
		if (!hasFamilyDiagnosisSnapshot(docModel)) {
			return '';
		}
		const i18n = this.i18n;
		const nv = (docModel.system && docModel.system.primaryHost && docModel.system.primaryHost.nodeVersion) || '—';
		return `#### ${i18n.t('troubleshootSnapshotNodeTitle')}

_${i18n.t('troubleshootSnapshotDisclaimer')}_

\`${String(nv)}\`

1. ${i18n.t('troubleshootSnapshotNodeStep1')}
2. ${i18n.t('troubleshootSnapshotNodeStep2')}
3. ${i18n.t('troubleshootSnapshotNodeStep3')}

`;
	}

	/**
	 * Render manual context chapter
	 *
	 * @param {object} manualContext Manual context from config
	 * @param {{ skipManualCore?: boolean, skipMermaid?: boolean, skipMermaidAuto?: boolean, skipGuestHelp?: boolean, skipRoutines?: boolean, skipOwnerPlaybook?: boolean }} [skip]
	 * @param {{ adminTroubleshootLinks?: boolean, docModelForSnapshot?: object, troubleshootOmitProfile?: 'admin'|'user'|'onboarding'|null }} [options] Admin Markdown: bookmark list; optional `docModelForSnapshot` for family diagnosis checklist; `troubleshootOmitProfile` avoids self-link for that export profile
	 * @returns {string} Manual context markdown
	 */
	renderManualContext(manualContext, skip = {}, options = {}) {
		const sk = {
			skipManualCore: false,
			skipMermaid: false,
			skipMermaidAuto: false,
			skipGuestHelp: false,
			skipRoutines: false,
			skipOwnerPlaybook: false,
			...skip,
		};
		const i18n = this.i18n;
		const includeAdminLinks = options.adminTroubleshootLinks === true;
		const omitProfile = options.troubleshootOmitProfile == null ? null : options.troubleshootOmitProfile;
		const snapModel = options.docModelForSnapshot;
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

		if (!sk.skipGuestHelp) {
			const ts = this.renderTroubleshootGuestMarkdown(manualContext, includeAdminLinks, omitProfile);
			if (ts) {
				parts.push(ts);
			}
			if (snapModel) {
				const snap = this.renderDiagnosisSnapshotMarkdown(snapModel);
				if (snap) {
					parts.push(snap);
				}
			}
			if (manualContext.guestHelpNote && String(manualContext.guestHelpNote).trim()) {
				parts.push(`### ${i18n.t('guestHelpTitle')}
${manualContext.guestHelpNote}

`);
			}
		}

		if (!sk.skipRoutines && manualContext.homeRoutinesNote && String(manualContext.homeRoutinesNote).trim()) {
			parts.push(`### ${i18n.t('homeRoutinesTitle')}
_${i18n.t('homeRoutinesIntro')}_

${manualContext.homeRoutinesNote}

`);
		}

		if (
			!sk.skipOwnerPlaybook &&
			manualContext.ownerPlaybookNote &&
			String(manualContext.ownerPlaybookNote).trim()
		) {
			parts.push(`### ${i18n.t('ownerPlaybookTitle')}
_${i18n.t('ownerPlaybookIntro')}_

${manualContext.ownerPlaybookNote}

`);
		}

		if (!sk.skipMermaid && manualContext.mermaidDiagram && String(manualContext.mermaidDiagram).trim()) {
			const src = String(manualContext.mermaidDiagram).trim();
			parts.push(`### ${i18n.t('mermaidDiagramTitle')}

\`\`\`mermaid
${src}
\`\`\`

`);
		}

		if (
			!sk.skipMermaidAuto &&
			manualContext.autoHostTopologyMermaid &&
			String(manualContext.autoHostTopologyMermaid).trim()
		) {
			parts.push(`### ${i18n.t('mermaidAutoTopologyTitle')}

> *${i18n.t('mermaidAutoTopologyMdHint') || 'Auto-Topologie nur im HTML-Export verfügbar (Admin-Profil).'}*

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
	 * @param {object} docModel Document model (Admin manual / Markdown)
	 * @returns {boolean}
	 */
	manualContextHasPublicFields(docModel) {
		const mc = docModel && docModel.manualContext;
		if (!mc) {
			return false;
		}
		const t = v => v && String(v).trim();
		return !!(
			t(mc.description) ||
			t(mc.contact) ||
			t(mc.notes) ||
			t(mc.mermaidDiagram) ||
			t(mc.autoHostTopologyMermaid) ||
			t(mc.homeRoutinesNote) ||
			t(mc.ownerPlaybookNote) ||
			guestHelpChapterHasContent(mc, docModel, null)
		);
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
			projectNarrativeThin: i18n.t('checklistProjectNarrative'),
			baseUrlUnset: i18n.t('checklistBaseUrlUnset'),
			instancesWithoutRoom: i18n.t('instancesWithoutRoom'),
			checkHostsFound: i18n.t('checkHostsFound'),
			checkInstancesFound: i18n.t('checkInstancesFound'),
			checkRoomsDefined: i18n.t('checkRoomsDefined'),
			checkContactSet: i18n.t('checkContactSet'),
			checkCustomContent: i18n.t('checkCustomContent'),
			checkHasDiagram: i18n.t('checkHasDiagram'),
			checkRoomsHaveDevices: i18n.t('checkRoomsHaveDevices'),
		};

		/**
		 * @param {Array<{key:string,ok:boolean,count?:number}>} checks
		 * @param {number} score
		 * @param {string} title
		 * @param {string} desc
		 * @returns {string}
		 */
		const renderDimension = (checks, score, title, desc) => {
			let s = `#### ${title} — ${score}%\n`;
			if (desc) s += `_${desc}_\n\n`;
			for (const item of checks) {
				const icon = item.ok ? '✅' : '⚠️';
				const label = checkLabels[item.key] || item.key;
				const countText =
					!item.ok && typeof item.count === 'number' && item.count > 0 ? ` (${item.count})` : '';
				s += `- ${icon} ${label}${countText}\n`;
			}
			return s + '\n';
		};

		let markdown = `## ${i18n.t('maintenance')}

### ${i18n.t('maintenanceChecklist')}

_${i18n.t('scoreDesc')}_

`;

		if (m.scores) {
			markdown += renderDimension(
				m.scores.data.checks,
				m.scores.data.score,
				i18n.t('scoreDimData'),
				i18n.t('scoreDimDataDesc'),
			);
			markdown += renderDimension(
				m.scores.manual.checks,
				m.scores.manual.score,
				i18n.t('scoreDimManual'),
				i18n.t('scoreDimManualDesc'),
			);
			markdown += renderDimension(
				m.scores.depth.checks,
				m.scores.depth.score,
				i18n.t('scoreDimDepth'),
				i18n.t('scoreDimDepthDesc'),
			);
		}

		markdown += `**${i18n.t('documentationScore')}: ${m.score}%**\n\n`;

		if (m.disabledInstances.length > 0) {
			markdown += `${i18n.t('disabledInstancesInventoryNote', m.disabledInstances.length)}\n\n`;
		}

		if (m.checklist.every(item => item.ok)) {
			markdown += `_${i18n.t('allGood')}_\n\n`;
		}

		if (m.disabledInstances.length > 0) {
			markdown += `### ${i18n.t('disabledInstancesHint')}\n`;
			for (const inst of m.disabledInstances) {
				markdown += `- \`${inst.id}\`${inst.title && inst.title !== inst.name ? ` — ${inst.title}` : ''}\n`;
			}
			markdown += '\n';
		}

		markdown += '---\n';
		return markdown;
	}

	/**
	 * Render diagnosis section for Admin profile (Markdown parity with htmlRenderer.renderDiagnosis).
	 * Omits interactive elements (forum copy button, JS); otherwise mirrors scan status + findings.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} Diagnosis markdown
	 */
	renderDiagnosis(docModel) {
		const i18n = this.i18n;
		const system = docModel.system;
		const stats = system.statistics;
		const appendices = docModel.appendices;
		const primaryHostName = system.primaryHost.name;
		const hostRes = (system.hostResources || {})[primaryHostName] || {};

		/* RAM */
		let ramText = '—';
		if (hostRes.sysTotalMb && hostRes.sysFreeMb != null) {
			ramText = `${hostRes.sysTotalMb - hostRes.sysFreeMb} / ${hostRes.sysTotalMb} MB`;
		} else if (hostRes.adapterTotalMb) {
			ramText = `~${hostRes.adapterTotalMb} MB (${i18n.t('allAdapters') || 'alle Adapter'})`;
		} else if (hostRes.procMb) {
			ramText = `~${hostRes.procMb} MB (js-controller)`;
		}
		const cpuText = hostRes.cpu != null ? `${hostRes.cpu} %` : null;
		const activeRepo = (system.location && system.location.activeRepo) || '';

		/* Scan status rows */
		const rows = [
			[i18n.t('collectedAt'), new Date(appendices.collectionTimestamp).toLocaleString()],
			[
				i18n.t('instancesDetected'),
				`${stats.instanceCount} (${stats.enabledInstanceCount} ${i18n.t('diagActive')}, ${stats.disabledInstanceCount} ${i18n.t('diagInactive')})`,
			],
			[
				i18n.t('stateObjectsScanned'),
				`${appendices.stateSummary.total} (${appendices.stateSummary.writable} ${i18n.t('writable')}, ${appendices.stateSummary.readonly} ${i18n.t('readOnlyStates')})`,
			],
			[i18n.t('hostRuntimePlatform'), system.primaryHost.platform || '—'],
			[i18n.t('operatingSystem'), system.primaryHost.operatingSystem || '—'],
			[i18n.t('jsControllerVersion'), system.primaryHost.version || '—'],
			[i18n.t('nodeVersion'), system.primaryHost.nodeVersion || '—'],
			[i18n.t('npmVersion'), system.primaryHost.npmVersion || '—'],
			['RAM', ramText],
			...(cpuText ? [['CPU', cpuText]] : []),
			[i18n.t('hosts'), primaryHostName],
			...(activeRepo ? [[i18n.t('activeRepo') || 'Repository', activeRepo]] : []),
		];

		const tableRows = rows.map(([k, v]) => `| ${k} | ${v} |`).join('\n');

		/* Findings */
		const findings = [];
		if (isNodeVersionFlaggedForDiagnosis(system.primaryHost.nodeVersion)) {
			findings.push(i18n.t('nodeVersionOutdated').replace('{0}', system.primaryHost.nodeVersion));
		}
		findings.push(i18n.t('osUpdateHint'));
		const findingsMd = findings.map(f => `- ${f}`).join('\n');

		return `## ${i18n.t('diagnosis')} {#diagnosis}

### ${i18n.t('diagScanStatus')}

| ${i18n.t('diagWhatLabel')} | ${i18n.t('diagWhereLabel')} |
|---|---|
${tableRows}

### ${i18n.t('diagWhereToLook')}

| ${i18n.t('diagWhatLabel')} | ${i18n.t('diagWhereLabel')} |
|---|---|
| ${i18n.t('diagLogsLabel')} | ${i18n.t('diagLogsValue')} |
| ${i18n.t('diagAliveLabel')} | \`system.adapter.{name}.0.alive\` ${i18n.t('diagAliveHint')} |
| ${i18n.t('diagConnectedLabel')} | \`system.adapter.{name}.0.connected\` ${i18n.t('diagConnectedHint')} |

### ${i18n.t('diagFindings')}

${findingsMd}

---
`;
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
- ${i18n.t('hostRuntimePlatform')}: ${system.primaryHost.platform}
- ${i18n.t('operatingSystem')}: ${system.primaryHost.operatingSystem || '—'}
- ${i18n.t('jsControllerVersion')}: ${system.primaryHost.version}
- ${i18n.t('nodeVersion')}: ${system.primaryHost.nodeVersion || '—'}
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
	 * Admin: userdata chapter — collapsed details (parity with HTML export).
	 *
	 * @param {Array} userData
	 * @returns {string}
	 */
	renderUserDataMarkdown(userData) {
		const i18n = this.i18n;
		const groups = {};
		for (const item of userData) {
			const key = item.folder || '';
			if (!groups[key]) {
				groups[key] = [];
			}
			groups[key].push(item);
		}
		const totalItems = userData.length;
		const groupCount = Object.keys(groups).length;
		let md = `<a id="userdata"></a>\n\n## ${i18n.t('userDefinedVariables')}\n\n`;
		md += `${i18n.t('userDataDesc')}\n\n`;
		md += '<details>\n<summary>';
		md += i18n.t('userdataExpandSummary', totalItems, groupCount);
		md += '</summary>\n\n';
		for (const folder of Object.keys(groups).sort()) {
			const items = groups[folder];
			const label = folder || i18n.t('scriptFolderRoot');
			md += `### ${label} (${items.length})\n\n`;
			md += `| ${i18n.t('name')} | ${i18n.t('type')} | ${i18n.t('value')} | ${i18n.t('description')} |\n|---|---|---|---|\n`;
			for (const item of items) {
				const valStr = item.value !== null && item.value !== undefined ? String(item.value) : '—';
				const unit = item.unit ? ` ${item.unit}` : '';
				const typeLabel = item.type || '—';
				const roleLine = item.role ? ` (${item.role})` : '';
				const nameCol = mdTableCell(`${item.name}${roleLine}`);
				md += `| ${nameCol} | ${mdTableCell(typeLabel)} | ${mdTableCell(valStr + unit)} | ${mdTableCell(item.desc || '—')} |\n`;
			}
			md += '\n';
		}
		md += '</details>\n\n---\n\n';
		return md;
	}

	/**
	 * Admin: aliases chapter — collapsed details (parity with HTML export).
	 *
	 * @param {Array} aliases
	 * @returns {string}
	 */
	renderAliasMarkdown(aliases) {
		const i18n = this.i18n;
		const groups = {};
		for (const item of aliases) {
			const key = item.folder || '';
			if (!groups[key]) {
				groups[key] = [];
			}
			groups[key].push(item);
		}
		const totalItems = aliases.length;
		const groupCount = Object.keys(groups).length;
		let md = `<a id="aliases"></a>\n\n## ${i18n.t('aliases')}\n\n`;
		md += `${i18n.t('aliasesDesc')}\n\n`;
		md += '<details>\n<summary>';
		md += i18n.t('aliasesExpandSummary', totalItems, groupCount);
		md += '</summary>\n\n';
		for (const folder of Object.keys(groups).sort()) {
			const items = groups[folder];
			const label = folder || i18n.t('scriptFolderRoot');
			md += `### ${label} (${items.length})\n\n`;
			md += `| ${i18n.t('name')} | ${i18n.t('type')} | ${i18n.t('aliasTarget')} | ${i18n.t('description')} |\n|---|---|---|---|\n`;
			for (const item of items) {
				const target =
					item.readTarget === item.writeTarget || !item.writeTarget
						? item.readTarget || '—'
						: `${item.readTarget || '—'} / ✍ ${item.writeTarget}`;
				const typeStr = item.unit ? `${item.type} (${item.unit})` : item.type || '—';
				const roleLine = item.role ? ` (${item.role})` : '';
				const nameCol = mdTableCell(`${item.name}${roleLine}`);
				md += `| ${nameCol} | ${mdTableCell(typeStr)} | ${mdTableCell(target)} | ${mdTableCell(item.desc || '—')} |\n`;
			}
			md += '\n';
		}
		md += '</details>\n\n---\n\n';
		return md;
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
