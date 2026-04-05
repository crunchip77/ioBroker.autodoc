'use strict';

/**
 * Maps ioBroker state roles to normalized device categories with icons.
 * ioBroker roles are inconsistent across adapters — this normalizes them.
 */

const ROLE_MAP = [
	// Licht
	{ pattern: /^switch\.light/, category: 'light', icon: '💡' },
	{ pattern: /^level\.dimmer/, category: 'dimmer', icon: '💡' },
	{ pattern: /^level\.color/, category: 'light', icon: '💡' },
	{ pattern: /^light\./, category: 'light', icon: '💡' },
	// Rolllade / Jalousie
	{ pattern: /^level\.blind/, category: 'blind', icon: '🪟' },
	{ pattern: /^blind\./, category: 'blind', icon: '🪟' },
	{ pattern: /^action\.stop/, category: 'blind', icon: '🪟' },
	// Thermostat / Temperatur
	{ pattern: /^level\.temperature/, category: 'thermostat', icon: '🌡️' },
	{ pattern: /^value\.temperature/, category: 'thermostat', icon: '🌡️' },
	{ pattern: /^thermostat\./, category: 'thermostat', icon: '🌡️' },
	// Feuchtigkeit
	{ pattern: /^value\.humidity/, category: 'humidity', icon: '💧' },
	// Bewegung
	{ pattern: /^sensor\.motion/, category: 'motion', icon: '🚶' },
	// Tür / Fenster
	{ pattern: /^sensor\.door/, category: 'door', icon: '🚪' },
	{ pattern: /^sensor\.window/, category: 'window', icon: '🪟' },
	{ pattern: /^sensor\.contact/, category: 'door', icon: '🚪' },
	// Alarm
	{ pattern: /^alarm/, category: 'alarm', icon: '🚨' },
	{ pattern: /^sensor\.alarm/, category: 'alarm', icon: '🚨' },
	// Schloss
	{ pattern: /^switch\.lock/, category: 'lock', icon: '🔒' },
	{ pattern: /^lock\./, category: 'lock', icon: '🔒' },
	// Steckdose / Schalter
	{ pattern: /^switch$/, category: 'switch', icon: '🔌' },
	{ pattern: /^switch\./, category: 'switch', icon: '🔌' },
	// Medien
	{ pattern: /^media\./, category: 'media', icon: '🎵' },
	{ pattern: /^button\.play/, category: 'media', icon: '🎵' },
	// Kamera
	{ pattern: /^camera\./, category: 'camera', icon: '📷' },
	// Strom / Energie
	{ pattern: /^value\.power/, category: 'power', icon: '⚡' },
	{ pattern: /^value\.current/, category: 'power', icon: '⚡' },
	{ pattern: /^value\.voltage/, category: 'power', icon: '⚡' },
];

const CATEGORY_LABEL_KEYS = {
	light: 'catLight',
	dimmer: 'catDimmer',
	blind: 'catBlind',
	thermostat: 'catThermostat',
	humidity: 'catHumidity',
	motion: 'catMotion',
	door: 'catDoor',
	window: 'catWindow',
	alarm: 'catAlarm',
	lock: 'catLock',
	switch: 'catSwitch',
	media: 'catMedia',
	camera: 'catCamera',
	power: 'catPower',
	other: 'catOther',
};

/**
 * Map an ioBroker role string to a normalized category descriptor.
 *
 * @param {string} role ioBroker role string (e.g. "level.temperature")
 * @returns {{ category: string, icon: string, labelKey: string }}
 */
function mapRole(role) {
	if (!role) {
		return { category: 'other', icon: '📦', labelKey: CATEGORY_LABEL_KEYS.other };
	}
	for (const entry of ROLE_MAP) {
		if (entry.pattern.test(role)) {
			return {
				category: entry.category,
				icon: entry.icon,
				labelKey: CATEGORY_LABEL_KEYS[entry.category] || CATEGORY_LABEL_KEYS.other,
			};
		}
	}
	return { category: 'other', icon: '📦', labelKey: CATEGORY_LABEL_KEYS.other };
}

module.exports = { mapRole, CATEGORY_LABEL_KEYS };
