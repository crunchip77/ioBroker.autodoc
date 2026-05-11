#!/usr/bin/env node
/**
 * Copy selected EN admin strings (with \n\n) into secondary locales.
 * Removes obsolete long i18n keys after profile/project help paragraph splits.
 */
const fs = require('fs');
const path = require('path');

const adminI18n = path.join(__dirname, '..', 'admin', 'i18n');
const en = JSON.parse(fs.readFileSync(path.join(adminI18n, 'en.json'), 'utf8'));

const shortKeys = [
	'Admin tab orientation basic',
	'Admin tab orientation documentation',
	'Advanced styling open hint',
	'Advanced setup score intro',
	'Doc layout intro',
	'Doc layout pdf hint',
	'Onboarding chapter order hint',
];

const obsoleteLongKeys = [
	'Markdown export and default documentation focus follow this choice. Every run still generates all three HTML profiles (admin, user, onboarding). User/Onboarding AI runs when an AI provider is configured — not controlled by this dropdown.',
	'What the installation covers in one or two sentences (e.g. family home: heating, lighting, security). Shown in exports as the short system summary. Counts toward the optional documentation setup score when that check is on (Advanced tab — minimum length).',
];

const newLongKeys = [
	'Markdown export and default documentation focus follow this choice.\n\nEvery run still generates all three HTML profiles (admin, user, onboarding). User/Onboarding AI runs when an AI provider is configured — not controlled by this dropdown.',
	'What the installation covers in one or two sentences (e.g. family home: heating, lighting, security). Shown in exports as the short system summary.\n\nCounts toward the optional documentation setup score when that check is on (Advanced tab — minimum length).',
];

for (const loc of ['es', 'it', 'nl', 'pl', 'pt', 'ru', 'uk', 'zh-cn']) {
	const p = path.join(adminI18n, `${loc}.json`);
	const data = JSON.parse(fs.readFileSync(p, 'utf8'));
	for (const ok of obsoleteLongKeys) {
		delete data[ok];
	}
	for (const nk of newLongKeys) {
		data[nk] = en[nk];
	}
	for (const sk of shortKeys) {
		data[sk] = en[sk];
	}
	fs.writeFileSync(p, `${JSON.stringify(data, null, '\t')}\n`);
}

console.log('Synced paragraph breaks to secondary admin i18n locales.');
