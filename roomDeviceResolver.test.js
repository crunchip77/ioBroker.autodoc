'use strict';

const { expect } = require('chai');
const {
	parseAdapterInstance,
	ancestorIds,
	isGenericDeviceName,
	chooseBestObject,
	resolveCanonicalDeviceKey,
	buildRoomDeviceList,
} = require('./lib/roomDeviceResolver');

describe('roomDeviceResolver', () => {
	it('parseAdapterInstance reads adapter instance prefix', () => {
		expect(parseAdapterInstance('sonoff.0.Kueche.POWER')).to.equal('sonoff.0');
		expect(parseAdapterInstance('alias.0.zigbee2mqtt.fenster.bad.opened')).to.equal('alias.0');
	});

	it('ancestorIds walks from state up to channel/device', () => {
		expect(ancestorIds('sonoff.0.Kueche.POWER')).to.deep.equal([
			'sonoff.0.Kueche.POWER',
			'sonoff.0.Kueche',
		]);
	});

	it('isGenericDeviceName flags technical leaf labels', () => {
		expect(isGenericDeviceName('occupancy', 'alias.0.zigbee.bwm.occupancy')).to.equal(true);
		expect(isGenericDeviceName('Fenster Bad', 'alias.0.zigbee.fenster.bad')).to.equal(false);
		expect(isGenericDeviceName('Channel Shutter', 'shelly.0.x.Shutter')).to.equal(true);
	});

	it('chooseBestObject prefers device/channel names over state leaves', () => {
		const best = chooseBestObject([
			{ id: 'sonoff.0.Kueche.POWER', type: 'state', name: 'Kueche POWER' },
			{ id: 'sonoff.0.Kueche', type: 'device', name: 'Kueche' },
		]);
		if (!best) {
			throw new Error('Expected a best object');
		}
		expect(best.id).to.equal('sonoff.0.Kueche');
		expect(best.name).to.equal('Kueche');
	});

	it('resolveCanonicalDeviceKey groups under device or channel id', () => {
		expect(
			resolveCanonicalDeviceKey({ id: 'sonoff.0.Kueche', type: 'device' }, 'sonoff.0.Kueche.POWER'),
		).to.equal('sonoff.0.Kueche');
	});

	it('buildRoomDeviceList deduplicates device + POWER state in one room', () => {
		const deviceMap = {
			'sonoff.0.Kueche': {
				deviceId: 'sonoff.0.Kueche',
				deviceName: 'Kueche',
				role: 'switch',
				type: 'device',
				sourceAdapter: 'sonoff.0',
				adapterName: 'sonoff',
			},
			'sonoff.0.Kueche.POWER': {
				deviceId: 'sonoff.0.Kueche',
				deviceName: 'Kueche',
				role: 'switch',
				type: 'state',
				sourceAdapter: 'sonoff.0',
				adapterName: 'sonoff',
			},
		};
		const liveStates = {
			'sonoff.0.Kueche.POWER': { val: true },
		};
		const rows = buildRoomDeviceList(
			['sonoff.0.Kueche', 'sonoff.0.Kueche.POWER'],
			deviceMap,
			liveStates,
			{},
		);
		expect(rows).to.have.length(1);
		expect(rows[0].deviceName).to.equal('Kueche');
		expect(rows[0].currentValue).to.equal(true);
	});
});
