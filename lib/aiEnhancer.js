/**
 * AutoDoc AI Enhancer
 * Generates narrative documentation text via pluggable AI providers (opt-in).
 * Supported providers: ollama (local/private), mistral (EU/GDPR), groq (US/free), anthropic (paid/premium)
 * When a provider is set, runs two tailored calls (user vs onboarding) for the HTML exports.
 * The documentation profile (admin/user/onboarding) only affects Markdown focus, not whether AI runs.
 */

const https = require('node:https');
const http = require('node:http');

/** Output budget for user-profile AI (OpenAI-style max_tokens). */
const MAX_TOKENS_USER = 900;
/** Richer onboarding guest text needs a higher ceiling (especially local Ollama). */
const MAX_TOKENS_ONBOARDING = 2000;

/**
 * @param {{ narrative?: string, recommendations?: string } | null | undefined} block Parsed AI sections
 * @returns {boolean} True if missing or both strings are blank
 */
function isAiBlockEmpty(block) {
	if (block == null) {
		return true;
	}
	const n = String(block.narrative || '').trim();
	const r = String(block.recommendations || '').trim();
	return !n && !r;
}

const DEFAULT_MODELS = {
	ollama: 'llama3.2',
	mistral: 'mistral-small-latest',
	groq: 'llama-3.3-70b-versatile',
	anthropic: 'claude-haiku-4-5-20251001',
};

