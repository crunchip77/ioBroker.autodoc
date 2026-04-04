# AutoDoc Adapter - TODO-Liste

## Wichtige Referenzen
- [ioBroker AI Developer Guide](https://github.com/Jey-Cee/iobroker-ai-developer-guide) - Best Practices für saubere Adapter-Entwicklung konsultieren und befolgen
- [Adapter Creator](https://github.com/ioBroker/create-adapter) - Offizielles Tool für neue Adapter
- [Adapter Checker](https://adapter-check.iobroker.in/) - Validierung vor Einreichung

## 🏆 FINAL FEATURE-SET (Priorisiert)

### Must-Have (v1.0): ✅ VOLLSTÄNDIG
- [x] 3 Profile (Admin, User, Onboarding) implementieren
- [x] Markdown + HTML Export
- [x] Automatische Discovery (Adapter, States, System)
- [x] 4-5 Kernkapitel strukturieren
- [x] Manuelle Ergänzungen aus Konfiguration
- [x] Versionsverfolgung mit Diff-Funktion
- [x] Automatische Generierung (zeitgesteuert + event-basiert)

### Should-Have (v1.x):
- [ ] Adapter-Integrationen (Backup, History, Notification)
- [ ] Mehrsprachigkeit (Templates + UI)
- [ ] Developer API (REST + Webhooks)

### Nice-to-Have (v2.x):
- [ ] PDF-Export
- [ ] Templates/Customization
- [ ] Troubleshooting-Assistent
- [ ] Analytics (Nutzungsstatistiken)

### Never (zu komplex):
- ❌ Mermaid-Diagramme
- ❌ Kollaborative Features
- ❌ Mobile-App

## Priorität 1: Basis umsetzen (Must-Have Foundation) ✅ TEILWEISE ABGESCHLOSSEN
- [x] `main.js` so anpassen, dass komplette Dokumente nicht als große States gespeichert werden
- [x] Datei-Export implementieren: Markdown und HTML nach `/files/<adaptername>/`
- [x] `admin/jsonConfig.json5` mit grundlegender Konfiguration anlegen
- [x] `admin/i18n/en.json` und `admin/i18n/de.json` für UI-Texte erstellen
- [x] `info.connection` korrekt setzen
- [x] Logs auf Englisch umstellen
- [x] `lib/` anlegen und erste Module einrichten
  - [x] `lib/discovery.js`
  - [x] `lib/documentModel.js`
  - [x] `lib/markdownRenderer.js`

## Priorität 2: Kernfeatures (Must-Have Core) ✅ ABGESCHLOSSEN
- [x] 3 Zielgruppenprofile im Adapter-Code definieren (Admin, User, Onboarding)
- [x] Profil-basiertes Rendering implementieren (markdownRenderer.js)
- [x] Kapitelstruktur mit 4-5 Kernkapiteln umsetzen (TOC per Profil in markdownRenderer)
- [x] Manual Context aus Konfiguration einbinden (config.manualContext JSON-Feld)
- [x] Filteroptionen (`onlyEnabledInstances`, `maxDocumentedInstances`) verwenden
- [x] Versionsverfolgung der generierten Dokumente (Diff + Historie via versionTracker.js)
- [x] Automatische Generierung: `autoGenerateOnStart` + zeitgesteuert (`autoGenerateInterval`)
- [x] Event-basierte Generierung (nach Adapter-Änderungen, `autoGenerateOnEvents` + 30s Debounce)

## Priorität 3: Integrationen (Should-Have)
- [ ] Backup-Adapter Integration: Doku mit Backup speichern
- [ ] History-Adapter Integration: Längere Historie
- [ ] Notification-Adapter Integration: Benachrichtigung bei neuer Doku
- [ ] Mehrsprachige Templates implementieren
- [ ] Automatische Spracherkennung
- [ ] Developer API (REST-API für andere Adapter)
- [ ] Webhook-Support für Integrationen

## Priorität 4: Erweiterungen (Nice-to-Have)
- [x] HTML-Export mit Navigation und Basis-Layout
- [ ] PDF-Export (optional)
- [ ] Templates/Customization System
- [ ] Troubleshooting-Assistent
- [ ] Analytics: Nutzungsstatistiken
- [ ] Raum-basierte Dokumentation
- [ ] Geräte-Gruppierungen
