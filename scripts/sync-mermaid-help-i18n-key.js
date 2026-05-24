#!/usr/bin/env node
/**
 * Rename long Mermaid manual help i18n key (EN wording + paragraph breaks) in secondary locales.
 */
const fs = require('node:fs');
const path = require('node:path');

const adminI18n = path.join(__dirname, '..', 'admin', 'i18n');
const en = JSON.parse(fs.readFileSync(path.join(adminI18n, 'en.json'), 'utf8'));

const keys = Object.keys(en).filter(k => k.startsWith('Optional Mermaid diagram you write yourself'));
if (keys.length !== 1) {
	throw new Error(`Expected exactly one Mermaid help key in en.json, got ${keys.length}`);
}
const newK = keys[0];
const val = en[newK];

for (const loc of ['es', 'it', 'nl', 'pl', 'pt', 'ru', 'uk', 'zh-cn']) {
	const p = path.join(adminI18n, `${loc}.json`);
	const d = JSON.parse(fs.readFileSync(p, 'utf8'));
	for (const k of Object.keys(d)) {
		if (k.startsWith('Optional Mermaid diagram you write yourself') && k !== newK) {
			delete d[k];
		}
	}
	d[newK] = val;
	fs.writeFileSync(p, `${JSON.stringify(d, null, '\t')}\n`);
}
console.log('Mermaid help key synced in secondary locales.');
