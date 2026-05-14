'use strict';

const { expect } = require('chai');
const { onboardingGuestShowsScriptNames } = require('./lib/guestScriptPrivacy');
const { buildQuickStartGuide, sliceQuickStartForOnboarding, highlightCategoryRank, HIGHLIGHT_CATEGORY_RANK } = require('./lib/quickStartGuide');
const { warnChapterJsonLayout, classifyChapterOrderTokens, DOC_HELP_URL } = require('./lib/chapterConfigWarnings');

describe('guestScriptPrivacy', () => {
	it('treats missing, null config and non-true values as hide script names', () => {
		expect(onboardingGuestShowsScriptNames(null)).to.equal(false);
		expect(onboardingGuestShowsScriptNames(undefined)).to.equal(false);
		expect(onboardingGuestShowsScriptNames({})).to.equal(false);
		expect(onboardingGuestShowsScriptNames({ onboardingGuestShowScriptNames: false })).to.equal(false);
		expect(onboardingGuestShowsScriptNames({ onboardingGuestShowScriptNames: '' })).to.equal(false);
		expect(onboardingGuestShowsScriptNames({ onboardingGuestShowScriptNames: 1 })).to.equal(false);
	});

	it('lists script names in guest exports only when the flag is strictly true', () => {
		expect(onboardingGuestShowsScriptNames({ onboardingGuestShowScriptNames: true })).to.equal(true);
	});
});

describe('quickStartGuide', () => {
	it('sliceQuickStartForOnboarding shortens lists for guest quick start', () => {
		const full = {
			hasContent: true,
			systemItems: [
				{ kind: 'roomCount', n: 5 },
				{ kind: 'function', name: 'A', memberCount: 1 },
				{ kind: 'function', name: 'B', memberCount: 2 },
				{ kind: 'function', name: 'C', memberCount: 3 },
				{ kind: 'script', name: 's', desc: 'line' },
			],
			roomGuides: Array.from({ length: 6 }, (_, i) => ({
				name: `R${i}`,
				deviceCount: 10 - i,
				highlights: [{ deviceName: 'd1' }, { deviceName: 'd2' }, { deviceName: 'd3' }],
			})),
		};
		const g = sliceQuickStartForOnboarding(full);
		expect(g.systemItems.length).to.equal(3);
		expect(g.roomGuides.length).to.equal(4);
		expect(g.roomGuides[0].highlights.length).to.equal(2);
		expect(g.hasContent).to.equal(true);
	});

	it('sliceQuickStartForOnboarding returns empty when source has no content', () => {
		expect(sliceQuickStartForOnboarding(null)).to.deep.equal({
			hasContent: false,
			systemItems: [],
			roomGuides: [],
		});
	});

	it('buildQuickStartGuide orders script snapshot lines by description length (longer first)', () => {
		const roomsBlock = { totalRooms: 0, functions: [], rooms: [] };
		const scriptsBlock = {
			scripts: [
				{ enabled: true, name: 'zzz', id: 'zzz', desc: 'Short.', triggerType: 'unknown' },
				{ enabled: true, name: 'aaa', id: 'aaa', desc: 'A longer first-line description for quick start.', triggerType: 'unknown' },
				{ enabled: true, name: 'mid', id: 'mid', desc: 'Medium length here.', triggerType: 'unknown' },
			],
		};
		const g = buildQuickStartGuide(roomsBlock, scriptsBlock);
		const scriptItems = (g.systemItems || []).filter(i => i.kind === 'script');
		expect(scriptItems.map(i => i.name)).to.deep.equal(['aaa', 'mid', 'zzz']);
	});

	it('buildQuickStartGuide script order tie-breaks by name when first-line desc length matches', () => {
		const roomsBlock = { totalRooms: 0, functions: [], rooms: [] };
		const scriptsBlock = {
			scripts: [
				{ enabled: true, name: 'b', id: 'b', desc: 'Same\nignored second line', triggerType: 'schedule' },
				{ enabled: true, name: 'a', id: 'a', desc: 'Same', triggerType: 'subscribe' },
			],
		};
		const g = buildQuickStartGuide(roomsBlock, scriptsBlock);
		const scriptItems = (g.systemItems || []).filter(i => i.kind === 'script');
		expect(scriptItems.map(i => i.name)).to.deep.equal(['b', 'a']);
	});

	it('buildQuickStartGuide tie-breaks equal desc length by triggerType rank before name', () => {
		const roomsBlock = { totalRooms: 0, functions: [], rooms: [] };
		const scriptsBlock = {
			scripts: [
				{ enabled: true, name: 'z', id: 'z', desc: 'Dup', triggerType: 'subscribe' },
				{ enabled: true, name: 'a', id: 'a', desc: 'Dup', triggerType: 'schedule' },
			],
		};
		const g = buildQuickStartGuide(roomsBlock, scriptsBlock);
		const scriptItems = (g.systemItems || []).filter(i => i.kind === 'script');
		expect(scriptItems.map(i => i.name)).to.deep.equal(['a', 'z']);
	});

	it('buildQuickStartGuide room highlights order by category relevance when no live values', () => {
		const roomsBlock = {
			totalRooms: 1,
			functions: [],
			rooms: [
				{
					name: 'Living',
					memberCount: 3,
					devices: [
						{ deviceName: 'Lamp', category: 'light', icon: '💡' },
						{ deviceName: 'Door', category: 'door', icon: '🚪' },
						{ deviceName: 'Window', category: 'window', icon: '🪟' },
					],
				},
			],
		};
		const g = buildQuickStartGuide(roomsBlock, { scripts: [] });
		expect(g.roomGuides).to.have.length(1);
		expect(g.roomGuides[0].highlights.map(h => h.deviceName)).to.deep.equal(['Door', 'Window', 'Lamp']);
	});

	it('buildQuickStartGuide room highlights prefer live values before category rank', () => {
		const roomsBlock = {
			totalRooms: 1,
			functions: [],
			rooms: [
				{
					name: 'Hall',
					memberCount: 3,
					devices: [
						{ deviceName: 'Door', category: 'door' },
						{ deviceName: 'Lamp', category: 'light', currentValue: 'on' },
						{ deviceName: 'Window', category: 'window' },
					],
				},
			],
		};
		const g = buildQuickStartGuide(roomsBlock, { scripts: [] });
		expect(g.roomGuides[0].highlights.map(h => h.deviceName)).to.deep.equal(['Lamp', 'Door', 'Window']);
	});

	it('buildQuickStartGuide room highlights sort picked list by relevance (same category, multiple live)', () => {
		const roomsBlock = {
			totalRooms: 1,
			functions: [],
			rooms: [
				{
					name: 'Hall',
					memberCount: 3,
					devices: [
						{ deviceName: 'Door B', category: 'door', currentValue: 'open' },
						{ deviceName: 'Win1', category: 'window' },
						{ deviceName: 'Door A', category: 'door', currentValue: 'closed' },
					],
				},
			],
		};
		const g = buildQuickStartGuide(roomsBlock, { scripts: [] });
		expect(g.roomGuides[0].highlights.map(h => h.deviceName)).to.deep.equal(['Door A', 'Door B', 'Win1']);
	});

	it('highlightCategoryRank maps blank or unknown categories to other rank bucket', () => {
		expect(highlightCategoryRank('   ')).to.equal(HIGHLIGHT_CATEGORY_RANK.other);
		expect(highlightCategoryRank('')).to.equal(HIGHLIGHT_CATEGORY_RANK.other);
		expect(highlightCategoryRank('madeUpCategory')).to.equal(HIGHLIGHT_CATEGORY_RANK.other);
		expect(highlightCategoryRank('door')).to.equal(0);
		expect(highlightCategoryRank('leak')).to.equal(2);
	});
});

