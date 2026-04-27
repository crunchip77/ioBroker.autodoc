const { hasFamilyDiagnosisSnapshot } = require('./diagnosisSnapshot');

/**
 * Guest / family "Help & emergencies" chapter — content presence (Phase 5.x.1 hybrid block).
 *
 * @param {object} [manualContext] From document model `manualContext` (includes optional `troubleshootPublicLinks`).
 * @param {object} [docModel] When set, includes optional diagnosis snapshot checklists (concrete scan findings only).
 * @returns {boolean} True if User/Onboarding guest-help chapter should render and appear in nav.
 */
function guestHelpChapterHasContent(manualContext, docModel) {
	const mc = manualContext;
	if (docModel && hasFamilyDiagnosisSnapshot(docModel)) {
		return true;
	}
	if (!mc) {
		return false;
	}
	const t = v => v && String(v).trim();
	if (t(mc.guestHelpNote)) {
		return true;
	}
	if (
		t(mc.troubleshootWifiHint) ||
		t(mc.troubleshootPowerHint) ||
		t(mc.troubleshootWaterHint) ||
		t(mc.troubleshootExtraHint)
	) {
		return true;
	}
	const pl = mc.troubleshootPublicLinks;
	if (pl && (t(pl.user) || t(pl.onboarding))) {
		return true;
	}
	return false;
}

module.exports = { guestHelpChapterHasContent };
