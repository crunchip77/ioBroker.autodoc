'use strict';

const { expect } = require('chai');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
	embedMermaidDiagramsInHtml,
	decodePreEscapedMermaid,
	mermaidCliTheme,
	resolveMmdcCliJs,
	writeMmdcMermaidConfigFile,
} = require('./lib/mermaidServerSvg');

describe('mermaidServerSvg', () => {
	describe('decodePreEscapedMermaid', () => {
		it('reverses esc() order (ampersand last)', () => {
			expect(decodePreEscapedMermaid('&amp;amp;')).to.equal('&amp;');
			expect(decodePreEscapedMermaid('A &lt; B &gt; "q"')).to.equal('A < B > "q"');
		});
	});

	describe('mermaidCliTheme', () => {
		it('maps dark scheme to dark theme', () => {
			expect(mermaidCliTheme('dark')).to.equal('dark');
		});
		it('maps light and auto to default', () => {
			expect(mermaidCliTheme('light')).to.equal('default');
			expect(mermaidCliTheme('auto')).to.equal('default');
		});
	});

	describe('writeMmdcMermaidConfigFile', () => {
		it('uses base theme so cluster themeVariables are applied', async () => {
			const tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'autodoc-mmdcfg-'));
			try {
				const p = await writeMmdcMermaidConfigFile(tmp, 'dark');
				const j = JSON.parse(await fs.promises.readFile(p, 'utf8'));
				expect(j.theme).to.equal('base');
				expect(j.themeVariables.darkMode).to.equal(true);
				expect(j.themeVariables.clusterBkg).to.equal('#262a3f');
				expect(j.themeVariables.arrowheadColor).to.equal('#d0d5e0');
			} finally {
				await fs.promises.rm(tmp, { recursive: true, force: true });
			}
		});

		it('uses slate preset cluster when htmlThemePreset is slate', async () => {
			const tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'autodoc-mmdcfg-'));
			try {
				const p = await writeMmdcMermaidConfigFile(tmp, 'dark', 'slate');
				const j = JSON.parse(await fs.promises.readFile(p, 'utf8'));
				expect(j.themeVariables.clusterBkg).to.equal('#242b38');
				expect(j.themeVariables.lineColor).to.equal('#9aa8bc');
			} finally {
				await fs.promises.rm(tmp, { recursive: true, force: true });
			}
		});
	});

	describe('embedMermaidDiagramsInHtml', () => {
		it('returns HTML unchanged when there is no pre.mermaid', async () => {
			const h = '<html><body><p>x</p></body></html>';
			const out = await embedMermaidDiagramsInHtml(h, { colorScheme: 'auto' });
			expect(out).to.equal(h);
		});

		it('keeps empty pre.mermaid block', async () => {
			const inner = '   ';
			const h = `<html><pre class="mermaid">${inner}</pre></html>`;
			const out = await embedMermaidDiagramsInHtml(h, {});
			expect(out).to.equal(h);
		});
	});

	describe('embedMermaidDiagramsInHtml with mermaid-cli (optional)', function () {
		const cliJs = resolveMmdcCliJs();

		it('replaces pre.mermaid with embedded SVG when CLI is installed', async function () {
			if (!cliJs) {
				this.skip();
			}
			this.timeout(150000);
			const diagram = 'flowchart LR\n  A-->B';
			const escaped = diagram.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			const h = `<!DOCTYPE html><html><body><pre class="mermaid">${escaped}</pre></body></html>`;
			const out = await embedMermaidDiagramsInHtml(h, { colorScheme: 'light' });
			expect(out).to.include('class="mermaid-wrap mermaid-svg-embedded"');
			expect(out).to.match(/<svg[\s>]/i);
			expect(out).to.not.include('<pre class="mermaid">');
		});

		it('embeds subgraph without default cream cluster fill (dark)', async function () {
			if (!cliJs) {
				this.skip();
			}
			this.timeout(150000);
			const diagram = 'flowchart TB\n  subgraph h["Host: x"]\n    A-->B\n  end';
			const escaped = diagram.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			const h = `<!DOCTYPE html><html><body><pre class="mermaid">${escaped}</pre></body></html>`;
			const out = await embedMermaidDiagramsInHtml(h, { colorScheme: 'dark', themePreset: 'default' });
			expect(out).to.match(/262a3f/i);
			expect(out).to.not.match(/ffffde/i);
		});

		it('embeds slate dark subgraph with preset cluster color', async function () {
			if (!cliJs) {
				this.skip();
			}
			this.timeout(150000);
			const diagram = 'flowchart TB\n  subgraph h["Host: x"]\n    A-->B\n  end';
			const escaped = diagram.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			const h = `<!DOCTYPE html><html><body><pre class="mermaid">${escaped}</pre></body></html>`;
			const out = await embedMermaidDiagramsInHtml(h, { colorScheme: 'dark', themePreset: 'slate' });
			expect(out).to.match(/242b38/i);
			expect(out).to.not.match(/ffffde/i);
		});

		it('embeds subgraph without default cream cluster fill (light)', async function () {
			if (!cliJs) {
				this.skip();
			}
			this.timeout(150000);
			const diagram = 'flowchart TB\n  subgraph h["Host: x"]\n    A-->B\n  end';
			const escaped = diagram.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			const h = `<!DOCTYPE html><html><body><pre class="mermaid">${escaped}</pre></body></html>`;
			const out = await embedMermaidDiagramsInHtml(h, { colorScheme: 'light' });
			expect(out).to.match(/f0f3f7/i);
			expect(out).to.not.match(/ffffde/i);
		});
	});
});
