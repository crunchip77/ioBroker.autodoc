/**
 * AutoDoc Document Model Module
 * Builds structured document models from raw system data
 */
const { extractStateRefs, buildCrossRef } = require('./dependencyAnalyzer');
const { formatOperatingSystemLine } = require('./hostDisplay');
const { mapRole } = require('./roleMapper');
const {
	parseAdminHiddenChapters,
	parseAdminChapterOrder,
	parseUserChapterOrder,
	parseOnboardingChapterOrder,
	parseCustomDocSections,
	parseUserHiddenChapters,
	parseOnboardingHiddenChapters,
} = require('./docTemplateConfig');
const { buildQuickStartGuide } = require('./quickStartGuide');
const { buildAutoHostTopologyMermaid } = require('./autoHostTopologyMermaid');

// Default minimum trimmed length for project description (overridable via config).
const DEFAULT_MIN_PROJECT_DESCRIPTION_CHARS = 40;
// Default: checklist fails when unassigned instance count is >= this value.
// 30 is a realistic baseline — most installations have ~15-20 infrastructure
// adapters (admin, backitup, discovery, javascript, influxdb …) that never
// need room assignments; anything below that threshold is too strict.
const DEFAULT_UNASSIGNED_INSTANCE_WARN_AT = 30;
/** Cap for owner-supplied Mermaid source (`manualMermaidDiagram`) — keeps exports bounded. */
const MAX_MANUAL_MERMAID_CHARS = 12000;

/**
 * @param {Array<{ok: boolean}>} checks
 * @returns {number} 0–100 percentage of passing checks (100 when list is empty)
 */
function scorePercent(checks) {
	return checks.length > 0 ? Math.round((checks.filter(c => c.ok).length / checks.length) * 100) : 100;
}

/**
 * @param {unknown} value Raw native config value
 * @param {number} fallback Used when `value` is not a finite integer
 * @param {number} min Inclusive lower bound
 * @param {number} max Inclusive upper bound
 * @returns {number} Integer clamped to [min, max] or `fallback`
 */
function clampConfigInt(value, fallback, min, max) {
	const n = parseInt(String(value), 10);
	if (!Number.isFinite(n)) {
		return fallback;
	}
	return Math.min(max, Math.max(min, n));
}

/**
 * Document model builder class.
 */
class DocumentModel {
	/**
	 * @param {object} adapter ioBroker adapter instance
	 */
	constructor(adapter) {
		this.adapter = adapter;
	}

