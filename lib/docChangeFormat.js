'use strict';

/**
 * Build localized strings for "changes since last documentation run"
 * (same semantics as Admin changelog cards — adapter_version uses changelogMsgAdapterVersion).
 *
 * @param {object|null|undefined} changeData Result of VersionTracker.compareVersions
 * @param {{ t: (key: string, ...args: unknown[]) => string }} i18n Translation helper with `.t(key, ...args)`
 * @returns {{ skip: boolean, isInitial?: boolean, headline: string, lines: Array<{ typeLabel: string, detail: string }> }} Labels and detail lines for export UI
 */
function buildDocChangeSinceLastRun(changeData, i18n) {
	if (!changeData) {
		return { skip: true, headline: '', lines: [] };
	}
	if (changeData.isInitial) {
		return {
			skip: false,
			isInitial: true,
			headline: i18n.t('docChangeSummaryInitial'),
			lines: [],
		};
	}
	const changes = changeData.changes || [];
	if (changes.length === 0) {
		return {
			skip: false,
			isInitial: false,
			headline: i18n.t('docChangeSummaryNone'),
			lines: [],
		};
	}
	const lines = changes.map(ch => {
		const typeKey = `changelogChange_${ch.type}`;
		const typeResolved = i18n.t(typeKey);
		const typeLabel = typeResolved !== typeKey ? typeResolved : ch.type;
		let detail = ch.message || '';
		if (ch.type === 'adapter_version' && ch.instanceId && ch.adapterTitle !== undefined) {
			detail = i18n.t(
				'changelogMsgAdapterVersion',
				ch.adapterTitle || ch.instanceId,
				ch.instanceId,
				ch.previous,
				ch.current,
			);
		}
		return { typeLabel, detail };
	});
	return {
		skip: false,
		isInitial: false,
		headline: i18n.t('docChangeSummaryCount', changes.length),
		lines,
	};
}

/**
 * Localized one-line summary for changelog cards, notifications, and logs (no trailing colon).
 *
 * @param {{ isInitial?: boolean, changes?: Array<unknown> } | null | undefined} changeLike Snapshot-style object (`isInitial`, `changes`) as from compare logic.
 * @param {{ t: (key: string, ...args: unknown[]) => string }} i18n Translation helper with `.t(key, ...args)`.
 * @returns {string} One-line localized summary (empty string if `changeLike` is nullish).
 */
function localizeCompareSummary(changeLike, i18n) {
	if (!changeLike) {
		return '';
	}
	if (changeLike.isInitial) {
		return i18n.t('docChangeSummaryInitial');
	}
	const changes = changeLike.changes || [];
	if (changes.length === 0) {
		return i18n.t('docChangeSummaryNone');
	}
	return i18n.t('changelogSummaryChangesDetected', changes.length);
}

/**
 * User-facing hint only when there is at least one detected inventory delta (not first run, not zero changes).
 *
 * @param {object | null | undefined} changeData Result of compareVersions
 * @returns {boolean} True iff `changeData` exists, is not the initial run, and has a non-empty `changes` array.
 */
function shouldShowUserFriendlyDocChange(changeData) {
	return !!(
		changeData &&
		!changeData.isInitial &&
		Array.isArray(changeData.changes) &&
		changeData.changes.length > 0
	);
}

module.exports = { buildDocChangeSinceLastRun, localizeCompareSummary, shouldShowUserFriendlyDocChange };
