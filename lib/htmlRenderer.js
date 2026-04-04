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
	 *
	 * @param {object} docModel Document model
	 * @returns {string} HTML content
	 */
	renderHtml(docModel) {
		const config = this.adapter.config;
		const profile = config.profile || PROFILE_ADMIN;
		const title = esc(this.i18n.t('projectDocumentation', config.projectName || 'ioBroker System'));

		const nav = this.renderNav(profile);
		let body = '';

		body += this.renderHeader(docModel, profile);

		if (profile === PROFILE_ONBOARDING) {
			body += this.renderQuickStart(docModel);
		}

		body += this.renderSystemChapter(docModel, profile);
		body += this.renderAdaptersChapter(docModel, profile);

		if (profile !== PROFILE_ONBOARDING) {
			body += this.renderRoomsChapter(docModel, profile);
		}

		if (profile !== PROFILE_ONBOARDING) {
			body += this.renderScriptsChapter(docModel, profile);
		}

		if (config.manualContext) {
			body += this.renderManualContext(config.manualContext);
		}

		if (profile !== PROFILE_ONBOARDING) {
			body += this.renderTroubleshooting(docModel, profile);
		}

		if (profile === PROFILE_ADMIN) {
			body += this.renderAppendices(docModel);
		}

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
</style>
</head>
<body>
<div id="layout">
<nav>
${nav}
</nav>
<main>
${body}
</main>
</div>
</body>
</html>`;
	}

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
			links = `<li><a href="#quick-start">Quick Start</a></li>
<li><a href="#system-overview">${esc(i18n.t('systemOverview'))}</a></li>
<li><a href="#adapter-instances">${esc(i18n.t('adapterInstances'))}</a></li>
<li><a href="#manual-information">${esc(i18n.t('manualInformation'))}</a></li>`;
		} else if (profile === PROFILE_USER) {
			links = `<li><a href="#system-overview">${esc(i18n.t('systemOverview'))}</a></li>
<li><a href="#adapter-instances">${esc(i18n.t('adapterInstances'))}</a></li>
<li><a href="#rooms-and-functions">${esc(i18n.t('roomsAndFunctions'))}</a></li>
<li><a href="#scripts">${esc(i18n.t('scripts'))}</a></li>
<li><a href="#manual-information">${esc(i18n.t('manualInformation'))}</a></li>
<li><a href="#troubleshooting">Troubleshooting</a></li>`;
		} else {
			links = `<li><a href="#system-overview">${esc(i18n.t('systemOverview'))}</a></li>
<li><a href="#adapter-instances">${esc(i18n.t('adapterInstances'))}</a></li>
<li><a href="#rooms-and-functions">${esc(i18n.t('roomsAndFunctions'))}</a></li>
<li><a href="#scripts">${esc(i18n.t('scripts'))}</a></li>
<li><a href="#manual-information">${esc(i18n.t('manualInformation'))}</a></li>
<li><a href="#troubleshooting">Troubleshooting</a></li>
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
	 * Render Quick Start section for Onboarding profile.
	 *
	 * @param {object} docModel Document model
	 * @returns {string} Quick start HTML
	 */
	renderQuickStart(docModel) {
		const system = docModel.system;
		return `<h2 id="quick-start">Quick Start</h2>
<p>Welcome to your ioBroker documentation! Here's what you need to know:</p>
<div class="stat-grid">
  <div class="stat-card"><div class="num">${esc(system.statistics.enabledInstanceCount)}</div><div class="label">Active Adapters</div></div>
  <div class="stat-card"><div class="num">${esc(system.statistics.instanceCount)}</div><div class="label">Total Instances</div></div>
</div>
<h3>Next Steps</h3>
<ul class="content-list">
  <li>Review your installed adapters below</li>
  <li>Check the manual information section for guidance</li>
  <li>Most adapters run automatically — no configuration needed</li>
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
<thead><tr><th>${esc(i18n.t('name'))}</th><th>${esc(i18n.t('platform'))}</th><th>${esc(i18n.t('version'))}</th><th>Adapters</th></tr></thead>
<tbody>
${system.hosts.map(h => `<tr><td>${esc(h.name)}</td><td>${esc(h.platform)}</td><td>${esc(h.version)}</td><td>${esc(h.adapterCount)}</td></tr>`).join('\n')}
</tbody>
</table>
`;
		}

		html += '<hr class="section-divider">\n';
		return html;
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
			// Admin: table with technical details
			html += `<h3>${esc(i18n.t('adapterDetails'))}</h3>
<table>
<thead><tr><th>${esc(i18n.t('name'))}</th><th>Description</th><th>${esc(i18n.t('totalInstances'))}</th><th>${esc(i18n.t('enabledInstances'))}</th></tr></thead>
<tbody>
`;
			for (const adapter of adapters.adapters) {
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

				html += `<tr>
  <td>${displayName}${instanceDetails ? `<br>${instanceDetails}` : ''}</td>
  <td><small>${esc(adapter.desc || '—')}</small></td>
  <td>${esc(adapter.totalInstances)}</td>
  <td>${esc(adapter.enabledInstances)}</td>
</tr>\n`;
			}
			html += `</tbody>\n</table>\n`;
		} else if (profile === PROFILE_USER) {
			// User: card-style list, only active adapters, description prominent
			html += `<div class="adapter-list">\n`;
			for (const adapter of adapters.adapters) {
				if (adapter.enabledInstances === 0) {
					continue;
				}
				const displayName = adapter.title && adapter.title !== adapter.name ? adapter.title : adapter.name;
				html += `<div class="adapter-card">
  <div class="adapter-card-header">
    <strong>${esc(displayName)}</strong>
    <span class="badge badge-ok">${esc(i18n.t('enabled'))}</span>
  </div>
  ${adapter.desc ? `<p class="adapter-desc">${esc(adapter.desc)}</p>` : ''}
</div>\n`;
			}
			html += `</div>\n`;
		} else if (profile === PROFILE_ONBOARDING) {
			// Onboarding: friendly cards for active adapters only
			html += `<div class="adapter-list">\n`;
			for (const adapter of adapters.adapters) {
				const displayName = adapter.title && adapter.title !== adapter.name ? adapter.title : adapter.name;
				const active = adapter.enabledInstances > 0;
				const statusText = active ? 'Runs automatically — no action needed' : 'Currently inactive';
				html += `<div class="adapter-card ${active ? '' : 'adapter-card-inactive'}">
  <div class="adapter-card-header">
    <strong>${esc(displayName)}</strong>
    <span class="badge ${active ? 'badge-ok' : 'badge-off'}">${active ? 'Active' : 'Inactive'}</span>
  </div>
  ${adapter.desc ? `<p class="adapter-desc">${esc(adapter.desc)}</p>` : ''}
  <small class="adapter-status-note">${esc(statusText)}</small>
</div>\n`;
			}
			html += `</div>\n`;
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
<thead><tr><th>${esc(i18n.t('name'))}</th><th>${esc(i18n.t('memberCount'))}</th>${profile === PROFILE_ADMIN ? '<th>Members</th>' : ''}</tr></thead>
<tbody>
`;
			for (const room of roomsData.rooms) {
				let membersCell = '';
				if (profile === PROFILE_ADMIN && room.members.length > 0) {
					membersCell = room.members
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
			html += `</tbody>\n</table>\n`;

			if (profile === PROFILE_ADMIN && roomsData.functions.length > 0) {
				html += `<h3>${esc(i18n.t('functions'))}</h3>
<table>
<thead><tr><th>${esc(i18n.t('name'))}</th><th>${esc(i18n.t('memberCount'))}</th></tr></thead>
<tbody>
${roomsData.functions.map(fn => `<tr><td>${esc(fn.name)}</td><td>${esc(fn.memberCount)}</td></tr>`).join('\n')}
</tbody>
</table>
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
			html += `</tbody>\n</table>\n`;
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
	 * Render troubleshooting section.
	 *
	 * @param {object} docModel Document model
	 * @param {string} profile Documentation profile
	 * @returns {string} Troubleshooting HTML
	 */
	renderTroubleshooting(docModel, profile) {
		if (profile === PROFILE_ONBOARDING) {
			return '';
		}

		const i18n = this.i18n;
		const system = docModel.system;

		let html = `<h2 id="troubleshooting">Troubleshooting</h2>
<h3>Common Issues</h3>
<h4>Adapter not responding</h4>
<ul class="content-list">
  <li>Check adapter is enabled in the Adapters section above</li>
  <li>Verify the primary host <strong>${esc(system.primaryHost.name)}</strong> is running</li>
  <li>Check system resources (CPU, Memory, Disk Space)</li>
</ul>
<h4>State Objects not updating</h4>
<ul class="content-list">
  <li>Verify the adapter instance is enabled</li>
  <li>Check adapter configuration and logs</li>
  <li>Look for any error messages in the ioBroker admin panel</li>
</ul>
`;

		if (profile === PROFILE_ADMIN) {
			html += `<h4>Collector Status</h4>
<dl class="meta">
  <dt>Instances detected</dt><dd>${esc(docModel.system.statistics.instanceCount)}</dd>
  <dt>State objects scanned</dt><dd>${esc(docModel.appendices.stateSummary.total)}</dd>
  <dt>${esc(i18n.t('totalStateObjects'))}</dt><dd>${esc(docModel.appendices.stateSummary.total)}</dd>
  <dt>${esc(i18n.t('writableStates'))}</dt><dd>${esc(docModel.appendices.stateSummary.writable)}</dd>
  <dt>${esc(i18n.t('readOnlyStates'))}</dt><dd>${esc(docModel.appendices.stateSummary.readonly)}</dd>
  <dt>Platform</dt><dd>${esc(system.primaryHost.platform)}</dd>
  <dt>Node Version</dt><dd>${esc(system.primaryHost.version)}</dd>
</dl>
`;
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