const LANG_NAMES = {
	de: 'German',
	fr: 'French',
	en: 'English',
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
					const code = res.statusCode ?? 0;
					if (code >= 200 && code < 300) {
						resolve(parsed);
					} else {
						reject(new Error(`API error ${code}: ${parsed.error?.message || data}`));
					}
				} catch (e) {
					reject(new Error(`Failed to parse API response: ${e.message}`));
				}
			});
		});

		req.on('error', reject);
		req.setTimeout(120000, () => {
			req.destroy(new Error('API request timed out after 120s'));
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
 * @param {number} maxTokens Max response tokens
 * @returns {Promise<string>} Response text
 */
async function callAnthropic(apiKey, model, prompt, maxTokens) {
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
		{ model, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] },
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
 * @param {number} maxTokens Max response tokens
 * @returns {Promise<string>} Response text
 */
async function callOpenAiCompatible(baseUrl, apiKey, model, prompt, maxTokens) {
	const url = new URL('/v1/chat/completions', baseUrl);
	const headers = {};
	if (apiKey) {
		headers.Authorization = `Bearer ${apiKey}`;
	}

	const response = await postJson(
		{
			hostname: url.hostname,
			port: url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80,
			path: url.pathname,
			secure: url.protocol === 'https:',
			headers,
		},
		{ model, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] },
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
 * Extra structured facts for onboarding prompts (rooms + function themes).
 *
 * @param {object} docModel Document model
 * @returns {string} Block to append to the prompt (English labels OK; model writes in langName)
 */
function buildOnboardingDetailBlock(docModel) {
	const rooms = docModel.rooms;
	if (!rooms) {
		return '';
	}
	const fnNames = (rooms.functions || [])
		.slice(0, 25)
		.map(f => f.name)
		.filter(Boolean)
		.join(', ');
	const roomLines = (rooms.rooms || []).slice(0, 22).map(r => {
		const n = r.memberCount ?? (r.devices && r.devices.length) ?? 0;
		return `  • ${r.name} — ${n} device(s)/points`;
	});
	const lines = ['--- Use ONLY these facts for room/function names (do not invent rooms or devices) ---'];
	if (fnNames) {
		lines.push(`Function / theme areas: ${fnNames}`);
	}
	lines.push('Rooms:', roomLines.length > 0 ? roomLines.join('\n') : '  (none defined)');
	return lines.join('\n');
}

/**
 * Build the LLM prompt for a specific HTML audience (user vs onboarding).
 *
 * @param {object} docModel Document model
 * @param {'user'|'onboarding'} audience Target profile
 * @param {string} langName Human-readable language, e.g. "German"
 * @returns {string} Prompt text
 */
function buildAudiencePrompt(docModel, audience, langName) {
	const systemSummary = buildSystemSummary(docModel);

	if (audience === 'user') {
		return `You are a documentation assistant for a home automation system (ioBroker).
Write entirely in ${langName}.

Audience: people who live here and use the smart home daily. Clear, practical everyday language. No adapter IDs, OIDs, or technical paths.

System data:
${systemSummary}

Instructions:
1. NARRATIVE: 5–8 sentences. Concrete overview: what matters day-to-day, comfort, orientation. Refer to rooms or themes from the data when it helps. Not generic filler.
2. RECOMMENDATIONS: 5–8 bullet lines. Actionable habits (checks, documentation, small improvements) tied to the issues/maintenance hints above. If there are almost no issues, still give 3–4 positive, useful habits for the household.

Format your response exactly like this:
NARRATIVE:
<text>

RECOMMENDATIONS:
<text>`;
	}

	const detail = buildOnboardingDetailBlock(docModel);
	return `You write the "welcome" box for GUESTS and FIRST-TIME VISITORS of a smart home.
Write entirely in ${langName}. Tone: warm, calm, like a friendly host — not a technician and not marketing fluff.

The technical block below is ONLY background for you. Do NOT copy its wording into the output. Translate ideas into everyday language.

STRICTLY FORBIDDEN in both NARRATIVE and RECOMMENDATIONS (do not use these words or close variants):
- Platform/software names (e.g. ioBroker), "adapter", "instance", "driver", "binding", "OID", "datapoint", "state ID"
- Protocols and IT terms: MQTT, CoAP, REST, API, HTTP, JSON, WebSocket, IP address
- Programming / automation implementation: JavaScript, Blockly, "script" in the sense of code, GitHub, repository
- Named integration products from the raw list unless you describe them as generic devices (e.g. say "smart switches" or "wall modules", not brand + protocol stacks)
- Invented Wi‑Fi passwords, alarm codes, or devices not implied by the data

ALLOWED: room names from the data; generic categories (lighting, heating, shutters/blinds, motion, door/window, scenes/routines explained as "things that happen automatically"); "this documentation", "the pages below", "ask your host"; comfort and safety common sense.

System data (internal — infer, do not quote):
${systemSummary}

${detail}

Instructions:
1. NARRATIVE: About 130–240 words (10–18 sentences or 2–3 short paragraphs). Welcome them to the home. Describe what they might experience: light, temperature, shutters, maybe schedules — using room names from the data. Sound human and reassuring. One short sentence may say that more detail is in the rest of this page.
2. RECOMMENDATIONS: 7–10 short bullet lines as practical guest tips (e.g. browse room sections below, automations may run on their own, ask before changing settings, whom to contact). No technical setup instructions.

Format your response exactly like this:
NARRATIVE:
<text>

RECOMMENDATIONS:
<text>`;
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
	 * Call the configured provider once with the given prompt.
	 *
	 * @param {object} config Adapter config
	 * @param {string} provider Provider id (ollama, groq, …)
	 * @param {string} model Model id
	 * @param {string} prompt Prompt text
	 * @param {number} maxTokens Max completion tokens
	 * @returns {Promise<string>} Raw model text, or empty string if misconfigured
	 */
	async invokeProvider(config, provider, model, prompt, maxTokens) {
		if (provider === 'anthropic') {
			const apiKey = (config.aiApiKey || '').trim();
			if (!apiKey) {
				this.adapter.log.warn('AI provider "anthropic" selected but no API key configured');
				return '';
			}
			return callAnthropic(apiKey, model, prompt, maxTokens);
		}
		if (provider === 'groq') {
			const apiKey = (config.aiApiKey || '').trim();
			if (!apiKey) {
				this.adapter.log.warn('AI provider "groq" selected but no API key configured');
				return '';
			}
			return callOpenAiCompatible('https://api.groq.com', apiKey, model, prompt, maxTokens);
		}
		if (provider === 'ollama') {
			const baseUrl = (config.aiBaseUrl || 'http://localhost:11434').trim();
			return callOpenAiCompatible(baseUrl, '', model, prompt, maxTokens);
		}
		if (provider === 'mistral') {
			const apiKey = (config.aiApiKey || '').trim();
			if (!apiKey) {
				this.adapter.log.warn('AI provider "mistral" selected but no API key configured');
				return '';
			}
			return callOpenAiCompatible('https://api.mistral.ai', apiKey, model, prompt, maxTokens);
		}
		this.adapter.log.warn(`Unknown AI provider: ${provider}`);
		return '';
	}

	/**
	 * Generate AI text for one HTML audience (user or onboarding).
	 *
	 * @param {object} docModel Document model
	 * @param {'user'|'onboarding'} audience Target reader (user vs guest)
	 * @param {string} provider Provider id
	 * @param {string} model Model id
	 * @param {string} langName Output language name for the prompt
	 * @returns {Promise<{narrative: string, recommendations: string}|null>} Parsed sections or null
	 */
	async enhanceOneAudience(docModel, audience, provider, model, langName) {
		const prompt = buildAudiencePrompt(docModel, audience, langName);
		const maxTokens = audience === 'onboarding' ? MAX_TOKENS_ONBOARDING : MAX_TOKENS_USER;
		try {
			this.adapter.log.debug(
				`AI enhancement: provider=${provider}, model=${model}, audience=${audience}, max_tokens=${maxTokens}`,
			);
			const text = await this.invokeProvider(this.adapter.config, provider, model, prompt, maxTokens);
			if (!text) {
				return null;
			}
			const parsed = this.parseResponse(text);
			if (isAiBlockEmpty(parsed)) {
				this.adapter.log.warn(
					`AI enhancement returned no usable text (${provider}, ${audience}) — check model output format (NARRATIVE: / RECOMMENDATIONS:)`,
				);
				return null;
			}
			return parsed;
		} catch (err) {
			this.adapter.log.warn(`AI enhancement failed (${provider}, ${audience}): ${err.message}`);
			return null;
		}
	}

	/**
	 * Generate AI-enhanced narrative for User and Onboarding HTML (two tailored calls).
	 * Returns null if disabled or if both API calls fail.
	 *
	 * @param {object} docModel Document model
	 * @returns {Promise<{user: object|null, onboarding: object|null}|null>} Per-profile AI blocks
	 */
	async enhance(docModel) {
		const config = this.adapter.config;
		const provider = (config.aiProvider || 'none').trim();

		if (provider === 'none') {
			return null;
		}

		const model = (config.aiModel || DEFAULT_MODELS[provider] || '').trim();
		const lang = config.language || 'en';
		const langName = LANG_NAMES[lang] || 'English';

		// Sequential calls: parallel requests often overload local Ollama (second call fails or times out).
		const userAi = await this.enhanceOneAudience(docModel, 'user', provider, model, langName);
		const onboardingAi = await this.enhanceOneAudience(docModel, 'onboarding', provider, model, langName);

		let u = userAi;
		let o = onboardingAi;

		if (!o && u) {
			this.adapter.log.info(
				'AI: onboarding block missing — reusing user KI text for autodoc-onboarding.html (guest-oriented prompt failed or was empty)',
			);
			o = { narrative: u.narrative, recommendations: u.recommendations };
		}
		if (!u && o) {
			this.adapter.log.info('AI: user block missing — reusing onboarding KI text for autodoc-user.html');
			u = { narrative: o.narrative, recommendations: o.recommendations };
		}

		if (!u && !o) {
			return null;
		}

		return { user: u, onboarding: o };
	}

	/**
	 * Parse the structured API response into narrative and recommendations.
	 *
	 * @param {string} text Raw API response text
	 * @returns {{narrative: string, recommendations: string}} Extracted sections (may be empty strings)
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
