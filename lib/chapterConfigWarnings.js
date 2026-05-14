'use strict';

const {
	DEFAULT_ADMIN_CHAPTER_ORDER,
	USER_HTML_CHAPTER_KEYS,
	ONBOARDING_HTML_CHAPTER_KEYS,
	EXTRA_HIDDEN_CHAPTER_IDS,
} = require('./docTemplateConfig');

const DOC_HELP_URL =
	'https://github.com/crunchip77/ioBroker.autodoc/blob/main/docs/user-guide/README.de.md#wiki-admin-json-cookbook';

const ADMIN_HIDE_ALLOWED = [...DEFAULT_ADMIN_CHAPTER_ORDER, ...EXTRA_HIDDEN_CHAPTER_IDS];
const USER_HIDE_ALLOWED = [...USER_HTML_CHAPTER_KEYS, ...EXTRA_HIDDEN_CHAPTER_IDS];

/**
 * Dedupe chapter-JSON warning lines per logger instance ({@link WeakMap} keyed on the `log` object).
 */
const emittedChapterJsonWarnSignatures = new WeakMap();

/**
 * Invoke `log.warn(line)` unless the identical line was already emitted for this `log`.
 *
 * @param {{ warn?: (s: string) => void } | null | undefined} log Logger instance (typically `adapter.log`).
 * @param {string} line Full message for `log.warn`.
 */
function warnChapterJsonDeduped(log, line) {
	if (!log || typeof log.warn !== 'function') {
		return;
	}
	let bucket = emittedChapterJsonWarnSignatures.get(log);
	if (!bucket) {
		bucket = new Set();
		emittedChapterJsonWarnSignatures.set(log, bucket);
	}
	if (bucket.has(line)) {
		return;
	}
	bucket.add(line);
	log.warn(line);
}

/**
 * Extract JSON array from config field (matches hidden/order parsers behaviour).
 *
 * @param {unknown} config Adapter native configuration object (or compatible dict).
 * @param {string} jsonKey Primary property holding a JSON string or string array of chapter ids.
 * @param {string} legacyKey Alternate property used when `jsonKey` is missing.
 * @returns {*} Discriminated parse result — `{ kind:'ok', arr, source:'canonical'|'legacy' }`, `{ kind:'empty' }`,
 * `{ kind:'invalid-json', source }`, or `{ kind:'not-array', source }` (aligned with templates’ native field readers).
 */
function readStringOrArrayChapterList(config, jsonKey, legacyKey) {
	if (!config) {
		return { kind: 'empty' };
	}
	let raw = config[jsonKey];
	let source = 'canonical';
	if (raw === undefined || raw === null) {
		raw = config[legacyKey];
		if (raw === undefined || raw === null) {
			return { kind: 'empty' };
		}
		source = 'legacy';
	}

	let arr = [];
	if (typeof raw === 'string') {
		const s = raw.trim();
		if (!s) {
			return { kind: 'empty' };
		}
		try {
			arr = JSON.parse(s);
		} catch {
			return { kind: 'invalid-json', source };
		}
	} else if (Array.isArray(raw)) {
		arr = raw;
	} else {
		return { kind: 'not-array', source };
	}
	if (!Array.isArray(arr)) {
		return { kind: 'not-array', source };
	}
	const cleaned = [];
	for (const x of arr) {
		const k = String(x).trim();
		if (!k) {
			continue;
		}
		cleaned.push(k);
	}
	return { kind: 'ok', arr: cleaned, source };
}

/**
 * Chapter order list: tokens outside the whitelist and duplicate allowed ids (callers keep first occurrence).
 *
 * @param {string[]} seq Ordered chapter id tokens from `readStringOrArrayChapterList`.
 * @param {Set<string>} allowedSet Valid chapter ids for this order list.
 * @returns {{ unknown: Set<string>, duplicateAllowed: Set<string> }} Unknown ids and whitelisted ids that appear more than once.
 */
function classifyChapterOrderTokens(seq, allowedSet) {
	const unknown = new Set();
	const duplicateAllowed = new Set();
	const seenAllowed = new Set();
	for (const k of seq) {
		if (!allowedSet.has(k)) {
			unknown.add(k);
			continue;
		}
		if (seenAllowed.has(k)) {
			duplicateAllowed.add(k);
		} else {
			seenAllowed.add(k);
		}
	}
	return { unknown, duplicateAllowed };
}

/**
 * Hidden list: classify tokens not whitelisted + duplicates kept by filter semantics.
 *
 * @param {string[]} seq Chapter id tokens from a hide-list JSON array.
 * @param {Set<string>} allowedSet Valid ids that may appear in this hide list.
 * @returns {{ unknown: Set<string>, duplicatePairs: boolean }} Disallowed ids and whether any whitelisted id is listed more than once.
 */
function classifyHiddenChapterTokens(seq, allowedSet) {
	const unknown = new Set();
	let duplicatePairs = false;
	const counts = new Map();
	for (const k of seq) {
		if (!allowedSet.has(k)) {
			unknown.add(k);
		} else {
			const next = (counts.get(k) || 0) + 1;
			counts.set(k, next);
			if (next > 1) {
				duplicatePairs = true;
			}
		}
	}
	return { unknown, duplicatePairs };
}

