/**
 * AutoDoc HTML Renderer Module
 * Renders document models to standalone HTML with navigation
 */
const PROFILE_ADMIN = 'admin';
const PROFILE_USER = 'user';

/**
 * Increment this string whenever the HTML template changes significantly.
 * main.js compares it with the stored state value and forces regeneration
 * if they differ — eliminating the need for version bumps as cache busters.
 * Format: YYYY.MM.DD.NN (NN = daily counter if multiple changes on same day)
 */
const RENDERER_VERSION = '2026.04.27.6';

/** Pattern source for client escRe — kept outside wrapPage `` ` `` so backslashes are not eaten by the template lexer */
const CLIENT_SEARCH_ESC_RE_SOURCE = /[.*+?^${}()|[\]\\]/.source;
const PROFILE_ONBOARDING = 'onboarding';

const { groupScriptsByFolder, isGlobalFolderKey } = require('./scriptGroups');
const { formatOperatingSystemLine } = require('./hostDisplay');
const { buildForumCard } = require('./forumCard');
const { parseHtmlThemePreset, DEFAULT_ADMIN_CHAPTER_ORDER } = require('./docTemplateConfig');
const { themePresetHtmlClass, getThemePresetStyleBlock } = require('./htmlThemePresets');
const { guestHelpChapterHasContent } = require('./guestHelpContent');
const { hasFamilyDiagnosisSnapshot, isNodeVersionFlaggedForDiagnosis } = require('./diagnosisSnapshot');
const MarkdownIt = require('markdown-it');
const { parseHtmlColorScheme, sanitizeFontStack, sanitizeLogoUrl } = require('./docTemplateConfig');

/**
 * Escape special HTML characters to prevent XSS / broken markup.
 *
 * @param {*} value Value to escape
 * @returns {string} Escaped string
 */
