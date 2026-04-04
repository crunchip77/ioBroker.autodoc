/**
 * AutoDoc Discovery Module
 * Handles automatic discovery of adapter instances, hosts, and system metadata
 */

/**
 * @param {object} adapter ioBroker adapter instance
 */
class Discovery {
	constructor(adapter) {
		this.adapter = adapter;
	}

	/**
	 * Read all adapter instances from the system
	 *
	 * @returns {Promise<Array>} Array of adapter instance objects
	 */
	async readAdapterInstances() {
		try {
			const instances = await this.adapter.getObjectViewAsync('system', 'instance', {});
			const result = [];

			for (const obj of instances.rows) {
				const instance = obj.value;
				const adapterName = instance._id.split('.').pop();

				// Skip system adapters and our own adapter
				if (adapterName.startsWith('system.') || adapterName === 'autodoc') {
					continue;
				}

				result.push({
					id: instance._id,
					name: instance.common.name,
					adapter: adapterName,
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
