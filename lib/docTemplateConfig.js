/**
 * Optional documentation layout: admin chapter visibility, custom Markdown sections.
 * See PLAN.md → Custom Templates (Phase 5).
 */

/** Chapters in generated Admin HTML (ids match jsonConfig help). */
const ADMIN_HTML_CHAPTER_KEYS = [
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
	'changelog',
	'appendices',
	'custom',
];

/** User/Family HTML + matching Markdown export (profile user). */
const USER_HTML_CHAPTER_KEYS = [
	'manual',
	'ai',
	'guestHelp',
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
	return parseHiddenJsonArray(config, 'adminHiddenChaptersJson', 'adminHiddenChapters', ADMIN_HTML_CHAPTER_KEYS);
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

module.exports = {
	ADMIN_HTML_CHAPTER_KEYS,
	USER_HTML_CHAPTER_KEYS,
	ONBOARDING_HTML_CHAPTER_KEYS,
	parseAdminHiddenChapters,
	parseUserHiddenChapters,
	parseOnboardingHiddenChapters,
	parseCustomDocSections,
	parseHtmlColorScheme,
	sanitizeFontStack,
	sanitizeLogoUrl,
	MAX_CUSTOM_SECTIONS,
	MAX_CUSTOM_BODY_CHARS,
};
