/**
 * AutoDoc AI Enhancer
 * Generates narrative documentation text via the Anthropic Claude API (opt-in).
 */

const https = require('https');

const API_HOST = 'api.anthropic.com';
const API_PATH = '/v1/messages';
const API_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 600;

/**
 * Send a single HTTPS POST request to the Anthropic Messages API.
 *
 * @param {string} apiKey Anthropic API key
 * @param {object} body Request body
 * @returns {Promise<object>} Parsed JSON response
 */
function callApi(apiKey, body) {
	return new Promise((resolve, reject) => {
		const payload = JSON.stringify(body);
		const options = {
			hostname: API_HOST,
			path: API_PATH,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(payload),
				'x-api-key': apiKey,
				'anthropic-version': API_VERSION,
			},
		};

		const req = https.request(options, res => {
			let data = '';
			res.on('data', chunk => {
				data += chunk;
			});
			res.on('end', () => {
				try {
					const parsed = JSON.parse(data);
					if (res.statusCode >= 200 && res.statusCode < 300) {
						resolve(parsed);
					} else {
						reject(new Error(`API error ${res.statusCode}: ${parsed.error?.message || data}`));
					}
				} catch (e) {
					reject(new Error(`Failed to parse API response: ${e.message}`));
				}
			});
		});

		req.on('error', reject);
		req.setTimeout(30000, () => {
			req.destroy(new Error('API request timed out after 30s'));
		});
		req.write(payload);
		req.end();
	});
}

/**
 * Build a compact system summary string from the document model for the prompt.
 *
 * @param {object} docModel Document model
 * @returns {string} Compact summary for the prompt
 */
function buildSystemSummary(docModel) {
	const sys = docModel.system;
	const adapters = docModel.adapters;
	const rooms = docModel.rooms;
	const scripts = docModel.scripts;
	const maintenance = docModel.maintenance;

	const adapterList = adapters.adapters
		.slice(0, 20)
		.map(a => `${a.title || a.name}${a.desc ? ` (${a.desc})` : ''}`)
		.join(', ');

	const roomList = rooms.rooms
		.slice(0, 15)
		.map(r => r.name)
		.join(', ');

	const issueLines = [];
	if (maintenance.instancesWithoutRoom.length > 0) {
		issueLines.push(`${maintenance.instancesWithoutRoom.length} adapter instance(s) without room assignment`);
	}
	if (maintenance.scriptsWithoutDescription.length > 0) {
		issueLines.push(`${maintenance.scriptsWithoutDescription.length} script(s) without description`);
	}
	if (maintenance.disabledInstances.length > 0) {
		issueLines.push(`${maintenance.disabledInstances.length} disabled adapter instance(s)`);
	}

	return [
		`Project: ${sys.projectName}`,
		`Host: ${sys.primaryHost.name} (${sys.primaryHost.platform}, ioBroker ${sys.primaryHost.version})`,
		`Adapters: ${adapters.totalAdapters} types, ${sys.statistics.enabledInstanceCount} enabled / ${sys.statistics.disabledInstanceCount} disabled instances`,
		`Top adapters: ${adapterList || 'none'}`,
		`Rooms: ${rooms.totalRooms} (${roomList || 'none'})`,
		`Functions: ${rooms.totalFunctions}`,
		`Scripts: ${scripts.totalScripts} total, ${scripts.enabledScripts} active`,
		`Maintenance score: ${maintenance.score}/100`,
		issueLines.length > 0 ? `Issues: ${issueLines.join('; ')}` : 'No maintenance issues found',
	].join('\n');
}

/**
 * AiEnhancer generates AI-powered narrative text to enrich the documentation.
 */
class AiEnhancer {
	/**
	 * @param {object} adapter ioBroker adapter instance
	 */
	constructor(adapter) {
		this.adapter = adapter;
	}

	/**
	 * Generate AI-enhanced narrative for the document model.
	 * Returns null if disabled or if the API call fails.
	 *
	 * @param {object} docModel Document model
	 * @returns {Promise<{narrative: string, recommendations: string} | null>}
	 */
	async enhance(docModel) {
		const config = this.adapter.config;

		if (!config.aiEnabled) {
			return null;
		}

		const apiKey = (config.aiApiKey || '').trim();
		if (!apiKey) {
			this.adapter.log.warn('AI enhancement enabled but no API key configured');
			return null;
		}

		const model = (config.aiModel || DEFAULT_MODEL).trim();
		const lang = config.language || 'en';
		const systemSummary = buildSystemSummary(docModel);

		const prompt = `You are a technical documentation assistant for a home automation system (ioBroker).
Generate a short, professional documentation summary in ${lang === 'de' ? 'German' : 'English'}.

System data:
${systemSummary}

Provide exactly two sections:
1. NARRATIVE (2-3 sentences): A human-readable overview of this ioBroker installation for a system administrator.
2. RECOMMENDATIONS (bullet points, max 4): Concrete, actionable maintenance suggestions based on the issues listed above. If there are no issues, write "System is well-maintained."

Format your response exactly like this:
NARRATIVE:
<text>

RECOMMENDATIONS:
<text>`;

		try {
			this.adapter.log.debug(`Calling Claude API (model: ${model}) for AI documentation enhancement`);

			const response = await callApi(apiKey, {
				model,
				max_tokens: MAX_TOKENS,
				messages: [{ role: 'user', content: prompt }],
			});

			const text = response.content?.[0]?.text || '';
			return this.parseResponse(text);
		} catch (err) {
			this.adapter.log.warn(`AI enhancement failed: ${err.message}`);
			return null;
		}
	}

	/**
	 * Parse the structured API response into narrative and recommendations.
	 *
	 * @param {string} text Raw API response text
	 * @returns {{narrative: string, recommendations: string}}
	 */
	parseResponse(text) {
		const narrativeMatch = text.match(/NARRATIVE:\s*([\s\S]*?)(?=RECOMMENDATIONS:|$)/i);
		const recommendationsMatch = text.match(/RECOMMENDATIONS:\s*([\s\S]*?)$/i);

		return {
			narrative: (narrativeMatch?.[1] || '').trim(),
			recommendations: (recommendationsMatch?.[1] || '').trim(),
		};
	}
}

module.exports = AiEnhancer;
