'use strict';

/** State leaf names that are poor stand-alone device labels in room exports. */
const GENERIC_STATE_NAMES = new Set([
	'occupancy',
	'opened',
	'presence',
	'detected',
	'power',
	'onoff',
	'switch_led',
	'turn',
]);

/**
 * Parse adapter instance prefix from an ioBroker object id (`hue.0`, `alias.0`, …).
 *
 * @param {string} objectId Full object id
 * @returns {string} Instance id or empty string
 */
function parseAdapterInstance(objectId) {
	const parts = String(objectId || '').split('.');
	if (parts.length < 2) {
		return '';
	}
	return `${parts[0]}.${parts[1]}`;
}

/**
 * Walk from a member id up to its ancestors (longest id first).
 *
 * @param {string} objectId Room enum member id
 * @returns {string[]} Ancestor ids including the member itself
 */
function ancestorIds(objectId) {
	const parts = String(objectId || '').split('.');
	const out = [];
	for (let len = parts.length; len >= 3; len--) {
		out.push(parts.slice(0, len).join('.'));
	}
	return out;
}

/**
 * Whether a resolved label is too technical to show as the primary device name.
 *
 * @param {string} name Resolved display name
 * @param {string} objectId Object id the name came from
 * @returns {boolean}
 */
function isGenericDeviceName(name, objectId) {
	if (!name || typeof name !== 'string') {
		return true;
	}
	const trimmed = name.trim();
	if (!trimmed) {
		return true;
	}
	const leaf = String(objectId || '')
		.split('.')
		.pop()
		.toLowerCase();
	if (trimmed.toLowerCase() === leaf && GENERIC_STATE_NAMES.has(leaf)) {
		return true;
	}
	if (/^(occupancy|opened|presence|detected|power|onoff)$/i.test(trimmed)) {
		return true;
	}
	if (/^channel\s/i.test(trimmed)) {
		return true;
	}
	if (/\b(POWER|ENERGY)\b/.test(trimmed) && trimmed.includes(' ')) {
		return true;
	}
	return false;
}

const TYPE_RANK = { device: 0, channel: 1, state: 2, meta: 3 };

/**
 * Pick the best object from an ancestor chain for human-readable room device labels.
 *
 * @param {Array<{ id: string, type?: string, name?: string }>} chain Objects from member up to root
 * @returns {{ id: string, type?: string, name?: string, role?: string, unit?: string }|null}
 */
function chooseBestObject(chain) {
	if (!chain || chain.length === 0) {
		return null;
	}
	const sorted = [...chain].sort((a, b) => {
		const ta = TYPE_RANK[a.type] ?? 9;
		const tb = TYPE_RANK[b.type] ?? 9;
		if (ta !== tb) {
			return ta - tb;
		}
		const ga = isGenericDeviceName(a.name, a.id) ? 1 : 0;
		const gb = isGenericDeviceName(b.name, b.id) ? 1 : 0;
		if (ga !== gb) {
			return ga - gb;
		}
		return String(b.name || '').length - String(a.name || '').length;
	});
	return sorted[0] || chain[0];
}

/**
 * Canonical grouping key for deduplicating room members (device/channel level).
 *
 * @param {{ id?: string, type?: string }|null} bestObj Best object from chooseBestObject
 * @param {string} memberId Original enum member id
 * @returns {string}
 */
function resolveCanonicalDeviceKey(bestObj, memberId) {
	if (bestObj && (bestObj.type === 'device' || bestObj.type === 'channel')) {
		return bestObj.id;
	}
	const parts = String(memberId || '').split('.');
	if (parts.length >= 4) {
		return parts.slice(0, -1).join('.');
	}
	return memberId;
}

/**
 * Score a room member when several enum entries refer to the same physical device.
 *
 * @param {string} memberId Enum member id
 * @param {object} device Device map entry
 * @param {object|undefined} live Live state payload for this member
 * @returns {number}
 */
function scoreRoomMember(memberId, device, live) {
	let score = 0;
	if (live !== undefined) {
		score += 100;
	}
	if (device && device.role) {
		score += 10;
	}
	if (device && !isGenericDeviceName(device.deviceName, memberId)) {
		score += 5;
	}
	if (device && device.type === 'device') {
		score += 3;
	} else if (device && device.type === 'channel') {
		score += 2;
	}
	return score;
}

/**
 * Build deduplicated device rows for one room from enum members and discovery maps.
 *
 * @param {string[]} memberIds Room enum member ids
 * @param {object} deviceMap Output of Discovery.resolveRoomDevices()
 * @param {object} liveStates Map memberId → live value payload
 * @param {object} memberFunctions Map memberId → function name[]
 * @returns {Array<object>} Device rows for renderers
 */
function buildRoomDeviceList(memberIds, deviceMap, liveStates, memberFunctions) {
	const groups = new Map();

	for (const memberId of memberIds || []) {
		const device = deviceMap[memberId];
		if (!device) {
			continue;
		}
		const key = device.deviceId || memberId;
		if (!groups.has(key)) {
			groups.set(key, []);
		}
		groups.get(key).push(memberId);
	}

	const devices = [];
	for (const memberIdGroup of groups.values()) {
		let bestMember = memberIdGroup[0];
		let bestScore = -1;
		for (const memberId of memberIdGroup) {
			const device = deviceMap[memberId];
			const live = liveStates[memberId];
			const score = scoreRoomMember(memberId, device, live);
			if (score > bestScore) {
				bestScore = score;
				bestMember = memberId;
			}
		}

		const device = deviceMap[bestMember];
		const live = liveStates[bestMember];
		const fnSet = new Set();
		const mergedFunctions = [];
		for (const memberId of memberIdGroup) {
			for (const fn of memberFunctions[memberId] || []) {
				if (!fnSet.has(fn)) {
					fnSet.add(fn);
					mergedFunctions.push(fn);
				}
			}
		}

		devices.push({
			id: bestMember,
			deviceId: device.deviceId || bestMember,
			deviceName: device.deviceName,
			sourceAdapter: device.sourceAdapter || '',
			adapterName: device.adapterName || '',
			role: device.role || '',
			type: device.type || '',
			unit: device.unit || '',
			currentValue: live !== undefined ? live.val : null,
			functions: mergedFunctions,
		});
	}

	devices.sort((a, b) => String(a.deviceName).localeCompare(String(b.deviceName)));
	return devices;
}

module.exports = {
	parseAdapterInstance,
	ancestorIds,
	isGenericDeviceName,
	chooseBestObject,
	resolveCanonicalDeviceKey,
	buildRoomDeviceList,
};
