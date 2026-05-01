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
 * Puppeteer launch options for headless Chromium inside Docker/LXC/Unraid, where the
 * kernel/user-namespace often provides no usable SUID sandbox (Chromium then exits with
 * "No usable sandbox"). Diagram source is adapter-admin-controlled Mermaid text only.
 *
 * @param {string} tmpDir Temp directory (mkdtemp) — config file is removed with the rest
 * @returns {Promise<string>} Absolute path to written JSON file
 * @see https://pptr.dev/troubleshooting
 */
async function writeMmdcPuppeteerConfigFile(tmpDir) {
	const cfgPath = path.join(tmpDir, 'puppeteer-config.json');
	const cfg = {
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
	};
	await fs.promises.writeFile(cfgPath, JSON.stringify(cfg), 'utf8');
	return cfgPath;
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
		const puppeteerConfigFile = await writeMmdcPuppeteerConfigFile(tmpDir);
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
				'-p',
				puppeteerConfigFile,
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

	/**
	 * @param {string} docHtml HTML to scan
	 * @param {RegExp} re Full block to replace; group 1 = inner `pre.mermaid` text
	 * @returns {Promise<{ html: string, mmdcFailureCount: number, firstMmdcError: string }>} Rebuilt HTML and failure stats
	 */
	async function replaceMermaidPreBlocks(docHtml, re) {
		const parts = [];
		let lastIndex = 0;
		let match;
		const reGlobal = new RegExp(re.source, 'g');
		let failCount = 0;
		let firstErr = '';
		while ((match = reGlobal.exec(docHtml)) !== null) {
			parts.push(docHtml.slice(lastIndex, match.index));
			const inner = match[1];
			const fullMatch = match[0];
			const source = decodePreEscapedMermaid(inner).trim();
			if (!source) {
				parts.push(fullMatch);
			} else {
				try {
					const svg = await runMmdcToSvg(source, { theme });
					parts.push(`<div class="mermaid-wrap mermaid-svg-embedded">${svg}</div>`);
				} catch (e) {
					failCount++;
					if (!firstErr) {
						firstErr = e instanceof Error ? e.message : String(e);
					}
					const msg = e instanceof Error ? e.message : String(e);
					options.log?.debug?.(
						`Mermaid SVG (mmdc) failed for one diagram — keeping <pre class="mermaid">: ${msg}`,
					);
					parts.push(fullMatch);
				}
			}
			lastIndex = match.index + fullMatch.length;
		}
		parts.push(docHtml.slice(lastIndex));
		return { html: parts.join(''), mmdcFailureCount: failCount, firstMmdcError: firstErr };
	}

	const wrappedRe = /<div class="mermaid-wrap">\s*<pre class="mermaid">([\s\S]*?)<\/pre>\s*<\/div>/g;
	const barePreRe = /<pre class="mermaid">([\s\S]*?)<\/pre>/g;

	let mmdcFailureCount = 0;
	let firstMmdcError = '';
	let out = html;

	const pass1 = await replaceMermaidPreBlocks(out, wrappedRe);
	out = pass1.html;
	mmdcFailureCount += pass1.mmdcFailureCount;
	if (pass1.firstMmdcError) {
		firstMmdcError = pass1.firstMmdcError;
	}

	const pass2 = await replaceMermaidPreBlocks(out, barePreRe);
	out = pass2.html;
	mmdcFailureCount += pass2.mmdcFailureCount;
	if (!firstMmdcError && pass2.firstMmdcError) {
		firstMmdcError = pass2.firstMmdcError;
	}

	if (mmdcFailureCount > 0) {
		let hint =
			'Install OS libraries for headless Chromium on Linux if you see libnss3 (etc.); see https://pptr.dev/troubleshooting — or use generated HTML online (jsDelivr).';
		if (/sandbox|no-sandbox/i.test(firstMmdcError)) {
			hint =
				'If the error mentions Chromium sandbox / Docker: autodoc passes --no-sandbox to mmdc (update adapter). Else install OS libs (libnss3, …) — https://pptr.dev/troubleshooting.';
		}
		const errShort = firstMmdcError.length > 180 ? `${firstMmdcError.slice(0, 180)}…` : firstMmdcError;
		options.log?.warn?.(
			`Mermaid: ${mmdcFailureCount} diagram(s) not embedded as SVG (mmdc failed). ${hint} First error: ${errShort}`,
		);
	}
	return out;
}

module.exports = {
	embedMermaidDiagramsInHtml,
	resolveMmdcCliJs,
	decodePreEscapedMermaid,
	runMmdcToSvg,
	mermaidCliTheme,
	writeMmdcPuppeteerConfigFile,
};