/**
 * One log line prefix + suffix with cookbook URL (English; matches adapter log language policy for technical hints).
 *
 * @param {string} primaryKey Canonical native field (`…Json`).
 * @param {string} legacyKey Legacy native fallback field name (`spec.legacy`).
 * @param {'canonical' | 'legacy'} source Whether the value was read from `primaryKey` or `legacyKey`.
 * @param {string} extras Sentence fragment after the colon (reason / id list).
 * @returns {string} Single line suitable for `log.warn`.
 */
function formatWarnLine(primaryKey, legacyKey, source, extras) {
	const label = source === 'legacy' ? `${primaryKey} via native ${legacyKey}` : primaryKey;
	return `Chapter JSON (${label}): ${extras} — valid ids see field help (?). Recipes: GitHub Wiki step 6: ${DOC_HELP_URL}`;
}

/**
 * Warn about invalid JSON shape, ignored chapter ids, or duplicate ordering ids (English log text).
 *
 * Identical warning lines are emitted at most once per `log` reference (adapter process lifetime), so scheduled doc runs do not spam the log.
 *
 * @param {{ warn: (s: string) => void }} log Logger with `warn(string)`; typically `adapter.log`.
 * @param {unknown} config Adapter native configuration containing chapter order and hidden-chapter JSON fields.
 */
function warnChapterJsonLayout(log, config) {
	const orderSpecs = [
		{ label: 'adminChapterOrderJson', legacy: 'adminChapterOrder', allowed: DEFAULT_ADMIN_CHAPTER_ORDER },
		{ label: 'userChapterOrderJson', legacy: 'userChapterOrder', allowed: USER_HTML_CHAPTER_KEYS },
		{
			label: 'onboardingChapterOrderJson',
			legacy: 'onboardingChapterOrder',
			allowed: ONBOARDING_HTML_CHAPTER_KEYS,
		},
	];

	for (const spec of orderSpecs) {
		const read = readStringOrArrayChapterList(config, spec.label, spec.legacy);
		if (read.kind === 'empty') {
			continue;
		}
		if (read.kind === 'invalid-json') {
			warnChapterJsonDeduped(
				log,
				formatWarnLine(
					spec.label,
					spec.legacy,
					read.source,
					'invalid JSON (using built-in chapter order instead)',
				),
			);
			continue;
		}
		if (read.kind === 'not-array') {
			warnChapterJsonDeduped(
				log,
				formatWarnLine(
					spec.label,
					spec.legacy,
					read.source,
					'JSON must be an array (using built-in order instead)',
				),
			);
			continue;
		}
		const allowedSet = new Set(spec.allowed);
		const { unknown, duplicateAllowed } = classifyChapterOrderTokens(read.arr, allowedSet);
		if (unknown.size) {
			warnChapterJsonDeduped(
				log,
				formatWarnLine(
					spec.label,
					spec.legacy,
					read.source,
					`ignored unknown id(s): ${[...unknown].sort().join(', ')}`,
				),
			);
		}
		if (duplicateAllowed.size) {
			warnChapterJsonDeduped(
				log,
				formatWarnLine(
					spec.label,
					spec.legacy,
					read.source,
					`ignored duplicate id(s): ${[...duplicateAllowed].sort().join(', ')} (first occurrence wins)`,
				),
			);
		}
	}

	const hiddenSpecs = [
		{ label: 'adminHiddenChaptersJson', legacy: 'adminHiddenChapters', allowed: ADMIN_HIDE_ALLOWED },
		{ label: 'userHiddenChaptersJson', legacy: 'userHiddenChapters', allowed: USER_HIDE_ALLOWED },
		{
			label: 'onboardingHiddenChaptersJson',
			legacy: 'onboardingHiddenChapters',
			allowed: ONBOARDING_HTML_CHAPTER_KEYS,
		},
	];

	for (const spec of hiddenSpecs) {
		const read = readStringOrArrayChapterList(config, spec.label, spec.legacy);
		if (read.kind === 'empty') {
			continue;
		}
		if (read.kind === 'invalid-json') {
			warnChapterJsonDeduped(
				log,
				formatWarnLine(spec.label, spec.legacy, read.source, 'invalid JSON (hide list ignored)'),
			);
			continue;
		}
		if (read.kind === 'not-array') {
			warnChapterJsonDeduped(
				log,
				formatWarnLine(spec.label, spec.legacy, read.source, 'JSON must be an array (hide list ignored)'),
			);
			continue;
		}
		const allowedSet = new Set(spec.allowed);
		const { unknown, duplicatePairs } = classifyHiddenChapterTokens(read.arr, allowedSet);
		if (unknown.size) {
			warnChapterJsonDeduped(
				log,
				formatWarnLine(
					spec.label,
					spec.legacy,
					read.source,
					`ignored unknown id(s): ${[...unknown].sort().join(', ')}`,
				),
			);
		}
		if (duplicatePairs) {
			warnChapterJsonDeduped(
				log,
				formatWarnLine(
					spec.label,
					spec.legacy,
					read.source,
					'duplicate id(s) in list (redundant; first match per id is enough)',
				),
			);
		}
	}
}

module.exports = {
	warnChapterJsonLayout,
	readStringOrArrayChapterList,
	classifyChapterOrderTokens,
	DOC_HELP_URL,
};
