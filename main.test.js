'use strict';

const { expect } = require('chai');
const { onboardingGuestShowsScriptNames } = require('./lib/guestScriptPrivacy');
const { sliceQuickStartForOnboarding } = require('./lib/quickStartGuide');

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
});
