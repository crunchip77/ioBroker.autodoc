/**
 * GitHub blob markdown often ignores or rewrites heading fragments; #L line URLs scroll reliably.
 * Updates external README links only (not same-file #heading links).
 *
 * Branch for full blob URLs: use **dev** while doc layout leads **main**; set to **main** after merging.
 */
const fs = require('fs');
const path = require('path');

const DOC_BRANCH = 'dev';

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
		const toHttps = `https://github.com/crunchip77/ioBroker.autodoc/blob/${DOC_BRANCH}/README.md#L${lineNum}`;
		out = out.split(fromHttps).join(toHttps);
		const fromBlob = `blob/${DOC_BRANCH}/README.md#${frag}`;
		const toBlob = `blob/${DOC_BRANCH}/README.md#L${lineNum}`;
		out = out.split(fromBlob).join(toBlob);
		const fromRel = `../../README.md#${frag}`;
		const toRel = `../../README.md#L${lineNum}`;
		out = out.split(fromRel).join(toRel);
	}
	return out;
}

const root = path.join(__dirname, '..');
for (const rel of ['admin/jsonConfig.json', 'README.md', 'docs/user-guide/README.de.md', 'docs/user-guide/README.md']) {
	const fp = path.join(root, rel);
	let txt = fs.readFileSync(fp, 'utf8');
	txt = swapFragToLine(txt);
	fs.writeFileSync(fp, txt);
	console.log('updated', rel);
}
