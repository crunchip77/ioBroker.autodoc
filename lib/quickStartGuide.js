/**
 * Phase 5.x.2 — structured Quick Start + room guide picks from discovery (no invented facts).
 */

const MAX_SYSTEM_ITEMS = 5;
const MAX_ROOMS = 8;
const HIGHLIGHTS_PER_ROOM = 3;
const MAX_SCRIPT_SNIPPET = 120;

/**
 * Secondary ordering for scripts with equal first-line description length (DocumentModel `triggerType`).
 * Lower = earlier in Quick Start. Not primary sort — heuristic `desc` length stays first.
 * Rationale: schedule/subscribe often explain „what runs when“ better for snapshots than unknown/blockly.
 */
const QUICK_START_SCRIPT_TRIGGER_RANK = {
	schedule: 0,
	subscribe: 1,
	'on-start': 2,
	blockly: 3,
	unknown: 4,
};

/**
 * @param {{ triggerType?: string } | null | undefined} script Script row from `buildScripts` (may omit `triggerType`)
 * @returns {number} Sort rank; lower values sort earlier among equal-length descriptions
 */
function quickStartScriptTriggerRank(script) {
	const t = script && script.triggerType;
	if (t && Object.prototype.hasOwnProperty.call(QUICK_START_SCRIPT_TRIGGER_RANK, t)) {
		return QUICK_START_SCRIPT_TRIGGER_RANK[t];
	}
	return QUICK_START_SCRIPT_TRIGGER_RANK.unknown;
}

/** Caps for guest Onboarding quick start (same facts, shorter than User “at a glance”). */
const ONBOARDING_VIEW_MAX_SYSTEM_ITEMS = 3;
const ONBOARDING_VIEW_MAX_ROOMS = 4;
const ONBOARDING_VIEW_HIGHLIGHTS_PER_ROOM = 2;

/**
 * Narrow the shared `quickStart` model for Onboarding HTML/Markdown (Phase 5.x.2 guest UX).
 *
 * @param {{ hasContent?: boolean, systemItems?: object[], roomGuides?: object[] } | null | undefined} qs Full quick-start payload from `buildQuickStartGuide`
 * @returns {{ hasContent: boolean, systemItems: object[], roomGuides: object[] }} Shorter lists for guest presentation
 */
function sliceQuickStartForOnboarding(qs) {
	if (!qs || !qs.hasContent) {
		return { hasContent: false, systemItems: [], roomGuides: [] };
	}
	const systemItems = (qs.systemItems || []).slice(0, ONBOARDING_VIEW_MAX_SYSTEM_ITEMS);
	const roomGuides = (qs.roomGuides || []).slice(0, ONBOARDING_VIEW_MAX_ROOMS).map(rg => ({
		...rg,
		highlights: (rg.highlights || []).slice(0, ONBOARDING_VIEW_HIGHLIGHTS_PER_ROOM),
	}));
	const hasContent = systemItems.length > 0 || roomGuides.some(r => (r.highlights || []).length > 0);
	return { hasContent, systemItems, roomGuides };
}

/**
 * @param {object} roomsBlock — return value of DocumentModel#buildRooms
 * @param {object} scriptsBlock — { scripts: Array }
 * @returns {{ hasContent: boolean, systemItems: object[], roomGuides: object[] }} - structured quick-start payload for the renderer
 */
