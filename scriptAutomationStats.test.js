'use strict';

const { expect } = require('chai');
const {
	buildScriptAutomationStats,
	findRuleEngineInstances,
	formatScriptTriggerBreakdown,
} = require('./lib/scriptAutomationStats');

describe('scriptAutomationStats', () => {
	it('buildScriptAutomationStats counts triggers and CRON fields', () => {
		const stats = buildScriptAutomationStats([
			{ enabled: true, triggerType: 'blockly', schedule: '' },
			{ enabled: true, triggerType: 'subscribe', schedule: '' },
			{ enabled: true, triggerType: 'schedule', schedule: '0 8 * * *' },
			{ enabled: true, triggerType: 'schedule', schedule: '' },
			{ enabled: false, triggerType: 'subscribe', schedule: '' },
		]);
		expect(stats.enabledTotal).to.equal(4);
		expect(stats.byTrigger.blockly).to.equal(1);
		expect(stats.byTrigger.subscribe).to.equal(1);
		expect(stats.withObjectCron).to.equal(1);
		expect(stats.scheduleInCodeOnly).to.equal(1);
	});

	it('findRuleEngineInstances lists enabled node-red/scene/logic only', () => {
		const list = findRuleEngineInstances({
			adapters: [
				{
					name: 'node-red',
					title: 'Node-RED',
					instances: [
						{ enabled: true },
						{ enabled: false },
					],
				},
				{
					name: 'hm-rpc',
					title: 'Homematic',
					instances: [{ enabled: true }],
				},
			],
		});
		expect(list).to.have.length(1);
		expect(list[0].name).to.equal('node-red');
		expect(list[0].instanceCount).to.equal(1);
	});

	it('formatScriptTriggerBreakdown skips zero buckets', () => {
		const line = formatScriptTriggerBreakdown(
			buildScriptAutomationStats([{ enabled: true, triggerType: 'blockly', schedule: '' }]),
			(key, n) => `${key}:${n}`,
		);
		expect(line).to.equal('automationTriggerBlockly:1');
	});
});
