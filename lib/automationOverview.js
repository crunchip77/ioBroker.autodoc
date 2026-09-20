'use strict';

/** Sort groups: time-based script CRON first, then schedule objects, then adapter cron. */
const KIND_ORDER = ['script-cron', 'schedule-object', 'adapter-schedule', 'adapter-restart'];

/**
 * Build Admin overview of **time-based** automation only (CRON / schedule mode).
 * Event-driven scripts (subscribe, blockly, …) stay in the Scripts chapter — avoids duplicating 200+ rows.
 *
 * @param {object} params
 * @param {object} [params.scripts] Output of DocumentModel.buildScripts
 * @param {Array<object>} [params.scheduleObjects] From discovery readScheduleDesignObjects
 * @param {object} [params.adapters] Output of DocumentModel.buildAdapterInfo
 * @returns {{ entries: Array<object>, sections: object, counts: object, isEmpty: boolean, eventScriptCount: number }}
 */
function buildAutomationOverview({ scripts, scheduleObjects, adapters } = {}) {
	const entries = [];
	const scriptList = (scripts && scripts.scripts) || [];

	for (const script of scriptList) {
		const cron = script.schedule && String(script.schedule).trim();
		if (!cron) {
			continue;
		}
		entries.push({
			kind: 'script-cron',
			id: script.id,
			name: script.name,
			detail: cron,
			enabled: !!script.enabled,
			anchor: 'scripts',
		});
	}

	for (const s of scheduleObjects || []) {
		entries.push({
			kind: 'schedule-object',
			id: s.id,
			name: s.name,
			detail: s.desc || '',
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

	const sections = {};
	for (const kind of KIND_ORDER) {
		sections[kind] = entries.filter(e => e.kind === kind);
	}

	const eventScriptCount = scriptList.filter(
		s => !(s.schedule && String(s.schedule).trim()) && s.enabled,
	).length;

	const counts = {
		scriptCron: sections['script-cron'].length,
		scheduleObjects: sections['schedule-object'].length,
		adapterSchedule: sections['adapter-schedule'].length,
		adapterRestart: sections['adapter-restart'].length,
		total: entries.length,
		enabled: entries.filter(e => e.enabled).length,
		disabled: entries.filter(e => !e.enabled).length,
	};

	return {
		entries,
		sections,
		counts,
		isEmpty: entries.length === 0,
		eventScriptCount,
	};
}

module.exports = {
	buildAutomationOverview,
	KIND_ORDER,
};
