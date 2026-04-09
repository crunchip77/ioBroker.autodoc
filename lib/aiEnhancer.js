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

/** OpenAI/Ollama system role: keeps small models closer to guest-safe output */
const ONBOARDING_SYSTEM_MESSAGE =
	'You write only short welcome text for house guests. Never name home-automation software brands, protocols (MQTT, CoAP, …), APIs, adapters, instances, IP addresses, or programming tools (JavaScript, Blockly, …). Never output Denglish. Rewrite any technical input into plain household language. If unsure, omit the detail.';

/** German system text so local models think in idiomatic German, not English-then-translate */
const ONBOARDING_SYSTEM_MESSAGE_DE =
	'Du schreibst kurze, einladende Willkommenstexte für Gäste in natürlichem, korrektem Hochdeutsch — wie ein freundlicher Gastgeber, nicht wie eine Maschinenübersetzung. Keine Software-, Netzwerk- oder Programmierbegriffe aus dem Kontext; umgangssprachlich-alltägliche Wörter für Licht, Wärme, Rollläden, Bewegung usw. Kein Denglish.';

const USER_SYSTEM_MESSAGE_DE =
	'Du schreibst praxisnahe Smart-Home-Hinweise für Bewohner auf Deutsch: klar, natürlich, grammatikalisch korrekt — nicht hölzern übersetzt. Technische IDs und Objektpfade weglassen; sinnvolle Alltagssprache verwenden.';

/**
 * Prompt block: native-sounding German (reduces calques, Behördendeutsch, broken Sie-forms).
 * @returns {string}
 */
