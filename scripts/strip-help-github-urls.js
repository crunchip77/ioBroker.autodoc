/**
 * Remove trailing GitHub URL blocks from admin i18n keys/values (plain-text URLs
 * are not clickable in jsonConfig field help). Docs use staticLink instead.
 */
const fs = require('node:fs');
const path = require('node:path');

const stripTrailingGithubBlocks = s => {
	if (typeof s !== 'string') {
		return s;
	}
	let t = s;
	const block = /\n\n[^\n]{1,240}:\nhttps:\/\/github\.com\/crunchip77\/ioBroker\.autodoc[^\n]*/g;
	for (;;) {
		const u = t.replace(block, '');
		if (u === t) {
			break;
		}
		t = u;
	}
	return t;
};

const docsLinkLabels = {
	en: {
		'Docs link README documentation overview basic':
			'DE user guide — Project & documentation language (Basics tab) (GitHub)',
		'Docs link README documentation overview advanced':
			'DE user guide — Language effects & change deltas (Advanced tab) (GitHub)',
		'Docs link README public base URL': 'DE user guide — Public base URL / QR (GitHub)',
		'Docs link wiki German config': 'German wiki — Tabs overview (DE) (GitHub)',
		'Docs link wiki German custom sections': 'German wiki — Custom Markdown chapters (JSON) (GitHub)',
		'Docs link README Mermaid cookbook': 'README — Mermaid cookbook examples (GitHub)',
		'Docs link README JSON cookbook': 'README — JSON cookbook snippets (GitHub)',
		'Docs link README PDF export': 'DE user guide — Optional PDF export / Puppeteer (GitHub)',
		'Docs link README HTML CSS': 'README — HTML custom CSS examples (GitHub)',
	},
	de: {
		'Docs link README documentation overview basic':
			'Wiki DE — Projekt & Dokumentationssprache (Tab Grundeinstellungen, GitHub)',
		'Docs link README documentation overview advanced':
			'Wiki DE — Sprache, Deltas & erweiterte Hinweise (Tab Erweitert, GitHub)',
		'Docs link README public base URL': 'README — Basis-URL / QR (GitHub)',
		'Docs link wiki German config': 'Wiki — Instanz-Konfiguration DE (GitHub)',
		'Docs link wiki German custom sections': 'Wiki DE — Zusätzliche Markdown-Kapitel (JSON, GitHub)',
		'Docs link README Mermaid cookbook': 'README — Mermaid-Kochbuch (GitHub)',
		'Docs link README JSON cookbook': 'README — JSON-Kochbuch (GitHub)',
		'Docs link README PDF export': 'README — PDF-Export / Puppeteer (GitHub)',
		'Docs link README HTML CSS': 'README — HTML & CSS-Beispiele (GitHub)',
	},
	fr: {
		'Docs link README documentation overview basic': 'Wiki DE — Langue & projet (onglet Réglages de base, GitHub)',
		'Docs link README documentation overview advanced':
			'Wiki DE — Effets de langue & deltas (onglet Avancé, GitHub)',
		'Docs link README public base URL': 'Wiki DE — URL publique / QR (GitHub)',
		'Docs link wiki German config': 'Wiki DE — Aperçu des onglets (GitHub)',
		'Docs link wiki German custom sections': 'Wiki DE — Chapitres Markdown (JSON, GitHub)',
		'Docs link README Mermaid cookbook': 'README — Exemples Mermaid (GitHub)',
		'Docs link README JSON cookbook': 'README — Snippets JSON (GitHub)',
		'Docs link README PDF export': 'Wiki DE — Export PDF / Puppeteer (GitHub)',
		'Docs link README HTML CSS': 'README — CSS HTML (GitHub)',
	},
};

/** Replaced by split basic/advanced keys; remove stale entries from locale files. */
const deprecatedDocsLinkKeys = ['Docs link README documentation overview'];

function processLocale(code, filePath, labelSet) {
	const raw = fs.readFileSync(filePath, 'utf8');
	const obj = JSON.parse(raw);
	const out = {};
	for (const [k, v] of Object.entries(obj)) {
		const nk = stripTrailingGithubBlocks(k);
		const nv = typeof v === 'string' ? stripTrailingGithubBlocks(v) : v;
		out[nk] = nv;
	}
	for (const [k, v] of Object.entries(labelSet)) {
		out[k] = v;
	}
	for (const dk of deprecatedDocsLinkKeys) {
		delete out[dk];
	}
	fs.writeFileSync(filePath, `${JSON.stringify(out, null, '\t')}\n`, 'utf8');
	console.log('updated', path.relative(process.cwd(), filePath));
}

const i18nDir = path.join(__dirname, '..', 'admin', 'i18n');

processLocale('en', path.join(i18nDir, 'en.json'), docsLinkLabels.en);
processLocale('de', path.join(i18nDir, 'de.json'), docsLinkLabels.de);
processLocale('fr', path.join(i18nDir, 'fr.json'), docsLinkLabels.fr);

for (const code of ['es', 'it', 'nl', 'pl', 'pt', 'ru', 'uk', 'zh-cn']) {
	processLocale(code, path.join(i18nDir, `${code}.json`), docsLinkLabels.en);
}
