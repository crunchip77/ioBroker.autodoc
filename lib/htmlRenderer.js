/**
 * AutoDoc HTML Renderer Module
 * Renders document models to standalone HTML with navigation
 */
const PROFILE_ADMIN = 'admin';
const PROFILE_USER = 'user';
const PROFILE_ONBOARDING = 'onboarding';

/**
 * Escape special HTML characters to prevent XSS / broken markup.
 *
 * @param {*} value Value to escape
 * @returns {string} Escaped string
 */
function esc(value) {
	return String(value == null ? '' : value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * HtmlRenderer renders the document model to a standalone HTML file.
 *
 * @param {object} adapter ioBroker adapter instance
 * @param {object} i18n i18n instance for translations
 */
class HtmlRenderer {
	/**
	 * @param {object} adapter ioBroker adapter instance
	 * @param {object} i18n i18n instance for translations
	 */
	constructor(adapter, i18n) {
		this.adapter = adapter;
		this.i18n = i18n;
	}

	/**
	 * Check if profile includes detail level.
	 *
	 * @param {string} profile Current profile
	 * @param {string} detailLevel Detail level (admin, user, basic)
	 * @returns {boolean} True if detail should be shown
	 */
	shouldShowDetail(profile, detailLevel) {
		const levels = {
			[PROFILE_ADMIN]: ['admin', 'user', 'basic'],
			[PROFILE_USER]: ['user', 'basic'],
			[PROFILE_ONBOARDING]: ['basic'],
		};
		return (levels[profile] || levels[PROFILE_ADMIN]).includes(detailLevel);
	}

	/**
	 * Render complete document model to standalone HTML.
	 * Dispatches to profile-specific render methods.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML content
	 */
	renderHtml(docModel) {
		const profile = this.adapter.config.profile || PROFILE_ADMIN;
		if (profile === PROFILE_ONBOARDING) {
			return this.renderOnboardingHtml(docModel);
		}
		if (profile === PROFILE_USER) {
			return this.renderUserHtml(docModel);
		}
		return this.renderAdminHtml(docModel);
	}

	/**
	 * Render all three profiles and return them as an object.
	 * This is the recommended method — always generates all profiles simultaneously.
	 *
	 * @param {object} docModel Document model
	 * @returns {{admin: string, user: string, onboarding: string}} HTML for all profiles
	 */
	renderAllHtml(docModel) {
		return {
			admin: this.renderAdminHtml(docModel),
			user: this.renderUserHtml(docModel),
			onboarding: this.renderOnboardingHtml(docModel),
		};
	}

	/**
	 * Render Admin profile — full technical detail.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML content
	 */
	renderAdminHtml(docModel) {
		const config = this.adapter.config;
		const title = esc(this.i18n.t('projectDocumentation', config.projectName || 'ioBroker System'));
		const nav = this.renderNav(PROFILE_ADMIN);
		let body = '';

		body += this.renderHeader(docModel, PROFILE_ADMIN);
		body += this.renderSystemChapter(docModel, PROFILE_ADMIN);
		body += this.renderAdaptersChapter(docModel, PROFILE_ADMIN);
		body += this.renderRoomsChapter(docModel, PROFILE_ADMIN);
		body += this.renderScriptsChapter(docModel, PROFILE_ADMIN);
		if (docModel.userData && docModel.userData.length > 0) {
			body += this.renderUserDataChapter(docModel.userData);
		}
		body += this.renderMaintenanceChapter(docModel);
		if (docModel.manualContext && (docModel.manualContext.description || docModel.manualContext.contact || docModel.manualContext.notes)) {
			body += this.renderManualContext(docModel.manualContext);
		}
		body += this.renderDiagnosis(docModel);
		body += this.renderTroubleshooting(docModel);
		if (docModel.changelog && docModel.changelog.length > 0) {
			body += this.renderChangelogChapter(docModel.changelog);
		}
		body += this.renderAppendices(docModel);

		return this.wrapPage(title, nav, body);
	}

	/**
	 * Render User/Familie profile — plain language, device names, no OIDs.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML content
	 */
	renderUserHtml(docModel) {
		const config = this.adapter.config;
		const title = esc(this.i18n.t('projectDocumentation', config.projectName || 'ioBroker System'));
		const nav = this.renderNav(PROFILE_USER);
		let body = '';

		body += this.renderHeader(docModel, PROFILE_USER);
		if (docModel.ai) {
			body += this.renderAiSection(docModel.ai);
		}
		body += this.renderUserRoomsChapter(docModel);
		body += this.renderUserScriptsChapter(docModel);
		body += this.renderUserAdaptersChapter(docModel);
		if (docModel.manualContext && (docModel.manualContext.description || docModel.manualContext.contact || docModel.manualContext.notes)) {
			body += this.renderManualContext(docModel.manualContext);
		}

		return this.wrapPage(title, nav, body);
	}

	/**
	 * Render Onboarding profile — "Du"-Ansprache, no tech jargon.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML content
	 */
	renderOnboardingHtml(docModel) {
		const config = this.adapter.config;
		const title = esc(this.i18n.t('projectDocumentation', config.projectName || 'ioBroker System'));
		const nav = this.renderNav(PROFILE_ONBOARDING);
		let body = '';

		// 1. Welcome (includes description + contact + stats + QR)
		body += this.renderOnboardingWelcome(docModel);

		// 2. Tips & Notes — directly after welcome so guests see them first
		if (docModel.manualContext && docModel.manualContext.notes) {
			body += this.renderOnboardingNotes(docModel.manualContext.notes);
		}

		// 3. AI summary (if available)
		if (docModel.ai) {
			body += this.renderAiSection(docModel.ai);
		}

		// 4. Rooms + function overview
		body += this.renderOnboardingRooms(docModel);

		// 5. What runs automatically
		body += this.renderOnboardingAutomations(docModel);

		// 6. Connected systems — collapsible at the end, guests rarely need this
		body += this.renderOnboardingAdapters(docModel);

		body += this.renderOnboardingHint(docModel, config);

		return this.wrapPage(title, nav, body);
	}

	/**
	 * Wrap body content in a full HTML page with inline CSS.
	 *
	 * @param {string} title Page title
	 * @param {string} nav Navigation HTML
	 * @param {string} body Main content HTML
	 * @returns {string} Complete HTML page
	 */
	wrapPage(title, nav, body) {
		return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  :root { --bg: #f5f5f5; --surface: #fff; --border: #e0e0e0; --text: #222; --text-muted: #555; --text-faint: #888; --link: #0066cc; --nav-bg: #1a1a2e; --nav-text: #ccc; --nav-hover: rgba(255,255,255,0.1); --th-bg: #f0f0f0; --row-hover: #fafafa; --score-bar-bg: #e0e0e0; --note-bg: #fff8e1; --note-border: #ffc107; --manual-bg: #fff8e1; --manual-border: #f0b429; --ai-bg: #f0f7ff; --ai-border: #b3d1f5; --device-bg: #fff; --adapter-bg: #fff; --stat-bg: #fff; --meta-bg: #fff; --changelog-bg: #f8f9fa; }
  body.dark { --bg: #0f1117; --surface: #1e2130; --border: #2d3148; --text: #e0e0e0; --text-muted: #aaa; --text-faint: #666; --link: #5b9cf6; --nav-bg: #0d0f1a; --nav-text: #aaa; --nav-hover: rgba(255,255,255,0.08); --th-bg: #262a3f; --row-hover: #242840; --score-bar-bg: #2d3148; --note-bg: #2a2410; --note-border: #a07800; --manual-bg: #2a2410; --manual-border: #a07800; --ai-bg: #101d30; --ai-border: #2a4a70; --device-bg: #1e2130; --adapter-bg: #1e2130; --stat-bg: #1e2130; --meta-bg: #1e2130; --changelog-bg: #1a1d2e; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; font-size: 15px; line-height: 1.6; color: var(--text); background: var(--bg); }
  a { color: var(--link); text-decoration: none; }
  a:hover { text-decoration: underline; }
  #layout { display: flex; min-height: 100vh; }
  nav { width: 240px; flex-shrink: 0; background: var(--nav-bg); color: var(--nav-text); padding: 24px 16px; position: sticky; top: 0; height: 100vh; overflow-y: auto; display: flex; flex-direction: column; }
  nav h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-faint); margin-bottom: 12px; margin-top: 20px; }
  nav h2:first-child { margin-top: 0; }
  nav ul { list-style: none; }
  nav ul li a { display: block; padding: 5px 8px; border-radius: 4px; color: var(--nav-text); font-size: 14px; }
  nav ul li a:hover { background: var(--nav-hover); color: #fff; text-decoration: none; }
  main { flex: 1; padding: 32px 40px; max-width: 900px; }
  h1 { font-size: 26px; margin-bottom: 8px; color: var(--text); }
  h2 { font-size: 20px; margin-top: 40px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid var(--border); color: var(--text); }
  h3 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; color: var(--text); }
  h4 { font-size: 14px; margin-top: 16px; margin-bottom: 6px; color: var(--text-muted); }
  .meta { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 14px 18px; margin: 16px 0 24px; display: grid; grid-template-columns: auto 1fr; gap: 4px 16px; font-size: 14px; }
  .meta dt { font-weight: 600; color: var(--text-muted); }
  .meta dd { color: var(--text); }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 14px; background: var(--surface); border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  th { background: var(--th-bg); text-align: left; padding: 8px 12px; font-weight: 600; color: var(--text-muted); }
  td { padding: 7px 12px; border-top: 1px solid var(--border); }
  tr:hover td { background: var(--row-hover); }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; }
  .badge-ok { background: #d4edda; color: #155724; }
  .badge-off { background: #f8d7da; color: #721c24; }
  .badge-meta { background: #e8f0fe; color: #1a56db; font-weight: 500; }
  .adapter-meta { display: inline-flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
  .manual-context-box { background: var(--manual-bg); border-left: 3px solid var(--manual-border); padding: 6px 10px; margin-top: 8px; border-radius: 3px; font-size: 13px; color: var(--text-muted); }
  .manual-context-note { display: block; background: var(--manual-bg); border-left: 3px solid var(--manual-border); padding: 4px 8px; margin-top: 4px; border-radius: 3px; font-size: 12px; color: var(--text-muted); }
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin: 16px 0; }
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 14px 16px; }
  .stat-card .num { font-size: 28px; font-weight: 700; color: var(--link); }
  .stat-card .label { font-size: 12px; color: var(--text-faint); margin-top: 2px; }
  .section-divider { border: none; border-top: 1px solid var(--border); margin: 32px 0; }
  ul.content-list { padding-left: 20px; margin: 8px 0; }
  ul.content-list li { margin: 4px 0; }
  .note-box { background: var(--note-bg); border-left: 4px solid var(--note-border); padding: 12px 16px; border-radius: 0 6px 6px 0; margin: 12px 0; font-size: 14px; }
  .adapter-list { display: flex; flex-direction: column; gap: 12px; margin: 16px 0; }
  .adapter-card { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 14px 18px; }
  .adapter-card-inactive { opacity: 0.6; }
  .adapter-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .adapter-desc { margin: 4px 0 6px; color: var(--text-muted); font-size: 14px; }
  .adapter-status-note { color: var(--text-faint); font-size: 12px; }
  footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid var(--border); font-size: 12px; color: var(--text-faint); }
  .score-bar { background: var(--score-bar-bg); border-radius: 8px; height: 12px; margin: 8px 0 16px; overflow: hidden; }
  .score-bar-fill { height: 100%; border-radius: 8px; background: #28a745; transition: width 0.3s; }
  .checklist { list-style: none; padding: 0; margin: 0 0 16px; }
  .checklist li { padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 14px; display: flex; align-items: center; gap: 8px; }
  .checklist li:last-child { border-bottom: none; }
  #dark-toggle { background: none; border: 1px solid var(--border); border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 14px; color: var(--nav-text); width: 100%; text-align: left; margin-top: 8px; transition: background 0.2s; }
  #dark-toggle:hover { background: var(--nav-hover); }
  .nav-footer { margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); }
  .stale-warning { background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-size: 13px; color: #856404; display: flex; align-items: center; gap: 8px; }
  body.dark .stale-warning { background: #2a2000; border-color: #a07800; color: #ffc107; }
  .health-badge { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-left: 8px; vertical-align: middle; }
  .health-ok { background: #d4edda; color: #155724; }
  .health-warn { background: #fff3cd; color: #856404; }
  body.dark .health-ok { background: #0d2a14; color: #4caf50; }
  body.dark .health-warn { background: #2a2000; color: #ffc107; }
  .search-wrap { margin-bottom: 20px; }
  .search-wrap input { width: 100%; padding: 7px 10px; border-radius: 4px; border: none; background: rgba(255,255,255,0.12); color: #fff; font-size: 13px; outline: none; }
  .search-wrap input::placeholder { color: #888; }
  .search-wrap input:focus { background: rgba(255,255,255,0.2); }
  .search-nav { display: flex; align-items: center; gap: 4px; margin-top: 4px; }
  .search-nav button { background: rgba(255,255,255,0.1); border: none; color: #ccc; border-radius: 3px; padding: 2px 6px; cursor: pointer; font-size: 13px; line-height: 1.4; }
  .search-nav button:hover { background: rgba(255,255,255,0.2); }
  .search-count { font-size: 11px; color: #888; flex: 1; }
  mark.hl { background: #ffe066; color: #000; border-radius: 2px; padding: 0 1px; }
  mark.hl.hl-active { background: #ff9900; outline: 2px solid #e67300; }
  @media print {
    nav, .search-wrap, .script-filter-bar, .adapter-filter-bar, .adapter-filter-hint, .script-filter-hint { display: none !important; }
    #layout { display: block !important; }
    main { max-width: 100% !important; padding: 16px !important; }
    h2 { break-before: page; margin-top: 0 !important; }
    details { display: block !important; }
    details > summary { display: none !important; }
    .badge { border: 1px solid #999; }
    .score-bar { border: 1px solid #ccc; }
    .section-divider { display: none !important; }
    a { color: #000 !important; }
    table { box-shadow: none !important; border: 1px solid #ccc; }
    .stat-card, .adapter-card, .device-card { border: 1px solid #ccc !important; box-shadow: none !important; }
  }
  .filter-hidden { display: none !important; }
  .no-results { display: none; padding: 8px 0; color: #888; font-size: 13px; font-style: italic; }
  .ai-box { background: var(--ai-bg); border: 1px solid var(--ai-border); border-radius: 8px; padding: 18px 22px; margin: 0 0 28px; }
  .ai-box-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #0066cc; margin-bottom: 8px; }
  .ai-narrative { font-size: 15px; color: #222; line-height: 1.7; margin-bottom: 12px; }
  .ai-recommendations { font-size: 14px; color: #333; line-height: 1.6; white-space: pre-line; }
  .ai-recommendations ul, .ai-recommendations-list { padding-left: 18px; margin: 4px 0; }
  .ai-recommendations-list li { margin: 3px 0; }
  .device-grid { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0 16px; }
  .device-card { display: flex; align-items: center; gap: 6px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; font-size: 14px; }
  .device-icon { font-size: 18px; line-height: 1; }
  .device-name { color: var(--text); }
  .adapter-filter-bar { display: flex; align-items: center; gap: 10px; margin: 8px 0 12px; }
  .adapter-filter-bar input { padding: 5px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; width: 260px; }
  .adapter-filter-bar input:focus { outline: none; border-color: #0066cc; }
  #adapter-filter-count { font-size: 12px; color: #888; }
  .adapter-filter-hint { font-size: 12px; color: #aaa; }
  .adapter-disabled-summary { cursor: pointer; font-size: 14px; color: #666; padding: 6px 0; user-select: none; }
  .adapter-disabled-summary:hover { color: #333; }
  .script-filter-bar { display: flex; align-items: center; gap: 10px; margin: 8px 0 12px; }
  .script-filter-bar input { padding: 5px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; width: 260px; }
  .script-filter-bar input:focus { outline: none; border-color: #0066cc; }
  #script-filter-count { font-size: 12px; color: #888; }
  .script-filter-hint { font-size: 12px; color: #aaa; }
  .script-disabled-summary { cursor: pointer; font-size: 14px; color: #666; padding: 6px 0; user-select: none; }
  .script-disabled-summary:hover { color: #333; }
  .maint-details-summary { cursor: pointer; font-size: 15px; font-weight: 600; color: #333; padding: 4px 0; user-select: none; list-style: none; }
  .maint-details-summary::-webkit-details-marker { display: none; }
  .maint-details-summary::before { content: '▶ '; font-size: 11px; color: #888; }
  details[open] > .maint-details-summary::before { content: '▼ '; }
  .maint-details-summary:hover { color: #0066cc; }
</style>
</head>
<body>
<div id="layout">
<nav>
<div class="search-wrap">
  <input type="search" id="doc-search" placeholder="${esc(this.i18n.t('searchPlaceholder'))}" autocomplete="off" aria-label="Search documentation">
  <div class="search-nav">
    <button onclick="docSearchPrev()" title="Previous match">&#8593;</button>
    <button onclick="docSearchNext()" title="Next match">&#8595;</button>
    <span class="search-count" id="search-count"></span>
  </div>
</div>
${nav}
<div class="nav-footer">
  <button id="dark-toggle" onclick="toggleDark()">🌙 ${esc(this.i18n.t('darkMode') || 'Dark Mode')}</button>
</div>
</nav>
<main>
${body}
</main>
</div>
<script>
// ── Full-text search with highlight + prev/next navigation ──────────────────
(function () {
  var searchInput = document.getElementById('doc-search');
  var searchCount = document.getElementById('search-count');
  if (!searchInput) return;

  var highlights = [];
  var current = -1;

  function escRe(s) { return s.replace(/[.*+?^$\{}()|[\]\\]/g, '\\$&'); }

  function clearHL() {
    document.querySelectorAll('mark.hl').forEach(function (m) {
      var txt = document.createTextNode(m.textContent);
      m.parentNode.replaceChild(txt, m);
    });
    var main = document.querySelector('main');
    if (main) main.normalize();
    highlights = [];
    current = -1;
  }

  function doHL(term) {
    var main = document.querySelector('main');
    if (!main) return;
    var re = new RegExp(escRe(term), 'gi');
    var SKIP = { SCRIPT:1, STYLE:1, INPUT:1, TEXTAREA:1, MARK:1 };

    var walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, null, false);
    var textNodes = [];
    var node;
    while ((node = walker.nextNode())) {
      var el = node.parentElement;
      if (!el || SKIP[el.tagName]) continue;
      if (el.closest && el.closest('mark.hl')) continue;
      re.lastIndex = 0;
      if (re.test(node.textContent)) textNodes.push(node);
    }

    textNodes.forEach(function (textNode) {
      var text = textNode.textContent;
      var parts = [];
      var lastIdx = 0;
      var m;
      re.lastIndex = 0;
      while ((m = re.exec(text)) !== null) {
        if (m.index > lastIdx) parts.push(document.createTextNode(text.slice(lastIdx, m.index)));
        var mark = document.createElement('mark');
        mark.className = 'hl';
        mark.textContent = m[0];
        parts.push(mark);
        lastIdx = m.index + m[0].length;
      }
      if (lastIdx < text.length) parts.push(document.createTextNode(text.slice(lastIdx)));
      if (parts.length > 0) {
        var frag = document.createDocumentFragment();
        parts.forEach(function (p) { frag.appendChild(p); });
        textNode.parentNode.replaceChild(frag, textNode);
        parts.forEach(function (p) { if (p.nodeName === 'MARK') highlights.push(p); });
      }
    });
  }

  function goTo(idx) {
    if (highlights.length === 0) return;
    highlights.forEach(function (m) { m.classList.remove('hl-active'); });
    current = ((idx % highlights.length) + highlights.length) % highlights.length;
    highlights[current].classList.add('hl-active');
    highlights[current].scrollIntoView({ behavior: 'smooth', block: 'center' });
    searchCount.textContent = (current + 1) + ' / ' + highlights.length;
  }

  var timer;
  searchInput.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      clearHL();
      var term = searchInput.value.trim();
      if (term.length >= 2) {
        doHL(term);
        if (highlights.length > 0) { goTo(0); }
        else { searchCount.textContent = '0'; }
      } else {
        searchCount.textContent = '';
      }
    }, 220);
  });

  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { searchInput.value = ''; clearHL(); searchCount.textContent = ''; }
    if (e.key === 'Enter' && highlights.length > 0) { goTo(current + (e.shiftKey ? -1 : 1)); e.preventDefault(); }
  });

  window.docSearchNext = function () { goTo(current + 1); };
  window.docSearchPrev = function () { goTo(current - 1); };
})();

// Adapter-section local filter
(function () {
  var filterInput = document.getElementById('adapter-filter');
  if (!filterInput) return;
  var countEl = document.getElementById('adapter-filter-count');
  var disabledGroup = document.getElementById('adapter-disabled-group');

  function applyAdapterFilter() {
    var term = filterInput.value.trim().toLowerCase();
    var enabledRows = Array.from(document.querySelectorAll('#adapter-enabled-body tr'));
    var disabledRows = Array.from(document.querySelectorAll('#adapter-disabled-body tr'));
    var allRows = enabledRows.concat(disabledRows);

    if (!term) {
      allRows.forEach(function (r) { r.classList.remove('filter-hidden'); });
      if (countEl) countEl.textContent = '';
      var en = document.getElementById('adapter-enabled-noresults');
      var dn = document.getElementById('adapter-disabled-noresults');
      if (en) en.style.display = 'none';
      if (dn) dn.style.display = 'none';
      return;
    }

    var visible = 0;
    var disabledHasMatch = false;
    allRows.forEach(function (r) {
      var match = r.textContent.toLowerCase().indexOf(term) !== -1;
      r.classList.toggle('filter-hidden', !match);
      if (match) {
        visible++;
        if (disabledRows.indexOf(r) !== -1) disabledHasMatch = true;
      }
    });

    // auto-open disabled group when a match is found inside it
    if (disabledGroup && disabledHasMatch) disabledGroup.open = true;

    if (countEl) countEl.textContent = visible + ' / ' + allRows.length;

    var enabledVisible = enabledRows.filter(function (r) { return !r.classList.contains('filter-hidden'); }).length;
    var disabledVisible = disabledRows.filter(function (r) { return !r.classList.contains('filter-hidden'); }).length;
    var en = document.getElementById('adapter-enabled-noresults');
    var dn = document.getElementById('adapter-disabled-noresults');
    if (en) en.style.display = enabledVisible === 0 ? 'block' : 'none';
    if (dn) dn.style.display = disabledVisible === 0 ? 'block' : 'none';
  }

  filterInput.addEventListener('input', applyAdapterFilter);
  filterInput.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { filterInput.value = ''; applyAdapterFilter(); }
  });
})();

// Script-section local filter
(function () {
  var filterInput = document.getElementById('script-filter');
  if (!filterInput) return;
  var countEl = document.getElementById('script-filter-count');
  var disabledGroup = document.getElementById('script-disabled-group');

  function applyScriptFilter() {
    var term = filterInput.value.trim().toLowerCase();
    var activeRows = Array.from(document.querySelectorAll('#script-active-body tr'));
    var inactiveRows = Array.from(document.querySelectorAll('#script-inactive-body tr'));
    var allRows = activeRows.concat(inactiveRows);

    if (!term) {
      allRows.forEach(function (r) { r.classList.remove('filter-hidden'); });
      if (countEl) countEl.textContent = '';
      var an = document.getElementById('script-active-noresults');
      var dn = document.getElementById('script-inactive-noresults');
      if (an) an.style.display = 'none';
      if (dn) dn.style.display = 'none';
      return;
    }

    var visible = 0;
    var inactiveHasMatch = false;
    allRows.forEach(function (r) {
      var match = r.textContent.toLowerCase().indexOf(term) !== -1;
      r.classList.toggle('filter-hidden', !match);
      if (match) {
        visible++;
        if (inactiveRows.indexOf(r) !== -1) inactiveHasMatch = true;
      }
    });

    if (disabledGroup && inactiveHasMatch) disabledGroup.open = true;

    if (countEl) countEl.textContent = visible + ' / ' + allRows.length;

    var activeVisible = activeRows.filter(function (r) { return !r.classList.contains('filter-hidden'); }).length;
    var inactiveVisible = inactiveRows.filter(function (r) { return !r.classList.contains('filter-hidden'); }).length;
    var an = document.getElementById('script-active-noresults');
    var dn = document.getElementById('script-inactive-noresults');
    if (an) an.style.display = activeVisible === 0 ? 'block' : 'none';
    if (dn) dn.style.display = inactiveVisible === 0 ? 'block' : 'none';
  }

  filterInput.addEventListener('input', applyScriptFilter);
  filterInput.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { filterInput.value = ''; applyScriptFilter(); }
  });
})();

// ── Relative timestamps ───────────────────────────────────────────────────
(function () {
  function relativeTime(isoStr) {
    var diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
    if (diff < 60) return '${esc(this.i18n.t('justNow') || 'gerade eben')}';
    if (diff < 3600) { var m = Math.floor(diff/60); return m + ' ${esc(this.i18n.t('minutesAgo') || 'Min. her')}'; }
    if (diff < 86400) { var h = Math.floor(diff/3600); return h + ' ${esc(this.i18n.t('hoursAgo') || 'Std. her')}'; }
    var d = Math.floor(diff/86400);
    return d + ' ${esc(this.i18n.t('daysAgo') || 'Tage her')}';
  }
  var genEl = document.getElementById('gen-time');
  if (genEl) {
    var iso = genEl.getAttribute('data-iso');
    if (iso) {
      var rel = relativeTime(iso);
      genEl.title = new Date(iso).toLocaleString();
      genEl.textContent = new Date(iso).toLocaleString() + ' (' + rel + ')';
    }
  }
})();

// ── Dark mode toggle ──────────────────────────────────────────────────────
var _darkLabel = '${esc(this.i18n.t('darkMode') || 'Dark Mode')}';
var _lightLabel = '${esc(this.i18n.t('lightMode') || 'Light Mode')}';
function toggleDark() {
  var dark = document.body.classList.toggle('dark');
  localStorage.setItem('autodoc-dark', dark ? '1' : '0');
  var btn = document.getElementById('dark-toggle');
  if (btn) btn.textContent = (dark ? '☀️ ' : '🌙 ') + (dark ? _lightLabel : _darkLabel);
}
(function () {
  var btn = document.getElementById('dark-toggle');
  if (localStorage.getItem('autodoc-dark') === '1') {
    document.body.classList.add('dark');
    if (btn) btn.textContent = '☀️ ' + _lightLabel;
  } else {
    if (btn) btn.textContent = '🌙 ' + _darkLabel;
  }
})();
</script>
</body>
</html>`;
	}

	// ── User profile methods ────────────────────────────────────────────────

	/**
	 * Render rooms chapter for User profile — device names, icons, live values.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML
	 */
	renderUserRoomsChapter(docModel) {
		const roomsData = docModel.rooms;
		const i18n = this.i18n;
		const config = this.adapter.config;

		const hideRooms = new Set(
			(config.userHideRooms || []).map(r => r.room && r.room.trim()).filter(Boolean),
		);

		let html = `<h2 id="rooms-and-functions">${esc(i18n.t('roomsAndFunctions'))}</h2>\n`;

		if (!roomsData || roomsData.totalRooms === 0) {
			html += `<p><em>${esc(i18n.t('noRoomsDefined'))}</em></p>\n`;
			html += '<hr class="section-divider">\n';
			return html;
		}

		// Rooms
		html += `<h3>${esc(i18n.t('rooms'))}</h3>\n`;
		const visibleRooms = roomsData.rooms.filter(r => !hideRooms.has(r.name));
		const hiddenCount = roomsData.rooms.length - visibleRooms.length;
		if (hiddenCount > 0) {
			html += `<p style="font-size:12px;color:#aaa;margin-bottom:8px">${esc(i18n.t('roomsHiddenHint').replace('{0}', hiddenCount))}</p>\n`;
		}

		for (const room of visibleRooms) {
			const devices = room.devices || [];
			const devCount = devices.length;
			const note = docModel.manualContext && docModel.manualContext.rooms && docModel.manualContext.rooms[room.name];
			const roomSummary = `${esc(room.name)} <span style="font-weight:400;color:#888;font-size:13px">(${devCount} ${esc(i18n.t('members'))})</span>`;
			html += `<details style="margin-bottom:8px">
<summary class="maint-details-summary">${roomSummary}</summary>
`;
			if (note) {
				html += `<div class="manual-context-box" style="margin-top:6px">${esc(note)}</div>\n`;
			}
			if (devCount === 0) {
				html += `<p style="color:#888;font-size:14px;margin-top:6px"><em>${esc(i18n.t('noDevicesInRoom'))}</em></p>\n`;
			} else {
				html += `<div class="device-grid" style="margin-top:6px">\n`;
				for (const dev of devices) {
					const liveHtml = this._renderLiveValue(dev);
					html += `<div class="device-card">
  <span class="device-icon">${esc(dev.icon || '📦')}</span>
  <span class="device-name">${esc(dev.deviceName)}</span>${liveHtml}
</div>\n`;
				}
				html += `</div>\n`;
			}
			html += `</details>\n`;
		}

		// Functions — collapsible since there can be many
		if (roomsData.functions && roomsData.functions.length > 0) {
			html += `<details style="margin-top:16px">
<summary class="maint-details-summary">${esc(i18n.t('functions'))} <span style="font-weight:400;color:#888;font-size:13px">(${roomsData.functions.length})</span></summary>
<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">\n`;
			for (const fn of roomsData.functions) {
				html += `<div style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:8px 14px;font-size:14px">
  <strong>${esc(fn.name)}</strong> <span style="color:var(--text-faint);font-size:12px">(${esc(fn.memberCount)})</span>
</div>\n`;
			}
			html += `</div>\n</details>\n`;
		}

		html += '<hr class="section-divider">\n';
		return html;
	}

	/**
	 * Render scripts chapter for User profile — name + description only.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML
	 */
	renderUserScriptsChapter(docModel) {
		const scriptsData = docModel.scripts;
		const i18n = this.i18n;

		const active = (scriptsData.scripts || []).filter(s => s.enabled && s.desc);
		if (active.length === 0) {
			return '';
		}

		let html = `<h2 id="scripts">${esc(i18n.t('automations'))}</h2>\n`;
		html += `<div class="adapter-list">\n`;
		for (const script of active) {
			html += `<div class="adapter-card">
  <strong>${esc(script.name)}</strong>
  <p class="adapter-desc">${esc(script.desc)}</p>
</div>\n`;
		}
		html += `</div>\n<hr class="section-divider">\n`;
		return html;
	}

	/**
	 * Render adapters chapter for User profile — title only, no tech details.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML
	 */
	renderUserAdaptersChapter(docModel) {
		const adapters = docModel.adapters;
		const i18n = this.i18n;
		const config = this.adapter.config;

		const hideAdapters = new Set(
			(config.userHideAdapters || []).map(a => a.adapter && a.adapter.trim()).filter(Boolean),
		);

		const active = adapters.adapters.filter(a => a.enabledInstances > 0 && !hideAdapters.has(a.name));
		const hiddenCount = adapters.adapters.filter(a => a.enabledInstances > 0 && hideAdapters.has(a.name)).length;

		let html = `<h2 id="adapter-instances">${esc(i18n.t('connectedSystems'))}</h2>\n`;
		if (hiddenCount > 0) {
			html += `<p style="font-size:12px;color:#aaa;margin-bottom:8px">${esc(i18n.t('adaptersHiddenHint').replace('{0}', hiddenCount))}</p>\n`;
		}
		html += `<div class="adapter-list">\n`;
		for (const adapter of active) {
			const displayName = adapter.title && adapter.title !== adapter.name ? adapter.title : adapter.name;
			const contextNote =
				docModel.manualContext &&
				docModel.manualContext.adapters &&
				docModel.manualContext.adapters[adapter.name]
					? `<div class="manual-context-box">${esc(docModel.manualContext.adapters[adapter.name])}</div>`
					: '';
			html += `<div class="adapter-card">
  <strong>${esc(displayName)}</strong>
  ${adapter.desc ? `<p class="adapter-desc">${esc(adapter.desc)}</p>` : ''}
  ${contextNote}
</div>\n`;
		}
		html += `</div>\n<hr class="section-divider">\n`;
		return html;
	}

	// ── Onboarding profile methods ──────────────────────────────────────────

	/**
	 * Render onboarding welcome header with system stats.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML
	 */
	renderOnboardingWelcome(docModel) {
		const config = this.adapter.config;
		const i18n = this.i18n;
		const sc = docModel.systemConfig || {};
		const city = sc.city || sc.location || '';
		const projectName = config.projectName || 'ioBroker System';

		const greeting = city
			? i18n.t('onboardingWelcomeCity', projectName, city)
			: i18n.t('onboardingWelcome', projectName);

		const contact = docModel.manualContext && docModel.manualContext.contact;
		const contactHtml = contact
			? `<div style="display:inline-flex;align-items:center;gap:8px;background:var(--manual-bg);border:1px solid var(--manual-border);border-radius:6px;padding:8px 14px;font-size:14px;margin-bottom:20px;color:var(--text)">
  <span style="font-size:18px">👤</span>
  <span><strong>${esc(i18n.t('contact'))}:</strong> ${esc(contact)}</span>
</div>\n`
			: '';

		const description = docModel.manualContext && docModel.manualContext.description;
		const descHtml = description
			? `<p style="font-size:15px;color:#555;margin:0 0 16px;padding:12px 16px;background:var(--note-bg);border-left:4px solid var(--note-border);border-radius:0 6px 6px 0">${esc(description)}</p>\n`
			: '';

		const totalDevices = docModel.rooms
			? docModel.rooms.rooms.reduce((s, r) => s + (r.memberCount || 0), 0)
			: 0;

		// QR code section — CDN with copy-link fallback
		const qrHtml = `<div id="qr-section" style="float:right;margin:0 0 16px 24px;text-align:center;max-width:130px">
  <div id="qrcode" style="display:inline-block;background:#fff;padding:8px;border-radius:6px;border:1px solid var(--border)"></div>
  <div id="qr-copy-btn" style="display:none;margin-top:4px">
    <button onclick="copyPageUrl()" style="font-size:12px;padding:4px 10px;border-radius:4px;border:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer">📋 ${esc(i18n.t('copyLink') || 'Link kopieren')}</button>
  </div>
  <div style="font-size:11px;color:var(--text-faint);margin-top:4px">${esc(i18n.t('scanToShare') || 'Seite teilen')}</div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
  onerror="document.getElementById('qrcode').style.display='none';document.getElementById('qr-copy-btn').style.display='block';"
  defer><\/script>
<script>
window.addEventListener('load', function() {
  try {
    if (typeof QRCode !== 'undefined') {
      new QRCode(document.getElementById('qrcode'), {
        text: window.location.href,
        width: 110, height: 110,
        colorDark: '#000', colorLight: '#fff',
        correctLevel: QRCode.CorrectLevel.M
      });
    } else {
      document.getElementById('qrcode').style.display = 'none';
      document.getElementById('qr-copy-btn').style.display = 'block';
    }
  } catch(e) {
    document.getElementById('qrcode').style.display = 'none';
    document.getElementById('qr-copy-btn').style.display = 'block';
  }
});
function copyPageUrl() {
  navigator.clipboard.writeText(window.location.href).then(function() {
    var btn = document.querySelector('#qr-copy-btn button');
    if (btn) { btn.textContent = '✅ ${esc(i18n.t('copied') || 'Kopiert!')}'; setTimeout(function(){ btn.textContent = '📋 ${esc(i18n.t('copyLink') || 'Link kopieren')}'; }, 2000); }
  });
}
<\/script>
`;

		return `<h1>${esc(greeting)}</h1>
${qrHtml}<p style="font-size:16px;color:#444;margin:12px 0 16px">${esc(i18n.t('onboardingIntro'))}</p>
${descHtml}${contactHtml}<div class="stat-grid">
  <div class="stat-card"><div class="num">${esc(docModel.rooms ? docModel.rooms.totalRooms : 0)}</div><div class="label">${esc(i18n.t('rooms'))}</div></div>
  <div class="stat-card"><div class="num">${esc(totalDevices)}</div><div class="label">${esc(i18n.t('devices') || 'Devices')}</div></div>
  <div class="stat-card"><div class="num">${esc(docModel.system.statistics.enabledInstanceCount)}</div><div class="label">${esc(i18n.t('activeAdapters'))}</div></div>
</div>
<div style="clear:both"></div>
<hr class="section-divider">
`;
	}

	/**
	 * Render rooms for Onboarding — icon, device name, live value if available.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML
	 */
	renderOnboardingRooms(docModel) {
		const roomsData = docModel.rooms;
		const i18n = this.i18n;
		const config = this.adapter.config;

		const hideRooms = new Set(
			(config.onboardingHideRooms || []).map(r => r.room && r.room.trim()).filter(Boolean),
		);

		let html = `<h2 id="rooms">${esc(i18n.t('yourRooms'))}</h2>\n`;

		if (!roomsData || roomsData.totalRooms === 0) {
			html += `<p><em>${esc(i18n.t('noRoomsDefined'))}</em></p>\n`;
			html += '<hr class="section-divider">\n';
			return html;
		}

		const visibleRooms = roomsData.rooms.filter(r => !hideRooms.has(r.name));
		const hiddenCount = roomsData.rooms.length - visibleRooms.length;

		if (hiddenCount > 0) {
			html += `<p style="font-size:12px;color:#aaa;margin-bottom:8px">${esc(i18n.t('roomsHiddenHint').replace('{0}', hiddenCount))}</p>\n`;
		}

		// Functions overview — shown as friendly category chips before the room details
		if (roomsData.functions && roomsData.functions.length > 0) {
			const fnIcons = { 'licht': '💡', 'light': '💡', 'beleuchtung': '💡', 'rollladen': '🪟', 'shutter': '🪟', 'blind': '🪟', 'heizung': '🌡️', 'heating': '🌡️', 'thermostat': '🌡️', 'alarm': '🔔', 'sicherheit': '🔒', 'security': '🔒', 'steckdose': '🔌', 'socket': '🔌', 'kamera': '📷', 'camera': '📷', 'musik': '🎵', 'media': '🎵', 'garten': '🌿', 'garden': '🌿' };
			html += `<div style="margin-bottom:20px">
<p style="font-size:13px;color:var(--text-faint);margin-bottom:8px">${esc(i18n.t('whatCanBeControlled') || 'What can be controlled:')}</p>
<div style="display:flex;flex-wrap:wrap;gap:8px">\n`;
			for (const fn of roomsData.functions) {
				const key = fn.name.toLowerCase();
				const icon = Object.keys(fnIcons).find(k => key.includes(k)) ? fnIcons[Object.keys(fnIcons).find(k => key.includes(k))] : '⚙️';
				html += `<div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:6px 14px;font-size:14px;display:flex;align-items:center;gap:6px">
  <span>${icon}</span><span>${esc(fn.name)}</span>
</div>\n`;
			}
			html += `</div>\n</div>\n`;
		}

		for (const room of visibleRooms) {
			const devices = room.devices || [];
			const devCount = devices.length;
			const note = docModel.manualContext && docModel.manualContext.rooms && docModel.manualContext.rooms[room.name];
			const roomSummary = `${esc(room.name)} <span style="font-weight:400;color:#888;font-size:13px">(${devCount} ${esc(i18n.t('members'))})</span>`;
			html += `<details style="margin-bottom:8px">
<summary class="maint-details-summary">${roomSummary}</summary>
`;
			if (note) {
				html += `<div class="manual-context-box" style="margin-top:6px">${esc(note)}</div>\n`;
			}
			if (devCount === 0) {
				html += `<p style="color:#888;font-size:14px;margin-top:6px"><em>${esc(i18n.t('noDevicesInRoom'))}</em></p>\n`;
			} else {
				html += `<div class="device-grid" style="margin-top:6px">\n`;
				for (const dev of devices) {
					const liveHtml = this._renderLiveValue(dev);
					html += `<div class="device-card">
  <span class="device-icon">${esc(dev.icon || '📦')}</span>
  <span class="device-name">${esc(dev.deviceName)}</span>${liveHtml}
</div>\n`;
				}
				html += `</div>\n`;
			}
			html += `</details>\n`;
		}

		html += '<hr class="section-divider">\n';
		return html;
	}

	/**
	 * Render automations section for Onboarding — scripts as plain sentences.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML
	 */
	renderOnboardingAutomations(docModel) {
		const scriptsData = docModel.scripts;
		const i18n = this.i18n;

		const active = (scriptsData.scripts || []).filter(s => s.enabled);

		let html = `<h2 id="automations">${esc(i18n.t('whatRunsAutomatically'))}</h2>\n`;

		if (active.length === 0) {
			html += `<p style="font-size:14px;color:#888;font-style:italic">${esc(i18n.t('noActiveScripts'))}</p>\n`;
			html += '<hr class="section-divider">\n';
			return html;
		}

		html += `<p style="font-size:14px;color:#555;margin-bottom:12px">${esc(i18n.t('automationsIntro'))}</p>\n`;

		const withDesc = active.filter(s => s.desc);
		const withoutDesc = active.filter(s => !s.desc);

		if (withDesc.length > 0) {
			html += `<ul class="content-list">\n`;
			for (const script of withDesc) {
				html += `  <li><strong>${esc(script.name)}</strong> — ${esc(script.desc)}</li>\n`;
			}
			html += `</ul>\n`;
		}

		if (withoutDesc.length > 0) {
			html += `<details style="margin-top:8px"><summary style="cursor:pointer;font-size:13px;color:#888">${esc(i18n.t('moreScripts').replace('{0}', withoutDesc.length))}</summary>\n`;
			html += `<ul class="content-list" style="margin-top:6px">\n`;
			for (const script of withoutDesc) {
				html += `  <li style="color:#777">${esc(script.name)}</li>\n`;
			}
			html += `</ul></details>\n`;
		}

		html += '<hr class="section-divider">\n';
		return html;
	}

	/**
	 * Render hint for Onboarding when no manualContext / AI configured.
	 *
	 * @param {object} docModel Document model
	 * @param {object} config Adapter config
	 * @returns {string} HTML
	 */
	renderOnboardingHint(docModel, config) {
		const i18n = this.i18n;
		const hasManual = docModel.manualContext && (docModel.manualContext.description || docModel.manualContext.notes);
		const hasAi = !!docModel.ai;
		if (hasManual || hasAi) {
			return '';
		}

		return `<div class="note-box" style="margin-top:24px">
  <strong>${esc(i18n.t('onboardingHintTitle'))}</strong><br>
  ${esc(i18n.t('onboardingHintText'))}
</div>\n`;
	}

	/**
	 * Render tips & notes section for Onboarding — shown prominently right after welcome.
	 *
	 * @param {string} notes Notes text from manual context
	 * @returns {string} HTML
	 */
	renderOnboardingNotes(notes) {
		const i18n = this.i18n;
		return `<h2 id="tips">${esc(i18n.t('tipsAndNotes') || 'Hinweise & Tipps')}</h2>
<div class="note-box" style="font-size:15px;line-height:1.7">${esc(notes)}</div>
<hr class="section-divider">
`;
	}

	/**
	 * Render connected systems for Onboarding — collapsed by default, technical details hidden.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML
	 */
	renderOnboardingAdapters(docModel) {
		const adapters = docModel.adapters;
		const i18n = this.i18n;
		const config = this.adapter.config;

		const hideAdapters = new Set(
			(config.onboardingHideAdapters || []).map(a => a.adapter && a.adapter.trim()).filter(Boolean),
		);
		const visible = adapters.adapters.filter(a => a.enabledInstances > 0 && !hideAdapters.has(a.name));

		if (visible.length === 0) return '';

		let html = `<details style="margin-bottom:12px" id="adapter-instances">
<summary class="maint-details-summary">${esc(i18n.t('connectedSystems') || 'Verbundene Systeme')} <span style="font-weight:400;color:#888;font-size:13px">(${visible.length})</span></summary>
<div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
`;
		for (const adapter of visible) {
			const displayName = adapter.title && adapter.title !== adapter.name ? adapter.title : adapter.name;
			const note = docModel.manualContext && docModel.manualContext.adapters && docModel.manualContext.adapters[adapter.name];
			html += `<div class="adapter-card">
  <div class="adapter-card-header"><strong>${esc(displayName)}</strong></div>
  ${adapter.desc ? `<p class="adapter-desc">${esc(adapter.desc)}</p>` : ''}
  ${note ? `<div class="manual-context-box">${esc(note)}</div>` : ''}
</div>\n`;
		}
		html += `</div>\n</details>\n<hr class="section-divider">\n`;
		return html;
	}

	// ── Shared helper ───────────────────────────────────────────────────────

	/**
	 * Render live value badge for a device member.
	 *
	 * @param {object} dev Device member with currentValue / unit
	 * @returns {string} HTML badge or empty string
	 */
	_renderLiveValue(dev) {
		if (dev.currentValue === null || dev.currentValue === undefined) {
			return '';
		}
		const val = String(dev.currentValue);
		const unit = dev.unit ? ` ${dev.unit}` : '';
		return ` <span class="badge badge-meta" style="font-size:11px">${esc(val + unit)}</span>`;
	}

	// ── Navigation ──────────────────────────────────────────────────────────

	/**
	 * Build navigation sidebar HTML.
	 *
	 * @param {string} profile Documentation profile
	 * @returns {string} Nav HTML
	 */
	renderNav(profile) {
		const i18n = this.i18n;
		let links = '';

		if (profile === PROFILE_ONBOARDING) {
			links = `<li><a href="#tips">${esc(i18n.t('tipsAndNotes') || 'Hinweise & Tipps')}</a></li>
<li><a href="#rooms">${esc(i18n.t('yourRooms'))}</a></li>
<li><a href="#automations">${esc(i18n.t('whatRunsAutomatically'))}</a></li>
<li><a href="#adapter-instances">${esc(i18n.t('connectedSystems'))}</a></li>`;
		} else if (profile === PROFILE_USER) {
			links = `<li><a href="#rooms-and-functions">${esc(i18n.t('roomsAndFunctions'))}</a></li>
<li><a href="#scripts">${esc(i18n.t('automations'))}</a></li>
<li><a href="#adapter-instances">${esc(i18n.t('connectedSystems'))}</a></li>
<li><a href="#manual-information">${esc(i18n.t('manualInformation'))}</a></li>`;
		} else {
			links = `<li><a href="#system-overview">${esc(i18n.t('systemOverview'))}</a></li>
<li><a href="#adapter-instances">${esc(i18n.t('adapterInstances'))}</a></li>
<li><a href="#rooms-and-functions">${esc(i18n.t('roomsAndFunctions'))}</a></li>
<li><a href="#scripts">${esc(i18n.t('scripts'))}</a></li>
<li><a href="#userdata">${esc(i18n.t('userDefinedVariables') || 'Eigene Variablen')}</a></li>
<li><a href="#maintenance">${esc(i18n.t('maintenance'))}</a></li>
<li><a href="#manual-information">${esc(i18n.t('manualInformation'))}</a></li>
<li><a href="#diagnosis">${esc(i18n.t('diagnosis'))}</a></li>
<li><a href="#troubleshooting">${esc(i18n.t('troubleshooting'))}</a></li>
<li><a href="#changelog">${esc(i18n.t('changelog'))}</a></li>
<li><a href="#appendices">${esc(i18n.t('appendices'))}</a></li>`;
		}

		return `<h2>${esc(i18n.t('tableOfContents'))}</h2>
<ul>${links}</ul>`;
	}

	/**
	 * Render document header with metadata.
	 *
	 * @param {object} docModel Document model
	 * @param {string} profile Target profile
	 * @returns {string} Header HTML
	 */
	renderHeader(docModel, profile) {
		const config = this.adapter.config;
		const i18n = this.i18n;
		const generatedAt = docModel.meta.generatedAt;

		// Adapter health badge
		const stats = docModel.system && docModel.system.statistics;
		let healthBadge = '';
		if (stats && stats.instanceCount > 0) {
			const total = stats.instanceCount;
			const active = stats.enabledInstanceCount;
			const healthClass = active >= total * 0.9 ? 'health-ok' : 'health-warn';
			healthBadge = `<span class="health-badge ${healthClass}">${active}/${total} ${esc(i18n.t('adaptersActive') || 'aktiv')}</span>`;
		}

		// Stale warning — client-side JS checks age against 7 days
		const staleWarning = `<div id="stale-warning" class="stale-warning" style="display:none">
  ⚠️ <span id="stale-msg">${esc(i18n.t('staleDocsWarning') || 'Diese Dokumentation könnte veraltet sein.')}</span>
</div>
<script>
(function(){
  var ts = ${JSON.stringify(generatedAt)};
  var age = (Date.now() - new Date(ts).getTime()) / 86400000;
  if (age > 7) {
    var el = document.getElementById('stale-warning');
    if (el) {
      document.getElementById('stale-msg').textContent = (age > 30
        ? '${esc(i18n.t('staleDocsOld') || 'Dokumentation ist älter als 30 Tage — bitte neu generieren.')} '
        : '${esc(i18n.t('staleDocsWeek') || 'Dokumentation ist älter als 7 Tage.')} ')
        + '(${esc(i18n.t('generated') || 'Generiert')}: ' + new Date(ts).toLocaleDateString() + ')';
      el.style.display = 'flex';
    }
  }
})();
<\/script>`;

		return `${staleWarning}<h1>${esc(i18n.t('projectDocumentation', config.projectName || 'ioBroker System'))}${healthBadge}</h1>
<dl class="meta">
  <dt>${esc(i18n.t('generated'))}</dt><dd id="gen-time" data-iso="${esc(generatedAt)}">${esc(new Date(generatedAt).toLocaleString())}</dd>
  <dt>${esc(i18n.t('profile'))}</dt><dd>${esc(profile)}</dd>
  <dt>${esc(i18n.t('system'))}</dt><dd>${esc(config.targetSystem || 'Production')}</dd>
  <dt>${esc(i18n.t('trigger'))}</dt><dd>${esc(docModel.meta.trigger)}</dd>
</dl>
<hr class="section-divider">
`;
	}

	/**
	 * Render AI-generated summary box.
	 *
	 * @param {{narrative: string, recommendations: string}} ai AI content
	 * @returns {string} AI section HTML
	 */
	renderAiSection(ai) {
		const recLines = (ai.recommendations || '')
			.split('\n')
			.filter(l => l.trim())
			.map(l => `<li>${esc(l.replace(/^[-*•]\s*/, ''))}</li>`)
			.join('\n');

		const recsHtml = recLines
			? `<ul class="ai-recommendations-list">${recLines}</ul>`
			: `<p class="ai-recommendations">${esc(ai.recommendations)}</p>`;

		const i18n = this.i18n;
		return `<div class="ai-box">
  <div class="ai-box-label">${esc(i18n.t('aiSummary'))}</div>
  ${ai.narrative ? `<p class="ai-narrative">${esc(ai.narrative)}</p>` : ''}
  ${ai.recommendations ? recsHtml : ''}
</div>
`;
	}

	/**
	 * Render Quick Start section for Onboarding profile.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} Quick start HTML
	 */
	renderQuickStart(docModel) {
		const system = docModel.system;
		const i18n = this.i18n;
		return `<h2 id="quick-start">${esc(i18n.t('quickStart'))}</h2>
<p>${esc(i18n.t('quickStartWelcome'))}</p>
<div class="stat-grid">
  <div class="stat-card"><div class="num">${esc(system.statistics.enabledInstanceCount)}</div><div class="label">${esc(i18n.t('activeAdapters'))}</div></div>
  <div class="stat-card"><div class="num">${esc(system.statistics.instanceCount)}</div><div class="label">${esc(i18n.t('totalInstances'))}</div></div>
</div>
<h3>${esc(i18n.t('nextSteps'))}</h3>
<ul class="content-list">
  <li>${esc(i18n.t('nextStepsReview'))}</li>
  <li>${esc(i18n.t('nextStepsManual'))}</li>
  <li>${esc(i18n.t('nextStepsAdapters'))}</li>
</ul>
<hr class="section-divider">
`;
	}

	/**
	 * Render system overview chapter.
	 *
	 * @param {object} docModel Document model
	 * @param {string} profile Documentation profile
	 * @returns {string} System chapter HTML
	 */
	renderSystemChapter(docModel, profile) {
		const system = docModel.system;
		const stats = system.statistics;
		const i18n = this.i18n;

		let html = `<h2 id="system-overview">${esc(i18n.t('systemOverview'))}</h2>
<h3>${esc(i18n.t('projectInformation'))}</h3>
<dl class="meta">
  <dt>${esc(i18n.t('projectName'))}</dt><dd>${esc(system.projectName)}</dd>
  <dt>${esc(i18n.t('targetSystem'))}</dt><dd>${esc(system.targetSystem)}</dd>
</dl>
<h3>${esc(i18n.t('primaryHost'))}</h3>
<dl class="meta">
  <dt>${esc(i18n.t('name'))}</dt><dd>${esc(system.primaryHost.name)}</dd>
  <dt>${esc(i18n.t('platform'))}</dt><dd>${esc(system.primaryHost.platform)}</dd>
  <dt>${esc(i18n.t('version'))}</dt><dd>${esc(system.primaryHost.version)}</dd>
  ${system.primaryHost.nodeVersion ? `<dt>${esc(i18n.t('nodeVersion'))}</dt><dd>${this.renderNodeVersionBadge(system.primaryHost.nodeVersion, i18n)}</dd>` : ''}
  ${system.primaryHost.osType || system.primaryHost.osRelease ? `<dt>${esc(i18n.t('osKernel'))}</dt><dd>${esc([system.primaryHost.osType, system.primaryHost.osRelease].filter(Boolean).join(' '))}</dd>` : ''}
  ${system.primaryHost.osArch ? `<dt>${esc(i18n.t('osArch'))}</dt><dd>${esc(system.primaryHost.osArch)}</dd>` : ''}
</dl>
<h3>${esc(i18n.t('systemStatistics'))}</h3>
<div class="stat-grid">
  <div class="stat-card"><div class="num">${esc(stats.instanceCount)}</div><div class="label">${esc(i18n.t('totalAdapterInstances'))}</div></div>
  <div class="stat-card"><div class="num">${esc(stats.enabledInstanceCount)}</div><div class="label">${esc(i18n.t('enabledInstances'))}</div></div>
  <div class="stat-card"><div class="num">${esc(stats.disabledInstanceCount)}</div><div class="label">${esc(i18n.t('disabledInstances'))}</div></div>
`;

		if (this.shouldShowDetail(profile, 'admin')) {
			html += `  <div class="stat-card"><div class="num">${esc(stats.totalStateObjects)}</div><div class="label">${esc(i18n.t('totalStateObjects'))}</div></div>
  <div class="stat-card"><div class="num">${esc(stats.writableStateObjects)}</div><div class="label">${esc(i18n.t('writableStates'))}</div></div>
  <div class="stat-card"><div class="num">${esc(stats.readonlyStateObjects)}</div><div class="label">${esc(i18n.t('readOnlyStates'))}</div></div>
`;
			// Pending adapter updates
			if (stats.pendingUpdates > 0) {
				html += `  <div class="stat-card" style="border-color:#ffc107"><div class="num" style="color:#856404">${esc(stats.pendingUpdates)}</div><div class="label">${esc(i18n.t('pendingUpdates') || 'Updates verfügbar')}</div></div>\n`;
			}
			// Last backup
			if (stats.lastBackup) {
				const backupDate = new Date(stats.lastBackup);
				const backupAgeMs = Date.now() - backupDate.getTime();
				const backupAgeDays = Math.floor(backupAgeMs / 86400000);
				const backupStyle = backupAgeDays > 7 ? 'color:#856404' : 'color:#155724';
				const backupLabel = backupAgeDays === 0
					? (i18n.t('today') || 'heute')
					: backupAgeDays === 1
						? (i18n.t('yesterday') || 'gestern')
						: `${backupAgeDays}d`;
				html += `  <div class="stat-card" title="${esc(backupDate.toLocaleString())}"><div class="num" style="${backupStyle}">${esc(backupLabel)}</div><div class="label">${esc(i18n.t('lastBackup') || 'Letztes Backup')}</div></div>\n`;
			}
		}

		html += `</div>
`;

		// Location + Timezone
		const loc = system.location;
		if (loc && (loc.city || loc.country || loc.timezone)) {
			const locParts = [loc.city, loc.country].filter(Boolean).join(', ');
			html += `<h3>${esc(i18n.t('location') || 'Standort')}</h3>
<dl class="meta">
${locParts ? `  <dt>${esc(i18n.t('city') || 'Ort')}</dt><dd>${esc(locParts)}</dd>` : ''}
${loc.timezone ? `  <dt>${esc(i18n.t('timezone') || 'Zeitzone')}</dt><dd>${esc(loc.timezone)}</dd>` : ''}
${loc.tempUnit ? `  <dt>${esc(i18n.t('tempUnit') || 'Temperatur')}</dt><dd>${esc(loc.tempUnit)}</dd>` : ''}
</dl>
`;
		}

		if (this.shouldShowDetail(profile, 'admin') && system.hosts.length > 0) {
			const hostRes = system.hostResources || {};
			html += `<h3>${esc(i18n.t('hosts'))}</h3>
<table>
<thead><tr><th>${esc(i18n.t('name'))}</th><th>${esc(i18n.t('platform'))}</th><th>${esc(i18n.t('version'))}</th><th>${esc(i18n.t('nodeVersion'))}</th><th>RAM</th><th>CPU</th><th>${esc(i18n.t('uptime') || 'Laufzeit')}</th></tr></thead>
<tbody>
${system.hosts
	.map(h => {
		const res = hostRes[h.name] || {};
		const ramUsed = res.freeMem ? Math.round(res.freeMem / 1024 / 1024) : null;
		const ramTotal = res.totalMem ? Math.round(res.totalMem / 1024 / 1024) : null;
		const ramHtml = ramUsed !== null && ramTotal !== null
			? `${ramUsed} / ${ramTotal} MB`
			: ramUsed !== null ? `${ramUsed} MB` : '—';
		const cpuHtml = res.cpu !== null && res.cpu !== undefined ? `${res.cpu} %` : '—';
		const uptimeSec = res.uptime;
		let uptimeHtml = '—';
		if (uptimeSec) {
			const d = Math.floor(uptimeSec / 86400);
			const h2 = Math.floor((uptimeSec % 86400) / 3600);
			uptimeHtml = d > 0 ? `${d}d ${h2}h` : `${h2}h`;
		}
		return `<tr>
  <td>${esc(h.name)}</td>
  <td>${esc(h.platform)}</td>
  <td>${esc(h.version)}</td>
  <td>${h.nodeVersion ? this.renderNodeVersionBadge(h.nodeVersion, i18n) : '—'}</td>
  <td><small>${esc(ramHtml)}</small></td>
  <td><small>${esc(cpuHtml)}</small></td>
  <td><small>${esc(uptimeHtml)}</small></td>
</tr>`;
	})
	.join('\n')}
</tbody>
</table>
`;
		}

		html += '<hr class="section-divider">\n';
		return html;
	}

	/**
	 * Render a Node.js version string with an ok/warning badge.
	 *
	 * @param {string} nodeVersion Node.js version string, e.g. "v20.11.0"
	 * @param {object} i18n i18n instance
	 * @returns {string} HTML span with badge
	 */
	renderNodeVersionBadge(nodeVersion, i18n) {
		const match = nodeVersion.match(/v?(\d+)/);
		const major = match ? parseInt(match[1], 10) : 0;
		const isLts = major >= 20 && major % 2 === 0;
		if (isLts) {
			const label = i18n.t('nodeVersionOk').replace('{0}', esc(nodeVersion));
			return `<span class="badge badge-ok">${label}</span>`;
		}
		const label = i18n.t('nodeVersionOutdated').replace('{0}', esc(nodeVersion));
		return `<span class="badge badge-off">${label}</span>`;
	}

	/**
	 * Return a human-readable folder label for a script.
	 *
	 * @param {string|null} folder Raw folder string from discovery (null = root)
	 * @param {object} i18n i18n instance
	 * @returns {string} Translated folder label
	 */
	scriptFolderLabel(folder, i18n) {
		if (!folder) {
			return i18n.t('scriptFolderRoot');
		}
		if (folder === 'common') {
			return i18n.t('scriptFolderCommon');
		}
		if (folder === 'global') {
			return i18n.t('scriptFolderGlobal');
		}
		return folder;
	}

	/**
	 * Convert a cron expression into a human-readable string.
	 * Handles the most common patterns; falls back to the raw expression.
	 *
	 * @param {string} cron Cron expression (5 or 6 fields)
	 * @param {object} i18n i18n instance
	 * @returns {string} Human-readable schedule description
	 */
	describeCron(cron, i18n) {
		if (!cron || typeof cron !== 'string') return cron;
		const parts = cron.trim().split(/\s+/);
		// Normalise: drop seconds field if 6 parts
		const [min, hour, dom, month, dow] = parts.length === 6 ? parts.slice(1) : parts;

		const every = i18n.t('cronEvery') || 'alle';
		const daily = i18n.t('cronDaily') || 'täglich';
		const hourly = i18n.t('cronHourly') || 'stündlich';
		const at = i18n.t('cronAt') || 'um';
		const days = [
			i18n.t('cronSun') || 'So',
			i18n.t('cronMon') || 'Mo',
			i18n.t('cronTue') || 'Di',
			i18n.t('cronWed') || 'Mi',
			i18n.t('cronThu') || 'Do',
			i18n.t('cronFri') || 'Fr',
			i18n.t('cronSat') || 'Sa',
		];

		// Every X minutes: */X * * * *
		const everyMin = min.match(/^\*\/(\d+)$/);
		if (everyMin && hour === '*' && dom === '*' && month === '*' && dow === '*') {
			return `${every} ${everyMin[1]} min`;
		}
		// Hourly: 0 * * * *
		if (min === '0' && hour === '*' && dom === '*' && month === '*' && dow === '*') {
			return hourly;
		}
		// Every X hours: 0 */X * * *
		const everyHour = hour.match(/^\*\/(\d+)$/);
		if (everyHour && dom === '*' && month === '*' && dow === '*') {
			return `${every} ${everyHour[1]}h`;
		}
		// Daily at fixed time: M H * * *
		if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === '*' && month === '*' && dow === '*') {
			return `${daily} ${at} ${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
		}
		// Weekdays Mon-Fri: M H * * 1-5
		if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === '*' && month === '*' && dow === '1-5') {
			return `Mo–Fr ${at} ${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
		}
		// Specific weekdays: M H * * d,d
		if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === '*' && month === '*' && dow !== '*') {
			const dayLabels = dow.split(',').map(d => days[parseInt(d, 10)] || d).join(',');
			return `${dayLabels} ${at} ${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
		}
		// Multiple times per day: M H1,H2 * * *
		if (/^\d+$/.test(min) && /^\d+(,\d+)+$/.test(hour) && dom === '*' && month === '*' && dow === '*') {
			const times = hour.split(',').map(h => `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`).join(', ');
			return `${daily} ${at} ${times}`;
		}
		// Fallback: return raw cron
		return cron;
	}

	/**
	 * Render adapters chapter.
	 *
	 * @param {object} docModel Document model
	 * @param {string} profile Documentation profile
	 * @returns {string} Adapters chapter HTML
	 */
	renderAdaptersChapter(docModel, profile) {
		const adapters = docModel.adapters;
		const config = this.adapter.config;
		const i18n = this.i18n;

		const totalInstances = adapters.adapters.reduce((sum, a) => sum + a.totalInstances, 0);

		let html = `<h2 id="adapter-instances">${esc(i18n.t('adapterInstances'))}</h2>
<div class="stat-grid">
  <div class="stat-card"><div class="num">${esc(adapters.totalAdapters)}</div><div class="label">${esc(i18n.t('totalAdapters'))}</div></div>
  <div class="stat-card"><div class="num">${esc(totalInstances)}</div><div class="label">${esc(i18n.t('totalInstances'))}</div></div>
</div>
`;

		if (profile === PROFILE_ADMIN) {
			// Admin: table with technical details — enabled first, disabled collapsed
			const enabledAdapters = adapters.adapters.filter(a => a.enabledInstances > 0);
			const disabledAdapters = adapters.adapters.filter(a => a.enabledInstances === 0);

			/**
			 * Build a table row for an adapter.
			 *
			 * @param {object} adapter Adapter object from document model
			 * @returns {string} HTML table row
			 */
			const buildAdapterRow = adapter => {
				const displayName =
					adapter.title && adapter.title !== adapter.name
						? `<strong>${esc(adapter.title)}</strong><br><small style="color:#888">${esc(adapter.name)}</small>`
						: `<strong>${esc(adapter.name)}</strong>`;

				let instanceDetails = '';
				if (!config.hideInstanceDetailsInMarkdown) {
					instanceDetails = adapter.instances
						.map(
							inst =>
								`<small>${esc(inst.id)} — <span class="badge ${inst.enabled ? 'badge-ok' : 'badge-off'}">${esc(inst.enabled ? i18n.t('enabled') : i18n.t('disabled'))}</span> v${esc(inst.version || '?')}</small>`,
						)
						.join('<br>');
				}

				const metaBadges = [];
				const ct = adapter.connectionType;
				if (ct && ct !== 'none' && ct !== '') {
					const ctLabel =
						ct === 'local' ? i18n.t('connTypeLocal') : ct === 'cloud' ? i18n.t('connTypeCloud') : esc(ct);
					metaBadges.push(`<span class="badge badge-meta" title="Verbindungstyp">${ctLabel}</span>`);
				}
				const ds = adapter.dataSource;
				if (ds && ds !== 'none' && ds !== '' && ds !== 'assumption') {
					const dsLabel = ds === 'push' ? i18n.t('dataPush') : ds === 'poll' ? i18n.t('dataPoll') : esc(ds);
					metaBadges.push(`<span class="badge badge-meta" title="Datenquelle">${dsLabel}</span>`);
				}
				if (adapter.tier) {
					const tierLabel =
						adapter.tier === 1
							? i18n.t('tierStable')
							: adapter.tier === 2
								? i18n.t('tierTested')
								: i18n.t('tierExperimental');
					metaBadges.push(
						`<span class="badge badge-meta" title="Qualitätsstufe ${esc(adapter.tier)}">${tierLabel}</span>`,
					);
				}
				const metaHtml =
					metaBadges.length > 0 ? `<br><span class="adapter-meta">${metaBadges.join(' ')}</span>` : '';

				const manualNote =
					docModel.manualContext &&
					docModel.manualContext.adapters &&
					docModel.manualContext.adapters[adapter.name]
						? `<br><span class="manual-context-note">${esc(docModel.manualContext.adapters[adapter.name])}</span>`
						: '';

				return `<tr>
  <td>${displayName}${instanceDetails ? `<br>${instanceDetails}` : ''}${metaHtml}</td>
  <td><small>${esc(adapter.desc || '—')}</small>${manualNote}</td>
  <td>${esc(adapter.totalInstances)}</td>
  <td>${esc(adapter.enabledInstances)}</td>
</tr>\n`;
			};

			const tableHead = `<thead><tr><th>${esc(i18n.t('name'))}</th><th>${esc(i18n.t('description'))}</th><th>${esc(i18n.t('totalInstances'))}</th><th>${esc(i18n.t('enabledInstances'))}</th></tr></thead>`;

			html += `<h3>${esc(i18n.t('adapterDetails'))}</h3>
<div class="adapter-filter-bar">
  <input type="text" id="adapter-filter" placeholder="${esc(i18n.t('adapterFilterPlaceholder'))}" autocomplete="off">
  <span id="adapter-filter-count"></span>
  <small class="adapter-filter-hint">${esc(i18n.t('adapterFilterHint'))}</small>
</div>
<table id="adapter-enabled-table">
${tableHead}
<tbody id="adapter-enabled-body">
`;
			for (const adapter of enabledAdapters) {
				html += buildAdapterRow(adapter);
			}
			html += `</tbody>\n</table>\n<p class="no-results" id="adapter-enabled-noresults">${esc(i18n.t('noAdaptersMatch'))}</p>\n`;

			if (disabledAdapters.length > 0) {
				const disabledLabel = i18n.t('disabledAdaptersGroup').replace('{0}', disabledAdapters.length);
				html += `<details id="adapter-disabled-group" style="margin-top:12px">
<summary class="adapter-disabled-summary">${esc(disabledLabel)}</summary>
<table id="adapter-disabled-table" style="margin-top:8px">
${tableHead}
<tbody id="adapter-disabled-body">
`;
				for (const adapter of disabledAdapters) {
					html += buildAdapterRow(adapter);
				}
				html += `</tbody>\n</table>\n<p class="no-results" id="adapter-disabled-noresults">${esc(i18n.t('noAdaptersMatch'))}</p>\n</details>\n`;
			}
		} else if (profile === PROFILE_USER) {
			// User: card-style list, only active adapters, description prominent
			html += `<div class="adapter-list">\n`;
			for (const adapter of adapters.adapters) {
				if (adapter.enabledInstances === 0) {
					continue;
				}
				const displayName = adapter.title && adapter.title !== adapter.name ? adapter.title : adapter.name;
				const userContextNote =
					docModel.manualContext &&
					docModel.manualContext.adapters &&
					docModel.manualContext.adapters[adapter.name]
						? `<div class="manual-context-box">${esc(docModel.manualContext.adapters[adapter.name])}</div>`
						: '';
				html += `<div class="adapter-card">
  <div class="adapter-card-header">
    <strong>${esc(displayName)}</strong>
    <span class="badge badge-ok">${esc(i18n.t('enabled'))}</span>
  </div>
  ${adapter.desc ? `<p class="adapter-desc">${esc(adapter.desc)}</p>` : ''}
  ${userContextNote}
</div>\n`;
			}
			html += `</div>\n<p class="no-results">${esc(i18n.t('noAdaptersMatch'))}</p>\n`;
		} else if (profile === PROFILE_ONBOARDING) {
			// Onboarding: friendly cards for active adapters only, respecting hide list
			const hideAdapters = new Set(
				(config.onboardingHideAdapters || []).map(a => a.adapter && a.adapter.trim()).filter(Boolean),
			);
			const visibleAdapters = adapters.adapters.filter(a => !hideAdapters.has(a.name));
			const hiddenAdapterCount = adapters.adapters.length - visibleAdapters.length;

			if (hiddenAdapterCount > 0) {
				html += `<p style="font-size:12px;color:#aaa;margin-bottom:8px">${esc(i18n.t('adaptersHiddenHint').replace('{0}', hiddenAdapterCount))}</p>\n`;
			}

			html += `<div class="adapter-list">\n`;
			for (const adapter of visibleAdapters) {
				const displayName = adapter.title && adapter.title !== adapter.name ? adapter.title : adapter.name;
				const active = adapter.enabledInstances > 0;
				const statusText = active ? i18n.t('adapterRunsAutomatically') : i18n.t('adapterCurrentlyInactive');
				const onboardingContextNote =
					docModel.manualContext &&
					docModel.manualContext.adapters &&
					docModel.manualContext.adapters[adapter.name]
						? `<div class="manual-context-box">${esc(docModel.manualContext.adapters[adapter.name])}</div>`
						: '';
				html += `<div class="adapter-card ${active ? '' : 'adapter-card-inactive'}">
  <div class="adapter-card-header">
    <strong>${esc(displayName)}</strong>
    <span class="badge ${active ? 'badge-ok' : 'badge-off'}">${esc(active ? i18n.t('adapterActive') : i18n.t('adapterInactive'))}</span>
  </div>
  ${adapter.desc ? `<p class="adapter-desc">${esc(adapter.desc)}</p>` : ''}
  ${onboardingContextNote}
  <small class="adapter-status-note">${esc(statusText)}</small>
</div>\n`;
			}
			html += `</div>\n<p class="no-results">${esc(i18n.t('noAdaptersMatch'))}</p>\n`;
		}

		html += `<hr class="section-divider">\n`;
		return html;
	}

	/**
	 * Render rooms and functions chapter.
	 *
	 * @param {object} docModel Document model
	 * @param {string} profile Documentation profile
	 * @returns {string} Rooms chapter HTML
	 */
	renderRoomsChapter(docModel, profile) {
		const roomsData = docModel.rooms;
		const i18n = this.i18n;

		let html = `<h2 id="rooms-and-functions">${esc(i18n.t('roomsAndFunctions'))}</h2>
<div class="stat-grid">
  <div class="stat-card"><div class="num">${esc(roomsData.totalRooms)}</div><div class="label">${esc(i18n.t('totalRooms'))}</div></div>
  <div class="stat-card"><div class="num">${esc(roomsData.totalFunctions)}</div><div class="label">${esc(i18n.t('totalFunctions'))}</div></div>
</div>
`;

		if (roomsData.totalRooms === 0) {
			html += `<p><em>${esc(i18n.t('noRoomsDefined'))}</em></p>\n`;
		} else {
			// Overview table — name + count only (no inline member list)
			html += `<h3>${esc(i18n.t('rooms'))}</h3>
<table>
<thead><tr><th>${esc(i18n.t('name'))}</th><th>${esc(i18n.t('memberCount'))}</th></tr></thead>
<tbody>
`;
			for (const room of roomsData.rooms) {
				const roomNote = docModel.manualContext && docModel.manualContext.rooms && docModel.manualContext.rooms[room.name];
				const noteHtml = roomNote ? `<br><span class="manual-context-note">${esc(roomNote)}</span>` : '';
				html += `<tr>
  <td><strong>${esc(room.name)}</strong>${noteHtml}</td>
  <td>${esc(room.memberCount)}</td>
</tr>\n`;
			}
			html += `</tbody>\n</table>\n<p class="no-results">${esc(i18n.t('noRoomsMatch'))}</p>\n`;

			// Device hierarchy — entire section collapsible, each room collapsible inside
			if (profile === PROFILE_ADMIN) {
				const roomsWithDevices = roomsData.rooms.filter(r => r.devices && r.devices.length > 0);
				if (roomsWithDevices.length > 0) {
					const totalDevices = roomsWithDevices.reduce((s, r) => s + r.devices.length, 0);
					html += `<details style="margin-bottom:12px">
<summary class="maint-details-summary">${esc(i18n.t('deviceHierarchy'))} <span style="font-weight:400;color:#888;font-size:13px">(${roomsWithDevices.length} ${esc(i18n.t('rooms'))}, ${totalDevices} ${esc(i18n.t('members'))})</span></summary>
<div style="margin-top:8px">
`;
					for (const room of roomsWithDevices) {
						const devCount = room.devices.length;
						html += `<details style="margin-bottom:6px;margin-left:8px">
<summary class="maint-details-summary">${esc(room.name)} <span style="font-weight:400;color:#888;font-size:13px">(${devCount} ${esc(i18n.t('members'))})</span></summary>
<table style="margin-top:6px">
<thead><tr><th>${esc(i18n.t('name'))}</th><th>${esc(i18n.t('category'))}</th><th>OID</th></tr></thead>
<tbody>
`;
						for (const dev of room.devices) {
							const liveHtml = this._renderLiveValue(dev);
							html += `<tr>
  <td>${esc(dev.icon || '')} ${esc(dev.deviceName)}${liveHtml}</td>
  <td><small>${esc(dev.category || dev.role || '—')}</small></td>
  <td><code style="font-size:11px;color:#888">${esc(dev.id)}</code></td>
</tr>\n`;
						}
						html += `</tbody>\n</table>\n</details>\n`;
					}
					html += `</div>\n</details>\n`;
				}
			}

			if (profile === PROFILE_ADMIN && roomsData.functions.length > 0) {
				html += `<details style="margin-bottom:12px">
<summary class="maint-details-summary">${esc(i18n.t('functions'))} <span style="font-weight:400;color:#888;font-size:13px">(${roomsData.functions.length})</span></summary>
<div style="margin-top:8px">
<table>
<thead><tr><th>${esc(i18n.t('name'))}</th><th>${esc(i18n.t('memberCount'))}</th></tr></thead>
<tbody>
${roomsData.functions.map(fn => `<tr><td>${esc(fn.name)}</td><td>${esc(fn.memberCount)}</td></tr>`).join('\n')}
</tbody>
</table>
<p class="no-results">${esc(i18n.t('noFunctionsMatch'))}</p>
</div>
</details>
`;
			}
		}

		html += '<hr class="section-divider">\n';
		return html;
	}

	/**
	 * Render scripts chapter.
	 *
	 * @param {object} docModel Document model
	 * @param {string} profile Documentation profile
	 * @returns {string} Scripts chapter HTML
	 */
	renderScriptsChapter(docModel, profile) {
		const scriptsData = docModel.scripts;
		const i18n = this.i18n;

		let html = `<h2 id="scripts">${esc(i18n.t('scripts'))}</h2>
<div class="stat-grid">
  <div class="stat-card"><div class="num">${esc(scriptsData.totalScripts)}</div><div class="label">${esc(i18n.t('totalScripts'))}</div></div>
  <div class="stat-card"><div class="num">${esc(scriptsData.enabledScripts)}</div><div class="label">${esc(i18n.t('enabledScripts'))}</div></div>
  <div class="stat-card"><div class="num">${esc(scriptsData.disabledScripts)}</div><div class="label">${esc(i18n.t('disabledScripts'))}</div></div>
</div>
`;

		if (scriptsData.totalScripts === 0) {
			html += `<p><em>${esc(i18n.t('noScriptsDefined'))}</em></p>\n`;
		} else {
			const list = profile === PROFILE_USER ? scriptsData.scripts.filter(s => s.enabled) : scriptsData.scripts;

			if (profile === PROFILE_ADMIN) {
				const activeScripts = list.filter(s => s.enabled);
				const inactiveScripts = list.filter(s => !s.enabled);

			const buildScriptRow = (script, active) => {
				const folderLabel = this.scriptFolderLabel(script.folder, i18n);
				const nameCell = `${esc(script.name)}<br><small style="color:#888">${esc(folderLabel)}</small>`;
				const statusBadge = active
					? `<span class="badge badge-ok">${esc(i18n.t('active'))}</span>`
					: `<span class="badge badge-off">${esc(i18n.t('inactive'))}</span>`;
				const schedHtml = script.schedule
					? `<br><span class="badge badge-meta" title="${esc(script.schedule)}">${esc(this.describeCron(script.schedule, i18n))}</span>`
					: '';
				return `<tr>
  <td>${nameCell}</td>
  <td>${statusBadge}</td>
  <td><small>${esc(script.triggerType)}${schedHtml}</small></td>
  <td><small>${esc(script.desc || '—')}</small></td>
</tr>\n`;
			};

			const tableHead = `<thead><tr>
  <th>${esc(i18n.t('scriptName'))}</th>
  <th>${esc(i18n.t('scriptStatus'))}</th>
  <th>${esc(i18n.t('scriptTrigger'))}</th>
  <th>${esc(i18n.t('scriptDescription'))}</th>
</tr></thead>`;

				html += `<div class="script-filter-bar">
  <input type="text" id="script-filter" placeholder="${esc(i18n.t('scriptFilterPlaceholder'))}" autocomplete="off">
  <span id="script-filter-count"></span>
  <small class="script-filter-hint">${esc(i18n.t('scriptFilterHint'))}</small>
</div>
<table id="script-active-table">
${tableHead}
<tbody id="script-active-body">
`;
			for (const script of activeScripts) {
				html += buildScriptRow(script, true);
			}
			html += `</tbody>\n</table>\n<p class="no-results" id="script-active-noresults">${esc(i18n.t('noScriptsMatch'))}</p>\n`;

			if (inactiveScripts.length > 0) {
				const inactiveLabel = i18n.t('disabledScriptsGroup').replace('{0}', inactiveScripts.length);
				html += `<details id="script-disabled-group" style="margin-top:12px">
<summary class="script-disabled-summary">${esc(inactiveLabel)}</summary>
<table id="script-inactive-table" style="margin-top:8px">
${tableHead}
<tbody id="script-inactive-body">
`;
				for (const script of inactiveScripts) {
					html += buildScriptRow(script, false);
				}
					html += `</tbody>\n</table>\n<p class="no-results" id="script-inactive-noresults">${esc(i18n.t('noScriptsMatch'))}</p>\n</details>\n`;
				}
			} else {
				// User profile: simple table, active only
				html += `<table>
<thead><tr>
  <th>${esc(i18n.t('scriptName'))}</th>
  <th>${esc(i18n.t('scriptStatus'))}</th>
  <th>${esc(i18n.t('scriptTrigger'))}</th>
  <th>${esc(i18n.t('scriptDescription'))}</th>
</tr></thead>
<tbody>
`;
				for (const script of list) {
					const active = script.enabled;
					const folderLabel = this.scriptFolderLabel(script.folder, i18n);
					const nameCell = `${esc(script.name)}<br><small style="color:#888">${esc(folderLabel)}</small>`;
					html += `<tr>
  <td>${nameCell}</td>
  <td><span class="badge ${active ? 'badge-ok' : 'badge-off'}">${esc(active ? i18n.t('active') : i18n.t('inactive'))}</span></td>
  <td><small>${esc(script.triggerType)}</small></td>
  <td><small>${esc(script.desc || '—')}</small></td>
</tr>\n`;
				}
				html += `</tbody>\n</table>\n`;
			}

			// Admin: per-script state references and cross-reference table
			if (profile === PROFILE_ADMIN) {
				const scriptsWithRefs = list.filter(s => s.stateRefs && s.stateRefs.length > 0);
				const crossRef = scriptsData.stateCrossRef || [];
				const sharedStates = crossRef.filter(entry => entry.scripts.length > 1);

				if (scriptsWithRefs.length > 0) {
					html += `<h3 id="state-references">${esc(i18n.t('stateReferences'))}</h3>
<p style="font-size:13px;color:#666;margin-bottom:12px">${esc(i18n.t('stateReferencesDesc'))}</p>
<table>
<thead><tr><th>${esc(i18n.t('script'))}</th><th>${esc(i18n.t('referencedStates'))}</th></tr></thead>
<tbody>
`;
					for (const script of scriptsWithRefs) {
						const folderLbl = this.scriptFolderLabel(script.folder, i18n);
						const nameCell = `${esc(script.name)}<br><small style="color:#888">${esc(folderLbl)}</small>`;
						const refs = script.stateRefs
							.map(
								r =>
									`<code style="font-size:12px;background:#f4f4f4;padding:1px 5px;border-radius:3px">${esc(r)}</code>`,
							)
							.join(' ');
						html += `<tr><td>${nameCell}</td><td style="line-height:1.8">${refs}</td></tr>\n`;
					}
					html += `</tbody>\n</table>\n<p class="no-results">${esc(i18n.t('noScriptsMatch'))}</p>\n`;
				}

				if (sharedStates.length > 0) {
					html += `<h3>${esc(i18n.t('sharedStates'))}</h3>
<p style="font-size:13px;color:#666;margin-bottom:12px">${esc(i18n.t('sharedStatesDesc'))}</p>
<table>
<thead><tr><th>${esc(i18n.t('stateId'))}</th><th>${esc(i18n.t('usedByScripts'))}</th></tr></thead>
<tbody>
`;
					for (const entry of sharedStates) {
						const stateCell = `<code style="font-size:12px;background:#f4f4f4;padding:1px 5px;border-radius:3px">${esc(entry.stateId)}</code>`;
						html += `<tr><td>${stateCell}</td><td><small>${entry.scripts.map(s => esc(s)).join(', ')}</small></td></tr>\n`;
					}
					html += `</tbody>\n</table>\n<p class="no-results">${esc(i18n.t('noSharedStatesMatch'))}</p>\n`;
				}
			}
		}

		html += '<hr class="section-divider">\n';
		return html;
	}

	/**
	 * Render manual context chapter.
	 *
	 * @param {object} manualContext Manual context from config
	 * @returns {string} Manual context HTML
	 */
	renderManualContext(manualContext) {
		const i18n = this.i18n;
		let html = `<h2 id="manual-information">${esc(i18n.t('manualInformation'))}</h2>\n`;

		if (manualContext.description) {
			html += `<h3>${esc(i18n.t('description'))}</h3>\n<p>${esc(manualContext.description)}</p>\n`;
		}
		if (manualContext.contact) {
			html += `<h3>${esc(i18n.t('contact'))}</h3>\n<p>${esc(manualContext.contact)}</p>\n`;
		}
		if (manualContext.notes) {
			html += `<h3>${esc(i18n.t('additionalNotes'))}</h3>\n<div class="note-box">${esc(manualContext.notes)}</div>\n`;
		}

		html += '<hr class="section-divider">\n';
		return html;
	}

	/**
	 * Render maintenance and diagnostics chapter (Admin only).
	/**
	 * Render user-defined variables chapter (0_userdata.0 namespace).
	 * Groups by folder, shows name, type, current value, description.
	 *
	 * @param {Array} userData Array of user data objects from discovery
	 * @returns {string} HTML chapter
	 */
	renderUserDataChapter(userData) {
		const i18n = this.i18n;
		if (!userData || userData.length === 0) return '';

		// Group by folder
		const groups = {};
		for (const item of userData) {
			const key = item.folder || '';
			if (!groups[key]) groups[key] = [];
			groups[key].push(item);
		}

		let html = `<h2 id="userdata">${esc(i18n.t('userDefinedVariables') || 'Benutzerdefinierte Variablen')}</h2>
<p style="font-size:13px;color:var(--text-faint)">${esc(i18n.t('userDataDesc') || 'Datenpunkte unter 0_userdata.0 — selbst angelegte Variablen und Werte.')}</p>
`;

		const folderKeys = Object.keys(groups).sort();
		for (const folder of folderKeys) {
			const items = groups[folder];
			const label = folder || (i18n.t('scriptFolderRoot') || 'Root');
			html += `<details style="margin-bottom:8px">
<summary class="maint-details-summary">${esc(label)} <span style="font-weight:400;color:#888;font-size:13px">(${items.length})</span></summary>
<table style="margin-top:8px">
<thead><tr>
  <th>${esc(i18n.t('name'))}</th>
  <th>${esc(i18n.t('type') || 'Typ')}</th>
  <th>${esc(i18n.t('value') || 'Wert')}</th>
  <th>${esc(i18n.t('description') || 'Beschreibung')}</th>
</tr></thead>
<tbody>
`;
			for (const item of items) {
				const valStr = item.value !== null && item.value !== undefined ? String(item.value) : '—';
				const unit = item.unit ? ` ${item.unit}` : '';
				const typeLabel = item.type || '—';
				html += `<tr>
  <td><strong>${esc(item.name)}</strong>${item.role ? `<br><small style="color:#888">${esc(item.role)}</small>` : ''}</td>
  <td><small>${esc(typeLabel)}</small></td>
  <td>${esc(valStr + unit)}</td>
  <td><small>${esc(item.desc || '—')}</small></td>
</tr>\n`;
			}
			html += `</tbody>\n</table>\n</details>\n`;
		}

		html += '<hr class="section-divider">\n';
		return html;
	}

	/**
	 * @param {object} docModel Document model
	 * @returns {string} Maintenance chapter HTML
	 */
	renderMaintenanceChapter(docModel) {
		const m = docModel.maintenance;
		const i18n = this.i18n;

		const checkLabels = {
			scriptsWithoutDescription: i18n.t('scriptsWithoutDescription'),
			disabledInstances: i18n.t('disabledInstancesHint'),
		};

		const scoreColor = m.score >= 80 ? '#28a745' : m.score >= 50 ? '#ffc107' : '#dc3545';

		let html = `<h2 id="maintenance">${esc(i18n.t('maintenance'))}</h2>
<h3>${esc(i18n.t('maintenanceChecklist'))}</h3>
<p><strong>${esc(i18n.t('documentationScore'))}:</strong> ${esc(m.score)}%</p>
<div class="score-bar"><div class="score-bar-fill" style="width:${esc(m.score)}%;background:${scoreColor}"></div></div>
<ul class="checklist">
`;
		for (const item of m.checklist) {
			const icon = item.ok ? '✅' : '⚠️';
			const label = checkLabels[item.key] || item.key;
			const badge = item.ok
				? `<span class="badge badge-ok">${esc(i18n.t('checkOk'))}</span>`
				: `<span class="badge badge-off">${esc(i18n.t('checkIssue'))} (${esc(item.count)})</span>`;
			html += `  <li>${icon} ${esc(label)} ${badge}</li>\n`;
		}
		html += `</ul>\n`;

		if (m.scriptsWithoutDescription.length > 0) {
			const swdLabel = `${esc(i18n.t('scriptsWithoutDescription'))} (${m.scriptsWithoutDescription.length})`;
			html += `<details style="margin-top:12px">
<summary class="maint-details-summary">${swdLabel}</summary>
<table style="margin-top:8px"><thead><tr><th>${esc(i18n.t('scriptName'))}</th><th>${esc(i18n.t('scriptFolder'))}</th></tr></thead><tbody>
${m.scriptsWithoutDescription.map(s => `<tr><td>${esc(s.name)}</td><td><small>${esc(this.scriptFolderLabel(s.folder, i18n))}</small></td></tr>`).join('\n')}
</tbody></table>
</details>\n`;
		}

		if (m.disabledInstances.length > 0) {
			const diLabel = `${esc(i18n.t('disabledInstancesHint'))} (${m.disabledInstances.length})`;
			html += `<details style="margin-top:12px">
<summary class="maint-details-summary">${diLabel}</summary>
<table style="margin-top:8px"><thead><tr><th>ID</th><th>${esc(i18n.t('name'))}</th></tr></thead><tbody>
${m.disabledInstances.map(inst => `<tr><td><small>${esc(inst.id)}</small></td><td>${esc(inst.title && inst.title !== inst.name ? inst.title : inst.name)}</td></tr>`).join('\n')}
</tbody></table>
</details>\n`;
		}

		if (m.checklist.every(c => c.ok)) {
			html += `<p><em>${esc(i18n.t('allGood'))}</em></p>\n`;
		}

		html += '<hr class="section-divider">\n';
		return html;
	}

	/**
	 * Render diagnosis section (Admin profile only).
	 * Contains scan statistics, concrete UI paths for troubleshooting,
	 * and data-driven findings from this scan.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} Diagnosis HTML
	 */
	renderDiagnosis(docModel) {
		const i18n = this.i18n;
		const system = docModel.system;
		const stats = system.statistics;
		const m = docModel.maintenance;
		const appendices = docModel.appendices;

		// Data-driven findings
		const findings = [];
		if (stats.disabledInstanceCount > 0) {
			findings.push(i18n.t('diagFindingDisabled', stats.disabledInstanceCount));
		}
		if (m.scriptsWithoutDescription.length > 0) {
			findings.push(i18n.t('diagFindingScripts', m.scriptsWithoutDescription.length));
		}
		// Node.js version check
		const nodeVer = docModel.system.primaryHost.nodeVersion;
		if (nodeVer) {
			const match = nodeVer.match(/v?(\d+)/);
			const major = match ? parseInt(match[1], 10) : 0;
			if (major > 0 && (major < 20 || major % 2 !== 0)) {
				findings.push(i18n.t('nodeVersionOutdated').replace('{0}', nodeVer));
			}
		}
		// OS update reminder (always shown)
		findings.push(i18n.t('osUpdateHint'));

		const findingsHtml = findings.map(f => `  <li>${esc(f)}</li>`).join('\n');

		return `<h2 id="diagnosis">${esc(i18n.t('diagnosis'))}</h2>
<h3>${esc(i18n.t('diagScanStatus'))}</h3>
<dl class="meta">
  <dt>${esc(i18n.t('collectedAt'))}</dt><dd>${esc(new Date(appendices.collectionTimestamp).toLocaleString())}</dd>
  <dt>${esc(i18n.t('instancesDetected'))}</dt><dd>${esc(stats.instanceCount)} (${esc(stats.enabledInstanceCount)} ${esc(i18n.t('diagActive'))}, ${esc(stats.disabledInstanceCount)} ${esc(i18n.t('diagInactive'))})</dd>
  <dt>${esc(i18n.t('stateObjectsScanned'))}</dt><dd>${esc(appendices.stateSummary.total)} (${esc(appendices.stateSummary.writable)} ${esc(i18n.t('writable'))}, ${esc(appendices.stateSummary.readonly)} ${esc(i18n.t('readOnlyStates'))})</dd>
  <dt>${esc(i18n.t('platform'))}</dt><dd>${esc(system.primaryHost.platform)}</dd>
  <dt>${esc(i18n.t('jsControllerVersion'))}</dt><dd>${esc(system.primaryHost.version)}</dd>
  <dt>${esc(i18n.t('nodeVersion'))}</dt><dd>${system.primaryHost.nodeVersion ? this.renderNodeVersionBadge(system.primaryHost.nodeVersion, i18n) : '—'}</dd>
  <dt>${esc(i18n.t('hosts'))}</dt><dd>${esc(system.primaryHost.name)}</dd>
</dl>
<h3>${esc(i18n.t('diagWhereToLook'))}</h3>
<table>
<thead><tr><th>${esc(i18n.t('diagWhatLabel'))}</th><th>${esc(i18n.t('diagWhereLabel'))}</th></tr></thead>
<tbody>
<tr><td>${esc(i18n.t('diagLogsLabel'))}</td><td><small>${esc(i18n.t('diagLogsValue'))}</small></td></tr>
<tr><td>${esc(i18n.t('diagAliveLabel'))}</td><td><code style="font-size:12px">system.adapter.{name}.0.alive</code> <small>${esc(i18n.t('diagAliveHint'))}</small></td></tr>
<tr><td>${esc(i18n.t('diagConnectedLabel'))}</td><td><code style="font-size:12px">system.adapter.{name}.0.connected</code> <small>${esc(i18n.t('diagConnectedHint'))}</small></td></tr>
</tbody>
</table>
<h3>${esc(i18n.t('diagFindings'))}</h3>
<ul class="content-list">
${findingsHtml}
</ul>
<hr class="section-divider">
`;
	}

	/**
	 * Render troubleshooting section (Admin profile only).
	 * Concrete scenarios with solution steps — no overlap with Diagnosis.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} Troubleshooting HTML
	 */
	renderTroubleshooting(docModel) {
		const i18n = this.i18n;
		const scripts = docModel.scripts;
		const hasJavascript = docModel.adapters.adapters.some(a => a.name === 'javascript' && a.enabledInstances > 0);

		return `<h2 id="troubleshooting">${esc(i18n.t('troubleshooting'))}</h2>
<h3>${esc(i18n.t('tsAdapterNotStarting'))}</h3>
<p style="font-size:13px;color:#555">${esc(i18n.t('tsAdapterNotStartingSymptom'))}</p>
<ol class="content-list">
  <li>${esc(i18n.t('tsAdapterNotStarting1'))}</li>
  <li>${esc(i18n.t('tsAdapterNotStarting2'))}</li>
  <li>${esc(i18n.t('tsAdapterNotStarting3'))}</li>
</ol>
<h3>${esc(i18n.t('tsAdapterNotConnected'))}</h3>
<p style="font-size:13px;color:#555">${esc(i18n.t('tsAdapterNotConnectedSymptom'))}</p>
<ol class="content-list">
  <li>${esc(i18n.t('tsAdapterNotConnected1'))}</li>
  <li>${esc(i18n.t('tsAdapterNotConnected2'))}</li>
  <li>${esc(i18n.t('tsAdapterNotConnected3'))}</li>
</ol>
${
	scripts.totalScripts > 0
		? `<h3>${esc(i18n.t('tsScriptNotRunning'))}</h3>
<p style="font-size:13px;color:#555">${esc(i18n.t('tsScriptNotRunningSymptom'))}</p>
<ol class="content-list">
  <li>${esc(i18n.t('tsScriptNotRunning1'))}</li>
  <li>${esc(!hasJavascript ? i18n.t('tsScriptNotRunning2Warn') : i18n.t('tsScriptNotRunning2'))}</li>
  <li>${esc(i18n.t('tsScriptNotRunning3'))}</li>
</ol>`
		: ''
}
<h3>${esc(i18n.t('tsDocNotGenerated'))}</h3>
<p style="font-size:13px;color:#555">${esc(i18n.t('tsDocNotGeneratedSymptom'))}</p>
<ol class="content-list">
  <li>${esc(i18n.t('tsDocNotGenerated1'))}</li>
  <li>${esc(i18n.t('tsDocNotGenerated2'))}</li>
  <li>${esc(i18n.t('tsDocNotGenerated3'))}</li>
</ol>
<hr class="section-divider">
`;
	}

	/**
	 * Render changelog chapter (Admin profile only).
	 *
	 * @param {Array} changelog Array of changelog entries
	 * @returns {string} Changelog HTML
	 */
	renderChangelogChapter(changelog) {
		const i18n = this.i18n;
		let html = `<h2 id="changelog">${esc(i18n.t('changelog'))}</h2>\n`;

		/**
		 * Build HTML for a single changelog entry card.
		 *
		 * @param {object} entry Changelog entry
		 * @returns {string} HTML
		 */
		const renderEntry = entry => {
			const date = new Date(entry.timestamp).toLocaleString();
			const trigger = entry.trigger || '—';
			let card = `<div style="margin-bottom:10px;padding:10px 14px;background:#f8f9fa;border-left:3px solid #0066cc;border-radius:0 4px 4px 0">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
    <strong style="font-size:14px">${esc(i18n.t('version'))} ${esc(entry.version)}</strong>
    <small style="color:#888">${esc(date)} &middot; ${esc(trigger)}</small>
  </div>
  <div style="font-size:13px;color:#555;margin-bottom:4px">${esc(entry.summary)}</div>`;
			if (entry.changes && entry.changes.length > 0) {
				card += `\n  <details style="margin-top:4px">
  <summary style="cursor:pointer;font-size:12px;color:#888;user-select:none">${entry.changes.length} ${esc(i18n.t('moreChanges'))}</summary>
  <ul style="margin:4px 0 0 16px;font-size:12px;color:#666">\n`;
				for (const change of entry.changes) {
					card += `    <li><span style="color:#0066cc;font-weight:600">${esc(change.type)}</span> ${esc(change.message)}</li>\n`;
				}
				card += `  </ul>\n  </details>`;
			}
			card += `\n</div>\n`;
			return card;
		};

		const VISIBLE = 5;
		const visible = changelog.slice(0, VISIBLE);
		const older = changelog.slice(VISIBLE);

		for (const entry of visible) {
			html += renderEntry(entry);
		}

		if (older.length > 0) {
			html += `<details style="margin-top:6px">
<summary class="maint-details-summary">${esc(i18n.t('olderEntries').replace('{0}', older.length))}</summary>
<div style="margin-top:8px">\n`;
			for (const entry of older) {
				html += renderEntry(entry);
			}
			html += `</div>\n</details>\n`;
		}

		html += '<hr class="section-divider">\n';
		return html;
	}

	/**
	 * Render appendices (Admin profile only).
	 *
	 * @param {object} docModel Document model
	 * @returns {string} Appendices HTML
	 */
	renderAppendices(docModel) {
		const appendices = docModel.appendices;
		const i18n = this.i18n;

		return `<h2 id="appendices">${esc(i18n.t('appendices'))}</h2>
<h3>${esc(i18n.t('stateObjectsSummary'))}</h3>
<div class="stat-grid">
  <div class="stat-card"><div class="num">${esc(appendices.stateSummary.total)}</div><div class="label">${esc(i18n.t('total'))}</div></div>
  <div class="stat-card"><div class="num">${esc(appendices.stateSummary.writable)}</div><div class="label">${esc(i18n.t('writable'))}</div></div>
  <div class="stat-card"><div class="num">${esc(appendices.stateSummary.readonly)}</div><div class="label">${esc(i18n.t('readOnly'))}</div></div>
</div>
<h3>${esc(i18n.t('collectionInformation'))}</h3>
<dl class="meta">
  <dt>${esc(i18n.t('collectedAt'))}</dt><dd>${esc(new Date(appendices.collectionTimestamp).toLocaleString())}</dd>
  <dt>${esc(i18n.t('schemaVersion'))}</dt><dd>${esc(docModel.meta.schemaVersion)}</dd>
</dl>
<hr class="section-divider">
<footer>${esc(i18n.t('generatedBy'))}${esc(docModel.meta.version)}</footer>
`;
	}
}

module.exports = HtmlRenderer;
