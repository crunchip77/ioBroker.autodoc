'use strict';

const fs = require('node:fs').promises;
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');

/**
 * @returns {object|null} Resolved `puppeteer` module when installed, otherwise `null`.
 */
function tryRequirePuppeteer() {
	try {
		return require('puppeteer');
	} catch {
		return null;
	}
}

/**
 * Wait for delayed client-side renders (e.g. Mermaid from jsDelivr).
 *
 * @param {number} ms - Delay in milliseconds
 * @returns {Promise<void>}
 */
function delay(ms) {
	return new Promise(resolve => globalThis.setTimeout(resolve, ms));
}

/**
 * Renders three HTML profiles to PDF buffers using Puppeteer (optional npm package).
 * Uses Chromium with the same sandbox flags as Mermaid CLI (Docker/LXC compatibility).
 *
 * @param {{ admin?: string, user?: string, onboarding?: string }} htmlAll UTF-8 HTML per profile.
 * @param {(line: string) => void} [logInfo] Progress logger (optional).
 * @returns {Promise<Partial<Record<'admin'|'user'|'onboarding', Buffer>>>} Non-empty buffers only when generation succeeded for that profile.
 */
async function renderProfilesToPdfBuffers(htmlAll, logInfo) {
	const puppeteer = tryRequirePuppeteer();
	if (!puppeteer) {
		throw new Error(
			'PDF export needs the optional "puppeteer" package with Chromium (npm install puppeteer in this adapter folder, or install dependencies including optional packages).',
		);
	}

	const profiles = ['admin', 'user', 'onboarding'];
	const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'iobroker-autodoc-pdf-'));

	const browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
	});

	const log = typeof logInfo === 'function' ? logInfo : () => {};

	const out = {};

	try {
		const page = await browser.newPage();
		await page.setDefaultNavigationTimeout(120_000);

		for (const profile of profiles) {
			const html = htmlAll[profile];
			if (!html || !String(html).trim()) {
				continue;
			}

			const tmpHtml = path.join(tmpRoot, `${profile}.html`);
			await fs.writeFile(tmpHtml, html, 'utf8');
			const url = pathToFileURL(tmpHtml).href;
			log(`profile ${profile}: loading (${tmpHtml})`);

			try {
				await page.goto(url, { waitUntil: 'networkidle0', timeout: 120_000 });
			} catch {
				await page.goto(url, { waitUntil: 'load', timeout: 120_000 });
			}
			/* Allow CDN-based Mermaid to finish rendering in the browser PDF path */
			await delay(3500);

			const pdfBuf = await page.pdf({
				format: 'A4',
				printBackground: true,
				margin: { top: '10mm', bottom: '12mm', left: '8mm', right: '8mm' },
			});
			out[profile] = Buffer.isBuffer(pdfBuf) ? pdfBuf : Buffer.from(pdfBuf);
			log(`profile ${profile}: ${out[profile].length} bytes PDF`);
		}
	} finally {
		await browser.close();
		await fs.rm(tmpRoot, { recursive: true, force: true });
	}

	return out;
}

module.exports = {
	tryRequirePuppeteer,
	renderProfilesToPdfBuffers,
};
