/**
 * AutoDoc Notifier Module
 * Sends a notification via ioBroker messaging adapters after documentation generation.
 */

const ADAPTER_TELEGRAM = 'telegram';
const ADAPTER_PUSHOVER = 'pushover';
const ADAPTER_EMAIL = 'email';
const ADAPTER_SIGNAL = 'signal-cmb';
const ADAPTER_WHATSAPP = 'whatsapp-cmb';

/**
 * Notifier sends a message via sendTo after documentation generation.
 *
 * @param {object} adapter ioBroker adapter instance
 */
class Notifier {
	/**
	 * @param {object} adapter ioBroker adapter instance
	 */
	constructor(adapter) {
		this.adapter = adapter;
	}

	/**
	 * Send notification if enabled and configured.
	 *
	 * @param {object} docModel Generated document model
	 * @param {object} changeData Change summary from version tracker
	 * @returns {Promise<void>}
	 */
	async send(docModel, changeData) {
		const config = this.adapter.config;

		if (!config.notifyEnabled) {
			return;
		}

		const instance = (config.notifyInstance || '').trim();
		if (!instance) {
			this.adapter.log.warn('Notification enabled but no adapter instance configured');
			return;
		}

		const message = this.buildMessage(docModel, changeData);
		const adapterType = instance.split('.')[0].toLowerCase();
		const payload = this.buildPayload(adapterType, message, config.notifyTarget);

		try {
			await this.adapter.sendToAsync(instance, 'send', payload);
			this.adapter.log.info(`Notification sent via ${instance}`);
		} catch (err) {
			this.adapter.log.warn(`Notification failed (${instance}): ${err.message}`);
		}
	}

	/**
	 * Build the notification message text.
	 *
	 * @param {object} docModel Document model
	 * @param {object} changeData Change summary
	 * @returns {string} Message text
	 */
	buildMessage(docModel, changeData) {
		const template = (this.adapter.config.notifyMessage || '').trim();
		const vars = {
			'{project}': docModel.system.projectName || 'ioBroker',
			'{summary}': changeData.summary || '',
			'{version}': docModel.meta.version || '',
			'{trigger}': docModel.meta.trigger || '',
		};

		if (template) {
			return template.replace(/\{project\}|\{summary\}|\{version\}|\{trigger\}/g, m => vars[m] || m);
		}

		return `AutoDoc: "${vars['{project}']}" documentation generated — ${vars['{summary}']} (v${vars['{version}']}, trigger: ${vars['{trigger}']})`;
	}

	/**
	 * Build adapter-specific sendTo payload.
	 *
	 * @param {string} adapterType Adapter name without instance number
	 * @param {string} message Notification text
	 * @param {string} target Optional recipient (user/chatId/email)
	 * @returns {object} Payload for sendTo
	 */
	buildPayload(adapterType, message, target) {
		const t = (target || '').trim();

		switch (adapterType) {
			case ADAPTER_TELEGRAM:
				return t ? { text: message, user: t } : { text: message };

			case ADAPTER_EMAIL:
				return {
					text: message,
					subject: 'AutoDoc: Documentation generated',
					...(t ? { to: t } : {}),
				};

			case ADAPTER_PUSHOVER:
				return {
					message,
					title: 'AutoDoc',
					...(t ? { device: t } : {}),
				};

			case ADAPTER_SIGNAL:
			case ADAPTER_WHATSAPP:
				return t ? { text: message, phone: t } : { text: message };

			default:
				// Generic fallback: try common fields
				return {
					text: message,
					message,
					...(t ? { to: t, user: t } : {}),
				};
		}
	}
}

module.exports = Notifier;
