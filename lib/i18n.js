/**
 * Internationalization (i18n) Module
 * Manages translations for different languages
 */

const translations = {
	en: {
		// Headers and Titles
		projectDocumentation: name => `${name} Documentation`,
		generated: 'Generated',
		profile: 'Profile',
		system: 'System',
		trigger: 'Trigger',

		// Table of Contents
		tableOfContents: 'Table of Contents',
		systemOverview: 'System Overview',
		adapterInstances: 'Adapter Instances',
		manualInformation: 'Manual Information',
		changelog: 'Changelog',
		appendices: 'Appendices',

		// System Chapter
		projectInformation: 'Project Information',
		projectName: 'Project Name',
		targetSystem: 'Target System',
		primaryHost: 'Primary Host',
		name: 'Name',
		platform: 'Platform',
		hostRuntimePlatform: 'Runtime (ioBroker host)',
		operatingSystem: 'Operating system',
		version: 'Version',
		systemStatistics: 'System Statistics',
		totalAdapterInstances: 'Total Adapter Instances',
		enabledInstances: 'Enabled Instances',
		disabledInstances: 'Disabled Instances',
		totalStateObjects: 'Total State Objects',
		writableStates: 'Writable States',
		readOnlyStates: 'Read-only States',
		hosts: 'Hosts',

		// Rooms Chapter
		roomsAndFunctions: 'Rooms & Functions',
		rooms: 'Rooms',
		functions: 'Functions',
		totalRooms: 'Total Rooms',
		totalFunctions: 'Total Functions',
		memberCount: 'Devices / Datapoints',
		noRoomsDefined: 'No rooms defined yet.',

		// Scripts Chapter
		scripts: 'Scripts',
		totalScripts: 'Total Scripts',
		enabledScripts: 'Active Scripts',
		disabledScripts: 'Inactive Scripts',
		scriptName: 'Name',
		scriptFolder: 'Folder',
		scriptFolderRoot: 'Root',
		scriptFolderCommon: 'General Scripts',
		scriptFolderGlobal: 'Global Scripts',
		scriptsByFolderIntro:
			'Scripts are grouped by folder (same as in ioBroker). The “Global scripts” folder runs before other scripts — only helpers belong there, not regular automations.',
		scriptsGlobalFolderHint:
			'Global scripts run on every restart before other scripts. Use this folder only for shared functions/constants — not for normal room or device logic (otherwise behaviour becomes hard to predict).',
		scriptStatus: 'Status',
		scriptTrigger: 'Trigger',
		scriptDescription: 'Group-purpose text (common.desc — ioBroker: mainly for global scripts)',
		scriptEngineInstance: 'Script engine (common.engine)',
		scheduleTypeObjects: 'Schedule objects',
		scheduleTypeObjectsIntro:
			'Objects from getObjectView(system, schedule) — ioBroker type «schedule» (e.g. calendar-style entries). This is separate from script.js automations and from adapter instances that use run mode «schedule».',
		instanceRunMode: 'Run mode',
		instanceScheduleCron: 'Instance CRON (mode schedule)',
		instanceRestartCron: 'Daemon restart CRON',
		noScriptsDefined: 'No scripts found (script adapter may not be installed).',
		scriptAiSummary: 'AI explanation (from script source)',
		automationOverviewAi: 'Automations in this home (AI overview)',
		active: 'active',
		inactive: 'inactive',

		// Maintenance chapter (Admin): checklist + disabled-instance inventory. Technical "Diagnosis" is a separate chapter.
		maintenance: 'Maintenance & documentation setup',
		maintenanceChecklist: 'Setup checklist (documentation)',
		documentationScore: 'Overall score',
		instancesWithoutRoom: 'Active instances not assigned to any room',
		checklistProjectNarrative:
			'Project description (“My documentation”) meets the configured minimum length (Adapter → Advanced). Clear sentences help readers and exports.',
		checklistBaseUrlUnset:
			'ioBroker base URL set under Adapter → Advanced — required for QR codes and bookmark links to work from other devices or networks.',
		disabledInstancesHint: 'Disabled instances',
		disabledInstancesInventoryNote: n =>
			`${n} adapter instance(s) are disabled — listed below for reference. That is common and intentional; it does not affect the documentation setup score.`,
		maintenanceChecklistDisabled:
			'No checklist rows are enabled under Adapter → Advanced (documentation setup score). The percentage stays at 100% until at least one check is turned on.',
		allGood: 'All checks pass — documentation is in good shape.',
		checkOk: 'OK',
		checkIssue: 'Needs attention',
		scoreDimData: 'Data collection',
		scoreDimDataDesc: 'Did autodoc successfully read all system data?',
		scoreDimManual: 'Manual content',
		scoreDimManualDesc: 'Has the user filled in their own texts and settings?',
		scoreDimDepth: 'Documentation depth',
		scoreDimDepthDesc: 'Does the documentation go beyond a raw list of data points?',
		checkHostsFound: 'ioBroker hosts readable',
		checkInstancesFound: 'Enabled adapter instances found',
		checkRoomsDefined: 'Rooms / enums configured in ioBroker',
		checkContactSet: 'Contact person filled in (My documentation)',
		checkCustomContent: 'Custom texts provided (notes, tips, room/adapter descriptions)',
		checkHasDiagram: 'Network diagram available (manual or auto host topology)',
		checkRoomsHaveDevices: 'At least one room has device state assignments',
		checkHasCustomSections: 'At least one custom documentation chapter has content',
		checkAiConfigured: 'AI provider configured for script descriptions (optional — skipped when no scripts)',
		checkInstancesWithoutRoomInfo: 'Active instances not assigned to any room (informational)',

		// Adapters Chapter
		overview: 'Overview',
		totalAdapters: 'Total Adapters',
		totalInstances: 'Total Instances',
		adapterDetails: 'Adapter Details',
		instanceDetails: 'Instance Details',
		enabledShort: 'active',
		adapters: 'Adapters',
		enabled: 'enabled',
		disabled: 'disabled',
		description: 'Description',
		noAdaptersMatch: 'No adapters match your filter.',
		adapterRunsAutomatically: 'Runs automatically — no action needed',
		adapterCurrentlyInactive: 'Currently inactive',
		adapterActive: 'Active',
		adapterInactive: 'Inactive',
		// Adapter meta badges
		connTypeLocal: '🔌 Local',
		connTypeCloud: '☁️ Cloud',
		dataPush: 'Push',
		dataPoll: 'Polling',
		dataAssumption: 'Assumption',
		tierStable: 'Stable',
		tierTested: 'Tested',
		tierExperimental: 'Experimental',

		// Manual Context
		contact: 'Contact',
		additionalNotes: 'Additional Notes',

		// Quick Start
		quickStart: 'Quick Start',
		quickStartWelcome: "Welcome to your ioBroker documentation! Here's what you need to know:",
		quickStartStructuredIntro:
			'Below is a short overview from your installation — what runs where, and a few highlights per room (when devices are assigned to rooms).',
		qsSystemTitle: 'Setup snapshot',
		qsRoomGuidesTitle: 'Room highlights',
		qsRoomCount: n => `${n} room(s) with devices`,
		qsFunctionRow: (name, n) => `Function area «${name}» — ${n} device(s)`,
		qsScriptRow: (name, desc) => `Automation «${name}»: ${desc}`,
		atAGlanceTitle: 'Quick overview',
		atAGlanceIntro:
			'Resident snapshot: more rooms and highlights here than in the guest quick start (same discovery data).',
		qsSeeFullRoomsBefore: 'The full room-by-room list is in ',
		qsSeeFullRoomsAfter: ' below.',
		qsRoomCardDevices: n => `${n} device(s)`,
		activeAdapters: 'Active Adapters',
		nextSteps: 'Next Steps',
		nextStepsReview: 'Review your installed adapters below',
		nextStepsManual: 'Check the manual information section for guidance',
		nextStepsAdapters: 'Most adapters run automatically — no configuration needed',
		nextStepsOnboarding1:
			'Use the sections further down on this page for a short walk-through (rooms, what runs in the background, and contact or notes if your host added any).',
		nextStepsOnboarding2:
			'Contact, household notes, and emergency hints show up in the right sections if your host entered them in “My documentation”.',
		nextStepsOnboarding3:
			'You do not need to change system settings as a guest — the household owner manages ioBroker.',
		onboardingAutomationsOmitted: n =>
			`Another ${n} background script(s) are running. They are not all listed in this guest view — the full list is in the technical (admin) documentation.`,
		onboardingAutomationsSummaryBody: n =>
			`${n} enabled JavaScript automation(s) run in the background — you do not need to do anything. Internal script file names are not listed in this guest view (names can be personal or technical). The full list and object IDs are in the Admin documentation profile.`,

		// Rooms / Functions filter
		members: 'Members',
		noRoomsMatch: 'No rooms match your filter.',
		noFunctionsMatch: 'No functions match your filter.',

		// Scripts filter & dependency analysis
		noScriptsMatch: 'No scripts match your filter.',
		stateReferences: 'State References',
		stateReferencesDesc:
			'States referenced by scripts (static analysis of source). The right-hand column shows the optional script object field common.desc (ioBroker schema: “group purpose description”), same as in the script list; “—” if empty.',
		script: 'Script',
		referencedStates: 'Referenced States',
		sharedStates: 'Shared States',
		sharedStatesDesc: 'States used by more than one script.',
		stateId: 'State ID',
		usedByScripts: 'Used by Scripts',
		noSharedStatesMatch: 'No shared states match your filter.',
		stateReferencesExpandSummary: (scriptCount, refCount) =>
			`Show state-reference tables — ${scriptCount} script(s), ${refCount} reference(s) (collapsed by default)`,
		sharedStatesExpandSummary: n =>
			`Show shared-state table — ${n} state(s) used by multiple scripts (collapsed by default)`,
		userdataExpandSummary: (itemCount, groupCount) =>
			`Show all userdata datapoints — ${itemCount} in ${groupCount} group(s) (collapsed by default)`,
		aliasesExpandSummary: (itemCount, groupCount) =>
			`Show all aliases — ${itemCount} in ${groupCount} group(s) (collapsed by default)`,

		// Diagnosis section (snapshot for documentation — not a full-system audit)
		diagnosis: 'Diagnosis',
		diagnosisChapterIntro:
			'This chapter reflects a snapshot from when this documentation was built: counts and host facts autodoc read from the ioBroker object database for this export. It is not a full health, security, or connectivity audit of your installation.',
		diagScanStatus: 'Snapshot (this export)',
		diagActive: 'active',
		diagInactive: 'inactive',
		diagWhereToLook: 'Where to look',
		diagWhatLabel: 'What',
		diagWhereLabel: 'Where',
		diagLogsLabel: 'Adapter logs',
		diagLogsValue: 'Admin UI → "Log" tab → filter by adapter name',
		diagAliveLabel: 'Adapter process running?',
		diagAliveHint: '(true = process running, false = crashed or stopped)',
		diagConnectedLabel: 'Adapter connected to device/service?',
		diagConnectedHint: '(true = connection established)',
		diagFindings: 'Automated checks in this export',
		diagAutomatedChecksIntro:
			'Only a few rules are evaluated while building this page (today: Node.js major vs a simple LTS heuristic). Passing them does not mean the system is “error-free”.',
		diagNodeCheckOk:
			'Node.js {0} — no flag from that rule (typically major ≥ 20, even major = LTS track). Does not replace checking adapters or the Admin log.',
		diagNodeVersionMissing: 'Node.js version not available in this snapshot — that rule was skipped.',
		diagMaintenanceReminders: 'General reminders',
		diagMaintenanceRemindersIntro: 'Standing maintenance tips — not faults detected by autodoc.',
		diagFindingDisabled: n =>
			`${n} adapter instance(s) are disabled — informational only (often intentional; see the maintenance & documentation setup chapter)`,
		diagFindingNone: 'No automated flags from this export’s rules (besides the items above).',
		// Operational reference (Admin HTML + exports): typical checks — not “errors detected”
		troubleshooting: 'Operational reference',
		troubleshootingGenericDisclaimer:
			'Standard part of this system documentation: typical checks and common issues — not an automated fault report. Nothing below is verified live against your installation; use it as a checklist and confirm in Admin (log, states, files).',
		tsAdapterNotStarting: 'Adapter does not start',
		tsAdapterNotStartingSymptom: 'Symptom: alive = false, adapter keeps restarting',
		tsAdapterNotStarting1: 'Check the Log tab for error messages from this adapter',
		tsAdapterNotStarting2: 'Common causes: wrong IP/port/hostname, missing credentials, port already in use',
		tsAdapterNotStarting3: 'Disable the adapter, fix the configuration, then re-enable',
		tsAdapterNotConnected: 'Adapter running but not connected to device/service',
		tsAdapterNotConnectedSymptom: 'Symptom: alive = true, connected = false, no state updates',
		tsAdapterNotConnected1: 'Network: is the device reachable? (ping, browser)',
		tsAdapterNotConnected2: 'Credentials: correct API key, password or token?',
		tsAdapterNotConnected3: 'Push adapter: is the inbound port open in the firewall?',
		tsScriptNotRunning: 'Script does not run',
		tsScriptNotRunningSymptom: 'Symptom: no state changes, no log output from the script',
		tsScriptNotRunning1: 'Is the script enabled? (green dot in the script editor)',
		tsScriptNotRunning2: 'Is the javascript adapter active?',
		tsScriptNotRunning2Warn: 'javascript adapter is NOT active — scripts cannot run without it',
		tsScriptNotRunning3: 'Check script log in the Log tab (filter: "javascript")',
		tsDocNotGenerated: 'Documentation does not start by itself (no automatic triggers)',
		tsDocNotGeneratedSymptom:
			'You see no new files under /files/autodoc.<instance>/ and no useful documentation state updates, but you expect an automatic run.',
		tsDocNotGenerated1: 'Is the autodoc adapter instance running?',
		tsDocNotGenerated2:
			'In Basic settings, turn on at least one automatic trigger: generate on adapter start, generate on adapter changes, and/or set schedule interval (hours) to a value greater than 0. This subsection appears only when all three are off at export time — then nothing will start on its own until you change that.',
		tsDocNotGenerated3: 'Trigger manually: set autodoc.0.action.generate = true',
		collectorStatus: 'Collector Status',
		instancesDetected: 'Instances detected',
		stateObjectsScanned: 'State objects (read for documentation)',
		nodeVersion: 'Node Version',
		npmVersion: 'npm Version',
		npmVersionHint: 'From host report or local npm on the instance host if not in object database.',
		jsControllerVersion: 'js-controller Version',
		osKernel: 'OS / Kernel',
		osArch: 'Architecture',
		nodeVersionOutdated: 'Node.js {0} — version below recommended LTS (v20+). Upgrade recommended.',
		nodeVersionOk: 'Node.js {0} — LTS ✓',
		osUpdateHint: 'Keep the operating system up to date with security patches.',

		// AI section
		aiSummary: 'AI Summary',

		// Search / filter UI
		filterPlaceholder: 'Filter...',
		searchPlaceholder: 'Search… (Enter = next)',
		adapterFilterPlaceholder: 'Filter adapters…',
		adapterFilterHint: 'Filter by name, description, Stable/Tested/Experimental, Local/Cloud, Push/Poll',
		disabledAdaptersGroup: '{0} disabled instances — show',
		scriptFilterPlaceholder: 'Filter scripts…',
		scriptFilterHint: 'Filter by name, group-purpose (common.desc), trigger type or folder',
		disabledScriptsGroup: '{0} inactive scripts — show',

		// Appendices
		stateObjectsSummary: 'State Objects Summary',
		total: 'Total',
		writable: 'Writable',
		readOnly: 'Read-only',
		collectionInformation: 'Collection Information',
		collectedAt: 'Collected at',
		schemaVersion: 'Schema Version',
		generatedBy: 'Generated by ioBroker.autodoc v',

		// Role categories
		catLight: 'Light',
		catDimmer: 'Dimmer',
		catBlind: 'Shutters',
		catThermostat: 'Climate',
		catHumidity: 'Humidity',
		catMotion: 'Motion',
		catDoor: 'Door',
		catWindow: 'Window',
		catAlarm: 'Alarm',
		catLock: 'Lock',
		catSwitch: 'Switch',
		catMedia: 'Media',
		catCamera: 'Camera',
		catPower: 'Power',
		catOther: 'Device',

		// Phase 4 — Profile redesign
		deviceHierarchy: 'Device Hierarchy',
		category: 'Category',
		noDevicesInRoom: 'No devices assigned to this room.',
		automations: 'Automations',
		connectedSystems: 'Connected Systems',
		yourRooms: 'Your Rooms',
		tipsAndNotes: 'Tips & Notes',
		whatCanBeControlled: 'What can be controlled:',
		whatRunsAutomatically: 'What runs automatically? (script engine / JavaScript)',
		automationsIntro:
			'These flows come from enabled JavaScript scripts in ioBroker — they run in the background; you do not need to do anything:',
		noActiveScripts:
			'No enabled JavaScript scripts found here. Blockly, other rule engines, or automations inside other adapters are not listed in this section yet.',
		roomsHiddenHint: '{0} room(s) hidden by configuration.',
		adaptersHiddenHint: '{0} adapter(s) hidden by configuration.',
		moreScripts: '{0} more scripts (no description)',
		moreChanges: 'changes',
		olderEntries: '{0} older entries',
		changelogChange_instance_count: 'Adapter instances',
		changelogChange_enabled_instances: 'Enabled instances',
		changelogChange_state_objects: 'State objects',
		changelogChange_project_name: 'Project name',
		changelogChange_adapter_version: 'Adapter update',
		changelogMsgAdapterVersion: (title, id, prev, curr) =>
			`Adapter "${title}" (${id}): ${prev || '?'} → ${curr || '?'}`,
		docChangeSinceLastTitle: 'Changes since last run',
		docChangeSinceLastNote:
			'Compared to the previous AutoDoc snapshot (inventory-level metrics only — not full automation logic).',
		docChangeSummaryInitial:
			'First documentation run for this AutoDoc instance — there is no previous snapshot to compare yet.',
		docChangeSummaryNone: 'No significant inventory changes compared to the previous snapshot.',
		changelogSummaryChangesDetected: n =>
			n === 1
				? '1 inventory change detected compared to the previous snapshot.'
				: `${n} inventory changes detected compared to the previous snapshot.`,
		docChangeSummaryCount: n =>
			n === 1 ? '1 change compared to the previous snapshot:' : `${n} changes compared to the previous snapshot:`,
		userDocChangeSinceLastPlain:
			'Since this documentation was last saved for your home, something changed on your ioBroker server (for example an adapter update). The sections below describe how everything works now.',
		docTransparencyLimitsShort:
			'This documentation shows what AutoDoc can derive from ioBroker. Firmware behaviour, vendor clouds, rule engines AutoDoc does not connect to, Blockly internals, and automation outside captured sources may be incomplete or absent.',
		changelogTruncated: 'Showing 10 of {0} changelog entries.',
		onboardingWelcome: name => `Welcome to ${name}`,
		onboardingWelcomeCity: (name, city) => `Welcome to ${name} — ${city}`,
		onboardingIntro: 'This document explains how your smart home works.',
		guestHelpTitle: 'Help & emergencies',
		customDocSectionsTitle: 'Custom sections',
		homeRoutinesTitle: 'Routines in your own words',
		homeRoutinesIntro: 'From the people who live here — not auto-generated from scripts.',
		ownerPlaybookTitle: 'How we run this home',
		ownerPlaybookIntro:
			'Your playbook — typical order, must-dos, and things not to change. Written by the household; not generated automatically.',
		mermaidDiagramTitle: 'Layout diagram (Mermaid)',
		mermaidDiagramIntro:
			'Diagram from your documentation settings (Mermaid). Exported HTML embeds SVG when the optional @mermaid-js/mermaid-cli package is installed; otherwise the browser loads Mermaid from jsDelivr. Markdown keeps the source for Mermaid-capable viewers. Tip: use flowchart LR (left-to-right) if a vertical chain wastes space.',
		mermaidAutoTopologyTitle: 'Host topology (auto-generated)',
		mermaidAutoTopologyMdHint: 'Auto-topology is only available in the HTML export (Admin profile).',
		mermaidAutoTopologyIntro:
			'Adapter instances grouped by ioBroker host, with a fixed maximum number of nodes for readability. Layout is left-to-right to use page width. This is not a full wiring or dependency graph. Hide with chapter id mermaid (same as your own Mermaid diagram).',
		troubleshootPublicLinksIntro:
			'These pages refresh when documentation is regenerated — save or share the links that match who reads them.',
		troubleshootPublicLinksHeading: 'Bookmark links',
		troubleshootLinkAdmin: 'Technical documentation (admin view)',
		troubleshootLinkUser: 'Family / everyday documentation',
		troubleshootLinkOnboarding: 'Guest & simple view',
		troubleshootQuickFactsTitle: 'At a glance',
		troubleshootWifiLabel: 'Wi‑Fi / network',
		troubleshootPowerLabel: 'Power / fuses',
		troubleshootWaterLabel: 'Water shutoff',
		troubleshootExtraLabel: 'Other',
		troubleshootSnapshotDisclaimer:
			'Snapshot from when this page was generated — not live monitoring. Technical detail for whoever maintains the system.',
		troubleshootSnapshotNodeTitle: 'Server software may need an update',
		troubleshootSnapshotNodeStep1:
			'Ask the person who maintains this smart home (or your host provider) to review the software version.',
		troubleshootSnapshotNodeStep2:
			'They can follow the official ioBroker / Node.js long-term support guidance for upgrades — this page cannot perform updates.',
		troubleshootSnapshotNodeStep3:
			'Until upgraded, things may still work; staying on an older or non-LTS version can mean missing security fixes.',
		onboardingHintTitle: 'Tip: Make this page even better!',
		onboardingHintText:
			'Add a description and house notes in the adapter settings (Manual Context) so that guests and family members get a personal introduction.',
		scanToShare: 'Share this page',
		copyLink: 'Copy link',
		copied: 'Copied!',
		devices: 'Devices',
		darkMode: 'Dark Mode',
		lightMode: 'Light Mode',
		adaptersActive: 'active',
		staleDocsWarning: 'This documentation might be outdated.',
		staleDocsWeek: 'Documentation is older than 7 days.',
		staleDocsOld: 'Documentation is older than 30 days — please regenerate.',
		pendingUpdates: 'Updates available',
		lastBackup: 'Last Backup',
		today: 'today',
		yesterday: 'yesterday',
		location: 'Location',
		city: 'Location',
		timezone: 'Timezone',
		tempUnit: 'Temperature unit',
		uptime: 'Uptime',
		type: 'Type',
		value: 'Value',
		userDefinedVariables: 'Custom Variables',
		userDataDesc: 'Datapoints under 0_userdata.0 — user-created variables and values.',
		aliases: 'Aliases',
		aliasesDesc: 'Aliases make foreign datapoints accessible under a custom name (alias.0.*).',
		aliasTarget: 'Target',
		scoreDesc:
			'Three separate scores show **how completely** autodoc ran, **what content** you provided, and **how deep** the documentation is. The overall score is the average of the three.',
		totalSuffix: 'total',
		ramSystemTooltip: 'Used / total system RAM',
		ramAdapterTooltip: 'Sum of all ioBroker processes (js-controller + all adapter instances)',
		ramHostTooltip: 'ioBroker host process only (js-controller). Adapter instances run as separate processes.',
		allAdapters: 'all adapters',
		scriptHasScheduleTitle: 'Scheduled script (cron)',
		noNotesYet: 'No special notes have been added for this smart home yet. Feel free to look around!',
		onboardingSetupHint:
			'Tip for administrators: add a project description, contact person and notes in the adapter settings → "My Documentation".',
		onboardingCapabilities: 'What can this Smart Home do?',
		onboardingCapabilitiesDesc: 'These areas are set up and controllable in your smart home:',
		justNow: 'just now',
		minutesAgo: 'min. ago',
		hoursAgo: 'hrs. ago',
		daysAgo: 'days ago',
		cronEvery: 'every',
		cronDaily: 'daily',
		cronHourly: 'hourly',
		cronAt: 'at',
		cronMon: 'Mon',
		cronTue: 'Tue',
		cronWed: 'Wed',
		cronThu: 'Thu',
		cronFri: 'Fri',
		cronSat: 'Sat',
		cronSun: 'Sun',
		availableFunctions: 'Controllable areas throughout the house:',
		showFunctions: 'Show functions',
		processOnly: 'process',
		searchPrev: 'Previous match',
		searchNext: 'Next match',
		searchHint: '↑↓ navigate · Esc = clear',
		activeRepo: 'Repository',
	},
	de: {
		// Headers and Titles
		projectDocumentation: name => `${name} Dokumentation`,
		generated: 'Generiert',
		profile: 'Profil',
		system: 'System',
		trigger: 'Auslöser',

		// Table of Contents
		tableOfContents: 'Inhaltsverzeichnis',
		systemOverview: 'Systemübersicht',
		adapterInstances: 'Adapter-Instanzen',
		manualInformation: 'Manuelle Informationen',
		changelog: 'Änderungsprotokoll',
		appendices: 'Anhänge',

		// System Chapter
		projectInformation: 'Projektinformationen',
		projectName: 'Projektname',
		targetSystem: 'Zielsystem',
		primaryHost: 'Primärer Host',
		name: 'Name',
		platform: 'Plattform',
		hostRuntimePlatform: 'Laufzeit (ioBroker-Host)',
		operatingSystem: 'Betriebssystem',
		version: 'Version',
		systemStatistics: 'Systemstatistiken',
		totalAdapterInstances: 'Gesamt Adapter-Instanzen',
		enabledInstances: 'Aktivierte Instanzen',
		disabledInstances: 'Deaktivierte Instanzen',
		totalStateObjects: 'Gesamt State-Objekte',
		writableStates: 'Schreibbare States',
		readOnlyStates: 'Nur lesbare States',
		hosts: 'Hosts',

		// Rooms Chapter
		roomsAndFunctions: 'Räume & Funktionen',
		rooms: 'Räume',
		functions: 'Funktionen',
		totalRooms: 'Gesamt Räume',
		totalFunctions: 'Gesamt Funktionen',
		memberCount: 'Geräte / Datenpunkte',
		noRoomsDefined: 'Noch keine Räume definiert.',

		// Scripts Chapter
		scripts: 'Skripte',
		totalScripts: 'Gesamt Skripte',
		enabledScripts: 'Aktive Skripte',
		disabledScripts: 'Inaktive Skripte',
		scriptName: 'Name',
		scriptFolder: 'Ordner',
		scriptFolderRoot: 'Root-Verzeichnis',
		scriptFolderCommon: 'Allgemeine Skripte',
		scriptFolderGlobal: 'Globale Skripte',
		scriptsByFolderIntro:
			'Skripte sind nach Ordner gruppiert (wie im ioBroker). Der Ordner „Globale Skripte“ läuft vor anderen Skripten — dort gehören nur Hilfen/Konstanten, keine normale Automatisierungslogik.',
		scriptsGlobalFolderHint:
			'Globale Skripte werden bei jedem Start vor allen anderen ausgeführt. Nur gemeinsame Funktionen/Konstanten ablegen — keine reguläre Raum-/Geräte-Logik (sonst wird das Verhalten schwer nachvollziehbar).',
		scriptStatus: 'Status',
		scriptTrigger: 'Auslöser',
		scriptDescription: 'Gruppenzweck (common.desc — ioBroker: v. a. globale Skripte)',
		scriptEngineInstance: 'Skript-Engine (common.engine)',
		scheduleTypeObjects: 'Schedule-Objekte',
		scheduleTypeObjectsIntro:
			'Objekte aus getObjectView(system, schedule) — ioBroker-Typ «schedule» (z. B. kalenderartige Einträge). Das ist etwas anderes als script.js-Automatisierungen und anders als Adapter-Instanzen im Laufmodus «schedule».',
		instanceRunMode: 'Laufmodus',
		instanceScheduleCron: 'Instanz-CRON (Modus schedule)',
		instanceRestartCron: 'Neustart-CRON (Daemon)',
		noScriptsDefined: 'Keine Skripte gefunden (Script-Adapter möglicherweise nicht installiert).',
		scriptAiSummary: 'KI-Erklärung (aus Skriptquelle)',
		automationOverviewAi: 'Automatisierungen in diesem Zuhause (KI-Überblick)',
		active: 'aktiv',
		inactive: 'inaktiv',

		// Maintenance-Kapitel (Admin): Checkliste + deaktivierte Instanzen. Technische «Diagnose» ist ein eigenes Kapitel.
		maintenance: 'Wartung & Dokumentations-Setup',
		maintenanceChecklist: 'Setup-Checkliste (Dokumentation)',
		documentationScore: 'Gesamtpunktzahl',
		instancesWithoutRoom: 'Aktive Instanzen ohne Raumzuweisung',
		checklistProjectNarrative:
			'Projektbeschreibung unter „Meine Dokumentation“ erfüllt die eingestellte Mindestlänge (Adapter → Erweitert). Einige klare Sätze helfen Lesern und Exporten.',
		checklistBaseUrlUnset:
			'ioBroker-Basis-URL unter Adapter → Erweitert gesetzt — erforderlich für QR-Codes und Lesezeichen-Links von anderen Geräten oder Netzen.',
		disabledInstancesHint: 'Deaktivierte Instanzen',
		disabledInstancesInventoryNote: n =>
			`${n} Adapter-Instanz(en) sind deaktiviert — unten als Übersicht. Das ist üblich und oft gewollt; der Doku-Setup-Score wird dadurch nicht gemindert.`,
		maintenanceChecklistDisabled:
			'Unter Adapter → Erweitert ist keine Checklisten-Zeile für den Doku-Setup-Score aktiv. Der Prozentsatz bleibt bei 100 %, bis mindestens ein Kriterium eingeschaltet ist.',
		allGood: 'Alle Prüfungen bestanden — Dokumentation ist vollständig.',
		checkOk: 'OK',
		checkIssue: 'Handlungsbedarf',
		scoreDimData: 'Datenerfassung',
		scoreDimDataDesc: 'Hat autodoc alle Systemdaten erfolgreich eingelesen?',
		scoreDimManual: 'Manuelle Inhalte',
		scoreDimManualDesc: 'Hat der Nutzer eigene Texte und Einstellungen ausgefüllt?',
		scoreDimDepth: 'Dokumentationstiefe',
		scoreDimDepthDesc: 'Geht die Dokumentation über eine reine Datenpunktliste hinaus?',
		checkHostsFound: 'ioBroker-Hosts auslesbar',
		checkInstancesFound: 'Aktivierte Adapterinstanzen vorhanden',
		checkRoomsDefined: 'RÄume / Enumerationen in ioBroker konfiguriert',
		checkContactSet: 'Kontaktperson hinterlegt (Meine Dokumentation)',
		checkCustomContent: 'Eigene Texte ausgefüllt (Hinweise, Tipps, Raum-/Adapterbeschreibungen)',
		checkHasDiagram: 'Netzwerkdiagramm vorhanden (manuell oder Auto-Host-Topologie)',
		checkRoomsHaveDevices: 'Mindestens ein Raum hat GerÄtezuweisungen',
		checkHasCustomSections: 'Mindestens ein eigenes Dokumentationskapitel hat Inhalt',
		checkAiConfigured: 'KI-Provider für Skriptbeschreibungen konfiguriert (optional ä entfällt ohne Skripte)',
		checkInstancesWithoutRoomInfo: 'Aktive Instanzen ohne Raumzuweisung (nur Info)',

		// Adapters Chapter
		overview: 'Übersicht',
		totalAdapters: 'Gesamt Adapter',
		totalInstances: 'Gesamt Instanzen',
		adapterDetails: 'Adapter-Details',
		instanceDetails: 'Instanz-Details',
		enabledShort: 'aktiv',
		adapters: 'Adapter',
		enabled: 'aktiviert',
		disabled: 'deaktiviert',
		description: 'Beschreibung',
		noAdaptersMatch: 'Keine Adapter entsprechen dem Filter.',
		adapterRunsAutomatically: 'Läuft automatisch – keine Aktion erforderlich',
		adapterCurrentlyInactive: 'Derzeit inaktiv',
		adapterActive: 'Aktiv',
		adapterInactive: 'Inaktiv',
		// Adapter-Meta-Badges
		connTypeLocal: '🔌 Lokal',
		connTypeCloud: '☁️ Cloud',
		dataPush: 'Push',
		dataPoll: 'Polling',
		dataAssumption: 'Annahme',
		tierStable: 'Stabil',
		tierTested: 'Getestet',
		tierExperimental: 'Experimentell',

		// Manual Context
		contact: 'Kontakt',
		additionalNotes: 'Zusätzliche Hinweise',

		// Quick Start
		quickStart: 'Schnellstart',
		quickStartWelcome: 'Willkommen in Ihrer ioBroker-Dokumentation! Das Wichtigste auf einen Blick:',
		quickStartStructuredIntro:
			'Kurzüberblick aus Ihrer Installation — wo was läuft und ein paar Highlights pro Raum (wenn Geräte Räumen zugeordnet sind).',
		qsSystemTitle: 'Installation in Kürze',
		qsRoomGuidesTitle: 'Highlights pro Raum',
		qsRoomCount: n => `${n} Raum/Räume mit Geräten`,
		qsFunctionRow: (name, n) => `Bereich «${name}» — ${n} Gerät(e)`,
		qsScriptRow: (name, desc) => `Automatisierung «${name}»: ${desc}`,
		atAGlanceTitle: 'Kurzüberblick',
		atAGlanceIntro:
			'Übersicht für Bewohner: hier mehr Räume und Highlights als im Gäste-Schnellstart (dieselben Discovery-Daten).',
		qsSeeFullRoomsBefore: 'Die vollständige Raum- und Geräteliste steht im Kapitel ',
		qsSeeFullRoomsAfter: ' weiter unten.',
		qsRoomCardDevices: n => `${n} Gerät(e)`,
		activeAdapters: 'Aktive Adapter',
		nextSteps: 'Nächste Schritte',
		nextStepsReview: 'Überprüfen Sie Ihre installierten Adapter unten',
		nextStepsManual: 'Lesen Sie den Abschnitt Manuelle Informationen für Hinweise',
		nextStepsAdapters: 'Die meisten Adapter laufen automatisch – keine Konfiguration nötig',
		nextStepsOnboarding1:
			'Weiter unten finden Sie die Kapitel dieser Seite — ein kurzer Rundgang (Räume, Hintergrundabläufe, Kontakt- und Notfalltexte, falls Ihr Gastgeber sie in „Meine Dokumentation“ hinterlegt hat).',
		nextStepsOnboarding2:
			'Kontakt, Hausnotizen und Notfallabschnitt erscheinen in den passenden Kapiteln, sofern ausgefüllt.',
		nextStepsOnboarding3:
			'Systemeinstellungen in ioBroker anzupassen ist nicht die Rolle von Gästen — das erledigt der Eigentümer.',
		onboardingAutomationsOmitted: n =>
			`Weitere ${n} Hintergrund-Skripte laufen, werden in dieser Gäste-Ansicht aber nicht einzeln aufgelistet. Die vollständige Liste finden Sie in der technischen (Admin-)Doku.`,
		onboardingAutomationsSummaryBody: n =>
			`Aktuell sind ${n} JavaScript-Automatisierung(en) aktiv — sie laufen im Hintergrund, Sie müssen nichts tun. Interne Skript-Dateinamen und technische Kennungen führen wir in der Gäste-Ansicht nicht auf (könnten persönlich oder sensibel sein). Die vollständige Liste steht im Profil «Admin»-Dokumentation.`,

		// Rooms / Functions filter
		members: 'Mitglieder',
		noRoomsMatch: 'Keine Räume entsprechen dem Filter.',
		noFunctionsMatch: 'Keine Funktionen entsprechen dem Filter.',

		// Scripts filter & dependency analysis
		noScriptsMatch: 'Keine Skripte entsprechen dem Filter.',
		stateReferences: 'State-Referenzen',
		stateReferencesDesc:
			'Von Skripten referenzierte States (statische Analyse des Quelltexts). Rechte Spalte: optionales Feld common.desc am Skriptobjekt (ioBroker-Schema: „group purpose description“), wie in der Skriptliste; „—“ wenn leer.',
		script: 'Skript',
		referencedStates: 'Referenzierte States',
		sharedStates: 'Gemeinsame States',
		sharedStatesDesc: 'States, die von mehreren Skripten verwendet werden.',
		stateId: 'State-ID',
		usedByScripts: 'Verwendet von Skripten',
		noSharedStatesMatch: 'Keine gemeinsamen States entsprechen dem Filter.',
		stateReferencesExpandSummary: (scriptCount, refCount) =>
			`State-Referenz-Tabellen anzeigen — ${scriptCount} Skript(e), ${refCount} Referenz(en) (standardmäßig zugeklappt)`,
		sharedStatesExpandSummary: n =>
			`Tabelle gemeinsamer States anzeigen — ${n} State(s), die von mehreren Skripten genutzt werden (standardmäßig zugeklappt)`,
		userdataExpandSummary: (itemCount, groupCount) =>
			`Alle Userdata-Datenpunkte anzeigen — ${itemCount} in ${groupCount} Gruppe(n) (standardmäßig zugeklappt)`,
		aliasesExpandSummary: (itemCount, groupCount) =>
			`Alle Aliase anzeigen — ${itemCount} in ${groupCount} Gruppe(n) (standardmäßig zugeklappt)`,

		// Diagnose (Schnappschuss für die Doku — keine vollständige Systemprüfung)
		diagnosis: 'Diagnose',
		diagnosisChapterIntro:
			'Dieses Kapitel beschreibt den Stand zum Zeitpunkt der Dokumentationserzeugung: Zähler und Host-Kenndaten, die autodoc aus der ioBroker-Objektdatenbank für diesen Export gelesen hat. Es ist keine umfassende Gesundheits-, Sicherheits- oder Erreichbarkeitsprüfung Ihrer Installation.',
		diagScanStatus: 'Schnappschuss (dieser Export)',
		diagActive: 'aktiv',
		diagInactive: 'inaktiv',
		diagWhereToLook: 'Wo nachschauen',
		diagWhatLabel: 'Was',
		diagWhereLabel: 'Wo',
		diagLogsLabel: 'Adapter-Logs',
		diagLogsValue: 'Admin-UI → Reiter „Log" → nach Adaptername filtern',
		diagAliveLabel: 'Adapter-Prozess läuft?',
		diagAliveHint: '(true = Prozess läuft, false = abgestürzt oder gestoppt)',
		diagConnectedLabel: 'Adapter mit Gerät/Dienst verbunden?',
		diagConnectedHint: '(true = Verbindung besteht)',
		diagFindings: 'Automatische Prüfungen in diesem Export',
		diagAutomatedChecksIntro:
			'Beim Erzeugen dieser Seite werden nur wenige Regeln ausgewertet (derzeit: Node.js-Hauptversion anhand einer einfachen LTS-Heuristik). Wenn nichts markiert wird, heißt das nicht „alles fehlerfrei“.',
		diagNodeCheckOk:
			'Node.js {0} — nach dieser Regel kein Hinweis (typisch: Hauptversion ≥ 20, gerade Major = LTS-Zweig). Ersetzt keine Prüfung der Adapter oder des Admin-Logs.',
		diagNodeVersionMissing: 'Node.js-Version in diesem Schnappschuss nicht gemeldet — die Node-Regel entfällt.',
		diagMaintenanceReminders: 'Allgemeine Erinnerungen',
		diagMaintenanceRemindersIntro: 'Dauerhafte Wartungshinweise — keine von autodoc erkannten Fehler.',
		diagFindingDisabled: n =>
			`${n} Adapter-Instanz(en) sind deaktiviert — nur informativ (oft Absicht; siehe Kapitel «Wartung & Dokumentations-Setup»)`,
		diagFindingNone:
			'Keine automatischen Markierungen durch die Regeln dieses Exports (abgesehen von den obigen Punkten).',
		// Betrieb/Referenz — kein „bei Ihnen liegt ein Fehler vor“
		troubleshooting: 'Betrieb – Referenz',
		troubleshootingGenericDisclaimer:
			'Festes Kapitel der Systemdokumentation: typische Prüfschritte und häufige Störungen — kein automatischer Fehlerbericht und kein Hinweis, dass bei Ihnen etwas fehlerhaft ist. Die Punkte werden nicht live gegen die Installation geprüft — bitte als Checkliste nutzen und in Admin verifizieren (Log, States, Dateien).',
		tsAdapterNotStarting: 'Adapter startet nicht',
		tsAdapterNotStartingSymptom: 'Symptom: alive = false, Adapter startet immer neu',
		tsAdapterNotStarting1: 'Log-Tab auf Fehlermeldungen dieses Adapters prüfen',
		tsAdapterNotStarting2: 'Häufige Ursachen: falsche IP/Port, fehlende Zugangsdaten, Port bereits belegt',
		tsAdapterNotStarting3: 'Adapter deaktivieren, Konfiguration korrigieren, wieder aktivieren',
		tsAdapterNotConnected: 'Adapter läuft, verbindet sich aber nicht mit Gerät/Dienst',
		tsAdapterNotConnectedSymptom: 'Symptom: alive = true, connected = false, keine State-Aktualisierungen',
		tsAdapterNotConnected1: 'Netzwerk: Gerät erreichbar? (ping, Browser)',
		tsAdapterNotConnected2: 'Zugangsdaten: API-Key, Passwort oder Token korrekt?',
		tsAdapterNotConnected3: 'Push-Adapter: Eingehender Port in der Firewall freigegeben?',
		tsScriptNotRunning: 'Skript wird nicht ausgeführt',
		tsScriptNotRunningSymptom: 'Symptom: keine State-Änderungen, kein Log-Output des Skripts',
		tsScriptNotRunning1: 'Ist das Skript aktiviert? (grüner Punkt im Skript-Editor)',
		tsScriptNotRunning2: 'Ist der javascript-Adapter aktiv?',
		tsScriptNotRunning2Warn: 'javascript-Adapter ist NICHT aktiv — Skripte können nicht laufen',
		tsScriptNotRunning3: 'Skript-Log im Log-Tab prüfen (Filter: „javascript")',
		tsDocNotGenerated: 'Dokumentation startet nicht von selbst (keine automatischen Auslöser)',
		tsDocNotGeneratedSymptom:
			'Sie erwarten einen automatischen Lauf, es gibt aber keine neuen Dateien unter /files/autodoc.<instanz>/ und kein sinnvolles State-Update.',
		tsDocNotGenerated1: 'Läuft die autodoc-Adapter-Instanz?',
		tsDocNotGenerated2:
			'Unter Grundeinstellungen mindestens einen automatischen Auslöser aktivieren: „beim Adapter-Start“, „bei Adapteränderungen“ und/oder „Intervall (Stunden)“ > 0. Dieser Abschnitt erscheint im exportierten HTML nur, wenn alle drei zum Zeitpunkt des Exports aus sind — dann startet die Erzeugung nicht von allein, bis Sie das ändern.',
		tsDocNotGenerated3: 'Manuell auslösen: autodoc.0.action.generate = true setzen',
		collectorStatus: 'Collector-Status',
		instancesDetected: 'Erkannte Instanzen',
		stateObjectsScanned: 'State-Objekte (für die Doku gelesen)',
		nodeVersion: 'Node-Version',
		npmVersion: 'npm-Version',
		npmVersionHint: 'Aus Host-Meldung oder lokalem npm auf dem Instanz-Host, falls nicht in der Objektdatenbank.',
		jsControllerVersion: 'js-controller Version',
		osKernel: 'BS / Kernel',
		osArch: 'Architektur',
		nodeVersionOutdated: 'Node.js {0} — Version unter empfohlenem LTS (v20+). Upgrade empfohlen.',
		nodeVersionOk: 'Node.js {0} — LTS ✓',
		osUpdateHint: 'Betriebssystem regelmäßig mit Sicherheitsupdates versorgen.',

		// AI section
		aiSummary: 'KI-Zusammenfassung',

		// Search / filter UI
		filterPlaceholder: 'Filter...',
		searchPlaceholder: 'Suchen… (Enter = weiter)',
		adapterFilterPlaceholder: 'Adapter filtern…',
		adapterFilterHint: 'Filtern nach Name, Beschreibung, Stabil/Getestet/Experimentell, Lokal/Cloud, Push/Poll',
		disabledAdaptersGroup: '{0} deaktivierte Instanzen — anzeigen',
		scriptFilterPlaceholder: 'Skripte filtern…',
		scriptFilterHint: 'Filtern nach Name, Gruppenzweck (common.desc), Auslöser-Typ oder Ordner',
		disabledScriptsGroup: '{0} inaktive Skripte — anzeigen',

		// Appendices
		stateObjectsSummary: 'State-Objekte Zusammenfassung',
		total: 'Gesamt',
		writable: 'Schreibbar',
		readOnly: 'Nur lesbar',
		collectionInformation: 'Erfassungsinformationen',
		collectedAt: 'Erfasst am',
		schemaVersion: 'Schema-Version',
		generatedBy: 'Generiert von ioBroker.autodoc v',

		// Rollen-Kategorien
		catLight: 'Licht',
		catDimmer: 'Dimmer',
		catBlind: 'Rolllade',
		catThermostat: 'Klima',
		catHumidity: 'Feuchtigkeit',
		catMotion: 'Bewegung',
		catDoor: 'Tür',
		catWindow: 'Fenster',
		catAlarm: 'Alarm',
		catLock: 'Schloss',
		catSwitch: 'Schalter',
		catMedia: 'Medien',
		catCamera: 'Kamera',
		catPower: 'Energie',
		catOther: 'Gerät',

		// Phase 4 — Profil-Redesign
		deviceHierarchy: 'Gerätehierarchie',
		category: 'Kategorie',
		noDevicesInRoom: 'Diesem Raum sind keine Geräte zugeordnet.',
		automations: 'Automatisierungen',
		connectedSystems: 'Verbundene Systeme',
		yourRooms: 'Deine Räume',
		tipsAndNotes: 'Hinweise & Tipps',
		whatCanBeControlled: 'Was kann gesteuert werden:',
		whatRunsAutomatically: 'Was läuft automatisch? (Skript-Engine / JavaScript)',
		automationsIntro:
			'Die folgenden Abläufe stammen von aktivierten JavaScript-Skripten in ioBroker — sie laufen im Hintergrund; Sie brauchen nichts zu tun:',
		noActiveScripts:
			'Hier sind keine aktivierten JavaScript-Skripte hinterlegt. Blockly, andere Regelsysteme oder Logik in anderen Adaptern werden in diesem Abschnitt noch nicht aufgeführt.',
		roomsHiddenHint: '{0} Raum/Räume per Konfiguration ausgeblendet.',
		adaptersHiddenHint: '{0} Adapter per Konfiguration ausgeblendet.',
		moreScripts: '{0} weitere Skripte (ohne Beschreibung)',
		moreChanges: 'Änderungen',
		olderEntries: '{0} ältere Einträge',
		changelogChange_instance_count: 'Adapter-Instanzen',
		changelogChange_enabled_instances: 'Aktivierte Instanzen',
		changelogChange_state_objects: 'State-Objekte',
		changelogChange_project_name: 'Projektname',
		changelogChange_adapter_version: 'Adapter-Update',
		changelogMsgAdapterVersion: (title, id, prev, curr) =>
			`Adapter „${title}“ (${id}): ${prev || '?'} → ${curr || '?'}`,
		docChangeSinceLastTitle: 'Änderungen seit dem letzten Lauf',
		docChangeSinceLastNote:
			'Vergleich mit dem vorherigen AutoDoc-Schnappschuss (nur Bestands-Kennzahlen — keine vollständige Automatisierungslogik).',
		docChangeSummaryInitial:
			'Erster Dokumentationslauf für diese AutoDoc-Instanz — es gibt noch keinen vorherigen Schnappschuss zum Vergleich.',
		docChangeSummaryNone: 'Keine wesentlichen Bestandsänderungen gegenüber dem vorherigen Schnappschuss.',
		changelogSummaryChangesDetected: n =>
			n === 1
				? '1 Bestandsänderung gegenüber dem vorherigen Schnappschuss erkannt.'
				: `${n} Bestandsänderungen gegenüber dem vorherigen Schnappschuss erkannt.`,
		docChangeSummaryCount: n =>
			n === 1
				? '1 Änderung gegenüber dem vorherigen Schnappschuss:'
				: `${n} Änderungen gegenüber dem vorherigen Schnappschuss:`,
		userDocChangeSinceLastPlain:
			'Seit die Dokumentation für Ihr Zuhause zuletzt gespeichert wurde, hat sich auf Ihrem ioBroker-Server etwas geändert (z. B. ein Adapter-Update). Die folgenden Abschnitte beschreiben den aktuellen Stand.',
		docTransparencyLimitsShort:
			'Diese Dokumentation zeigt, was AutoDoc aus ioBroker ableiten kann. Verhalten in Geräte-Firmware, Hersteller-Clouds, Regeln in nicht angebundenen Adaptern, Blockly-Details und Automation außerhalb der erfassten Quellen kann unvollständig fehlen.',
		changelogTruncated: 'Zeige 10 von {0} Einträgen.',
		onboardingWelcome: name => `Willkommen bei ${name}`,
		onboardingWelcomeCity: (name, city) => `Willkommen bei ${name} – ${city}`,
		onboardingIntro: 'Dieses Dokument erklärt, wie dein Smart Home funktioniert.',
		guestHelpTitle: 'Hilfe & Notfall',
		customDocSectionsTitle: 'Eigene Kapitel',
		homeRoutinesTitle: 'Abläufe mit eigenen Worten',
		homeRoutinesIntro: 'Von den Bewohnern formuliert — nicht automatisch aus Skripten erzeugt.',
		ownerPlaybookTitle: 'So läuft das bei uns',
		ownerPlaybookIntro:
			'Dein Ablaufplan — Reihenfolge, was erledigt werden muss, was niemand ändern soll. Vom Haushalt formuliert; nicht automatisch erzeugt.',
		mermaidDiagramTitle: 'Übersichtsdiagramm (Mermaid)',
		mermaidDiagramIntro:
			'Diagramm aus den Dokumentations-Einstellungen (Mermaid). Der HTML-Export bettet SVG ein, wenn das optionale Paket @mermaid-js/mermaid-cli installiert ist; sonst lädt der Browser Mermaid von jsDelivr. Im Markdown bleibt der Quelltext für Mermaid-fähige Viewer. Tipp: flowchart LR (links nach rechts) nutzt die Seitenbreite statt einer langen senkrechten Kette.',
		mermaidAutoTopologyTitle: 'Host-Topologie (automatisch)',
		mermaidAutoTopologyMdHint: 'Auto-Topologie nur im HTML-Export verfügbar (Admin-Profil).',
		mermaidAutoTopologyIntro:
			'Adapter-Instanzen nach ioBroker-Host gruppiert, mit einer festen Maximalknotenzahl zur Lesbarkeit. Darstellung horizontal (links nach rechts), damit die Seitenbreite genutzt wird. Kein vollständiger Verbindungs- oder Abhängigkeitsgraph. Ausblenden mit Kapitel-Id mermaid (wie das eigene Mermaid-Diagramm).',
		troubleshootPublicLinksIntro:
			'Diese Seiten erneuern sich bei der Doku-Generierung — passende Links speichern oder teilen.',
		troubleshootPublicLinksHeading: 'Merken & teilen (Links)',
		troubleshootLinkAdmin: 'Technische Doku (Admin-Ansicht)',
		troubleshootLinkUser: 'Alltagsdoku (Familie)',
		troubleshootLinkOnboarding: 'Einfache / Gäste-Ansicht',
		troubleshootQuickFactsTitle: 'Kurz & wichtig',
		troubleshootWifiLabel: 'WLAN / Netz',
		troubleshootPowerLabel: 'Strom / Sicherungen',
		troubleshootWaterLabel: 'Hauptwasser',
		troubleshootExtraLabel: 'Sonstiges',
		troubleshootSnapshotDisclaimer:
			'Stand von der letzten Doku-Erzeugung — kein Live-Monitoring. Technische Info für die Betreuungsperson.',
		troubleshootSnapshotNodeTitle: 'Server-Software sollte geprüft werden',
		troubleshootSnapshotNodeStep1:
			'Die Person, die dieses Smart Home betreut (oder der Provider), sollte die Softwareversion prüfen.',
		troubleshootSnapshotNodeStep2:
			'Offizielle Hinweise zu ioBroker und Node.js (Long-Term-Support) helfen bei geplanten Updates — diese Seite kann nichts einspielen.',
		troubleshootSnapshotNodeStep3:
			'Bis dahin kann alles laufen; veraltete oder keine LTS-Version kann fehlende Sicherheitsupdates bedeuten.',
		onboardingHintTitle: 'Tipp: Mach diese Seite noch besser!',
		onboardingHintText:
			'Füge in den Adapter-Einstellungen eine Beschreibung und Haushinweise hinzu (Manueller Kontext), damit Gäste und Familienmitglieder eine persönliche Einführung bekommen.',
		scanToShare: 'Seite teilen',
		copyLink: 'Link kopieren',
		copied: 'Kopiert!',
		devices: 'Geräte',
		darkMode: 'Dark Mode',
		lightMode: 'Hell Mode',
		adaptersActive: 'aktiv',
		staleDocsWarning: 'Diese Dokumentation könnte veraltet sein.',
		staleDocsWeek: 'Dokumentation ist älter als 7 Tage.',
		staleDocsOld: 'Dokumentation ist älter als 30 Tage — bitte neu generieren.',
		pendingUpdates: 'Updates verfügbar',
		lastBackup: 'Letztes Backup',
		today: 'heute',
		yesterday: 'gestern',
		location: 'Standort',
		city: 'Ort',
		timezone: 'Zeitzone',
		tempUnit: 'Temperatureinheit',
		uptime: 'Laufzeit',
		type: 'Typ',
		value: 'Wert',
		userDefinedVariables: 'Eigene Variablen',
		userDataDesc: 'Datenpunkte unter 0_userdata.0 — selbst angelegte Variablen und Werte.',
		aliases: 'Aliase',
		aliasesDesc: 'Aliase machen fremde Datenpunkte unter einem eigenen Namen zugänglich (alias.0.*).',
		aliasTarget: 'Ziel',
		scoreDesc:
			'Drei getrennte Scores zeigen: **Wie vollständig** autodoc gelesen hat, **welche Inhalte** du hinterlegt hast, und **wie tief** die Dokumentation ist. Der Gesamtwert ist der Durchschnitt.',
		totalSuffix: 'gesamt',
		ramSystemTooltip: 'Belegter / Gesamter System-RAM',
		ramAdapterTooltip: 'Summe aller ioBroker-Prozesse (js-controller + alle Adapter-Instanzen)',
		ramHostTooltip:
			'Nur der ioBroker Host-Prozess (js-controller). Adapter-Instanzen laufen als separate Prozesse.',
		allAdapters: 'alle Adapter',
		scriptHasScheduleTitle: 'Skript mit Zeitplan (Cron)',
		noNotesYet: 'Für dieses Smart Home wurden noch keine besonderen Hinweise hinterlegt. Schau dich gerne um!',
		onboardingSetupHint:
			'Tipp für Administratoren: Projektbeschreibung, Kontaktperson und Hinweise in den Adapter-Einstellungen → „Meine Dokumentation" hinterlegen.',
		onboardingCapabilities: 'Was kann dieses Smart Home?',
		onboardingCapabilitiesDesc: 'Diese Bereiche sind in deinem Smart Home eingerichtet und steuerbar:',
		justNow: 'gerade eben',
		minutesAgo: 'Min. her',
		hoursAgo: 'Std. her',
		daysAgo: 'Tage her',
		cronEvery: 'alle',
		cronDaily: 'täglich',
		cronHourly: 'stündlich',
		cronAt: 'um',
		cronMon: 'Mo',
		cronTue: 'Di',
		cronWed: 'Mi',
		cronThu: 'Do',
		cronFri: 'Fr',
		cronSat: 'Sa',
		cronSun: 'So',
		availableFunctions: 'Steuerbare Bereiche im ganzen Haus:',
		showFunctions: 'Funktionen anzeigen',
		processOnly: 'Prozess',
		searchPrev: 'Vorheriger Treffer',
		searchNext: 'Nächster Treffer',
		searchHint: '↑↓ navigieren · Esc = löschen',
		activeRepo: 'Repository',
	},
	fr: {
		projectDocumentation: name => `Documentation ${name}`,
		generated: 'Généré',
		profile: 'Profil',
		system: 'Système',
		trigger: 'Déclencheur',
		tableOfContents: 'Table des matières',
		systemOverview: 'Aperçu du système',
		adapterInstances: "Instances d'adaptateurs",
		manualInformation: 'Informations manuelles',
		changelog: 'Journal des modifications',
		appendices: 'Appendices',
		projectInformation: 'Informations du projet',
		projectName: 'Nom du projet',
		targetSystem: 'Système cible',
		primaryHost: 'Hôte principal',
		name: 'Nom',
		platform: 'Plateforme',
		hostRuntimePlatform: 'Exécution (hôte ioBroker)',
		operatingSystem: "Système d'exploitation",
		version: 'Version',
		systemStatistics: 'Statistiques du système',
		totalAdapterInstances: "Nombre total d'instances d'adaptateurs",
		enabledInstances: 'Instances activées',
		disabledInstances: 'Instances désactivées',
		totalStateObjects: "Nombre total d'objets d'état",
		writableStates: 'États inscriptibles',
		readOnlyStates: 'États en lecture seule',
		hosts: 'Hôtes',
		// Rooms Chapter
		roomsAndFunctions: 'Pièces & Fonctions',
		rooms: 'Pièces',
		functions: 'Fonctions',
		totalRooms: 'Total des pièces',
		totalFunctions: 'Total des fonctions',
		memberCount: 'Appareils / Points de données',
		noRoomsDefined: "Aucune pièce définie pour l'instant.",

		// Scripts Chapter
		scripts: 'Scripts',
		totalScripts: 'Total des scripts',
		enabledScripts: 'Scripts actifs',
		disabledScripts: 'Scripts inactifs',
		scriptName: 'Nom',
		scriptFolder: 'Dossier',
		scriptFolderRoot: 'Répertoire racine',
		scriptFolderCommon: 'Scripts généraux',
		scriptFolderGlobal: 'Scripts globaux',
		scriptsByFolderIntro:
			'Les scripts sont regroupés par dossier (comme dans ioBroker). Le dossier « Scripts globaux » s’exécute avant les autres — réservez-le aux utilitaires/partagés, pas aux automatisations courantes.',
		scriptsGlobalFolderHint:
			'Les scripts globaux s’exécutent à chaque redémarrage avant les autres. N’y mettez que fonctions/constantes partagées — pas la logique pièce/appareil (sinon le comportement devient difficile à prévoir).',
		scriptStatus: 'Statut',
		scriptTrigger: 'Déclencheur',
		scriptDescription: 'Texte d’objectif de groupe (common.desc — ioBroker : surtout scripts globaux)',
		scriptEngineInstance: 'Moteur de script (common.engine)',
		scheduleTypeObjects: 'Objets Schedule',
		scheduleTypeObjectsIntro:
			'Objets issus de getObjectView(system, schedule) — type ioBroker « schedule » (p. ex. entrées type calendrier). Distinct des automatisations script.js et des instances en mode d’exécution « schedule ».',
		instanceRunMode: 'Mode d’exécution',
		instanceScheduleCron: 'CRON d’instance (mode schedule)',
		instanceRestartCron: 'CRON de redémarrage (daemon)',
		noScriptsDefined: "Aucun script trouvé (l'adaptateur script n'est peut-être pas installé).",
		scriptAiSummary: 'Explication IA (à partir du code source)',
		automationOverviewAi: 'Automatisations dans ce foyer (aperçu IA)',
		active: 'actif',
		inactive: 'inactif',

		// Chapitre maintenance (Admin) : checklist + instances désactivées. Le chapitre « Diagnostic » technique est séparé.
		maintenance: 'Maintenance et mise en place documentaire',
		maintenanceChecklist: 'Liste de mise en place (documentation)',
		documentationScore: 'Score global',
		instancesWithoutRoom: 'Instances actives sans pièce assignée',
		checklistProjectNarrative:
			'La description du projet (section « Ma documentation ») atteint la longueur minimale configurée (Adaptateur → Avancé). Des phrases claires aident la lecture et les exports.',
		checklistBaseUrlUnset:
			"URL de base ioBroker renseignée sous Adaptateur → Avancé — nécessaire pour les codes QR et les liens signets depuis d'autres appareils ou réseaux.",
		disabledInstancesHint: 'Instances désactivées',
		disabledInstancesInventoryNote: n =>
			`${n} instance(s) d'adaptateur désactivée(s) — listée(s) ci-dessous à titre informatif. C'est courant et souvent voulu ; cela n'influe pas sur le score de mise en place documentaire.`,
		maintenanceChecklistDisabled:
			'Aucune ligne de checklist n’est activée sous Adaptateur → Avancé (score de mise en place documentaire). Le pourcentage affiché reste à 100 % jusqu’à ce qu’au moins une vérification soit activée.',
		allGood: 'Toutes les vérifications réussies — la documentation est complète.',
		checkOk: 'OK',
		checkIssue: 'À corriger',
		scoreDimData: 'Collecte de données',
		scoreDimDataDesc: 'Autodoc a-t-il pu lire toutes les données système?',
		scoreDimManual: 'Contenu manuel',
		scoreDimManualDesc: "L'utilisateur a-t-il rempli ses propres textes et paramètres?",
		scoreDimDepth: 'Profondeur de documentation',
		scoreDimDepthDesc: "La documentation va-t-elle au-delà d'une simple liste de points de données?",
		checkHostsFound: 'Hôtes ioBroker lisibles',
		checkInstancesFound: "Instances d'adaptateur actives trouvées",
		checkRoomsDefined: 'Pièces / énumérations configurées dans ioBroker',
		checkContactSet: 'Personne de contact renseignée (Ma documentation)',
		checkCustomContent: 'Textes personnalisés remplis (notes, conseils, descriptions pièces/adaptateurs)',
		checkHasDiagram: 'Diagramme réseau disponible (manuel ou topologie auto)',
		checkRoomsHaveDevices: 'Au moins une pièce a des appareils assignés',
		checkHasCustomSections: 'Au moins un chapitre de documentation personnalisé a du contenu',
		checkAiConfigured:
			'Fournisseur IA configuré pour les descriptions de scripts (optionnel é ignoré sans scripts)',
		checkInstancesWithoutRoomInfo: 'Instances actives sans pièce assignée (informatif)',

		overview: 'Aperçu',
		totalAdapters: "Nombre total d'adaptateurs",
		totalInstances: "Nombre total d'instances",
		adapterDetails: "Détails de l'adaptateur",
		instanceDetails: "Détails de l'instance",
		enabledShort: 'actif',
		adapters: 'Adaptateurs',
		enabled: 'activé',
		disabled: 'désactivé',
		description: 'Description',
		noAdaptersMatch: 'Aucun adaptateur ne correspond au filtre.',
		adapterRunsAutomatically: 'Fonctionne automatiquement — aucune action requise',
		adapterCurrentlyInactive: 'Actuellement inactif',
		adapterActive: 'Actif',
		adapterInactive: 'Inactif',
		// Badges méta adaptateur
		connTypeLocal: '🔌 Local',
		connTypeCloud: '☁️ Cloud',
		dataPush: 'Push',
		dataPoll: 'Polling',
		dataAssumption: 'Annahme',
		tierStable: 'Stable',
		tierTested: 'Testé',
		tierExperimental: 'Expérimental',
		contact: 'Contact',
		additionalNotes: 'Notes supplémentaires',
		quickStart: 'Démarrage rapide',
		quickStartWelcome: 'Bienvenue dans votre documentation ioBroker ! Voici ce que vous devez savoir :',
		quickStartStructuredIntro:
			'Aperçu issu de votre installation — ce qui tourne où, et quelques points forts par pièce (si des appareils sont associés aux pièces).',
		qsSystemTitle: 'En bref',
		qsRoomGuidesTitle: 'Points forts par pièce',
		qsRoomCount: n => `${n} pièce(s) avec appareils`,
		qsFunctionRow: (name, n) => `Zone « ${name} » — ${n} appareil(s)`,
		qsScriptRow: (name, desc) => `Automatisation « ${name} » : ${desc}`,
		atAGlanceTitle: 'Aperçu rapide',
		atAGlanceIntro:
			'Aperçu « résidents » : plus de pièces et de points saillants que dans le démarrage rapide invité (mêmes données de découverte).',
		qsSeeFullRoomsBefore: 'La liste complète, pièce par pièce, se trouve dans le chapitre ',
		qsSeeFullRoomsAfter: ' ci‑dessous.',
		qsRoomCardDevices: n => `${n} appareil(s)`,
		activeAdapters: 'Adaptateurs actifs',
		nextSteps: 'Prochaines étapes',
		nextStepsReview: 'Consultez vos adaptateurs installés ci-dessous',
		nextStepsManual: 'Consultez la section informations manuelles',
		nextStepsAdapters: 'La plupart des adaptateurs fonctionnent automatiquement — aucune configuration nécessaire',
		nextStepsOnboarding1:
			'Plus bas, des sections vous guident (pièces, ce qui tourne en arrière-plan, contact ou notes d’urgence si l’hôte les a saisis dans « Ma documentation »).',
		nextStepsOnboarding2:
			'Contact, notes de foyer et blocs d’urgence apparaissent dans les chapitres correspondants si l’hôte les a remplis.',
		nextStepsOnboarding3:
			'Les invités n’ont pas à modifier la configuration — c’est le rôle du responsable de l’installation ioBroker.',
		onboardingAutomationsOmitted: n =>
			`Encore ${n} script(s) JavaScript tournent en arrière-plan ; la liste n’est pas entièrement affichée dans cette vue invité. L’exhaustif est dans la documentation technique (admin).`,
		onboardingAutomationsSummaryBody: n =>
			`${n} automatisation(s) JavaScript activée(s) tournent en arrière-plan — vous n’avez rien à faire. Les noms de fichiers internes ne sont pas listés dans cette vue invité (souvent techniques ou personnels). La liste complète figure dans le profil documentation « admin ».`,
		members: 'Membres',
		noRoomsMatch: 'Aucune pièce ne correspond au filtre.',
		noFunctionsMatch: 'Aucune fonction ne correspond au filtre.',
		noScriptsMatch: 'Aucun script ne correspond au filtre.',
		stateReferences: "Références d'état",
		stateReferencesDesc:
			'États référencés par des scripts (analyse statique du code). La colonne de droite reprend le champ optionnel common.desc de l’objet script (schéma ioBroker : « group purpose description »), comme dans la liste ; « — » si vide.',
		script: 'Script',
		referencedStates: 'États référencés',
		sharedStates: 'États partagés',
		sharedStatesDesc: "États utilisés par plus d'un script.",
		stateId: "ID d'état",
		usedByScripts: 'Utilisé par des scripts',
		noSharedStatesMatch: 'Aucun état partagé ne correspond au filtre.',
		stateReferencesExpandSummary: (scriptCount, refCount) =>
			`Afficher les tableaux de références d’état — ${scriptCount} script(s), ${refCount} référence(s) (repliés par défaut)`,
		sharedStatesExpandSummary: n =>
			`Afficher le tableau des états partagés — ${n} état(s) utilisé(s) par plusieurs scripts (replié par défaut)`,
		userdataExpandSummary: (itemCount, groupCount) =>
			`Afficher tous les points userdata — ${itemCount} dans ${groupCount} groupe(s) (replié par défaut)`,
		aliasesExpandSummary: (itemCount, groupCount) =>
			`Afficher tous les alias — ${itemCount} dans ${groupCount} groupe(s) (replié par défaut)`,
		// Diagnostic — instantané doc, pas un audit complet
		diagnosis: 'Diagnostic',
		diagnosisChapterIntro:
			'Ce chapitre résume l’instantané au moment où cette documentation a été générée : compteurs et informations hôte lues par autodoc dans la base d’objets ioBroker pour cet export. Ce n’est pas un audit complet de santé, de sécurité ou de connectivité de votre installation.',
		diagScanStatus: 'Instantané (cet export)',
		diagActive: 'actif',
		diagInactive: 'inactif',
		diagWhereToLook: 'Où chercher',
		diagWhatLabel: 'Quoi',
		diagWhereLabel: 'Où',
		diagLogsLabel: "Journaux de l'adaptateur",
		diagLogsValue: "Admin UI → onglet « Log » → filtrer par nom d'adaptateur",
		diagAliveLabel: 'Processus adaptateur en cours ?',
		diagAliveHint: '(true = processus actif, false = planté ou arrêté)',
		diagConnectedLabel: "Adaptateur connecté à l'appareil/service ?",
		diagConnectedHint: '(true = connexion établie)',
		diagFindings: 'Contrôles automatiques dans cet export',
		diagAutomatedChecksIntro:
			'Seules quelques règles sont évaluées en générant cette page (aujourd’hui : major Node.js via une heuristique LTS simple). Si rien n’est signalé, cela ne signifie pas que le système est « sans erreur ».',
		diagNodeCheckOk:
			'Node.js {0} — pas de signal selon cette règle (souvent major ≥ 20, major pair = branche LTS). Ne remplace pas la vérification des adaptateurs ni du journal Admin.',
		diagNodeVersionMissing: 'Version de Node.js absente dans cet instantané — cette règle est ignorée.',
		diagMaintenanceReminders: 'Rappels généraux',
		diagMaintenanceRemindersIntro: 'Conseils de maintenance permanents — pas des défauts détectés par autodoc.',
		diagFindingDisabled: n =>
			`${n} instance(s) d'adaptateur désactivée(s) — purement informatif (souvent voulu ; voir le chapitre « Maintenance et mise en place documentaire »)`,
		diagFindingNone: 'Aucun signal automatique selon les règles de cet export (en dehors des points ci-dessus).',
		// Référence d’exploitation — pas « une panne a été détectée »
		troubleshooting: 'Référence d’exploitation',
		troubleshootingGenericDisclaimer:
			'Chapitre standard de cette documentation : vérifications courantes et cas fréquents — pas un rapport de défaut automatique. Rien ci-dessous n’est contrôlé en direct sur votre installation ; à utiliser comme liste de contrôle et à confirmer dans l’Admin (log, états, fichiers).',
		tsAdapterNotStarting: "L'adaptateur ne démarre pas",
		tsAdapterNotStartingSymptom: "Symptôme : alive = false, l'adaptateur redémarre en boucle",
		tsAdapterNotStarting1: "Vérifier l'onglet Log pour les messages d'erreur de cet adaptateur",
		tsAdapterNotStarting2: 'Causes fréquentes : IP/port incorrect, identifiants manquants, port déjà utilisé',
		tsAdapterNotStarting3: "Désactiver l'adaptateur, corriger la configuration, réactiver",
		tsAdapterNotConnected: "L'adaptateur fonctionne mais ne se connecte pas à l'appareil/service",
		tsAdapterNotConnectedSymptom: 'Symptôme : alive = true, connected = false, pas de mise à jour des états',
		tsAdapterNotConnected1: "Réseau : l'appareil est-il joignable ? (ping, navigateur)",
		tsAdapterNotConnected2: 'Identifiants : clé API, mot de passe ou token corrects ?',
		tsAdapterNotConnected3: 'Adaptateur Push : port entrant ouvert dans le pare-feu ?',
		tsScriptNotRunning: "Le script ne s'exécute pas",
		tsScriptNotRunningSymptom: "Symptôme : pas de changement d'état, pas de sortie dans le log",
		tsScriptNotRunning1: "Le script est-il activé ? (point vert dans l'éditeur de scripts)",
		tsScriptNotRunning2: "L'adaptateur javascript est-il actif ?",
		tsScriptNotRunning2Warn: "L'adaptateur javascript n'est PAS actif — les scripts ne peuvent pas s'exécuter",
		tsScriptNotRunning3: 'Vérifier le log du script dans l\'onglet Log (filtre : "javascript")',
		tsDocNotGenerated: 'La documentation ne démarre pas toute seule (aucun déclencheur automatique)',
		tsDocNotGeneratedSymptom:
			'Vous attendez une génération automatique, mais il n’y a pas de nouveaux fichiers sous /files/autodoc.<instance>/ ni de mise à jour utile des états.',
		tsDocNotGenerated1: "L'instance autodoc est-elle en cours d'exécution ?",
		tsDocNotGenerated2:
			'Dans Paramètres de base, activer au moins un déclencheur automatique : générer au démarrage, lors des changements d’adaptateur, et/ou un intervalle horaire > 0. Ce sous-paragraphe n’apparaît dans l’export HTML que si les trois sont désactivés au moment de l’export — alors rien ne part tout seul tant que ce n’est pas corrigé.',
		tsDocNotGenerated3: 'Déclencher manuellement : mettre autodoc.0.action.generate = true',
		collectorStatus: 'Statut du collecteur',
		instancesDetected: 'Instances détectées',
		stateObjectsScanned: 'Objets d’état (lus pour cette documentation)',
		nodeVersion: 'Version Node',
		npmVersion: 'Version npm',
		npmVersionHint: 'Rapport hôte ou npm local sur l’hôte de l’instance si absent de la base d’objets.',
		jsControllerVersion: 'Version js-controller',
		osKernel: 'OS / Kernel',
		osArch: 'Architecture',
		nodeVersionOutdated: 'Node.js {0} — version inférieure au LTS recommandé (v20+). Mise à niveau recommandée.',
		nodeVersionOk: 'Node.js {0} — LTS ✓',
		osUpdateHint: "Maintenez le système d'exploitation à jour avec les correctifs de sécurité.",
		aiSummary: 'Résumé IA',
		filterPlaceholder: 'Filtrer...',
		searchPlaceholder: 'Rechercher… (Entrée = suivant)',
		adapterFilterPlaceholder: 'Filtrer les adaptateurs…',
		adapterFilterHint: 'Filtrer par nom, description, Stable/Testé/Expérimental, Local/Cloud, Push/Poll',
		disabledAdaptersGroup: '{0} instances désactivées — afficher',
		scriptFilterPlaceholder: 'Filtrer les scripts…',
		scriptFilterHint: 'Filtrer par nom, objectif de groupe (common.desc), type de déclencheur ou dossier',
		disabledScriptsGroup: '{0} scripts inactifs — afficher',
		stateObjectsSummary: "Résumé des objets d'état",
		total: 'Total',
		writable: 'Inscriptible',
		readOnly: 'Lecture seule',
		collectionInformation: 'Informations de collecte',
		collectedAt: 'Collecté à',
		schemaVersion: 'Version du schéma',
		generatedBy: 'Généré par ioBroker.autodoc v',

		// Catégories de rôles
		catLight: 'Lumière',
		catDimmer: 'Variateur',
		catBlind: 'Volet',
		catThermostat: 'Climat',
		catHumidity: 'Humidité',
		catMotion: 'Mouvement',
		catDoor: 'Porte',
		catWindow: 'Fenêtre',
		catAlarm: 'Alarme',
		catLock: 'Serrure',
		catSwitch: 'Interrupteur',
		catMedia: 'Médias',
		catCamera: 'Caméra',
		catPower: 'Énergie',
		catOther: 'Appareil',

		// Phase 4 — Refonte des profils
		deviceHierarchy: 'Hiérarchie des appareils',
		category: 'Catégorie',
		noDevicesInRoom: 'Aucun appareil assigné à cette pièce.',
		automations: 'Automatisations',
		connectedSystems: 'Systèmes connectés',
		yourRooms: 'Vos pièces',
		tipsAndNotes: 'Conseils & Notes',
		whatCanBeControlled: 'Ce qui peut être contrôlé :',
		whatRunsAutomatically: 'Que se passe-t-il automatiquement ? (moteur de scripts / JavaScript)',
		automationsIntro:
			'Ces fonctions proviennent de scripts JavaScript activés dans ioBroker — elles s’exécutent en arrière-plan ; vous n’avez rien à faire :',
		noActiveScripts:
			'Aucun script JavaScript activé ici. Blockly, d’autres moteurs de règles ou les automatisations dans d’autres adaptateurs ne figurent pas encore dans cette section.',
		roomsHiddenHint: '{0} pièce(s) masquée(s) par configuration.',
		adaptersHiddenHint: '{0} adaptateur(s) masqué(s) par configuration.',
		moreScripts: '{0} scripts supplémentaires (sans description)',
		moreChanges: 'modifications',
		olderEntries: '{0} entrées plus anciennes',
		changelogChange_instance_count: 'Instances d’adaptateur',
		changelogChange_enabled_instances: 'Instances activées',
		changelogChange_state_objects: 'Objets d’état',
		changelogChange_project_name: 'Nom du projet',
		changelogChange_adapter_version: 'Mise à jour adaptateur',
		changelogMsgAdapterVersion: (title, id, prev, curr) =>
			`Adaptateur « ${title} » (${id}) : ${prev || '?'} → ${curr || '?'}`,
		docChangeSinceLastTitle: 'Modifications depuis la dernière génération',
		docChangeSinceLastNote:
			'Comparaison avec l’instantané AutoDoc précédent (indicateurs d’inventaire uniquement — pas la logique d’automatisation complète).',
		docChangeSummaryInitial:
			'Première génération de documentation pour cette instance AutoDoc — aucun instantané précédent à comparer.',
		docChangeSummaryNone: 'Pas de changement d’inventaire notable par rapport à l’instantané précédent.',
		changelogSummaryChangesDetected: n =>
			n === 1
				? '1 changement d’inventaire détecté par rapport à l’instantané précédent.'
				: `${n} changements d’inventaire détectés par rapport à l’instantané précédent.`,
		docChangeSummaryCount: n =>
			n === 1
				? '1 modification par rapport à l’instantané précédent :'
				: `${n} modifications par rapport à l’instantané précédent :`,
		userDocChangeSinceLastPlain:
			'Depuis la dernière fois que cette documentation a été enregistrée pour votre foyer, quelque chose a changé sur votre serveur ioBroker (par exemple une mise à jour d’adaptateur). Les sections ci-dessous décrivent l’état actuel.',
		docTransparencyLimitsShort:
			'Ce document reflète ce qu’AutoDoc peut déduire d’ioBroker. Le firmware des appareils, les clouds fabricants, les moteurs de règles non connectés, les détails Blockly et les automatisations hors sources capturées peuvent être incomplets ou absents.',
		changelogTruncated: '10 entrées affichées sur {0}.',
		onboardingWelcome: name => `Bienvenue dans ${name}`,
		onboardingWelcomeCity: (name, city) => `Bienvenue dans ${name} — ${city}`,
		onboardingIntro: 'Ce document explique comment fonctionne votre maison intelligente.',
		guestHelpTitle: 'Aide & urgences',
		customDocSectionsTitle: 'Sections personnalisées',
		homeRoutinesTitle: 'Routines avec vos mots',
		homeRoutinesIntro: 'Rédigé par les habitants — pas généré automatiquement à partir des scripts.',
		ownerPlaybookTitle: 'Comment on fait tourner la maison',
		ownerPlaybookIntro:
			'Votre mode d’emploi — ordre habituel, indispensables et ce qu’il ne faut pas modifier. Rédigé par les habitants ; pas généré automatiquement.',
		mermaidDiagramTitle: 'Schéma (Mermaid)',
		mermaidDiagramIntro:
			'Diagramme issu des paramètres de documentation (Mermaid). L’export HTML intègre du SVG si le paquet optionnel @mermaid-js/mermaid-cli est installé ; sinon le navigateur charge Mermaid via jsDelivr. Le Markdown conserve la source pour les lecteurs compatibles Mermaid. Astuce : flowchart LR (gauche → droite) utilise mieux la largeur qu’une chaîne verticale.',
		mermaidAutoTopologyTitle: 'Topologie des hôtes (automatique)',
		mermaidAutoTopologyMdHint: "Auto-topologie disponible uniquement dans l'export HTML (profil Admin).",
		mermaidAutoTopologyIntro:
			'Instances d’adaptateurs regroupées par hôte ioBroker, avec un nombre maximal de nœuds pour la lisibilité. Mise en page horizontale pour utiliser la largeur de page. Ce n’est pas un schéma complet des liaisons ou dépendances. Masquez avec l’id de chapitre mermaid (comme pour votre schéma Mermaid personnel).',
		troubleshootPublicLinksIntro:
			'Ces pages se mettent à jour quand la doc est regénérée — gardez ou partagez le lien utile.',
		troubleshootPublicLinksHeading: 'Liens favoris',
		troubleshootLinkAdmin: 'Documentation technique (admin)',
		troubleshootLinkUser: 'Doc quotidienne / famille',
		troubleshootLinkOnboarding: 'Vue invité / simple',
		troubleshootQuickFactsTitle: 'L’essentiel',
		troubleshootWifiLabel: 'Wi‑Fi / réseau',
		troubleshootPowerLabel: 'Électricité / disjoncteurs',
		troubleshootWaterLabel: 'Coupure d’eau',
		troubleshootExtraLabel: 'Autre',
		troubleshootSnapshotDisclaimer:
			'Instantané à la génération de cette page — pas une surveillance en direct. Détail pour la personne qui entretient le système.',
		troubleshootSnapshotNodeTitle: 'Le logiciel serveur peut nécessiter une mise à jour',
		troubleshootSnapshotNodeStep1:
			'Demandez à la personne qui gère cette maison connectée (ou à l’hébergeur) de vérifier la version du logiciel.',
		troubleshootSnapshotNodeStep2:
			'Elle peut suivre les recommandations officielles ioBroker / Node.js (versions supportées) — cette page ne met rien à jour.',
		troubleshootSnapshotNodeStep3:
			'En attendant, tout peut fonctionner ; rester sur une version ancienne ou non LTS peut limiter les correctifs de sécurité.',
		onboardingHintTitle: 'Conseil : Améliorez cette page !',
		onboardingHintText:
			"Ajoutez une description et des notes de maison dans les paramètres de l'adaptateur (Contexte manuel) pour que les invités et les membres de la famille reçoivent une introduction personnalisée.",
		scanToShare: 'Partager cette page',
		copyLink: 'Copier le lien',
		copied: 'Copié !',
		devices: 'Appareils',
		darkMode: 'Mode sombre',
		lightMode: 'Mode clair',
		adaptersActive: 'actifs',
		staleDocsWarning: 'Cette documentation pourrait être obsolète.',
		staleDocsWeek: 'Documentation vieille de plus de 7 jours.',
		staleDocsOld: 'Documentation vieille de plus de 30 jours — veuillez régénérer.',
		pendingUpdates: 'Mises à jour disponibles',
		lastBackup: 'Dernière sauvegarde',
		today: "aujourd'hui",
		yesterday: 'hier',
		location: 'Emplacement',
		city: 'Ville',
		timezone: 'Fuseau horaire',
		tempUnit: 'Unité de température',
		uptime: 'Temps de fonctionnement',
		type: 'Type',
		value: 'Valeur',
		userDefinedVariables: 'Variables personnalisées',
		userDataDesc: "Points de données sous 0_userdata.0 — variables et valeurs créées par l'utilisateur.",
		aliases: 'Alias',
		aliasesDesc:
			'Les alias rendent des points de données étrangers accessibles sous un nom personnalisé (alias.0.*).',
		aliasTarget: 'Cible',
		scoreDesc:
			'Trois scores distincts indiquent : **dans quelle mesure** autodoc a pu lire les données, **quel contenu** vous avez fourni, et **quelle profondeur** a la documentation. Le score global est la moyenne des trois.',
		totalSuffix: 'total',
		ramSystemTooltip: 'RAM utilisé / total du système',
		ramAdapterTooltip: "Somme de tous les processus ioBroker (js-controller + toutes les instances d'adaptateurs)",
		ramHostTooltip:
			"Processus hôte ioBroker uniquement (js-controller). Les instances d'adaptateurs sont des processus séparés.",
		allAdapters: 'tous les adaptateurs',
		scriptHasScheduleTitle: 'Script planifié (cron)',
		noNotesYet:
			"Aucune note spéciale n'a encore été ajoutée pour cette maison intelligente. N'hésitez pas à explorer!",
		onboardingSetupHint:
			"Conseil pour les administrateurs : ajoutez une description, un contact et des notes dans les paramètres de l'adaptateur → « Ma documentation ».",
		onboardingCapabilities: 'Que peut faire cette maison intelligente ?',
		onboardingCapabilitiesDesc: 'Ces domaines sont configurés et contrôlables dans votre maison intelligente :',
		justNow: "à l'instant",
		minutesAgo: 'min. passées',
		hoursAgo: 'h passées',
		daysAgo: 'jours passés',
		cronEvery: 'toutes les',
		cronDaily: 'quotidien',
		cronHourly: 'toutes les heures',
		cronAt: 'à',
		cronMon: 'Lun',
		cronTue: 'Mar',
		cronWed: 'Mer',
		cronThu: 'Jeu',
		cronFri: 'Ven',
		cronSat: 'Sam',
		cronSun: 'Dim',
		availableFunctions: 'Zones contrôlables dans toute la maison :',
		showFunctions: 'Afficher les fonctions',
		processOnly: 'processus',
		searchPrev: 'Résultat précédent',
		searchNext: 'Résultat suivant',
		searchHint: '↑↓ naviguer · Échap = effacer',
		activeRepo: 'Dépôt',
	},
};