	/**
	 * Build complete document model from raw data
	 *
	 * @param {object} rawData Raw system data
	 * @param {string} trigger Generation trigger
	 * @param {{ publicDocUrls?: { admin?: string, user?: string, onboarding?: string } }} [options] Pre-built public URLs (same as HTML/QR) for hybrid troubleshooting links.
	 * @returns {Promise<object>} Document model
	 */
	async buildDocumentModel(rawData, trigger, options = {}) {
		const config = this.adapter.config;

		// Parse manual context first — maintenance checklist uses it (public links merged below).
		const manualContext = this.parseManualContext(config);
		const pub = options && options.publicDocUrls;
		if (pub && (pub.user || pub.onboarding || pub.admin)) {
			manualContext.troubleshootPublicLinks = {
				admin: (pub.admin && String(pub.admin).trim()) || '',
				user: (pub.user && String(pub.user).trim()) || '',
				onboarding: (pub.onboarding && String(pub.onboarding).trim()) || '',
			};
		} else {
			manualContext.troubleshootPublicLinks = { admin: '', user: '', onboarding: '' };
		}

		// Filter instances based on configuration
		const filteredInstances = this.filterInstances(rawData.instances, config);

		// Build system information
		const systemInfo = this.buildSystemInfo(rawData, filteredInstances);

		// Build adapter information
		const adapterInfo = this.buildAdapterInfo(filteredInstances);

		manualContext.autoHostTopologyMermaid = buildAutoHostTopologyMermaid(adapterInfo.hosts, {
			enabled: config.autoMermaidHostGraph === true,
			maxNodes: clampConfigInt(config.autoMermaidHostGraphMaxNodes, 40, 8, 80),
		});

		// Build rooms and functions
		const rooms = this.buildRooms(rawData, rawData.deviceMap || {}, rawData.liveStates || {});

		// Build scripts section
		const scripts = this.buildScripts(rawData);

		// Build maintenance (checklist uses rooms + manualContext + config + rawData for host check)
		const maintenance = this.buildMaintenance(filteredInstances, rooms, scripts, manualContext, config, rawData);

		// Build appendices
		const appendices = this.buildAppendices(rawData, filteredInstances);

		// Build metadata
		const meta = this.buildMetadata(trigger);

		const quickStart = buildQuickStartGuide(rooms, scripts);

		return {
			meta,
			system: systemInfo,
			adapters: adapterInfo,
			rooms,
			scripts,
			quickStart,
			maintenance,
			appendices,
			systemConfig: this.buildSystemConfig(rawData),
			manualContext,
			userData: rawData.userData || [],
			aliases: rawData.aliases || [],
			scheduleObjects: rawData.scheduleObjects || [],
			adminHiddenChapters: parseAdminHiddenChapters(config),
			adminChapterOrder: parseAdminChapterOrder(config),
			userHiddenChapters: parseUserHiddenChapters(config),
			userChapterOrder: parseUserChapterOrder(config),
			onboardingHiddenChapters: parseOnboardingHiddenChapters(config),
			onboardingChapterOrder: parseOnboardingChapterOrder(config),
			customDocSections: parseCustomDocSections(config),
			// Non-rendered config reference used by AI enhancer for owner hints prompt injection
			_adapterConfig: { aiOwnerHints: config.aiOwnerHints || '' },
		};
	}

	/**
	 * Filter adapter instances based on configuration
	 *
	 * @param {Array} instances Raw instances
	 * @param {object} config Adapter configuration
	 * @returns {Array} Filtered instances
	 */
	filterInstances(instances, config) {
		let filtered = instances;

		// Filter by enabled status
		if (config.onlyEnabledInstances) {
			filtered = filtered.filter(instance => instance.enabled);
		}

		// Limit number of instances
		if (config.maxDocumentedInstances && config.maxDocumentedInstances > 0) {
			filtered = filtered.slice(0, config.maxDocumentedInstances);
		}

		return filtered;
	}

	/**
	 * Build system information section
	 *
	 * @param {object} rawData Raw system data
	 * @param {Array} instances Filtered instances
	 * @returns {object} System information
	 */
	buildSystemInfo(rawData, instances) {
		const primaryHost = rawData.hosts[0] || {};

		return {
			projectName: this.adapter.config.projectName || 'ioBroker System',
			targetSystem: this.adapter.config.targetSystem || 'Production',
			primaryHost: {
				name: primaryHost.name || 'Unknown',
				platform: primaryHost.platform || 'Unknown',
				version: primaryHost.version || 'Unknown',
				nodeVersion: primaryHost.nodeVersion || '',
				npmVersion: primaryHost.npmVersion || '',
				osRelease: primaryHost.osRelease || '',
				osArch: primaryHost.osArch || '',
				osType: primaryHost.osType || '',
				operatingSystem: formatOperatingSystemLine(primaryHost),
			},
			hosts: rawData.hosts,
			hostResources: rawData.hostResources || {},
			location: {
				city: (rawData.systemConfig && rawData.systemConfig.city) || '',
				country: (rawData.systemConfig && rawData.systemConfig.country) || '',
				timezone: (rawData.systemConfig && rawData.systemConfig.timezone) || '',
				latitude: (rawData.systemConfig && rawData.systemConfig.latitude) || null,
				longitude: (rawData.systemConfig && rawData.systemConfig.longitude) || null,
				activeRepo: (rawData.systemConfig && rawData.systemConfig.activeRepo) || '',
			},
			statistics: {
				instanceCount: instances.length,
				enabledInstanceCount: instances.filter(i => i.enabled).length,
				disabledInstanceCount: instances.filter(i => !i.enabled).length,
				totalStateObjects: rawData.stateSummary.total,
				writableStateObjects: rawData.stateSummary.writable,
				readonlyStateObjects: rawData.stateSummary.readonly,
				pendingUpdates: rawData.pendingUpdates || 0,
				lastBackup: rawData.lastBackup || null,
			},
		};
	}

