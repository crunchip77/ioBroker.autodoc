'use strict';

/**
 * Embed Mermaid diagrams as inline SVG during HTML generation (Phase 5 — TODO § 1.2a).
 * Uses @mermaid-js/mermaid-cli (Puppeteer) when installed as optional dependency; otherwise leaves <pre class="mermaid"> for client-side jsDelivr render.
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

/** @returns {string|null} Path to mermaid-cli `src/cli.js`, or null if not installed */
function resolveMmdcCliJs() {
	let dir = path.join(__dirname, '..');
	for (let i = 0; i < 12; i++) {
		const candidate = path.join(dir, 'node_modules', '@mermaid-js', 'mermaid-cli', 'src', 'cli.js');
		if (fs.existsSync(candidate)) {
			return candidate;
		}
		const parent = path.dirname(dir);
		if (parent === dir) {
			break;
		}
		dir = parent;
	}
	return null;
}

/**
 * Undo {@link esc} in htmlRenderer (ampersand must be last).
 *
 * @param {string} innerHtml Raw inner HTML of `pre.mermaid`
 * @returns {string} Decoded Mermaid source text
 */
function decodePreEscapedMermaid(innerHtml) {
	return innerHtml
		.replace(/&quot;/g, '"')
		.replace(/&gt;/g, '>')
		.replace(/&lt;/g, '<')
		.replace(/&amp;/g, '&');
}

/**
 * @param {string} source Mermaid definition
 * @param {{ theme: 'default'|'dark', width?: number, height?: number }} opts mmdc sizing and theme
 * @returns {Promise<string>} SVG markup
 */
async function runMmdcToSvg(source, opts) {
	const cliJs = resolveMmdcCliJs();
	if (!cliJs || !fs.existsSync(cliJs)) {
		throw new Error('@mermaid-js/mermaid-cli not available');
	}
	const width = opts.width ?? 1400;
	const height = opts.height ?? 1000;
	const theme = opts.theme === 'dark' ? 'dark' : 'default';
	const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'autodoc-mermaid-'));
	const inFile = path.join(tmpDir, 'diagram.mmd');
	const outFile = path.join(tmpDir, 'diagram.svg');
	try {
		await fs.promises.writeFile(inFile, source, 'utf8');
		await execFileAsync(
			process.execPath,
			[
				cliJs,
				'-i',
				inFile,
				'-o',
				outFile,
				'-t',
				theme,
				'-w',
				String(width),
				'-H',
				String(height),
				'-b',
				'transparent',
				'-q',
			],
			{ timeout: 120000, windowsHide: true, maxBuffer: 8 * 1024 * 1024 },
		);
		return await fs.promises.readFile(outFile, 'utf8');
	} finally {
		await fs.promises.rm(tmpDir, { recursive: true, force: true });
	}
}

/**
 * @param {'light'|'dark'|'auto'} colorScheme From {@link parseHtmlColorScheme}
 * @returns {'default'|'dark'} Theme value for mmdc `-t`
 */
function mermaidCliTheme(colorScheme) {
	return colorScheme === 'dark' ? 'dark' : 'default';
}

/**
 * @param {string} html Full HTML document
 * @param {{ colorScheme?: 'light'|'dark'|'auto', log?: { debug?: Function, warn?: Function } }} [options] Adapter logger
 * @returns {Promise<string>} HTML with diagrams embedded or unchanged
 */
async function embedMermaidDiagramsInHtml(html, options = {}) {
	const cliJs = resolveMmdcCliJs();
	if (!cliJs || !fs.existsSync(cliJs)) {
		options.log?.debug?.(
			'Mermaid: @mermaid-js/mermaid-cli not installed — HTML uses client-side Mermaid (jsDelivr). Install optional dependency for embedded SVG.',
		);
		return html;
	}

	const scheme =
		options.colorScheme === 'light' || options.colorScheme === 'dark' || options.colorScheme === 'auto'
			? options.colorScheme
			: 'auto';
	const theme = mermaidCliTheme(scheme);

	const parts = [];
	let lastIndex = 0;
	const re = /<pre class="mermaid">([\s\S]*?)<\/pre>/g;
	let match;
	while ((match = re.exec(html)) !== null) {
		parts.push(html.slice(lastIndex, match.index));
		const inner = match[1];
		const source = decodePreEscapedMermaid(inner).trim();
		if (!source) {
			parts.push(match[0]);
		} else {
			try {
				const svg = await runMmdcToSvg(source, { theme });
				parts.push(`<div class="mermaid-wrap mermaid-svg-embedded">${svg}</div>`);
			} catch (e) {
				options.log?.warn?.(`Mermaid SVG (mmdc) failed — keeping source block: ${e.message}`);
				parts.push(match[0]);
			}
		}
		lastIndex = match.index + match[0].length;
	}
	parts.push(html.slice(lastIndex));
	return parts.join('');
}

module.exports = {
	embedMermaidDiagramsInHtml,
	resolveMmdcCliJs,
	decodePreEscapedMermaid,
	runMmdcToSvg,
	mermaidCliTheme,
};
