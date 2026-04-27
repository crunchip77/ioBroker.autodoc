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

/** @deprecated Use {@link DEFAULT_ADMIN_CHAPTER_ORDER} — kept for callers expecting `KEYS`. */
const ADMIN_HTML_CHAPTER_KEYS = DEFAULT_ADMIN_CHAPTER_ORDER;

/** User/Family HTML + matching Markdown export (profile user). */
const USER_HTML_CHAPTER_KEYS = [
	'manual',
	'ai',
	'guestHelp',
	'atAGlance',
	'rooms',
	'scripts',
	'routines',
	'adapters',
	'custom',
	'system',
	'troubleshooting',
];

/** Onboarding/Guest HTML + keys that apply to Markdown (profile onboarding). */
const ONBOARDING_HTML_CHAPTER_KEYS = [
	'welcome',
	'tips',
	'guestHelp',
	'stats',
	'ai',
	'capabilities',
	'rooms',
	'routines',
	'automations',
	'adapters',
	'custom',
	'hint',
	'quickstart',
	'system',
	'manual',
];

const MAX_CUSTOM_SECTIONS = 12;
const MAX_CUSTOM_BODY_CHARS = 24000;
const PROFILE_SET = new Set(['admin', 'user', 'onboarding']);

/**
 * @param {unknown} config
 * @returns {string[]}
 */
function parseAdminHiddenChapters(config) {
	return parseHiddenJsonArray(config, 'adminHiddenChaptersJson', 'adminHiddenChapters', DEFAULT_ADMIN_CHAPTER_ORDER);
}

/**
 * @param {unknown} config
 * @returns {string[]}
 */
function parseUserHiddenChapters(config) {
	return parseHiddenJsonArray(config, 'userHiddenChaptersJson', 'userHiddenChapters', USER_HTML_CHAPTER_KEYS);
}

/**
 * @param {unknown} config
 * @returns {string[]}
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
 * @param {unknown} config
 * @param {string} jsonKey
 * @param {string} legacyKey
 * @param {string[]} allowedList
 * @returns {string[]}
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
 * @param {unknown} config
 * @returns {{ title: string, bodyMarkdown: string, profiles?: string[], anchorId: string }[]}
 */
function parseCustomDocSections(config) {
	if (!config) {
		return [];
	}
	const raw = config.customDocSectionsJson;
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
 * @param {string} [raw]
 * @returns {string} auto | light | dark
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
 * @param {string} [raw]
 * @returns {string}
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
 * @param {string} [raw]
 * @returns {string}
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
 * @param {string[]} defaultOrder
 * @param {string[]} userOrder
 * @returns {string[]}
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
 * @param {unknown} config
 * @param {string} jsonKey
 * @param {string} legacyKey
 * @param {string[]} allowedList
 * @param {string[]} defaultOrder
 * @returns {string[]}
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
 * @param {unknown} config
 * @returns {string[]}
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

const HTML_THEME_PRESET_IDS = new Set(['default', 'highContrast', 'warm', 'slate']);

/**
 * @param {unknown} raw
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
	ADMIN_HTML_CHAPTER_KEYS,
	DEFAULT_ADMIN_CHAPTER_ORDER,
	USER_HTML_CHAPTER_KEYS,
	ONBOARDING_HTML_CHAPTER_KEYS,
	parseAdminHiddenChapters,
	parseUserHiddenChapters,
	parseOnboardingHiddenChapters,
	parseCustomDocSections,
	parseHtmlColorScheme,
	parseAdminChapterOrder,
	mergeChapterOrder,
	parseHtmlThemePreset,
	sanitizeFontStack,
	sanitizeLogoUrl,
	MAX_CUSTOM_SECTIONS,
	MAX_CUSTOM_BODY_CHARS,
};