	/**
	 * Build adapter information section
	 *
	 * @param {Array} instances Filtered instances
	 * @returns {object} Adapter information
	 */
	buildAdapterInfo(instances) {
		// Group instances by adapter
		const adapters = {};
		const hosts = {};

		for (const instance of instances) {
			// Group by adapter
			if (!adapters[instance.adapter]) {
				adapters[instance.adapter] = {
					name: instance.adapter,
					title: instance.title || instance.adapter,
					desc: instance.desc || '',
					instances: [],
					totalInstances: 0,
					enabledInstances: 0,
					connectionType: instance.connectionType || '',
					dataSource: instance.dataSource || '',
					tier: instance.tier || 0,
				};
			}

			adapters[instance.adapter].instances.push(instance);
			adapters[instance.adapter].totalInstances++;

			if (instance.enabled) {
				adapters[instance.adapter].enabledInstances++;
			}

			// Group by host
			if (!hosts[instance.host]) {
				hosts[instance.host] = [];
			}
			hosts[instance.host].push(instance);
		}

		return {
			adapters: Object.values(adapters),
			hosts,
			totalAdapters: Object.keys(adapters).length,
		};
	}

	/**
	 * Build rooms section with member counts and function assignments
	 *
	 * @param {object} rawData Raw system data
	 * @param {object} deviceMap Map of device data keyed by state ID
	 * @param {object} liveStates Map of live state values keyed by state ID
	 * @returns {object} Rooms section
	 */
	buildRooms(rawData, deviceMap, liveStates) {
		const rooms = rawData.rooms || [];
		const functions = rawData.functions || [];

		// Build a map: memberId → [functionName, ...]
		const memberFunctions = {};
		for (const fn of functions) {
			for (const memberId of fn.members) {
				if (!memberFunctions[memberId]) {
					memberFunctions[memberId] = [];
				}
				memberFunctions[memberId].push(fn.name);
			}
		}

		const roomList = rooms.map(room => ({
			id: room.id,
			name: room.name,
			memberCount: room.members.length,
			devices: room.members.map(memberId => {
				const device = deviceMap[memberId];
				const live = liveStates[memberId];
				const roleInfo = mapRole(device ? device.role : '');
				return {
					id: memberId,
					deviceName: device ? device.deviceName : memberId.split('.').pop(),
					role: device ? device.role : '',
					category: roleInfo.category,
					icon: roleInfo.icon,
					labelKey: roleInfo.labelKey,
					unit: device ? device.unit : '',
					currentValue: live !== undefined ? live.val : null,
					functions: memberFunctions[memberId] || [],
				};
			}),
		}));

		return {
			rooms: roomList,
			functions: functions.map(fn => ({ id: fn.id, name: fn.name, memberCount: fn.members.length })),
			totalRooms: roomList.length,
			totalFunctions: functions.length,
			unassignedCount: rawData.instances.filter(
				inst =>
					inst.enabled &&
					!rooms.some(r => r.members.some(m => m.startsWith(inst.id.replace('system.adapter.', '')))),
			).length,
		};
	}

	/**
	 * Build system configuration section (city, country, language, geo-coordinates)
	 *
	 * @param {object} rawData Raw system data
	 * @returns {object} System configuration
	 */
	buildSystemConfig(rawData) {
		const sc = rawData.systemConfig || {};
		return {
			city: sc.city || '',
			country: sc.country || '',
			language: sc.language || 'en',
			latitude: sc.latitude || null,
			longitude: sc.longitude || null,
		};
	}

