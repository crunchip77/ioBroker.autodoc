/**
 * Phase 5.x.2 — structured Quick Start + room guide picks from discovery (no invented facts).
 */

const MAX_SYSTEM_ITEMS = 5;
const MAX_ROOMS = 8;
const HIGHLIGHTS_PER_ROOM = 3;
const MAX_SCRIPT_SNIPPET = 120;

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

module.exports = { buildQuickStartGuide, MAX_ROOMS, HIGHLIGHTS_PER_ROOM, MAX_SYSTEM_ITEMS };
