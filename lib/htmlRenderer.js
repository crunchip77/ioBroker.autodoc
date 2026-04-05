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
		body += this.renderMaintenanceChapter(docModel);
		if (config.manualContext) {
			body += this.renderManualContext(config.manualContext);
		}
		body += this.renderDiagnosis(docModel);
		body += this.renderTroubleshooting(docModel);
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
		if (config.manualContext) {
			body += this.renderManualContext(config.manualContext);
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

		body += this.renderOnboardingWelcome(docModel);
		if (docModel.ai) {
			body += this.renderAiSection(docModel.ai);
		}
		body += this.renderOnboardingRooms(docModel);
		body += this.renderOnboardingAutomations(docModel);
		body += this.renderAdaptersChapter(docModel, PROFILE_ONBOARDING);
		if (config.manualContext) {
			body += this.renderManualContext(config.manualContext);
		}
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
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; font-size: 15px; line-height: 1.6; color: #222; background: #f5f5f5; }
  a { color: #0066cc; text-decoration: none; }
  a:hover { text-decoration: underline; }
  #layout { display: flex; min-height: 100vh; }
  nav { width: 240px; flex-shrink: 0; background: #1a1a2e; color: #ccc; padding: 24px 16px; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
  nav h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 12px; margin-top: 20px; }
  nav h2:first-child { margin-top: 0; }
  nav ul { list-style: none; }
  nav ul li a { display: block; padding: 5px 8px; border-radius: 4px; color: #ccc; font-size: 14px; }
  nav ul li a:hover { background: rgba(255,255,255,0.1); color: #fff; text-decoration: none; }
  main { flex: 1; padding: 32px 40px; max-width: 900px; }
  h1 { font-size: 26px; margin-bottom: 8px; color: #111; }
  h2 { font-size: 20px; margin-top: 40px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #ddd; color: #111; }
  h3 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; color: #333; }
  h4 { font-size: 14px; margin-top: 16px; margin-bottom: 6px; color: #444; }
  .meta { background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 14px 18px; margin: 16px 0 24px; display: grid; grid-template-columns: auto 1fr; gap: 4px 16px; font-size: 14px; }
  .meta dt { font-weight: 600; color: #555; }
  .meta dd { color: #222; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 14px; background: #fff; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  th { background: #f0f0f0; text-align: left; padding: 8px 12px; font-weight: 600; color: #444; }
  td { padding: 7px 12px; border-top: 1px solid #eee; }
  tr:hover td { background: #fafafa; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; }
  .badge-ok { background: #d4edda; color: #155724; }
  .badge-off { background: #f8d7da; color: #721c24; }
  .badge-meta { background: #e8f0fe; color: #1a56db; font-weight: 500; }
  .adapter-meta { display: inline-flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
  .manual-context-box { background: #fff8e1; border-left: 3px solid #f0b429; padding: 6px 10px; margin-top: 8px; border-radius: 3px; font-size: 13px; color: #555; }
  .manual-context-note { display: block; background: #fff8e1; border-left: 3px solid #f0b429; padding: 4px 8px; margin-top: 4px; border-radius: 3px; font-size: 12px; color: #555; }
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin: 16px 0; }
  .stat-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 14px 16px; }
  .stat-card .num { font-size: 28px; font-weight: 700; color: #0066cc; }
  .stat-card .label { font-size: 12px; color: #666; margin-top: 2px; }
  .section-divider { border: none; border-top: 1px solid #e0e0e0; margin: 32px 0; }
  ul.content-list { padding-left: 20px; margin: 8px 0; }
  ul.content-list li { margin: 4px 0; }
  .note-box { background: #fff8e1; border-left: 4px solid #ffc107; padding: 12px 16px; border-radius: 0 6px 6px 0; margin: 12px 0; font-size: 14px; }
  .adapter-list { display: flex; flex-direction: column; gap: 12px; margin: 16px 0; }
  .adapter-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 14px 18px; }
  .adapter-card-inactive { opacity: 0.6; }
  .adapter-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .adapter-desc { margin: 4px 0 6px; color: #444; font-size: 14px; }
  .adapter-status-note { color: #888; font-size: 12px; }
  footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888; }
  .score-bar { background: #e0e0e0; border-radius: 8px; height: 12px; margin: 8px 0 16px; overflow: hidden; }
  .score-bar-fill { height: 100%; border-radius: 8px; background: #28a745; transition: width 0.3s; }
  .checklist { list-style: none; padding: 0; margin: 0 0 16px; }
  .checklist li { padding: 6px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; display: flex; align-items: center; gap: 8px; }
  .checklist li:last-child { border-bottom: none; }
  .search-wrap { margin-bottom: 20px; }
  .search-wrap input { width: 100%; padding: 7px 10px; border-radius: 4px; border: none; background: rgba(255,255,255,0.12); color: #fff; font-size: 13px; outline: none; }
  .search-wrap input::placeholder { color: #888; }
  .search-wrap input:focus { background: rgba(255,255,255,0.2); }
  .search-count { font-size: 11px; color: #666; margin-top: 4px; }
  .filter-hidden { display: none !important; }
  .no-results { display: none; padding: 8px 0; color: #888; font-size: 13px; font-style: italic; }
  .ai-box { background: #f0f7ff; border: 1px solid #b3d1f5; border-radius: 8px; padding: 18px 22px; margin: 0 0 28px; }
  .ai-box-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #0066cc; margin-bottom: 8px; }
  .ai-narrative { font-size: 15px; color: #222; line-height: 1.7; margin-bottom: 12px; }
  .ai-recommendations { font-size: 14px; color: #333; line-height: 1.6; white-space: pre-line; }
  .ai-recommendations ul, .ai-recommendations-list { padding-left: 18px; margin: 4px 0; }
  .ai-recommendations-list li { margin: 3px 0; }
  .device-grid { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0 16px; }
  .device-card { display: flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 8px 12px; font-size: 14px; }
  .device-icon { font-size: 18px; line-height: 1; }
  .device-name { color: #222; }
  .adapter-filter-bar { display: flex; align-items: center; gap: 10px; margin: 8px 0 12px; }
  .adapter-filter-bar input { padding: 5px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; width: 260px; }
  .adapter-filter-bar input:focus { outline: none; border-color: #0066cc; }
  #adapter-filter-count { font-size: 12px; color: #888; }
  .adapter-disabled-summary { cursor: pointer; font-size: 14px; color: #666; padding: 6px 0; user-select: none; }
  .adapter-disabled-summary:hover { color: #333; }
</style>
</head>
<body>
<div id="layout">
<nav>
<div class="search-wrap">
  <input type="search" id="doc-search" placeholder="${esc(this.i18n.t('filterPlaceholder'))}" autocomplete="off" aria-label="Filter documentation">
  <div class="search-count" id="search-count"></div>
</div>
${nav}
</nav>
<main>
${body}
</main>
</div>
<script>
(function () {
  var input = document.getElementById('doc-search');
  var countEl = document.getElementById('search-count');
  if (!input) return;

  function getFilterables() {
    // table rows in tbody
    var rows = Array.from(document.querySelectorAll('tbody tr'));
    // adapter cards
    var cards = Array.from(document.querySelectorAll('.adapter-card'));
    return rows.concat(cards);
  }

  function applyFilter() {
    var term = input.value.trim().toLowerCase();
    var items = getFilterables();
    if (!term) {
      items.forEach(function (el) { el.classList.remove('filter-hidden'); });
      countEl.textContent = '';
      document.querySelectorAll('.no-results').forEach(function (n) { n.style.display = 'none'; });
      return;
    }
    var visible = 0;
    items.forEach(function (el) {
      var text = el.textContent.toLowerCase();
      var match = text.indexOf(term) !== -1;
      el.classList.toggle('filter-hidden', !match);
      if (match) visible++;
    });
    countEl.textContent = visible + ' result' + (visible !== 1 ? 's' : '');

    // show/hide no-results notices per table / card list
    document.querySelectorAll('tbody').forEach(function (tbody) {
      var visRows = tbody.querySelectorAll('tr:not(.filter-hidden)');
      var notice = tbody.closest('table').nextElementSibling;
      if (notice && notice.classList.contains('no-results')) {
        notice.style.display = visRows.length === 0 ? 'block' : 'none';
      }
    });
    document.querySelectorAll('.adapter-list').forEach(function (list) {
      var visCards = list.querySelectorAll('.adapter-card:not(.filter-hidden)');
      var notice = list.nextElementSibling;
      if (notice && notice.classList.contains('no-results')) {
        notice.style.display = visCards.length === 0 ? 'block' : 'none';
      }
    });
  }

  input.addEventListener('input', applyFilter);
  // clear on Escape
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { input.value = ''; applyFilter(); }
  });
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

		let html = `<h2 id="rooms-and-functions">${esc(i18n.t('roomsAndFunctions'))}</h2>\n`;

		if (!roomsData || roomsData.totalRooms === 0) {
			html += `<p><em>${esc(i18n.t('noRoomsDefined'))}</em></p>\n`;
			html += '<hr class="section-divider">\n';
			return html;
		}

		for (const room of roomsData.rooms) {
			html += `<h3>${esc(room.name)}</h3>\n`;
			const devices = room.devices || [];
			if (devices.length === 0) {
				html += `<p style="color:#888;font-size:14px"><em>${esc(i18n.t('noDevicesInRoom'))}</em></p>\n`;
			} else {
				html += `<div class="device-grid">\n`;
				for (const dev of devices) {
					const liveHtml = this._renderLiveValue(dev);
					const roomNote =
						docModel.manualContext &&
						docModel.manualContext.rooms &&
						docModel.manualContext.rooms[room.name]
							? `<div class="manual-context-note">${esc(docModel.manualContext.rooms[room.name])}</div>`
							: '';
					html += `<div class="device-card">
  <span class="device-icon">${esc(dev.icon || '📦')}</span>
  <span class="device-name">${esc(dev.deviceName)}</span>${liveHtml}
</div>\n`;
					void roomNote;
				}
				html += `</div>\n`;
			}
			if (docModel.manualContext && docModel.manualContext.rooms && docModel.manualContext.rooms[room.name]) {
				html += `<div class="manual-context-box">${esc(docModel.manualContext.rooms[room.name])}</div>\n`;
			}
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

		const active = adapters.adapters.filter(a => a.enabledInstances > 0);
		let html = `<h2 id="adapter-instances">${esc(i18n.t('connectedSystems'))}</h2>\n`;
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

		return `<h1>${esc(greeting)}</h1>
<p style="font-size:16px;color:#444;margin:12px 0 24px">${esc(i18n.t('onboardingIntro'))}</p>
<div class="stat-grid">
  <div class="stat-card"><div class="num">${esc(docModel.rooms ? docModel.rooms.totalRooms : 0)}</div><div class="label">${esc(i18n.t('rooms'))}</div></div>
  <div class="stat-card"><div class="num">${esc(docModel.system.statistics.enabledInstanceCount)}</div><div class="label">${esc(i18n.t('activeAdapters'))}</div></div>
</div>
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

		let html = `<h2 id="rooms">${esc(i18n.t('yourRooms'))}</h2>\n`;

		if (!roomsData || roomsData.totalRooms === 0) {
			html += `<p><em>${esc(i18n.t('noRoomsDefined'))}</em></p>\n`;
			html += '<hr class="section-divider">\n';
			return html;
		}

		for (const room of roomsData.rooms) {
			html += `<h3>${esc(room.name)}</h3>\n`;
			const devices = room.devices || [];
			if (devices.length === 0) {
				html += `<p style="color:#888;font-size:14px"><em>${esc(i18n.t('noDevicesInRoom'))}</em></p>\n`;
			} else {
				html += `<div class="device-grid">\n`;
				for (const dev of devices) {
					const liveHtml = this._renderLiveValue(dev);
					html += `<div class="device-card">
  <span class="device-icon">${esc(dev.icon || '📦')}</span>
  <span class="device-name">${esc(dev.deviceName)}</span>${liveHtml}
</div>\n`;
				}
				html += `</div>\n`;
			}
			if (docModel.manualContext && docModel.manualContext.rooms && docModel.manualContext.rooms[room.name]) {
				html += `<div class="manual-context-box">${esc(docModel.manualContext.rooms[room.name])}</div>\n`;
			}
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
		if (active.length === 0) {
			return '';
		}

		let html = `<h2 id="automations">${esc(i18n.t('whatRunsAutomatically'))}</h2>\n`;
		html += `<p style="font-size:14px;color:#555;margin-bottom:12px">${esc(i18n.t('automationsIntro'))}</p>\n`;
		html += `<ul class="content-list">\n`;
		for (const script of active) {
			const label = script.desc ? `${esc(script.name)} — ${esc(script.desc)}` : esc(script.name);
			html += `  <li>${label}</li>\n`;
		}
		html += `</ul>\n<hr class="section-divider">\n`;
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
		const hasManual = config.manualContext && (config.manualContext.description || config.manualContext.notes);
		const hasAi = !!docModel.ai;
		if (hasManual || hasAi) {
			return '';
		}

		return `<div class="note-box" style="margin-top:24px">
  <strong>${esc(i18n.t('onboardingHintTitle'))}</strong><br>
  ${esc(i18n.t('onboardingHintText'))}
</div>\n`;
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
			links = `<li><a href="#rooms">${esc(i18n.t('yourRooms'))}</a></li>
<li><a href="#automations">${esc(i18n.t('whatRunsAutomatically'))}</a></li>
<li><a href="#adapter-instances">${esc(i18n.t('connectedSystems'))}</a></li>
<li><a href="#manual-information">${esc(i18n.t('manualInformation'))}</a></li>`;
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
<li><a href="#maintenance">${esc(i18n.t('maintenance'))}</a></li>
<li><a href="#manual-information">${esc(i18n.t('manualInformation'))}</a></li>
<li><a href="#diagnosis">${esc(i18n.t('diagnosis'))}</a></li>
<li><a href="#troubleshooting">${esc(i18n.t('troubleshooting'))}</a></li>
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

		return `<h1>${esc(i18n.t('projectDocumentation', config.projectName || 'ioBroker System'))}</h1>
<dl class="meta">
  <dt>${esc(i18n.t('generated'))}</dt><dd>${esc(new Date(docModel.meta.generatedAt).toLocaleString())}</dd>
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
		}

		html += `</div>
`;

		if (this.shouldShowDetail(profile, 'admin') && system.hosts.length > 0) {
			html += `<h3>${esc(i18n.t('hosts'))}</h3>
<table>
<thead><tr><th>${esc(i18n.t('name'))}</th><th>${esc(i18n.t('platform'))}</th><th>${esc(i18n.t('version'))}</th><th>${esc(i18n.t('nodeVersion'))}</th><th>${esc(i18n.t('osKernel'))}</th></tr></thead>
<tbody>
${system.hosts
	.map(
		h => `<tr>
  <td>${esc(h.name)}</td>
  <td>${esc(h.platform)}</td>
  <td>${esc(h.version)}</td>
  <td>${h.nodeVersion ? this.renderNodeVersionBadge(h.nodeVersion, i18n) : '—'}</td>
  <td><small>${esc([h.osType, h.osRelease, h.osArch].filter(Boolean).join(' · '))}</small></td>
</tr>`,
	)
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
			// Onboarding: friendly cards for active adapters only
			html += `<div class="adapter-list">\n`;
			for (const adapter of adapters.adapters) {
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
			html += `<h3>${esc(i18n.t('rooms'))}</h3>
<table>
<thead><tr><th>${esc(i18n.t('name'))}</th><th>${esc(i18n.t('memberCount'))}</th>${profile === PROFILE_ADMIN ? `<th>${esc(i18n.t('members'))}</th>` : ''}</tr></thead>
<tbody>
`;
			for (const room of roomsData.rooms) {
				let membersCell = '';
				if (profile === PROFILE_ADMIN && room.devices.length > 0) {
					membersCell = room.devices
						.map(m => {
							const fnText =
								m.functions.length > 0
									? ` <small style="color:#888">(${esc(m.functions.join(', '))})</small>`
									: '';
							return `<small>${esc(m.id)}${fnText}</small>`;
						})
						.join('<br>');
				}
				html += `<tr>
  <td><strong>${esc(room.name)}</strong></td>
  <td>${esc(room.memberCount)}</td>
  ${profile === PROFILE_ADMIN ? `<td>${membersCell || '—'}</td>` : ''}
</tr>\n`;
			}
			html += `</tbody>\n</table>\n<p class="no-results">${esc(i18n.t('noRoomsMatch'))}</p>\n`;

			// 4.7: Admin device hierarchy (resolved names + OIDs)
			if (profile === PROFILE_ADMIN) {
				const roomsWithDevices = roomsData.rooms.filter(r => r.devices && r.devices.length > 0);
				if (roomsWithDevices.length > 0) {
					html += `<h3>${esc(i18n.t('deviceHierarchy'))}</h3>\n`;
					for (const room of roomsWithDevices) {
						html += `<h4>${esc(room.name)}</h4>\n`;
						html += `<table>\n<thead><tr><th>${esc(i18n.t('name'))}</th><th>${esc(i18n.t('category'))}</th><th>OID</th></tr></thead>\n<tbody>\n`;
						for (const dev of room.devices) {
							const liveHtml = this._renderLiveValue(dev);
							html += `<tr>
  <td>${esc(dev.icon || '')} ${esc(dev.deviceName)}${liveHtml}</td>
  <td><small>${esc(dev.category || dev.role || '—')}</small></td>
  <td><code style="font-size:11px;color:#888">${esc(dev.id)}</code></td>
</tr>\n`;
						}
						html += `</tbody>\n</table>\n`;
					}
				}
			}

			if (profile === PROFILE_ADMIN && roomsData.functions.length > 0) {
				html += `<h3>${esc(i18n.t('functions'))}</h3>
<table>
<thead><tr><th>${esc(i18n.t('name'))}</th><th>${esc(i18n.t('memberCount'))}</th></tr></thead>
<tbody>
${roomsData.functions.map(fn => `<tr><td>${esc(fn.name)}</td><td>${esc(fn.memberCount)}</td></tr>`).join('\n')}
</tbody>
</table>
<p class="no-results">${esc(i18n.t('noFunctionsMatch'))}</p>
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
				const nameCell = script.folder
					? `${esc(script.name)}<br><small style="color:#888">${esc(script.folder)}</small>`
					: esc(script.name);

				html += `<tr>
  <td>${nameCell}</td>
  <td><span class="badge ${active ? 'badge-ok' : 'badge-off'}">${esc(active ? i18n.t('active') : i18n.t('inactive'))}</span></td>
  <td><small>${esc(script.triggerType)}</small></td>
  <td><small>${esc(script.desc || '—')}</small></td>
</tr>\n`;
			}
			html += `</tbody>\n</table>\n<p class="no-results">${esc(i18n.t('noScriptsMatch'))}</p>\n`;

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
						const nameCell = script.folder
							? `${esc(script.name)}<br><small style="color:#888">${esc(script.folder)}</small>`
							: esc(script.name);
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
	 *
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
			html += `<h3>${esc(i18n.t('scriptsWithoutDescription'))}</h3>
<table><thead><tr><th>${esc(i18n.t('scriptName'))}</th><th>${esc(i18n.t('scriptFolder'))}</th></tr></thead><tbody>
${m.scriptsWithoutDescription.map(s => `<tr><td>${esc(s.name)}</td><td><small>${esc(s.folder || '—')}</small></td></tr>`).join('\n')}
</tbody></table>\n`;
		}

		if (m.disabledInstances.length > 0) {
			html += `<h3>${esc(i18n.t('disabledInstancesHint'))}</h3>
<table><thead><tr><th>ID</th><th>${esc(i18n.t('name'))}</th></tr></thead><tbody>
${m.disabledInstances.map(inst => `<tr><td><small>${esc(inst.id)}</small></td><td>${esc(inst.title && inst.title !== inst.name ? inst.title : inst.name)}</td></tr>`).join('\n')}
</tbody></table>\n`;
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
  <dt>${esc(i18n.t('nodeVersion'))}</dt><dd>${esc(system.primaryHost.version)}</dd>
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