	/**
	 * Detect trigger type from script source code (regex-based, best-effort)
	 *
	 * @param {string} source Script source code
	 * @param {string} engineType Engine type
	 * @returns {string} Detected trigger type
	 */
	detectTriggerType(source, engineType) {
		if (engineType && engineType.toLowerCase().includes('blockly')) {
			return 'blockly';
		}
		if (!source) {
			return 'unknown';
		}
		if (/schedule\s*\(/.test(source)) {
			return 'schedule';
		}
		if (/on\s*\(/.test(source) || /subscribe\s*\(/.test(source)) {
			return 'subscribe';
		}
		if (/onStart|on\s*\(\s*['"]start['"]/.test(source)) {
			return 'on-start';
		}
		return 'unknown';
	}

	/**
	 * Build scripts section
	 *
	 * @param {object} rawData Raw system data
	 * @returns {object} Scripts section
	 */
	buildScripts(rawData) {
		const rawScripts = rawData.scripts || [];

		const scriptList = rawScripts.map(s => ({
			id: s.id,
			name: s.name,
			folder: s.folder,
			enabled: s.enabled,
			engineType: s.engineType,
			engine: s.engine || '',
			desc: s.desc,
			schedule: s.schedule || '',
			triggerType: this.detectTriggerType(s.source, s.engineType),
			stateRefs: extractStateRefs(s.source),
		}));

		const crossRef = buildCrossRef(scriptList);

		return {
			scripts: scriptList,
			totalScripts: scriptList.length,
			enabledScripts: scriptList.filter(s => s.enabled).length,
			disabledScripts: scriptList.filter(s => !s.enabled).length,
			stateCrossRef: crossRef,
		};
	}

	/**
	 * Build maintenance and diagnostics section.
	 * Returns three independent sub-scores:
	 *   data   – did autodoc successfully read all system data?
	 *   manual – has the user filled in their own content?
	 *   depth  – does the documentation go beyond a raw data dump?
	 *
	 * @param {Array}  instances     Filtered adapter instances
	 * @param {object} rooms         Return value of {@link DocumentModel#buildRooms}
	 * @param {object} scripts       Return value of {@link DocumentModel#buildScripts}
	 * @param {object} manualContext Normalised manual context from config
	 * @param {object} config        Adapter native config
	 * @param {object} rawData       Original raw data (for host availability check)
	 * @returns {object} Maintenance section
	 */
	buildMaintenance(instances, rooms, scripts, manualContext, config, rawData) {
		const disabledInstances = instances.filter(inst => !inst.enabled);
		const c = config || {};
		const rd = rawData || {};

		const minDescLen = clampConfigInt(
			c.maintenanceScoreMinDescriptionChars,
			DEFAULT_MIN_PROJECT_DESCRIPTION_CHARS,
			5,
			2000,
		);
		const unassignedWarnAt = clampConfigInt(
			c.maintenanceScoreUnassignedWarnAt,
			DEFAULT_UNASSIGNED_INSTANCE_WARN_AT,
			1,
			500,
		);

		// ── Score 1: Datenerfassung — did autodoc get the data? ─────────────
		const hostsFound = Array.isArray(rd.hosts) && rd.hosts.length > 0;
		const instancesFound = instances.some(i => i.enabled);
		const roomsDefined = !!(rooms && rooms.totalRooms > 0);

		const dataChecks = [
			{ key: 'checkHostsFound', ok: hostsFound },
			{ key: 'checkInstancesFound', ok: instancesFound },
			{ key: 'checkRoomsDefined', ok: roomsDefined },
		];

		// ── Score 2: Manuelle Inhalte — has the user provided their content? ─
		const descLen =
			manualContext && manualContext.description ? String(manualContext.description).trim().length : 0;
		const descriptionOk = descLen >= minDescLen;

		const baseUrlRaw = c.baseUrl != null ? String(c.baseUrl).trim() : '';
		const baseUrlOk = baseUrlRaw.length > 0;

		const contactSet = !!(
			manualContext &&
			manualContext.contact &&
			String(manualContext.contact).trim().length > 0
		);
		const hasCustomContent = !!(
			manualContext &&
			(String(manualContext.notes || '').trim().length > 0 ||
				String(manualContext.guestHelpNote || '').trim().length > 0 ||
				String(manualContext.homeRoutinesNote || '').trim().length > 0 ||
				String(manualContext.ownerPlaybookNote || '').trim().length > 0 ||
				Object.keys(manualContext.adapters || {}).length > 0 ||
				Object.keys(manualContext.rooms || {}).length > 0)
		);

		const manualChecks = [];
		if (c.maintenanceScoreCheckDescription !== false) {
			manualChecks.push({ key: 'projectNarrativeThin', ok: descriptionOk });
		}
		if (c.maintenanceScoreCheckBaseUrl !== false) {
			manualChecks.push({ key: 'baseUrlUnset', ok: baseUrlOk });
		}
		manualChecks.push({ key: 'checkContactSet', ok: contactSet });
		manualChecks.push({ key: 'checkCustomContent', ok: hasCustomContent });

		// ── Score 3: Dokumentationstiefe — is it actually useful? ───────────
		const unassigned = rooms && typeof rooms.unassignedCount === 'number' ? rooms.unassignedCount : 0;
		const roomsAssignedOk = unassigned < unassignedWarnAt;

		const hasDiagram = !!(
			(manualContext &&
				manualContext.mermaidDiagram &&
				String(manualContext.mermaidDiagram).trim().length > 0) ||
			c.autoMermaidHostGraph === true
		);

		const roomsHaveDevices = !!(
			rooms &&
			Array.isArray(rooms.rooms) &&
			rooms.rooms.some(r => r.memberCount > 0)
		);

		const depthChecks = [];
		if (c.maintenanceScoreCheckUnassigned !== false) {
			depthChecks.push({ key: 'instancesWithoutRoom', ok: roomsAssignedOk, count: unassigned });
		}
		depthChecks.push({ key: 'checkHasDiagram', ok: hasDiagram });
		depthChecks.push({ key: 'checkRoomsHaveDevices', ok: roomsHaveDevices });

		// ── Overall: average of the three dimension scores ───────────────────
		const dataScore = scorePercent(dataChecks);
		const manualScore = scorePercent(manualChecks);
		const depthScore = scorePercent(depthChecks);
		const overall = Math.round((dataScore + manualScore + depthScore) / 3);

		return {
			disabledInstances: disabledInstances.map(i => ({ id: i.id, name: i.name, title: i.title })),
			scores: {
				data: { checks: dataChecks, score: dataScore },
				manual: { checks: manualChecks, score: manualScore },
				depth: { checks: depthChecks, score: depthScore },
			},
			score: overall,
			// Flat checklist kept for any external JSON consumers (deprecated in favour of scores)
			checklist: [...dataChecks, ...manualChecks, ...depthChecks],
		};
	}

	/**
	 * Build appendices section
	 *
	 * @param {object} rawData Raw system data
	 * @param {Array} instances Filtered instances
	 * @returns {object} Appendices
	 */
	buildAppendices(rawData, instances) {
		return {
			stateSummary: rawData.stateSummary,
			rawInstances: instances,
			collectionTimestamp: rawData.collectedAt,
		};
	}

	/**
	 * Parse and normalise manualContext from adapter config.
	 * Reads dedicated UI fields (projectDescription, manualContact, additionalNotes,
	 * guestHelpNote, homeRoutinesNote, ownerPlaybookNote, manualMermaidDiagram, troubleshoot* hints, adapterNotes table, roomNotes table) with fallback to legacy manualContext JSON.
	 *
	 * @param {object} config Full adapter config object
	 * @returns {object} Normalised manualContext
	 */
	parseManualContext(config) {
		// Parse legacy JSON field as fallback base
		let legacy = {};
		const raw = config && config.manualContext;
		if (raw) {
			if (typeof raw === 'string') {
				try {
					legacy = JSON.parse(raw);
				} catch {
					legacy = {};
				}
			} else if (typeof raw === 'object') {
				legacy = raw;
			}
		}

		// New dedicated fields take precedence over legacy JSON
		const description = (config && config.projectDescription) || legacy.description || '';
		const contact = (config && config.manualContact) || legacy.contact || '';
		const notes = (config && config.additionalNotes) || legacy.notes || '';
		const guestHelpNote = (config && config.guestHelpNote) || legacy.guestHelpNote || '';
		const homeRoutinesNote = (config && config.homeRoutinesNote) || legacy.homeRoutinesNote || '';
		const ownerPlaybookNote = (config && config.ownerPlaybookNote) || legacy.ownerPlaybookNote || '';
		let mermaidDiagram = (config && config.manualMermaidDiagram) || legacy.mermaidDiagram || '';
		mermaidDiagram = String(mermaidDiagram).replace(/\r\n/g, '\n').trim();
		if (mermaidDiagram.length > MAX_MANUAL_MERMAID_CHARS) {
			mermaidDiagram = mermaidDiagram.slice(0, MAX_MANUAL_MERMAID_CHARS);
		}
		const troubleshootWifiHint = (config && config.troubleshootWifiHint) || legacy.troubleshootWifiHint || '';
		const troubleshootPowerHint = (config && config.troubleshootPowerHint) || legacy.troubleshootPowerHint || '';
		const troubleshootWaterHint = (config && config.troubleshootWaterHint) || legacy.troubleshootWaterHint || '';
		const troubleshootExtraHint = (config && config.troubleshootExtraHint) || legacy.troubleshootExtraHint || '';

		// adapterNotes table: [{adapter: "telegram", note: "..."}] → {telegram: "..."}
		const adapters = {};
		if (config && Array.isArray(config.adapterNotes)) {
			for (const row of config.adapterNotes) {
				if (row.adapter && row.note) {
					adapters[row.adapter.trim()] = row.note.trim();
				}
			}
		}
		// Merge legacy adapter notes (new table entries win on conflict)
		if (legacy.adapters && typeof legacy.adapters === 'object') {
			for (const [k, v] of Object.entries(legacy.adapters)) {
				if (!adapters[k]) {
					adapters[k] = v;
				}
			}
		}

		// roomNotes table: [{room: "Wohnzimmer", note: "..."}] → {Wohnzimmer: "..."}
		const rooms = {};
		if (config && Array.isArray(config.roomNotes)) {
			for (const row of config.roomNotes) {
				if (row.room && row.note) {
					rooms[row.room.trim()] = row.note.trim();
				}
			}
		}
		// Merge legacy room notes (new table entries win on conflict)
		if (legacy.rooms && typeof legacy.rooms === 'object') {
			for (const [k, v] of Object.entries(legacy.rooms)) {
				if (!rooms[k]) {
					rooms[k] = v;
				}
			}
		}

		return {
			description,
			contact,
			notes,
			guestHelpNote,
			homeRoutinesNote,
			ownerPlaybookNote,
			mermaidDiagram,
			troubleshootWifiHint,
			troubleshootPowerHint,
			troubleshootWaterHint,
			troubleshootExtraHint,
			adapters,
			rooms,
		};
	}

	/**
	 * Build document metadata
	 *
	 * @param {string} trigger Generation trigger
	 * @returns {object} Metadata
	 */
	buildMetadata(trigger) {
		// schemaVersion = export JSON shape revision (not the adapter package semver).
		return {
			schemaVersion: 'autodoc-json-1',
			generatedAt: new Date().toISOString(),
			trigger: trigger,
			generator: 'ioBroker.autodoc',
			version: this.adapter.version || '0.0.0',
			language: this.adapter.config.language || 'en',
		};
	}
}

module.exports = DocumentModel;
