/**
 * Remove trailing GitHub URL blocks from admin i18n keys/values (plain-text URLs
 * are not clickable in jsonConfig field help). Docs use staticLink instead.
 */
const fs = require('fs');
const path = require('path');

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
		'Docs link README documentation overview': 'DE user guide — Documentation language & overview (GitHub)',
		'Docs link README public base URL': 'DE user guide — Public base URL / QR (GitHub)',
		'Docs link wiki German config': 'German wiki — Instance configuration (GitHub)',
		'Docs link README Mermaid cookbook': 'DE user guide — Mermaid (My documentation tab) (GitHub)',
		'Docs link README JSON cookbook': 'DE user guide — JSON chapter order & snippets (GitHub)',
		'Docs link README PDF export': 'DE user guide — Optional PDF export / Puppeteer (GitHub)',
		'Docs link README HTML CSS': 'DE user guide — HTML font & custom CSS (GitHub)',
	},
	de: {
		'Docs link README documentation overview': 'Wiki DE — Dokumentationssprache & Überblick (GitHub)',
		'Docs link README public base URL': 'Wiki DE — Basis-URL / QR (GitHub)',
		'Docs link wiki German config': 'Wiki — Instanz-Konfiguration DE (GitHub)',
		'Docs link README Mermaid cookbook': 'Wiki DE — Mermaid (Tab „Meine Dokumentation“, GitHub)',
		'Docs link README JSON cookbook': 'Wiki DE — JSON (Reihenfolge & Kochbuch, GitHub)',
		'Docs link README PDF export': 'Wiki DE — PDF-Export / Puppeteer (GitHub)',
		'Docs link README HTML CSS': 'Wiki DE — Schrift & zusätzliches CSS (GitHub)',
	},
	fr: {
		'Docs link README documentation overview': 'Wiki DE — Langue & aperçu (GitHub)',
		'Docs link README public base URL': 'Wiki DE — URL publique / QR (GitHub)',
		'Docs link wiki German config': 'Wiki allemand — Configuration (GitHub)',
		'Docs link README Mermaid cookbook': 'Wiki DE — Mermaid (guide utilisateur, GitHub)',
		'Docs link README JSON cookbook': 'Wiki DE — JSON (ordre & exemples, GitHub)',
		'Docs link README PDF export': 'Wiki DE — Export PDF / Puppeteer (GitHub)',
		'Docs link README HTML CSS': 'Wiki DE — Police & CSS personnalisés (GitHub)',
	},
};

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
