'use strict';

const { buildForumCard } = require('./forumCard');
const { buildDocChangeSinceLastRun } = require('./docChangeFormat');

/** Schema-Version des Packs — bei Breaking Changes hochzählen, nicht den Adapter-Semver. */
const CONTEXT_PACK_VERSION = 1;
/** Max. Räume im Pack, damit das JSON klein bleibt (volle Liste bleibt in autodoc-latest.json). */
const MAX_ROOMS = 24;
/** Max. Delta-Zeilen (Inventar seit letztem Lauf). */
const MAX_DELTA_LINES = 20;
/** Max. offene Maintenance-Punkte. */
const MAX_GAPS = 16;

/**
 * Schneidet ein Array auf `max` Einträge; `truncated` sagt dem Leser, dass mehr existiert.
 *
 * @param {unknown[]} list Beliebige Liste
 * @param {number} max Obergrenze
 * @returns {{ items: unknown[], truncated: boolean }} gekürzte Liste plus Flag, ob Einträge fehlen
 */
function capList(list, max) {
	const items = Array.isArray(list) ? list : [];
	if (items.length <= max) {
		return { items, truncated: false };
	}
	return { items: items.slice(0, max), truncated: true };
}

/**
 * Kompaktes Context-Pack für Modelle, MCP und später sendTo.
 * Kein Ersatz für autodoc-latest.json — nur Kurzinventar, Delta, Räume, Forum-Karte, Lücken.
 *
 * @param {object|null|undefined} docModel Volles Dokumentmodell nach einem Generate-Lauf
 * @param {{ t: (key: string, ...args: unknown[]) => string }} i18n gleiche Instanz wie HTML/Forum-Karte
 * @returns {object} JSON-fähiges Pack (immer ein Objekt, nie null)
 */
