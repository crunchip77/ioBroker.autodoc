'use strict';

/** Sort groups: time-based first, then event triggers, then adapter cron. */
const KIND_ORDER = ['script-cron', 'script-trigger', 'schedule-object', 'adapter-schedule', 'adapter-restart'];

const TRIGGER_TYPES_IN_OVERVIEW = new Set(['schedule', 'subscribe', 'on-start', 'blockly']);

/**
 * Build a unified Admin overview of automations from data AutoDoc already collects.
 * Does not parse Blockly or external rule engines — see i18n transparency text in the renderer.
 *
 * @param {object} params
 * @param {object} [params.scripts] Output of DocumentModel.buildScripts
 * @param {Array<object>} [params.scheduleObjects] From discovery readScheduleDesignObjects
 * @param {object} [params.adapters] Output of DocumentModel.buildAdapterInfo
 * @returns {{ entries: Array<object>, counts: object, isEmpty: boolean }}
 */
function buildAutomationOverview({ scripts, scheduleObjects, adapters } = {}) {
	const entries = [];

	const scriptList = (scripts && scripts.scripts) || [];
	for (const script of scriptList) {
		const cron = script.schedule && String(script.schedule).trim();
		if (cron) {
			entries.push({
				kind: 'script-cron',
				id: script.id,
				name: script.name,
				detail: cron,
				triggerLabel: script.triggerType || '',
				enabled: !!script.enabled,
				anchor: 'scripts',
			});
			continue;
		}
		const tt = script.triggerType || '';
		if (TRIGGER_TYPES_IN_OVERVIEW.has(tt)) {
			entries.push({
				kind: 'script-trigger',
				id: script.id,
				name: script.name,
				detail: tt,
				triggerLabel: tt,
				enabled: !!script.enabled,
				anchor: 'scripts',
			});
		}
	}

	for (const s of scheduleObjects || []) {
		entries.push({
			kind: 'schedule-object',
			id: s.id,
			name: s.name,
			detail: s.desc || '',
			triggerLabel: '',
			enabled: s.enabled !== false,
			anchor: 'schedule-objects',
		});
	}

	const adapterList = (adapters && adapters.adapters) || [];
	for (const adapter of adapterList) {
		for (const inst of adapter.instances || []) {
			const scheduleCron = inst.scheduleCron && String(inst.scheduleCron).trim();
			if (scheduleCron) {
				entries.push({
					kind: 'adapter-schedule',
					id: inst.id,
					name: adapter.title && adapter.title !== adapter.name ? adapter.title : adapter.name,
					detail: scheduleCron,
					triggerLabel: inst.mode || '',
					enabled: !!inst.enabled,
					anchor: 'adapter-instances',
				});
			}
			const restartSchedule = inst.restartSchedule && String(inst.restartSchedule).trim();
			if (restartSchedule) {
				entries.push({
					kind: 'adapter-restart',
					id: inst.id,
					name: adapter.title && adapter.title !== adapter.name ? adapter.title : adapter.name,
					detail: restartSchedule,
					triggerLabel: '',
					enabled: !!inst.enabled,
					anchor: 'adapter-instances',
				});
			}
		}
	}

	entries.sort((a, b) => {
		const ka = KIND_ORDER.indexOf(a.kind);
		const kb = KIND_ORDER.indexOf(b.kind);
		if (ka !== kb) {
			return ka - kb;
		}
		const na = String(a.name || a.id).toLocaleLowerCase();
		const nb = String(b.name || b.id).toLocaleLowerCase();
		return na.localeCompare(nb);
	});

	const counts = {
		scriptCron: entries.filter(e => e.kind === 'script-cron').length,
		scriptTrigger: entries.filter(e => e.kind === 'script-trigger').length,
		scheduleObjects: entries.filter(e => e.kind === 'schedule-object').length,
		adapterSchedule: entries.filter(e => e.kind === 'adapter-schedule').length,
		adapterRestart: entries.filter(e => e.kind === 'adapter-restart').length,
		total: entries.length,
		enabled: entries.filter(e => e.enabled).length,
	};

	return {
		entries,
		counts,
		isEmpty: entries.length === 0,
	};
}

module.exports = {
	buildAutomationOverview,
	KIND_ORDER,
	TRIGGER_TYPES_IN_OVERVIEW,
};
