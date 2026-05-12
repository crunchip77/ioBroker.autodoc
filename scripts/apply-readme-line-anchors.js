/**
 * Keeps GitHub doc links on **rendered** blob URLs (`blob/<branch>/…/*.md#…`) — not `?plain=1` + `#L…`
 * (source view is unreadable for operators).
 *
 * Maps legacy line URLs (`?plain=1#L###`) to **README heading slugs**; DE wiki uses explicit **`id=` on `h2`/`h3`** (GitHub scroll targets).
 * Branch: set **main** after merging if URLs should track **main**.
 */
const fs = require('fs');
const path = require('path');

const DOC_BRANCH = 'dev';

const README_BLOB_BASE = `https://github.com/crunchip77/ioBroker.autodoc/blob/${DOC_BRANCH}/README.md`;

/** Heading slug → approximate README line (maintainer hint only). */
const fragToLine = {
	'documentation-instance-overview': '44',
	'public-base-url': '67',
	'optional-pdf-export-puppeteer': '78',
	'mermaid-cookbook-examples': '100',
	'json-cookbook-snippets': '131',
	'html-custom-css-examples': '186',
};

/**
 * @param {string} s File text to normalize.
 */
function migratePlainLineAnchorsToHeadingFragments(s) {
	let out = s;
	for (const [frag, lineNum] of Object.entries(fragToLine)) {
		const needle = `README.md?plain=1#L${lineNum}`;
		const repl = `README.md#${frag}`;
		out = out.split(needle).join(repl);
	}
	out = out
		.split('docs/user-guide/README.de.md?plain=1#L189')
		.join('docs/user-guide/README.de.md#wiki-admin-doc-lang');
	out = out
		.split('docs/user-guide/README.de.md?plain=1#L193')
		.join(
			'docs/user-guide/README.de.md#schritt-4--zus\u00e4tzliches-markdown-kapitel-tab-html---zusatzkapitel--custom-sections-customdocsectionsjson',
		);
	out = out.replace(/README\.md\?plain=1(?=["')\s]|$)/g, 'README.md');
	out = out.replace(/README\.de\.md\?plain=1(?=["')\s]|$)/g, 'README.de.md');
	return out;
}

/**
 * @param {string} s File text to normalize.
 */
function expandRelativeMainReadmeLinks(s) {
	let out = s;
	out = out.replace(/\]\(\.\.\/\.\.\/README\.md#([\w-]+)\)/g, (_, frag) => `](${README_BLOB_BASE}#${frag})`);
	out = out.replace(/\]\(\.\.\/\.\.\/README\.md\)/g, () => `](${README_BLOB_BASE})`);
	return out;
}

const root = path.join(__dirname, '..');
for (const rel of [
	'admin/jsonConfig.json',
	'README.md',
	'docs/user-guide/README.de.md',
	'docs/user-guide/README.md',
	'package.json',
	'io-package.json',
]) {
	const fp = path.join(root, rel);
	let txt = fs.readFileSync(fp, 'utf8');
	txt = expandRelativeMainReadmeLinks(migratePlainLineAnchorsToHeadingFragments(txt));
	fs.writeFileSync(fp, txt);
	console.log('updated', rel);
}