function buildQuickStartGuide(roomsBlock, scriptsBlock) {
	const systemItems = [];
	const roomsB = roomsBlock || {};
	const fnList = Array.isArray(roomsB.functions) ? [...roomsB.functions] : [];
	fnList.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
	const topFn = fnList.slice(0, 3);

	if (roomsB.totalRooms > 0) {
		systemItems.push({
			kind: 'roomCount',
			n: roomsB.totalRooms,
		});
	}

	for (const f of topFn) {
		if (systemItems.length >= MAX_SYSTEM_ITEMS) {
			break;
		}
		if (f && f.name) {
			systemItems.push({
				kind: 'function',
				name: f.name,
				memberCount: f.memberCount || 0,
			});
		}
	}

	const scriptList = (scriptsBlock && scriptsBlock.scripts) || [];
	const withDesc = scriptList.filter(s => s.enabled && s.desc && String(s.desc).trim());
	/**
	 * 1) Longer first-line `desc` (more informative).
	 * 2) Same length: `triggerType` rank (schedule → subscribe → on-start → blockly → unknown).
	 * 3) Then name (stable).
	 */
	withDesc.sort((a, b) => {
		const la = String((a && a.desc) || '')
			.trim()
			.split('\n')[0]
			.trim().length;
		const lb = String((b && b.desc) || '')
			.trim()
			.split('\n')[0]
			.trim().length;
		if (lb !== la) {
			return lb - la;
		}
		const ra = quickStartScriptTriggerRank(a);
		const rb = quickStartScriptTriggerRank(b);
		if (ra !== rb) {
			return ra - rb;
		}
		const na = String((a && a.name) || (a && a.id) || '');
		const nb = String((b && b.name) || (b && b.id) || '');
		return na.localeCompare(nb, undefined, { sensitivity: 'base' });
	});
	for (const s of withDesc) {
		if (systemItems.length >= MAX_SYSTEM_ITEMS) {
			break;
		}
		const line = String(s.desc).split('\n')[0].trim().slice(0, MAX_SCRIPT_SNIPPET);
		if (line) {
			systemItems.push({
				kind: 'script',
				name: s.name || s.id,
				desc: line,
			});
		}
	}

	while (systemItems.length > MAX_SYSTEM_ITEMS) {
		systemItems.pop();
	}

	const roomList = Array.isArray(roomsB.rooms) ? [...roomsB.rooms] : [];
	roomList.sort((a, b) => {
		const da = a && Array.isArray(a.devices) ? a.devices.length : 0;
		const db = b && Array.isArray(b.devices) ? b.devices.length : 0;
		if (db !== da) {
			return db - da;
		}
		const na = a && a.name ? String(a.name) : '';
		const nb = b && b.name ? String(b.name) : '';
		return na.localeCompare(nb, undefined, { sensitivity: 'base' });
	});
	const roomGuides = [];
	let roomIndex = 0;
	for (const room of roomList) {
		if (roomIndex >= MAX_ROOMS) {
			break;
		}
		if (!room || !room.name) {
			continue;
		}
		const devs = Array.isArray(room.devices) ? [...room.devices] : [];
		devs.sort((a, b) => {
			const as = a && a.currentValue != null && a.currentValue !== '' ? 1 : 0;
			const bs = b && b.currentValue != null && b.currentValue !== '' ? 1 : 0;
			return bs - as;
		});
		const byCat = new Map();
		const rest = [];
		for (const d of devs) {
			if (!d) {
				continue;
			}
			const cat = d.category || 'other';
			if (!byCat.has(cat)) {
				byCat.set(cat, d);
			} else {
				rest.push(d);
			}
		}
		const picked = Array.from(byCat.values());
		for (const d of rest) {
			if (picked.length >= HIGHLIGHTS_PER_ROOM) {
				break;
			}
			if (!picked.includes(d)) {
				picked.push(d);
			}
		}
		for (const d of devs) {
			if (picked.length >= HIGHLIGHTS_PER_ROOM) {
				break;
			}
			if (!picked.includes(d)) {
				picked.push(d);
			}
		}
		const highlights = picked.slice(0, HIGHLIGHTS_PER_ROOM).map(d => ({
			deviceName: d.deviceName || '',
			icon: d.icon || '📦',
			category: d.category || '',
			valueText:
				d.currentValue != null && d.currentValue !== ''
					? String(d.currentValue) + (d.unit ? ` ${d.unit}` : '')
					: '',
		}));

		if (highlights.length > 0) {
			roomGuides.push({
				name: room.name,
				deviceCount: room.memberCount != null ? room.memberCount : devs.length,
				highlights,
			});
			roomIndex += 1;
		}
	}

	const hasContent = systemItems.length > 0 || roomGuides.length > 0;
	return { hasContent, systemItems, roomGuides };
}

module.exports = {
	buildQuickStartGuide,
	sliceQuickStartForOnboarding,
	quickStartScriptTriggerRank,
	MAX_ROOMS,
	HIGHLIGHTS_PER_ROOM,
	MAX_SYSTEM_ITEMS,
	ONBOARDING_VIEW_MAX_SYSTEM_ITEMS,
	ONBOARDING_VIEW_MAX_ROOMS,
	ONBOARDING_VIEW_HIGHLIGHTS_PER_ROOM,
};
