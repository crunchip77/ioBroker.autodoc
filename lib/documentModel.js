/**
 * AutoDoc Document Model Module
 * Builds structured document models from raw system data
 */
const { extractStateRefs, buildCrossRef } = require('./dependencyAnalyzer');
const { mapRole } = require('./roleMapper');

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
	 * @returns {Promise<object>} Document model
	 */
	async buildDocumentModel(rawData, trigger) {
		const config = this.adapter.config;

		// Filter instances based on configuration
		const filteredInstances = this.filterInstances(rawData.instances, config);

		// Build system information
		const systemInfo = this.buildSystemInfo(rawData, filteredInstances);

		// Build adapter information
		const adapterInfo = this.buildAdapterInfo(filteredInstances);

		// Build rooms and functions
		const rooms = this.buildRooms(rawData, rawData.deviceMap || {}, rawData.liveStates || {});

		// Build scripts section
		const scripts = this.buildScripts(rawData);

		// Build maintenance section
		const maintenance = this.buildMaintenance(rawData, filteredInstances, scripts);

		// Build appendices
		const appendices = this.buildAppendices(rawData, filteredInstances);

		// Build metadata
		const meta = this.buildMetadata(trigger);

		return {
			meta,
			system: systemInfo,
			adapters: adapterInfo,
			rooms,
			scripts,
			maintenance,
			appendices,
			systemConfig: this.buildSystemConfig(rawData),
			manualContext: this.parseManualContext(config.manualContext),
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
			},
			hosts: rawData.hosts,
			statistics: {
				instanceCount: instances.length,
				enabledInstanceCount: instances.filter(i => i.enabled).length,
				disabledInstanceCount: instances.filter(i => !i.enabled).length,
				totalStateObjects: rawData.stateSummary.total,
				writableStateObjects: rawData.stateSummary.writable,
				readonlyStateObjects: rawData.stateSummary.readonly,
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
			members: room.members.map(memberId => {
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
				inst => !rooms.some(r => r.members.some(m => m.startsWith(inst.id.replace('system.adapter.', '')))),
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
			desc: s.desc,
			triggerType: this.detectTriggerType(s.source, s.engineType),
			hasDescription: !!s.desc,
			stateRefs: extractStateRefs(s.source),
		}));

		const crossRef = buildCrossRef(scriptList);

		return {
			scripts: scriptList,
			totalScripts: scriptList.length,
			enabledScripts: scriptList.filter(s => s.enabled).length,
			disabledScripts: scriptList.filter(s => !s.enabled).length,
			scriptsWithoutDescription: scriptList.filter(s => !s.hasDescription).length,
			stateCrossRef: crossRef,
		};
	}

	/**
	 * Build maintenance and diagnostics section
	 *
	 * @param {object} rawData Raw system data
	 * @param {Array} instances Filtered adapter instances
	 * @param {object} scripts Built scripts section
	 * @returns {object} Maintenance section
	 */
	buildMaintenance(rawData, instances, scripts) {
		const rooms = rawData.rooms || [];

		// Collect all member IDs referenced by any room
		const allRoomMembers = new Set();
		for (const room of rooms) {
			for (const memberId of room.members) {
				allRoomMembers.add(memberId);
			}
		}

		// Instances without room assignment:
		// An instance is "assigned" if at least one room member starts with its namespace
		// e.g. system.adapter.hm-rpc.0 → namespace = hm-rpc.0
		const instancesWithoutRoom = instances.filter(inst => {
			const namespace = inst.id.replace('system.adapter.', '');
			return ![...allRoomMembers].some(m => m.startsWith(`${namespace}.`) || m === namespace);
		});

		// Disabled instances
		const disabledInstances = instances.filter(inst => !inst.enabled);

		// Scripts without description
		const scriptsWithoutDesc = scripts.scripts.filter(s => !s.hasDescription);

		// Build checklist
		const checklist = [];
		if (instancesWithoutRoom.length > 0) {
			checklist.push({ key: 'instancesWithoutRoom', count: instancesWithoutRoom.length, ok: false });
		} else {
			checklist.push({ key: 'instancesWithoutRoom', count: 0, ok: true });
		}
		if (scriptsWithoutDesc.length > 0) {
			checklist.push({ key: 'scriptsWithoutDescription', count: scriptsWithoutDesc.length, ok: false });
		} else {
			checklist.push({ key: 'scriptsWithoutDescription', count: 0, ok: true });
		}
		if (disabledInstances.length > 0) {
			checklist.push({ key: 'disabledInstances', count: disabledInstances.length, ok: false });
		} else {
			checklist.push({ key: 'disabledInstances', count: 0, ok: true });
		}

		return {
			instancesWithoutRoom: instancesWithoutRoom.map(i => ({ id: i.id, name: i.name, title: i.title })),
			disabledInstances: disabledInstances.map(i => ({ id: i.id, name: i.name, title: i.title })),
			scriptsWithoutDescription: scriptsWithoutDesc.map(s => ({ id: s.id, name: s.name, folder: s.folder })),
			checklist,
			score:
				checklist.length > 0 ? Math.round((checklist.filter(c => c.ok).length / checklist.length) * 100) : 100,
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
	 * Accepts either an object or a JSON string.
	 *
	 * @param {string|object|null} raw Raw manualContext value from config
	 * @returns {object} Normalised manualContext
	 */
	parseManualContext(raw) {
		if (!raw) {
			return { description: '', contact: '', notes: '', adapters: {}, rooms: {} };
		}
		let ctx = raw;
		if (typeof raw === 'string') {
			try {
				ctx = JSON.parse(raw);
			} catch {
				ctx = {};
			}
		}
		return {
			description: ctx.description || '',
			contact: ctx.contact || '',
			notes: ctx.notes || '',
			adapters: ctx.adapters && typeof ctx.adapters === 'object' ? ctx.adapters : {},
			rooms: ctx.rooms && typeof ctx.rooms === 'object' ? ctx.rooms : {},
		};
	}

	/**
	 * Build document metadata
	 *
	 * @param {string} trigger Generation trigger
	 * @returns {object} Metadata
	 */
	buildMetadata(trigger) {
		return {
			schemaVersion: '1.0.0',
			generatedAt: new Date().toISOString(),
			trigger: trigger,
			generator: 'ioBroker.autodoc',
			version: this.adapter.version || '1.0.0',
			language: this.adapter.config.language || 'en',
		};
	}
}

module.exports = DocumentModel;
