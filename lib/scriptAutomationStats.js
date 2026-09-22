'use strict';

/** Adapter names treated as external rule engines (not parsed — listed for transparency only). */
const RULE_ENGINE_ADAPTER_NAMES = new Set(['node-red', 'nodered', 'scene', 'scenes', 'logic']);

/**
 * Count active scripts by trigger type and CRON fields (for Admin transparency text).
 *
 * @param {Array<object>} scriptList Rows from `buildScripts`
 * @returns {{ enabledTotal: number, disabledTotal: number, byTrigger: object, withObjectCron: number, scheduleInCodeOnly: number }}
 */
function buildScriptAutomationStats(scriptList) {
	const list = scriptList || [];
	const enabled = list.filter(s => s.enabled);
	const byTrigger = {
		blockly: 0,
		subscribe: 0,
		schedule: 0,
		'on-start': 0,
		unknown: 0,
	};
	let withObjectCron = 0;
	let scheduleInCodeOnly = 0;

	for (const s of enabled) {
		const tt = s.triggerType && byTrigger[s.triggerType] !== undefined ? s.triggerType : 'unknown';
		byTrigger[tt]++;
		const hasCron = !!(s.schedule && String(s.schedule).trim());
		if (hasCron) {
			withObjectCron++;
		} else if (tt === 'schedule') {
			scheduleInCodeOnly++;
		}
	}

	return {
		enabledTotal: enabled.length,
		disabledTotal: list.length - enabled.length,
		byTrigger,
		withObjectCron,
		scheduleInCodeOnly,
	};
}

/**
 * Enabled adapter instances that look like scene/logic/Node-RED rule engines.
 *
 * @param {object} [adapters] Output of `buildAdapterInfo`
 * @returns {Array<{ name: string, title: string, instanceCount: number }>}
 */
function findRuleEngineInstances(adapters) {
	const out = [];
	const adapterList = (adapters && adapters.adapters) || [];
	for (const adapter of adapterList) {
		const name = String(adapter.name || '').toLowerCase();
		if (!RULE_ENGINE_ADAPTER_NAMES.has(name)) {
			continue;
		}
		const enabledInst = (adapter.instances || []).filter(i => i.enabled);
		if (enabledInst.length === 0) {
			continue;
		}
		out.push({
			name: adapter.name,
			title: adapter.title && adapter.title !== adapter.name ? adapter.title : adapter.name,
			instanceCount: enabledInst.length,
		});
	}
	out.sort((a, b) => String(a.title).localeCompare(String(b.title)));
	return out;
}

/**
 * Comma-separated trigger breakdown for transparency boxes (Admin overview / system chapter).
 *
 * @param {{ enabledTotal?: number, byTrigger?: object, withObjectCron?: number, scheduleInCodeOnly?: number }} scriptStats
 * @param {function(string, ...*): string} t i18n `t` function
 * @returns {string}
 */
function formatScriptTriggerBreakdown(scriptStats, t) {
	if (!scriptStats || !scriptStats.enabledTotal) {
		return '';
	}
	const b = scriptStats.byTrigger || {};
	const parts = [];
	if (b.blockly) {
		parts.push(t('automationTriggerBlockly', b.blockly));
	}
	if (b.subscribe) {
		parts.push(t('automationTriggerSubscribe', b.subscribe));
	}
	if (scriptStats.scheduleInCodeOnly) {
		parts.push(t('automationTriggerScheduleCode', scriptStats.scheduleInCodeOnly));
	}
	if (scriptStats.withObjectCron) {
		parts.push(t('automationTriggerScheduleCron', scriptStats.withObjectCron));
	}
	if (b['on-start']) {
		parts.push(t('automationTriggerOnStart', b['on-start']));
	}
	if (b.unknown) {
		parts.push(t('automationTriggerUnknown', b.unknown));
	}
	return parts.join(' · ');
}

module.exports = {
	buildScriptAutomationStats,
	findRuleEngineInstances,
	formatScriptTriggerBreakdown,
	RULE_ENGINE_ADAPTER_NAMES,
};
