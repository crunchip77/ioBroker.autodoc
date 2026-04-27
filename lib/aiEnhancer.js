/**
 * AutoDoc AI Enhancer
 * Generates narrative documentation text via pluggable AI providers (opt-in).
 * Supported providers: ollama (local/private), mistral (EU/GDPR), groq (US/free), anthropic (paid/premium)
 * When a provider is set, runs two tailored calls (user vs onboarding) for the HTML exports.
 * The documentation profile (admin/user/onboarding) only affects Markdown focus, not whether AI runs.
 */

const https = require('node:https');
const http = require('node:http');
const { formatOperatingSystemLine } = require('./hostDisplay');

/** Output budget for user-profile AI (OpenAI-style max_tokens). */
const MAX_TOKENS_USER = 900;
/** Richer onboarding guest text needs a higher ceiling (especially local Ollama). */
const MAX_TOKENS_ONBOARDING = 2000;
/** Second pass: normalize German onboarding to consistent "Sie" (Ollama often mixes du/Sie). */
const MAX_TOKENS_ONBOARDING_POLISH = 1400;
/** German Sie-polish pass: low temperature keeps edits close to the source text. */
const TEMPERATURE_ONBOARDING_POLISH = 0.2;

/** When admin leaves temperature empty, Ollama defaults are often too “creative” for small models — use a conservative default. */
const OLLAMA_DEFAULT_TEMPERATURE_USER = 0.32;
const OLLAMA_DEFAULT_TEMPERATURE_ONBOARDING = 0.36;

/**
 * Parse optional admin temperature (text or number). Empty / invalid → omit (provider default).
 *
 * @param {unknown} raw Config value
 * @returns {number|undefined} Finite number in [0, 2], or undefined
 */
function parseOptionalTemperature(raw) {
	if (raw === undefined || raw === null) {
		return undefined;
	}
	const s = String(raw).trim();
	if (!s) {
		return undefined;
	}
	const n = parseFloat(s.replace(',', '.'));
	if (!Number.isFinite(n)) {
		return undefined;
	}
	return Math.min(2, Math.max(0, n));
}

/** Default HTTP timeout for one LLM request (local 8B on CPU often needs several minutes). */
const DEFAULT_REQUEST_TIMEOUT_MS = 300000;
const MIN_REQUEST_TIMEOUT_MS = 30000;
const MAX_REQUEST_TIMEOUT_MS = 900000;

/** Max scripts to send for source analysis (token/time budget). */
const MAX_SCRIPT_SOURCE_AI = 32;
/** Max characters of (redacted) source per script for the LLM. */
const MAX_SCRIPT_CHARS_FOR_AI = 12000;
const MIN_MAX_SCRIPT_CHARS_FOR_AI = 2000;
const ABS_MAX_SCRIPT_CHARS_FOR_AI = 100000;
/** Completion budget per script explanation. */
const MAX_TOKENS_SCRIPT_SUMMARY = 450;

/**
 * @param {object} [config] Adapter `native` config
 * @returns {number}
 */
function parseMaxScriptCharsForAi(config) {
	const raw = config && config.aiMaxScriptCharsForAi;
	if (raw === undefined || raw === null || raw === '') {
		return MAX_SCRIPT_CHARS_FOR_AI;
	}
	const n = Number(raw);
	if (!Number.isFinite(n)) {
		return MAX_SCRIPT_CHARS_FOR_AI;
	}
	return Math.min(ABS_MAX_SCRIPT_CHARS_FOR_AI, Math.max(MIN_MAX_SCRIPT_CHARS_FOR_AI, Math.round(n)));
}

/**
 * Redact lines that likely contain secrets before sending script source to an LLM.
 *
 * @param {string} source
 * @returns {string}
 */
function redactScriptSourceForAi(source) {
	const lines = String(source || '').split(/\r?\n/);
	const sensitive =
		/password|passwd|token|secret|apikey|api[_-]?key|authorization|bearer|credential|private[_-]?key|client[_-]?secret/i;
	return lines.map(line => (sensitive.test(line) ? '[line omitted — possible secret]' : line)).join('\n');
}

/**
 * @param {string} source
 * @param {number} max
 * @returns {string}
 */
function truncateScriptSource(source, max) {
	const t = String(source || '');
	if (t.length <= max) {
		return t;
	}
	return `${t.slice(0, max)}\n[… truncated …]`;
}

/**
 * Optional admin override: seconds per API call (empty → default 300s).
 *
 * @param {object} [config] Adapter config
 * @returns {number} Timeout in milliseconds
 */
function parseRequestTimeoutMs(config) {
	if (!config) {
		return DEFAULT_REQUEST_TIMEOUT_MS;
	}
	const raw = config.aiRequestTimeoutSeconds;
	if (raw === undefined || raw === null || String(raw).trim() === '') {
		return DEFAULT_REQUEST_TIMEOUT_MS;
	}
	const n = parseInt(String(raw).trim(), 10);
	if (!Number.isFinite(n) || n < 1) {
		return DEFAULT_REQUEST_TIMEOUT_MS;
	}
	const ms = n * 1000;
	return Math.min(MAX_REQUEST_TIMEOUT_MS, Math.max(MIN_REQUEST_TIMEOUT_MS, ms));
}

/** English labels for device categories — sent to the LLM for factual grounding (matches roleMapper categories). */
const CAPABILITY_LABEL_EN = {
	light: 'lighting',
	dimmer: 'dimmed lighting',
	blind: 'blinds or shutters',
	thermostat: 'heating or room temperature',
	humidity: 'humidity',
	motion: 'motion detection',
	door: 'doors',
	window: 'windows',
	alarm: 'alarm',
	lock: 'locks',
	switch: 'switches or outlets',
	media: 'media playback',
	camera: 'cameras',
	power: 'power or energy metering',
	other: 'other or unclassified devices',
};

/**
 * Per-room capability summary from real ioBroker roles (reduces invented devices/scenes).
 *
 * @param {object} docModel Document model
 * @param {number} maxRooms Max rooms to include
 * @returns {string} Block for the LLM prompt
 */
function buildRoomCapabilityGrounding(docModel, maxRooms = 22) {
	const rooms = docModel.rooms?.rooms;
	if (!rooms || rooms.length === 0) {
		return [
			'--- Grounding: rooms ---',
			'No rooms are defined in this export. Do not invent named rooms; keep wording generic (e.g. "here in the home").',
		].join('\n');
	}
	const lines = [
		'--- Grounding: real rooms + device categories inferred from ioBroker roles (only these may inspire concrete wording) ---',
	];
	for (const r of rooms.slice(0, maxRooms)) {
		const devs = r.devices || [];
		const cats = new Set();
		for (const d of devs) {
			const key = d.category || 'other';
			cats.add(CAPABILITY_LABEL_EN[key] || CAPABILITY_LABEL_EN.other);
		}
		const capStr =
			devs.length === 0
				? 'no devices linked in this export'
				: [...cats].sort().join('; ') || CAPABILITY_LABEL_EN.other;
		lines.push(`• Room "${r.name}": ${devs.length} linked device(s); observed categories: ${capStr}`);
	}
	lines.push(
		'End grounding. Do not claim specific sensors, appliances, pressures, furniture, shopping, backpacks, or subsystems unless they fit these categories and room names. If information is thin, stay short and generic.',
	);
	return lines.join('\n');
}

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

/** When onboarding AI fails or returns admin-style text, use this instead of copying the user-profile block. */
const NEUTRAL_ONBOARDING_GUEST = {
	de: {
		narrative:
			'Willkommen in diesem Zuhause. Licht, Temperatur oder Beschattung können hier automatisch mitlaufen — das ist gewollt und von den Bewohnern eingerichtet. Die einzelnen Räume und weitere Orientierung finden Sie in den Abschnitten weiter unten auf dieser Seite.',
		recommendations:
			'- Bei Fragen oder Anliegen wenden Sie sich bitte an die Bewohner.\n- Bitte ändern Sie keine Einstellungen ohne deren Zustimmung.\n- Weitere Informationen zu den Bereichen dieses Zuhauses stehen in der Dokumentation unterhalb dieses Kastens.',
	},
	en: {
		narrative:
			'Welcome. Lighting, temperature, or shades may run automatically here — that is intentional. You will find rooms and more orientation in the sections further down on this page.',
		recommendations:
			'- For questions, please ask the people who live here.\n- Please do not change settings without their consent.\n- More information appears in the documentation below this box.',
	},
	fr: {
		narrative:
			"Bienvenue. L'éclairage, la température ou les stores peuvent fonctionner automatiquement — c'est voulu. Vous trouverez les pièces et des repères dans les sections plus bas sur cette page.",
		recommendations:
			"- Pour toute question, adressez-vous aux personnes qui habitent ici.\n- Merci de ne pas modifier les réglages sans leur accord.\n- Plus d'informations figurent dans la documentation sous cet encadré.",
	},
};

/**
 * Detect Bewohner/Admin-style KI text wrongly shown to guests.
 *
 * @param {string} narrative
 * @param {string} recommendations
 * @returns {boolean}
 */
