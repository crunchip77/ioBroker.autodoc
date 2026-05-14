/**
 * Optional documentation layout: admin chapter visibility, custom Markdown sections.
 * See PLAN.md → Custom Templates (Phase 5).
 */

/**
 * Chapters in generated Admin HTML / Markdown (admin profile). Order matches the default render sequence
 * (custom before changelog, same as body builder).
 */
const DEFAULT_ADMIN_CHAPTER_ORDER = [
	'manual',
	'system',
	'adapters',
	'rooms',
	'scripts',
	'schedule',
	'userdata',
	'aliases',
	'maintenance',
	'diagnosis',
	'troubleshooting',
	'custom',
	'changelog',
	'appendices',
];

/**
 * Extra chapter IDs that are valid in admin/user hidden-chapter lists but are not standalone chapters.
 * 'mermaidAuto' hides only the auto-generated host topology (within the manual section).
 * 'mermaid' hides only the user-defined Mermaid diagram.
 */
const EXTRA_HIDDEN_CHAPTER_IDS = ['mermaidAuto'];

/** User/Family HTML + matching Markdown export (profile user). */
const USER_HTML_CHAPTER_KEYS = [
	'manual',
	'ai',
	'guestHelp',
	'atAGlance',
	'rooms',
	'scripts',
	'routines',
	'ownerPlaybook',
	'mermaid',
	'adapters',
	'custom',
	'system',
	'troubleshooting',
];

/**
 * Onboarding/Guest HTML + keys that apply to Markdown (profile onboarding).
 * Order matches the original renderOnboardingHtml sequence:
 * welcome (always first, not in loop) → quickstart → tips → guestHelp → stats → ai → capabilities
 * → mermaid (noop, rendered in welcome) → rooms → routines → ownerPlaybook → automations
 * → adapters → custom → hint → system → manual
 */
const ONBOARDING_HTML_CHAPTER_KEYS = [
	'welcome',
	'quickstart',
	'tips',
	'guestHelp',
	'stats',
	'ai',
	'capabilities',
	'mermaid',
	'rooms',
	'routines',
	'ownerPlaybook',
	'automations',
	'adapters',
	'custom',
	'hint',
	'system',
	'manual',
];

const MAX_CUSTOM_SECTIONS = 12;
const MAX_CUSTOM_BODY_CHARS = 24000;
const PROFILE_SET = new Set(['admin', 'user', 'onboarding']);

/**
 * @param {unknown} config - raw adapter `this.config`
 * @returns {string[]} allowed admin chapter ids to hide
 */
function parseAdminHiddenChapters(config) {
	return parseHiddenJsonArray(config, 'adminHiddenChaptersJson', 'adminHiddenChapters', [
		...DEFAULT_ADMIN_CHAPTER_ORDER,
		...EXTRA_HIDDEN_CHAPTER_IDS,
	]);
}

/**
 * @param {unknown} config - raw adapter `this.config`
 * @returns {string[]} user-profile chapter ids to hide
 */
function parseUserHiddenChapters(config) {
	return parseHiddenJsonArray(config, 'userHiddenChaptersJson', 'userHiddenChapters', [
		...USER_HTML_CHAPTER_KEYS,
		...EXTRA_HIDDEN_CHAPTER_IDS,
	]);
}

/**
 * @param {unknown} config - raw adapter `this.config`
 * @returns {string[]} onboarding chapter ids to hide
 */
function parseOnboardingHiddenChapters(config) {
	return parseHiddenJsonArray(
		config,
		'onboardingHiddenChaptersJson',
		'onboardingHiddenChapters',
		ONBOARDING_HTML_CHAPTER_KEYS,
	);
}

/**
 * @param {unknown} config - raw adapter `this.config`
 * @param {string} jsonKey - primary JSON string field name
 * @param {string} legacyKey - fallback field for migration
 * @param {string[]} allowedList - whitelist of chapter id strings
 * @returns {string[]} filtered hidden chapter ids
 */
