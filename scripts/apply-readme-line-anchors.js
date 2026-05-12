/**
 * GitHub blob markdown often ignores or rewrites heading fragments; #L line URLs scroll reliably.
 * Updates external README links only (not same-file #heading links).
 *
 * Branch for full blob URLs: use **dev** while doc layout leads **main**; set to **main** after merging.
 */
const fs = require('fs');
const path = require('path');

const DOC_BRANCH = 'dev';

const README_BLOB_BASE = `https://github.com/crunchip77/ioBroker.autodoc/blob/${DOC_BRANCH}/README.md`;

const fragToLine = {
	'documentation-instance-overview': '44',
	'public-base-url': '67',
	'optional-pdf-export-puppeteer': '78',
	'mermaid-cookbook-examples': '100',
	'json-cookbook-snippets': '131',
	'html-custom-css-examples': '186',
};

function swapFragToLine(s) {
	let out = s;
	for (const [frag, lineNum] of Object.entries(fragToLine)) {
		const fromHttps = `https://github.com/crunchip77/ioBroker.autodoc/blob/${DOC_BRANCH}/README.md#${frag}`;
		const toHttps = `https://github.com/crunchip77/ioBroker.autodoc/blob/${DOC_BRANCH}/README.md?plain=1#L${lineNum}`;
		out = out.split(fromHttps).join(toHttps);
		const fromBlob = `blob/${DOC_BRANCH}/README.md#${frag}`;
		const toBlob = `blob/${DOC_BRANCH}/README.md?plain=1#L${lineNum}`;
		out = out.split(fromBlob).join(toBlob);
		const fromRel = `../../README.md#${frag}`;
		const toRel = `${README_BLOB_BASE}?plain=1#L${lineNum}`;
		out = out.split(fromRel).join(toRel);
	}
	return out;
}

/**
 * Relative `](../../README.md?…)` targets break on GitHub when `?plain=1` is present; use blob URLs.
 *
 * @param {string} s Markdown file contents.
 */
function expandRelativeMainReadmeLinks(s) {
	let out = s;
	out = out.replace(
		/\]\(\.\.\/\.\.\/README\.md\?plain=1#L(\d+)\)/g,
		(_, lineNum) => `](${README_BLOB_BASE}?plain=1#L${lineNum})`,
	);
	out = out.replace(/\]\(\.\.\/\.\.\/README\.md\)/g, () => `](${README_BLOB_BASE}?plain=1)`);
	return out;
}

/**
 * GitHub Markdown Preview ignores #L…; ?plain=1 opens source with line numbers (idempotent).
 *
 * @param {string} s File text to normalize.
 */
function ensurePlainBeforeMdLineFragments(s) {
	let out = s;
	out = out.replace(
		/https:\/\/github\.com\/crunchip77\/ioBroker\.autodoc\/blob\/[\w.-]+\/[\w./-]+\.md(?!\?plain=1)#L\d+/g,
		match => match.replace(/\.md#L/, '.md?plain=1#L'),
	);
	out = out.replace(
		/\(((?:\.\/)?README(?:\.de)?\.md)(?!\?plain=1)#L(\d+)\)/g,
		(_, base, lineNum) => `(${base}?plain=1#L${lineNum})`,
	);
	return out;
}

const root = path.join(__dirname, '..');
for (const rel of ['admin/jsonConfig.json', 'README.md', 'docs/user-guide/README.de.md', 'docs/user-guide/README.md']) {
	const fp = path.join(root, rel);
	let txt = fs.readFileSync(fp, 'utf8');
	txt = ensurePlainBeforeMdLineFragments(expandRelativeMainReadmeLinks(swapFragToLine(txt)));
	fs.writeFileSync(fp, txt);
	console.log('updated', rel);
}
