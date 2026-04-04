/**
 * Version Tracking Module
 * Manages documentation version history and changelog
 */

class VersionTracker {
	constructor(adapter) {
		this.adapter = adapter;
		this.storagePrefix = `${adapter.namespace}.versioning`;
	}

	/**
	 * Generate semantic version
	 * Format: YYYY.MM.DD.HH
	 *
	 * @returns {string} Version string
	 */
	generateVersion() {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		const hour = String(now.getHours()).padStart(2, '0');
		return `${year}.${month}.${day}.${hour}`;
	}

	/**
	 * Get version comparison data
	 *
	 * @param {object} currentDocModel Current document model
	 * @param {object} previousDocModel Previous document model
	 * @returns {object} Change summary
	 */
	compareVersions(currentDocModel, previousDocModel) {
		if (!previousDocModel) {
			return {
				isInitial: true,
				changes: [],
				summary: 'Initial documentation generation',
			};
		}

		const changes = [];
		const current = currentDocModel.system.statistics;
		const previous = previousDocModel.system.statistics;

		// Check instance count changes
		if (current.instanceCount !== previous.instanceCount) {
			changes.push({
				type: 'instance_count',
				previous: previous.instanceCount,
				current: current.instanceCount,
				message: `Adapter instances changed from ${previous.instanceCount} to ${current.instanceCount}`,
			});
		}

		// Check enabled instances changes
		if (current.enabledInstanceCount !== previous.enabledInstanceCount) {
			changes.push({
				type: 'enabled_instances',
				previous: previous.enabledInstanceCount,
				current: current.enabledInstanceCount,
				message: `Enabled instances changed from ${previous.enabledInstanceCount} to ${current.enabledInstanceCount}`,
			});
		}

		// Check state object count changes
		if (current.totalStateObjects !== previous.totalStateObjects) {
			changes.push({
				type: 'state_objects',
				previous: previous.totalStateObjects,
				current: current.totalStateObjects,
				message: `State objects changed from ${previous.totalStateObjects} to ${current.totalStateObjects}`,
			});
		}

		// Check project name changes
		if (currentDocModel.system.projectName !== previousDocModel.system.projectName) {
			changes.push({
				type: 'project_name',
				previous: previousDocModel.system.projectName,
				current: currentDocModel.system.projectName,
				message: `Project name changed from "${previousDocModel.system.projectName}" to "${currentDocModel.system.projectName}"`,
			});
		}

		return {
			isInitial: false,
			changes: changes,
			summary:
				changes.length === 0
					? 'No significant changes detected'
					: `${changes.length} change(s) detected`,
		};
	}

	/**
	 * Build changelog entry
	 *
	 * @param {string} version Version number
	 * @param {object} changeData Changes from compareVersions
	 * @returns {object} Changelog entry
	 */
	buildChangelogEntry(version, changeData) {
		return {
			version: version,
			timestamp: new Date().toISOString(),
			summary: changeData.summary,
			isInitial: changeData.isInitial,
			changes: changeData.changes,
			changeCount: changeData.changes.length,
		};
	}

	/**
	 * Get previous version data from state
	 *
	 * @returns {Promise<object|null>} Previous document model or null
	 */
	async getPreviousVersion() {
		try {
			const state = await this.adapter.getStateAsync(`${this.storagePrefix}.lastDocumentModel`);
			if (state && state.val) {
				return JSON.parse(String(state.val));
			}
			return null;
		} catch (error) {
			this.adapter.log.warn(`Could not retrieve previous version: ${error.message}`);
			return null;
		}
	}

	/**
	 * Store current version for comparison
	 *
	 * @param {object} docModel Document model to store
	 * @returns {Promise<void>}
	 */
	async storeCurrentVersion(docModel) {
		try {
			await this.adapter.setStateAsync(`${this.storagePrefix}.lastDocumentModel`, {
				val: JSON.stringify(docModel),
				ack: true,
			});
		} catch (error) {
			this.adapter.log.warn(`Could not store current version: ${error.message}`);
		}
	}

	/**
	 * Add changelog entry to history
	 *
	 * @param {object} entry Changelog entry
	 * @returns {Promise<void>}
	 */
	async appendChangelog(entry) {
		try {
			// Get existing changelog
			const state = await this.adapter.getStateAsync(`${this.storagePrefix}.changelog`);
			let changelog = [];

			if (state && state.val) {
				try {
					changelog = JSON.parse(String(state.val));
					if (!Array.isArray(changelog)) {
						changelog = [];
					}
				} catch {
					changelog = [];
				}
			}

			// Add new entry (keep last 50 versions)
			changelog.unshift(entry);
			changelog = changelog.slice(0, 50);

			// Store updated changelog
			await this.adapter.setStateAsync(`${this.storagePrefix}.changelog`, {
				val: JSON.stringify(changelog, null, 2),
				ack: true,
			});

			// Also update latest version info
			await this.adapter.setStateAsync(`${this.storagePrefix}.latestVersion`, {
				val: entry.version,
				ack: true,
			});

			await this.adapter.setStateAsync(`${this.storagePrefix}.changeCount`, {
				val: entry.changeCount,
				ack: true,
			});
		} catch (error) {
			this.adapter.log.warn(`Could not append changelog: ${error.message}`);
		}
	}

	/**
	 * Get current changelog
	 *
	 * @returns {Promise<array>} Array of changelog entries
	 */
	async getChangelog() {
		try {
			const state = await this.adapter.getStateAsync(`${this.storagePrefix}.changelog`);
			if (state && state.val) {
				return JSON.parse(String(state.val));
			}
			return [];
		} catch (error) {
			this.adapter.log.warn(`Could not retrieve changelog: ${error.message}`);
			return [];
		}
	}

	/**
	 * Format changelog to markdown
	 *
	 * @param {array} changelog Changelog entries
	 * @returns {string} Markdown formatted changelog
	 */
	formatChangelogMarkdown(changelog) {
		if (!changelog || changelog.length === 0) {
			return '# Version History\n\nNo versions recorded yet.\n';
		}

		let markdown = '# Version History\n\n';

		for (const entry of changelog) {
			markdown += `## Version ${entry.version}\n`;
			markdown += `**Date:** ${new Date(entry.timestamp).toLocaleString()}\n`;
			markdown += `**Summary:** ${entry.summary}\n`;

			if (entry.changes.length > 0) {
				markdown += '\n### Changes\n';
				for (const change of entry.changes) {
					markdown += `- **${change.type}**: ${change.message}\n`;
				}
			}

			markdown += '\n';
		}

		return markdown;
	}
}

module.exports = VersionTracker;
