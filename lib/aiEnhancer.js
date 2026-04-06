/**
 * AutoDoc AI Enhancer
 * Generates narrative documentation text via pluggable AI providers (opt-in).
 * Supported providers: anthropic, groq, ollama
 * Skipped automatically for the admin profile (all data is already technical/factual).
 */

const https = require('https');
const http = require('http');

const MAX_TOKENS = 600;

const DEFAULT_MODELS = {
	anthropic: 'claude-haiku-4-5-20251001',
	groq: 'llama-3.3-70b-versatile',
	ollama: 'llama3.2',
};

/**
 * Generic HTTP/HTTPS POST helper.
 *
 * @param {object} opts Request options: hostname, port, path, secure, headers
 * @param {object} body JSON request body
 * @returns {Promise<object>} Parsed JSON response
 */
function postJson(opts, body) {
	return new Promise((resolve, reject) => {
		const payload = JSON.stringify(body);
		const reqOpts = {
			hostname: opts.hostname,
			port: opts.port,
			path: opts.path,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(payload),
				...opts.headers,
			},
		};

		const transport = opts.secure ? https : http;
		const req = transport.request(reqOpts, res => {
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
 * Call the Anthropic Messages API.
 *
 * @param {string} apiKey Anthropic API key
 * @param {string} model Model ID
 * @param {string} prompt User prompt
 * @returns {Promise<string>} Response text
 */
async function callAnthropic(apiKey, model, prompt) {
	const response = await postJson(
		{
			hostname: 'api.anthropic.com',
			path: '/v1/messages',
			secure: true,
			headers: {
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
			},
		},
		{ model, max_tokens: MAX_TOKENS, messages: [{ role: 'user', content: prompt }] },
	);
	return response.content?.[0]?.text || '';
}

/**
 * Call an OpenAI-compatible API (Groq or Ollama).
 *
 * @param {string} baseUrl Full base URL, e.g. https://api.groq.com or http://localhost:11434
 * @param {string} apiKey API key (empty string for Ollama)
 * @param {string} model Model ID
 * @param {string} prompt User prompt
 * @returns {Promise<string>} Response text
 */
async function callOpenAiCompatible(baseUrl, apiKey, model, prompt) {
	const url = new URL('/v1/chat/completions', baseUrl);
	const headers = { Authorization: `Bearer ${apiKey}` };
	if (!apiKey) {
		delete headers['Authorization'];
	}

	const response = await postJson(
		{
			hostname: url.hostname,
			port: url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80,
			path: url.pathname,
			secure: url.protocol === 'https:',
			headers,
		},
		{ model, max_tokens: MAX_TOKENS, messages: [{ role: 'user', content: prompt }] },
	);
	return response.choices?.[0]?.message?.content || '';
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
	 * Returns null if disabled, if the profile is admin, or if the API call fails.
	 *
	 * @param {object} docModel Document model
	 * @returns {Promise<{narrative: string, recommendations: string} | null>}
	 */
	async enhance(docModel) {
		const config = this.adapter.config;
		const provider = (config.aiProvider || 'none').trim();

		if (provider === 'none') {
			return null;
		}

		// AI adds no value for the admin profile — all data is already factual
		const profile = (config.profile || 'admin').trim();
		if (profile === 'admin') {
			this.adapter.log.debug('AI enhancement skipped for admin profile');
			return null;
		}

		const model = (config.aiModel || DEFAULT_MODELS[provider] || '').trim();
		const lang = config.language || 'en';
		const systemSummary = buildSystemSummary(docModel);

		const prompt = `You are a documentation assistant for a home automation system (ioBroker).
Generate a short, friendly summary in ${lang === 'de' ? 'German' : 'English'} for the "${profile}" audience.

System data:
${systemSummary}

Provide exactly two sections:
1. NARRATIVE (2-3 sentences): A human-readable overview for the target audience. Use everyday language for "user", simple and welcoming language for "onboarding".
2. RECOMMENDATIONS (bullet points, max 4): Practical suggestions based on the issues above. If no issues, write "System is well-maintained."

Format your response exactly like this:
NARRATIVE:
<text>

RECOMMENDATIONS:
<text>`;

		try {
			this.adapter.log.debug(`AI enhancement: provider=${provider}, model=${model}`);

			let text = '';

			if (provider === 'anthropic') {
				const apiKey = (config.aiApiKey || '').trim();
				if (!apiKey) {
					this.adapter.log.warn('AI provider "anthropic" selected but no API key configured');
					return null;
				}
				text = await callAnthropic(apiKey, model, prompt);
			} else if (provider === 'groq') {
				const apiKey = (config.aiApiKey || '').trim();
				if (!apiKey) {
					this.adapter.log.warn('AI provider "groq" selected but no API key configured');
					return null;
				}
				text = await callOpenAiCompatible('https://api.groq.com', apiKey, model, prompt);
			} else if (provider === 'ollama') {
				const baseUrl = (config.aiBaseUrl || 'http://localhost:11434').trim();
				text = await callOpenAiCompatible(baseUrl, '', model, prompt);
			} else {
				this.adapter.log.warn(`Unknown AI provider: ${provider}`);
				return null;
			}

			return this.parseResponse(text);
		} catch (err) {
			this.adapter.log.warn(`AI enhancement failed (${provider}): ${err.message}`);
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
