/**
 * Remove trailing GitHub URL blocks from admin i18n keys/values (plain-text URLs
 * are not clickable in jsonConfig field help). Docs use staticLink instead.
 */
const fs = require("fs");
const path = require("path");

const stripTrailingGithubBlocks = (s) => {
	if (typeof s !== "string") {
		return s;
	}
	let t = s;
	const block =
		/\n\n[^\n]{1,240}:\nhttps:\/\/github\.com\/crunchip77\/ioBroker\.autodoc[^\n]*/g;
	for (;;) {
		const u = t.replace(block, "");
		if (u === t) {
			break;
		}
		t = u;
	}
	return t;
};

const docsLinkLabels = {
	en: {
		"Docs link README documentation overview": "README — Documentation language & deltas (GitHub)",
		"Docs link README public base URL": "README — Public base URL / QR (GitHub)",
		"Docs link wiki German config": "German wiki — Instance configuration (GitHub)",
		"Docs link README Mermaid cookbook": "README — Mermaid cookbook examples (GitHub)",
		"Docs link README JSON cookbook": "README — JSON cookbook snippets (GitHub)",
		"Docs link README PDF export": "README — Optional PDF export / Puppeteer (GitHub)",
		"Docs link README HTML CSS": "README — HTML custom CSS examples (GitHub)",
	},
	de: {
		"Docs link README documentation overview": "README — Dokumentationssprache & Deltas (GitHub)",
		"Docs link README public base URL": "README — Basis-URL / QR (GitHub)",
		"Docs link wiki German config": "Wiki — Instanz-Konfiguration DE (GitHub)",
		"Docs link README Mermaid cookbook": "README — Mermaid-Kochbuch (GitHub)",
		"Docs link README JSON cookbook": "README — JSON-Kochbuch (GitHub)",
		"Docs link README PDF export": "README — PDF-Export / Puppeteer (GitHub)",
		"Docs link README HTML CSS": "README — HTML & CSS-Beispiele (GitHub)",
	},
	fr: {
		"Docs link README documentation overview": "README — Langue & deltas (GitHub)",
		"Docs link README public base URL": "README — URL publique / QR (GitHub)",
		"Docs link wiki German config": "Wiki allemand — Configuration (GitHub)",
		"Docs link README Mermaid cookbook": "README — Exemples Mermaid (GitHub)",
		"Docs link README JSON cookbook": "README — Snippets JSON (GitHub)",
		"Docs link README PDF export": "README — Export PDF / Puppeteer (GitHub)",
		"Docs link README HTML CSS": "README — CSS HTML (GitHub)",
	},
};

function processLocale(code, filePath, labelSet) {
	const raw = fs.readFileSync(filePath, "utf8");
	const obj = JSON.parse(raw);
	const out = {};
	for (const [k, v] of Object.entries(obj)) {
		const nk = stripTrailingGithubBlocks(k);
		const nv = typeof v === "string" ? stripTrailingGithubBlocks(v) : v;
		out[nk] = nv;
	}
	for (const [k, v] of Object.entries(labelSet)) {
		out[k] = v;
	}
	fs.writeFileSync(filePath, JSON.stringify(out, null, "\t") + "\n", "utf8");
	console.log("updated", path.relative(process.cwd(), filePath));
}

const i18nDir = path.join(__dirname, "..", "admin", "i18n");

processLocale("en", path.join(i18nDir, "en.json"), docsLinkLabels.en);
processLocale("de", path.join(i18nDir, "de.json"), docsLinkLabels.de);
processLocale("fr", path.join(i18nDir, "fr.json"), docsLinkLabels.fr);

for (const code of ["es", "it", "nl", "pl", "pt", "ru", "uk", "zh-cn"]) {
	processLocale(code, path.join(i18nDir, `${code}.json`), docsLinkLabels.en);
}
