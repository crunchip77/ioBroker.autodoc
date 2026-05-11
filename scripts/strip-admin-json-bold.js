#!/usr/bin/env node
/**
 * Remove markdown **bold** markers from admin jsonConfig and i18n strings.
 * ioBroker json-config UI often shows help/staticText as plain text (no MD).
 */
const fs = require('fs');
const path = require('path');

function stripBoldMarkers(s) {
	return typeof s === 'string' ? s.replace(/\*\*/g, '') : s;
}

function walkJsonConfig(obj) {
	if (Array.isArray(obj)) {
		return obj.map(walkJsonConfig);
	}
	if (obj !== null && typeof obj === 'object') {
		const o = {};
		for (const [k, v] of Object.entries(obj)) {
			o[k] = typeof v === 'string' ? stripBoldMarkers(v) : walkJsonConfig(v);
		}
		return o;
	}
	return obj;
}

function walkI18nFlat(obj) {
	const out = {};
	for (const [k, v] of Object.entries(obj)) {
		const nk = stripBoldMarkers(k);
		const nv = typeof v === 'string' ? stripBoldMarkers(v) : v;
		if (Object.prototype.hasOwnProperty.call(out, nk)) {
			throw new Error(`Duplicate i18n key after stripping **: ${nk.slice(0, 80)}…`);
		}
		out[nk] = nv;
	}
	return out;
}

const adminDir = path.join(__dirname, '..', 'admin');
const jcPath = path.join(adminDir, 'jsonConfig.json');
const jc = JSON.parse(fs.readFileSync(jcPath, 'utf8'));
fs.writeFileSync(jcPath, `${JSON.stringify(walkJsonConfig(jc), null, '\t')}\n`);

const i18nDir = path.join(adminDir, 'i18n');
for (const f of fs.readdirSync(i18nDir)) {
	if (!f.endsWith('.json')) {
		continue;
	}
	const p = path.join(i18nDir, f);
	const data = JSON.parse(fs.readFileSync(p, 'utf8'));
	fs.writeFileSync(p, `${JSON.stringify(walkI18nFlat(data), null, '\t')}\n`);
}

console.log('Stripped ** from admin/jsonConfig.json and admin/i18n/*.json');
