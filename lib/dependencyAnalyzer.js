/**
 * AutoDoc Dependency Analyzer
 * Extracts ioBroker state references from JavaScript/Blockly script source code.
 */

// Functions that receive a state ID as their first argument
const STATE_FUNCTIONS = [
	'getState',
	'getStateAsync',
	'setState',
	'setStateAsync',
	'createState',
	'createStateAsync',
	'deleteState',
	'deleteStateAsync',
	'existsState',
	'getObject',
	'getObjectAsync',
	'setObject',
	'setObjectAsync',
	'subscribeStates',
	'unsubscribeStates',
	'on',
	'subscribe',
];

// Regex: capture the first string argument of the above functions
// Handles single quotes, double quotes and backticks (static strings only)
const FUNC_PATTERN = new RegExp(`(?:${STATE_FUNCTIONS.join('|')})\\s*\\(\\s*(['"\`])([^'"\`\\n]{3,80})\\1`, 'g');

// A valid ioBroker state ID contains at least one dot-separated numeric segment
// e.g. hm-rpc.0.ABC123.STATE or javascript.0.myVar
const STATE_ID_RE = /^[a-zA-Z0-9_-]+\.\d+\.[a-zA-Z0-9_.%-]+$/;

/**
 * Extract all likely state IDs referenced in a script source string.
 *
 * @param {string} source JavaScript source code
 * @returns {string[]} Deduplicated, sorted list of referenced state IDs
 */
function extractStateRefs(source) {
	if (!source) {
		return [];
	}

	const found = new Set();
	let match;

	FUNC_PATTERN.lastIndex = 0;
	while ((match = FUNC_PATTERN.exec(source)) !== null) {
		const candidate = match[2].trim();
		if (STATE_ID_RE.test(candidate)) {
			found.add(candidate);
		}
	}

	return [...found].sort();
}

/**
 * Build a cross-reference map: stateId → list of script names that reference it.
 *
 * @param {Array<{name: string, stateRefs: string[]}>} scripts Scripts with stateRefs
 * @returns {Array<{stateId: string, scripts: string[]}>} Sorted cross-reference entries
 */
function buildCrossRef(scripts) {
	const map = new Map();

	for (const script of scripts) {
		for (const stateId of script.stateRefs) {
			if (!map.has(stateId)) {
				map.set(stateId, []);
			}
			map.get(stateId).push(script.name);
		}
	}

	return [...map.entries()]
		.map(([stateId, scriptNames]) => ({ stateId, scripts: scriptNames }))
		.sort((a, b) => a.stateId.localeCompare(b.stateId));
}

module.exports = { extractStateRefs, buildCrossRef };
