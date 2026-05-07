'use strict';

const { expect } = require('chai');
const {
	getAutodocMermaidThemeVariables,
	getMermaidClientThemeMatrix,
	normalizeMermaidPreset,
} = require('./lib/mermaidAutodocPalette');

describe('mermaidAutodocPalette', () => {
	describe('normalizeMermaidPreset', () => {
		it('keeps known presets', () => {
			expect(normalizeMermaidPreset('slate')).to.equal('slate');
			expect(normalizeMermaidPreset('highContrast')).to.equal('highContrast');
		});
		it('falls back for unknown', () => {
			expect(normalizeMermaidPreset('nope')).to.equal('default');
		});
	});

	describe('getAutodocMermaidThemeVariables', () => {
		it('slate dark matches CSS preset cluster tone', () => {
			const v = getAutodocMermaidThemeVariables('slate', true);
			expect(v.clusterBkg).to.equal('#242b38');
			expect(v.lineColor).to.equal('#9aa8bc');
		});
		it('warm light matches warm preset edges', () => {
			const v = getAutodocMermaidThemeVariables('warm', false);
			expect(v.clusterBorder).to.equal('#c4b8a8');
			expect(v.lineColor).to.equal('#4a3f32');
		});
		it('highContrast dark uses light edges for contrast', () => {
			const v = getAutodocMermaidThemeVariables('highContrast', true);
			expect(v.lineColor).to.equal('#f0f0f0');
		});
	});

	describe('getMermaidClientThemeMatrix', () => {
		it('has all four presets with light and dark', () => {
			const m = getMermaidClientThemeMatrix();
			for (const id of ['default', 'highContrast', 'warm', 'slate']) {
				expect(m[id].light.darkMode).to.equal(false);
				expect(m[id].dark.darkMode).to.equal(true);
				expect(m[id].light.lineColor).to.be.a('string');
				expect(m[id].dark.clusterBkg).to.be.a('string');
			}
		});
	});
});