function esc(value) {
	return String(value == null ? '' : value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Turn manual multiline text into safe HTML paragraphs (trimmed non-empty lines).
 *
 * @param {string} text
 * @returns {string}
 */
function formatMultilineManualHtml(text) {
	if (text == null || !String(text).trim()) {
		return '';
	}
	const lines = String(text)
		.split('\n')
		.map(l => l.trim())
		.filter(Boolean);
	if (lines.length === 0) {
		return '';
	}
	if (lines.length === 1) {
		return `<p style="margin:0">${esc(lines[0])}</p>`;
	}
	return lines.map(l => `<p style="margin:0 0 8px">${esc(l)}</p>`).join('');
}

/**
 * HtmlRenderer renders the document model to a standalone HTML file.
 *
 * @param {object} adapter ioBroker adapter instance
 * @param {object} i18n i18n instance for translations
 */
class HtmlRenderer {
	/**
	 * @param {object} adapter ioBroker adapter instance
	 * @param {object} i18n i18n instance for translations
	 */
	constructor(adapter, i18n) {
		this.adapter = adapter;
		this.i18n = i18n;
	}

	/**
	 * Check if profile includes detail level.
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
	 * @returns {object} markdown-it instance
	 */
	getMarkdownIt() {
		if (!this._md) {
			const md = new MarkdownIt({ html: false, linkify: true, breaks: true });
			const defaultLinkOpen =
				md.renderer.rules.link_open ||
				((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
			md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
				const aIndex = tokens[idx].attrIndex('href');
				if (aIndex >= 0) {
					const href = tokens[idx].attrs[aIndex][1];
					if (/^\s*javascript:/i.test(href) || /^\s*data:/i.test(href)) {
						tokens[idx].attrs[aIndex][1] = '#';
					}
				}
				return defaultLinkOpen(tokens, idx, options, env, self);
			};
			this._md = md;
		}
		return this._md;
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
	 * @returns {{ title: string, bodyMarkdown: string, anchorId: string, profiles?: string[] }[]}
	 */
	filterCustomSectionsForProfile(docModel, profile) {
		const list = (docModel && docModel.customDocSections) || [];
		return list.filter(s => !s.profiles || !s.profiles.length || s.profiles.includes(profile));
	}

	/**
	 * @param {object} docModel
	 * @param {string} profile
	 * @returns {string}
	 */
	renderCustomSectionsBlock(docModel, profile) {
		if (profile === PROFILE_ADMIN && this.adminChapterHidden(docModel, 'custom')) {
			return '';
		}
		if (profile === PROFILE_USER && this.userChapterHidden(docModel, 'custom')) {
			return '';
		}
		if (profile === PROFILE_ONBOARDING && this.onboardingChapterHidden(docModel, 'custom')) {
			return '';
		}
		const sections = this.filterCustomSectionsForProfile(docModel, profile);
		if (sections.length === 0) {
			return '';
		}
		const md = this.getMarkdownIt();
		const i18n = this.i18n;
		let html = `<h2 id="custom-doc-sections">${esc(i18n.t('customDocSectionsTitle') || 'Custom sections')}</h2>\n`;
		for (const s of sections) {
			const bodyMd = String(s.bodyMarkdown || '')
				.replace(/^\uFEFF/, '')
				.replace(/^[\r\n]+/, '');
			const inner = md.render(bodyMd);
			html += `<section class="custom-doc-wrap" id="${esc(s.anchorId)}"><h3>${esc(s.title)}</h3><div class="custom-doc-body">${inner}</div></section>\n`;
		}
		return html;
	}

	/**
	 * @param {string} profile
	 * @param {object} docModel
	 * @returns {string}
	 */
	renderCustomSectionNavItems(profile, docModel) {
		if (profile === PROFILE_USER && this.userChapterHidden(docModel, 'custom')) {
			return '';
		}
		if (profile === PROFILE_ONBOARDING && this.onboardingChapterHidden(docModel, 'custom')) {
			return '';
		}
		if (profile === PROFILE_ADMIN && this.adminChapterHidden(docModel, 'custom')) {
			return '';
		}
		const sections = this.filterCustomSectionsForProfile(docModel, profile);
		if (sections.length === 0) {
			return '';
		}
		return sections.map(s => `<li><a href="#${esc(s.anchorId)}">${esc(s.title)}</a></li>`).join('\n');
	}

	/**
	 * Render complete document model to standalone HTML.
	 * Dispatches to profile-specific render methods.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML content
	 */
	renderHtml(docModel) {
		const profile = this.adapter.config.profile || PROFILE_ADMIN;
		if (profile === PROFILE_ONBOARDING) {
			return this.renderOnboardingHtml(docModel);
		}
		if (profile === PROFILE_USER) {
			return this.renderUserHtml(docModel);
		}
		return this.renderAdminHtml(docModel);
	}

	/**
	 * Render all three profiles and return them as an object.
	 * This is the recommended method — always generates all profiles simultaneously.
	 *
	 * @param {object} docModel Document model
	 * @param {{urls?: {admin:string,user:string,onboarding:string}, qrSvgs?: {admin:string,user:string,onboarding:string}}} [renderOptions] Pre-built URLs and inline QR SVGs
	 * @returns {{admin: string, user: string, onboarding: string}} HTML for all profiles
	 */
	renderAllHtml(docModel, renderOptions) {
		return {
			admin: this.renderAdminHtml(docModel),
			user: this.renderUserHtml(docModel),
			onboarding: this.renderOnboardingHtml(docModel, renderOptions),
		};
	}

	/**
	 * Single Admin-profile chapter (HTML) — respects hide flags and per-chapter data availability.
	 *
	 * @param {object} docModel
	 * @param {string} key Chapter id (see {@link DEFAULT_ADMIN_CHAPTER_ORDER})
	 * @returns {string} HTML fragment
	 */
	renderAdminChapterBodyKey(docModel, key) {
		const mc = docModel.manualContext;
		const hasManual =
			mc &&
			(mc.description ||
				mc.contact ||
				mc.notes ||
				(mc.homeRoutinesNote && String(mc.homeRoutinesNote).trim()) ||
				guestHelpChapterHasContent(mc, docModel));
		switch (key) {
			case 'manual': {
				if (this.adminChapterHidden(docModel, 'manual') || !hasManual) {
					return '';
				}
				return this.renderManualContext(mc, PROFILE_ADMIN);
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
				return this.renderScheduleObjectsSection(docModel);
			}
			case 'userdata': {
				if (
					this.adminChapterHidden(docModel, 'userdata') ||
					!docModel.userData ||
					docModel.userData.length === 0
				) {
					return '';
				}
				return this.renderUserDataChapter(docModel.userData);
			}
			case 'aliases': {
				if (
					this.adminChapterHidden(docModel, 'aliases') ||
					!docModel.aliases ||
					docModel.aliases.length === 0
				) {
					return '';
				}
				return this.renderAliasChapter(docModel.aliases);
			}
			case 'maintenance': {
				if (this.adminChapterHidden(docModel, 'maintenance')) {
					return '';
				}
				return this.renderMaintenanceChapter(docModel);
			}
			case 'diagnosis': {
				if (this.adminChapterHidden(docModel, 'diagnosis')) {
					return '';
				}
				return this.renderDiagnosis(docModel);
			}
			case 'troubleshooting': {
				if (this.adminChapterHidden(docModel, 'troubleshooting')) {
					return '';
				}
				return this.renderTroubleshooting(docModel);
			}
			case 'custom': {
				return this.renderCustomSectionsBlock(docModel, PROFILE_ADMIN);
			}
			case 'changelog': {
				if (
					this.adminChapterHidden(docModel, 'changelog') ||
					!docModel.changelog ||
					docModel.changelog.length === 0
				) {
					return '';
				}
				return this.renderChangelogChapter(docModel.changelog);
			}
			case 'appendices': {
				if (this.adminChapterHidden(docModel, 'appendices')) {
					return '';
				}
				return this.renderAppendices(docModel);
			}
			default:
				return '';
		}
	}

	/**
	 * Admin nav fragment for one chapter key (string may contain several `<li>` for custom).
	 *
	 * @param {object} docModel
	 * @param {string} key
	 * @returns {string}
	 */
	buildAdminNavFragmentForKey(docModel, key) {
		const dm = docModel;
		const h = k => this.adminChapterHidden(dm, k);
		const mc = dm.manualContext;
		const hasManual =
			mc &&
			(mc.description ||
				mc.contact ||
				mc.notes ||
				(mc.homeRoutinesNote && String(mc.homeRoutinesNote).trim()) ||
				guestHelpChapterHasContent(mc, docModel));
		const i18n = this.i18n;
		switch (key) {
			case 'system':
				if (h('system')) {
					return '';
				}
				return `<li><a href="#system-overview">${esc(i18n.t('systemOverview'))}</a></li>`;
			case 'manual':
				if (h('manual') || !hasManual) {
					return '';
				}
				return `<li><a href="#manual-information">${esc(i18n.t('manualInformation'))}</a></li>`;
			case 'adapters':
				if (h('adapters')) {
					return '';
				}
				return `<li><a href="#adapter-instances">${esc(i18n.t('adapterInstances'))}</a></li>`;
			case 'rooms':
				if (h('rooms')) {
					return '';
				}
				return `<li><a href="#rooms-and-functions">${esc(i18n.t('roomsAndFunctions'))}</a></li>`;
			case 'scripts': {
				return this.buildAdminScriptsNavItem(dm) || '';
			}
			case 'schedule': {
				if (h('schedule') || !dm.scheduleObjects || dm.scheduleObjects.length === 0) {
					return '';
				}
				return `<li><a href="#schedule-objects">${esc(i18n.t('scheduleTypeObjects'))}</a></li>`;
			}
			case 'userdata': {
				if (h('userdata')) {
					return '';
				}
				return `<li><a href="#userdata">${esc(i18n.t('userDefinedVariables') || 'Eigene Variablen')}</a></li>`;
			}
			case 'aliases': {
				if (h('aliases')) {
					return '';
				}
				return `<li><a href="#aliases">${esc(i18n.t('aliases') || 'Aliase')}</a></li>`;
			}
			case 'maintenance': {
				if (h('maintenance')) {
					return '';
				}
				return `<li><a href="#maintenance">${esc(i18n.t('maintenance'))}</a></li>`;
			}
			case 'diagnosis': {
				if (h('diagnosis')) {
					return '';
				}
				return `<li><a href="#diagnosis">${esc(i18n.t('diagnosis'))}</a></li>`;
			}
			case 'troubleshooting': {
				if (h('troubleshooting')) {
					return '';
				}
				return `<li><a href="#troubleshooting">${esc(i18n.t('troubleshooting'))}</a></li>`;
			}
			case 'custom': {
				return this.renderCustomSectionNavItems(PROFILE_ADMIN, docModel);
			}
			case 'changelog': {
				if (h('changelog')) {
					return '';
				}
				return `<li><a href="#changelog">${esc(i18n.t('changelog'))}</a></li>`;
			}
			case 'appendices': {
				if (h('appendices')) {
					return '';
				}
				return `<li><a href="#appendices">${esc(i18n.t('appendices'))}</a></li>`;
			}
			default:
				return '';
		}
	}

	/**
	 * Render Admin profile — full technical detail.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML content
	 */
	renderAdminHtml(docModel) {
		const config = this.adapter.config;
		const title = esc(this.i18n.t('projectDocumentation', config.projectName || 'ioBroker System'));
		const nav = this.renderNav(PROFILE_ADMIN, docModel);
		let body = this.renderHeader(docModel, PROFILE_ADMIN);
		const order = (docModel && docModel.adminChapterOrder) || DEFAULT_ADMIN_CHAPTER_ORDER;
		for (const key of order) {
			body += this.renderAdminChapterBodyKey(docModel, key);
		}
		return this.wrapPage(title, nav, body);
	}

	/**
	 * Render User/Familie profile — plain language, device names, no OIDs.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML content
	 */
	renderUserHtml(docModel) {
		const config = this.adapter.config;
		const title = esc(this.i18n.t('projectDocumentation', config.projectName || 'ioBroker System'));
		const nav = this.renderNav(PROFILE_USER, docModel);
		let body = '';

		body += this.renderHeader(docModel, PROFILE_USER);
		if (
			!this.userChapterHidden(docModel, 'manual') &&
			docModel.manualContext &&
			(docModel.manualContext.description || docModel.manualContext.contact || docModel.manualContext.notes)
		) {
			body += this.renderManualContext(docModel.manualContext, PROFILE_USER);
		}
		if (docModel.ai?.user && !this.userChapterHidden(docModel, 'ai')) {
			body += this.renderAiSection(docModel.ai.user, {
				sourceTag: docModel.ai.meta?.userFromOnboardingFallback
					? 'user source=fallback-onboarding'
					: 'user source=primary',
			});
		}
		if (!this.userChapterHidden(docModel, 'guestHelp')) {
			body += this._renderGuestHelpChapter(docModel, PROFILE_USER);
		}
		if (!this.userChapterHidden(docModel, 'atAGlance') && docModel.quickStart && docModel.quickStart.hasContent) {
			body += this.renderUserAtAGlance(docModel);
		}
		if (!this.userChapterHidden(docModel, 'rooms')) {
			body += this.renderUserRoomsChapter(docModel);
		}
		if (!this.userChapterHidden(docModel, 'scripts')) {
			body += this.renderUserScriptsChapter(docModel);
		}
		if (!this.userChapterHidden(docModel, 'routines')) {
			body += this._renderHomeRoutinesChapter(docModel.manualContext);
		}
		if (!this.userChapterHidden(docModel, 'adapters')) {
			body += this.renderUserAdaptersChapter(docModel);
		}
		body += this.renderCustomSectionsBlock(docModel, PROFILE_USER);

		return this.wrapPage(title, nav, body);
	}

	/**
	 * Render Onboarding profile — "Du"-Ansprache, no tech jargon.
	 *
	 * @param {object} docModel Document model
	 * @param {{urls?: {admin:string,user:string,onboarding:string}, qrSvgs?: {admin:string,user:string,onboarding:string}}} [renderOptions] Pre-built URLs and inline QR SVGs (e.g. from {@link HtmlRenderer#renderAllHtml}); omitted when {@link HtmlRenderer#renderHtml} runs the profile-only path without QR/URLs.
	 * @returns {string} HTML content
	 */
	renderOnboardingHtml(docModel, renderOptions) {
		const config = this.adapter.config;
		const title = esc(this.i18n.t('projectDocumentation', config.projectName || 'ioBroker System'));
		const nav = this.renderNav(PROFILE_ONBOARDING, docModel);
		let body = '';

		// 1. Welcome — title, QR, intro text, description, contact (no stats yet)
		body += this.renderOnboardingWelcome(docModel, renderOptions);

		// 2. Quick Start (structured overview — same chapter as Markdown export)
		if (!this.onboardingChapterHidden(docModel, 'quickstart')) {
			body += this.renderQuickStart(docModel);
		}

		// 3. Tips & Notes — always shown (friendly fallback when empty)
		body += this.renderOnboardingNotes(docModel);

		if (!this.onboardingChapterHidden(docModel, 'guestHelp')) {
			body += this._renderGuestHelpChapter(docModel, PROFILE_ONBOARDING);
		}

		// 3. Stats — shown AFTER tips so they provide context, not confusion
		if (!this.onboardingChapterHidden(docModel, 'stats')) {
			body += this.renderOnboardingStats(docModel);
		}

		// 4. AI summary (if available) — onboarding-specific text, not shared with User profile
		if (docModel.ai?.onboarding && !this.onboardingChapterHidden(docModel, 'ai')) {
			body += this.renderAiSection(docModel.ai.onboarding, {
				sourceTag: docModel.ai.meta?.onboardingFromUserFallback
					? 'onboarding source=fallback-neutral'
					: 'onboarding source=primary',
			});
		}

		// 5. "What can this home do?" — capabilities derived from functions/categories
		if (!this.onboardingChapterHidden(docModel, 'capabilities')) {
			body += this.renderOnboardingCapabilities(docModel);
		}

		// 6. Rooms + device details
		if (!this.onboardingChapterHidden(docModel, 'rooms')) {
			body += this.renderOnboardingRooms(docModel);
		}

		if (!this.onboardingChapterHidden(docModel, 'routines')) {
			body += this._renderHomeRoutinesChapter(docModel.manualContext);
		}

		// 7. What runs automatically
		if (!this.onboardingChapterHidden(docModel, 'automations')) {
			body += this.renderOnboardingAutomations(docModel);
		}

		// 8. Connected systems — collapsible at the end, guests rarely need this
		if (!this.onboardingChapterHidden(docModel, 'adapters')) {
			body += this.renderOnboardingAdapters(docModel);
		}

		body += this.renderCustomSectionsBlock(docModel, PROFILE_ONBOARDING);
		if (!this.onboardingChapterHidden(docModel, 'hint')) {
			body += this.renderOnboardingHint(docModel);
		}

		return this.wrapPage(title, nav, body);
	}

	/**
	 * Wrap body content in a full HTML page with inline CSS.
	 *
	 * @param {string} title Page title
	 * @param {string} nav Navigation HTML
	 * @param {string} body Main content HTML
	 * @returns {string} Complete HTML page
	 */
	wrapPage(title, nav, body) {
		const cfg = this.adapter.config || {};
		const scheme = parseHtmlColorScheme(cfg.htmlColorScheme);
		const extraCss = String(cfg.htmlExtraCss || '').trim();
		const fontStack = sanitizeFontStack(cfg.htmlFontStack);
		const fontCss = fontStack ? `  body { font-family: ${fontStack}; }\n` : '';
		const logoUrl = sanitizeLogoUrl(cfg.htmlHeaderLogoUrl);
		const navLogo = logoUrl
			? `<div class="nav-logo"><img src="${esc(logoUrl)}" alt="" loading="lazy"></div>\n`
			: '';
		const layoutAddonCss = `${fontCss}  .nav-logo { margin-bottom: 12px; text-align: center; }
  .nav-logo img { max-width: 100%; height: auto; max-height: 96px; object-fit: contain; }
  .custom-doc-wrap { margin: 28px 0; padding: 16px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; }
  .custom-doc-wrap > h3:first-child { margin-top: 0; }
  .custom-doc-body { font-size: 15px; color: var(--text); }
  .custom-doc-body > :first-child { margin-top: 0; }
  .custom-doc-body h1, .custom-doc-body h2, .custom-doc-body h3 { margin-top: 1em; color: var(--text); }
  .custom-doc-body pre { background: var(--th-bg); padding: 10px; border-radius: 6px; overflow-x: auto; font-size: 13px; }
  .custom-doc-body code { font-family: ui-monospace, monospace; background: var(--th-bg); padding: 2px 5px; border-radius: 4px; font-size: 13px; }
  .custom-doc-body ul, .custom-doc-body ol { padding-left: 22px; margin: 8px 0; }
  .custom-doc-body table { font-size: 14px; }
  .custom-doc-body blockquote { margin: 8px 0; padding-left: 12px; border-left: 3px solid var(--border); color: var(--text-muted); }
`;
		const ownerCss = extraCss ? `\n/* owner-supplied */\n${extraCss}\n` : '';
		const themePreset = parseHtmlThemePreset(cfg.htmlThemePreset);
		const presetClass = themePresetHtmlClass(themePreset).trim();
		const presetBlock = getThemePresetStyleBlock();
		const htmlClassAttr = presetClass ? ` class="${esc(presetClass)}"` : '';

		return `<!DOCTYPE html>
<html lang="en"${htmlClassAttr}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!-- autodoc-renderer:${RENDERER_VERSION} -->
<title>${title}</title>
<style>
  :root { --bg: #f5f5f5; --surface: #fff; --border: #e0e0e0; --text: #222; --text-muted: #555; --text-faint: #888; --link: #0066cc; --nav-bg: #1a1a2e; --nav-text: #ccc; --nav-hover: rgba(255,255,255,0.1); --th-bg: #f0f0f0; --row-hover: #fafafa; --score-bar-bg: #e0e0e0; --note-bg: #fff8e1; --note-border: #ffc107; --manual-bg: #fff8e1; --manual-border: #f0b429; --ai-bg: #f0f7ff; --ai-border: #b3d1f5; --device-bg: #fff; --adapter-bg: #fff; --stat-bg: #fff; --meta-bg: #fff; --changelog-bg: #f8f9fa; }
  body.dark { --bg: #0f1117; --surface: #1e2130; --border: #2d3148; --text: #e0e0e0; --text-muted: #aaa; --text-faint: #666; --link: #5b9cf6; --nav-bg: #0d0f1a; --nav-text: #aaa; --nav-hover: rgba(255,255,255,0.08); --th-bg: #262a3f; --row-hover: #242840; --score-bar-bg: #2d3148; --note-bg: #2a2410; --note-border: #a07800; --manual-bg: #2a2410; --manual-border: #a07800; --ai-bg: #101d30; --ai-border: #2a4a70; --device-bg: #1e2130; --adapter-bg: #1e2130; --stat-bg: #1e2130; --meta-bg: #1e2130; --changelog-bg: #1a1d2e; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; font-size: 15px; line-height: 1.6; color: var(--text); background: var(--bg); }
  a { color: var(--link); text-decoration: none; }
  a:hover { text-decoration: underline; }
  #layout { display: flex; min-height: 100vh; }
  nav { width: 240px; flex-shrink: 0; background: var(--nav-bg); color: var(--nav-text); padding: 24px 16px; position: sticky; top: 0; height: 100vh; overflow-y: auto; display: flex; flex-direction: column; }
  nav h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-faint); margin-bottom: 12px; margin-top: 20px; }
  nav h2:first-child { margin-top: 0; }
  nav ul { list-style: none; }
  nav ul li a { display: block; padding: 5px 8px; border-radius: 4px; color: var(--nav-text); font-size: 14px; }
  nav ul li a:hover { background: var(--nav-hover); color: #fff; text-decoration: none; }
  nav ul.toc-nested { list-style: none; margin: 4px 0 10px 0; padding: 0 0 0 12px; border-left: 2px solid rgba(255,255,255,0.18); }
  nav ul.toc-nested li a { font-size: 13px; padding: 3px 6px; opacity: 0.92; }
  /* Desktop: wider reading column; cap line length on huge monitors; leave room for 240px nav + padding */
  main { flex: 1; padding: 32px 40px; max-width: min(1440px, calc(100vw - 280px)); }
  h1 { font-size: 26px; margin-bottom: 8px; color: var(--text); }
  h2 { font-size: 20px; margin-top: 40px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid var(--border); color: var(--text); }
  h3 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; color: var(--text); }
  h4 { font-size: 14px; margin-top: 16px; margin-bottom: 6px; color: var(--text-muted); }
  .meta { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 14px 18px; margin: 16px 0 24px; display: grid; grid-template-columns: auto 1fr; gap: 4px 16px; font-size: 14px; }
  .meta dt { font-weight: 600; color: var(--text-muted); }
  .meta dd { color: var(--text); }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 14px; background: var(--surface); border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  th { background: var(--th-bg); text-align: left; padding: 8px 12px; font-weight: 600; color: var(--text-muted); }
  td { padding: 7px 12px; border-top: 1px solid var(--border); }
  tr:hover td { background: var(--row-hover); }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; }
  .badge-ok { background: #d4edda; color: #155724; }
  .badge-off { background: #f8d7da; color: #721c24; }
  .badge-meta { background: #e8f0fe; color: #1a56db; font-weight: 500; }
  .adapter-meta { display: inline-flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
  .manual-context-box { background: var(--manual-bg); border-left: 3px solid var(--manual-border); padding: 6px 10px; margin-top: 8px; border-radius: 3px; font-size: 13px; color: var(--text-muted); }
  .manual-context-note { display: block; background: var(--manual-bg); border-left: 3px solid var(--manual-border); padding: 4px 8px; margin-top: 4px; border-radius: 3px; font-size: 12px; color: var(--text-muted); }
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin: 16px 0; }
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 14px 16px; }
  .stat-card .num { font-size: 28px; font-weight: 700; color: var(--link); }
  .stat-card .label { font-size: 12px; color: var(--text-faint); margin-top: 2px; }
  .section-divider { border: none; border-top: 1px solid var(--border); margin: 32px 0; }
  ul.content-list { padding-left: 20px; margin: 8px 0; }
  ul.content-list li { margin: 4px 0; }
  .note-box { background: var(--note-bg); border-left: 4px solid var(--note-border); padding: 12px 16px; border-radius: 0 6px 6px 0; margin: 12px 0; font-size: 14px; }
  .adapter-list { display: flex; flex-direction: column; gap: 12px; margin: 16px 0; }
  .adapter-card { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 14px 18px; }
  .adapter-card-inactive { opacity: 0.6; }
  .adapter-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .adapter-desc { margin: 4px 0 6px; color: var(--text-muted); font-size: 14px; }
  .adapter-status-note { color: var(--text-faint); font-size: 12px; }
  footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid var(--border); font-size: 12px; color: var(--text-faint); }
  .score-bar { background: var(--score-bar-bg); border-radius: 8px; height: 12px; margin: 8px 0 16px; overflow: hidden; }
  .score-bar-fill { height: 100%; border-radius: 8px; background: #28a745; transition: width 0.3s; }
  .checklist { list-style: none; padding: 0; margin: 0 0 16px; }
  .checklist li { padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 14px; display: flex; align-items: center; gap: 8px; }
  .checklist li:last-child { border-bottom: none; }
  #dark-toggle { background: none; border: 1px solid var(--border); border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 14px; color: var(--nav-text); width: 100%; text-align: left; margin-top: 8px; transition: background 0.2s; }
  #dark-toggle:hover { background: var(--nav-hover); }
  .nav-footer { margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); }
  .stale-warning { background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-size: 13px; color: #856404; display: flex; align-items: center; gap: 8px; }
  body.dark .stale-warning { background: #2a2000; border-color: #a07800; color: #ffc107; }
  .health-badge { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-left: 8px; vertical-align: middle; }
  .health-ok { background: #d4edda; color: #155724; }
  .health-warn { background: #fff3cd; color: #856404; }
  body.dark .health-ok { background: #0d2a14; color: #4caf50; }
  body.dark .health-warn { background: #2a2000; color: #ffc107; }
  .search-wrap { margin-bottom: 20px; }
  .search-wrap input { width: 100%; padding: 7px 10px; border-radius: 4px; border: none; background: rgba(255,255,255,0.12); color: #fff; font-size: 13px; outline: none; }
  .search-wrap input::placeholder { color: var(--text-faint); }
  .search-wrap input:focus { background: rgba(255,255,255,0.2); }
  .search-nav { display: flex; align-items: center; gap: 4px; margin-top: 4px; }
  .search-nav button { background: rgba(255,255,255,0.1); border: none; color: #ccc; border-radius: 3px; padding: 2px 6px; cursor: pointer; font-size: 13px; line-height: 1.4; }
  .search-nav button:hover { background: rgba(255,255,255,0.2); }
  .search-count { font-size: 11px; color: var(--text-faint); flex: 1; }
  mark.hl { background: #ffe066; color: #000; border-radius: 2px; padding: 0 1px; }
  mark.hl.hl-active { background: #ff9900; outline: 2px solid #e67300; }
  /* ── Mobile ─────────────────────────────────────────────────────────── */
  #nav-toggle { display: none; position: fixed; top: 12px; left: 12px; z-index: 1100; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 6px 10px; font-size: 20px; line-height: 1; cursor: pointer; color: var(--text); box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
  #nav-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 900; }
  @media (max-width: 700px) {
    #nav-toggle { display: block; }
    nav { position: fixed; left: 0; top: 0; height: 100vh; z-index: 1000; transform: translateX(-100%); transition: transform 0.25s ease; box-shadow: 4px 0 20px rgba(0,0,0,0.3); }
    body.nav-open nav { transform: translateX(0); }
    body.nav-open #nav-overlay { display: block; }
    main { padding: 64px 18px 32px; max-width: 100%; }
    .stat-grid { grid-template-columns: repeat(2, 1fr); }
    table { font-size: 13px; }
    td, th { padding: 6px 8px; }
    #qr-section { float: none; margin: 0 0 16px; }
    h1 { font-size: 21px; }
  }
  @media print {
    nav, .search-wrap, .script-filter-bar, .adapter-filter-bar, .adapter-filter-hint, .script-filter-hint, #nav-toggle { display: none !important; }
    #layout { display: block !important; }
    main { max-width: 100% !important; padding: 16px !important; }
    h2 { break-before: page; margin-top: 0 !important; }
    details { display: block !important; }
    details > summary { display: none !important; }
    .badge { border: 1px solid #999; }
    .score-bar { border: 1px solid #ccc; }
    .section-divider { display: none !important; }
    a { color: #000 !important; }
    table { box-shadow: none !important; border: 1px solid #ccc; }
    .stat-card, .adapter-card, .device-card { border: 1px solid #ccc !important; box-shadow: none !important; }
  }
  .filter-hidden { display: none !important; }
  /* State-ID chips in tables — must use theme vars (not fixed #f4f4f4) for dark mode contrast */
  .inline-state-id { font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background: var(--th-bg); color: var(--text); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border); }
  .no-results { display: none; padding: 8px 0; color: var(--text-faint); font-size: 13px; font-style: italic; }
  .ai-box { background: var(--ai-bg); border: 1px solid var(--ai-border); border-radius: 8px; padding: 18px 22px; margin: 0 0 28px; color: var(--text); }
  .ai-box-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--link); margin-bottom: 8px; }
  .ai-narrative { font-size: 15px; color: var(--text); line-height: 1.7; margin-bottom: 12px; }
  .ai-recommendations { font-size: 14px; color: var(--text); line-height: 1.6; white-space: pre-line; }
  .ai-recommendations ul, .ai-recommendations-list { padding-left: 18px; margin: 4px 0; color: var(--text); }
  .ai-recommendations-list li { margin: 3px 0; color: var(--text); }
  .device-grid { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0 16px; }
  .device-card { display: flex; align-items: center; gap: 6px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; font-size: 14px; }
  .device-icon { font-size: 18px; line-height: 1; }
  .device-name { color: var(--text); }
  .adapter-filter-bar { display: flex; align-items: center; gap: 10px; margin: 8px 0 12px; }
  .adapter-filter-bar input { padding: 5px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; width: 260px; }
  .adapter-filter-bar input:focus { outline: none; border-color: #0066cc; }
  #adapter-filter-count { font-size: 12px; color: var(--text-faint); }
  .adapter-filter-hint { font-size: 12px; color: #aaa; }
  .adapter-disabled-summary { cursor: pointer; padding: 6px 0; user-select: none; list-style: none; }
  .adapter-disabled-summary::-webkit-details-marker { display: none; }
  .script-filter-bar { display: flex; align-items: center; gap: 10px; margin: 8px 0 12px; }
  .script-filter-bar input { padding: 5px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; width: 260px; }
  .script-filter-bar input:focus { outline: none; border-color: #0066cc; }
  #script-filter-count { font-size: 12px; color: var(--text-faint); }
  .script-filter-hint { font-size: 12px; color: #aaa; }
  .script-disabled-summary { cursor: pointer; padding: 6px 0; user-select: none; list-style: none; }
  .script-disabled-summary::-webkit-details-marker { display: none; }
  .maint-details-summary.script-disabled-summary { font-size: 14px; font-weight: 500; color: var(--text-muted); }
  .maint-details-summary.script-disabled-summary:hover { color: var(--link); }
  .maint-details-summary { cursor: pointer; font-size: 15px; font-weight: 600; color: var(--text); padding: 4px 0; user-select: none; list-style: none; }
  .maint-details-summary::-webkit-details-marker { display: none; }
  .maint-details-summary::before { content: '▶ '; font-size: 11px; color: var(--text-muted); }
  details[open] > .maint-details-summary::before { content: '▼ '; }
  .maint-details-summary:hover { color: var(--link); }
  /* Manual hint accent — gold arrow / border matches .manual-context-box */
  .maint-details-summary--room-note::before { color: var(--note-border); }
  .maint-details-summary--room-note:hover { color: var(--text); }
  tr.table-row--manual-note td:first-child { border-left: 3px solid var(--note-border); }
  /* Script has cron schedule — link-colour accent (distinct from gold manual / orange attention) */
  tr.table-row--has-schedule td:first-child { border-left: 3px solid var(--link); }
  .adapter-card--has-manual { border-left: 3px solid var(--note-border); }
  .maint-details-summary.adapter-disabled-summary { font-size: 14px; font-weight: 500; color: var(--text-muted); }
  .maint-details-summary.adapter-disabled-summary:hover { color: var(--link); }
  /* Maintenance / attention — orange arrow (differs from gold „manual note“) */
  .maint-details-summary--attention::before { color: #e67e22; }
  body.dark .maint-details-summary--attention::before { color: #f0a060; }
  .autodoc-collapsible-section { margin: 0 0 14px; }
${presetBlock}${layoutAddonCss}${ownerCss}</style>
</head>
<body data-autodoc-theme="${scheme}">
<button id="nav-toggle" onclick="toggleNav()" aria-label="Menu">☰</button>
<div id="nav-overlay" onclick="toggleNav()"></div>
<div id="layout">
<nav>
${navLogo}<div class="search-wrap">
  <input type="search" id="doc-search" placeholder="${esc(this.i18n.t('searchPlaceholder'))}" autocomplete="off" aria-label="Search documentation">
  <div class="search-nav">
    <button onclick="docSearchPrev()" title="${esc(this.i18n.t('searchPrev') || 'Vorheriger Treffer')}">&#8593;</button>
    <button onclick="docSearchNext()" title="${esc(this.i18n.t('searchNext') || 'Nächster Treffer')}">&#8595;</button>
    <span class="search-count" id="search-count"></span>
  </div>
  <div id="search-hint" style="font-size:11px;color:var(--text-faint);margin-top:3px">${esc(this.i18n.t('searchHint') || '↑↓ navigieren · Esc = löschen')}</div>
</div>
${nav}
<div class="nav-footer">
  <button id="dark-toggle" onclick="toggleDark()">🌙 ${esc(this.i18n.t('darkMode') || 'Dark Mode')}</button>
</div>
</nav>
<main>
${body}
</main>
</div>
<script>
// ── Full-text search with highlight + prev/next navigation ──────────────────
(function () {
  var searchInput = document.getElementById('doc-search');
  var searchCount = document.getElementById('search-count');
  if (!searchInput) return;

  var highlights = [];
  var current = -1;

  function escRe(s) { return s.replace(new RegExp(${JSON.stringify(CLIENT_SEARCH_ESC_RE_SOURCE)}, 'g'), '\\\\$&'); }

  function clearHL() {
    document.querySelectorAll('mark.hl').forEach(function (m) {
      var txt = document.createTextNode(m.textContent);
      m.parentNode.replaceChild(txt, m);
    });
    var main = document.querySelector('main');
    if (main) main.normalize();
    highlights = [];
    current = -1;
  }

  function doHL(term) {
    var main = document.querySelector('main');
    if (!main) return;
    var re = new RegExp(escRe(term), 'gi');
    var SKIP = { SCRIPT:1, STYLE:1, INPUT:1, TEXTAREA:1, MARK:1 };

    var walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, null, false);
    var textNodes = [];
    var node;
    while ((node = walker.nextNode())) {
      var el = node.parentElement;
      if (!el || SKIP[el.tagName]) continue;
      if (el.closest && el.closest('mark.hl')) continue;
      re.lastIndex = 0;
      if (re.test(node.textContent)) textNodes.push(node);
    }

    textNodes.forEach(function (textNode) {
      var text = textNode.textContent;
      var parts = [];
      var lastIdx = 0;
      var m;
      re.lastIndex = 0;
      while ((m = re.exec(text)) !== null) {
        if (m.index > lastIdx) parts.push(document.createTextNode(text.slice(lastIdx, m.index)));
        var mark = document.createElement('mark');
        mark.className = 'hl';
        mark.textContent = m[0];
        parts.push(mark);
        lastIdx = m.index + m[0].length;
      }
      if (lastIdx < text.length) parts.push(document.createTextNode(text.slice(lastIdx)));
      if (parts.length > 0) {
        var frag = document.createDocumentFragment();
        parts.forEach(function (p) { frag.appendChild(p); });
        textNode.parentNode.replaceChild(frag, textNode);
        parts.forEach(function (p) { if (p.nodeName === 'MARK') highlights.push(p); });
      }
    });
  }

  function goTo(idx) {
    if (highlights.length === 0) return;
    highlights.forEach(function (m) { m.classList.remove('hl-active'); });
    current = ((idx % highlights.length) + highlights.length) % highlights.length;
    highlights[current].classList.add('hl-active');
    highlights[current].scrollIntoView({ behavior: 'smooth', block: 'center' });
    searchCount.textContent = (current + 1) + ' / ' + highlights.length;
  }

  var timer;
  searchInput.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      clearHL();
      var term = searchInput.value.trim();
      if (term.length >= 2) {
        doHL(term);
        if (highlights.length > 0) { goTo(0); }
        else { searchCount.textContent = '0'; }
      } else {
        searchCount.textContent = '';
      }
    }, 220);
  });

  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { searchInput.value = ''; clearHL(); searchCount.textContent = ''; searchInput.blur(); }
    if (e.key === 'Enter' && highlights.length > 0) { goTo(current + (e.shiftKey ? -1 : 1)); e.preventDefault(); }
  });


  window.docSearchNext = function () { goTo(current + 1); };
  window.docSearchPrev = function () { goTo(current - 1); };
})();

// Adapter-section local filter
(function () {
  var filterInput = document.getElementById('adapter-filter');
  if (!filterInput) return;
  var countEl = document.getElementById('adapter-filter-count');
  var disabledGroup = document.getElementById('adapter-disabled-group');

  function applyAdapterFilter() {
    var term = filterInput.value.trim().toLowerCase();
    var enabledRows = Array.from(document.querySelectorAll('#adapter-enabled-body tr'));
    var disabledRows = Array.from(document.querySelectorAll('#adapter-disabled-body tr'));
    var allRows = enabledRows.concat(disabledRows);

    if (!term) {
      allRows.forEach(function (r) { r.classList.remove('filter-hidden'); });
      if (countEl) countEl.textContent = '';
      var en = document.getElementById('adapter-enabled-noresults');
      var dn = document.getElementById('adapter-disabled-noresults');
      if (en) en.style.display = 'none';
      if (dn) dn.style.display = 'none';
      if (disabledGroup) disabledGroup.open = false;
      return;
    }

    var visible = 0;
    var disabledHasMatch = false;
    allRows.forEach(function (r) {
      var match = r.textContent.toLowerCase().indexOf(term) !== -1;
      r.classList.toggle('filter-hidden', !match);
      if (match) {
        visible++;
        if (disabledRows.indexOf(r) !== -1) disabledHasMatch = true;
      }
    });

    // auto-open disabled group when a match is found inside it
    if (disabledGroup && disabledHasMatch) disabledGroup.open = true;

    if (countEl) countEl.textContent = visible + ' / ' + allRows.length;

    var enabledVisible = enabledRows.filter(function (r) { return !r.classList.contains('filter-hidden'); }).length;
    var disabledVisible = disabledRows.filter(function (r) { return !r.classList.contains('filter-hidden'); }).length;
    var en = document.getElementById('adapter-enabled-noresults');
    var dn = document.getElementById('adapter-disabled-noresults');
    if (en) en.style.display = enabledVisible === 0 ? 'block' : 'none';
    if (dn) dn.style.display = disabledVisible === 0 ? 'block' : 'none';
  }

  filterInput.addEventListener('input', applyAdapterFilter);
  filterInput.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { filterInput.value = ''; applyAdapterFilter(); }
  });
})();

// Script-section local filter
(function () {
  var filterInput = document.getElementById('script-filter');
  if (!filterInput) return;
  var countEl = document.getElementById('script-filter-count');
  var disabledGroup = document.getElementById('script-disabled-group');

  function applyScriptFilter() {
    var term = filterInput.value.trim().toLowerCase();
    var activeRows = Array.from(document.querySelectorAll('#script-active-section tbody tr'));
    var inactiveRows = Array.from(document.querySelectorAll('#script-inactive-section tbody tr'));
    var allRows = activeRows.concat(inactiveRows);

    if (!term) {
      allRows.forEach(function (r) { r.classList.remove('filter-hidden'); });
      if (countEl) countEl.textContent = '';
      var an = document.getElementById('script-active-noresults');
      var dn = document.getElementById('script-inactive-noresults');
      if (an) an.style.display = 'none';
      if (dn) dn.style.display = 'none';
      if (disabledGroup) disabledGroup.open = false;
      return;
    }

    var visible = 0;
    var inactiveHasMatch = false;
    allRows.forEach(function (r) {
      var match = r.textContent.toLowerCase().indexOf(term) !== -1;
      r.classList.toggle('filter-hidden', !match);
      if (match) {
        visible++;
        if (inactiveRows.indexOf(r) !== -1) inactiveHasMatch = true;
      }
    });

    if (disabledGroup && inactiveHasMatch) disabledGroup.open = true;

    if (countEl) countEl.textContent = visible + ' / ' + allRows.length;

    var activeVisible = activeRows.filter(function (r) { return !r.classList.contains('filter-hidden'); }).length;
    var inactiveVisible = inactiveRows.filter(function (r) { return !r.classList.contains('filter-hidden'); }).length;
    var an = document.getElementById('script-active-noresults');
    var dn = document.getElementById('script-inactive-noresults');
    if (an) an.style.display = activeVisible === 0 ? 'block' : 'none';
    if (dn) dn.style.display = inactiveVisible === 0 ? 'block' : 'none';
  }

  filterInput.addEventListener('input', applyScriptFilter);
  filterInput.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { filterInput.value = ''; applyScriptFilter(); }
  });
})();

// ── Mobile nav toggle ─────────────────────────────────────────────────────
function toggleNav() {
  document.body.classList.toggle('nav-open');
}
// Close nav when a nav link is tapped on mobile
document.querySelectorAll('nav a').forEach(function(a) {
  a.addEventListener('click', function() {
    if (window.innerWidth <= 700) document.body.classList.remove('nav-open');
  });
});

// ── Relative timestamps ───────────────────────────────────────────────────
(function () {
  function relativeTime(isoStr) {
    var diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
    if (diff < 60) return '${esc(this.i18n.t('justNow') || 'gerade eben')}';
    if (diff < 3600) { var m = Math.floor(diff/60); return m + ' ${esc(this.i18n.t('minutesAgo') || 'Min. her')}'; }
    if (diff < 86400) { var h = Math.floor(diff/3600); return h + ' ${esc(this.i18n.t('hoursAgo') || 'Std. her')}'; }
    var d = Math.floor(diff/86400);
    return d + ' ${esc(this.i18n.t('daysAgo') || 'Tage her')}';
  }
  var genEl = document.getElementById('gen-time');
  if (genEl) {
    var iso = genEl.getAttribute('data-iso');
    if (iso) {
      var rel = relativeTime(iso);
      genEl.title = new Date(iso).toLocaleString();
      genEl.textContent = new Date(iso).toLocaleString() + ' (' + rel + ')';
    }
  }
})();

// ── Dark mode toggle ──────────────────────────────────────────────────────
var _darkLabel = '${esc(this.i18n.t('darkMode') || 'Dark Mode')}';
var _lightLabel = '${esc(this.i18n.t('lightMode') || 'Light Mode')}';
function toggleDark() {
  if (document.body.getAttribute('data-autodoc-theme') !== 'auto') return;
  var dark = document.body.classList.toggle('dark');
  localStorage.setItem('autodoc-dark', dark ? '1' : '0');
  var btn = document.getElementById('dark-toggle');
  if (btn) btn.textContent = (dark ? '☀️ ' : '🌙 ') + (dark ? _lightLabel : _darkLabel);
}
(function () {
  var theme = document.body.getAttribute('data-autodoc-theme') || 'auto';
  var btn = document.getElementById('dark-toggle');
  if (theme === 'light') {
    document.body.classList.remove('dark');
    if (btn) btn.style.display = 'none';
    return;
  }
  if (theme === 'dark') {
    document.body.classList.add('dark');
    if (btn) btn.style.display = 'none';
    return;
  }
  if (localStorage.getItem('autodoc-dark') === '1') {
    document.body.classList.add('dark');
    if (btn) btn.textContent = '☀️ ' + _lightLabel;
  } else {
    if (btn) btn.textContent = '🌙 ' + _darkLabel;
  }
})();

// Userdata + alias folder search: wired at end of document so it still runs when viewers strip inline scripts inside <main>
(function () {
  function parseTotal(sec) {
    var t = sec.getAttribute('data-autodoc-total');
    var n = parseInt(t, 10);
    return isNaN(n) ? 0 : n;
  }
  function wire(sectionId, listId, filterId, countId, exportName) {
    var sec = document.getElementById(sectionId);
    if (!sec || sec.getAttribute('data-autodoc-filter-wired') === '1') return;
    var inp = document.getElementById(filterId);
    var cnt = document.getElementById(countId);
    var list = document.getElementById(listId);
    if (!inp || !list) return;
    var total = parseTotal(sec);
    var totalSuffix = sec.getAttribute('data-autodoc-total-suffix') || '';
    function apply() {
      var term = (inp.value || '').trim().toLowerCase();
      var rows = list.querySelectorAll('tr[data-search]');
      var visible = 0;
      rows.forEach(function (r) {
        var hay = r.getAttribute('data-search') || '';
        var match = !term || hay.indexOf(term) !== -1;
        r.style.display = match ? '' : 'none';
        if (match) visible++;
      });
      if (cnt) cnt.textContent = (term ? visible + ' / ' : '') + total + (totalSuffix ? ' ' + totalSuffix : '');
      list.querySelectorAll('details').forEach(function (d) {
        if (term) d.open = true;
        else d.removeAttribute('open');
      });
    }
    inp.addEventListener('input', apply);
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        inp.value = '';
        apply();
      }
    });
    sec.setAttribute('data-autodoc-filter-wired', '1');
    if (exportName) window[exportName] = apply;
    apply();
  }
  function runWire() {
    wire('autodoc-userdata-section', 'autodoc-userdata-list', 'autodoc-userdata-filter', 'autodoc-userdata-count', '__autodocApplyUserdataFilter');
    wire('autodoc-alias-section', 'autodoc-alias-list', 'autodoc-alias-filter', 'autodoc-alias-count', '__autodocApplyAliasFilter');
  }
  runWire();
  document.addEventListener('DOMContentLoaded', runWire);
  queueMicrotask(runWire);
  setTimeout(runWire, 0);
  window.addEventListener('pageshow', function (ev) {
    if (ev.persisted) {
      if (typeof window.__autodocApplyUserdataFilter === 'function') window.__autodocApplyUserdataFilter();
      if (typeof window.__autodocApplyAliasFilter === 'function') window.__autodocApplyAliasFilter();
    }
  });
})();
</script>
</body>
</html>`;
	}

	// ── User profile methods ────────────────────────────────────────────────

	/**
	 * Render rooms chapter for User profile — device names, icons, live values.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML
	 */
	renderUserRoomsChapter(docModel) {
		const roomsData = docModel.rooms;
		const i18n = this.i18n;
		const config = this.adapter.config;

		const hideRooms = new Set((config.userHideRooms || []).map(r => r.room && r.room.trim()).filter(Boolean));

		let html = `<h2 id="rooms-and-functions">${esc(i18n.t('roomsAndFunctions'))}</h2>\n`;

		if (!roomsData || roomsData.totalRooms === 0) {
			html += `<p><em>${esc(i18n.t('noRoomsDefined'))}</em></p>\n`;
			html += '<hr class="section-divider">\n';
			return html;
		}

		// Rooms
		html += `<h3>${esc(i18n.t('rooms'))}</h3>\n`;
		const visibleRooms = roomsData.rooms.filter(r => !hideRooms.has(r.name));
		const hiddenCount = roomsData.rooms.length - visibleRooms.length;
		if (hiddenCount > 0) {
			html += `<p style="font-size:12px;color:#aaa;margin-bottom:8px">${esc(i18n.t('roomsHiddenHint').replace('{0}', hiddenCount))}</p>\n`;
		}

		for (const room of visibleRooms) {
			const devices = room.devices || [];
			const devCount = devices.length;
			const note =
				docModel.manualContext && docModel.manualContext.rooms && docModel.manualContext.rooms[room.name];
			const roomSummary = `${esc(room.name)} <span style="font-weight:400;color:var(--text-faint);font-size:13px">(${devCount} ${esc(i18n.t('members'))})</span>`;
			const summaryCls = note
				? 'maint-details-summary maint-details-summary--room-note'
				: 'maint-details-summary';
			html += `<details style="margin-bottom:8px">
<summary class="${summaryCls}">${roomSummary}</summary>
`;
			if (note) {
				html += `<div class="manual-context-box" style="margin-top:6px">${esc(note)}</div>\n`;
			}
			if (devCount === 0) {
				html += `<p style="color:var(--text-faint);font-size:14px;margin-top:6px"><em>${esc(i18n.t('noDevicesInRoom'))}</em></p>\n`;
			} else {
				html += `<div class="device-grid" style="margin-top:6px">\n`;
				for (const dev of devices) {
					const liveHtml = this._renderLiveValue(dev);
					html += `<div class="device-card">
  <span class="device-icon">${esc(dev.icon || '📦')}</span>
  <span class="device-name">${esc(dev.deviceName)}</span>${liveHtml}
</div>\n`;
				}
				html += `</div>\n`;
			}
			html += `</details>\n`;
		}

		// Functions — own h3 section so it's clearly separated from rooms
		if (roomsData.functions && roomsData.functions.length > 0) {
			html += `<h3 style="margin-top:28px">${esc(i18n.t('functions'))}</h3>
<details>
<summary class="maint-details-summary" style="font-size:14px;font-weight:400;color:var(--text-faint)">${esc(i18n.t('showFunctions') || 'Funktionen anzeigen')} (${roomsData.functions.length})</summary>
<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">\n`;
			for (const fn of roomsData.functions) {
				html += `<div style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:8px 14px;font-size:14px">
  <strong>${esc(fn.name)}</strong> <span style="color:var(--text-faint);font-size:12px">(${esc(fn.memberCount)})</span>
</div>\n`;
			}
			html += `</div>\n</details>\n`;
		}

		html += '<hr class="section-divider">\n';
		return html;
	}

	/**
	 * Render scripts chapter for User profile — name + description only.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML
	 */
	renderUserScriptsChapter(docModel) {
		const scriptsData = docModel.scripts;
		const i18n = this.i18n;

		const active = (scriptsData.scripts || []).filter(s => s.enabled && s.desc);
		if (active.length === 0) {
			return '';
		}

		let html = `<h2 id="scripts">${esc(i18n.t('automations'))}</h2>\n`;
		html += `<div class="adapter-list">\n`;
		for (const script of active) {
			html += `<div class="adapter-card">
  <strong>${esc(script.name)}</strong>
  <p class="adapter-desc">${esc(script.desc)}</p>
</div>\n`;
		}
		html += `</div>\n<hr class="section-divider">\n`;
		return html;
	}

	/**
	 * Render adapters chapter for User profile — title only, no tech details.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML
	 */
	renderUserAdaptersChapter(docModel) {
		const adapters = docModel.adapters;
		const i18n = this.i18n;
		const config = this.adapter.config;

		const hideAdapters = new Set(
			(config.userHideAdapters || []).map(a => a.adapter && a.adapter.trim()).filter(Boolean),
		);

		const active = adapters.adapters.filter(a => a.enabledInstances > 0 && !hideAdapters.has(a.name));
		const hiddenCount = adapters.adapters.filter(a => a.enabledInstances > 0 && hideAdapters.has(a.name)).length;

		let html = `<h2 id="adapter-instances">${esc(i18n.t('connectedSystems'))}</h2>\n`;
		if (hiddenCount > 0) {
			html += `<p style="font-size:12px;color:#aaa;margin-bottom:8px">${esc(i18n.t('adaptersHiddenHint').replace('{0}', hiddenCount))}</p>\n`;
		}
		html += `<div class="adapter-list">\n`;
		for (const adapter of active) {
			const displayName = adapter.title && adapter.title !== adapter.name ? adapter.title : adapter.name;
			const contextNote =
				docModel.manualContext &&
				docModel.manualContext.adapters &&
				docModel.manualContext.adapters[adapter.name]
					? `<div class="manual-context-box">${esc(docModel.manualContext.adapters[adapter.name])}</div>`
					: '';
			html += `<div class="adapter-card">
  <strong>${esc(displayName)}</strong>
  ${adapter.desc ? `<p class="adapter-desc">${esc(adapter.desc)}</p>` : ''}
  ${contextNote}
</div>\n`;
		}
		html += `</div>\n<hr class="section-divider">\n`;
		return html;
	}

	// ── Onboarding profile methods ──────────────────────────────────────────

	/**
	 * Render onboarding welcome header with system stats.
	 *
	 * @param {object} docModel Document model
	 * @param renderOptions
	 * @returns {string} HTML
	 */
	renderOnboardingWelcome(docModel, renderOptions) {
		if (this.onboardingChapterHidden(docModel, 'welcome')) {
			return '';
		}
		const config = this.adapter.config;
		const i18n = this.i18n;
		const sc = docModel.systemConfig || {};
		const city = sc.city || sc.location || '';
		const projectName = config.projectName || 'ioBroker System';

		const greeting = city
			? i18n.t('onboardingWelcomeCity', projectName, city)
			: i18n.t('onboardingWelcome', projectName);

		const hideManualCore = this.onboardingChapterHidden(docModel, 'manual');
		const contact =
			!hideManualCore && docModel.manualContext && docModel.manualContext.contact
				? docModel.manualContext.contact
				: '';
		const contactHtml = contact
			? `<div style="display:inline-flex;align-items:center;gap:8px;background:var(--manual-bg);border:1px solid var(--manual-border);border-radius:6px;padding:8px 14px;font-size:14px;margin-bottom:20px;color:var(--text)">
  <span style="font-size:18px">👤</span>
  <span><strong>${esc(i18n.t('contact'))}:</strong> ${esc(contact)}</span>
</div>\n`
			: '';

		const description =
			!hideManualCore && docModel.manualContext && docModel.manualContext.description
				? docModel.manualContext.description
				: '';
		const descHtml = description
			? `<p style="font-size:15px;color:var(--text);margin:0 0 16px;padding:12px 16px;background:var(--note-bg);border-left:4px solid var(--note-border);border-radius:0 6px 6px 0">${esc(description)}</p>\n`
			: '';

		// QR code section — inline SVG (server-side generated, no CDN) + copy-link button
		const copyLabel = esc(i18n.t('copyLink') || 'Link kopieren');
		const copiedLabel = esc(i18n.t('copied') || 'Kopiert!');
		const shareLabel = esc(i18n.t('scanToShare') || 'Seite teilen');
		const inlineSvg = (renderOptions && renderOptions.qrSvgs && renderOptions.qrSvgs.onboarding) || '';
		const onboardingPublicUrl = (renderOptions && renderOptions.urls && renderOptions.urls.onboarding) || '';
		const copyUrlJson = JSON.stringify(onboardingPublicUrl);
		const qrBlockHtml = inlineSvg
			? `<div style="background:#fff;padding:8px;border-radius:6px;border:1px solid var(--border);display:inline-block;line-height:0">${inlineSvg}</div>`
			: '';
		const qrHtml = `<div id="qr-section" style="float:right;margin:0 0 16px 24px;text-align:center;max-width:140px">
${qrBlockHtml}
  <div style="margin-top:6px">
    <button onclick="copyPageUrl(this)" style="font-size:13px;padding:6px 14px;border-radius:6px;border:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer;width:100%">📋 ${copyLabel}</button>
  </div>
  <div style="font-size:11px;color:var(--text-faint);margin-top:4px">${shareLabel}</div>
</div>
<script>
function copyPageUrl(btn) {
  var url = ${copyUrlJson};
  if (!url) { url = window.location.href; }
  var ok = function() {
    if (btn) { btn.textContent = '✅ ${copiedLabel}'; setTimeout(function(){ btn.textContent = '📋 ${copyLabel}'; }, 2000); }
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(url).then(ok).catch(function() { fallbackCopy(url, btn, ok); });
  } else {
    fallbackCopy(url, btn, ok);
  }
}
function fallbackCopy(text, btn, ok) {
  var ta = document.createElement('textarea');
  ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
  document.body.appendChild(ta); ta.focus(); ta.select();
  try { document.execCommand('copy'); ok(); } catch(e) { alert(text); }
  document.body.removeChild(ta);
}
</script>
`;

		const mc = docModel.manualContext;
		const hasManualContent =
			description ||
			contact ||
			(mc &&
				(mc.notes ||
					(mc.homeRoutinesNote && String(mc.homeRoutinesNote).trim()) ||
					guestHelpChapterHasContent(mc, docModel)));
		const setupHint = !hasManualContent
			? `<div style="margin:12px 0 16px;padding:10px 14px;border:1.5px dashed var(--border);border-radius:6px;font-size:13px;color:var(--text-faint)">
  💡 ${esc(i18n.t('onboardingSetupHint') || 'Tipp für Administratoren: Projektbeschreibung, Kontaktperson und Hinweise können in den Adapter-Einstellungen → „Meine Dokumentation" hinterlegt werden.')}
</div>\n`
			: '';

		return `<h1>${esc(greeting)}</h1>
${qrHtml}<p style="font-size:16px;color:var(--text-faint);margin:12px 0 16px">${esc(i18n.t('onboardingIntro'))}</p>
${descHtml}${contactHtml}${setupHint}<div style="clear:both"></div>
<hr class="section-divider">
`;
	}

	/**
	 * Render rooms for Onboarding — icon, device name, live value if available.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML
	 */
	renderOnboardingRooms(docModel) {
		const roomsData = docModel.rooms;
		const i18n = this.i18n;
		const config = this.adapter.config;

		const hideRooms = new Set((config.onboardingHideRooms || []).map(r => r.room && r.room.trim()).filter(Boolean));

		let html = `<h2 id="rooms">${esc(i18n.t('yourRooms'))}</h2>\n`;

		if (!roomsData || roomsData.totalRooms === 0) {
			html += `<p><em>${esc(i18n.t('noRoomsDefined'))}</em></p>\n`;
			html += '<hr class="section-divider">\n';
			return html;
		}

		const visibleRooms = roomsData.rooms.filter(r => !hideRooms.has(r.name));
		const hiddenCount = roomsData.rooms.length - visibleRooms.length;

		if (hiddenCount > 0) {
			html += `<p style="font-size:12px;color:#aaa;margin-bottom:12px">${esc(i18n.t('roomsHiddenHint').replace('{0}', hiddenCount))}</p>\n`;
		}

		for (const room of visibleRooms) {
			const devices = room.devices || [];
			const devCount = devices.length;
			const note =
				docModel.manualContext && docModel.manualContext.rooms && docModel.manualContext.rooms[room.name];
			const roomSummary = `${esc(room.name)} <span style="font-weight:400;color:var(--text-faint);font-size:13px">(${devCount} ${esc(i18n.t('members'))})</span>`;
			const summaryCls = note
				? 'maint-details-summary maint-details-summary--room-note'
				: 'maint-details-summary';
			html += `<details style="margin-bottom:8px">
<summary class="${summaryCls}">${roomSummary}</summary>
`;
			if (note) {
				html += `<div class="manual-context-box" style="margin-top:6px">${esc(note)}</div>\n`;
			}
			if (devCount === 0) {
				html += `<p style="color:var(--text-faint);font-size:14px;margin-top:6px"><em>${esc(i18n.t('noDevicesInRoom'))}</em></p>\n`;
			} else {
				html += `<div class="device-grid" style="margin-top:6px">\n`;
				for (const dev of devices) {
					const liveHtml = this._renderLiveValue(dev);
					html += `<div class="device-card">
  <span class="device-icon">${esc(dev.icon || '📦')}</span>
  <span class="device-name">${esc(dev.deviceName)}</span>${liveHtml}
</div>\n`;
				}
				html += `</div>\n`;
			}
			html += `</details>\n`;
		}

		html += '<hr class="section-divider">\n';
		return html;
	}

	/**
	 * Render automations section for Onboarding — scripts as plain sentences.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML
	 */
	renderOnboardingAutomations(docModel) {
		const scriptsData = docModel.scripts;
		const i18n = this.i18n;

		const active = (scriptsData.scripts || []).filter(s => s.enabled);

		let html = `<h2 id="automations">${esc(i18n.t('whatRunsAutomatically'))}</h2>\n`;

		if (active.length === 0) {
			html += `<p style="font-size:14px;color:var(--text-faint);font-style:italic">${esc(i18n.t('noActiveScripts'))}</p>\n`;
			html += '<hr class="section-divider">\n';
			return html;
		}

		html += `<p style="font-size:14px;color:var(--text-faint);margin-bottom:12px">${esc(i18n.t('automationsIntro'))}</p>\n`;

		const withDesc = active.filter(s => s.desc);
		const withoutDesc = active.filter(s => !s.desc);

		const scheduleMark = script => {
			if (!script.schedule || !String(script.schedule).trim()) {
				return '';
			}
			const human = this.describeCron(script.schedule, i18n);
			const title = esc(`${i18n.t('scriptHasScheduleTitle')}: ${script.schedule} (${human})`);
			return ` <span style="color:var(--link);font-size:15px;line-height:1;vertical-align:middle" title="${title}" aria-label="${title}">⏱</span>`;
		};

		if (withDesc.length > 0) {
			html += `<ul class="content-list">\n`;
			for (const script of withDesc) {
				html += `  <li><strong>${esc(script.name)}</strong>${scheduleMark(script)} — ${esc(script.desc)}</li>\n`;
			}
			html += `</ul>\n`;
		}

		if (withoutDesc.length > 0) {
			html += `<details style="margin-top:8px"><summary style="cursor:pointer;font-size:13px;color:var(--text-faint)">${esc(i18n.t('moreScripts').replace('{0}', withoutDesc.length))}</summary>\n`;
			html += `<ul class="content-list" style="margin-top:6px">\n`;
			for (const script of withoutDesc) {
				html += `  <li style="color:var(--text-faint)">${esc(script.name)}${scheduleMark(script)}</li>\n`;
			}
			html += `</ul></details>\n`;
		}

		html += '<hr class="section-divider">\n';
		return html;
	}

	/**
	 * Admin: ioBroker objects from getObjectView(system, schedule), if any (not JavaScript scripts).
	 *
	 * @param {object} docModel
	 * @returns {string}
	 */
	renderScheduleObjectsSection(docModel) {
		const list = docModel.scheduleObjects;
		if (!list || list.length === 0) {
			return '';
		}
		const i18n = this.i18n;
		let html = `<h2 id="schedule-objects">${esc(i18n.t('scheduleTypeObjects'))}</h2>
<p style="font-size:13px;color:var(--text-faint);line-height:1.5">${esc(i18n.t('scheduleTypeObjectsIntro'))}</p>
<table class="schedule-objects-table">
<thead><tr>
 <th>${esc(i18n.t('name'))}</th>
  <th>${esc(i18n.t('description'))}</th>
  <th>${esc(i18n.t('scriptStatus'))}</th>
</tr></thead>
<tbody>
`;
		for (const s of list) {
			const status = s.enabled ? i18n.t('active') : i18n.t('inactive');
			html += `<tr>
  <td><small style="color:var(--text-faint);word-break:break-all">${esc(s.id)}</small><br><strong>${esc(s.name)}</strong></td>
  <td><small>${esc(s.desc || '—')}</small></td>
  <td><span class="badge ${s.enabled ? 'badge-ok' : 'badge-off'}">${esc(status)}</span></td>
</tr>\n`;
		}
		html += `</tbody>\n</table>\n<hr class="section-divider">\n`;
		return html;
	}

	/**
	 * Render hint for Onboarding when no manualContext / AI configured.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML
	 */
	renderOnboardingHint(docModel) {
		const i18n = this.i18n;
		const mc = docModel.manualContext;
		const hasManual =
			mc &&
			(mc.description ||
				mc.notes ||
				mc.contact ||
				(mc.homeRoutinesNote && String(mc.homeRoutinesNote).trim()) ||
				guestHelpChapterHasContent(mc, docModel));
		const hasAi = !!(docModel.ai && (docModel.ai.user || docModel.ai.onboarding));
		if (hasManual || hasAi) {
			return '';
		}

		return `<div class="note-box" style="margin-top:24px">
  <strong>${esc(i18n.t('onboardingHintTitle'))}</strong><br>
  ${esc(i18n.t('onboardingHintText'))}
</div>\n`;
	}

	/**
	 * Render tips & notes section for Onboarding — shown prominently right after welcome.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML
	 */
	renderOnboardingNotes(docModel) {
		if (this.onboardingChapterHidden(docModel, 'tips')) {
			return '';
		}
		const i18n = this.i18n;
		const notes = docModel.manualContext && docModel.manualContext.notes;
		if (notes) {
			// Notes can be multi-line — render each line as a paragraph
			const lines = notes
				.split('\n')
				.map(l => l.trim())
				.filter(Boolean);
			const notesHtml =
				lines.length > 1
					? lines.map(l => `<p style="margin:0 0 8px">${esc(l)}</p>`).join('')
					: `<p style="margin:0">${esc(notes)}</p>`;
			return `<h2 id="tips">${esc(i18n.t('tipsAndNotes') || 'Hinweise & Tipps')}</h2>
<div class="note-box" style="font-size:15px;line-height:1.7">${notesHtml}</div>
<hr class="section-divider">
`;
		}
		// Friendly fallback when no notes are configured
		return `<h2 id="tips">${esc(i18n.t('tipsAndNotes') || 'Hinweise & Tipps')}</h2>
<div class="note-box" style="font-size:14px;color:var(--text-faint);line-height:1.6">
  ${esc(i18n.t('noNotesYet') || 'Für dieses Smart Home wurden noch keine besonderen Hinweise hinterlegt. Schau dich gerne um!')}
</div>
<hr class="section-divider">
`;
	}

	/**
	 * Render stat cards for Onboarding — shown after Tips & Notes for context.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML
	 */
	renderOnboardingStats(docModel) {
		const i18n = this.i18n;
		const totalDevices = docModel.rooms ? docModel.rooms.rooms.reduce((s, r) => s + (r.memberCount || 0), 0) : 0;
		return `<div class="stat-grid" style="margin-top:20px">
  <div class="stat-card"><div class="num">${esc(docModel.rooms ? docModel.rooms.totalRooms : 0)}</div><div class="label">${esc(i18n.t('rooms'))}</div></div>
  <div class="stat-card"><div class="num">${esc(totalDevices)}</div><div class="label">${esc(i18n.t('devices') || 'Geräte')}</div></div>
  <div class="stat-card"><div class="num">${esc(docModel.system.statistics.enabledInstanceCount)}</div><div class="label">${esc(i18n.t('activeAdapters'))}</div></div>
</div>
<hr class="section-divider">
`;
	}

	/**
	 * Render "What can this home do?" capabilities overview for Onboarding.
	 * Derives feature categories from enum.functions and device categories.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML
	 */
	renderOnboardingCapabilities(docModel) {
		const i18n = this.i18n;
		const roomsData = docModel.rooms;
		if (!roomsData) {
			return '';
		}

		// Icon map for known function/category names
		const iconMap = {
			licht: '💡',
			light: '💡',
			beleuchtung: '💡',
			lampe: '💡',
			lamp: '💡',
			rollladen: '🪟',
			shutter: '🪟',
			blind: '🪟',
			jalousie: '🪟',
			rollo: '🪟',
			heizung: '🌡️',
			heating: '🌡️',
			thermostat: '🌡️',
			klima: '❄️',
			climate: '❄️',
			ac: '❄️',
			kühlung: '❄️',
			steckdose: '🔌',
			socket: '🔌',
			outlet: '🔌',
			schalter: '🔌',
			switch: '🔌',
			sicherheit: '🔒',
			security: '🔒',
			alarm: '🔔',
			tür: '🚪',
			door: '🚪',
			fenster: '🪟',
			kamera: '📷',
			camera: '📷',
			musik: '🎵',
			media: '🎵',
			audio: '🎵',
			tv: '📺',
			fernseher: '📺',
			garten: '🌿',
			garden: '🌿',
			rasen: '🌿',
			bewässerung: '💧',
			irrigation: '💧',
			energie: '⚡',
			energy: '⚡',
			strom: '⚡',
			solar: '☀️',
			anwesenheit: '👤',
			presence: '👤',
			bewegung: '👁️',
			motion: '👁️',
			wetter: '🌤️',
			weather: '🌤️',
		};

		// Build capability list from enum.functions first
		const caps = [];
		if (roomsData.functions && roomsData.functions.length > 0) {
			for (const fn of roomsData.functions) {
				const key = fn.name.toLowerCase();
				const iconKey = Object.keys(iconMap).find(k => key.includes(k));
				caps.push({ name: fn.name, icon: iconKey ? iconMap[iconKey] : '⚙️', count: fn.memberCount });
			}
		} else {
			// Fallback: derive from device categories
			const catMap = new Map();
			for (const room of roomsData.rooms || []) {
				for (const dev of room.devices || []) {
					const cat = dev.category || '';
					if (cat && cat !== '—') {
						catMap.set(cat, (catMap.get(cat) || 0) + 1);
					}
				}
			}
			for (const [cat, count] of catMap.entries()) {
				const key = cat.toLowerCase();
				const iconKey = Object.keys(iconMap).find(k => key.includes(k));
				caps.push({ name: cat, icon: iconKey ? iconMap[iconKey] : '📦', count });
			}
		}

		if (caps.length === 0) {
			return '';
		}

		let html = `<h2 id="capabilities" style="margin-top:32px">${esc(i18n.t('onboardingCapabilities') || 'Was kann dieses Smart Home?')}</h2>
<p style="font-size:14px;color:var(--text-faint);margin-bottom:16px">${esc(i18n.t('onboardingCapabilitiesDesc') || 'Diese Bereiche sind in deinem Smart Home eingerichtet und steuerbar:')}</p>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:8px">
`;
		for (const cap of caps) {
			html += `<div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px 16px;display:flex;align-items:center;gap:10px">
  <span style="font-size:24px;line-height:1">${cap.icon}</span>
  <div>
    <div style="font-weight:600;font-size:14px">${esc(cap.name)}</div>
    <div style="font-size:12px;color:var(--text-faint)">${cap.count} ${esc(i18n.t('members'))}</div>
  </div>
</div>
`;
		}
		html += `</div>\n<hr class="section-divider">\n`;
		return html;
	}

	/**
	 * Render connected systems for Onboarding — collapsed by default, technical details hidden.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML
	 */
	renderOnboardingAdapters(docModel) {
		const adapters = docModel.adapters;
		const i18n = this.i18n;
		const config = this.adapter.config;

		const hideAdapters = new Set(
			(config.onboardingHideAdapters || []).map(a => a.adapter && a.adapter.trim()).filter(Boolean),
		);
		const visible = adapters.adapters.filter(a => a.enabledInstances > 0 && !hideAdapters.has(a.name));

		if (visible.length === 0) {
			return '';
		}

		let html = `<details style="margin-bottom:12px" id="adapter-instances">
<summary class="maint-details-summary">${esc(i18n.t('connectedSystems') || 'Verbundene Systeme')} <span style="font-weight:400;color:var(--text-faint);font-size:13px">(${visible.length})</span></summary>
<div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
`;
		for (const adapter of visible) {
			const displayName = adapter.title && adapter.title !== adapter.name ? adapter.title : adapter.name;
			const note =
				docModel.manualContext &&
				docModel.manualContext.adapters &&
				docModel.manualContext.adapters[adapter.name];
			html += `<div class="adapter-card">
  <div class="adapter-card-header"><strong>${esc(displayName)}</strong></div>
  ${adapter.desc ? `<p class="adapter-desc">${esc(adapter.desc)}</p>` : ''}
  ${note ? `<div class="manual-context-box">${esc(note)}</div>` : ''}
</div>\n`;
		}
		html += `</div>\n</details>\n<hr class="section-divider">\n`;
		return html;
	}

	// ── Shared helper ───────────────────────────────────────────────────────

	/**
	 * Render live value badge for a device member.
	 *
	 * @param {object} dev Device member with currentValue / unit
	 * @returns {string} HTML badge or empty string
	 */
	_renderLiveValue(dev) {
		if (dev.currentValue === null || dev.currentValue === undefined) {
			return '';
		}
		const val = String(dev.currentValue);
		const unit = dev.unit ? ` ${dev.unit}` : '';
		return ` <span class="badge badge-meta" style="font-size:11px">${esc(val + unit)}</span>`;
	}

	/**
	 * Public documentation URLs (from same base URL as QR / info states) — user/onboarding, optional admin.
	 *
	 * @param {object} [manualContext]
	 * @param {boolean} [includeAdmin]
	 * @param {'user'|'onboarding'|null} [omitLinkForProfile] When rendering User or Onboarding HTML, omit the link to
	 *  the **current** profile (avoids a redundant self-link; still shows the other public bookmark).
	 * @returns {string}
	 */
	_renderTroubleshootPublicLinksHtml(manualContext, includeAdmin, omitLinkForProfile = null) {
		const pl = manualContext && manualContext.troubleshootPublicLinks;
		if (!pl) {
			return '';
		}
		const t = v => v && String(v).trim();
		const items = [];
		if (includeAdmin && t(pl.admin) && omitLinkForProfile !== 'admin') {
			const label = this.i18n.t('troubleshootLinkAdmin');
			items.push(
				`<li><a href="${esc(pl.admin)}" rel="noopener noreferrer" target="_blank">${esc(label)}</a></li>`,
			);
		}
		if (t(pl.user) && omitLinkForProfile !== 'user') {
			const label = this.i18n.t('troubleshootLinkUser');
			items.push(
				`<li><a href="${esc(pl.user)}" rel="noopener noreferrer" target="_blank">${esc(label)}</a></li>`,
			);
		}
		if (t(pl.onboarding) && omitLinkForProfile !== 'onboarding') {
			const label = this.i18n.t('troubleshootLinkOnboarding');
			items.push(
				`<li><a href="${esc(pl.onboarding)}" rel="noopener noreferrer" target="_blank">${esc(label)}</a></li>`,
			);
		}
		if (items.length === 0) {
			return '';
		}
		const i18n = this.i18n;
		return `<div class="note-box" style="font-size:14px;line-height:1.6;margin:0 0 14px">
<p style="margin:0 0 8px;color:var(--text-faint)">${esc(i18n.t('troubleshootPublicLinksIntro'))}</p>
<ul style="margin:0;padding-left:20px">
${items.join('\n')}
</ul>
</div>\n`;
	}

	/**
	 * Optional one-line “at a glance” owner hints (Wi‑Fi, power, water, other).
	 *
	 * @param {object} [manualContext]
	 * @returns {string}
	 */
	_renderTroubleshootQuickFactsHtml(manualContext) {
		const mc = manualContext;
		if (!mc) {
			return '';
		}
		const t = v => v && String(v).trim();
		const rows = [
			[this.i18n.t('troubleshootWifiLabel'), t(mc.troubleshootWifiHint)],
			[this.i18n.t('troubleshootPowerLabel'), t(mc.troubleshootPowerHint)],
			[this.i18n.t('troubleshootWaterLabel'), t(mc.troubleshootWaterHint)],
			[this.i18n.t('troubleshootExtraLabel'), t(mc.troubleshootExtraHint)],
		].filter(([, v]) => v);
		if (rows.length === 0) {
			return '';
		}
		const i18n = this.i18n;
		const dls = rows
			.map(
				([
					label,
					value,
				]) => `<div style="display:grid;grid-template-columns:minmax(88px,32%) 1fr;gap:6px 12px;margin:0 0 8px;align-items:start">
  <dt style="margin:0;font-weight:600;font-size:13px;color:var(--text-muted)">${esc(label)}</dt>
  <dd style="margin:0;font-size:14px">${esc(value)}</dd>
</div>`,
			)
			.join('');
		return `<div class="manual-context-box" style="margin:0 0 14px">
<p style="margin:0 0 8px;font-weight:600;font-size:14px">${esc(i18n.t('troubleshootQuickFactsTitle'))}</p>
${dls}
</div>\n`;
	}

	/**
	 * Auto checklist from the same scan as Admin diagnosis (concrete finding: Node runtime) — family wording.
	 *
	 * @param {object} docModel Document model
	 * @returns {string}
	 */
	_renderFamilyDiagnosisSnapshotHtml(docModel) {
		if (!hasFamilyDiagnosisSnapshot(docModel)) {
			return '';
		}
		const i18n = this.i18n;
		const nv = (docModel.system && docModel.system.primaryHost && docModel.system.primaryHost.nodeVersion) || '—';
		return `<div class="note-box" style="margin:0 0 14px;font-size:14px;line-height:1.65;border-left:4px solid var(--note-border)">
<p style="margin:0 0 8px;font-weight:600">${esc(i18n.t('troubleshootSnapshotNodeTitle'))}</p>
<p style="margin:0 0 8px;font-size:12px;color:var(--text-faint)">${esc(i18n.t('troubleshootSnapshotDisclaimer'))}</p>
<p style="margin:0 0 6px;font-size:12px;color:var(--text-muted)"><code>${esc(nv)}</code></p>
<ol style="margin:0;padding-left:20px">
  <li>${esc(i18n.t('troubleshootSnapshotNodeStep1'))}</li>
  <li>${esc(i18n.t('troubleshootSnapshotNodeStep2'))}</li>
  <li>${esc(i18n.t('troubleshootSnapshotNodeStep3'))}</li>
</ol>
</div>\n`;
	}

	/**
	 * Guest/family: hybrid “help & emergencies” (optional auto links, quick facts, snapshot checklists, long owner text).
	 *
	 * @param {object} docModel Document model
	 * @param {string} profile {@link PROFILE_USER} or {@link PROFILE_ONBOARDING} — omits the bookmark to the current profile
	 * @returns {string}
	 */
	_renderGuestHelpChapter(docModel, profile) {
		const mc = docModel && docModel.manualContext;
		if (!guestHelpChapterHasContent(mc, docModel)) {
			return '';
		}
		const i18n = this.i18n;
		const note = mc && mc.guestHelpNote;
		const parts = [];
		const omitLinkForProfile =
			profile === PROFILE_USER ? 'user' : profile === PROFILE_ONBOARDING ? 'onboarding' : null;
		parts.push(`<h2 id="guest-help">${esc(i18n.t('guestHelpTitle'))}</h2>\n`);
		parts.push(this._renderTroubleshootPublicLinksHtml(mc, false, omitLinkForProfile));
		parts.push(this._renderTroubleshootQuickFactsHtml(mc));
		parts.push(this._renderFamilyDiagnosisSnapshotHtml(docModel));
		if (note && String(note).trim()) {
			parts.push(
				`<div class="note-box guest-help-box" style="font-size:15px;line-height:1.7;border-left:4px solid var(--note-border)">${formatMultilineManualHtml(note)}</div>\n`,
			);
		}
		parts.push('<hr class="section-divider">\n');
		return parts.join('');
	}

	/**
	 * Residents’ description of routines (complements technical script list).
	 *
	 * @param {object} [manualContext]
	 * @returns {string}
	 */
	_renderHomeRoutinesChapter(manualContext) {
		const note = manualContext && manualContext.homeRoutinesNote;
		if (!note || !String(note).trim()) {
			return '';
		}
		const i18n = this.i18n;
		return `<h2 id="home-routines">${esc(i18n.t('homeRoutinesTitle'))}</h2>
<p style="font-size:14px;color:var(--text-faint);margin:0 0 10px">${esc(i18n.t('homeRoutinesIntro'))}</p>
<div class="manual-context-box" style="font-size:15px;line-height:1.7">${formatMultilineManualHtml(note)}</div>
<hr class="section-divider">\n`;
	}

	// ── Navigation ──────────────────────────────────────────────────────────

	/**
	 * Admin sidebar: "Scripts" entry with optional nested links (state references, shared states).
	 *
	 * @param {object} [docModel]
	 * @returns {string} One `<li>…</li>` block, or empty string if chapter hidden
	 */
	buildAdminScriptsNavItem(docModel) {
		const dm = docModel || {};
		if (this.adminChapterHidden(dm, 'scripts')) {
			return '';
		}
		const i18n = this.i18n;
		const scriptsData = dm.scripts || {};
		const scriptList = scriptsData.scripts || [];
		const scriptsWithRefs = scriptList.filter(s => s.stateRefs && s.stateRefs.length > 0);
		const crossRef = scriptsData.stateCrossRef || [];
		const sharedStates = crossRef.filter(entry => entry.scripts && entry.scripts.length > 1);

		const sub = [];
		if (scriptsWithRefs.length > 0) {
			sub.push(`<li><a href="#state-references">${esc(i18n.t('stateReferences'))}</a></li>`);
		}
		if (sharedStates.length > 0) {
			sub.push(`<li><a href="#shared-states">${esc(i18n.t('sharedStates'))}</a></li>`);
		}

		if (sub.length === 0) {
			return `<li><a href="#scripts">${esc(i18n.t('scripts'))}</a></li>`;
		}
		return `<li><a href="#scripts">${esc(i18n.t('scripts'))}</a>
<ul class="toc-nested">
${sub.join('\n')}
</ul>
</li>`;
	}

	/**
	 * Build navigation sidebar HTML.
	 *
	 * @param {string} profile Documentation profile
	 * @param {object} [docModel] optional — admin nav may link to schedule objects when present
	 * @returns {string} Nav HTML
	 */
	renderNav(profile, docModel) {
		const i18n = this.i18n;
		let links = '';

		if (profile === PROFILE_ONBOARDING) {
			const dm = docModel || {};
			const oh = k => this.onboardingChapterHidden(dm, k);
			const mcOb = dm.manualContext;
			const obLines = [];
			if (!oh('quickstart')) {
				obLines.push(`<li><a href="#quick-start">${esc(i18n.t('quickStart'))}</a></li>`);
			}
			if (!oh('tips')) {
				obLines.push(`<li><a href="#tips">${esc(i18n.t('tipsAndNotes') || 'Hinweise & Tipps')}</a></li>`);
			}
			if (!oh('guestHelp') && mcOb && guestHelpChapterHasContent(mcOb, dm)) {
				obLines.push(`<li><a href="#guest-help">${esc(i18n.t('guestHelpTitle'))}</a></li>`);
			}
			if (dm.ai?.onboarding && !oh('ai')) {
				obLines.push(`<li><a href="#ai-summary">${esc(i18n.t('aiSummary'))}</a></li>`);
			}
			if (!oh('capabilities')) {
				obLines.push(
					`<li><a href="#capabilities">${esc(i18n.t('onboardingCapabilities') || 'Was kann dieses Smart Home?')}</a></li>`,
				);
			}
			if (!oh('rooms')) {
				obLines.push(`<li><a href="#rooms">${esc(i18n.t('yourRooms'))}</a></li>`);
			}
			if (!oh('routines') && mcOb && mcOb.homeRoutinesNote && String(mcOb.homeRoutinesNote).trim()) {
				obLines.push(`<li><a href="#home-routines">${esc(i18n.t('homeRoutinesTitle'))}</a></li>`);
			}
			if (!oh('automations')) {
				obLines.push(`<li><a href="#automations">${esc(i18n.t('whatRunsAutomatically'))}</a></li>`);
			}
			if (!oh('adapters')) {
				obLines.push(`<li><a href="#adapter-instances">${esc(i18n.t('connectedSystems'))}</a></li>`);
			}
			obLines.push(this.renderCustomSectionNavItems(PROFILE_ONBOARDING, docModel));
			links = obLines.filter(Boolean).join('\n');
		} else if (profile === PROFILE_USER) {
			const dm = docModel || {};
			const uh = k => this.userChapterHidden(dm, k);
			const mcUs = dm.manualContext;
			const usLines = [];
			if (!uh('manual') && mcUs && (mcUs.description || mcUs.contact || mcUs.notes)) {
				usLines.push(`<li><a href="#manual-information">${esc(i18n.t('manualInformation'))}</a></li>`);
			}
			if (dm.ai?.user && !uh('ai')) {
				usLines.push(`<li><a href="#ai-summary">${esc(i18n.t('aiSummary'))}</a></li>`);
			}
			if (!uh('guestHelp') && mcUs && guestHelpChapterHasContent(mcUs, dm)) {
				usLines.push(`<li><a href="#guest-help">${esc(i18n.t('guestHelpTitle'))}</a></li>`);
			}
			if (!uh('atAGlance') && dm.quickStart && dm.quickStart.hasContent) {
				usLines.push(`<li><a href="#at-a-glance">${esc(i18n.t('atAGlanceTitle'))}</a></li>`);
			}
			if (!uh('rooms')) {
				usLines.push(`<li><a href="#rooms-and-functions">${esc(i18n.t('roomsAndFunctions'))}</a></li>`);
			}
			if (!uh('scripts')) {
				usLines.push(`<li><a href="#scripts">${esc(i18n.t('automations'))}</a></li>`);
			}
			if (!uh('routines') && mcUs && mcUs.homeRoutinesNote && String(mcUs.homeRoutinesNote).trim()) {
				usLines.push(`<li><a href="#home-routines">${esc(i18n.t('homeRoutinesTitle'))}</a></li>`);
			}
			if (!uh('adapters')) {
				usLines.push(`<li><a href="#adapter-instances">${esc(i18n.t('connectedSystems'))}</a></li>`);
			}
			usLines.push(this.renderCustomSectionNavItems(PROFILE_USER, docModel));
			links = usLines.filter(Boolean).join('\n');
		} else {
			const dm = docModel || {};
			const order = (dm && dm.adminChapterOrder) || DEFAULT_ADMIN_CHAPTER_ORDER;
			const frags = [];
			for (const key of order) {
				const frag = this.buildAdminNavFragmentForKey(dm, key);
				if (frag) {
					frags.push(frag);
				}
			}
			links = frags.join('\n');
		}

		return `<h2>${esc(i18n.t('tableOfContents'))}</h2>
<ul>${links}</ul>`;
	}

	/**
	 * Render document header with metadata.
	 *
	 * @param {object} docModel Document model
	 * @param {string} profile Target profile
	 * @returns {string} Header HTML
	 */
	renderHeader(docModel, profile) {
		const config = this.adapter.config;
		const i18n = this.i18n;
		const generatedAt = docModel.meta.generatedAt;

		// Adapter health badge
		const stats = docModel.system && docModel.system.statistics;
		let healthBadge = '';
		if (stats && stats.instanceCount > 0) {
			const total = stats.instanceCount;
			const active = stats.enabledInstanceCount;
			const healthClass = active >= total * 0.9 ? 'health-ok' : 'health-warn';
			healthBadge = `<span class="health-badge ${healthClass}">${active}/${total} ${esc(i18n.t('adaptersActive') || 'aktiv')}</span>`;
		}

		// Stale warning — client-side JS checks age against 7 days
		const staleWarning = `<div id="stale-warning" class="stale-warning" style="display:none">
  ⚠️ <span id="stale-msg">${esc(i18n.t('staleDocsWarning') || 'Diese Dokumentation könnte veraltet sein.')}</span>
</div>
<script>
(function(){
  var ts = ${JSON.stringify(generatedAt)};
  var age = (Date.now() - new Date(ts).getTime()) / 86400000;
  if (age > 7) {
    var el = document.getElementById('stale-warning');
    if (el) {
      document.getElementById('stale-msg').textContent = (age > 30
        ? '${esc(i18n.t('staleDocsOld') || 'Dokumentation ist älter als 30 Tage — bitte neu generieren.')} '
        : '${esc(i18n.t('staleDocsWeek') || 'Dokumentation ist älter als 7 Tage.')} ')
        + '(${esc(i18n.t('generated') || 'Generiert')}: ' + new Date(ts).toLocaleDateString() + ')';
      el.style.display = 'flex';
    }
  }
})();
</script>`;

		return `${staleWarning}<h1>${esc(i18n.t('projectDocumentation', config.projectName || 'ioBroker System'))}${healthBadge}</h1>
<dl class="meta">
  <dt>${esc(i18n.t('generated'))}</dt><dd id="gen-time" data-iso="${esc(generatedAt)}">${esc(new Date(generatedAt).toLocaleString())}</dd>
  <dt>${esc(i18n.t('profile'))}</dt><dd>${esc(profile)}</dd>
  <dt>${esc(i18n.t('system'))}</dt><dd>${esc(config.targetSystem || 'Production')}</dd>
  <dt>${esc(i18n.t('trigger'))}</dt><dd>${esc(docModel.meta.trigger)}</dd>
</dl>
<hr class="section-divider">
`;
	}

	/**
	 * Render AI-generated summary box.
	 *
	 * @param {{narrative: string, recommendations: string}} ai AI content
	 * @param {{ sourceTag?: string }} [opts] Optional `sourceTag` for HTML debug comment (primary vs fallback KI source)
	 * @returns {string} AI section HTML
	 */
	renderAiSection(ai, opts) {
		const sourceTag = opts && opts.sourceTag ? opts.sourceTag : '';
		const debugLead = sourceTag ? `<!-- autodoc-ai:${sourceTag} -->\n` : '';
		const recLines = (ai.recommendations || '')
			.split('\n')
			.filter(l => {
				const t = l.trim();
				if (!t) {
					return false;
				}
				if (/^[-*•]\s*$/.test(t) || /^[-*•]\s*[*•\s]+$/.test(t)) {
					return false;
				}
				if (/^\*\s*$/.test(t)) {
					return false;
				}
				return true;
			})
			.map(l => `<li>${esc(l.replace(/^[-*•]\s*/, '').replace(/^\\+\*\s*/, ''))}</li>`)
			.join('\n');

		const recsHtml = recLines
			? `<ul class="ai-recommendations-list">${recLines}</ul>`
			: `<p class="ai-recommendations">${esc(ai.recommendations)}</p>`;

		const i18n = this.i18n;
		return `${debugLead}<div class="ai-box" id="ai-summary">
  <div class="ai-box-label">${esc(i18n.t('aiSummary'))}</div>
  ${ai.narrative ? `<p class="ai-narrative">${esc(ai.narrative)}</p>` : ''}
  ${ai.recommendations ? recsHtml : ''}
</div>
`;
	}

	/**
	 * @param {object} item Quick-start system line descriptor
	 * @returns {string}
	 */
	_formatQuickStartSystemLine(item) {
		const i18n = this.i18n;
		if (!item || !item.kind) {
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
	 * @param {object} rg — { name, deviceCount, highlights: [{ deviceName, icon, valueText }] }
	 * @returns {string}
	 */
	_renderRoomGuideCardHtml(rg) {
		const i18n = this.i18n;
		const hi = (rg.highlights || [])
			.map(
				h =>
					`<li><span style="font-size:16px;margin-right:4px" aria-hidden="true">${esc(h.icon || '📦')}</span> ${esc(h.deviceName)}${
						h.valueText ? ` <span style="color:var(--text-muted)">· ${esc(h.valueText)}</span>` : ''
					}</li>`,
			)
			.join('');
		return `<div class="manual-context-box" style="padding:12px 14px">
  <div style="font-weight:600;margin-bottom:8px">${esc(rg.name)} <span style="font-size:12px;color:var(--text-faint)">(${esc(
		i18n.t('qsRoomCardDevices', rg.deviceCount),
  )})</span></div>
  <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.5">
  ${hi}
  </ul>
</div>`;
	}

	/**
	 * User profile — compact quick overview (Phase 5.x.2), same `quickStart` model as Onboarding.
	 *
	 * @param {object} docModel Document model
	 * @returns {string}
	 */
	renderUserAtAGlance(docModel) {
		const i18n = this.i18n;
		const qs = docModel.quickStart || { hasContent: false, systemItems: [], roomGuides: [] };
		if (!qs.hasContent) {
			return '';
		}
		const sysLines = (qs.systemItems || [])
			.map(it => {
				const line = this._formatQuickStartSystemLine(it);
				return line ? `  <li>${esc(line)}</li>` : '';
			})
			.filter(Boolean)
			.join('\n');
		const roomBlock = (qs.roomGuides || []).map(rg => this._renderRoomGuideCardHtml(rg)).join('\n');
		return `<h2 id="at-a-glance">${esc(i18n.t('atAGlanceTitle'))}</h2>
<p style="font-size:14px;color:var(--text-muted)">${esc(i18n.t('atAGlanceIntro'))}</p>
${sysLines ? `<h3>${esc(i18n.t('qsSystemTitle'))}</h3>\n<ul class="content-list">\n${sysLines}\n</ul>\n` : ''}
${
	roomBlock
		? `<h3 style="margin-top:20px">${esc(i18n.t('qsRoomGuidesTitle'))}</h3>
<div class="room-guide-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">
${roomBlock}
</div>\n`
		: ''
}
<hr class="section-divider">
`;
	}

	/**
	 * Render Quick Start section for Onboarding profile.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} Quick start HTML
	 */
	renderQuickStart(docModel) {
		const system = docModel.system;
		const i18n = this.i18n;
		const qs = docModel.quickStart || { hasContent: false, systemItems: [], roomGuides: [] };

		let structured = '';
		if (qs.hasContent) {
			const sysLines = (qs.systemItems || [])
				.map(it => {
					const line = this._formatQuickStartSystemLine(it);
					return line ? `  <li>${esc(line)}</li>` : '';
				})
				.filter(Boolean)
				.join('\n');
			const roomBlock = (qs.roomGuides || []).map(rg => this._renderRoomGuideCardHtml(rg)).join('\n');
			const head = `<p style="font-size:14px;color:var(--text-muted);margin:8px 0 12px">${esc(
				i18n.t('quickStartStructuredIntro'),
			)}</p>`;
			const sysBlock = sysLines
				? `<h3>${esc(i18n.t('qsSystemTitle'))}</h3>
<ul class="content-list">
${sysLines}
</ul>
`
				: '';
			const roomPart = roomBlock
				? `<h3 style="margin-top:20px">${esc(i18n.t('qsRoomGuidesTitle'))}</h3>
<div class="room-guide-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">
${roomBlock}
</div>
`
				: '';
			structured = `${head}${sysBlock}${roomPart}`;
		}

		return `<h2 id="quick-start">${esc(i18n.t('quickStart'))}</h2>
<p>${esc(i18n.t('quickStartWelcome'))}</p>
${structured}
<div class="stat-grid">
  <div class="stat-card"><div class="num">${esc(system.statistics.enabledInstanceCount)}</div><div class="label">${esc(i18n.t('activeAdapters'))}</div></div>
  <div class="stat-card"><div class="num">${esc(system.statistics.instanceCount)}</div><div class="label">${esc(i18n.t('totalInstances'))}</div></div>
</div>
<h3>${esc(i18n.t('nextSteps'))}</h3>
<ul class="content-list">
  <li>${esc(i18n.t('nextStepsReview'))}</li>
  <li>${esc(i18n.t('nextStepsManual'))}</li>
  <li>${esc(i18n.t('nextStepsAdapters'))}</li>
</ul>
<hr class="section-divider">
`;
	}

	/**
	 * Render system overview chapter.
	 *
	 * @param {object} docModel Document model
	 * @param {string} profile Documentation profile
	 * @returns {string} System chapter HTML
	 */
	renderSystemChapter(docModel, profile) {
		const system = docModel.system;
		const stats = system.statistics;
		const i18n = this.i18n;

		let html = `<h2 id="system-overview">${esc(i18n.t('systemOverview'))}</h2>
<h3>${esc(i18n.t('projectInformation'))}</h3>
<dl class="meta">
  <dt>${esc(i18n.t('projectName'))}</dt><dd>${esc(system.projectName)}</dd>
  <dt>${esc(i18n.t('targetSystem'))}</dt><dd>${esc(system.targetSystem)}</dd>
</dl>
<h3>${esc(i18n.t('primaryHost'))}</h3>
<dl class="meta">
  <dt>${esc(i18n.t('name'))}</dt><dd>${esc(system.primaryHost.name)}</dd>
  <dt>${esc(i18n.t('hostRuntimePlatform'))}</dt><dd>${esc(system.primaryHost.platform)}</dd>
  <dt>${esc(i18n.t('version'))}</dt><dd>${esc(system.primaryHost.version)}</dd>
  ${system.primaryHost.nodeVersion ? `<dt>${esc(i18n.t('nodeVersion'))}</dt><dd>${this.renderNodeVersionBadge(system.primaryHost.nodeVersion, i18n)}</dd>` : ''}
  ${system.primaryHost.npmVersion ? `<dt>${esc(i18n.t('npmVersion'))}</dt><dd><code class="inline-state-id">${esc(system.primaryHost.npmVersion)}</code></dd>` : ''}
  ${system.primaryHost.operatingSystem ? `<dt>${esc(i18n.t('operatingSystem'))}</dt><dd>${esc(system.primaryHost.operatingSystem)}</dd>` : ''}
</dl>
<h3>${esc(i18n.t('systemStatistics'))}</h3>
<div class="stat-grid">
  <div class="stat-card"><div class="num">${esc(stats.instanceCount)}</div><div class="label">${esc(i18n.t('totalAdapterInstances'))}</div></div>
  <div class="stat-card"><div class="num">${esc(stats.enabledInstanceCount)}</div><div class="label">${esc(i18n.t('enabledInstances'))}</div></div>
  <div class="stat-card"><div class="num">${esc(stats.disabledInstanceCount)}</div><div class="label">${esc(i18n.t('disabledInstances'))}</div></div>
`;

		if (this.shouldShowDetail(profile, 'admin')) {
			html += `  <div class="stat-card"><div class="num">${esc(stats.totalStateObjects)}</div><div class="label">${esc(i18n.t('totalStateObjects'))}</div></div>
  <div class="stat-card"><div class="num">${esc(stats.writableStateObjects)}</div><div class="label">${esc(i18n.t('writableStates'))}</div></div>
  <div class="stat-card"><div class="num">${esc(stats.readonlyStateObjects)}</div><div class="label">${esc(i18n.t('readOnlyStates'))}</div></div>
`;
			// Pending adapter updates
			if (stats.pendingUpdates > 0) {
				html += `  <div class="stat-card" style="border-color:#ffc107"><div class="num" style="color:#856404">${esc(stats.pendingUpdates)}</div><div class="label">${esc(i18n.t('pendingUpdates') || 'Updates verfügbar')}</div></div>\n`;
			}
			// Last backup
			if (stats.lastBackup) {
				const backupDate = new Date(stats.lastBackup);
				const backupAgeMs = Date.now() - backupDate.getTime();
				const backupAgeDays = Math.floor(backupAgeMs / 86400000);
				const backupStyle = backupAgeDays > 7 ? 'color:#856404' : 'color:#155724';
				const backupLabel =
					backupAgeDays === 0
						? i18n.t('today') || 'heute'
						: backupAgeDays === 1
							? i18n.t('yesterday') || 'gestern'
							: `${backupAgeDays}d`;
				html += `  <div class="stat-card" title="${esc(backupDate.toLocaleString())}"><div class="num" style="${backupStyle}">${esc(backupLabel)}</div><div class="label">${esc(i18n.t('lastBackup') || 'Letztes Backup')}</div></div>\n`;
			}
		}

		html += `</div>
`;

		// Location + Timezone (Repository badge goes to Diagnosis section)
		const loc = system.location;
		if (loc && (loc.city || loc.country || loc.timezone)) {
			const locParts = [loc.city, loc.country].filter(Boolean).join(', ');
			html += `<h3>${esc(i18n.t('location') || 'Standort')}</h3>
<dl class="meta">
${locParts ? `  <dt>${esc(i18n.t('city') || 'Ort')}</dt><dd>${esc(locParts)}</dd>` : ''}
${loc.timezone ? `  <dt>${esc(i18n.t('timezone') || 'Zeitzone')}</dt><dd>${esc(loc.timezone)}</dd>` : ''}
</dl>
`;
		}

		if (this.shouldShowDetail(profile, 'admin') && system.hosts.length > 0) {
			const hostRes = system.hostResources || {};
			html += `<h3>${esc(i18n.t('hosts'))}</h3>
<table>
<thead><tr><th>${esc(i18n.t('name'))}</th><th>${esc(i18n.t('hostRuntimePlatform'))}</th><th>${esc(i18n.t('operatingSystem'))}</th><th>${esc(i18n.t('version'))}</th><th>${esc(i18n.t('nodeVersion'))}</th><th>${esc(i18n.t('npmVersion'))}</th><th>RAM</th><th>CPU</th><th>${esc(i18n.t('uptime') || 'Laufzeit')}</th></tr></thead>
<tbody>
${system.hosts
	.map(h => {
		const res = hostRes[h.name] || {};
		// Prefer system RAM (native); fall back to adapter-total then js-controller process
		let ramHtml;
		if (res.sysTotalMb && res.sysFreeMb !== null) {
			const usedMb = res.sysTotalMb - res.sysFreeMb;
			const tooltipText = esc(i18n.t('ramSystemTooltip') || 'Belegter / Gesamter System-RAM');
			ramHtml = `<span title="${tooltipText}">${usedMb} / ${res.sysTotalMb} MB</span>`;
		} else if (res.adapterTotalMb) {
			const tooltipText = esc(
				i18n.t('ramAdapterTooltip') || 'Summe aller ioBroker-Prozesse (js-controller + alle Adapter-Instanzen)',
			);
			ramHtml = `~${res.adapterTotalMb} MB <small style="color:var(--text-faint)" title="${tooltipText}">(${esc(i18n.t('allAdapters') || 'alle Adapter')})</small>`;
		} else if (res.procMb) {
			const tooltipText = esc(
				i18n.t('ramHostTooltip') ||
					'Nur der ioBroker Host-Prozess (js-controller). Adapter-Instanzen sind separate Prozesse.',
			);
			ramHtml = `~${res.procMb} MB <small style="color:var(--text-faint)" title="${tooltipText}">(js-controller)</small>`;
		} else {
			ramHtml = '—';
		}
		const cpuHtml = res.cpu !== null && res.cpu !== undefined ? `${res.cpu} %` : '—';
		const uptimeSec = res.uptime;
		let uptimeHtml = '—';
		if (uptimeSec) {
			const d = Math.floor(uptimeSec / 86400);
			const h2 = Math.floor((uptimeSec % 86400) / 3600);
			uptimeHtml = d > 0 ? `${d}d ${h2}h` : `${h2}h`;
		}
		return `<tr>
  <td>${esc(h.name)}</td>
  <td>${esc(h.platform)}</td>
  <td>${esc(formatOperatingSystemLine(h) || '—')}</td>
  <td>${esc(h.version)}</td>
  <td>${h.nodeVersion ? this.renderNodeVersionBadge(h.nodeVersion, i18n) : '—'}</td>
  <td>${h.npmVersion ? `<code class="inline-state-id">${esc(h.npmVersion)}</code>` : '—'}</td>
  <td>${ramHtml}</td>
  <td><small>${cpuHtml}</small></td>
  <td><small>${uptimeHtml}</small></td>
</tr>`;
	})
	.join('\n')}
</tbody>
</table>
`;
		}

		html += '<hr class="section-divider">\n';
		return html;
	}

	/**
	 * Render a Node.js version string with an ok/warning badge.
	 *
	 * @param {string} nodeVersion Node.js version string, e.g. "v20.11.0"
	 * @param {object} i18n i18n instance
	 * @returns {string} HTML span with badge
	 */
	renderNodeVersionBadge(nodeVersion, i18n) {
		const match = nodeVersion.match(/v?(\d+)/);
		const major = match ? parseInt(match[1], 10) : 0;
		const isLts = major >= 20 && major % 2 === 0;
		if (isLts) {
			const label = i18n.t('nodeVersionOk').replace('{0}', esc(nodeVersion));
			return `<span class="badge badge-ok">${label}</span>`;
		}
		const label = i18n.t('nodeVersionOutdated').replace('{0}', esc(nodeVersion));
		return `<span class="badge badge-off">${label}</span>`;
	}

	/**
	 * Return a human-readable folder label for a script.
	 *
	 * @param {string|null} folder Raw folder string from discovery (null = root)
	 * @param {object} i18n i18n instance
	 * @returns {string} Translated folder label
	 */
	scriptFolderLabel(folder, i18n) {
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
	 * Convert a cron expression into a human-readable string.
	 * Handles the most common patterns; falls back to the raw expression.
	 *
	 * @param {string} cron Cron expression (5 or 6 fields)
	 * @param {object} i18n i18n instance
	 * @returns {string} Human-readable schedule description
	 */
	describeCron(cron, i18n) {
		if (!cron || typeof cron !== 'string') {
			return cron;
		}
		const parts = cron.trim().split(/\s+/);
		// Normalise: drop seconds field if 6 parts
		const [min, hour, dom, month, dow] = parts.length === 6 ? parts.slice(1) : parts;

		const every = i18n.t('cronEvery') || 'alle';
		const daily = i18n.t('cronDaily') || 'täglich';
		const hourly = i18n.t('cronHourly') || 'stündlich';
		const at = i18n.t('cronAt') || 'um';
		const days = [
			i18n.t('cronSun') || 'So',
			i18n.t('cronMon') || 'Mo',
			i18n.t('cronTue') || 'Di',
			i18n.t('cronWed') || 'Mi',
			i18n.t('cronThu') || 'Do',
			i18n.t('cronFri') || 'Fr',
			i18n.t('cronSat') || 'Sa',
		];

		// Every X minutes: */X * * * *
		const everyMin = min.match(/^\*\/(\d+)$/);
		if (everyMin && hour === '*' && dom === '*' && month === '*' && dow === '*') {
			return `${every} ${everyMin[1]} min`;
		}
		// Hourly: 0 * * * *
		if (min === '0' && hour === '*' && dom === '*' && month === '*' && dow === '*') {
			return hourly;
		}
		// Every X hours: 0 */X * * *
		const everyHour = hour.match(/^\*\/(\d+)$/);
		if (everyHour && dom === '*' && month === '*' && dow === '*') {
			return `${every} ${everyHour[1]}h`;
		}
		// Daily at fixed time: M H * * *
		if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === '*' && month === '*' && dow === '*') {
			return `${daily} ${at} ${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
		}
		// Weekdays Mon-Fri: M H * * 1-5
		if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === '*' && month === '*' && dow === '1-5') {
			return `Mo–Fr ${at} ${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
		}
		// Specific weekdays: M H * * d,d
		if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === '*' && month === '*' && dow !== '*') {
			const dayLabels = dow
				.split(',')
				.map(d => days[parseInt(d, 10)] || d)
				.join(',');
			return `${dayLabels} ${at} ${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
		}
		// Multiple times per day: M H1,H2 * * *
		if (/^\d+$/.test(min) && /^\d+(,\d+)+$/.test(hour) && dom === '*' && month === '*' && dow === '*') {
			const times = hour
				.split(',')
				.map(h => `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
				.join(', ');
			return `${daily} ${at} ${times}`;
		}
		// Fallback: return raw cron
		return cron;
	}

	/**
	 * Render adapters chapter.
	 *
	 * @param {object} docModel Document model
	 * @param {string} profile Documentation profile
	 * @returns {string} Adapters chapter HTML
	 */
	/**
	 * Render a host-distribution overview for multihost setups (Admin profile only).
	 * Shows which instances run on each host with Node.js/OS info.
	 * Only called when more than one host is detected.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML
	 */
	renderHostDistribution(docModel) {
		const i18n = this.i18n;
		const allHosts = docModel.system.hosts || [];
		const instancesByHost = (docModel.adapters && docModel.adapters.hosts) || {};

		// Build a lookup: hostName → host object (for Node.js / OS info)
		const hostInfoMap = {};
		for (const h of allHosts) {
			hostInfoMap[h.name] = h;
		}

		let html = `<h3>${esc(i18n.t('multihostDistribution') || 'Host Distribution')}</h3>\n`;
		html += `<div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px">\n`;

		for (const hostName of Object.keys(instancesByHost).sort()) {
			const instances = instancesByHost[hostName] || [];
			const info = hostInfoMap[hostName] || {};
			const nodeBadgeClass = info.nodeVersion && parseInt(info.nodeVersion) >= 20 ? 'badge-ok' : 'badge-warn';
			const nodeLabel = info.nodeVersion ? `Node.js ${esc(info.nodeVersion)}` : '';
			const osLine = formatOperatingSystemLine(info);
			const osLabel = osLine ? esc(osLine) : '';

			const enabledCount = instances.filter(i => i.enabled).length;
			const total = instances.length;

			const instanceBadges = instances
				.filter(i => i.enabled)
				.sort((a, b) => a.id.localeCompare(b.id))
				.map(
					i =>
						`<span style="display:inline-block;background:var(--th-bg);border:1px solid var(--border);border-radius:4px;padding:1px 6px;font-size:11px;margin:2px 2px 0 0;font-family:monospace">${esc(i.id)}</span>`,
				)
				.join('');

			html += `<div style="flex:1;min-width:260px;border:1px solid var(--border);border-radius:8px;padding:12px 16px;background:var(--surface)">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
    <strong style="font-size:14px">🖥 ${esc(hostName)}</strong>
    <span style="font-size:12px;color:var(--text-faint)">${enabledCount}/${total} ${esc(i18n.t('enabledInstances') || 'enabled')}</span>
  </div>
  <div style="margin-bottom:8px;display:flex;gap:6px;flex-wrap:wrap">
    ${nodeLabel ? `<span class="badge ${nodeBadgeClass}" style="font-size:11px">${nodeLabel}</span>` : ''}
    ${osLabel ? `<span class="badge badge-meta" style="font-size:11px">${osLabel}</span>` : ''}
  </div>
  <div>${instanceBadges}</div>
</div>\n`;
		}

		html += `</div>\n`;
		return html;
	}

	/**
	 * Adapter instances chapter (stats grid, optional multihost cards, table).
	 *
	 * @param {object} docModel Document model
	 * @param {string} profile Profile id (`admin` | `user` | `onboarding`)
	 * @returns {string} HTML fragment
	 */
	renderAdaptersChapter(docModel, profile) {
		const adapters = docModel.adapters;
		const config = this.adapter.config;
		const i18n = this.i18n;

		const totalInstances = adapters.adapters.reduce((sum, a) => sum + a.totalInstances, 0);

		let html = `<h2 id="adapter-instances">${esc(i18n.t('adapterInstances'))}</h2>
<div class="stat-grid">
  <div class="stat-card"><div class="num">${esc(adapters.totalAdapters)}</div><div class="label">${esc(i18n.t('totalAdapters'))}</div></div>
  <div class="stat-card"><div class="num">${esc(totalInstances)}</div><div class="label">${esc(i18n.t('totalInstances'))}</div></div>
</div>
`;

		if (profile === PROFILE_ADMIN) {
			// Multihost: show per-host distribution if more than one host is present
			const allHosts = (docModel.system && docModel.system.hosts) || [];
			if (allHosts.length > 1) {
				html += this.renderHostDistribution(docModel);
			}

			// Admin: table with technical details — enabled first, disabled collapsed
			const enabledAdapters = adapters.adapters.filter(a => a.enabledInstances > 0);
			const disabledAdapters = adapters.adapters.filter(a => a.enabledInstances === 0);

			/**
			 * Build a table row for an adapter.
			 *
			 * @param {object} adapter Adapter object from document model
			 * @returns {string} HTML table row
			 */
			const buildAdapterRow = adapter => {
				const displayName =
					adapter.title && adapter.title !== adapter.name
						? `<strong>${esc(adapter.title)}</strong><br><small style="color:var(--text-faint)">${esc(adapter.name)}</small>`
						: `<strong>${esc(adapter.name)}</strong>`;

				let instanceDetails = '';
				if (!config.hideInstanceDetailsInMarkdown) {
					instanceDetails = adapter.instances
						.map(inst => {
							let line = `<small>${esc(inst.id)} — <span class="badge ${inst.enabled ? 'badge-ok' : 'badge-off'}">${esc(inst.enabled ? i18n.t('enabled') : i18n.t('disabled'))}</span> v${esc(inst.version || '?')}`;
							if (inst.mode && inst.mode !== 'daemon') {
								line += ` · <span class="badge badge-meta" title="${esc(i18n.t('instanceRunMode'))}">${esc(inst.mode)}</span>`;
							}
							if (inst.scheduleCron && String(inst.scheduleCron).trim()) {
								const hum = this.describeCron(inst.scheduleCron, i18n);
								const cronTitle = esc(`${i18n.t('instanceScheduleCron')}: ${inst.scheduleCron}`);
								line += ` · <span class="badge badge-meta" title="${cronTitle}">\u23f1 ${esc(hum)}</span>`;
							}
							if (inst.restartSchedule && String(inst.restartSchedule).trim()) {
								const hum = this.describeCron(inst.restartSchedule, i18n);
								const rsTitle = esc(`${i18n.t('instanceRestartCron')}: ${inst.restartSchedule}`);
								line += ` · <span class="badge badge-meta" title="${rsTitle}">\u21bb ${esc(hum)}</span>`;
							}
							line += '</small>';
							return line;
						})
						.join('<br>');
				}

				const metaBadges = [];
				const ct = adapter.connectionType;
				if (ct && ct !== 'none' && ct !== '') {
					const ctLabel =
						ct === 'local' ? i18n.t('connTypeLocal') : ct === 'cloud' ? i18n.t('connTypeCloud') : esc(ct);
					metaBadges.push(`<span class="badge badge-meta" title="Verbindungstyp">${ctLabel}</span>`);
				}
				const ds = adapter.dataSource;
				if (ds && ds !== 'none' && ds !== '' && ds !== 'assumption') {
					const dsLabel = ds === 'push' ? i18n.t('dataPush') : ds === 'poll' ? i18n.t('dataPoll') : esc(ds);
					metaBadges.push(`<span class="badge badge-meta" title="Datenquelle">${dsLabel}</span>`);
				}
				if (adapter.tier) {
					const tierLabel =
						adapter.tier === 1
							? i18n.t('tierStable')
							: adapter.tier === 2
								? i18n.t('tierTested')
								: i18n.t('tierExperimental');
					metaBadges.push(
						`<span class="badge badge-meta" title="Qualitätsstufe ${esc(adapter.tier)}">${tierLabel}</span>`,
					);
				}
				const metaHtml =
					metaBadges.length > 0 ? `<br><span class="adapter-meta">${metaBadges.join(' ')}</span>` : '';

				const manualNote =
					docModel.manualContext &&
					docModel.manualContext.adapters &&
					docModel.manualContext.adapters[adapter.name]
						? `<br><span class="manual-context-note">${esc(docModel.manualContext.adapters[adapter.name])}</span>`
						: '';
				const hasAdapterManual = !!(
					docModel.manualContext &&
					docModel.manualContext.adapters &&
					docModel.manualContext.adapters[adapter.name]
				);

				return `<tr${hasAdapterManual ? ' class="table-row--manual-note"' : ''}>
  <td>${displayName}${instanceDetails ? `<br>${instanceDetails}` : ''}${metaHtml}</td>
  <td><small>${esc(adapter.desc || '—')}</small>${manualNote}</td>
  <td>${esc(adapter.totalInstances)}</td>
  <td>${esc(adapter.enabledInstances)}</td>
</tr>\n`;
			};

			const tableHead = `<thead><tr><th>${esc(i18n.t('name'))}</th><th>${esc(i18n.t('description'))}</th><th>${esc(i18n.t('totalInstances'))}</th><th>${esc(i18n.t('enabledInstances'))}</th></tr></thead>`;

			html += `<h3>${esc(i18n.t('adapterDetails'))}</h3>
<div class="adapter-filter-bar">
  <input type="text" id="adapter-filter" placeholder="${esc(i18n.t('adapterFilterPlaceholder'))}" autocomplete="off">
  <span id="adapter-filter-count"></span>
  <small class="adapter-filter-hint">${esc(i18n.t('adapterFilterHint'))}</small>
</div>
<table id="adapter-enabled-table">
${tableHead}
<tbody id="adapter-enabled-body">
`;
			for (const adapter of enabledAdapters) {
				html += buildAdapterRow(adapter);
			}
			html += `</tbody>\n</table>\n<p class="no-results" id="adapter-enabled-noresults">${esc(i18n.t('noAdaptersMatch'))}</p>\n`;

			if (disabledAdapters.length > 0) {
				const disabledLabel = i18n.t('disabledAdaptersGroup').replace('{0}', disabledAdapters.length);
				const anyDisabledManual = disabledAdapters.some(
					a =>
						docModel.manualContext &&
						docModel.manualContext.adapters &&
						docModel.manualContext.adapters[a.name],
				);
				const disSumCls = `maint-details-summary adapter-disabled-summary${anyDisabledManual ? ' maint-details-summary--room-note' : ''}`;
				html += `<details id="adapter-disabled-group" style="margin-top:12px">
<summary class="${disSumCls}">${esc(disabledLabel)}</summary>
<table id="adapter-disabled-table" style="margin-top:8px">
${tableHead}
<tbody id="adapter-disabled-body">
`;
				for (const adapter of disabledAdapters) {
					html += buildAdapterRow(adapter);
				}
				html += `</tbody>\n</table>\n<p class="no-results" id="adapter-disabled-noresults">${esc(i18n.t('noAdaptersMatch'))}</p>\n</details>\n`;
			}
		} else if (profile === PROFILE_USER) {
			// User: card-style list, only active adapters, description prominent
			html += `<div class="adapter-list">\n`;
			for (const adapter of adapters.adapters) {
				if (adapter.enabledInstances === 0) {
					continue;
				}
				const displayName = adapter.title && adapter.title !== adapter.name ? adapter.title : adapter.name;
				const userContextNote =
					docModel.manualContext &&
					docModel.manualContext.adapters &&
					docModel.manualContext.adapters[adapter.name]
						? `<div class="manual-context-box">${esc(docModel.manualContext.adapters[adapter.name])}</div>`
						: '';
				const cardManualCls = userContextNote ? ' adapter-card--has-manual' : '';
				html += `<div class="adapter-card${cardManualCls}">
  <div class="adapter-card-header">
    <strong>${esc(displayName)}</strong>
    <span class="badge badge-ok">${esc(i18n.t('enabled'))}</span>
  </div>
  ${adapter.desc ? `<p class="adapter-desc">${esc(adapter.desc)}</p>` : ''}
  ${userContextNote}
</div>\n`;
			}
			html += `</div>\n<p class="no-results">${esc(i18n.t('noAdaptersMatch'))}</p>\n`;
		} else if (profile === PROFILE_ONBOARDING) {
			// Onboarding: friendly cards for active adapters only, respecting hide list
			const hideAdapters = new Set(
				(config.onboardingHideAdapters || []).map(a => a.adapter && a.adapter.trim()).filter(Boolean),
			);
			const visibleAdapters = adapters.adapters.filter(a => !hideAdapters.has(a.name));
			const hiddenAdapterCount = adapters.adapters.length - visibleAdapters.length;

			if (hiddenAdapterCount > 0) {
				html += `<p style="font-size:12px;color:#aaa;margin-bottom:8px">${esc(i18n.t('adaptersHiddenHint').replace('{0}', hiddenAdapterCount))}</p>\n`;
			}

			html += `<div class="adapter-list">\n`;
			for (const adapter of visibleAdapters) {
				const displayName = adapter.title && adapter.title !== adapter.name ? adapter.title : adapter.name;
				const active = adapter.enabledInstances > 0;
				const statusText = active ? i18n.t('adapterRunsAutomatically') : i18n.t('adapterCurrentlyInactive');
				const onboardingContextNote =
					docModel.manualContext &&
					docModel.manualContext.adapters &&
					docModel.manualContext.adapters[adapter.name]
						? `<div class="manual-context-box">${esc(docModel.manualContext.adapters[adapter.name])}</div>`
						: '';
				const obCardCls = `adapter-card ${active ? '' : 'adapter-card-inactive'}${onboardingContextNote ? ' adapter-card--has-manual' : ''}`;
				html += `<div class="${obCardCls.trim()}">
  <div class="adapter-card-header">
    <strong>${esc(displayName)}</strong>
    <span class="badge ${active ? 'badge-ok' : 'badge-off'}">${esc(active ? i18n.t('adapterActive') : i18n.t('adapterInactive'))}</span>
  </div>
  ${adapter.desc ? `<p class="adapter-desc">${esc(adapter.desc)}</p>` : ''}
  ${onboardingContextNote}
  <small class="adapter-status-note">${esc(statusText)}</small>
</div>\n`;
			}
			html += `</div>\n<p class="no-results">${esc(i18n.t('noAdaptersMatch'))}</p>\n`;
		}

		html += `<hr class="section-divider">\n`;
		return html;
	}

	/**
	 * Render rooms and functions chapter.
	 *
	 * @param {object} docModel Document model
	 * @param {string} profile Documentation profile
	 * @returns {string} Rooms chapter HTML
	 */
	renderRoomsChapter(docModel, profile) {
		const roomsData = docModel.rooms;
		const i18n = this.i18n;

		let html = `<h2 id="rooms-and-functions">${esc(i18n.t('roomsAndFunctions'))}</h2>
<div class="stat-grid">
  <div class="stat-card"><div class="num">${esc(roomsData.totalRooms)}</div><div class="label">${esc(i18n.t('totalRooms'))}</div></div>
  <div class="stat-card"><div class="num">${esc(roomsData.totalFunctions)}</div><div class="label">${esc(i18n.t('totalFunctions'))}</div></div>
</div>
`;

		if (roomsData.totalRooms === 0) {
			html += `<p><em>${esc(i18n.t('noRoomsDefined'))}</em></p>\n`;
		} else {
			// Overview table — name + count only (no inline member list)
			html += `<h3>${esc(i18n.t('rooms'))}</h3>
<table>
<thead><tr><th>${esc(i18n.t('name'))}</th><th>${esc(i18n.t('memberCount'))}</th></tr></thead>
<tbody>
`;
			for (const room of roomsData.rooms) {
				const roomNote =
					docModel.manualContext && docModel.manualContext.rooms && docModel.manualContext.rooms[room.name];
				const noteHtml = roomNote ? `<br><span class="manual-context-note">${esc(roomNote)}</span>` : '';
				const trCls = roomNote ? ' class="table-row--manual-note"' : '';
				html += `<tr${trCls}>
  <td><strong>${esc(room.name)}</strong>${noteHtml}</td>
  <td>${esc(room.memberCount)}</td>
</tr>\n`;
			}
			html += `</tbody>\n</table>\n<p class="no-results">${esc(i18n.t('noRoomsMatch'))}</p>\n`;

			// Device hierarchy — entire section collapsible, each room collapsible inside
			if (profile === PROFILE_ADMIN) {
				const roomsWithDevices = roomsData.rooms.filter(r => r.devices && r.devices.length > 0);
				if (roomsWithDevices.length > 0) {
					const totalDevices = roomsWithDevices.reduce((s, r) => s + r.devices.length, 0);
					html += `<details style="margin-bottom:12px">
<summary class="maint-details-summary">${esc(i18n.t('deviceHierarchy'))} <span style="font-weight:400;color:var(--text-faint);font-size:13px">(${roomsWithDevices.length} ${esc(i18n.t('rooms'))}, ${totalDevices} ${esc(i18n.t('members'))})</span></summary>
<div style="margin-top:8px">
`;
					for (const room of roomsWithDevices) {
						const devCount = room.devices.length;
						const roomNote =
							docModel.manualContext &&
							docModel.manualContext.rooms &&
							docModel.manualContext.rooms[room.name];
						const summaryCls = roomNote
							? 'maint-details-summary maint-details-summary--room-note'
							: 'maint-details-summary';
						html += `<details style="margin-bottom:6px;margin-left:8px">
<summary class="${summaryCls}">${esc(room.name)} <span style="font-weight:400;color:var(--text-faint);font-size:13px">(${devCount} ${esc(i18n.t('members'))})</span></summary>
<table style="margin-top:6px">
<thead><tr><th>${esc(i18n.t('name'))}</th><th>${esc(i18n.t('category'))}</th><th>OID</th></tr></thead>
<tbody>
`;
						for (const dev of room.devices) {
							const liveHtml = this._renderLiveValue(dev);
							html += `<tr>
  <td>${esc(dev.icon || '')} ${esc(dev.deviceName)}${liveHtml}</td>
  <td><small>${esc(dev.category || dev.role || '—')}</small></td>
  <td><code style="font-size:11px;color:var(--text-faint)">${esc(dev.id)}</code></td>
</tr>\n`;
						}
						html += `</tbody>\n</table>\n</details>\n`;
					}
					html += `</div>\n</details>\n`;
				}
			}

			if (profile === PROFILE_ADMIN && roomsData.functions.length > 0) {
				html += `<h3 style="margin-top:24px">${esc(i18n.t('functions'))}</h3>
<details>
<summary class="maint-details-summary" style="font-size:14px;font-weight:400;color:var(--text-faint)">${esc(i18n.t('showFunctions') || 'Funktionen anzeigen')} (${roomsData.functions.length})</summary>
<div style="margin-top:8px">
<table>
<thead><tr><th>${esc(i18n.t('name'))}</th><th>${esc(i18n.t('memberCount'))}</th></tr></thead>
<tbody>
${roomsData.functions.map(fn => `<tr><td>${esc(fn.name)}</td><td>${esc(fn.memberCount)}</td></tr>`).join('\n')}
</tbody>
</table>
</div>
</details>
`;
			}
		}

		html += '<hr class="section-divider">\n';
		return html;
	}

	/**
	 * Render scripts chapter.
	 *
	 * @param {object} docModel Document model
	 * @param {string} profile Documentation profile
	 * @returns {string} Scripts chapter HTML
	 */
	renderScriptsChapter(docModel, profile) {
		const scriptsData = docModel.scripts;
		const i18n = this.i18n;

		let html = `<h2 id="scripts">${esc(i18n.t('scripts'))}</h2>
<div class="stat-grid">
  <div class="stat-card"><div class="num">${esc(scriptsData.totalScripts)}</div><div class="label">${esc(i18n.t('totalScripts'))}</div></div>
  <div class="stat-card"><div class="num">${esc(scriptsData.enabledScripts)}</div><div class="label">${esc(i18n.t('enabledScripts'))}</div></div>
  <div class="stat-card"><div class="num">${esc(scriptsData.disabledScripts)}</div><div class="label">${esc(i18n.t('disabledScripts'))}</div></div>
</div>
`;

		if (scriptsData.totalScripts === 0) {
			html += `<p><em>${esc(i18n.t('noScriptsDefined'))}</em></p>\n`;
		} else {
			const list = profile === PROFILE_USER ? scriptsData.scripts.filter(s => s.enabled) : scriptsData.scripts;

			if (profile === PROFILE_ADMIN) {
				const activeScripts = list.filter(s => s.enabled);
				const inactiveScripts = list.filter(s => !s.enabled);

				const buildScriptRow = (script, active, omitFolderUnderName) => {
					const folderLabel = this.scriptFolderLabel(script.folder, i18n);
					const nameCell = omitFolderUnderName
						? esc(script.name)
						: `${esc(script.name)}<br><small style="color:var(--text-faint)">${esc(folderLabel)}</small>`;
					const statusBadge = active
						? `<span class="badge badge-ok">${esc(i18n.t('active'))}</span>`
						: `<span class="badge badge-off">${esc(i18n.t('inactive'))}</span>`;
					const schedHtml = script.schedule
						? `<br><span class="badge badge-meta" title="${esc(script.schedule)}">${esc(this.describeCron(script.schedule, i18n))}</span>`
						: '';
					const hasSchedule = !!(script.schedule && String(script.schedule).trim());
					const rowTitle = hasSchedule
						? esc(
								`${i18n.t('scriptHasScheduleTitle')} — ${script.schedule} (${this.describeCron(script.schedule, i18n)})`,
							)
						: '';
					const trAttr = hasSchedule
						? ` class="table-row--has-schedule"${rowTitle ? ` title="${rowTitle}"` : ''}`
						: '';
					const engineHtml =
						script.engine && String(script.engine).trim()
							? `<br><span class="badge badge-meta" title="${esc(i18n.t('scriptEngineInstance'))}">${esc(script.engine)}</span>`
							: '';
					return `<tr${trAttr}>
  <td>${nameCell}</td>
  <td>${statusBadge}</td>
  <td><small>${esc(script.triggerType)}${schedHtml}${engineHtml}</small></td>
  <td><small>${esc(script.desc || '—')}</small></td>
</tr>\n`;
				};

				const tableHead = `<thead><tr>
  <th>${esc(i18n.t('scriptName'))}</th>
  <th>${esc(i18n.t('scriptStatus'))}</th>
  <th>${esc(i18n.t('scriptTrigger'))}</th>
  <th>${esc(i18n.t('scriptDescription'))}</th>
</tr></thead>`;

				const renderFolderBlock = (scriptsInFolder, folderKey, folder, tbodyId, active) => {
					const folderSummary = esc(this.scriptFolderLabel(folder, i18n));
					const count = scriptsInFolder.length;
					const globalHint = isGlobalFolderKey(folderKey)
						? `<p class="script-global-hint" style="font-size:13px;color:var(--text-muted);margin:0 0 10px;border-left:3px solid #e67e22;padding-left:10px">${esc(i18n.t('scriptsGlobalFolderHint'))}</p>`
						: '';
					return `<details class="script-folder-group">
<summary class="maint-details-summary">${folderSummary} <span style="font-weight:400;color:var(--text-faint);font-size:13px">(${count})</span></summary>
${globalHint}<table class="script-folder-table">
${tableHead}
<tbody id="${tbodyId}">
${scriptsInFolder.map(s => buildScriptRow(s, active, true)).join('')}
</tbody>
</table>
</details>\n`;
				};

				html += `<p style="font-size:13px;color:var(--text-faint);margin:10px 0 12px">${esc(i18n.t('scriptsByFolderIntro'))}</p>\n`;
				html += `<div class="script-filter-bar">
  <input type="text" id="script-filter" placeholder="${esc(i18n.t('scriptFilterPlaceholder'))}" autocomplete="off">
  <span id="script-filter-count"></span>
  <small class="script-filter-hint">${esc(i18n.t('scriptFilterHint'))}</small>
</div>
<div id="script-active-section">
`;
				const groupedActive = groupScriptsByFolder(activeScripts);
				let tbodyIdx = 0;
				for (const g of groupedActive) {
					const tbodyId = `script-active-body-${tbodyIdx++}`;
					html += renderFolderBlock(g.scripts, g.folderKey, g.folder, tbodyId, true);
				}
				html += `</div>\n<p class="no-results" id="script-active-noresults">${esc(i18n.t('noScriptsMatch'))}</p>\n`;

				if (inactiveScripts.length > 0) {
					const inactiveLabel = i18n.t('disabledScriptsGroup').replace('{0}', inactiveScripts.length);
					html += `<details id="script-disabled-group" style="margin-top:12px">
<summary class="maint-details-summary script-disabled-summary maint-details-summary--attention">${esc(inactiveLabel)}</summary>
<div id="script-inactive-section" style="margin-top:8px">
`;
					const groupedInactive = groupScriptsByFolder(inactiveScripts);
					tbodyIdx = 0;
					for (const g of groupedInactive) {
						const tbodyId = `script-inactive-body-${tbodyIdx++}`;
						html += renderFolderBlock(g.scripts, g.folderKey, g.folder, tbodyId, false);
					}
					html += `</div>\n<p class="no-results" id="script-inactive-noresults">${esc(i18n.t('noScriptsMatch'))}</p>\n</details>\n`;
				}
			} else {
				// User / Onboarding: simple table (User = active only; Onboarding = all scripts)
				if (
					(profile === PROFILE_USER || profile === PROFILE_ONBOARDING) &&
					scriptsData.aiAutomationOverview &&
					String(scriptsData.aiAutomationOverview).trim()
				) {
					html += `<div class="note-box" style="margin:12px 0 16px;font-size:14px;line-height:1.5">${esc(scriptsData.aiAutomationOverview)}</div>\n`;
				}
				html += `<table>
<thead><tr>
  <th>${esc(i18n.t('scriptName'))}</th>
  <th>${esc(i18n.t('scriptStatus'))}</th>
  <th>${esc(i18n.t('scriptTrigger'))}</th>
  <th>${esc(i18n.t('scriptDescription'))}</th>
</tr></thead>
<tbody>
`;
				for (const script of list) {
					const active = script.enabled;
					const folderLabel = this.scriptFolderLabel(script.folder, i18n);
					const nameCell = `${esc(script.name)}<br><small style="color:var(--text-faint)">${esc(folderLabel)}</small>`;
					const hasSchedule = !!(script.schedule && String(script.schedule).trim());
					const schedUser = hasSchedule
						? `<br><span class="badge badge-meta" title="${esc(script.schedule)}">${esc(this.describeCron(script.schedule, i18n))}</span>`
						: '';
					const rowTitle = hasSchedule
						? esc(
								`${i18n.t('scriptHasScheduleTitle')} — ${script.schedule} (${this.describeCron(script.schedule, i18n)})`,
							)
						: '';
					const trAttr = hasSchedule
						? ` class="table-row--has-schedule"${rowTitle ? ` title="${rowTitle}"` : ''}`
						: '';
					const aiExtra =
						script.aiSummary && String(script.aiSummary).trim()
							? `<div class="ai-box" style="margin-top:8px;padding:8px 10px;border-radius:8px;border:1px solid var(--border);background:var(--surface-elevated);font-size:13px;line-height:1.45"><strong>${esc(i18n.t('scriptAiSummary'))}:</strong> ${esc(script.aiSummary)}</div>`
							: '';
					html += `<tr${trAttr}>
  <td>${nameCell}</td>
  <td><span class="badge ${active ? 'badge-ok' : 'badge-off'}">${esc(active ? i18n.t('active') : i18n.t('inactive'))}</span></td>
  <td><small>${esc(script.triggerType)}${schedUser}</small></td>
  <td><small>${esc(script.desc || '—')}</small>${aiExtra}</td>
</tr>\n`;
				}
				html += `</tbody>\n</table>\n`;
			}

			// Admin: per-script state references and cross-reference table
			if (profile === PROFILE_ADMIN) {
				const scriptsWithRefs = list.filter(s => s.stateRefs && s.stateRefs.length > 0);
				const crossRef = scriptsData.stateCrossRef || [];
				const sharedStates = crossRef.filter(entry => entry.scripts.length > 1);

				if (scriptsWithRefs.length > 0) {
					const refTotal = scriptsWithRefs.reduce(
						(n, s) => n + (s.stateRefs && s.stateRefs.length ? s.stateRefs.length : 0),
						0,
					);
					html += `<h3 id="state-references">${esc(i18n.t('stateReferences'))}</h3>
<p style="font-size:13px;color:var(--text-faint);margin-bottom:12px">${esc(i18n.t('stateReferencesDesc'))}</p>
<details class="autodoc-collapsible-section">
<summary class="maint-details-summary">${esc(i18n.t('stateReferencesExpandSummary', scriptsWithRefs.length, refTotal))}</summary>
<div style="margin-top:8px">
<table>
<thead><tr><th>${esc(i18n.t('script'))}</th><th>${esc(i18n.t('scriptDescription'))}</th><th>${esc(i18n.t('referencedStates'))}</th></tr></thead>
<tbody>
`;
					for (const script of scriptsWithRefs) {
						const folderLbl = this.scriptFolderLabel(script.folder, i18n);
						const nameCell = `${esc(script.name)}<br><small style="color:var(--text-faint)">${esc(folderLbl)}</small>`;
						const descRaw = script.desc && String(script.desc).trim();
						const descCell = descRaw
							? `<small>${esc(descRaw)}</small>`
							: `<small style="color:var(--text-faint)">${esc('—')}</small>`;
						const refs = script.stateRefs
							.map(r => `<code class="inline-state-id">${esc(r)}</code>`)
							.join(' ');
						html += `<tr><td>${nameCell}</td><td>${descCell}</td><td style="line-height:1.8">${refs}</td></tr>\n`;
					}
					html += `</tbody>\n</table>\n<p class="no-results">${esc(i18n.t('noScriptsMatch'))}</p>\n</div>\n</details>\n`;
				}

				if (sharedStates.length > 0) {
					html += `<h3 id="shared-states">${esc(i18n.t('sharedStates'))}</h3>
<p style="font-size:13px;color:var(--text-faint);margin-bottom:12px">${esc(i18n.t('sharedStatesDesc'))}</p>
<details class="autodoc-collapsible-section">
<summary class="maint-details-summary">${esc(i18n.t('sharedStatesExpandSummary', sharedStates.length))}</summary>
<div style="margin-top:8px">
<table>
<thead><tr><th>${esc(i18n.t('stateId'))}</th><th>${esc(i18n.t('usedByScripts'))}</th></tr></thead>
<tbody>
`;
					for (const entry of sharedStates) {
						const stateCell = `<code class="inline-state-id">${esc(entry.stateId)}</code>`;
						html += `<tr><td>${stateCell}</td><td><small>${entry.scripts.map(s => esc(s)).join(', ')}</small></td></tr>\n`;
					}
					html += `</tbody>\n</table>\n<p class="no-results">${esc(i18n.t('noSharedStatesMatch'))}</p>\n</div>\n</details>\n`;
				}
			}
		}

		html += '<hr class="section-divider">\n';
		return html;
	}

	/**
	 * Render manual context chapter.
	 *
	 * @param {object} manualContext Manual context from config
	 * @param {string} [profile] `admin`: guest/routines as h3 here; `user`: only description/contact/notes (guest/routines use separate h2 sections with anchors).
	 * @returns {string} Manual context HTML
	 */
	renderManualContext(manualContext, profile = PROFILE_ADMIN) {
		const i18n = this.i18n;
		let html = `<h2 id="manual-information">${esc(i18n.t('manualInformation'))}</h2>\n`;

		if (manualContext.description) {
			html += `<h3>${esc(i18n.t('description'))}</h3>\n<p>${esc(manualContext.description)}</p>\n`;
		}
		if (manualContext.contact) {
			html += `<h3>${esc(i18n.t('contact'))}</h3>\n<p>${esc(manualContext.contact)}</p>\n`;
		}
		if (manualContext.notes) {
			html += `<h3>${esc(i18n.t('additionalNotes'))}</h3>\n<div class="note-box">${esc(manualContext.notes)}</div>\n`;
		}
		if (profile === PROFILE_ADMIN) {
			html += this._renderTroubleshootPublicLinksHtml(manualContext, true);
			html += this._renderTroubleshootQuickFactsHtml(manualContext);
			if (manualContext.guestHelpNote && String(manualContext.guestHelpNote).trim()) {
				html += `<h3>${esc(i18n.t('guestHelpTitle'))}</h3>\n<div class="note-box guest-help-box">${formatMultilineManualHtml(manualContext.guestHelpNote)}</div>\n`;
			}
			if (manualContext.homeRoutinesNote && String(manualContext.homeRoutinesNote).trim()) {
				html += `<h3>${esc(i18n.t('homeRoutinesTitle'))}</h3>\n<p style="font-size:13px;color:var(--text-faint)">${esc(i18n.t('homeRoutinesIntro'))}</p>\n<div class="manual-context-box">${formatMultilineManualHtml(manualContext.homeRoutinesNote)}</div>\n`;
			}
		}

		html += '<hr class="section-divider">\n';
		return html;
	}

	/**
	 * Render user-defined variables chapter (0_userdata.0 namespace).
	 * Groups by folder, shows name, type, current value, description.
	 *
	 * @param {Array} userData Array of user data objects from discovery
	 * @returns {string} HTML chapter
	 */
	renderUserDataChapter(userData) {
		const i18n = this.i18n;
		if (!userData || userData.length === 0) {
			return '';
		}

		// Group by folder
		const groups = {};
		for (const item of userData) {
			const key = item.folder || '';
			if (!groups[key]) {
				groups[key] = [];
			}
			groups[key].push(item);
		}

		const totalItems = userData.length;
		const totalSuffix = esc(i18n.t('totalSuffix') || 'gesamt');
		const groupCount = Object.keys(groups).length;

		let html = `<h2 id="userdata">${esc(i18n.t('userDefinedVariables') || 'Benutzerdefinierte Variablen')}</h2>
<p style="font-size:13px;color:var(--text-faint)">${esc(i18n.t('userDataDesc') || 'Datenpunkte unter 0_userdata.0 — selbst angelegte Variablen und Werte.')}</p>
<details class="autodoc-collapsible-section">
<summary class="maint-details-summary">${esc(i18n.t('userdataExpandSummary', totalItems, groupCount))}</summary>
<section id="autodoc-userdata-section" data-autodoc-total="${totalItems}" data-autodoc-total-suffix="${totalSuffix}" style="margin-top:8px">
<div class="adapter-filter-bar">
  <input type="search" id="autodoc-userdata-filter" placeholder="${esc(i18n.t('searchPlaceholder') || 'Suchen...')}" autocomplete="off" style="width:280px">
  <span id="autodoc-userdata-count" style="font-size:12px;color:var(--text-faint)">${totalItems} ${totalSuffix}</span>
</div>
<div id="autodoc-userdata-list">
`;

		const folderKeys = Object.keys(groups).sort();
		for (const folder of folderKeys) {
			const items = groups[folder];
			const label = folder || i18n.t('scriptFolderRoot') || 'Root';
			html += `<details style="margin-bottom:8px">
<summary class="maint-details-summary">${esc(label)} <span style="font-weight:400;color:var(--text-faint);font-size:13px">(${items.length})</span></summary>
<table style="margin-top:8px">
<thead><tr>
  <th>${esc(i18n.t('name'))}</th>
  <th>${esc(i18n.t('type') || 'Typ')}</th>
  <th>${esc(i18n.t('value') || 'Wert')}</th>
  <th>${esc(i18n.t('description') || 'Beschreibung')}</th>
</tr></thead>
<tbody>
`;
			for (const item of items) {
				const valStr = item.value !== null && item.value !== undefined ? String(item.value) : '—';
				const unit = item.unit ? ` ${item.unit}` : '';
				const typeLabel = item.type || '—';
				html += `<tr data-search="${esc(`${item.name} ${item.desc || ''} ${item.role || ''}`.toLowerCase())}">
  <td><strong>${esc(item.name)}</strong>${item.role ? `<br><small style="color:var(--text-faint)">${esc(item.role)}</small>` : ''}</td>
  <td><small>${esc(typeLabel)}</small></td>
  <td>${esc(valStr + unit)}</td>
  <td><small>${esc(item.desc || '—')}</small></td>
</tr>\n`;
			}
			html += `</tbody>\n</table>\n</details>\n`;
		}

		html += `</div>
</section>
</details>
<hr class="section-divider">
`;
		return html;
	}

	/**
	 * Render alias datapoints chapter (alias.0 namespace).
	 * Groups by folder, shows name, type, and read/write target IDs.
	 *
	 * @param {Array} aliases Array of alias objects from discovery
	 * @returns {string} HTML chapter
	 */
	renderAliasChapter(aliases) {
		const i18n = this.i18n;
		if (!aliases || aliases.length === 0) {
			return '';
		}

		// Group by folder
		const groups = {};
		for (const item of aliases) {
			const key = item.folder || '';
			if (!groups[key]) {
				groups[key] = [];
			}
			groups[key].push(item);
		}

		const totalItems = aliases.length;
		const totalSuffix = esc(i18n.t('totalSuffix') || 'gesamt');
		const groupCount = Object.keys(groups).length;

		let html = `<h2 id="aliases">${esc(i18n.t('aliases') || 'Aliase')}</h2>
<p style="font-size:13px;color:var(--text-faint)">${esc(i18n.t('aliasesDesc') || 'Aliase ermöglichen es, fremde Datenpunkte unter eigenem Namen zugänglich zu machen (alias.0.*).')}</p>
<details class="autodoc-collapsible-section">
<summary class="maint-details-summary">${esc(i18n.t('aliasesExpandSummary', totalItems, groupCount))}</summary>
<section id="autodoc-alias-section" data-autodoc-total="${totalItems}" data-autodoc-total-suffix="${totalSuffix}" style="margin-top:8px">
<div class="adapter-filter-bar">
  <input type="search" id="autodoc-alias-filter" placeholder="${esc(i18n.t('searchPlaceholder') || 'Suchen...')}" autocomplete="off" style="width:280px">
  <span id="autodoc-alias-count" style="font-size:12px;color:var(--text-faint)">${totalItems} ${totalSuffix}</span>
</div>
<div id="autodoc-alias-list">
`;

		const folderKeys = Object.keys(groups).sort();
		for (const folder of folderKeys) {
			const items = groups[folder];
			const label = folder || i18n.t('scriptFolderRoot') || 'Root';
			html += `<details style="margin-bottom:8px">
<summary class="maint-details-summary">${esc(label)} <span style="font-weight:400;color:var(--text-faint);font-size:13px">(${items.length})</span></summary>
<table style="margin-top:8px">
<thead><tr>
  <th>${esc(i18n.t('name'))}</th>
  <th>${esc(i18n.t('type') || 'Typ')}</th>
  <th>${esc(i18n.t('aliasTarget') || 'Ziel')}</th>
  <th>${esc(i18n.t('description') || 'Beschreibung')}</th>
</tr></thead>
<tbody>
`;
			for (const item of items) {
				const targetHtml =
					item.readTarget === item.writeTarget || !item.writeTarget
						? `<code style="font-size:11px">${esc(item.readTarget || '—')}</code>`
						: `<code style="font-size:11px">${esc(item.readTarget || '—')}</code><br><small style="color:var(--text-faint)">✍ ${esc(item.writeTarget)}</small>`;
				const searchStr = `${item.name} ${item.desc || ''} ${item.readTarget || ''} ${
					item.role || ''
				}`.toLowerCase();
				html += `<tr data-search="${esc(searchStr)}">
  <td><strong>${esc(item.name)}</strong>${item.role ? `<br><small style="color:var(--text-faint)">${esc(item.role)}</small>` : ''}</td>
  <td><small>${esc(item.type)}${item.unit ? ` (${esc(item.unit)})` : ''}</small></td>
  <td>${targetHtml}</td>
  <td><small>${esc(item.desc || '—')}</small></td>
</tr>\n`;
			}
			html += `</tbody>\n</table>\n</details>\n`;
		}

		html += `</div>
</section>
</details>
<hr class="section-divider">
`;
		return html;
	}

	/**
	 * @param {object} docModel Document model
	 * @returns {string} Maintenance chapter HTML
	 */
	renderMaintenanceChapter(docModel) {
		const m = docModel.maintenance;
		const i18n = this.i18n;

		const checkLabels = {
			disabledInstances: i18n.t('disabledInstancesHint'),
		};

		const scoreColor = m.score >= 80 ? '#28a745' : m.score >= 50 ? '#ffc107' : '#dc3545';

		let html = `<h2 id="maintenance">${esc(i18n.t('maintenance'))}</h2>
<h3>${esc(i18n.t('maintenanceChecklist'))}</h3>
<p style="font-size:13px;color:var(--text-faint);margin-bottom:10px">${esc(i18n.t('scoreDesc'))}</p>
<p><strong>${esc(i18n.t('documentationScore'))}:</strong> ${esc(m.score)}%</p>
<div class="score-bar"><div class="score-bar-fill" style="width:${esc(m.score)}%;background:${scoreColor}"></div></div>
`;
		if (m.disabledInstances.length > 0) {
			html += `<p style="font-size:13px;color:var(--text-muted);margin:10px 0 12px">${esc(i18n.t('disabledInstancesInventoryNote', m.disabledInstances.length))}</p>\n`;
		}
		if (m.checklist.length > 0) {
			html += `<ul class="checklist">\n`;
			for (const item of m.checklist) {
				const icon = item.ok ? '✅' : '⚠️';
				const label = checkLabels[item.key] || item.key;
				const badge = item.ok
					? `<span class="badge badge-ok">${esc(i18n.t('checkOk'))}</span>`
					: `<span class="badge badge-off">${esc(i18n.t('checkIssue'))} (${esc(item.count)})</span>`;
				html += `  <li>${icon} ${esc(label)} ${badge}</li>\n`;
			}
			html += `</ul>\n`;
		}

		if (m.disabledInstances.length > 0) {
			const diLabel = `${esc(i18n.t('disabledInstancesHint'))} (${m.disabledInstances.length})`;
			html += `<details style="margin-top:12px">
<summary class="maint-details-summary">${diLabel}</summary>
<table style="margin-top:8px"><thead><tr><th>ID</th><th>${esc(i18n.t('name'))}</th></tr></thead><tbody>
${m.disabledInstances.map(inst => `<tr><td><small>${esc(inst.id)}</small></td><td>${esc(inst.title && inst.title !== inst.name ? inst.title : inst.name)}</td></tr>`).join('\n')}
</tbody></table>
</details>\n`;
		}

		if (m.checklist.every(c => c.ok)) {
			html += `<p><em>${esc(i18n.t('allGood'))}</em></p>\n`;
		}

		html += '<hr class="section-divider">\n';
		return html;
	}

	/**
	 * Render diagnosis section (Admin profile only).
	 * Contains scan statistics, concrete UI paths for troubleshooting,
	 * and data-driven findings from this scan.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} Diagnosis HTML
	 */
	renderDiagnosis(docModel) {
		const i18n = this.i18n;
		const system = docModel.system;
		const stats = system.statistics;
		const appendices = docModel.appendices;

		// Data-driven findings (disabled instances are inventory elsewhere — not flagged here)
		const findings = [];
		// Node.js version check
		const nodeVer = docModel.system.primaryHost.nodeVersion;
		if (isNodeVersionFlaggedForDiagnosis(nodeVer)) {
			findings.push(i18n.t('nodeVersionOutdated').replace('{0}', nodeVer));
		}
		// OS update reminder (always shown)
		findings.push(i18n.t('osUpdateHint'));

		const findingsHtml = findings.map(f => `  <li>${esc(f)}</li>`).join('\n');

		// RAM/CPU from primary host resources
		const primaryHostName = system.primaryHost.name;
		const hostRes = (system.hostResources || {})[primaryHostName] || {};
		let ramText = '—';
		if (hostRes.sysTotalMb && hostRes.sysFreeMb !== null) {
			const usedMb = hostRes.sysTotalMb - hostRes.sysFreeMb;
			ramText = `${usedMb} / ${hostRes.sysTotalMb} MB`;
		} else if (hostRes.adapterTotalMb) {
			ramText = `~${hostRes.adapterTotalMb} MB <small style="color:var(--text-faint)">(${esc(i18n.t('allAdapters') || 'alle Adapter')})</small>`;
		} else if (hostRes.procMb) {
			ramText = `~${hostRes.procMb} MB <small style="color:var(--text-faint)">(js-controller)</small>`;
		}
		const cpuVal = hostRes.cpu !== null && hostRes.cpu !== undefined ? `${hostRes.cpu} %` : null;
		const cpuText = cpuVal || '—';

		const activeRepo = (system.location && system.location.activeRepo) || '';
		const repoIsBeta = activeRepo.toLowerCase().includes('beta') || activeRepo.toLowerCase().includes('latest');
		const repoBadgeStyle = repoIsBeta
			? 'background:#fff3cd;color:#856404;border:1px solid #ffc107'
			: 'background:#d4edda;color:#155724;border:1px solid #c3e6cb';
		const repoBadge = activeRepo
			? `<span style="display:inline-block;padding:1px 8px;border-radius:10px;font-size:12px;font-weight:600;${repoBadgeStyle}">${esc(activeRepo)}</span>`
			: '';

		const forum = buildForumCard(docModel, i18n);
		// Safe embedding of JSON string in HTML (escape < for script tag)
		const forumPlainJson = JSON.stringify(forum.plaintext).replace(/</g, '\\u003c');

		const copyLabel = esc(i18n.t('copyForForum') || 'Für Forum kopieren');
		const copiedLabel = esc(i18n.t('copied') || 'Kopiert!');

		return `<h2 id="diagnosis">${esc(i18n.t('diagnosis'))}</h2>
<h3>${esc(i18n.t('diagScanStatus'))}</h3>
<script type="application/json" id="forum-plaintext-json">${forumPlainJson}</script>
<dl class="meta">
  <dt>${esc(i18n.t('collectedAt'))}</dt><dd>${esc(new Date(appendices.collectionTimestamp).toLocaleString())}</dd>
  <dt>${esc(i18n.t('instancesDetected'))}</dt><dd>${esc(stats.instanceCount)} (${esc(stats.enabledInstanceCount)} ${esc(i18n.t('diagActive'))}, ${esc(stats.disabledInstanceCount)} ${esc(i18n.t('diagInactive'))})</dd>
  <dt>${esc(i18n.t('stateObjectsScanned'))}</dt><dd>${esc(appendices.stateSummary.total)} (${esc(appendices.stateSummary.writable)} ${esc(i18n.t('writable'))}, ${esc(appendices.stateSummary.readonly)} ${esc(i18n.t('readOnlyStates'))})</dd>
  <dt>${esc(i18n.t('hostRuntimePlatform'))}</dt><dd>${esc(system.primaryHost.platform)}</dd>
  <dt>${esc(i18n.t('operatingSystem'))}</dt><dd>${system.primaryHost.operatingSystem ? esc(system.primaryHost.operatingSystem) : '—'}</dd>
  <dt>${esc(i18n.t('jsControllerVersion'))}</dt><dd>${esc(system.primaryHost.version)}</dd>
  <dt>${esc(i18n.t('nodeVersion'))}</dt><dd>${system.primaryHost.nodeVersion ? this.renderNodeVersionBadge(system.primaryHost.nodeVersion, i18n) : '—'}</dd>
  <dt title="${esc(i18n.t('npmVersionHint'))}">${esc(i18n.t('npmVersion'))}</dt><dd>${system.primaryHost.npmVersion ? `<code class="inline-state-id">${esc(system.primaryHost.npmVersion)}</code>` : '—'}</dd>
  <dt>RAM</dt><dd>${ramText}</dd>
  ${cpuVal ? `<dt>CPU</dt><dd>${esc(cpuText)}</dd>` : ''}
  <dt>${esc(i18n.t('hosts'))}</dt><dd>${esc(primaryHostName)}</dd>
  ${repoBadge ? `<dt>${esc(i18n.t('activeRepo') || 'Repository')}</dt><dd>${repoBadge}</dd>` : ''}
</dl>
<button onclick="copyForumData(this)" style="margin:4px 0 16px;font-size:13px;padding:6px 16px;border-radius:6px;border:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer">📋 ${copyLabel}</button>
<script>
function copyForumData(btn) {
  try {
    var text = JSON.parse(document.getElementById('forum-plaintext-json').textContent);
    var ok = function() {
      btn.textContent = '✅ ${copiedLabel}';
      setTimeout(function(){ btn.textContent = '📋 ${copyLabel}'; }, 2500);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(ok).catch(function(){ fallbackCopy(text, ok); });
    } else { fallbackCopy(text, ok); }
  } catch(e) { alert('Copy failed: ' + e.message); }
}
function fallbackCopy(text, ok) {
  var ta = document.createElement('textarea');
  ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
  document.body.appendChild(ta); ta.focus(); ta.select();
  try { document.execCommand('copy'); ok(); } catch(e) {}
  document.body.removeChild(ta);
}
</script>
<h3>${esc(i18n.t('diagWhereToLook'))}</h3>
<table>
<thead><tr><th>${esc(i18n.t('diagWhatLabel'))}</th><th>${esc(i18n.t('diagWhereLabel'))}</th></tr></thead>
<tbody>
<tr><td>${esc(i18n.t('diagLogsLabel'))}</td><td><small>${esc(i18n.t('diagLogsValue'))}</small></td></tr>
<tr><td>${esc(i18n.t('diagAliveLabel'))}</td><td><code style="font-size:12px">system.adapter.{name}.0.alive</code> <small>${esc(i18n.t('diagAliveHint'))}</small></td></tr>
<tr><td>${esc(i18n.t('diagConnectedLabel'))}</td><td><code style="font-size:12px">system.adapter.{name}.0.connected</code> <small>${esc(i18n.t('diagConnectedHint'))}</small></td></tr>
</tbody>
</table>
<h3>${esc(i18n.t('diagFindings'))}</h3>
<ul class="content-list">
${findingsHtml}
</ul>
<hr class="section-divider">
`;
	}

	/**
	 * Render troubleshooting section (Admin profile only).
	 * Concrete scenarios with solution steps — no overlap with Diagnosis.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} Troubleshooting HTML
	 */
	renderTroubleshooting(docModel) {
		const i18n = this.i18n;
		const scripts = docModel.scripts;
		const hasJavascript = docModel.adapters.adapters.some(a => a.name === 'javascript' && a.enabledInstances > 0);

		return `<h2 id="troubleshooting">${esc(i18n.t('troubleshooting'))}</h2>
<h3>${esc(i18n.t('tsAdapterNotStarting'))}</h3>
<p style="font-size:13px;color:var(--text-muted)">${esc(i18n.t('tsAdapterNotStartingSymptom'))}</p>
<ol class="content-list">
  <li>${esc(i18n.t('tsAdapterNotStarting1'))}</li>
  <li>${esc(i18n.t('tsAdapterNotStarting2'))}</li>
  <li>${esc(i18n.t('tsAdapterNotStarting3'))}</li>
</ol>
<h3>${esc(i18n.t('tsAdapterNotConnected'))}</h3>
<p style="font-size:13px;color:var(--text-muted)">${esc(i18n.t('tsAdapterNotConnectedSymptom'))}</p>
<ol class="content-list">
  <li>${esc(i18n.t('tsAdapterNotConnected1'))}</li>
  <li>${esc(i18n.t('tsAdapterNotConnected2'))}</li>
  <li>${esc(i18n.t('tsAdapterNotConnected3'))}</li>
</ol>
${
	scripts.totalScripts > 0
		? `<h3>${esc(i18n.t('tsScriptNotRunning'))}</h3>
<p style="font-size:13px;color:var(--text-muted)">${esc(i18n.t('tsScriptNotRunningSymptom'))}</p>
<ol class="content-list">
  <li>${esc(i18n.t('tsScriptNotRunning1'))}</li>
  <li>${esc(!hasJavascript ? i18n.t('tsScriptNotRunning2Warn') : i18n.t('tsScriptNotRunning2'))}</li>
  <li>${esc(i18n.t('tsScriptNotRunning3'))}</li>
</ol>`
		: ''
}
<h3>${esc(i18n.t('tsDocNotGenerated'))}</h3>
<p style="font-size:13px;color:var(--text-muted)">${esc(i18n.t('tsDocNotGeneratedSymptom'))}</p>
<ol class="content-list">
  <li>${esc(i18n.t('tsDocNotGenerated1'))}</li>
  <li>${esc(i18n.t('tsDocNotGenerated2'))}</li>
  <li>${esc(i18n.t('tsDocNotGenerated3'))}</li>
</ol>
<hr class="section-divider">
`;
	}

	/**
	 * Render changelog chapter (Admin profile only).
	 *
	 * @param {Array} changelog Array of changelog entries
	 * @returns {string} Changelog HTML
	 */
	renderChangelogChapter(changelog) {
		const i18n = this.i18n;
		let html = `<h2 id="changelog">${esc(i18n.t('changelog'))}</h2>\n`;

		/**
		 * Build HTML for a single changelog entry card.
		 *
		 * @param {object} entry Changelog entry
		 * @returns {string} HTML
		 */
		const renderEntry = entry => {
			const date = new Date(entry.timestamp).toLocaleString();
			const trigger = entry.trigger || '—';
			let card = `<div style="margin-bottom:10px;padding:10px 14px;background:var(--changelog-bg);border-left:3px solid var(--link);border-radius:0 4px 4px 0">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
    <strong style="font-size:14px">${esc(i18n.t('version'))} ${esc(entry.version)}</strong>
    <small style="color:var(--text-faint)">${esc(date)} &middot; ${esc(trigger)}</small>
  </div>
  <div style="font-size:13px;color:var(--text-muted);margin-bottom:4px">${esc(entry.summary)}</div>`;
			if (entry.changes && entry.changes.length > 0) {
				card += `\n  <details style="margin-top:4px">
  <summary style="cursor:pointer;font-size:12px;color:var(--text-muted);user-select:none">${entry.changes.length} ${esc(i18n.t('moreChanges'))}</summary>
  <ul style="margin:4px 0 0 16px;font-size:12px;color:var(--text-faint)">\n`;
				for (const change of entry.changes) {
					const typeKey = `changelogChange_${change.type}`;
					const typeResolved = i18n.t(typeKey);
					const typeLabel = typeResolved !== typeKey ? typeResolved : change.type;
					let msg = change.message;
					if (change.type === 'adapter_version' && change.instanceId && change.adapterTitle !== undefined) {
						msg = i18n.t(
							'changelogMsgAdapterVersion',
							change.adapterTitle || change.instanceId,
							change.instanceId,
							change.previous,
							change.current,
						);
					}
					card += `    <li><span style="color:var(--link);font-weight:600">${esc(typeLabel)}</span> ${esc(msg)}</li>\n`;
				}
				card += `  </ul>\n  </details>`;
			}
			card += `\n</div>\n`;
			return card;
		};

		const VISIBLE = 3;
		const visible = changelog.slice(0, VISIBLE);
		const older = changelog.slice(VISIBLE);

		for (const entry of visible) {
			html += renderEntry(entry);
		}

		if (older.length > 0) {
			html += `<details style="margin-top:6px">
<summary class="maint-details-summary">${esc(i18n.t('olderEntries').replace('{0}', older.length))}</summary>
<div style="margin-top:8px">\n`;
			for (const entry of older) {
				html += renderEntry(entry);
			}
			html += `</div>\n</details>\n`;
		}

		html += '<hr class="section-divider">\n';
		return html;
	}

	/**
	 * Render appendices (Admin profile only).
	 *
	 * @param {object} docModel Document model
	 * @returns {string} Appendices HTML
	 */
	renderAppendices(docModel) {
		const appendices = docModel.appendices;
		const i18n = this.i18n;

		return `<h2 id="appendices">${esc(i18n.t('appendices'))}</h2>
<h3>${esc(i18n.t('stateObjectsSummary'))}</h3>
<div class="stat-grid">
  <div class="stat-card"><div class="num">${esc(appendices.stateSummary.total)}</div><div class="label">${esc(i18n.t('total'))}</div></div>
  <div class="stat-card"><div class="num">${esc(appendices.stateSummary.writable)}</div><div class="label">${esc(i18n.t('writable'))}</div></div>
  <div class="stat-card"><div class="num">${esc(appendices.stateSummary.readonly)}</div><div class="label">${esc(i18n.t('readOnly'))}</div></div>
</div>
<h3>${esc(i18n.t('collectionInformation'))}</h3>
<dl class="meta">
  <dt>${esc(i18n.t('collectedAt'))}</dt><dd>${esc(new Date(appendices.collectionTimestamp).toLocaleString())}</dd>
  <dt>${esc(i18n.t('schemaVersion'))}</dt><dd>${esc(docModel.meta.schemaVersion)}</dd>
</dl>
<hr class="section-divider">
<footer>${esc(i18n.t('generatedBy'))}${esc(docModel.meta.version)}</footer>
`;
	}
}

module.exports = HtmlRenderer;
module.exports.RENDERER_VERSION = RENDERER_VERSION;
