/**
 * Group JavaScript adapter scripts by folder path (from script.js.* object id).
 * Used for HTML/Markdown export: same ordering as in ioBroker Admin tree.
 */
'use strict';

/**
 * @param {string|null|undefined} folder Folder segment from script id (e.g. "global", "Wohnung/Licht")
 * @returns {string} Internal map key (__root__ for scripts directly under script.js.)
 */
function folderStorageKey(folder) {
	return folder == null || folder === '' ? '__root__' : folder;
}

/**
 * @param {string} key folderStorageKey result
 * @returns {boolean} true if the folder is the global script tree
 */
function isGlobalFolderKey(key) {
	return key === 'global' || key.startsWith('global/');
}

/**
 * @param {string} a - first folder key
 * @param {string} b - second folder key
 * @returns {number} localeCompare-style sort delta
 */
function compareFolderStorageKeys(a, b) {
	const rank = key => {
		if (key === 'global' || key.startsWith('global/')) {
			return 0;
		}
		if (key === 'common' || key.startsWith('common/')) {
			return 1;
		}
		if (key === '__root__') {
			return 9;
		}
		return 5;
	};
	const ra = rank(a);
	const rb = rank(b);
	if (ra !== rb) {
		return ra - rb;
	}
	return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' });
}

/**
 * @param {Array<{ folder?: string|null, name?: string }>} scripts - flat script list from discovery
 * @returns {Array<{ folderKey: string, folder: string|null, scripts: object[] }>} groups for export ordering
 */
function groupScriptsByFolder(scripts) {
	const map = new Map();
	for (const s of scripts) {
		const key = folderStorageKey(s.folder);
		if (!map.has(key)) {
			map.set(key, []);
		}
		map.get(key).push(s);
	}
	const sortedKeys = [...map.keys()].sort(compareFolderStorageKeys);
	return sortedKeys.map(key => ({
		folderKey: key,
		folder: key === '__root__' ? null : key,
		scripts: map
			.get(key)
			.sort((a, b) =>
				String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' }),
			),
	}));
}

module.exports = {
	groupScriptsByFolder,
	isGlobalFolderKey,
	folderStorageKey,
};