function buildContextPack(docModel, i18n) {
	const emptyI18n = i18n && typeof i18n.t === 'function' ? i18n : { t: key => String(key) };
	const model = docModel && typeof docModel === 'object' ? docModel : {};
	const system = model.system && typeof model.system === 'object' ? model.system : {};
	const stats = system.statistics && typeof system.statistics === 'object' ? system.statistics : {};
	const roomsWrap = model.rooms && typeof model.rooms === 'object' ? model.rooms : {};
	const scriptsWrap = model.scripts && typeof model.scripts === 'object' ? model.scripts : {};
	const maintenance = model.maintenance && typeof model.maintenance === 'object' ? model.maintenance : {};
	const scores = maintenance.scores && typeof maintenance.scores === 'object' ? maintenance.scores : {};
	const meta = model.meta && typeof model.meta === 'object' ? model.meta : {};
	const manual = model.manualContext && typeof model.manualContext === 'object' ? model.manualContext : {};
	const qs = model.quickStart && typeof model.quickStart === 'object' ? model.quickStart : {};
	const autoOv =
		model.automationOverview && typeof model.automationOverview === 'object' ? model.automationOverview : {};

	// Forum-Karte erwartet primaryHost/stateSummary — fehlende Felder auffüllen, nicht crashen.
	let forumPlain = '';
	try {
		const host = system.primaryHost && typeof system.primaryHost === 'object' ? system.primaryHost : {};
		const appendices = model.appendices && typeof model.appendices === 'object' ? model.appendices : {};
		const stateSummary =
			appendices.stateSummary && typeof appendices.stateSummary === 'object'
				? appendices.stateSummary
				: { total: 0, writable: 0, readonly: 0 };
		forumPlain = buildForumCard(
			{
				...model,
				system: {
					...system,
					primaryHost: {
						name: host.name || '',
						platform: host.platform || '',
						version: host.version || '',
						nodeVersion: host.nodeVersion || '',
						npmVersion: host.npmVersion || '',
						operatingSystem: host.operatingSystem || '',
					},
					statistics: stats,
					location: system.location && typeof system.location === 'object' ? system.location : {},
					hostResources:
						system.hostResources && typeof system.hostResources === 'object' ? system.hostResources : {},
				},
				appendices: { ...appendices, stateSummary },
			},
			emptyI18n,
		).plaintext;
	} catch {
		forumPlain = '';
	}

	const roomRows = Array.isArray(roomsWrap.rooms) ? roomsWrap.rooms : [];
	const cappedRooms = capList(
		roomRows.map(r => ({
			id: r && r.id ? String(r.id) : '',
			name: r && r.name ? String(r.name) : '',
			deviceCount: r && r.deviceCount != null ? r.deviceCount : 0,
		})),
		MAX_ROOMS,
	);

	const delta = buildDocChangeSinceLastRun(model.docChangeSinceLastRun, emptyI18n);
	const deltaLines = capList(
		(delta.lines || []).map(line => ({
			type: line.typeLabel || '',
			detail: line.detail || '',
		})),
		MAX_DELTA_LINES,
	);

	const failedChecks = (Array.isArray(maintenance.checklist) ? maintenance.checklist : []).filter(
		c => c && c.ok === false,
	);
	const gapsCapped = capList(
		failedChecks.map(c => ({
			key: c.key || '',
			label: c.key ? emptyI18n.t(c.key) : '',
		})),
		MAX_GAPS,
	);

	const roomGuides = Array.isArray(qs.roomGuides) ? qs.roomGuides : [];
	const guestRooms = capList(
		roomGuides.map(g => ({
			name: g && g.name ? String(g.name) : '',
			deviceCount: g && g.deviceCount != null ? g.deviceCount : 0,
			highlights: Array.isArray(g.highlights)
				? g.highlights.slice(0, 3).map(h => ({
						name: h && h.deviceName ? String(h.deviceName) : '',
						value: h && h.valueText ? String(h.valueText) : '',
					}))
				: [],
		})),
		MAX_ROOMS,
	);

	return {
		packVersion: CONTEXT_PACK_VERSION,
		generatedAt: meta.generatedAt || '',
		language: meta.language || '',
		projectName: system.projectName || '',
		notes: {
			description: manual.description ? String(manual.description).slice(0, 500) : '',
			guestHelp: manual.guestHelpNote ? String(manual.guestHelpNote).slice(0, 400) : '',
		},
		inventory: {
			instances: stats.instanceCount || 0,
			enabledInstances: stats.enabledInstanceCount || 0,
			disabledInstances: stats.disabledInstanceCount || 0,
			states: stats.totalStateObjects || 0,
			rooms: roomsWrap.totalRooms || 0,
			functions: roomsWrap.totalFunctions || 0,
			scripts: scriptsWrap.totalScripts || 0,
			enabledScripts: scriptsWrap.enabledScripts || 0,
			host: system.primaryHost && system.primaryHost.name ? system.primaryHost.name : '',
			jsController: system.primaryHost && system.primaryHost.version ? system.primaryHost.version : '',
		},
		delta: {
			skip: !!delta.skip,
			isInitial: !!delta.isInitial,
			headline: delta.headline || '',
			truncated: deltaLines.truncated,
			lines: deltaLines.items,
		},
		rooms: {
			truncated: cappedRooms.truncated,
			list: cappedRooms.items,
		},
		guest: {
			truncated: guestRooms.truncated,
			rooms: guestRooms.items,
		},
		forumCard: forumPlain || '',
		gaps: {
			score: maintenance.score != null ? maintenance.score : null,
			data: scores.data && scores.data.score != null ? scores.data.score : null,
			manual: scores.manual && scores.manual.score != null ? scores.manual.score : null,
			depth: scores.depth && scores.depth.score != null ? scores.depth.score : null,
			truncated: gapsCapped.truncated,
			items: gapsCapped.items,
		},
		automation: {
			timeBasedCount: Array.isArray(autoOv.entries) ? autoOv.entries.length : 0,
		},
	};
}

module.exports = {
	CONTEXT_PACK_VERSION,
	MAX_ROOMS,
	buildContextPack,
};
