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
				result.push({
					id: host._id,
					name: host.common.name,
					hostname: host.common.hostname,
					platform: host.common.platform,
					type: host.common.type,
					version: host.common.installedVersion,
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
	 * Collect all raw system data
	 *
	 * @returns {Promise<object>} Raw system data
	 */
	async collectRawData() {
		const [instances, stateSummary, hosts, rooms, functions, scripts] = await Promise.all([
			this.readAdapterInstances(),
			this.readStateObjectsSummary(),
			this.readHosts(),
			this.readRooms(),
			this.readFunctions(),
			this.readScripts(),
		]);

		return {
			instances,
			stateSummary,
			hosts,
			rooms,
			functions,
			scripts,
			collectedAt: new Date().toISOString(),
		};
	}
}

module.exports = Discovery;
