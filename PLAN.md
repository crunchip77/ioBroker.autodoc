# AutoDoc Adapter - Projektplan

## 📊 FEATURE-ANALYSE: AutoDoc Adapter (Final Version)

### 🎯 Aktueller Plan ist GUT - aber hier sind Verbesserungen:

#### ✅ Was bleiben sollte (Kernwert):
- 4 Zielgruppen-Profile ✓ (unbedingt behalten)
- Automatische Discovery ✓ (Alleinstellungsmerkmal)
- Kapitelstruktur ✓ (macht es intelligent)
- Manuelle Ergänzungen ✓ (für Individualität)

#### ❌ Was du weglassen solltest:
- Mermaid-Diagramme → Zu komplex, Nice-to-have
- PDF von Anfang an → HTML reicht, PDF später
- Zu viele Kapitel → 7 sind zu viel, 4-5 reichen

#### 🔍 WICHTIGE FEATURES DIE FEHLEN:
1. **Versionsverfolgung** ⭐⭐⭐
   - Diff zwischen Dokumentationen
   - "Was hat sich geändert?"
   - Historie mit Zeitstempeln

2. **Automatische Generierung** ⭐⭐⭐
   - Zeitgesteuert (cron-like)
   - Event-basiert (nach Adapter-Änderungen)
   - Backup-Integration

3. **Adapter-Integrationen** ⭐⭐
   - Backup-Adapter: Doku mit Backup speichern
   - History-Adapter: Längere Historie
   - Notification-Adapter: Benachrichtigung bei neuer Doku

4. **Mehrsprachigkeit** ⭐⭐
   - Automatische Spracherkennung
   - Lokalisierte Templates
   - Internationaler Appeal

5. **API für Entwickler** ⭐⭐
   - REST-API für andere Adapter
   - SDK für Integration
   - Webhook-Support

#### 💡 NEUE FEATURE-IDEEEN (Nice-to-have):
**Smart Home Fokus:**
- Raum-basierte Dokumentation
- Alexa/Google Home Integration
- Geräte-Gruppierungen

**Troubleshooting:**
- Automatische Fehleranalyse
- Health-Check Integration
- Problemlösungsvorschläge

**Analytics:**
- Nutzungsstatistiken
- Adapter-Popularität
- System-Health-Trends

#### 🏆 EMPFOHLENES FINAL FEATURE-SET:

**Must-Have (v1.0):**
- ✅ 3 Profile (Admin, User, Onboarding)
- ✅ Markdown + HTML
- ✅ Automatische Discovery
- ✅ 4-5 Kernkapitel
- ✅ Manuelle Ergänzungen
- ✅ Versionsverfolgung
- ✅ Automatische Generierung

**Should-Have (v1.x):**
- ✅ Adapter-Integrationen
- ✅ Mehrsprachigkeit
- ✅ Developer API

**Nice-to-Have (v2.x):**
- PDF-Export
- Templates/Customization
- Troubleshooting-Assistent
- Analytics

**Never (zu komplex):**
- ❌ Mermaid-Diagramme
- ❌ Kollaborative Features
- ❌ Mobile-App

## Technische Grundlagen
- **Sprache**: JavaScript (gewählt beim ioBroker Creator - Standard und empfohlen)
- **Admin UI**: JSON/jsonConfig (gewählt beim ioBroker Creator - gute Wahl für Konfiguration)
- **Framework**: @iobroker/create-adapter v3.1.2
- **Node.js**: Version 22
- **Anpassbarkeit**: Sprache und Admin-UI können später noch geändert werden, erfordert aber Refaktorierung

### Anmerkung zu ioBroker Creator Wahl:
- **JavaScript**: ✅ Perfekt für ioBroker Adapter - keine Probleme
- **JSON Admin UI**: ✅ Gute Wahl - einfach zu handhaben, ausreichend für unsere Bedürfnisse
- **Fallback Optionen**: Bei Bedarf kann später auf React UI gewechselt werden, aber JSON reicht für v1.0

## Kernfeatures
- Automatische Discovery von Adapterinstanzen, Hosts, Systemmetadaten und State-Objekten
- Generierung von Dokumentation per Button / Aktion
- Export als Markdown und HTML
- Vier Zielgruppenprofile: admin, familie, gaeste, onboarding
- Strukturierte Kapitel: Projekt, System, Adapter, Anhang
- Manuelle Ergänzungen aus Konfiguration
- Dateiausgabe über ioBroker `/files`, keine großen Dokumente als State-Strings speichern
- Versionsverfolgung / Historie der Dokumentation
- Optional: automatische, zeitgesteuerte Generierung

## Wichtige Referenzen
- [ioBroker AI Developer Guide](https://github.com/Jey-Cee/iobroker-ai-developer-guide) - Best Practices für saubere Adapter-Entwicklung
- [Adapter Creator](https://github.com/ioBroker/create-adapter) - Offizielles Tool für neue Adapter
- [Adapter Checker](https://adapter-check.iobroker.in/) - Validierung vor Einreichung

## Repository-Status
- **GitHub Repository**: [crunchip77/ioBroker.autodoc](https://github.com/crunchip77/ioBroker.autodoc)
- **Aktueller Stand**: Der Code vor Beginn der Refaktorierung ist bereits im GitHub-Repository committet
- **Branch-Strategie**: Hauptentwicklung auf `main` branch, feature branches für größere Änderungen
- **Versionierung**: Semantic versioning (v1.0.0 für erste stabile Version)

## Entwicklungs-Umgebung
- **IDE**: Visual Studio Code auf Windows-Rechner
- **Testsystem**: ioBroker läuft auf Unraid-Server (separat vom Produktivsystem)
- **Lokaler Testserver**: Nicht vorhanden auf Windows-Rechner
- **Deployment-Workflow**: 
  1. Entwicklung in VS Code
  2. Push zu GitHub-Repository
  3. Installation/Test vom Unraid-Testsystem aus
- **Test-Setup**: Adapter wird über GitHub-Installation auf Test-iobroker getestet

## Phase 1 - MVP
1. Stabilisierung der aktuellen Discovery-Logik
2. Umstellung auf filebasierten Export statt Dokumente in States
3. English logging und ioBroker Creator Compliance überprüfen
4. Modularisierung: `lib/` für Discovery, Modell, Rendering
5. Markdown Rendering mit einer einfachen Kapitelstruktur
6. `admin/jsonConfig.json5` + i18n für Konfiguration

## Phase 2 - Ausbau
1. Profil-konformes Rendering für mindestens admin und ein allgemeines User-Profil
2. HTML-Rendering mit Navigation
3. Konfiguration von Filtern und Ausgabeoptionen
4. Versionshistorie und Dokumentations-Historie speichern
5. Automatische Generierung (timer / events)

## Phase 3 - Erweiterung
1. Vollständige Zielgruppenprofile für `familie`, `gaeste` und `onboarding`
2. Mehrsprachigkeit in Templates
3. API / Webhook-Schnittstelle für andere Adapter
4. Optionaler PDF-Export
5. Erweiterte Dokumentvorlagen / Customization

## Nicht für v1.0
- Mermaid-Diagramme
- Mobile App
- Collaboration-Features
- PDF als Pflichtformat

## Erfolgskriterien für v1.0
- Funktionierender Knopfdruck-Export
- Markdown-Datei wird zuverlässig erzeugt und gespeichert
- Admin UI zur Konfiguration vorhanden
- Adapter ist ioBroker-kompatibel und prüfbar
- Modulstruktur statisch und testbar
