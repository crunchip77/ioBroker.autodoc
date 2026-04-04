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
					config: instance.native,
				});
			}

			return result;
		} catch (error) {
			this.adapter.log.error(`Error reading adapter instances: ${error.message}`);
			return [];
		}
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
	 * Collect all raw system data
	 *
	 * @returns {Promise<object>} Raw system data
	 */
	async collectRawData() {
		const [instances, stateSummary, hosts] = await Promise.all([
			this.readAdapterInstances(),
			this.readStateObjectsSummary(),
			this.readHosts(),
		]);

		return {
			instances,
			stateSummary,
			hosts,
			collectedAt: new Date().toISOString(),
		};
	}
}

module.exports = Discovery;
