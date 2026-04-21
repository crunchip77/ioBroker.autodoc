/**
 * Plaintext "system card" for forum posts — shared by Admin HTML copy button and jsonConfig sendTo.
 *
 * @param {object} docModel Document model (same shape as htmlRenderer diagnosis)
 * @param {import('./i18n')} i18n
 * @returns {{ forumData: object, plaintext: string }}
 */
function buildForumCard(docModel, i18n) {
	const system = docModel.system;
	const stats = system.statistics;
	const appendices = docModel.appendices;
	const primaryHostName = system.primaryHost.name;
	const hostRes = (system.hostResources || {})[primaryHostName] || {};

	let ramForumText = '—';
	if (hostRes.sysTotalMb && hostRes.sysFreeMb !== null) {
		const usedMb = hostRes.sysTotalMb - hostRes.sysFreeMb;
		ramForumText = `${usedMb} / ${hostRes.sysTotalMb} MB`;
	} else if (hostRes.adapterTotalMb) {
		ramForumText = `~${hostRes.adapterTotalMb} MB (${i18n.t('allAdapters') || 'all adapters'})`;
	} else if (hostRes.procMb) {
		ramForumText = `~${hostRes.procMb} MB (js-controller)`;
	}
	const cpuVal = hostRes.cpu !== null && hostRes.cpu !== undefined ? `${hostRes.cpu} %` : null;

	const activeRepo = (system.location && system.location.activeRepo) || '';

	const instancesStr = `${stats.instanceCount} (${stats.enabledInstanceCount} ${i18n.t('diagActive')}, ${stats.disabledInstanceCount} ${i18n.t('diagInactive')})`;
	const stateObjectsStr = `${appendices.stateSummary.total} (${appendices.stateSummary.writable} ${i18n.t('writable')}, ${appendices.stateSummary.readonly} ${i18n.t('readOnlyStates')})`;

	const forumData = {
		instances: instancesStr,
		stateObjects: stateObjectsStr,
		platform: system.primaryHost.platform,
		jsController: system.primaryHost.version,
		nodejs: system.primaryHost.nodeVersion || '—',
		npm: system.primaryHost.npmVersion || '—',
		ram: ramForumText,
		cpu: cpuVal || '—',
		host: primaryHostName,
		repo: activeRepo || '—',
	};

	const fence = '```';
	const lines = [
		fence,
		`${i18n.t('instancesDetected')}:    ${forumData.instances}`,
		`${i18n.t('stateObjectsScanned')}:    ${forumData.stateObjects}`,
		`${i18n.t('platform')}:             ${forumData.platform}`,
		`${i18n.t('jsControllerVersion')}:         ${forumData.jsController}`,
		`${i18n.t('nodeVersion')}:               ${forumData.nodejs}`,
		`${i18n.t('npmVersion')}:                   ${forumData.npm}`,
		`RAM:                   ${forumData.ram}`,
		`CPU:                   ${forumData.cpu}`,
		`${i18n.t('hosts')}:                  ${forumData.host}`,
		`${i18n.t('activeRepo') || 'Repository'}:            ${forumData.repo}`,
		fence,
	];

	return {
		forumData,
		plaintext: lines.join('\n'),
	};
}

module.exports = {
	buildForumCard,
};
