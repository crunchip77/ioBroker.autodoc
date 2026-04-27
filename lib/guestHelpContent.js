const { hasFamilyDiagnosisSnapshot } = require('./diagnosisSnapshot');

const PROFILE_USER = 'user';
const PROFILE_ONBOARDING = 'onboarding';

/**
 * Whether any “public bookmark” line would appear in the **Help & emergencies** block for this export profile.
 * (Same rules as {@link HtmlRenderer#_renderTroubleshootPublicLinksHtml}: no self-link; guest page has no family link.)
 *
 * @param {object} [pl] `manualContext.troubleshootPublicLinks`
 * @param {string|null|undefined} exportProfile `user` | `onboarding` | `null` (admin / unspecified)
 * @returns {boolean} true if that profile’s HTML would list at least one bookmark URL
 */
function publicLinksRelevantForProfile(pl, exportProfile) {
	if (!pl) {
		return false;
	}
	const t = v => v && String(v).trim();
	if (exportProfile === PROFILE_ONBOARDING) {
		return false;
	}
	if (exportProfile === PROFILE_USER) {
		return !!t(pl.onboarding);
	}
	return !!(t(pl.user) || t(pl.onboarding) || t(pl.admin));
}

/**
 * Guest / family "Help & emergencies" chapter — content presence (Phase 5.x.1 hybrid block).
 *
 * @param {object} [manualContext] From document model `manualContext` (includes optional `troubleshootPublicLinks`).
 * @param {object} [docModel] When set, includes optional diagnosis snapshot checklists (concrete scan findings only).
 * @param {string|null|undefined} [exportProfile] When set, `troubleshootPublicLinks` is evaluated for that profile only
 *  (onboarding: URLs alone do not keep the chapter if nothing else is filled).
 * @returns {boolean} True if User/Onboarding guest-help chapter should render and appear in nav.
 */
function guestHelpChapterHasContent(manualContext, docModel, exportProfile) {
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
	if (publicLinksRelevantForProfile(mc.troubleshootPublicLinks, exportProfile)) {
		return true;
	}
	return false;
}

module.exports = { guestHelpChapterHasContent };
