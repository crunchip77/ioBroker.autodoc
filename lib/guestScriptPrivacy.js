'use strict';

/**
 * Onboarding = guest view: whether to list internal JavaScript script file names
 * (default: **false** = privacy & less arbitrary “top N” lists).
 *
 * @param {object} config Adapter instance config (`native` merged).
 * @returns {boolean} True when guest exports should list script file names (legacy).
 */
function onboardingGuestShowsScriptNames(config) {
	return !!(config && config.onboardingGuestShowScriptNames === true);
}

module.exports = { onboardingGuestShowsScriptNames };