function parseHiddenJsonArray(config, jsonKey, legacyKey, allowedList) {
	if (!config) {
		return [];
	}
	let raw = config[jsonKey];
	if (raw === undefined || raw === null) {
		raw = config[legacyKey];
	}
	let arr = [];
	if (typeof raw === 'string') {
		const s = raw.trim();
		if (!s) {
			return [];
		}
		try {
			arr = JSON.parse(s);
		} catch {
			return [];
		}
	} else if (Array.isArray(raw)) {
		arr = raw;
	} else {
		return [];
	}
	if (!Array.isArray(arr)) {
		return [];
	}
	const allowed = new Set(allowedList);
	return arr.map(k => String(k).trim()).filter(k => allowed.has(k));
}

/**
 * @param {unknown} config - raw adapter `this.config`
 * @returns {{ title: string, bodyMarkdown: string, profiles?: string[], anchorId: string }[]} custom Markdown blocks for export
 */
function parseCustomDocSections(config) {
	if (!config || typeof config !== 'object') {
		return [];
	}
	const raw = Reflect.get(config, 'customDocSectionsJson');
	let arr = [];
	if (typeof raw === 'string') {
		const s = raw.trim();
		if (!s) {
			return [];
		}
		try {
			arr = JSON.parse(s);
		} catch {
			return [];
		}
	} else if (Array.isArray(raw)) {
		arr = raw;
	} else {
		return [];
	}
	if (!Array.isArray(arr)) {
		return [];
	}
	const out = [];
	for (let i = 0; i < arr.length && out.length < MAX_CUSTOM_SECTIONS; i++) {
		const row = arr[i];
		if (!row || typeof row !== 'object') {
			continue;
		}
		const title = String(row.title || '').trim();
		const body = String(row.body || row.bodyMarkdown || '').trim();
		if (!title || !body) {
			continue;
		}
		let profiles;
		if (Array.isArray(row.profiles) && row.profiles.length) {
			profiles = row.profiles.map(p => String(p).trim().toLowerCase()).filter(p => PROFILE_SET.has(p));
			if (profiles.length === 0) {
				continue;
			}
		}
		const bodyMarkdown = body.length > MAX_CUSTOM_BODY_CHARS ? body.slice(0, MAX_CUSTOM_BODY_CHARS) : body;
		const anchorId = `custom-doc-${out.length}`;
		out.push({ title, bodyMarkdown, profiles, anchorId });
	}
	return out;
}

/**
 * @param {string} [raw] - `htmlColorScheme` config value
 * @returns {'auto'|'light'|'dark'} Normalized theme mode for HTML shell
 */
function parseHtmlColorScheme(raw) {
	const s = String(raw || 'auto')
		.trim()
		.toLowerCase();
	if (s === 'light' || s === 'dark') {
		return s;
	}
	return 'auto';
}

/**
 * @param {string} [raw] - user CSS font stack
 * @returns {string} sanitized `font-family` fragment or empty
 */
function sanitizeFontStack(raw) {
	if (raw == null || !String(raw).trim()) {
		return '';
	}
	return String(raw)
		.replace(/[{}<>]/g, '')
		.trim()
		.slice(0, 280);
}

/**
 * @param {string} [raw] - logo URL for HTML export
 * @returns {string} safe https/same-site path or empty
 */
function sanitizeLogoUrl(raw) {
	if (raw == null || !String(raw).trim()) {
		return '';
	}
	const s = String(raw).trim();
	if (/^\s*javascript:/i.test(s) || /^\s*data:/i.test(s)) {
		return '';
	}
	if (/^https?:\/\//i.test(s)) {
		return s;
	}
	if (s.startsWith('/') && !s.startsWith('//')) {
		return s;
	}
	return '';
}

/**
 * Merge custom chapter order with the default list (duplicates / unknown keys are ignored; missing keys are appended in default order).
 *
 * @param {string[]} defaultOrder - product default chapter sequence
 * @param {string[]} userOrder - user-provided id order
 * @returns {string[]} merged id list, unknown ids dropped
 */
function mergeChapterOrder(defaultOrder, userOrder) {
	if (!userOrder || userOrder.length === 0) {
		return defaultOrder.slice();
	}
	const seen = new Set();
	const out = [];
	for (const k of userOrder) {
		if (defaultOrder.includes(k) && !seen.has(k)) {
			out.push(k);
			seen.add(k);
		}
	}
	for (const k of defaultOrder) {
		if (!seen.has(k)) {
			out.push(k);
		}
	}
	return out;
}

