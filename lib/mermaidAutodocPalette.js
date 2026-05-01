/**
 * Optional named CSS variable packs — same ids as `htmlThemePreset` / `lib/htmlThemePresets.js`.
 */
'use strict';

const PRESET_SET = new Set(['default', 'highContrast', 'warm', 'slate']);

/**
 * @param {string} presetId Raw or normalized `htmlThemePreset` id
 * @returns {string} One of default, highContrast, warm, slate
 */
function normalizeMermaidPreset(presetId) {
	const s = String(presetId || 'default');
	return PRESET_SET.has(s) ? s : 'default';
}

/**
 * Full `themeVariables` for Mermaid `theme: base` (one HTML palette × light/dark shell).
 *
 * @param {string} presetId Preset id (see {@link normalizeMermaidPreset})
 * @param {boolean} isDark Whether export uses dark diagram palette (body.dark / mmdc dark)
 * @returns {Record<string, string | boolean>} Mermaid themeVariables
 */
function getAutodocMermaidThemeVariables(presetId, isDark) {
	const p = normalizeMermaidPreset(presetId);
	if (!isDark) {
		switch (p) {
			case 'highContrast':
				return {
					darkMode: false,
					background: '#e2e2e2',
					primaryColor: '#f5f5f5',
					primaryTextColor: '#0a0a0a',
					lineColor: '#0a0a0a',
					arrowheadColor: '#0a0a0a',
					defaultLinkColor: '#0a0a0a',
					clusterBkg: '#dedede',
					clusterBorder: '#1f1f1f',
					titleColor: '#0a0a0a',
				};
			case 'warm':
				return {
					darkMode: false,
					background: '#efe8de',
					primaryColor: '#f5ebe0',
					primaryTextColor: '#2a2218',
					lineColor: '#4a3f32',
					arrowheadColor: '#4a3f32',
					defaultLinkColor: '#4a3f32',
					clusterBkg: '#e2d9cc',
					clusterBorder: '#c4b8a8',
					titleColor: '#2a2218',
				};
			case 'slate':
				return {
					darkMode: false,
					background: '#e4e7ec',
					primaryColor: '#e8ecf0',
					primaryTextColor: '#1a1f2a',
					lineColor: '#3d4859',
					arrowheadColor: '#3d4859',
					defaultLinkColor: '#3d4859',
					clusterBkg: '#d8dee8',
					clusterBorder: '#9aa3b0',
					titleColor: '#1a1f2a',
				};
			default:
				return {
					darkMode: false,
					lineColor: '#334155',
					arrowheadColor: '#334155',
					defaultLinkColor: '#334155',
					clusterBkg: '#f0f3f7',
					clusterBorder: '#c8d0db',
					titleColor: '#333333',
				};
		}
	}
	switch (p) {
		case 'highContrast':
			return {
				darkMode: true,
				background: '#0a0a0a',
				primaryColor: '#2a2a2a',
				primaryTextColor: '#f5f5f5',
				lineColor: '#f0f0f0',
				arrowheadColor: '#f0f0f0',
				defaultLinkColor: '#f0f0f0',
				clusterBkg: '#222222',
				clusterBorder: '#666666',
				titleColor: '#f5f5f5',
			};
		case 'warm':
			return {
				darkMode: true,
				background: '#1a1510',
				primaryColor: '#3a3228',
				primaryTextColor: '#e8ddd0',
				lineColor: '#c8b8a8',
				arrowheadColor: '#c8b8a8',
				defaultLinkColor: '#c8b8a8',
				clusterBkg: '#2a2418',
				clusterBorder: '#4a3f32',
				titleColor: '#e8ddd0',
			};
		case 'slate':
			return {
				darkMode: true,
				background: '#0f1117',
				primaryColor: '#2a3344',
				primaryTextColor: '#e0e6ef',
				lineColor: '#9aa8bc',
				arrowheadColor: '#9aa8bc',
				defaultLinkColor: '#9aa8bc',
				clusterBkg: '#242b38',
				clusterBorder: '#3a4556',
				titleColor: '#e0e6ef',
			};
		default:
			return {
				darkMode: true,
				background: '#1a1d2e',
				primaryColor: '#5c4d7a',
				primaryTextColor: '#f0f0f0',
				lineColor: '#d0d5e0',
				arrowheadColor: '#d0d5e0',
				defaultLinkColor: '#d0d5e0',
				clusterBkg: '#262a3f',
				clusterBorder: '#3d4556',
				titleColor: '#e0e0e0',
			};
	}
}

/**
 * All preset × mode pairs for client `mermaid.initialize` (embedded JSON in HTML).
 *
 * @returns {object} Keys default, highContrast, warm, slate → { light, dark } variable maps
 */
function getMermaidClientThemeMatrix() {
	return {
		default: {
			light: getAutodocMermaidThemeVariables('default', false),
			dark: getAutodocMermaidThemeVariables('default', true),
		},
		highContrast: {
			light: getAutodocMermaidThemeVariables('highContrast', false),
			dark: getAutodocMermaidThemeVariables('highContrast', true),
		},
		warm: {
			light: getAutodocMermaidThemeVariables('warm', false),
			dark: getAutodocMermaidThemeVariables('warm', true),
		},
		slate: {
			light: getAutodocMermaidThemeVariables('slate', false),
			dark: getAutodocMermaidThemeVariables('slate', true),
		},
	};
}

module.exports = {
	normalizeMermaidPreset,
	getAutodocMermaidThemeVariables,
	getMermaidClientThemeMatrix,
};
