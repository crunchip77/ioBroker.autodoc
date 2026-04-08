/**
 * AutoDoc Discovery Module
 * Handles automatic discovery of adapter instances, hosts, and system metadata
 */
class Discovery {
	/**
	 * @param {object} adapter ioBroker adapter instance
	 */
	constructor(adapter) {
		this.adapter = adapter;
	}

	/**
	 * Resolve a multilingual ioBroker string to a plain string.
	 * common.desc and common.titleLang can be either a plain string
	 * or an object like { en: "...", de: "..." }.
	 *
	 * @param {string|object} value The raw value from common
	 * @param {string} lang Preferred language code
	 * @returns {string} Resolved string or empty string
	 */
	resolveI18nString(value, lang) {
		if (!value) {
			return '';
		}
		if (typeof value === 'string') {
			return value;
		}
		if (typeof value === 'object') {
			return value[lang] || value.en || Object.values(value)[0] || '';
		}
		return '';
	}

	/**
	 * Read all adapter instances from the system
	 *
	 * @returns {Promise<Array>} Array of adapter instance objects
	 */
	async readAdapterInstances() {
		try {
			const instances = await this.adapter.getObjectViewAsync('system', 'instance', {});
			const lang = this.adapter.config.language || 'en';
			const result = [];

			for (const obj of instances.rows) {
				const instance = obj.value;
				// Extract adapter name from common.name (e.g. "admin") or from _id (e.g. "system.adapter.admin.0" → "admin")
				const adapterName = instance.common.name || instance._id.split('.')[2] || instance._id;

				// Skip our own adapter instance
				if (adapterName === 'autodoc') {
					continue;
				}

				result.push({
					id: instance._id,
					name: instance.common.name,
					adapter: adapterName,
					title:
						this.resolveI18nString(instance.common.titleLang || instance.common.title, lang) || adapterName,
					desc: this.resolveI18nString(instance.common.desc, lang),
					enabled: instance.common.enabled,
					host: instance.common.host,
					mode: instance.common.mode,
					version: instance.common.version,
					config: this.filterNative(instance.native),
					connectionType: instance.common.connectionType || '',
					dataSource: instance.common.dataSource || '',
					tier: instance.common.tier || 0,
				});
			}

			return result;
		} catch (error) {
			this.adapter.log.error(`Error reading adapter instances: ${error.message}`);
			return [];
		}
	}

