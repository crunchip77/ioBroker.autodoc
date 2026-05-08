const { hasFamilyDiagnosisSnapshot } = require('./diagnosisSnapshot');

const PROFILE_USER = 'user';
const PROFILE_ONBOARDING = 'onboarding';

/**
 * Whether any “public bookmark” line would appear in the **Help & emergencies** block for this export profile.
 * (Same rules as {@link HtmlRenderer#_renderTroubleshootPublicLinksHtml}: no self-link; guest page has no family link.)
 *
 * @param {object|null|undefined} pl `manualContext.troubleshootPublicLinks`
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
 * Whether the User-profile HTML «manual information» chapter renders body content (mirrors nav visibility and
 * {@link HtmlRenderer#renderUserChapterBodyKey} for `manual` / `mermaid`).
 *
 * @param {object|null|undefined} docModel Document model (`manualContext`, `userHiddenChapters`, etc.)
 * @returns {boolean} true if the User-profile «manual information» chapter would render non-empty body HTML
 */
function userManualHtmlChapterWillRender(docModel) {
	const dm = docModel;
	if (!dm || !dm.manualContext) {
		return false;
	}
	const mc = dm.manualContext;
	const trim = v => v && String(v).trim();
	const hidden = key => Array.isArray(dm.userHiddenChapters) && dm.userHiddenChapters.includes(key);
	const hasCore = !hidden('manual') && !!(trim(mc.description) || trim(mc.contact) || trim(mc.notes));
	const hasMermaid = !hidden('mermaid') && mc.mermaidDiagram && String(mc.mermaidDiagram).trim();
	const hasMermaidAuto =
		!hidden('mermaidAuto') && mc.autoHostTopologyMermaid && String(mc.autoHostTopologyMermaid).trim();
	return !!(hasCore || hasMermaid || hasMermaidAuto);
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
		if (exportProfile === PROFILE_USER && docModel && userManualHtmlChapterWillRender(docModel)) {
			// User HTML: public bookmark list is rendered under «Manuelle Informationen» instead of this chapter.
		} else {
			return true;
		}
	}
	return false;
}

module.exports = {
	guestHelpChapterHasContent,
	publicLinksRelevantForProfile,
	userManualHtmlChapterWillRender,
};