function onboardingTextLooksLikeTechnicalDump(narrative, recommendations) {
	const b = `${narrative || ''}\n${recommendations || ''}`;
	if (/\bio\s*broker|\bioBroker\b|iroBroker|IroBroker|\biro\s+broker\b/i.test(b)) {
		return true;
	}
	if (
		/js-controller|Skriptausführung|Skripte?\s+fehlen|Adapter(?:suche)?|Gerätetreiber|Instanz(?:en)?|BackItUp|Repository|Wartungs.*score/i.test(
			b,
		)
	) {
		return true;
	}
	if (/\b\d+\s+(?:von|\/)\s*\d+\s+Adapter/i.test(b)) {
		return true;
	}
	if (/Host\s*[„"'']?[0-9a-f]{8,}/i.test(b)) {
		return true;
	}
	if (/Installation.*Version\s+\d+\.\d+/i.test(b)) {
		return true;
	}
	return false;
}

/**
 * @param {string} langCode
 * @returns {{ narrative: string, recommendations: string }}
 */
function getNeutralOnboardingGuestBlock(langCode) {
	const lc = (langCode || 'en').toLowerCase();
	if (lc === 'de') {
		return { ...NEUTRAL_ONBOARDING_GUEST.de };
	}
	if (lc === 'fr') {
		return { ...NEUTRAL_ONBOARDING_GUEST.fr };
	}
	return { ...NEUTRAL_ONBOARDING_GUEST.en };
}

/**
 * Short factual DE text when the model output is still unusable after polish (no extra LLM call).
 *
 * @param {object} docModel
 * @returns {{ narrative: string, recommendations: string }}
 */
function buildGermanUserFallbackBlock(docModel) {
	const sys = docModel.system;
	const stats = sys.statistics || {};
	const en = stats.enabledInstanceCount ?? 0;
	const dis = stats.disabledInstanceCount ?? 0;
	const rooms = docModel.rooms?.totalRooms ?? 0;
	const name = (sys.projectName || 'ioBroker').trim() || 'ioBroker';
	const parts = [`Kurzüberblick zur Installation „${name}“.`, `${en} Adapter-Instanzen sind aktiv.`];
	if (dis > 0) {
		parts.push(`${dis} Instanzen sind derzeit deaktiviert — das kann Absicht sein.`);
	}
	if (rooms > 0) {
		parts.push(`${rooms} Räume oder Bereiche sind in dieser Dokumentation genannt.`);
	}
	parts.push('Einzelheiten zu Adaptern, Geräten, Skripten und Werten stehen in den folgenden Kapiteln dieser Seite.');
	const narrative = parts.join(' ');
	const recommendations = [
		'- Listen und Tabellen zu Adaptern, Räumen und Skripten finden Sie weiter unten auf dieser Seite.',
		'- Vor dem Aktivieren deaktivierter Instanzen prüfen Sie, ob das Absicht ist.',
		'- Änderungen an Automationen besprechen Sie mit den anderen Bewohnern, wenn das für Sie üblich ist.',
	].join('\n');
	return { narrative, recommendations };
}

/**
 * Resident (user-profile) DE text still contains known small-model garbage after polish.
 *
 * @param {string} narrative
 * @param {string} recommendations
 * @returns {boolean}
 */
function germanUserAiStillUnacceptable(narrative, recommendations) {
	const b = `${narrative || ''}\n${recommendations || ''}`;
	if (!b.trim()) {
		return true;
	}
	if (/iroBroker|IroBroker|\biro\s+broker\b|iRover|\bIr[oó]ver\b|Adapatoren?|Adapator|\bGerätee\b/i.test(b)) {
		return true;
	}
	if (/Haushälter|Haushalter\b|Putzfrau|Entspannung.*Spezialist|Spezialist.*Entspannung/i.test(b)) {
		return true;
	}
	if (/besprecht\s+Sie|fähartig|einfächert|überwünscht|Lichtanregungen/i.test(b)) {
		return true;
	}
	return false;
}

/**
 * Guest onboarding DE text still unsafe or absurd after polish — fall back to neutral guest block.
 *
 * @param {string} narrative
 * @param {string} recommendations
 * @returns {boolean}
 */
function germanOnboardingGuestStillUnacceptable(narrative, recommendations) {
	const b = `${narrative || ''}\n${recommendations || ''}`;
	if (!b.trim()) {
		return true;
	}
	if (/Haushälter|Haushalter\b|Putzfrau|Reinigungsfirma/i.test(b)) {
		return true;
	}
	if (/iroBroker|IroBroker|\biro\s+broker\b|iRover|\bIr[oó]ver\b/i.test(b)) {
		return true;
	}
	if (/Entspannung.*Spezialist|Spezialist.*Entspannung/i.test(b)) {
		return true;
	}
	return false;
}

/** OpenAI/Ollama system role: keeps small models closer to guest-safe output */
const ONBOARDING_SYSTEM_MESSAGE =
	'You write only short welcome text for house guests. Never name home-automation software brands, protocols (MQTT, CoAP, …), APIs, adapters, instances, IP addresses, or programming tools (JavaScript, Blockly, …). Never output Denglish. Never mention maintenance scores, disabled components, backup tools, or “how many adapters”. Never type the substring "Broker" or the letters io+Broker as a product name. Do not invent specific appliance behaviours (AC warming food, exact sunrise blind rules) — stay vague unless facts explicitly say so. Rewrite any technical input into plain household language. If unsure, omit the detail.';

/** German system text so local models think in idiomatic German, not English-then-translate */
const ONBOARDING_SYSTEM_MESSAGE_DE =
	'Du schreibst kurze Willkommenstexte für Gäste: natürliches Höflichkeits-Deutsch mit "Sie" in jedem Satz und in jeder Aufzählung — niemals "du", niemals du-Imperative wie "Lies", "Überprüfe", "Aktualisiere", "Halte", "Sei". Das Wort "ioBroker" und alles mit "Broker" als Produktname ist verboten (sage stattdessen "zu Hause", "die Steuerung hier", "dieses Zuhause"). Keine Adapter, Instanzen, Skript-Manager, maintenance-score, Wartungszahlen, BackItUp, Telegram-Adapter, Webinterface als Fachbegriff. Keine erfundenen Abläufe (Klima wärmt Essen, exakte Sonnenauf-/Untergangs-Szenen), wenn nicht klar aus den Fakten — lieber vorsichtig allgemein. Kein Denglish: kein Englisch mitten im Satz (kein "our", "home page(s)", keine halben englischen Sätze); kein "Schedule", "Score". Räume grammatikalisch richtig: **das** Arbeitszimmer, **das** Schlafzimmer — niemals "der Arbeitszimmer". **Das WC** (neutrum), nie "der WC". Keine Personifizierung: Räume "leben" oder "arbeiten" nicht — stattdessen "In diesem Zuhause gibt es …", "Zu den Bereichen gehören …". **Wenn Sie noch Fragen haben**, nie "wenn Sie sich noch Fragen macht". Licht und Temperatur **an die Bedürfnisse anpassen** oder **laufen oft mit** — nie holprige Kalque wie "auf Ihrem Bedürfnis ausgehen". Gäste fragen, ob sie **einen Raum nutzen** oder **betreten dürfen** — nicht "im Raum verbrauchen". **Die Bewohner** und **ihre Grenzen** — nicht "Respekt seiner Grenzen" bei mehreren Bewohnern. Keine Hotel- oder Behördenklischees: **Beschilderungen** im Privathaushalt nur wenn wirklich plausibel, sonst weglassen. Kein widersinniger Rat wie "einen ruhigen Ort stören, wenn Sie müde sind". Aufzählungen mit "- " am Zeilenanfang, keine leeren oder doppelten Sternchen-Zeilen. Keine kaputten Wörter oder Pseudo-Komposita (z. B. "Schiebemögliche"); Fensterbeschattung: **Jalousien**, **Rollläden**, **Beschattung** — niemals "Blinde"/"Blinden" für Rollläden (falsche Bedeutung). Kein ganzer Text in markdown ** eingepackt; keine Meta-Schlussfloskel ("Ich hoffe, diese Vorschläge …"). Kein Software-Marketing ("freue mich Sie kennenzulernen", "komfortables Erlebnis") — Ton wie eine einladende Wohnung, nicht wie eine App. Keine Gästeansprache mit IT-Jargon (Algorithmen, sensibel im Tech-Sinn). Bewohner **bieten** Hilfe an / stehen für Fragen zur Verfügung — nicht formulieren, als würden die Bewohner "Hilfe anfragen". Keine sinnfremden Themen (Autobahn, Fernsehen, Nachrichten, Streaming) — nur Zuhause, Gäste, Bewohner, Komfort, Sicherheit. Schreibe nur über Räume und Gerätetypen, die im Prompt-Block "Grounding" vorkommen — keine Märchen, kein Verkauf, kein Gepäck, keine erfundenen Zimmernamen. Niemals "Vorgesetzte" oder "Ihre Vorgesetzten" im Privathaushalt — Ansprechpartner sind die Bewohner oder die hier Wohnenden.';

const USER_SYSTEM_MESSAGE_DE =
	'Du schreibst praxisnahe Smart-Home-Hinweise für Bewohner auf Deutsch: klar, natürlich, grammatikalisch korrekt — nicht hölzern übersetzt. Produktname immer exakt **ioBroker** (kleines io, großes B) — niemals Tippfehler wie **iroBroker**, **IroBroker**, **iro broker**. **Adapter** / **Adapter-Instanzen** schreiben — niemals erfundene Formen wie **Adapatoren**. Keine erfundenen Geräte, Apps oder Marken (z. B. kein **iRover**, keine Fantasie-Produkte), wenn sie nicht in den Systemdaten vorkommen. Kein erfundenes Personal (**Haushälter**, **Haushalter**, **Putzfrau**, **Spezialist für Entspannung** o. Ä.) — es geht um die eigene Wohnung und ioBroker, nicht um Dienstleister-Fiktion. Interne Host- oder Container-IDs (lange Hex-Zeichenketten) nicht wörtlich in den Fließtext — „Ihr ioBroker-Server“ oder Projekttitel. Technische Objektpfade weglassen; sinnvolle Alltagssprache. Keine Denglish-Wortformen (kein „Disablete“); keine Pseudo-Wörter (**fähartig**, **einfächert**, **überwünscht**, **Lichtanregungen**). Ruhiger Ton bei Wartung. Nicht pauschal „alle deaktivierten Adapter einschalten“. Markennamen nur wie in den Systemdaten. Nur Räume/Fähigkeiten aus dem Grounding — keine Fantasie-Szenen. Keine Meta-Stichpunkte, die ioBroker „nur als Programm“ definieren.';

/** Editor pass after onboarding generation (German only). */
const GERMAN_ONBOARDING_POLISH_SYSTEM =
	'Du bist deutscher Lektor für Gästetexte. Du änderst nur Anrede, Grammatik und holprige Formulierungen. Du erfindest keine neuen Fakten und keine neuen Produktnamen. Themenfremde oder unsinnige Stichpunkte (z. B. Autobahnverkehr, Fernsehen, Nachrichten) streichen oder durch einen sachlichen Gast-Hinweis zu diesem Zuhause ersetzen — nicht stehen lassen. **Haushälter**, **Haushalter**, Putzfrau, Reinigungsfirma oder anderes erfundenes Dienstpersonal **entfernen** — Gäste wenden sich an **Bewohner** / **die hier wohnen**. Holpriges "sich auf unsere Seiten beschäftigen" → natürlich ("in den Abschnitten unten nachlesen" o. Ä.). Englisch in deutscher Ausgabe entfernen (z. B. "our home pages" → "in den Abschnitten auf dieser Seite" / "bei den Räumen unten"). "Der Arbeitszimmer" → "Das Arbeitszimmer"; **der WC** → **das WC**. Sätze, in denen **Räume leben oder arbeiten**, in natürliches Deutsch umschreiben (Zuhause hat Räume / es gibt …). **sich noch Fragen macht** → **noch Fragen haben** o. Ä. Kalque **Bedürfnis ausgehen** / **auf Ihrem Bedürfnis** → **an Ihre Bedürfnisse anpassen** oder **passt sich oft an**. **im Raum verbrauchen** → **einen Raum nutzen** / **betreten**. **Respekt seiner Grenzen** bei Bewohnern → **ihre Grenzen** / **die Grenzen der Bewohner**. Unplausible **Beschilderungen** im Privathaushalt streichen. Widersinn wie **Ort stören, wenn müde** bereinigen. Meta-Doppelungen (**Dazu steht gerne Hilfe** nach langem Einleitungssatz) kürzen. Leere oder kaputte Aufzählungszeilen (nur Sternchen, oder Backslash-Stern vor dem Text) entfernen oder mit dem Nachbarsatz zusammenführen. Kaputte Wörter wie "Schiebemögliche" durch sinnvolles Deutsch ersetzen. Fenster-"blinds": **Blinde/Blinden** bei Rollläden → **Jalousien** oder **Rollläden**. Unsinn wie "Wetter einzuklagen" streichen. Meta-Schlussfloskeln und äußere markdown-**-Rahmen um ganze Absätze entfernen. **Vorgesetzte** im Privathaushalt → **Bewohner** / **die hier wohnen**. Bewohner **bieten** Hilfe **an** — nicht "Hilfe anzufragen" für die Bewohner. Holpriges "Anstoß haben" → "ein Anliegen haben". "Wohnern" → "Bewohnern". Ausgabe immer exakt mit NARRATIVE: und RECOMMENDATIONS: wie vorgegeben.';

/** Second pass for German **user** (resident) profile — same tooling as onboarding polish, different brief. */
const GERMAN_USER_POLISH_SYSTEM =
	'Du bist deutscher Lektor für Bewohner-Hinweise zu einem Smart Home (ioBroker). Du korrigierst Grammatik und Anrede: durchgängig höfliches **Sie** mit richtigen Verbformen — keine **du**-Formen, keine Plural-Imperative an eine Person (**Überprüft …**, **Organisiert …**, **Besprecht … Sie**); stattdessen **Bitte prüfen Sie …**, **Überprüfen Sie …**, **Besprechen Sie …**. Produktname immer **ioBroker** schreiben — **iroBroker** / **IroBroker** / **iro broker** sind Tippfehler und müssen korrigiert werden. **Adapter**, nicht **Adapatoren** / **Adapator**. Streiche erfundene Marken (**iRover**, ähnlicher Unsinn) und erfundenes Personal (**Haushälter**, **Haushalter**, **Putzfrau**, **Entspannung** + **Spezialist**). Entferne offensichtlich erfundene Dinge (Smart-Flasche, Wäschemöcke, wirre Szenen). Grammatik: **Ihr Smart Home** / **Ihr Zuhause**, nicht „Ihren Smart Home“; **auslesen**, nicht „auslese“ am Satzende. Keine **NARRATIVE**/**RECOMMENDATIONS** im Fließtext. Keine englischen Formatwörter. Du erfindest keine neuen Adapter. Ausgabe exakt mit NARRATIVE: und RECOMMENDATIONS: wie vorgegeben.';

/**
 * Prompt block: native-sounding German (reduces calques, Behördendeutsch, broken Sie-forms).
 *
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
- Grammar: "dieses Dokument lesen/durchlesen", not "diesem Dokument …"; vehicles drive or park "ein", not "einheben".
`;
}

/**
 * Extra rules for **user** (resident) profile in German — Denglish, brands, tone.
 *
 * @returns {string}
 */
function buildGermanUserResidentBlock() {
	return `
German — residents (not guests):
- No Denglish word shapes: write **deaktiviert** / **ausgeschaltete Komponenten**, not pseudo-words like "Disablete"; use **Skriptausführungen** or plain **laufende Automatisierungen**, not mangled compounds ("Skriptausführe"); do not turn adjectives into odd nouns (no **Hilfswillig** as a noun).
- For **brand/product names** (Shelly, BackItUp, Telegram, …): mention them only if they appear as adapter titles in the system data above; otherwise use generic terms (smart switch, backup, message the household, notification).
- **Maintenance / disabled instances:** factual and calm — no alarmist or surreal phrasing; short sentences.
- **Bullets:** do not repeat the same idea five times (documentation / support / updates) — merge into one clear tip where possible.
- **Grammar:** neuter nouns use "jedes" (jedes Skript, jedes Gerät), not "jeden"; prefer real words like **Funktionsfehler** — do not invent broken compounds ("Functionierungsfehler", etc.).
- **Addressing residents:** polite **Sie** only — never **du** / **dir** / **dich** or du-imperatives ("Überprüfe …") in narrative or bullets.
- **Host / IDs:** do not paste cryptic host or container ids (hex strings) into the text — paraphrase ("Ihr ioBroker-Server", project title).
- **Disabled adapters:** never order residents to "switch every disabled adapter on tonight" — some may be intentional; suggest reviewing whether deactivation is deliberate.
- **Wording:** no broken compounds ("Sicherheitssicherheit", "telegramms"); use normal German ("Sicherheitsüberprüfung", "Telegram-Bot" if the data mentions Telegram).
- **No meta bullets:** do not waste a recommendation line explaining that "ioBroker is only a program" or defining the product — residents already use it; every bullet must be a concrete habit or check tied to the data above.
- **Grammar:** "in **diesem** Projekt" / "im Kontext **dieses Projekts**" — not "dieses Projekt" as object of "im Kontext" without genitive.
`;
}

/**
 * Heuristic: German onboarding text likely mixes du/Sie or uses du-imperatives in bullets.
 *
 * @param {string} narrative
 * @param {string} recommendations
 * @returns {boolean}
 */
function germanOnboardingNeedsSiePolish(narrative, recommendations) {
	const blob = `${narrative || ''}\n${recommendations || ''}`;
	if (!blob.trim()) {
		return false;
	}
	if (/\b(du|dir|dich|euch)\b/i.test(blob)) {
		return true;
	}
	if (/Frag\s+uns|frag\s+uns/i.test(blob)) {
		return true;
	}
	if (/\bLies\b/.test(blob)) {
		return true;
	}
	if (
		/^\s*[-*•]?\s*(Lies|Überprüfe|Frag|Stelle\s+sicher,\s*dass\s+du|Halte|Aktiviere|Besuche|Nimm|Nutze)\b/im.test(
			recommendations || '',
		)
	) {
		return true;
	}
	// Denglish, wrong articles, broken compounds, or wrong "Hilfe anfragen" for hosts — run lektor pass
	if (/\b(our|home\s+pages?)\b/i.test(blob)) {
		return true;
	}
	if (/\bDer\s+Arbeitszimmer\b|\bSchiebemögliche\b|\bAlgorithmen\b/i.test(blob)) {
		return true;
	}
	if (/Bewohner.*Hilfe\s+anzufragen|Hilfe\s+anzufragen.*Bewohner/i.test(blob)) {
		return true;
	}
	if (/\bbereit,\s*Hilfe\s+anzufragen\b/i.test(blob)) {
		return true;
	}
	if (/\bBlinde(?:n)?\s+oder\s+Rolllad/i.test(blob) || /einzuklagen/i.test(blob)) {
		return true;
	}
	if (/\bIch hoffe,?\s+diese\s+Vorschläge\b/i.test(blob)) {
		return true;
	}
	if (/\bVorgesetzt/i.test(blob)) {
		return true;
	}
	// Unrealistic / broken German common in small-model onboarding
	if (/Räume.*\b(leben|arbeiten)\b|\b(leben|arbeiten)\b.*\bRäume\b/i.test(blob)) {
		return true;
	}
	if (/\bder\s+WC\b/i.test(blob)) {
		return true;
	}
	if (/\bFragen\s+macht\b/i.test(blob) || /\bsich\s+noch\s+Fragen\s+macht/i.test(blob)) {
		return true;
	}
	if (/Bedürfnis\s+auszugehen|auf\s+Ihrem\s+Bedürfnis|auf\s+Ihre\s+Bedürfnis\b/i.test(blob)) {
		return true;
	}
	if (/\bverbrauchen\b.*\bRaum|\bRaum\b.*\bverbrauchen\b/i.test(blob)) {
		return true;
	}
	if (/Respekt\s+seiner\s+Grenzen|Bewohner.*seiner\s+Grenzen/i.test(blob)) {
		return true;
	}
	if (/\bBeschilderung/i.test(blob)) {
		return true;
	}
	if (/\bstören\s+Sie\s+(ihn|den\s+Ort)/i.test(blob) && /\bmüde\b/i.test(blob)) {
		return true;
	}
	if (/Dazu\s+steht\s+gerne\s+Hilfe|steht\s+gerne\s+einige\s+Tipps/i.test(blob)) {
		return true;
	}
	if (/Haushälter|Haushalter\b|unseren\s+Seiten\s+beschäftigen|beschäftigen.*\bSeiten\b/i.test(blob)) {
		return true;
	}
	if (
		/(?:^|\n)\s*[-*•]?\s*\\\*\s*\S/m.test(recommendations || '') ||
		/(?:^|\n)\s*\*\s*\\\*/m.test(recommendations || '')
	) {
		return true;
	}
	return false;
}

/**
 * Heuristic: German **resident** (user-profile) text needs the same lektor pass as onboarding
 * plus fixes for plural imperatives and echoed section labels.
 *
 * @param {string} narrative
 * @param {string} recommendations
 * @returns {boolean}
 */
function germanUserProfileNeedsPolish(narrative, recommendations) {
	if (germanOnboardingNeedsSiePolish(narrative, recommendations)) {
		return true;
	}
	const n = narrative || '';
	const r = recommendations || '';
	const blob = `${n}\n${r}`;
	if (/\bNARRATIVE\b/i.test(n) || /\bRECOMMENDATIONS\b/i.test(n)) {
		return true;
	}
	if (/(?:^|\n)\s*[-*•]?\s*Überprüft\s+/m.test(r)) {
		return true;
	}
	if (/(?:^|\n)\s*[-*•]?\s*Organisier\w*\s+/im.test(r)) {
		return true;
	}
	if (/\borganisierst\b/i.test(blob)) {
		return true;
	}
	if (/\bInternet\s+verlassen\b/i.test(blob)) {
		return true;
	}
	if (/Smart[- ]?Flasche|Wäschemöck|Licht\s+einführen|vollen\s+tank\s+stand/i.test(blob)) {
		return true;
	}
	if (/\bauslese\s*([.!?]|$)/im.test(blob)) {
		return true;
	}
	if (/\bIhren\s+Smart\s+Home\b/i.test(n)) {
		return true;
	}
	if (
		/iroBroker|IroBroker|iRover|\bIr[oó]ver\b|Adapat|Gerätee\b|Haushälter|Haushalter\b|besprecht\s+Sie|fähartig|einfächert|überwünscht|Lichtanregungen/i.test(
			blob,
		)
	) {
		return true;
	}
	return false;
}

/**
 * User prompt for the German Sie-consistency polish pass (onboarding only).
 *
 * @param {{ narrative: string, recommendations: string }} block
 * @returns {string}
 */
function buildGermanOnboardingPolishUserPrompt(block) {
	const n = (block.narrative || '').trim();
	const r = (block.recommendations || '').trim();
	return `Unten steht ein Gäste-Text (Willkommen + Tipps). Aufgabe:

1) Durchgängig höfliches **Sie** mit passenden Verbformen. Entferne **du**, **dir**, **dich**, **euch** und alle du-Imperative; ersetze durch natürliche Sie-Formulierungen (z. B. "Bitte lesen Sie …", "Wenden Sie sich …").
2) Grammatik: z. B. **technischen Support** (Dativ), **das Licht**, keine holprigen Konstruktionen wie "Verständnis im Hinterkopf haben".
3) Keine leeren Meta-Phrasen: nicht "besuchen Sie uns regelmäßig" oder "nehmen Sie sich unsere Zeit" — Ansprechpartner sind die **Bewohner** ("wenden Sie sich an die Bewohner", "fragen Sie vorher die Bewohner").
4) Englisch entfernen; falsche Artikel bei Zimmernamen korrigieren (**das** Arbeitszimmer); "Hilfe anzufragen" nur für Gäste, die Hilfe brauchen — Bewohner **bieten** Hilfe **an**.
5) Keine neuen Fakten, keine neuen Markennamen; Text nicht künstlich verlängern.
6) Privates Zuhause: **Vorgesetzte** / **Ihre Vorgesetzten** / **von Ihren Vorgesetzten** durch **Bewohner** / **die hier wohnen** / **den Haushalt** ersetzen — nie Büro-Sprache für Smart Home.
7) Realität: keine lebenden/arbeitenden Räume; **das WC** statt **der WC**; **wenn Sie noch Fragen haben** statt „sich Fragen macht“; Licht/Temperatur natürlich formulieren; Raumnutzung nicht „verbrauchen“; **ihre Grenzen** bei Bewohnern; unplausible **Beschilderung** streichen; widersinnige Ratschläge (Ort „stören“ wenn müde) entfernen.
8) Aufzählungen: sinnvolle Zeilen mit „- “; leere Sternchen-Zeilen entfernen; falsches Backslash-Sternchen nach Bindestrich/Asterisk am Zeilenanfang bereinigen.

Ausgabe **exakt** in diesem Format (gleiche Überschriften):

NARRATIVE:
<text>

RECOMMENDATIONS:
<text>
(each recommendation line may start with "- ")

Eingabe:

NARRATIVE:
${n}

RECOMMENDATIONS:
${r}`;
}

/**
 * User prompt for the German lektor pass (resident / user profile only).
 *
 * @param {{ narrative: string, recommendations: string }} block
 * @returns {string}
 */
function buildGermanUserPolishUserPrompt(block) {
	const n = (block.narrative || '').trim();
	const r = (block.recommendations || '').trim();
	return `Unten steht ein Bewohner-Text (Überblick + konkrete Hinweise). Aufgabe:

1) Durchgängig **Sie** mit passenden Verbformen. Keine **du**-Formen; keine Plural-Imperative (**Überprüft**, **Organisiert**) — umformulieren zu **Bitte prüfen Sie …**, **Überprüfen Sie …**.
2) Grammatik und natürliches Deutsch: z. B. **Ihr Smart Home** / **Ihr Zuhause**; keine kaputten Endungen (**auslese** → **auslesen**).
3) Offensichtlichen Unsinn oder erfundene Objekte streichen oder durch einen kurzen sachlichen Hinweis ersetzen, der zu einem normalen Zuhause passt.
4) Die Wörter **NARRATIVE** und **RECOMMENDATIONS** dürfen nur als vorgegebene Überschriften vorkommen — nicht im Fließtext.
5) Keine neuen Marken oder Adapter erfinden; Text nicht künstlich aufblasen.

Ausgabe **exakt** in diesem Format:

NARRATIVE:
<text>

RECOMMENDATIONS:
<text>
(jede Empfehlungszeile darf mit "- " beginnen)

Eingabe:

NARRATIVE:
${n}

RECOMMENDATIONS:
${r}`;
}

/**
 * @param {number} code HTTP status
 * @param {string} detail Error detail text
 * @returns {Error} Rejection error with `statusCode` for retry logic
 */
function apiHttpError(code, detail) {
	const err = new Error(`API error ${code}: ${detail}`);
	err.statusCode = code;
	return err;
}

/**
 * Generic HTTP/HTTPS POST helper.
 *
 * @param {object} opts Request options: hostname, port, path, secure, headers
 * @param {object} body JSON request body
 * @param {number} [timeoutMs] Socket timeout (default DEFAULT_REQUEST_TIMEOUT_MS)
 * @returns {Promise<object>} Parsed JSON response
 */
function postJson(opts, body, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
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
				const code = res.statusCode ?? 0;
				let parsed = null;
				if (data) {
					try {
						parsed = JSON.parse(data);
					} catch {
						parsed = null;
					}
				}
				if (code >= 200 && code < 300) {
					if (parsed == null) {
						reject(new Error('Failed to parse API response: invalid JSON'));
						return;
					}
					resolve(parsed);
					return;
				}
				const detail =
					(parsed && typeof parsed === 'object' && parsed.error?.message) ||
					(data ? String(data).slice(0, 500) : '(empty body)');
				reject(apiHttpError(code, detail));
			});
		});

		req.on('error', reject);
		req.setTimeout(timeoutMs, () => {
			const err = new Error(`API request timed out after ${Math.round(timeoutMs / 1000)}s`);
			err.code = 'ETIMEDOUT';
			req.destroy(err);
		});
		req.write(payload);
		req.end();
	});
}

