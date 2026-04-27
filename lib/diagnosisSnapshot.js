/**
 * Data-driven "snapshot" signals for family-facing troubleshooting (Phase 5.x.1).
 * Mirrors the Admin diagnosis node check — keep logic in one place.
 */

/**
 * @param {string} [nodeVersion] e.g. v22.4.0
 * @returns {boolean} True if Admin diagnosis would flag Node (non-LTS or &lt; 20)
 */
function isNodeVersionFlaggedForDiagnosis(nodeVersion) {
	if (!nodeVersion) {
		return false;
	}
	const match = String(nodeVersion).match(/v?(\d+)/);
	const major = match ? parseInt(match[1], 10) : 0;
	return major > 0 && (major < 20 || major % 2 !== 0);
}

/**
 * @param {object} [docModel]
 * @returns {boolean} True if User/Onboarding should show a concrete auto-checklist (currently: Node only)
 */
function hasFamilyDiagnosisSnapshot(docModel) {
	return isNodeVersionFlaggedForDiagnosis(
		docModel && docModel.system && docModel.system.primaryHost ? docModel.system.primaryHost.nodeVersion : '',
	);
}

module.exports = {
	isNodeVersionFlaggedForDiagnosis,
	hasFamilyDiagnosisSnapshot,
};
