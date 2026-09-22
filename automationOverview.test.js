'use strict';

const { expect } = require('chai');
const { buildAutomationOverview } = require('./lib/automationOverview');

describe('automationOverview', () => {
	it('lists only time-based items (no subscribe/blockly duplicate of Scripts chapter)', () => {
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
		expect(overview.counts.total).to.equal(3);
		expect(overview.entries.map(e => e.kind)).to.deep.equal([
			'script-cron',
			'schedule-object',
			'adapter-schedule',
		]);
		expect(overview.eventScriptCount).to.equal(1);
	});

	it('returns empty when nothing is found', () => {
		const overview = buildAutomationOverview({ scripts: { scripts: [] }, scheduleObjects: [], adapters: { adapters: [] } });
		expect(overview.isEmpty).to.equal(true);
		expect(overview.entries).to.have.length(0);
	});

	it('keeps chapter visible when only event scripts exist (transparency)', () => {
		const overview = buildAutomationOverview({
			scripts: {
				scripts: [
					{ id: 'script.js.A', enabled: true, triggerType: 'blockly', schedule: '' },
					{ id: 'script.js.B', enabled: true, triggerType: 'subscribe', schedule: '' },
				],
			},
			scheduleObjects: [],
			adapters: { adapters: [] },
		});
		expect(overview.isEmpty).to.equal(false);
		expect(overview.entries).to.have.length(0);
		expect(overview.scriptStats.enabledTotal).to.equal(2);
		expect(overview.scriptStats.byTrigger.blockly).to.equal(1);
	});

	it('detects rule-engine adapter instances for transparency', () => {
		const overview = buildAutomationOverview({
			scripts: { scripts: [] },
			scheduleObjects: [],
			adapters: {
				adapters: [
					{
						name: 'scene',
						title: 'Scene',
						instances: [{ enabled: true }],
					},
				],
			},
		});
		expect(overview.ruleEngines).to.have.length(1);
		expect(overview.isEmpty).to.equal(false);
	});
});