/** HTTP statuses and socket errors worth retrying (Ollama often returns 500 under VRAM/load). */
const TRANSIENT_LLM_HTTP = new Set([429, 500, 502, 503]);

/**
 * @param {Error} err Request failure
 * @returns {boolean} Whether to retry the call
 */
function isTransientLlmFailure(err) {
	const c = err && err.statusCode;
	if (TRANSIENT_LLM_HTTP.has(c)) {
		return true;
	}
	if (err && err.code === 'ECONNRESET') {
		return true;
	}
	if (err && err.code === 'ETIMEDOUT') {
		return true;
	}
	const msg = err && err.message ? String(err.message) : '';
	if (msg.includes('API request timed out')) {
		return true;
	}
	return false;
}

/**
 * POST JSON with a few retries on transient failures (local Ollama 500s, timeouts, 429).
 *
 * @param {object} opts Same as postJson
 * @param {object} body JSON body
 * @param {number} timeoutMs Per-attempt timeout
 * @param {{ warn?: (msg: string) => void }} [log] Optional logger (adapter.log)
 * @returns {Promise<object>} Parsed JSON
 */
async function postJsonTransientRetries(opts, body, timeoutMs, log) {
	const maxAttempts = 4;
	const baseDelayMs = 8000;
	let lastErr;
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await postJson(opts, body, timeoutMs);
		} catch (err) {
			lastErr = err;
			const retry = attempt < maxAttempts && isTransientLlmFailure(err);
			if (!retry) {
				throw err;
			}
			const delayMs = Math.min(90000, baseDelayMs * 2 ** (attempt - 1));
			const snippet = (err.message || String(err)).slice(0, 180).replace(/\s+/g, ' ');
			if (log && typeof log.warn === 'function') {
				log.warn(
					`LLM HTTP attempt ${attempt}/${maxAttempts} failed (${snippet}) — retrying in ${Math.round(delayMs / 1000)}s…`,
				);
			}
			await new Promise(r => setTimeout(r, delayMs));
		}
	}
	throw lastErr;
}