	/**
	 * Filter native config object: remove sensitive keys, keep only scalar values.
	 *
	 * @param {object} native Raw native config from instance
	 * @returns {object} Filtered config object
	 */
	filterNative(native) {
		if (!native || typeof native !== 'object') {
			return {};
		}
		const SENSITIVE = /password|passwd|token|secret|apikey|api_key|pass|key|auth|credential/i;
		const result = {};
		for (const [k, v] of Object.entries(native)) {
			if (SENSITIVE.test(k)) {
				continue;
			}
			if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
				result[k] = v;
			}
		}
		return result;
	}

	/**
	 * Read state objects summary
	 *
	 * @returns {Promise<object>} State objects statistics
	 */
	async readStateObjectsSummary() {
		try {
			const states = await this.adapter.getObjectViewAsync('system', 'state', {});
			let total = 0;
			let writable = 0;
			let readonly = 0;

			for (const obj of states.rows) {
				const state = obj.value;
				total++;

				if (state.common.write) {
					writable++;
				} else {
					readonly++;
				}
			}

			return {
				total,
				writable,
				readonly,
			};
		} catch (error) {
			this.adapter.log.error(`Error reading state objects: ${error.message}`);
			return { total: 0, writable: 0, readonly: 0 };
		}
	}

	/**
	 * Read host information
	 *
	 * @returns {Promise<Array>} Array of host objects
	 */
	async readHosts() {
		try {
			const hosts = await this.adapter.getObjectViewAsync('system', 'host', {});
			const result = [];

			for (const obj of hosts.rows) {
				const host = obj.value;
				// getObjectViewAsync may return a stripped native — fetch the full object
				let fullNative = host.native || {};
				try {
					const full = await this.adapter.getForeignObjectAsync(host._id);
					if (full && full.native) {
						fullNative = full.native;
					}
				} catch {
					// fall back to whatever getObjectViewAsync returned
				}
				const osInfo = fullNative.os || {};
				const processInfo = fullNative.process || {};
				const nodeVersion =
					processInfo.version ||
					(processInfo.versions && processInfo.versions.node ? `v${processInfo.versions.node}` : '') ||
					host.common.nodeVersion ||
					'';
				result.push({
					id: host._id,
					name: host.common.name,
					hostname: host.common.hostname,
					platform: host.common.platform,
					type: host.common.type,
					version: host.common.installedVersion,
					nodeVersion,
					osRelease: osInfo.release || '',
					osArch: osInfo.arch || '',
					osType: osInfo.type || osInfo.platform || '',
				});
			}

			return result;
		} catch (error) {
			this.adapter.log.error(`Error reading hosts: ${error.message}`);
			return [];
		}
	}

	/**
	 * Read rooms (enum.rooms) with their assigned member IDs
	 *
	 * @returns {Promise<Array>} Array of room objects
	 */
	async readRooms() {
		try {
			const enums = await this.adapter.getObjectViewAsync('system', 'enum', {
				startkey: 'enum.rooms.',
				endkey: 'enum.rooms.\u9999',
			});
			const lang = this.adapter.config.language || 'en';
			const result = [];

			for (const obj of enums.rows) {
				const room = obj.value;
				result.push({
					id: room._id,
					name: this.resolveI18nString(room.common.name, lang),
					members: room.common.members || [],
				});
			}

			return result;
		} catch (error) {
			this.adapter.log.error(`Error reading rooms: ${error.message}`);
			return [];
		}
	}

	/**
	 * Read functions (enum.functions) with their assigned member IDs
	 *
	 * @returns {Promise<Array>} Array of function objects
	 */
	async readFunctions() {
		try {
			const enums = await this.adapter.getObjectViewAsync('system', 'enum', {
				startkey: 'enum.functions.',
				endkey: 'enum.functions.\u9999',
			});
			const lang = this.adapter.config.language || 'en';
			const result = [];

			for (const obj of enums.rows) {
				const fn = obj.value;
				result.push({
					id: fn._id,
					name: this.resolveI18nString(fn.common.name, lang),
					members: fn.common.members || [],
				});
			}

			return result;
		} catch (error) {
			this.adapter.log.error(`Error reading functions: ${error.message}`);
			return [];
		}
	}

	/**
	 * Read system.config for location and language settings
	 *
	 * @returns {Promise<object>} System config subset
	 */
	async readSystemConfig() {
		try {
			const obj = await this.adapter.getForeignObjectAsync('system.config');
			if (!obj || !obj.common) {
				return {};
			}
			// activeRepo can be a string ("stable") or array (["stable","beta"]) in newer js-controller
			const rawRepo = obj.common.activeRepo;
			const activeRepo = Array.isArray(rawRepo)
				? rawRepo.join(', ')
				: (typeof rawRepo === 'string' ? rawRepo : '');

			return {
				city: obj.common.city || '',
				country: obj.common.country || '',
				language: obj.common.language || 'en',
				latitude: obj.common.latitude || null,
				longitude: obj.common.longitude || null,
				timezone: obj.common.timezone || '',
				activeRepo,
			};
		} catch (e) {
			this.adapter.log.warn(`Could not read system.config: ${e.message}`);
			return {};
		}
	}

	/**
	 * Read live resource states for all hosts (RAM, CPU, uptime).
	 *
	 * @param {Array} hosts Host objects from readHosts()
	 * @returns {Promise<object>} Map of hostName → { totalMem, freeMem, cpu, uptime }
	 */
	async readHostResources(hosts) {
		const result = {};
		for (const host of hosts) {
			const hostId = host.id.replace('system.host.', '');
			try {
				const [freemem, totalmem, memRss, memHeapUsed, cpu, uptime] = await Promise.all([
					this.adapter.getForeignStateAsync(`system.host.${hostId}.freemem`).catch(() => null),
					this.adapter.getForeignStateAsync(`system.host.${hostId}.totalmem`).catch(() => null),
					this.adapter.getForeignStateAsync(`system.host.${hostId}.memRss`).catch(() => null),
					this.adapter.getForeignStateAsync(`system.host.${hostId}.memHeapUsed`).catch(() => null),
					this.adapter.getForeignStateAsync(`system.host.${hostId}.cpu`).catch(() => null),
					this.adapter.getForeignStateAsync(`system.host.${hostId}.uptime`).catch(() => null),
				]);

				// freemem/totalmem/memRss/memHeapUsed are all in MB in ioBroker JS-controller
				const sysFreeMb = (freemem && freemem.val !== null && freemem.val !== undefined) ? Number(freemem.val) : null;
				const sysTotalMb = (totalmem && totalmem.val !== null && totalmem.val !== undefined && totalmem.val > 0) ? Number(totalmem.val) : null;
				// js-controller process RSS — MB, safety check for byte values
				const rawProcMb = (memRss && memRss.val > 0) ? memRss.val
					: (memHeapUsed && memHeapUsed.val > 0 ? memHeapUsed.val : null);
				const procMb = rawProcMb !== null ? (rawProcMb > 100000 ? Math.round(rawProcMb / 1048576) : Math.round(rawProcMb)) : null;
				this.adapter.log.debug(`Host ${hostId} resources: freemem=${sysFreeMb} totalmem=${sysTotalMb} procMb=${procMb} cpu=${cpu && cpu.val}`);

				// Sum memRss of all running adapter instances on this host
				let adapterTotalMb = null;
				try {
					const adapterObjs = await this.adapter.getForeignObjectsAsync(`system.adapter.*.*.memRss`, 'state').catch(() => null);
					if (adapterObjs) {
						const ids = Object.keys(adapterObjs);
						let sum = 0;
						let count = 0;
						for (const id of ids) {
							try {
								const s = await this.adapter.getForeignStateAsync(id).catch(() => null);
								if (s && s.val !== null && s.val !== undefined && Number(s.val) > 0) {
									const mb = Number(s.val) > 100000 ? Math.round(Number(s.val) / 1048576) : Math.round(Number(s.val));
									sum += mb;
									count++;
								}
							} catch (_) { /* ignore individual state errors */ }
						}
						if (count > 0) adapterTotalMb = sum;
					}
				} catch (_) { /* adapter memory sum optional */ }

				result[host.name] = {
					sysFreeMb,
					sysTotalMb,
					procMb,          // js-controller process RAM
					adapterTotalMb,  // sum of all adapter instance RSS (incl. js-controller)
					cpu: cpu && cpu.val !== null && cpu.val !== undefined ? Number(cpu.val) : null,
					uptime: uptime && uptime.val ? uptime.val : null,
				};
			} catch (_) {
				result[host.name] = {};
			}
		}
		return result;
	}

	/**
	 * Read user-defined variables from the 0_userdata.0 namespace.
	 * Groups them by folder. Skips objects without common.name.
	 *
	 * @returns {Promise<Array>} Array of { id, name, folder, type, unit, desc, value }
	 */
	async readUserData() {
		try {
			const objs = await this.adapter.getForeignObjectsAsync('0_userdata.0.*', 'state');
			if (!objs) return [];
			const result = [];
			const lang = this.adapter.config.language || 'en';

			// Also try to read current values for context
			const ids = Object.keys(objs);
			const states = {};
			// Read in batches of 50 to avoid overload
			for (let i = 0; i < ids.length; i += 50) {
				const batch = ids.slice(i, i + 50);
				try {
					const batchStates = await this.adapter.getForeignStatesAsync(batch.join(','));
					Object.assign(states, batchStates || {});
				} catch (_) {
					// ignore batch errors
				}
			}

			for (const [id, obj] of Object.entries(objs)) {
				if (!obj || !obj.common) continue;
				const nameParts = id.replace('0_userdata.0.', '').split('.');
				const name = this.resolveI18nString(obj.common.name, lang) || nameParts[nameParts.length - 1];
				const folder = nameParts.length > 1 ? nameParts.slice(0, -1).join('/') : null;
				const stateVal = states[id];
				result.push({
					id,
					name,
					folder,
					type: obj.common.type || 'mixed',
					unit: obj.common.unit || '',
					desc: this.resolveI18nString(obj.common.desc, lang) || '',
					role: obj.common.role || '',
					value: stateVal && stateVal.val !== undefined ? stateVal.val : null,
					lastChange: stateVal && stateVal.ts ? new Date(stateVal.ts).toISOString() : null,
				});
			}
			// Sort by folder then name
			result.sort((a, b) => {
				const fa = a.folder || '';
				const fb = b.folder || '';
				if (fa !== fb) return fa.localeCompare(fb);
				return a.name.localeCompare(b.name);
			});
			return result;
		} catch (e) {
			this.adapter.log.debug(`Could not read 0_userdata.0: ${e.message}`);
			return [];
		}
	}

	/**
	 * Read alias datapoints from the alias.0 namespace.
	 * Extracts name, folder, type, and the read/write target IDs.
	 *
	 * @returns {Promise<Array>} Array of { id, name, folder, type, readTarget, writeTarget, desc }
	 */
	async readAliases() {
		try {
			const objs = await this.adapter.getForeignObjectsAsync('alias.0.*', 'state');
			if (!objs) return [];
			const result = [];
			const lang = this.adapter.config.language || 'en';

			for (const [id, obj] of Object.entries(objs)) {
				if (!obj || !obj.common) continue;
				const nameParts = id.replace('alias.0.', '').split('.');
				const name = this.resolveI18nString(obj.common.name, lang) || nameParts[nameParts.length - 1];
				const folder = nameParts.length > 1 ? nameParts.slice(0, -1).join('/') : null;

				// common.alias.id can be a string or { read, write }
				let readTarget = null;
				let writeTarget = null;
				if (obj.common.alias) {
					const aliasId = obj.common.alias.id;
					if (typeof aliasId === 'string') {
						readTarget = aliasId;
						writeTarget = aliasId;
					} else if (aliasId && typeof aliasId === 'object') {
						readTarget = aliasId.read || null;
						writeTarget = aliasId.write || null;
					}
				}

				result.push({
					id,
					name,
					folder,
					type: obj.common.type || '—',
					unit: obj.common.unit || '',
					desc: this.resolveI18nString(obj.common.desc, lang) || '',
					role: obj.common.role || '',
					readTarget,
					writeTarget,
				});
			}

			result.sort((a, b) => {
				const fa = a.folder || '';
				const fb = b.folder || '';
				if (fa !== fb) return fa.localeCompare(fb);
				return a.name.localeCompare(b.name);
			});
			return result;
		} catch (e) {
			this.adapter.log.debug(`Could not read alias.0: ${e.message}`);
			return [];
		}
	}

	/**
	 * Resolve member objects for all rooms and return a map of memberId → device info
	 *
	 * @param {Array} rooms Array of room objects from readRooms()
	 * @returns {Promise<object>} Map of memberId → { deviceId, deviceName, role, type, unit }
	 */
	async resolveRoomDevices(rooms) {
		// collect unique member IDs
		const allMembers = new Set();
		for (const room of rooms) {
			for (const memberId of room.members) {
				allMembers.add(memberId);
			}
		}

		const result = {};
		for (const memberId of allMembers) {
			try {
				// Try the member object itself first
				const obj = await this.adapter.getForeignObjectAsync(memberId);
				if (obj && obj.common) {
					const name =
						this.resolveI18nString(obj.common.name, this.adapter.config.language || 'en') ||
						memberId.split('.').pop();
					result[memberId] = {
						deviceId: memberId,
						deviceName: name,
						role: obj.common.role || '',
						type: obj.common.type || '',
						unit: obj.common.unit || '',
					};
				}
			} catch {
				// silently skip unresolvable members
			}
		}
		return result;
	}

	/**
	 * Optionally read live state values for key roles (opt-in via config.readLiveStates)
	 *
	 * @param {object} deviceMap Map from resolveRoomDevices()
	 * @returns {Promise<object>} Map of memberId → { val, ts }
	 */
	async readLiveStates(deviceMap) {
		if (!this.adapter.config.readLiveStates) {
			return {};
		}
		const LIVE_ROLES = new Set([
			'level.temperature',
			'sensor.door',
			'sensor.window',
			'alarm',
			'sensor.motion',
			'value.temperature',
			'value.humidity',
			'sensor.alarm',
		]);
		const result = {};
		for (const [memberId, device] of Object.entries(deviceMap)) {
			if (LIVE_ROLES.has(device.role)) {
				try {
					const state = await this.adapter.getForeignStateAsync(memberId);
					if (state !== null && state !== undefined) {
						result[memberId] = { val: state.val, ts: state.ts };
					}
				} catch {
					// skip
				}
			}
		}
		return result;
	}

	/**
	 * Read scripts from script.js.* namespace
	 *
	 * @returns {Promise<Array>} Array of script objects
	 */
	async readScripts() {
		try {
			const scripts = await this.adapter.getObjectViewAsync('script', 'javascript', {});
			const result = [];

			for (const obj of scripts.rows) {
				const script = obj.value;
				if (!script || !script._id) {
					continue;
				}

				// Derive a readable name from the object id: script.js.Folder.MyScript → Folder / MyScript
				const idParts = script._id.replace('script.js.', '').split('.');
				const name = script.common.name || idParts[idParts.length - 1] || script._id;
				const folder = idParts.length > 1 ? idParts.slice(0, -1).join('/') : null;

			result.push({
				id: script._id,
				name,
				folder,
				enabled: script.common.enabled !== false,
				engineType: script.common.engineType || 'Javascript/js',
				schedule: script.common.schedule || '',
				desc: script.common.desc || '',
				source: script.common.source || '',
			});
			}

			return result;
		} catch (error) {
			this.adapter.log.warn(`Error reading scripts (script adapter may not be installed): ${error.message}`);
			return [];
		}
	}

	/**
	 * Check how many adapters have updates available.
	 * Reads system.adapter.<name> objects and compares installedVersion to version from npm (if available).
	 * Fallback: counts adapters where common.installedVersion differs from common.version.
	 *
	 * @param {Array} instances Adapter instances already discovered
	 * @returns {Promise<number>} Count of adapters with pending updates
	 */
	async readPendingUpdates(instances) {
		try {
			const adapterNames = [...new Set(instances.map(i => i.adapter))];
			let updateCount = 0;
			for (const name of adapterNames) {
				try {
					const obj = await this.adapter.getForeignObjectAsync(`system.adapter.${name}`);
					if (obj && obj.common) {
						const installed = obj.common.installedVersion || obj.common.version || '';
						const available = obj.common.latestVersion || '';
						if (available && installed && available !== installed) {
							updateCount++;
						}
					}
				} catch (_) {
					// ignore per-adapter errors
				}
			}
			return updateCount;
		} catch (e) {
			this.adapter.log.debug(`Could not read pending updates: ${e.message}`);
			return 0;
		}
	}

	/**
	 * Try to read BackItUp last backup timestamp.
	 *
	 * @returns {Promise<string|null>} ISO string of last backup or null
	 */
	async readLastBackup() {
		try {
			const state = await this.adapter.getForeignStateAsync('backitup.0.info.lastBackup');
			if (state && state.val) {
				return String(state.val);
			}
		} catch (_) {
			// BackItUp may not be installed
		}
		return null;
	}

	/**
	 * Collect all raw system data
	 *
	 * @returns {Promise<object>} Raw system data
	 */
	async collectRawData() {
		const [instances, stateSummary, hosts, rooms, functions, scripts, systemConfig] = await Promise.all([
			this.readAdapterInstances(),
			this.readStateObjectsSummary(),
			this.readHosts(),
			this.readRooms(),
			this.readFunctions(),
			this.readScripts(),
			this.readSystemConfig(),
		]);

		// Device resolution and live states depend on rooms → sequential
		const deviceMap = await this.resolveRoomDevices(rooms);
		const liveStates = await this.readLiveStates(deviceMap);

		// Optional extras — soft failures allowed, all in parallel
		const [pendingUpdates, lastBackup, hostResources, userData, aliases] = await Promise.all([
			this.readPendingUpdates(instances),
			this.readLastBackup(),
			this.readHostResources(hosts),
			this.readUserData(),
			this.readAliases(),
		]);

		return {
			instances,
			stateSummary,
			hosts,
			rooms,
			functions,
			scripts,
			systemConfig,
			deviceMap,
			liveStates,
			pendingUpdates,
			lastBackup,
			hostResources,
			userData,
			aliases,
			collectedAt: new Date().toISOString(),
		};
	}
}

module.exports = Discovery;
