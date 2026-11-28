'use strict';

const { expect } = require('chai');
const { buildContextPack, CONTEXT_PACK_VERSION, MAX_ROOMS } = require('./lib/contextPack');

/** Mini-i18n: gibt den Key zurück, reicht für Forum-Karte und Gaps. */
const i18n = { t: key => String(key) };

describe('contextPack', () => {
	it('liefert immer packVersion und leere Defaults ohne Modell', () => {
		const pack = buildContextPack(null, i18n);
		expect(pack.packVersion).to.equal(CONTEXT_PACK_VERSION);
		expect(pack.inventory.instances).to.equal(0);
		expect(pack.rooms.list).to.deep.equal([]);
		expect(pack.forumCard).to.be.a('string');
	});

	it('kürzt Inventar, Räume, Delta und Lücken aus dem Dokumentmodell', () => {
		const rooms = [];
		for (let i = 0; i < MAX_ROOMS + 3; i++) {
			rooms.push({ id: `enum.rooms.r${i}`, name: `Raum ${i}`, deviceCount: i });
		}
		const pack = buildContextPack(
			{
				meta: { generatedAt: '2026-11-28T18:00:00.000Z', language: 'de' },
				system: {
					projectName: 'Haus',
					primaryHost: { name: 'IoBroker', version: '7.2.5', platform: 'linux', operatingSystem: 'Linux' },
					statistics: {
						instanceCount: 10,
						enabledInstanceCount: 8,
						disabledInstanceCount: 2,
						totalStateObjects: 100,
					},
					hosts: [],
					location: { activeRepo: 'beta' },
				},
				appendices: { stateSummary: { total: 100, writable: 40, readonly: 60 } },
				rooms: { rooms, totalRooms: rooms.length, totalFunctions: 2 },
				scripts: { totalScripts: 5, enabledScripts: 4 },
				manualContext: { description: 'Smartes Haus', guestHelpNote: 'Klingel' },
				maintenance: {
					score: 70,
					scores: { data: { score: 100 }, manual: { score: 50 }, depth: { score: 60 } },
					checklist: [
						{ key: 'checkHostsFound', ok: true },
						{ key: 'checkRoomsDefined', ok: false },
					],
				},
				docChangeSinceLastRun: {
					isInitial: false,
					changes: [{ type: 'instance_added', message: 'foo.0 hinzu' }],
				},
				quickStart: {
					roomGuides: [{ name: 'Wohnzimmer', deviceCount: 3, highlights: [{ deviceName: 'Lampe', valueText: 'an' }] }],
				},
				automationOverview: { entries: [{ kind: 'script-cron' }] },
			},
			i18n,
		);

		expect(pack.projectName).to.equal('Haus');
		expect(pack.inventory.enabledInstances).to.equal(8);
		expect(pack.inventory.host).to.equal('IoBroker');
		expect(pack.rooms.truncated).to.equal(true);
		expect(pack.rooms.list).to.have.length(MAX_ROOMS);
		expect(pack.delta.lines[0].detail).to.equal('foo.0 hinzu');
		expect(pack.gaps.items.some(g => g.key === 'checkRoomsDefined')).to.equal(true);
		expect(pack.guest.rooms[0].name).to.equal('Wohnzimmer');
		expect(pack.automation.timeBasedCount).to.equal(1);
		expect(pack.notes.description).to.include('Smartes');
	});
});
