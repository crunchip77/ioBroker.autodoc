'use strict';

const { expect } = require('chai');
const { buildAutomationOverview } = require('./lib/automationOverview');

describe('automationOverview', () => {
	it('merges scripts, schedule objects, and adapter cron into one list', () => {
		const overview = buildAutomationOverview({
			scripts: {
				scripts: [
					{
						id: 'script.js.Heating.timer',
						name: 'Heating timer',
						schedule: '0 6 * * *',
						triggerType: 'schedule',
						enabled: true,
					},
					{
						id: 'script.js.Door.onOpen',
						name: 'Door',
						schedule: '',
						triggerType: 'subscribe',
						enabled: true,
					},
				],
			},
			scheduleObjects: [{ id: 'schedule.0.vacation', name: 'Vacation', desc: 'Away mode', enabled: true }],
			adapters: {
				adapters: [
					{
						name: 'backitup',
						title: 'Backitup',
						instances: [
							{
								id: 'backitup.0',
								enabled: true,
								mode: 'schedule',
								scheduleCron: '30 2 * * *',
								restartSchedule: '',
							},
						],
					},
				],
			},
		});

		expect(overview.isEmpty).to.equal(false);
		expect(overview.counts.total).to.equal(4);
		expect(overview.entries.map(e => e.kind)).to.deep.equal([
			'script-cron',
			'script-trigger',
			'schedule-object',
			'adapter-schedule',
		]);
	});

	it('returns empty when nothing is found', () => {
		const overview = buildAutomationOverview({ scripts: { scripts: [] }, scheduleObjects: [], adapters: { adapters: [] } });
		expect(overview.isEmpty).to.equal(true);
		expect(overview.entries).to.have.length(0);
	});
});