/**
 * Call the Anthropic Messages API.
 *
 * @param {string} apiKey Anthropic API key
 * @param {string} model Model ID
 * @param {string} prompt User prompt
 * @param {number} maxTokens Max response tokens
 * @param {string|undefined} systemPrompt System message; omit or empty if none
 * @param {number|undefined} temperature 0–1 (clamped); `undefined` for API default
 * @param {number} timeoutMs HTTP timeout (ms)
 * @returns {Promise<string>} Response text
 */
async function callAnthropic(apiKey, model, prompt, maxTokens, systemPrompt, temperature, timeoutMs) {
	const body = {
		model,
		max_tokens: maxTokens,
		messages: [{ role: 'user', content: prompt }],
	};
	if (systemPrompt && systemPrompt.trim()) {
		body.system = systemPrompt.trim();
	}
	if (temperature !== undefined && Number.isFinite(temperature)) {
		body.temperature = Math.min(1, Math.max(0, temperature));
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
		timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
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
 * @param {string|undefined} systemPrompt System message; omit or empty if none
 * @param {number|undefined} temperature 0–2 (clamped); `undefined` for API default
 * @param {number} timeoutMs HTTP timeout (ms)
 * @param {{ warn?: (msg: string) => void }} [log] For retry warnings (pass adapter.log)
 * @returns {Promise<string>} Response text
 */
async function callOpenAiCompatible(
	baseUrl,
	apiKey,
	model,
	prompt,
	maxTokens,
	systemPrompt,
	temperature,
	timeoutMs,
	log,
) {
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

	const chatBody = { model, max_tokens: maxTokens, messages };
	if (temperature !== undefined && Number.isFinite(temperature)) {
		chatBody.temperature = Math.min(2, Math.max(0, temperature));
	}

	const t = timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
	const response = await postJsonTransientRetries(
		{
			hostname: url.hostname,
			port: url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80,
			path: url.pathname,
			secure: url.protocol === 'https:',
			headers,
		},
		chatBody,
		t,
		log,
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

	const documentedScripts = (scripts.scripts || [])
		.filter(s => s.enabled && s.desc && String(s.desc).trim())
		.slice(0, 25);
	const scriptContextLines = documentedScripts.map(s => {
		const d = String(s.desc).trim().replace(/\s+/g, ' ');
		const short = d.length > 200 ? `${d.slice(0, 200)}…` : d;
		return `- ${s.name}: ${short}`;
	});
	const scriptContextBlock =
		scriptContextLines.length > 0
			? `\nActive scripts with optional common.desc (ioBroker: group-purpose text — use only if relevant, not a full script spec):\n${scriptContextLines.join('\n')}`
			: '';

	const hostName = sys.primaryHost.name || '';
	const hostLooksLikeInternalId = /^[0-9a-f]{8,}$/i.test(hostName);
	const hostHint = hostLooksLikeInternalId
		? '\nWriter hint: the host "name" above is an internal/container id — do not quote it in the narrative; refer to "your ioBroker server" or use the project name instead.'
		: '';

	const scheduleModeLines = [];
	for (const a of adapters.adapters) {
		for (const inst of a.instances) {
			if (inst.enabled && inst.mode === 'schedule') {
				const suffix =
					inst.scheduleCron && String(inst.scheduleCron).trim() ? ` cron=${inst.scheduleCron}` : '';
				scheduleModeLines.push(`${a.name}.${String(inst.id).split('.').pop()}${suffix}`);
			}
		}
	}
	const scheduleDesignN = docModel.scheduleObjects && docModel.scheduleObjects.length;
	const automationExtras = [];
	if (scheduleModeLines.length > 0) {
		automationExtras.push(
			`Adapter instances in ioBroker "schedule" run mode (periodic adapter process, not script.js): ${scheduleModeLines.join('; ')}`,
		);
	}
	if (scheduleDesignN) {
		automationExtras.push(
			`Schedule-type objects from object view (type schedule): ${scheduleDesignN} — separate from JS scripts.`,
		);
	}

	const osShort = formatOperatingSystemLine(sys.primaryHost) || '—';
	const body = [
		`Project: ${sys.projectName}`,
		`Host: ${hostName} (OS: ${osShort}; runtime: ${sys.primaryHost.platform}; js-controller ${sys.primaryHost.version})`,
		`Adapters: ${adapters.totalAdapters} types, ${sys.statistics.enabledInstanceCount} enabled / ${sys.statistics.disabledInstanceCount} disabled instances`,
		`Top adapters: ${adapterList || 'none'}`,
		`Rooms: ${rooms.totalRooms} (${roomList || 'none'})`,
		`Functions: ${rooms.totalFunctions}`,
		`Scripts: ${scripts.totalScripts} total, ${scripts.enabledScripts} active`,
		`Maintenance score: ${maintenance.score}/100`,
		issueLines.length > 0
			? `Issues: ${issueLines.join('; ')}`
			: 'Checklist: no warnings (disabled instances are inventory only).',
	].join('\n');

	const automationBlock = automationExtras.length > 0 ? `\n${automationExtras.join('\n')}` : '';
	return `${body}${automationBlock}${scriptContextBlock}${hostHint}`;
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
	const roomList = (rooms.rooms || [])
		.slice(0, 22)
		.map(r => r.name)
		.join(', ');
	return [
		`Home title for greetings: ${sys.projectName}`,
		`${rooms.totalRooms} named areas — use these names when helpful: ${roomList || 'none'}`,
		`Some routines may run on schedules or sensors; in guest text describe only in gentle, general terms (e.g. lights or shutters may adjust). Do not invent detailed stories (meals, sunrise times, AC) unless the room/theme facts clearly imply them.`,
		`Internal: do not mention counts of scripts, adapters, disabled instances, backup systems, or any numeric "health" or maintenance score in the guest output — those facts are not in this block on purpose.`,
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
/**
 * Build an optional owner-context block from aiOwnerHints config + manualContext fields.
 * User profile: hints are authoritative. Onboarding/guest: same facts, but the model must paraphrase
 * without IT vocabulary — otherwise post-filters replace the whole block with neutral text.
 *
 * @param {object} docModel Document model
 * @param {'user'|'onboarding'} audience Target reader
 * @returns {string} Formatted block or empty string
 */
function buildOwnerContextBlock(docModel, audience) {
	const config = docModel._adapterConfig || {};
	const manual = docModel.manualContext || {};
	const isGuest = audience === 'onboarding';

	const parts = [];
	if (manual.description && manual.description.trim()) {
		parts.push(`Home description: ${manual.description.trim()}`);
	}
	if (manual.notes && manual.notes.trim()) {
		parts.push(`Admin notes: ${manual.notes.trim()}`);
	}
	if (manual.guestHelpNote && String(manual.guestHelpNote).trim()) {
		parts.push(`Help & emergencies (owner text): ${String(manual.guestHelpNote).trim()}`);
	}
	const qfPairs = [
		['Wi‑Fi/network', manual.troubleshootWifiHint],
		['Power/fuses', manual.troubleshootPowerHint],
		['Water shutoff', manual.troubleshootWaterHint],
		['Other', manual.troubleshootExtraHint],
	];
	for (const [label, val] of qfPairs) {
		if (val && String(val).trim()) {
			parts.push(`At-a-glance (${label}, owner): ${String(val).trim()}`);
		}
	}
	if (manual.homeRoutinesNote && String(manual.homeRoutinesNote).trim()) {
		parts.push(`Routines in plain language (owner text): ${String(manual.homeRoutinesNote).trim()}`);
	}
	if (docModel.customDocSections && docModel.customDocSections.length) {
		const audienceProfile = isGuest ? 'onboarding' : 'user';
		const titles = docModel.customDocSections
			.filter(s => !s.profiles || !s.profiles.length || s.profiles.includes(audienceProfile))
			.map(s => s.title);
		if (titles.length) {
			parts.push(`Custom documentation sections (owner-defined): ${titles.join('; ')}`);
		}
	}
	const hints = config.aiOwnerHints && String(config.aiOwnerHints).trim();
	if (hints) {
		if (isGuest) {
			parts.push(
				[
					'Operator context hints (PRIVATE — do not paste software/project wording into guest text).',
					'Paraphrase in simple household language only. Forbidden in guest output: Adapter, Instanz, Repository/Repo, ioBroker, Broker, Skript, roadmap, Git, dev/repo jargon.',
					'If setup is still in progress, say it gently (e.g. "hier wird noch eingerichtet") without IT metaphors.',
					hints,
				].join('\n'),
			);
		} else {
			parts.push(`Owner context (use as authoritative facts for this home):\n${hints}`);
		}
	}
	if (parts.length === 0) {
		return '';
	}

	const header = isGuest
		? 'Owner-provided context (private — paraphrase for guests; obey STRICTLY FORBIDDEN; keep warm host tone):'
		: 'Owner-provided context (treat as ground truth — do not contradict these facts):';

	return `\n\n${header}\n${parts.join('\n')}`;
}

function buildAudiencePrompt(docModel, audience, langName, langCode) {
	const systemSummary = buildSystemSummary(docModel);
	const ownerContext = buildOwnerContextBlock(docModel, audience);

	if (audience === 'user') {
		const deGuide =
			langCode === 'de' ? `${buildGermanNaturalLanguageBlock()}${buildGermanUserResidentBlock()}` : '';
		const roomGrounding = buildRoomCapabilityGrounding(docModel);
		return `You are a documentation assistant for a home automation system (ioBroker).
Write entirely in ${langName}.
${deGuide}
Audience: people who live here and use the smart home daily. Clear, practical everyday language. No adapter IDs, OIDs, or technical paths.

System data:
${systemSummary}${ownerContext}

${roomGrounding}

GROUNDING (mandatory): Base every concrete claim on "System data" and the room capability block above. Only name rooms that appear there. Only describe home behaviours (lighting, heating, blinds, sensors, etc.) that match the listed categories for those rooms. Do not invent: garage pressure, scanning "bags", kitchen table occupancy, nonsense compounds (Lichtzuschnitt, Backup-Adaptation), fantasy products, furniture shops, backpacks, display cases, made-up room names, or surreal automation. If the export is sparse, write a shorter, honest summary instead of filler. Do not quote internal host/container hex ids to end users — use "your ioBroker server" or the project name.
German spelling (mandatory): the product name is **ioBroker** (lowercase io, capital B) — never **iroBroker** or other typos. Use **Adapter** / **Adapter-Instanzen**, never mangled forms like **Adapatoren**. Do not invent device brands (e.g. **iRover**) or fictional staff (housekeepers, cleaners, "relaxation specialists").

Instructions:
1. NARRATIVE: 5–8 sentences. Concrete overview tied to the real rooms/categories above and maintenance hints. Not generic filler. Stay matter-of-fact when mentioning maintenance or disabled components — no dramatic or surreal wording. Mention ioBroker only as plain household software the family uses, not as an admin audit report. Do not wrap the whole narrative in markdown **. German: for shades use **Jalousien** / **Rollläden** — never **Blinde** (wrong meaning). Do **not** repeat the English labels **NARRATIVE** or **RECOMMENDATIONS** inside the paragraph text — those words are only for the output structure below. No invented appliances or absurd objects (smart bottles, nonsense compounds); stay within plausible household wording from the grounding data.
2. RECOMMENDATIONS: 5–8 bullet lines. Actionable habits tied to the data and issues above. If there are almost no issues, still give 3–4 positive, useful habits that fit the actual setup. Do **not** tell users to blindly enable every disabled adapter — some may be off on purpose; phrase as "check whether … is intentional". Only mention backup/messaging products if they appear in the system data; no invented "security audits". No lines that are only \`*\` or empty bullets; no closing pleasantries ("Ich hoffe …"). Never use a bullet to explain what ioBroker "is" (e.g. "lediglich ein Programm") — no filler definitions. German: address residents with **Sie** — use **Überprüfen Sie …**, never plural **Überprüft …** as if talking to one person.

Format your response exactly like this:
NARRATIVE:
<text>

RECOMMENDATIONS:
<text>`;
	}

	const guestFacts = buildOnboardingSystemSummary(docModel);
	const detail = buildOnboardingDetailBlock(docModel);
	const roomGrounding = buildRoomCapabilityGrounding(docModel);

	let langQuality = '';
	if (langCode === 'de') {
		langQuality = `${buildGermanNaturalLanguageBlock()}
German onboarding specifics:
- Narrative: concrete welcome (what guests might notice in named rooms), relaxed host tone — not a manual, not abstract philosophy of "smart living".
- Every bullet must address guests with "Sie" (or "Bitte … Sie …"). Never du-imperatives: no lines starting with "Lies ", "Überprüfe ", "Aktualisiere ", "Halte ", "Aktiviere ", "Sei ".
- Recommendations: hospitality only — e.g. room sections below, things may run by themselves, ask residents before changing anything, how to reach hosts. FORBIDDEN in recommendations: ioBroker or Broker, Adapter/Instanz, Skript, Manager, maintenance-score or "Score", BackItUp, Telegram-Adapter, Gerätesuche, Webinterface, software updates, checking scripts, Warteschlange/Warteschlusszeit as fake words, English "Schedule(s)".
- Stay on-topic: only this home, guests, residents, comfort, safety, house rules. No random tangents — never highway traffic, TV channels, broadcast/streaming/news, or other off-topic filler unless the facts explicitly mention them.
- No English inside German: never "our", "home page(s)", or mixed sentences — say "die Abschnitte auf dieser Seite", "die Räume weiter unten".
- Room names are neuter in German: **das** Arbeitszimmer, **das** Schlafzimmer (never "der Arbeitszimmer"). No broken invented words (e.g. "Schiebemögliche"); use normal words (Rollläden, Beschattung, Licht).
- Window blinds / shades: English "blinds" means **Jalousien**, **Rollläden**, or **Beschattung** — never **Blinde** or **Blinden** (that means blind people). No nonsense phrases like "Wetter einzuklagen".
- Do not wrap the entire NARRATIVE or entire RECOMMENDATIONS in markdown ** — plain sentences; no empty bullet lines.
- No assistant meta-closings: never end with "Ich hoffe, diese Vorschläge …", "Vielen Dank für Ihre Aufmerksamkeit", or similar.
- Tone: a friendly home host, not SaaS onboarding — avoid "Ich freue mich Sie kennenzulernen" / "komfortables Erlebnis". Prefer short warm welcomes ("Schön, dass Sie da sind").
- Do not tell guests rooms run on "Algorithmen" or "sensitive algorithms" — plain language only.
- Residents **offer** help / are available for questions — do not say residents "Hilfe anfragen" (that means they request help, wrong meaning).
- Do not tell guests to study a "Funktionenübersicht" for software; they only browse this page for comfort and safety.
- Never write a **system status report** for guests: no software version numbers, no host or container IDs, no counts of adapters/scripts/instances, no backup/Telegram product names, no "security audit" of the installation — that belongs in the resident profile only.
- This is a **private home**, not an office: never **Vorgesetzte**, **Ihre Vorgesetzten**, or **Chef** — people who change settings are the **Bewohner** / **die hier wohnen** / **Haushalt**, not "superiors".
- Avoid stiff or wrong calques: no "Natürlich möchten wir Sie auch wissen, dass …"; prefer direct, natural sentences. No marketing phrases like "erfülltes Wohnen". For navigation say "weiter unten auf dieser Seite" / "in den folgenden Kapiteln" — do not invent wrong UI labels like English **'Abschnitte'** in quotes unless that label truly appears in the page.
- **Realistic German (private home, not hotel / not poetry):** Rooms and walls do not "live" or "work" — say "this home has …" / "you will find …". **das WC** (never **der WC**). Questions: **wenn Sie noch Fragen haben**, never broken **wenn Sie sich noch Fragen macht**. Lighting/heating: **an Ihre Bedürfnisse angepasst** or **läuft oft automatisch mit** — never nonsense like **auf Ihrem Bedürfnis ausgehen**. Guests **use or enter a room** — never **im Raum verbrauchen**. **die Bewohner** and **ihre Grenzen** — fix wrong **seiner Grenzen** when residents are plural. Do not invent **signage / Beschilderung** in a normal flat unless clearly plausible. No absurd advice (**den ruhigen Ort stören wenn Sie müde sind**). Bullets: start with "- " only; no lines that are only "*" or "\\*"; no duplicated meta lines (**Dazu steht gerne Hilfe** tacked onto another tip).
`;
	} else if (langCode === 'fr') {
		langQuality = `
French: use consistent polite "vous"; grammatically correct sentences; no random English words in the middle.
`;
	}

	return `You write the "welcome" box for GUESTS and FIRST-TIME VISITORS of a smart home.
Write entirely in ${langName}. Tone: warm, calm, like a friendly host — not a technician and not marketing fluff.

Facts below are for reasoning only — paraphrase in simple daily language. Never copy technical nouns from lists into the guest text.

STRICTLY FORBIDDEN anywhere in the output (including substrings and any casing):
- The letters "io" immediately followed by "Broker" as one word; also the standalone substring "Broker" in a product sense. Say "this home", "the automation here", "how things are set up here" instead.
- Words: adapter, instance, driver, binding, OID, datapoint, Webinterface, Gerätesuche, Skript-Manager, maintenance-score, maintenance score, BackItUp, Repository
- Protocols / IT: MQTT, CoAP, REST, API, HTTP, HTTPS, JSON, WebSocket, IP
- Messaging apps or bots by product name (Telegram, WhatsApp, …) — you may say "ask the hosts" / "send a message to your hosts" without naming apps
- Programming: JavaScript, Blockly, Skript meaning code, Admin as a mode name
- English housekeeping words in German output: Schedule, Score, our, home page(s) (use German or rephrase)
- Invented passwords, codes, devices, or precise automation stories not supported by the facts (no AC warming food, no made-up sunrise scenes)
- Unrelated real-world topics: no highways, traffic, television, streaming, news media — guests are reading about this home only

ALLOWED: room names from the data; generic words (lighting, heating, shutters, motion, door/window); "the sections below in this page", "ask the people who live here"; sensible comfort and safety tips.

Guest-oriented facts (internal):
${guestFacts}${ownerContext}

${detail}

${roomGrounding}
${langQuality}

GROUNDING (mandatory for guests): Your text must reflect ONLY this home's named rooms, optional function themes, and the observed device categories in the grounding block. Welcome and tips may paraphrase in plain language — but do NOT invent objects, shopping, furniture, backpacks, refrigerators, overnight stays, mobile shops, fantasy room names, or domestic scenes that are not supported by those facts. If the home has few devices, write a SHORT calm welcome plus simple etiquette (ask hosts, sections below) instead of creative stories. In German, never cast the household as a workplace: no **Vorgesetzte** / **Vorgesetzten** for who adjusts automations — use **Bewohner** or **die hier wohnen**.

Instructions:
1. NARRATIVE: About 120–200 words max; shorter is fine if data is thin. Welcome them using only room names from the data. Mention capabilities only in broad household terms that match the categories (e.g. lighting, blinds, temperature) — never fake sensors or silly specifics. Do **not** summarize IT inventory (how many adapters, scripts, versions) — guests must not read an admin dashboard. Sound like a **real private household**, not a hotel manual: no personified rooms, no forced "house rules" that sound translated or absurd.
2. RECOMMENDATIONS: 5–8 bullet lines — guest etiquette and orientation only (browse sections below, respect residents' settings, things may change automatically, whom to ask). Never administrator or installer tasks: no adapters, scripts, backups, updates, scores, or product names. Never tell guests to "switch on all adapters" or fix scripts. Each bullet one clear sentence; use "- " at the start of each line; no stray "*"-only lines.

Before you finish, re-read both sections: if any forbidden substring appears, rewrite. If the output mixes informal "du" with "Sie" in German, rewrite to consistent "Sie" only.

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
	 * @param {string} val Progress (e.g. "3/12") or "—" when idle
	 * @returns {Promise<void>}
	 */
	async setScriptSourceProgress(val) {
		try {
			await this.adapter.setStateAsync('info.aiScriptSourceProgress', { val, ack: true });
		} catch {
			// ignore if state is missing
		}
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
	 * @param {number} [temperature] Optional sampling temperature (Anthropic clamped to 0–1)
	 * @returns {Promise<string>} Raw model text, or empty string if misconfigured
	 */
	async invokeProvider(config, provider, model, prompt, maxTokens, systemPrompt, temperature) {
		const timeoutMs = parseRequestTimeoutMs(config);
		if (provider === 'anthropic') {
			const apiKey = (config.aiApiKey || '').trim();
			if (!apiKey) {
				this.adapter.log.warn('AI provider "anthropic" selected but no API key configured');
				return '';
			}
			return callAnthropic(apiKey, model, prompt, maxTokens, systemPrompt, temperature, timeoutMs);
		}
		if (provider === 'groq') {
			const apiKey = (config.aiApiKey || '').trim();
			if (!apiKey) {
				this.adapter.log.warn('AI provider "groq" selected but no API key configured');
				return '';
			}
			return callOpenAiCompatible(
				'https://api.groq.com',
				apiKey,
				model,
				prompt,
				maxTokens,
				systemPrompt,
				temperature,
				timeoutMs,
				this.adapter.log,
			);
		}
		if (provider === 'ollama') {
			const baseUrl = (config.aiBaseUrl || 'http://localhost:11434').trim();
			return callOpenAiCompatible(
				baseUrl,
				'',
				model,
				prompt,
				maxTokens,
				systemPrompt,
				temperature,
				timeoutMs,
				this.adapter.log,
			);
		}
		if (provider === 'mistral') {
			const apiKey = (config.aiApiKey || '').trim();
			if (!apiKey) {
				this.adapter.log.warn('AI provider "mistral" selected but no API key configured');
				return '';
			}
			return callOpenAiCompatible(
				'https://api.mistral.ai',
				apiKey,
				model,
				prompt,
				maxTokens,
				systemPrompt,
				temperature,
				timeoutMs,
				this.adapter.log,
			);
		}
		this.adapter.log.warn(`Unknown AI provider: ${provider}`);
		return '';
	}

	/**
	 * Second LLM call: fix du/Sie mix and obvious German issues in onboarding text.
	 *
	 * @param {{ narrative: string, recommendations: string }} block
	 * @param {string} provider
	 * @param {string} model
	 * @returns {Promise<{ narrative: string, recommendations: string } | null>}
	 */
	async polishGermanOnboardingSie(block, provider, model) {
		const prompt = buildGermanOnboardingPolishUserPrompt(block);
		try {
			const text = await this.invokeProvider(
				this.adapter.config,
				provider,
				model,
				prompt,
				MAX_TOKENS_ONBOARDING_POLISH,
				GERMAN_ONBOARDING_POLISH_SYSTEM,
				TEMPERATURE_ONBOARDING_POLISH,
			);
			if (!text) {
				return null;
			}
			const parsed = this.parseResponse(text, 'de');
			if (isAiBlockEmpty(parsed)) {
				return null;
			}
			return parsed;
		} catch (err) {
			this.adapter.log.warn(`AI German onboarding polish pass failed: ${err.message}`);
			return null;
		}
	}

	/**
	 * Second LLM call: fix Sie/du mix, plural imperatives, and obvious German issues in **user** (resident) text.
	 *
	 * @param {{ narrative: string, recommendations: string }} block
	 * @param {string} provider
	 * @param {string} model
	 * @returns {Promise<{ narrative: string, recommendations: string } | null>}
	 */
	async polishGermanUserDe(block, provider, model) {
		const prompt = buildGermanUserPolishUserPrompt(block);
		try {
			const text = await this.invokeProvider(
				this.adapter.config,
				provider,
				model,
				prompt,
				MAX_TOKENS_ONBOARDING_POLISH,
				GERMAN_USER_POLISH_SYSTEM,
				TEMPERATURE_ONBOARDING_POLISH,
			);
			if (!text) {
				return null;
			}
			const parsed = this.parseResponse(text, 'de');
			if (isAiBlockEmpty(parsed)) {
				return null;
			}
			return parsed;
		} catch (err) {
			this.adapter.log.warn(`AI German user-profile polish pass failed: ${err.message}`);
			return null;
		}
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
		const cfg = this.adapter.config;
		let temperature = parseOptionalTemperature(
			audience === 'onboarding' ? cfg.aiTemperatureOnboarding : cfg.aiTemperatureUser,
		);
		if (temperature === undefined && provider === 'ollama') {
			temperature =
				audience === 'onboarding' ? OLLAMA_DEFAULT_TEMPERATURE_ONBOARDING : OLLAMA_DEFAULT_TEMPERATURE_USER;
		}
		try {
			this.adapter.log.info(
				`AI: requesting "${audience}" profile (max_tokens≈${maxTokens}${temperature !== undefined ? `, temp=${temperature}` : ''}) — waiting for ${provider}…`,
			);
			this.adapter.log.debug(
				`AI enhancement: provider=${provider}, model=${model}, audience=${audience}, max_tokens=${maxTokens}${
					temperature !== undefined ? `, temperature=${temperature}` : ''
				}`,
			);
			const text = await this.invokeProvider(cfg, provider, model, prompt, maxTokens, systemPrompt, temperature);
			this.adapter.log.info(`AI: "${audience}" profile — model response received, parsing…`);
			if (!text) {
				if (provider === 'ollama') {
					const showModel = model || DEFAULT_MODELS.ollama;
					this.adapter.log.warn(
						`AI: empty response from Ollama (${audience}) — is model "${showModel}" installed (\`ollama list\`), is the container up, and is the Ollama base URL reachable from the ioBroker host?`,
					);
				} else {
					this.adapter.log.warn(`AI: empty API response (${provider}, ${audience}).`);
				}
				return null;
			}
			let parsed = this.parseResponse(text, langCode || 'en');
			if (isAiBlockEmpty(parsed)) {
				const excerpt = text.length > 400 ? `${text.slice(0, 400)}…` : text;
				this.adapter.log.warn(
					`AI enhancement returned no usable text (${provider}, ${audience}) — could not parse narrative + recommendations. Raw excerpt: ${excerpt.replace(/\s+/g, ' ').trim()}`,
				);
				return null;
			}
			if (
				audience === 'user' &&
				lc === 'de' &&
				germanUserProfileNeedsPolish(parsed.narrative, parsed.recommendations)
			) {
				const polishedUser = await this.polishGermanUserDe(parsed, provider, model);
				if (polishedUser) {
					this.adapter.log.info('AI: German user profile — applied second pass (Sie / grammar / noise)');
					parsed = polishedUser;
				}
			}
			if (
				audience === 'onboarding' &&
				lc === 'de' &&
				germanOnboardingNeedsSiePolish(parsed.narrative, parsed.recommendations)
			) {
				const polished = await this.polishGermanOnboardingSie(parsed, provider, model);
				if (polished) {
					this.adapter.log.info('AI: German onboarding — applied second pass (Sie consistency / grammar)');
					parsed = polished;
				}
			}
			if (
				audience === 'onboarding' &&
				onboardingTextLooksLikeTechnicalDump(parsed.narrative, parsed.recommendations)
			) {
				this.adapter.log.warn(
					'AI: onboarding text looked like admin/resident technical summary — replaced with neutral guest wording for autodoc-onboarding.html. If you use "KI-Kontexthinweise", avoid words like Adapter/Repo/ioBroker there or the model may quote them and trigger this safety replace.',
				);
				parsed = getNeutralOnboardingGuestBlock(langCode || 'en');
			}
			if (
				audience === 'onboarding' &&
				lc === 'de' &&
				germanOnboardingGuestStillUnacceptable(parsed.narrative, parsed.recommendations)
			) {
				this.adapter.log.warn(
					'AI: German onboarding failed guest quality gate — replaced with neutral guest wording for autodoc-onboarding.html.',
				);
				parsed = getNeutralOnboardingGuestBlock(langCode || 'en');
			}
			if (
				audience === 'user' &&
				lc === 'de' &&
				germanUserAiStillUnacceptable(parsed.narrative, parsed.recommendations)
			) {
				this.adapter.log.warn(
					'AI: German user text failed quality gate — using short factual summary for autodoc-user.html.',
				);
				parsed = buildGermanUserFallbackBlock(docModel);
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
	 * @param {object} [rawData] Optional raw discovery data (for script source analysis)
	 * @returns {Promise<{user: object|null, onboarding: object|null, meta?: object}|null>} Per-profile AI blocks + optional meta
	 */
	async enhance(docModel, rawData) {
		const config = this.adapter.config;
		const provider = (config.aiProvider || 'none').trim();

		if (!config.aiAnalyzeScriptSources) {
			await this.setScriptSourceProgress('—');
		}

		if (provider === 'none') {
			this.adapter.log.debug('AI enhancement skipped (provider is Disabled).');
			await this.setScriptSourceProgress('—');
			return null;
		}

		const model = (config.aiModel || DEFAULT_MODELS[provider] || '').trim();
		const lang = config.language || 'en';
		const langName = LANG_NAMES[lang] || 'English';

		this.adapter.log.info(`AI enhancement starting: provider=${provider}, model=${model || '(default)'}`);

		// Sequential calls: parallel requests often overload local Ollama (second call fails or times out).
		const userAi = await this.enhanceOneAudience(docModel, 'user', provider, model, langName, lang);
		this.adapter.log.info(
			'AI: user/family (resident) profile finished — starting guest/onboarding profile (second LLM call; local models may need many minutes each).',
		);
		const onboardingAi = await this.enhanceOneAudience(docModel, 'onboarding', provider, model, langName, lang);

		let u = userAi;
		let o = onboardingAi;

		if (!o && u) {
			this.adapter.log.info(
				'AI: onboarding block missing — using neutral guest placeholder for autodoc-onboarding.html (user-profile KI text is not copied to guests). Comment: <!-- autodoc-ai:onboarding source=fallback-neutral -->.',
			);
			o = getNeutralOnboardingGuestBlock(lang);
		}
		if (!u && o) {
			this.adapter.log.info('AI: user block missing — reusing onboarding KI text for autodoc-user.html');
			u = { narrative: o.narrative, recommendations: o.recommendations };
		}

		if (!u && !o) {
			this.adapter.log.warn(
				'AI enhancement finished with no usable user or onboarding text — check warnings above (empty Ollama response, timeout, wrong model id, or unreachable base URL). Documentation HTML is still generated without the AI box.',
			);
			await this.setScriptSourceProgress('—');
			return null;
		}

		this.adapter.log.info('AI enhancement finished successfully (user and/or onboarding block present).');

		const onboardingFromUserFallback = !onboardingAi && !!u;
		const userFromOnboardingFallback = !userAi && !!o;

		if (config.aiAnalyzeScriptSources && rawData && rawData.scripts) {
			await this.enhanceScriptSources(docModel, rawData, provider, model, langName, lang);
		} else if (config.aiAnalyzeScriptSources) {
			await this.setScriptSourceProgress('—');
		}

		return {
			user: u,
			onboarding: o,
			meta: {
				onboardingFromUserFallback,
				userFromOnboardingFallback,
			},
		};
	}

	/**
	 * Optional: short AI explanation per enabled script (User/Onboarding HTML + Markdown).
	 * Mutates docModel.scripts.scripts[].aiSummary; may set docModel.scripts.aiAutomationOverview.
	 *
	 * @param {object} docModel
	 * @param {object} rawData
	 * @param {string} provider
	 * @param {string} model
	 * @param {string} langName
	 * @param {string} _lang Adapter language code (reserved)
	 * @returns {Promise<void>}
	 */
	async enhanceScriptSources(docModel, rawData, provider, model, langName, _lang) {
		if (this.adapter.isScriptSourceAiCancelRequested()) {
			this.adapter.log.info(
				'AI script source phase: cancel was already requested — skipping all script requests.',
			);
			await this.setScriptSourceProgress('cancelled');
			this.adapter.clearScriptSourceAiCancelRequest();
			return;
		}

		const scripts = rawData.scripts || [];
		const byId = new Map(scripts.map(s => [s.id, s]));
		const rows = (docModel.scripts && docModel.scripts.scripts) || [];
		let successCount = 0;
		const summariesForOverview = [];
		const maxScriptChars = parseMaxScriptCharsForAi(this.adapter.config);

		let totalEligible = 0;
		for (const row of rows) {
			if (!row.enabled) {
				continue;
			}
			const r = byId.get(row.id);
			if (!r || !String(r.source || '').trim()) {
				continue;
			}
			totalEligible++;
		}
		if (totalEligible === 0) {
			await this.setScriptSourceProgress('—');
			this.adapter.clearScriptSourceAiCancelRequest();
			return;
		}
		let invokeDone = 0;
		let userCancelled = false;
		await this.setScriptSourceProgress(`0/${totalEligible}`);

		try {
			for (const row of rows) {
				if (this.adapter.isScriptSourceAiCancelRequested()) {
					this.adapter.log.info(
						'AI script source phase: cancel requested — stopping; optional overview is skipped. Ongoing KI call may still finish; the next script will not start.',
					);
					userCancelled = true;
					break;
				}
				if (!row.enabled || successCount >= MAX_SCRIPT_SOURCE_AI) {
					continue;
				}
				const raw = byId.get(row.id);
				if (!raw || !String(raw.source || '').trim()) {
					continue;
				}
				const body = truncateScriptSource(redactScriptSourceForAi(raw.source), maxScriptChars);
				const prompt = `Script name: ${row.name}
Folder: ${row.folder || '(root)'}
Trigger type: ${row.triggerType || 'unknown'}
Schedule: ${row.schedule || 'none'}

JavaScript (sanitized, may be truncated):
${body}

Task: In 2–4 short sentences, explain what this home automation script does for residents, in ${langName}. Use everyday language — no programming jargon, no brand names unless they appear in the code. Plain text only (no markdown headings).`;
				const sys = `You help document smart-home automations for non-technical readers. Be factual; if unclear, say what is uncertain. Language: ${langName}.`;
				try {
					const text = await this.invokeProvider(
						this.adapter.config,
						provider,
						model,
						prompt,
						MAX_TOKENS_SCRIPT_SUMMARY,
						sys,
						0.25,
					);
					const cleaned = stripMarkdownFences(String(text || '').trim())
						.replace(/\s+/g, ' ')
						.trim();
					if (cleaned) {
						row.aiSummary = cleaned;
						summariesForOverview.push({ name: row.name, summary: cleaned });
						successCount++;
					}
				} catch (err) {
					this.adapter.log.debug(`AI script summary skipped for ${row.id}: ${err.message}`);
				} finally {
					invokeDone += 1;
					await this.setScriptSourceProgress(`${invokeDone}/${totalEligible}`);
				}
			}

			if (!userCancelled && summariesForOverview.length >= 2) {
				const bullet = summariesForOverview
					.slice(0, 24)
					.map(s => `- ${s.name}: ${s.summary}`)
					.join('\n');
				const overviewPrompt = `Below are short summaries of JavaScript automations in one smart home (language ${langName}). Write ONE short paragraph (4–6 sentences) for residents describing what kinds of automation run in this home overall — themes only, no technical detail, no bullet list in the output.

${bullet}`;
				try {
					const ov = await this.invokeProvider(
						this.adapter.config,
						provider,
						model,
						overviewPrompt,
						500,
						`Write in ${langName} for household residents.`,
						0.3,
					);
					const ovc = stripMarkdownFences(String(ov || '').trim());
					if (ovc) {
						docModel.scripts.aiAutomationOverview = ovc;
					}
				} catch (err) {
					this.adapter.log.debug(`AI automation overview skipped: ${err.message}`);
				}
			}
		} finally {
			this.adapter.clearScriptSourceAiCancelRequest();
		}

		if (userCancelled) {
			await this.setScriptSourceProgress('cancelled');
			this.adapter.log.info(
				`AI script-source phase ended after cancel — ${successCount} script(s) with summaries; optional automation overview not run.`,
			);
		} else if (successCount > 0) {
			this.adapter.log.info(`AI script-source summaries: ${successCount} script(s).`);
		}
	}

	/**
	 * Parse the structured API response into narrative and recommendations.
	 * Accepts several model styles: plain NARRATIVE:/RECOMMENDATIONS:, Markdown headers, German labels, bullet-only tails.
	 *
	 * @param {string} text Raw API response text
	 * @param {string} [langCode] Adapter language for fallback line (de | en | fr)
	 * @returns {{narrative: string, recommendations: string}} Extracted sections (may be empty strings)
	 */
	parseResponse(text, langCode = 'en') {
		return parseAiSections(text, langCode);
	}
}

/**
 * Strip optional markdown code fences from model output.
 *
 * @param {string} s
 * @returns {string}
 */
function stripMarkdownFences(s) {
	let t = (s || '').trim();
	if (!t) {
		return '';
	}
	t = t.replace(/^```(?:[a-z]+)?\s*\r?\n/i, '');
	t = t.replace(/\r?\n```\s*$/i, '');
	return t.trim();
}

/**
 * Models often put **Empfehlungen:** mid-paragraph without a newline — split-friendly marker.
 *
 * @param {string} t
 * @returns {string}
 */
function normalizeInlineRecommendationHeaders(t) {
	let s = t;
	s = s.replace(
		/([.!?…])\s*\*{0,2}\s*(?:Empfehlungen|Recommendations)\s*:\s*\*{0,2}\s*/gi,
		'$1\n\nRECOMMENDATIONS:\n',
	);
	s = s.replace(/\s*\*{0,2}\s*(?:Empfehlungen|Recommendations)\s*:\s*\*{0,2}\s*/gi, '\n\nRECOMMENDATIONS:\n');
	return s;
}

/**
 * Remove empty / marker-only bullet lines from a recommendations block.
 *
 * @param {string} rec
 * @returns {string}
 */
function stripEmptyRecommendationLines(rec) {
	const lines = (rec || '').split(/\r?\n/);
	const out = [];
	for (const line of lines) {
		let normalized = line.replace(/^(\s*[-*•]\s*)\\+\*/, '$1');
		const x = normalized.trim();
		if (!x) {
			continue;
		}
		if (/^[-*•]\s*$/.test(x)) {
			continue;
		}
		if (/^[-*•]\s*[*•]+\s*$/.test(x)) {
			continue;
		}
		if (/^[-*•]\s*\\\*\s*$/.test(x)) {
			continue;
		}
		if (/^\*\s*$/.test(x) || /^\\\*\s*$/.test(x)) {
			continue;
		}
		out.push(normalized);
	}
	return out.join('\n').trim();
}

/**
 * Drop resident-profile filler bullets the model often appends (defines ioBroker as "just a program").
 *
 * @param {string} rec
 * @returns {string}
 */
function stripNoiseRecommendationLines(rec) {
	const lines = (rec || '').split(/\r?\n/);
	const out = [];
	for (const line of lines) {
		const body = line.replace(/^[-*•]\s*/, '').trim();
		if (
			/ioBroker.*\b(lediglich|nur)\s+ei(n|ne)\s+Programm\b/i.test(body) ||
			/\b(lediglich|nur)\s+ei(n|ne)\s+Programm\b.*ioBroker/i.test(body)
		) {
			continue;
		}
		if (/iRover|\bIr[oó]ver\b|Entspannung.*Spezialist|Haushälter|Haushalter\b/i.test(body)) {
			continue;
		}
		out.push(line);
	}
	return out.join('\n').trim();
}

/**
 * Strip model meta / echoed format labels so the HTML box does not show "Hier ist der Text: NARRATIVE:".
 *
 * @param {string} narrative Parsed narrative body (may contain echoed headers).
 * @param {string} recommendations Parsed recommendations body.
 * @returns {{ narrative: string, recommendations: string }} Sanitized parts for rendering.
 */
function cleanParsedAiParts(narrative, recommendations) {
	let n = (narrative || '').trim();
	let r = (recommendations || '').trim();
	n = n.replace(/^\s*Hier ist (?:der|die|das)\s+[^:]+:\s*/i, '');
	n = n.replace(/^\s*Here is (?:the|your) (?:text|response|output):\s*/i, '');
	let prev;
	do {
		prev = n;
		n = n.replace(/^\s*NARRATIVE\s*:\s*/i, '').trim();
	} while (n !== prev);
	// Models sometimes echo "NARRATIVE:" again mid-paragraph — strip those markers from the body
	do {
		prev = n;
		n = n.replace(/\n+\s*NARRATIVE\s*:\s*/gi, '\n\n').trim();
	} while (n !== prev);
	n = n.replace(/^\s*NARRATIVE\s*:\s*/gim, '').trim();
	r = r.replace(/^\s*RECOMMENDATIONS\s*:\s*/i, '').trim();
	do {
		prev = r;
		r = r.replace(/\n+\s*RECOMMENDATIONS\s*:\s*/gi, '\n\n').trim();
	} while (r !== prev);
	// Orphan / outer markdown bold from small models (whole paragraph wrapped in **)
	for (let i = 0; i < 4; i++) {
		const n2 = n
			.replace(/^\*\*\s*/, '')
			.replace(/\s*\*\*\s*$/, '')
			.trim();
		const r2 = r
			.replace(/^\*\*\s*/, '')
			.replace(/\s*\*\*\s*$/, '')
			.trim();
		if (n2 === n && r2 === r) {
			break;
		}
		n = n2;
		r = r2;
	}
	// Assistant "sign-off" tails (often appended after the last bullet on one line)
	const stripOutro = s => {
		let x = s.trim();
		x = x.replace(/\s*Ich hoffe,?\s+diese\s+Vorschläge\s+entsprechen\s+Ihren\s+Erwartungen!?\s*$/i, '');
		x = x.replace(/\s*Vielen\s+Dank\s+für\s+Ihre\s+Aufmerksamkeit!?\s*$/i, '');
		x = x.replace(/\s*I\s+hope\s+this\s+(?:helps|meets\s+your\s+expectations)[^.!?]*[.!?]?\s*$/i, '');
		return x.trim();
	};
	r = stripOutro(r);
	n = stripOutro(n);
	r = stripNoiseRecommendationLines(stripEmptyRecommendationLines(r));
	return { narrative: n, recommendations: r };
}

/**
 * @param {string} text
 * @param {string} langCode
 * @returns {{ narrative: string, recommendations: string }}
 */
function parseAiSections(text, langCode = 'en') {
	let t = stripMarkdownFences(text);
	if (!t) {
		return { narrative: '', recommendations: '' };
	}
	t = normalizeInlineRecommendationHeaders(t);

	const fallbackRec =
		langCode === 'de'
			? '- Einzelheiten und Listen finden Sie in den folgenden Kapiteln dieser Seite.'
			: langCode === 'fr'
				? '- Voir les sections ci-dessous pour le détail.'
				: '- See the documentation sections below for details.';

	const splitPatterns = [
		{ rec: /\n\s*RECOMMENDATIONS\s*:\s*/i, stripHead: /^\s*NARRATIVE\s*:\s*/i },
		{ rec: /\n\s*Recommendations\s*:\s*/i, stripHead: /^\s*Narrative\s*:\s*/i },
		{
			rec: /\n\s*(?:#{1,4}\s*|\*\*)RECOMMENDATIONS(?:\*\*)?\s*:?\s*\n/i,
			stripHead: /^\s*(?:#{1,4}\s*|\*\*)NARRATIVE(?:\*\*)?\s*:?\s*\n/i,
		},
		{ rec: /\n\s*Empfehlungen\s*:\s*/i, stripHead: /^\s*(?:NARRATIVE|Zusammenfassung|Überblick)\s*:\s*/i },
		{
			rec: /\n\s*(?:#{1,4}\s*|\*\*)?(?:Empfehlungen|Tipps\s+für\s+Sie)\s*(?:\([^)]*\))?\s*:?\s*\n/i,
			stripHead:
				/^\s*(?:#{1,4}\s*|\*\*)?(?:NARRATIVE|Zusammenfassung|Überblick|KI-Zusammenfassung)(?:\*\*)?\s*:?\s*\n/i,
		},
	];

	for (const { rec, stripHead } of splitPatterns) {
		const parts = t.split(rec);
		if (parts.length >= 2) {
			const narrative = parts[0].replace(stripHead, '').trim();
			const recommendations = parts
				.slice(1)
				.join('\n\n')
				.replace(/^\s*(?:RECOMMENDATIONS|Empfehlungen)\s*:\s*/i, '')
				.trim();
			if (narrative || recommendations) {
				return cleanParsedAiParts(narrative, recommendations);
			}
		}
	}

	const recParts = t.split(/\n\s*RECOMMENDATIONS\s*:\s*/i);
	if (recParts.length >= 2) {
		const narrative = recParts[0].replace(/^\s*NARRATIVE\s*:\s*/i, '').trim();
		const recommendations = recParts.slice(1).join('\n\n').trim();
		if (narrative || recommendations) {
			return cleanParsedAiParts(narrative, recommendations);
		}
	}

	const narrativeMatch = t.match(/NARRATIVE:\s*([\s\S]*?)(?=RECOMMENDATIONS:|$)/i);
	const recommendationsMatch = t.match(/RECOMMENDATIONS:\s*([\s\S]*?)$/i);
	let narrative = (narrativeMatch?.[1] || '').trim();
	let recommendations = (recommendationsMatch?.[1] || '').trim();
	if (narrative || recommendations) {
		return cleanParsedAiParts(narrative, recommendations);
	}

	// Bullet list at end = recommendations, body = narrative
	const lines = t.split(/\r?\n/);
	let firstBullet = -1;
	for (let i = 0; i < lines.length; i++) {
		if (/^\s*(?:[-*•]|\d+[.)])\s+\S/.test(lines[i])) {
			firstBullet = i;
			break;
		}
	}
	if (firstBullet > 0) {
		narrative = lines.slice(0, firstBullet).join('\n').trim();
		recommendations = lines.slice(firstBullet).join('\n').trim();
		if (narrative && recommendations) {
			return cleanParsedAiParts(narrative, recommendations);
		}
	}

	// Explicit **Tipps** / **Empfehlungen** section (markdown, no NARRATIVE: headers)
	const tipSection = /\n\*\*(?:Tipps?|Empfehlungen|Hinweise|Bitte beachten Sie)\*\*\s*:?\s*\n/i;
	const tipIdx = t.search(tipSection);
	if (tipIdx > 10) {
		narrative = t.slice(0, tipIdx).trim();
		recommendations = t.slice(tipIdx).replace(tipSection, '').trim();
		if (narrative && recommendations) {
			return cleanParsedAiParts(narrative, recommendations);
		}
	}

	// Guest-style prose with **Zwischenüberschriften** only (common Ollama output)
	if (/\*\*[^*\n]{2,80}\*\*/.test(t)) {
		let body = t.replace(/^\s*Hier ist (?:der|die)\s+[^.\n]*[.:]\s*/i, '').trim();
		if (body.length < 20) {
			body = t.trim();
		}
		if (body.length > 25) {
			return cleanParsedAiParts(body, fallbackRec);
		}
	}

	// Single block: use as narrative so export is not empty
	if (t.length > 25) {
		return cleanParsedAiParts(t.trim(), fallbackRec);
	}

	return { narrative: '', recommendations: '' };
}

module.exports = AiEnhancer;