describe('chapterConfigWarnings', () => {
	function collectWarns(fn) {
		const lines = [];
		const log = {
			warn(s) {
				lines.push(s);
			},
		};
		fn(log);
		return lines;
	}

	it('warns unknown chapter ids in user order JSON', () => {
		const lines = collectWarns(log =>
			warnChapterJsonLayout(log, { userChapterOrderJson: '["rooms","unknownIdXYZ"]' }),
		);
		expect(lines.some(l => l.includes('unknownIdXYZ') && l.includes('userChapterOrderJson'))).to.equal(true);
		expect(lines.some(l => l.includes(DOC_HELP_URL))).to.equal(true);
	});

	it('warns duplicate known ids in order JSON', () => {
		const lines = collectWarns(log =>
			warnChapterJsonLayout(log, { userChapterOrderJson: '["rooms","manual","rooms"]' }),
		);
		expect(lines.some(l => /duplicate.*\brooms\b/i.test(l) && l.includes('userChapterOrderJson'))).to.equal(
			true,
		);
	});

	it('warns invalid JSON for order field', () => {
		const lines = collectWarns(log => warnChapterJsonLayout(log, { adminChapterOrderJson: '{' }));
		expect(lines.some(l => /invalid JSON/i.test(l) && l.includes('adminChapterOrderJson'))).to.equal(true);
	});

	it('warns redundant duplicates in hide list', () => {
		const lines = collectWarns(log =>
			warnChapterJsonLayout(log, { userHiddenChaptersJson: '["scripts","scripts"]' }),
		);
		expect(lines.some(l => /duplicate id/i.test(l) && l.includes('userHiddenChaptersJson'))).to.equal(true);
	});

	it('warns unknown chapter ids when only legacy native key is set', () => {
		const lines = collectWarns(log =>
			warnChapterJsonLayout(log, { userChapterOrder: '["unknownLegacyOnly"]' }),
		);
		expect(
			lines.some(
				l => l.includes('unknownLegacyOnly') && l.includes('userChapterOrderJson via native userChapterOrder'),
			),
		).to.equal(true);
	});

	it('does not repeat identical warning lines for the same logger', () => {
		const lines = [];
		const log = {
			warn(s) {
				lines.push(s);
			},
		};
		const bad = { userChapterOrderJson: '["sameUnknown"]' };
		warnChapterJsonLayout(log, bad);
		warnChapterJsonLayout(log, bad);
		expect(lines.filter(l => l.includes('sameUnknown')).length).to.equal(1);
	});

	it('emits separate lines when the ignored id set changes for the same logger', () => {
		const lines = [];
		const log = {
			warn(s) {
				lines.push(s);
			},
		};
		warnChapterJsonLayout(log, { userChapterOrderJson: '["firstX"]' });
		warnChapterJsonLayout(log, { userChapterOrderJson: '["secondY"]' });
		expect(lines.length).to.equal(2);
		expect(lines.some(l => l.includes('firstX'))).to.equal(true);
		expect(lines.some(l => l.includes('secondY'))).to.equal(true);
	});

	it('classifyChapterOrderTokens finds unknown and duplicate allowed ids', () => {
		const allowed = new Set(['a', 'b']);
		const { unknown, duplicateAllowed } = classifyChapterOrderTokens(['a', 'x', 'b', 'a'], allowed);
		expect([...unknown].sort()).to.deep.equal(['x']);
		expect([...duplicateAllowed].sort()).to.deep.equal(['a']);
	});
});