/**
 * Internationalization helper for AutoDoc translations.
 */
class I18n {
	/**
	 * Initialize with default language.
	 */
	constructor() {
		this.currentLanguage = 'en';
	}

	/**
	 * Set the current language for translations
	 *
	 * @param {string} lang Language code (e.g., 'en', 'de', 'fr')
	 */
	setLanguage(lang) {
		if (translations[lang]) {
			this.currentLanguage = lang;
		} else {
			// Fallback to English if language not found
			this.currentLanguage = 'en';
		}
	}

	/**
	 * Get a translated string
	 *
	 * @param {string} key Translation key
	 * @param {*} args Optional arguments for template functions
	 * @returns {string} Translated string or key if not found
	 */
	t(key, ...args) {
		const lang = translations[this.currentLanguage];
		if (!lang || !lang[key]) {
			// Fallback to English
			const enLang = translations.en;
			if (enLang[key]) {
				const value = enLang[key];
				return typeof value === 'function' ? value(...args) : value;
			}
			return key;
		}

		const value = lang[key];
		return typeof value === 'function' ? value(...args) : value;
	}

	/**
	 * Get available languages
	 *
	 * @returns {string[]} Array of language codes
	 */
	getAvailableLanguages() {
		return Object.keys(translations);
	}
}

module.exports = I18n;
