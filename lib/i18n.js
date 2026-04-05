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
		appendices: 'Appendices',

		// System Chapter
		projectInformation: 'Project Information',
		projectName: 'Project Name',
		targetSystem: 'Target System',
		primaryHost: 'Primary Host',
		name: 'Name',
		platform: 'Platform',
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
		scriptStatus: 'Status',
		scriptTrigger: 'Trigger',
		scriptDescription: 'Description',
		noScriptsDefined: 'No scripts found (script adapter may not be installed).',
		active: 'active',
		inactive: 'inactive',

		// Maintenance Chapter
		maintenance: 'Maintenance & Diagnostics',
		maintenanceChecklist: 'Documentation Checklist',
		documentationScore: 'Documentation Score',
		instancesWithoutRoom: 'Instances without room assignment',
		scriptsWithoutDescription: 'Scripts without description',
		disabledInstancesHint: 'Disabled instances',
		allGood: 'Everything looks good.',
		checkOk: 'OK',
		checkIssue: 'Needs attention',

		// Adapters Chapter
		overview: 'Overview',
		totalAdapters: 'Total Adapters',
		totalInstances: 'Total Instances',
		adapterDetails: 'Adapter Details',
		instanceDetails: 'Instance Details',
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
		activeAdapters: 'Active Adapters',
		nextSteps: 'Next Steps',
		nextStepsReview: 'Review your installed adapters below',
		nextStepsManual: 'Check the manual information section for guidance',
		nextStepsAdapters: 'Most adapters run automatically — no configuration needed',

		// Rooms / Functions filter
		members: 'Members',
		noRoomsMatch: 'No rooms match your filter.',
		noFunctionsMatch: 'No functions match your filter.',

		// Scripts filter & dependency analysis
		noScriptsMatch: 'No scripts match your filter.',
		stateReferences: 'State References',
		stateReferencesDesc: 'States referenced by scripts (detected via static analysis).',
		script: 'Script',
		referencedStates: 'Referenced States',
		sharedStates: 'Shared States',
		sharedStatesDesc: 'States used by more than one script.',
		stateId: 'State ID',
		usedByScripts: 'Used by Scripts',
		noSharedStatesMatch: 'No shared states match your filter.',

		// Diagnosis section
		diagnosis: 'Diagnosis',
		diagScanStatus: 'Scan Status',
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
		diagFindings: 'Findings from this scan',
		diagFindingDisabled: n => `${n} adapter instance(s) are disabled — check if intentional`,
		diagFindingScripts: n => `${n} script(s) have no description — harder to maintain later`,
		diagFindingNone: 'No issues found in this scan.',
		// Troubleshooting section
		troubleshooting: 'Troubleshooting',
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
		tsDocNotGenerated: 'Documentation is not being generated automatically',
		tsDocNotGeneratedSymptom: 'Symptom: no new files in /files/autodoc.0/, no state update',
		tsDocNotGenerated1: 'Is the autodoc adapter instance running?',
		tsDocNotGenerated2: 'Check trigger settings: auto-start, interval, event-based',
		tsDocNotGenerated3: 'Trigger manually: set autodoc.0.action.generate = true',
		collectorStatus: 'Collector Status',
		instancesDetected: 'Instances detected',
		stateObjectsScanned: 'State objects scanned',
		nodeVersion: 'Node Version',

		// AI section
		aiSummary: 'AI Summary',

		// Search / filter UI
		filterPlaceholder: 'Filter...',
		adapterFilterPlaceholder: 'Filter adapters…',
		disabledAdaptersGroup: '{0} disabled instances — show',

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
		whatRunsAutomatically: 'What runs automatically?',
		automationsIntro: "These automations run in the background — you don't need to do anything:",
		onboardingWelcome: name => `Welcome to ${name}`,
		onboardingWelcomeCity: (name, city) => `Welcome to ${name} — ${city}`,
		onboardingIntro: 'This document explains how your smart home works.',
		onboardingHintTitle: 'Tip: Make this page even better!',
		onboardingHintText:
			'Add a description and house notes in the adapter settings (Manual Context) so that guests and family members get a personal introduction.',
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
		appendices: 'Anhänge',

		// System Chapter
		projectInformation: 'Projektinformationen',
		projectName: 'Projektname',
		targetSystem: 'Zielsystem',
		primaryHost: 'Primärer Host',
		name: 'Name',
		platform: 'Plattform',
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
		scriptStatus: 'Status',
		scriptTrigger: 'Auslöser',
		scriptDescription: 'Beschreibung',
		noScriptsDefined: 'Keine Skripte gefunden (Script-Adapter möglicherweise nicht installiert).',
		active: 'aktiv',
		inactive: 'inaktiv',

		// Maintenance Chapter
		maintenance: 'Wartung & Diagnose',
		maintenanceChecklist: 'Dokumentations-Checkliste',
		documentationScore: 'Dokumentations-Score',
		instancesWithoutRoom: 'Instanzen ohne Raumzuweisung',
		scriptsWithoutDescription: 'Skripte ohne Beschreibung',
		disabledInstancesHint: 'Deaktivierte Instanzen',
		allGood: 'Alles sieht gut aus.',
		checkOk: 'OK',
		checkIssue: 'Handlungsbedarf',

		// Adapters Chapter
		overview: 'Übersicht',
		totalAdapters: 'Gesamt Adapter',
		totalInstances: 'Gesamt Instanzen',
		adapterDetails: 'Adapter-Details',
		instanceDetails: 'Instanz-Details',
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
		activeAdapters: 'Aktive Adapter',
		nextSteps: 'Nächste Schritte',
		nextStepsReview: 'Überprüfen Sie Ihre installierten Adapter unten',
		nextStepsManual: 'Lesen Sie den Abschnitt Manuelle Informationen für Hinweise',
		nextStepsAdapters: 'Die meisten Adapter laufen automatisch – keine Konfiguration nötig',

		// Rooms / Functions filter
		members: 'Mitglieder',
		noRoomsMatch: 'Keine Räume entsprechen dem Filter.',
		noFunctionsMatch: 'Keine Funktionen entsprechen dem Filter.',

		// Scripts filter & dependency analysis
		noScriptsMatch: 'Keine Skripte entsprechen dem Filter.',
		stateReferences: 'State-Referenzen',
		stateReferencesDesc: 'Von Skripten referenzierte States (statische Analyse).',
		script: 'Skript',
		referencedStates: 'Referenzierte States',
		sharedStates: 'Gemeinsame States',
		sharedStatesDesc: 'States, die von mehreren Skripten verwendet werden.',
		stateId: 'State-ID',
		usedByScripts: 'Verwendet von Skripten',
		noSharedStatesMatch: 'Keine gemeinsamen States entsprechen dem Filter.',

		// Diagnosis section
		diagnosis: 'Diagnose',
		diagScanStatus: 'Erfassungsstatus',
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
		diagFindings: 'Befunde aus diesem Scan',
		diagFindingDisabled: n => `${n} Adapter-Instanz(en) sind deaktiviert — prüfen ob gewollt`,
		diagFindingScripts: n => `${n} Skript(e) haben keine Beschreibung — Wartung später schwieriger`,
		diagFindingNone: 'Keine Auffälligkeiten in diesem Scan.',
		// Fehlerbehebung
		troubleshooting: 'Fehlerbehebung',
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
		tsDocNotGenerated: 'Dokumentation wird nicht automatisch erstellt',
		tsDocNotGeneratedSymptom: 'Symptom: keine neuen Dateien in /files/autodoc.0/, kein State-Update',
		tsDocNotGenerated1: 'Läuft die autodoc-Adapter-Instanz?',
		tsDocNotGenerated2: 'Trigger-Einstellungen prüfen: Auto-Start, Intervall, Event-basiert',
		tsDocNotGenerated3: 'Manuell auslösen: autodoc.0.action.generate = true setzen',
		collectorStatus: 'Collector-Status',
		instancesDetected: 'Erkannte Instanzen',
		stateObjectsScanned: 'Gescannte State-Objekte',
		nodeVersion: 'Node-Version',

		// AI section
		aiSummary: 'KI-Zusammenfassung',

		// Search / filter UI
		filterPlaceholder: 'Filter...',
		adapterFilterPlaceholder: 'Adapter filtern…',
		disabledAdaptersGroup: '{0} deaktivierte Instanzen — anzeigen',

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
		whatRunsAutomatically: 'Was läuft automatisch?',
		automationsIntro: 'Diese Automatisierungen laufen im Hintergrund – du musst nichts tun:',
		onboardingWelcome: name => `Willkommen bei ${name}`,
		onboardingWelcomeCity: (name, city) => `Willkommen bei ${name} – ${city}`,
		onboardingIntro: 'Dieses Dokument erklärt, wie dein Smart Home funktioniert.',
		onboardingHintTitle: 'Tipp: Mach diese Seite noch besser!',
		onboardingHintText:
			'Füge in den Adapter-Einstellungen eine Beschreibung und Haushinweise hinzu (Manueller Kontext), damit Gäste und Familienmitglieder eine persönliche Einführung bekommen.',
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
		appendices: 'Appendices',
		projectInformation: 'Informations du projet',
		projectName: 'Nom du projet',
		targetSystem: 'Système cible',
		primaryHost: 'Hôte principal',
		name: 'Nom',
		platform: 'Plateforme',
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
		scriptStatus: 'Statut',
		scriptTrigger: 'Déclencheur',
		scriptDescription: 'Description',
		noScriptsDefined: "Aucun script trouvé (l'adaptateur script n'est peut-être pas installé).",
		active: 'actif',
		inactive: 'inactif',

		// Maintenance Chapter
		maintenance: 'Maintenance & Diagnostics',
		maintenanceChecklist: 'Liste de contrôle de documentation',
		documentationScore: 'Score de documentation',
		instancesWithoutRoom: 'Instances sans pièce assignée',
		scriptsWithoutDescription: 'Scripts sans description',
		disabledInstancesHint: 'Instances désactivées',
		allGood: 'Tout semble bon.',
		checkOk: 'OK',
		checkIssue: 'À corriger',

		overview: 'Aperçu',
		totalAdapters: "Nombre total d'adaptateurs",
		totalInstances: "Nombre total d'instances",
		adapterDetails: "Détails de l'adaptateur",
		instanceDetails: "Détails de l'instance",
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
		activeAdapters: 'Adaptateurs actifs',
		nextSteps: 'Prochaines étapes',
		nextStepsReview: 'Consultez vos adaptateurs installés ci-dessous',
		nextStepsManual: 'Consultez la section informations manuelles',
		nextStepsAdapters: 'La plupart des adaptateurs fonctionnent automatiquement — aucune configuration nécessaire',
		members: 'Membres',
		noRoomsMatch: 'Aucune pièce ne correspond au filtre.',
		noFunctionsMatch: 'Aucune fonction ne correspond au filtre.',
		noScriptsMatch: 'Aucun script ne correspond au filtre.',
		stateReferences: "Références d'état",
		stateReferencesDesc: 'États référencés par des scripts (détectés par analyse statique).',
		script: 'Script',
		referencedStates: 'États référencés',
		sharedStates: 'États partagés',
		sharedStatesDesc: "États utilisés par plus d'un script.",
		stateId: "ID d'état",
		usedByScripts: 'Utilisé par des scripts',
		noSharedStatesMatch: 'Aucun état partagé ne correspond au filtre.',
		diagnosis: 'Diagnostic',
		diagScanStatus: 'Statut de collecte',
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
		diagFindings: 'Résultats de ce scan',
		diagFindingDisabled: n => `${n} instance(s) d'adaptateur désactivée(s) — vérifier si intentionnel`,
		diagFindingScripts: n => `${n} script(s) sans description — maintenance plus difficile ensuite`,
		diagFindingNone: 'Aucun problème détecté dans ce scan.',
		// Dépannage
		troubleshooting: 'Dépannage',
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
		tsDocNotGenerated: "La documentation n'est pas générée automatiquement",
		tsDocNotGeneratedSymptom: 'Symptôme : pas de nouveaux fichiers dans /files/autodoc.0/, pas de mise à jour',
		tsDocNotGenerated1: "L'instance autodoc est-elle en cours d'exécution ?",
		tsDocNotGenerated2: 'Vérifier les paramètres de déclenchement : démarrage auto, intervalle, événement',
		tsDocNotGenerated3: 'Déclencher manuellement : mettre autodoc.0.action.generate = true',
		collectorStatus: 'Statut du collecteur',
		instancesDetected: 'Instances détectées',
		stateObjectsScanned: "Objets d'état scannés",
		nodeVersion: 'Version Node',
		aiSummary: 'Résumé IA',
		filterPlaceholder: 'Filtrer...',
		adapterFilterPlaceholder: 'Filtrer les adaptateurs…',
		disabledAdaptersGroup: '{0} instances désactivées — afficher',
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
		whatRunsAutomatically: "Qu'est-ce qui fonctionne automatiquement ?",
		automationsIntro: "Ces automatisations fonctionnent en arrière-plan — vous n'avez rien à faire :",
		onboardingWelcome: name => `Bienvenue dans ${name}`,
		onboardingWelcomeCity: (name, city) => `Bienvenue dans ${name} — ${city}`,
		onboardingIntro: 'Ce document explique comment fonctionne votre maison intelligente.',
		onboardingHintTitle: 'Conseil : Améliorez cette page !',
		onboardingHintText:
			"Ajoutez une description et des notes de maison dans les paramètres de l'adaptateur (Contexte manuel) pour que les invités et les membres de la famille reçoivent une introduction personnalisée.",
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
