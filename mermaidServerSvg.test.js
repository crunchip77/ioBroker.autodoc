'use strict';

const { expect } = require('chai');
const {
	embedMermaidDiagramsInHtml,
	decodePreEscapedMermaid,
	mermaidCliTheme,
	resolveMmdcCliJs,
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
	});
});
