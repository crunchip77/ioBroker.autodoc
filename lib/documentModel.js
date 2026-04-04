/**
 * AutoDoc Document Model Module
 * Builds structured document models from raw system data
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

		// Build appendices
		const appendices = this.buildAppendices(rawData, filteredInstances);

		// Build metadata
		const meta = this.buildMetadata(trigger);

		return {
			meta,
			system: systemInfo,
			adapters: adapterInfo,
			appendices,
			manualContext: config.manualContext || {},
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
					instances: [],
					totalInstances: 0,
					enabledInstances: 0,
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
