/**
 * Optional named CSS variable packs for Admin/User/Onboarding HTML (no user-written CSS).
 * Applied as classes on the root <html> element: `autodoc-preset-{id}`.
 */

/**
 * @param {string} presetId From {@link import('./docTemplateConfig').parseHtmlThemePreset}
 * @returns {string} Additional class on `<html>` (leading space) or empty for default
 */
function themePresetHtmlClass(presetId) {
	if (!presetId || presetId === 'default') {
		return '';
	}
	if (presetId === 'highContrast' || presetId === 'warm' || presetId === 'slate') {
		return ` autodoc-preset-${presetId}`;
	}
	return '';
}

/**
 * Extra rules appended after the base :root / body.dark block (only theme variables).
 * Kept compact: overrides --* tokens used in htmlRenderer's inline stylesheet.
 *
 * @returns {string} CSS (no <style> wrapper)
 */
function getThemePresetStyleBlock() {
	/* highContrast — higher edge contrast, readable links */
	/* warm — light sepia; dark brown nav */
	/* slate — cool gray-blue; calm nav */
	return `
  html.autodoc-preset-highContrast {
    --bg: #e2e2e2; --surface: #fff; --border: #1f1f1f; --text: #0a0a0a; --text-muted: #333; --text-faint: #4a4a4a;
    --link: #003b8e; --nav-bg: #0c0c14; --nav-text: #f0f0f0; --nav-hover: rgba(255,255,255,0.14);
    --th-bg: #dedede; --row-hover: #ececec; --score-bar-bg: #c8c8c8;
    --note-bg: #fff3cd; --note-border: #c9a000; --manual-bg: #fff8e6; --manual-border: #b8860b;
    --ai-bg: #e6f0ff; --ai-border: #3d6bb8; --device-bg: #fff; --adapter-bg: #fff; --stat-bg: #fff; --meta-bg: #fff; --changelog-bg: #f0f0f0;
  }
  html.autodoc-preset-highContrast body.dark {
    --bg: #0a0a0a; --surface: #141414; --border: #666; --text: #f5f5f5; --text-muted: #c8c8c8; --text-faint: #9a9a9a;
    --link: #8cc4ff; --nav-bg: #050508; --nav-text: #e0e0e0; --nav-hover: rgba(255,255,255,0.1);
    --th-bg: #222; --row-hover: #1c1c1c; --score-bar-bg: #333;
    --note-bg: #2a2000; --note-border: #a07800; --manual-bg: #2a2000; --manual-border: #a07800;
    --ai-bg: #101d32; --ai-border: #3d6a9c; --device-bg: #141414; --adapter-bg: #141414; --stat-bg: #141414; --meta-bg: #141414; --changelog-bg: #121212;
  }
  html.autodoc-preset-warm {
    --bg: #efe8de; --surface: #faf6f0; --border: #c4b8a8; --text: #2a2218; --text-muted: #4a3f32; --text-faint: #6b5d4a;
    --link: #8b4513; --nav-bg: #2d2418; --nav-text: #e8ddd0; --nav-hover: rgba(255,255,255,0.1);
    --th-bg: #e2d9cc; --row-hover: #e8e0d4; --score-bar-bg: #d4c8b8;
    --note-bg: #fff4e0; --note-border: #c4a000; --manual-bg: #fff0d8; --manual-border: #b8860b;
    --ai-bg: #f2ecff; --ai-border: #9a7bc0; --device-bg: #faf6f0; --adapter-bg: #faf6f0; --stat-bg: #faf6f0; --meta-bg: #faf6f0; --changelog-bg: #f0ebe4;
  }
  html.autodoc-preset-warm body.dark {
    --bg: #1a1510; --surface: #242018; --border: #4a3f32; --text: #e8ddd0; --text-muted: #b0a090; --text-faint: #7a6a58;
    --link: #e6b86a; --nav-bg: #120e0a; --nav-text: #d4c4b0; --nav-hover: rgba(255,255,255,0.08);
    --th-bg: #2a2418; --row-hover: #201c14; --score-bar-bg: #3a3228;
    --note-bg: #2a2000; --note-border: #a07800; --manual-bg: #2a2000; --manual-border: #a07800;
    --ai-bg: #1c1820; --ai-border: #5c4a70; --device-bg: #242018; --adapter-bg: #242018; --stat-bg: #242018; --meta-bg: #242018; --changelog-bg: #1c1814;
  }
  html.autodoc-preset-slate {
    --bg: #e4e7ec; --surface: #f1f3f6; --border: #9aa3b0; --text: #1a1f2a; --text-muted: #3d4859; --text-faint: #5c6880;
    --link: #0b5bb5; --nav-bg: #1a2330; --nav-text: #d4dce6; --nav-hover: rgba(255,255,255,0.1);
    --th-bg: #d8dee8; --row-hover: #e8ebf0; --score-bar-bg: #cbd2dc;
    --note-bg: #e8f0ff; --note-border: #4a6fa0; --manual-bg: #e8f0ff; --manual-border: #4a6fa0;
    --ai-bg: #e4eef8; --ai-border: #5a7ca8; --device-bg: #f1f3f6; --adapter-bg: #f1f3f6; --stat-bg: #f1f3f6; --meta-bg: #f1f3f6; --changelog-bg: #e6eaf0;
  }
  html.autodoc-preset-slate body.dark {
    --bg: #0f1117; --surface: #1a1f2a; --border: #3a4556; --text: #e0e6ef; --text-muted: #9aa8bc; --text-faint: #6a7690;
    --link: #6ab0ff; --nav-bg: #0d1018; --nav-text: #b8c4d4; --nav-hover: rgba(255,255,255,0.08);
    --th-bg: #242b38; --row-hover: #1c2230; --score-bar-bg: #2a3344;
    --note-bg: #1a2030; --note-border: #3d5a8a; --manual-bg: #1a2030; --manual-border: #3d5a8a;
    --ai-bg: #121a28; --ai-border: #2d4a70; --device-bg: #1a1f2a; --adapter-bg: #1a1f2a; --stat-bg: #1a1f2a; --meta-bg: #1a1f2a; --changelog-bg: #141a24;
  }
`;
}

module.exports = {
	themePresetHtmlClass,
	getThemePresetStyleBlock,
};
