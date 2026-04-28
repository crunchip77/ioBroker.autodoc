'use strict';

const { expect } = require('chai');
const { onboardingGuestShowsScriptNames } = require('./lib/guestScriptPrivacy');

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