/**
 * @param {unknown} config - raw adapter `this.config`
 * @param {string} jsonKey - primary JSON string field
 * @param {string} legacyKey - legacy field name
 * @param {string[]} allowedList - valid chapter ids
 * @param {string[]} defaultOrder - fallback when unset or invalid
 * @returns {string[]} final chapter id order
 */
function parseChapterOrderJson(config, jsonKey, legacyKey, allowedList, defaultOrder) {
	if (!config) {
		return defaultOrder.slice();
	}
	let raw = config[jsonKey];
	if (raw === undefined || raw === null) {
		raw = config[legacyKey];
	}
	let arr = [];
	if (typeof raw === 'string') {
		const s = raw.trim();
		if (!s) {
			return defaultOrder.slice();
		}
		try {
			arr = JSON.parse(s);
		} catch {
			return defaultOrder.slice();
		}
	} else if (Array.isArray(raw)) {
		arr = raw;
	} else {
		return defaultOrder.slice();
	}
	if (!Array.isArray(arr) || arr.length === 0) {
		return defaultOrder.slice();
	}
	const allowed = new Set(allowedList);
	const seen = new Set();
	const user = [];
	for (const x of arr) {
		const k = String(x).trim();
		if (allowed.has(k) && !seen.has(k)) {
			user.push(k);
			seen.add(k);
		}
	}
	if (user.length === 0) {
		return defaultOrder.slice();
	}
	return mergeChapterOrder(defaultOrder, user);
}

/**
 * @param {unknown} config - raw adapter `this.config`
 * @returns {string[]} admin HTML/Markdown chapter order
 */
function parseAdminChapterOrder(config) {
	return parseChapterOrderJson(
		config,
		'adminChapterOrderJson',
		'adminChapterOrder',
		DEFAULT_ADMIN_CHAPTER_ORDER,
		DEFAULT_ADMIN_CHAPTER_ORDER,
	);
}

/**
 * @param {unknown} config - raw adapter `this.config`
 * @returns {string[]} user HTML/Markdown chapter order
 */
function parseUserChapterOrder(config) {
	return parseChapterOrderJson(
		config,
		'userChapterOrderJson',
		'userChapterOrder',
		USER_HTML_CHAPTER_KEYS,
		USER_HTML_CHAPTER_KEYS,
	);
}

/**
 * @param {unknown} config - raw adapter `this.config`
 * @returns {string[]} onboarding HTML/Markdown chapter order
 */
function parseOnboardingChapterOrder(config) {
	return parseChapterOrderJson(
		config,
		'onboardingChapterOrderJson',
		'onboardingChapterOrder',
		ONBOARDING_HTML_CHAPTER_KEYS,
		ONBOARDING_HTML_CHAPTER_KEYS,
	);
}

const HTML_THEME_PRESET_IDS = new Set(['default', 'highContrast', 'warm', 'slate']);

/**
 * @param {unknown} raw - config value (preset id)
 * @returns {string} Preset id for HTML export
 */
function parseHtmlThemePreset(raw) {
	const s = String(raw == null ? 'default' : raw)
		.trim()
		.toLowerCase()
		.replace(/[\s_-]+/g, '');
	const map = {
		default: 'default',
		highcontrast: 'highContrast',
		warm: 'warm',
		slate: 'slate',
	};
	if (map[s] !== undefined) {
		return map[s];
	}
	const rawId = String(raw == null ? '' : raw).trim();
	if (HTML_THEME_PRESET_IDS.has(rawId)) {
		return rawId;
	}
	return 'default';
}

module.exports = {
	DEFAULT_ADMIN_CHAPTER_ORDER,
	USER_HTML_CHAPTER_KEYS,
	ONBOARDING_HTML_CHAPTER_KEYS,
	parseAdminHiddenChapters,
	parseUserHiddenChapters,
	parseOnboardingHiddenChapters,
	parseCustomDocSections,
	parseHtmlColorScheme,
	parseAdminChapterOrder,
	parseUserChapterOrder,
	parseOnboardingChapterOrder,
	mergeChapterOrder,
	parseHtmlThemePreset,
	sanitizeFontStack,
	sanitizeLogoUrl,
	MAX_CUSTOM_SECTIONS,
	MAX_CUSTOM_BODY_CHARS,
	EXTRA_HIDDEN_CHAPTER_IDS,
};