function buildGermanNaturalLanguageBlock() {
	return `
German style and wording (mandatory — sounds human, not translated):
- Write as a native German speaker would: idiomatic word order and connectors (deshalb, übrigens, gerne, natürlich), not English sentences with German words.
- Polite "Sie" with correct verb agreement everywhere (e.g. "Überprüfen Sie …", "Bitte wenden Sie sich …"). Never use plural imperative forms that address "ihr" ("Überprüft …", "Besprecht …") when using "Sie".
- Prefer short clear main clauses; split long ideas into two sentences. Avoid heavy noun stacks (Nominalstil) and bureaucratic filler ("Im Rahmen von …", "Es erfolgt eine …").
- Do not start with empty marketing openers ("Um ein perfektes Zuhause zu schaffen …") or abstract meta-sentences about "the first look into devices".
- No Denglish: no English fragments ("of", "the", mixed clauses). Established loanwords used in German (App, WLAN, Smart Home) are fine if the sentence is otherwise fully German.
- Bullets: full sentences or "Bitte …" + "Sie"; each line must read naturally if spoken aloud.
- Avoid odd literal metaphors (brain of the home, device writers, operational newspaper) — use normal household German.
`;
}

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
async function callAnthropic(apiKey, model, prompt, maxTokens, systemPrompt) {
	const body = {
		model,
		max_tokens: maxTokens,
		messages: [{ role: 'user', content: prompt }],
	};
	if (systemPrompt && systemPrompt.trim()) {
		body.system = systemPrompt.trim();
	}
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
		body,
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
async function callOpenAiCompatible(baseUrl, apiKey, model, prompt, maxTokens, systemPrompt) {
	const url = new URL('/v1/chat/completions', baseUrl);
	const headers = {};
	if (apiKey) {
		headers.Authorization = `Bearer ${apiKey}`;
	}

	const messages = [];
	if (systemPrompt && systemPrompt.trim()) {
		messages.push({ role: 'system', content: systemPrompt.trim() });
	}
	messages.push({ role: 'user', content: prompt });

	const response = await postJson(
		{
			hostname: url.hostname,
			port: url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80,
			path: url.pathname,
			secure: url.protocol === 'https:',
			headers,
		},
		{ model, max_tokens: maxTokens, messages },
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
 * Minimal facts for onboarding — no adapter lists, no ioBroker string (reduces model copy-paste).
 *
 * @param {object} docModel Document model
 * @returns {string}
 */
function buildOnboardingSystemSummary(docModel) {
	const sys = docModel.system;
	const rooms = docModel.rooms;
	const scripts = docModel.scripts;
	const adapters = docModel.adapters;
	const roomList = (rooms.rooms || []).slice(0, 22).map(r => r.name).join(', ');
	return [
		`Home title (plain): ${sys.projectName}`,
		`${rooms.totalRooms} named areas: ${roomList || 'none'}`,
		`About ${scripts.enabledScripts} automatic routines may run (time-based or event-based)`,
		`Many device types are linked (${adapters.totalAdapters} families) — in guest text say only "lights", "heating", "sensors", etc., never product or integration names from installers`,
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
		return `  • ${r.name} — about ${n} connected things`;
	});
	const lines = [
		'--- Facts for room/theme names only (rephrase themes in simple guest words; do not paste long labels) ---',
	];
	if (fnNames) {
		lines.push(`Theme labels from the home (rephrase, do not quote): ${fnNames}`);
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
 * @param {string} langCode Adapter language code: de | en | fr
 * @returns {string} Prompt text
 */
function buildAudiencePrompt(docModel, audience, langName, langCode) {
	const systemSummary = buildSystemSummary(docModel);

	if (audience === 'user') {
		const deGuide = langCode === 'de' ? buildGermanNaturalLanguageBlock() : '';
		return `You are a documentation assistant for a home automation system (ioBroker).
Write entirely in ${langName}.
${deGuide}
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

	const guestFacts = buildOnboardingSystemSummary(docModel);
	const detail = buildOnboardingDetailBlock(docModel);

	let langQuality = '';
	if (langCode === 'de') {
		langQuality = `${buildGermanNaturalLanguageBlock()}
German onboarding specifics:
- Narrative: concrete welcome (what guests might notice in named rooms), relaxed host tone — not a manual, not abstract philosophy of "smart living".
- Recommendations: only plausible guest behaviour (e.g. ask hosts before changing settings, note that lights may react automatically) — no fake IT chores.
`;
	} else if (langCode === 'fr') {
		langQuality = `
French: use consistent polite "vous"; grammatically correct sentences; no random English words in the middle.
`;
	}

	return `You write the "welcome" box for GUESTS and FIRST-TIME VISITORS of a smart home.
Write entirely in ${langName}. Tone: warm, calm, like a friendly host — not a technician and not marketing fluff.

Facts below are for reasoning only — paraphrase in simple daily language. Never copy technical nouns from lists into the guest text.

STRICTLY FORBIDDEN anywhere in the output (including substrings):
- The home-automation platform name that sounds like "io" + "Broker" (use "this smart home" / "the home" instead)
- Words: adapter, instance, driver, binding, OID, datapoint, Webinterface as a product name, "Gerätesuche" as a tool title, Backup-Feature as IT jargon
- Protocols / IT: MQTT, CoAP, REST, API, HTTP, HTTPS, JSON, WebSocket, IP, Telegram as a system name (you may say "message the host" without naming apps)
- Programming: JavaScript, Blockly, Skript(e) meaning code, Admin as a mode name, Repository
- Invented passwords, codes, or devices not implied by the data

ALLOWED: room names from the data; generic words (lighting, heating, shutters, motion, door/window); "the sections below in this page", "ask the people who live here"; sensible comfort and safety tips.

Guest-oriented facts (internal):
${guestFacts}

${detail}
${langQuality}

Instructions:
1. NARRATIVE: About 130–220 words (10–16 sentences or 2–3 short paragraphs). Welcome them. Describe what they might notice (light, warmth, shutters, things that happen by themselves) using room names. Reassuring, human, no checklist tone.
2. RECOMMENDATIONS: 6–9 bullet lines — short guest tips only (read the room sections below, things may run automatically, ask hosts before changing anything, who to contact). No setup steps, no IT tasks.

Before you finish, mentally check: if any forbidden word would appear, rewrite that sentence without it.

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
	 * @param {string} [systemPrompt] Optional system message (OpenAI-compatible + Anthropic)
	 * @returns {Promise<string>} Raw model text, or empty string if misconfigured
	 */
	async invokeProvider(config, provider, model, prompt, maxTokens, systemPrompt) {
		if (provider === 'anthropic') {
			const apiKey = (config.aiApiKey || '').trim();
			if (!apiKey) {
				this.adapter.log.warn('AI provider "anthropic" selected but no API key configured');
				return '';
			}
			return callAnthropic(apiKey, model, prompt, maxTokens, systemPrompt);
		}
		if (provider === 'groq') {
			const apiKey = (config.aiApiKey || '').trim();
			if (!apiKey) {
				this.adapter.log.warn('AI provider "groq" selected but no API key configured');
				return '';
			}
			return callOpenAiCompatible('https://api.groq.com', apiKey, model, prompt, maxTokens, systemPrompt);
		}
		if (provider === 'ollama') {
			const baseUrl = (config.aiBaseUrl || 'http://localhost:11434').trim();
			return callOpenAiCompatible(baseUrl, '', model, prompt, maxTokens, systemPrompt);
		}
		if (provider === 'mistral') {
			const apiKey = (config.aiApiKey || '').trim();
			if (!apiKey) {
				this.adapter.log.warn('AI provider "mistral" selected but no API key configured');
				return '';
			}
			return callOpenAiCompatible('https://api.mistral.ai', apiKey, model, prompt, maxTokens, systemPrompt);
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
	 * @param {string} langCode Adapter language (de | en | fr)
	 * @returns {Promise<{narrative: string, recommendations: string}|null>} Parsed sections or null
	 */
	async enhanceOneAudience(docModel, audience, provider, model, langName, langCode) {
		const prompt = buildAudiencePrompt(docModel, audience, langName, langCode || 'en');
		const lc = (langCode || 'en').toLowerCase();
		let systemPrompt = '';
		if (audience === 'onboarding') {
			systemPrompt = lc === 'de' ? ONBOARDING_SYSTEM_MESSAGE_DE : ONBOARDING_SYSTEM_MESSAGE;
		} else if (audience === 'user' && lc === 'de') {
			systemPrompt = USER_SYSTEM_MESSAGE_DE;
		}
		const maxTokens = audience === 'onboarding' ? MAX_TOKENS_ONBOARDING : MAX_TOKENS_USER;
		try {
			this.adapter.log.debug(
				`AI enhancement: provider=${provider}, model=${model}, audience=${audience}, max_tokens=${maxTokens}`,
			);
			const text = await this.invokeProvider(
				this.adapter.config,
				provider,
				model,
				prompt,
				maxTokens,
				systemPrompt,
			);
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
		const userAi = await this.enhanceOneAudience(docModel, 'user', provider, model, langName, lang);
		const onboardingAi = await this.enhanceOneAudience(
			docModel,
			'onboarding',
			provider,
			model,
			langName,
			lang,
		);

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
