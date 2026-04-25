/**
 * Format host OS info from ioBroker `system.host` / discovery (host.native.os).
 * @param {{ osType?: string, osRelease?: string, osArch?: string }} host
 * @returns {string} Human-readable one-liner, or empty string if unknown
 */
function formatOperatingSystemLine(host) {
	if (!host || typeof host !== 'object') {
		return '';
	}
	const parts = [host.osType, host.osRelease, host.osArch]
		.map(p => (p == null ? '' : String(p).trim()))
		.filter(Boolean);
	return parts.length ? parts.join(' — ') : '';
}

module.exports = {
	formatOperatingSystemLine,
};
