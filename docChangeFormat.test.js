'use strict';

const { expect } = require('chai');
const I18n = require('./lib/i18n');
const { buildDocChangeSinceLastRun } = require('./lib/docChangeFormat');

describe('docChangeFormat', () => {
	it('returns skip when changeData is missing', () => {
		const i18n = new I18n();
		i18n.setLanguage('en');
		expect(buildDocChangeSinceLastRun(null, i18n)).to.deep.include({ skip: true, lines: [] });
	});

	it('formats initial run without bullet list', () => {
		const i18n = new I18n();
		i18n.setLanguage('en');
		const r = buildDocChangeSinceLastRun({ isInitial: true, changes: [] }, i18n);
		expect(r.skip).to.equal(false);
		expect(r.isInitial).to.equal(true);
		expect(r.lines).to.have.length(0);
		expect(r.headline).to.include('First documentation run');
	});

	it('formats adapter_version with localized changelogMsgAdapterVersion', () => {
		const i18n = new I18n();
		i18n.setLanguage('de');
		const r = buildDocChangeSinceLastRun(
			{
				isInitial: false,
				changes: [
					{
						type: 'adapter_version',
						instanceId: 'mqtt.0',
						adapterTitle: 'MQTT',
						previous: '5.0.0',
						current: '5.1.0',
						message: 'ignored',
					},
				],
			},
			i18n,
		);
		expect(r.lines).to.have.length(1);
		expect(r.lines[0].typeLabel).to.equal('Adapter-Update');
		expect(r.lines[0].detail).to.include('MQTT');
		expect(r.lines[0].detail).to.include('mqtt.0');
		expect(r.headline).to.include('1 Änderung');
	});
});
