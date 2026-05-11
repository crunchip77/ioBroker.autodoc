# AutoDoc — Kurzanleitung (erste Schritte)

Orientierung für **Betreuer** und **Admins**, die den Adapter über das **[GitHub-Repository](https://github.com/crunchip77/ioBroker.autodoc)** installieren. Ausführliche Hilfe zu jedem Feld liefert weiterhin die **Inline-Hilfe** in der ioBroker-Admin-Oberfläche (`jsonConfig`); technische Grundlagen stehen im **[README (EN)](../../README.md)**.

**Abbildungen:** Wo ein **SVG** existiert, steht es **immer vor** dem zugehörigen **Screenshot**: Das Schema verdeutlicht die Tab-Logik, der Screenshot zeigt das reale Admin-Layout — das ist so gewollt. Hinweise zur Lesbarkeit in der eingebetteten Vorschau: **[`SCREENSHOTS.md`](assets/SCREENSHOTS.md)** („Lesbarkeit“). Aufnahmen und Datenschutz: ebenda.

**Englische Kurzfassung:** [`README.md`](README.md).

---

## Voraussetzungen

- **Node.js** ≥ 22  
- **Systemvoraussetzungen** wie im Haupt-[README](../../README.md) beschrieben (JS-Controller, Admin-Version).

---

## Installation (URL / Clone)

**npm:** Paket **[`iobroker.autodoc`](https://www.npmjs.com/package/iobroker.autodoc)** — zusätzlich wie gewohnt **„Installieren aus URL“** / Git oder (nach Merge des **repositories**-PRs) die **Standard-Adapterliste** im Admin (**aktuell:** PR offen). Die **Standardlisten** kommen aus **[ioBroker.repositories](https://github.com/ioBroker/ioBroker.repositories)**.

Nach dem Anlegen der Instanz: **Instanzen → autodoc.0 → Konfiguration öffnen** (Schraubenschlüssel).

---

## Registerkartenüberblick — was ist zuerst dran?

1. **Grundeinstellungen** — Projektname, **Sprache** der erzeugten Doku, welches Markdown-Profil standardmäßig **exportiert** wird; **Auslöser** (bei Start, zeitgesteuert, bei Adapteränderungen, …).
2. **Meine Dokumentation** — **eigene** Texte für Familie und Gäste (Notfallhilfe, Abläufe, Playbook); optionale Kurzzeilen (WLAN/Strom/Wasser); optional ein **selbst verfasstes Mermaid-Diagramm** sowie die Auto-Host-Topologie.
3. **Erweitert** — Basis-URL (für **QR-Codes und Links** im Onboarding-HTML), **`documentationStatesMode`** (`full` vs. `metadata`), optionaler **Dateisystem-Export**, optional **PDF nach jedem Lauf** (**`puppeteer`** im Adapterordner), Schwellen für den Wartungs-Score, …
4. **HTML & Zusatzkapitel** — Kapitel ausblenden, **Reihenfolge**, **freie Markdown-Zusatzkapitel**, Theme; im **Einleitungstext** dieses Tabs ein kurzer Verweis auf **PDF** (Schalter unter **Erweitert**).
5. **Benachrichtigungen** — optional Benachrichtigung nach erzeugter Doku, z. B. per Telegram, Pushover oder E-Mail (vom gewählten Messaging-Adapter abhängig).
6. **KI-Dokumentation** — nur bei **gewähltem Anbieter** relevant; wenn **„Deaktiviert“** gewählt ist, bleiben die Hinweise und Kontrollkästchen oben **ohne** KI-Funktion.

Nach Änderungen: **Dokumentation generieren** (Button / Datenpunkt **`action.generate`**) oder eingerichteten Cron abwarten.

### Abbildungen

**SVGs** und **Screenshots** pro Tab gehören **zusammen**: Das **SVG** fasst Tabs und Felder **schematisch** zusammen (**kein** pixelgenaues UI), der **PNG** zeigt dieselbe Stelle der **echten Oberfläche** (Demo). In GitHub wirken eingebettete Bilder oft klein — **Bild anklicken** („Open image in new tab“) oder die Seite zoomen, um Text mitzulesen.

![Grundeinstellungen — überblicksartiges Schema](assets/fig-tab-grundeinstellungen.svg)

*Echte Admin-Oberfläche (Demo-Instanz; je nach Theme/Version abweichend):*

![Grundeinstellungen — Screenshot](assets/screen-grundeinstellungen-admin.png)

*Aufnahme: AutoDoc **0.9.36**, ioBroker Admin **≥ 7.6.20** (Stand **2026-05**).*

![Meine Dokumentation — Freitext- und Diagrammbereiche (Schema)](assets/fig-tab-meine-dokumentation.svg)

*Echte Admin-Oberfläche — **Meine Dokumentation** ist ein langer Scroll; vier Screenshots **von oben nach unten** (Demo):*

**1/4 —** Projekt, Kontakt & Hinweise; Hilfe & Abläufe (Klartext).

![Meine Dokumentation — Screenshot (1/4)](assets/screen-meine-dokumentation-admin.png)

*Aufnahme: AutoDoc **0.9.36**, ioBroker Admin **≥ 7.6.20** (Stand **2026-05**).*

**2/4 —** Playbook, optionales **Mermaid**-Diagramm, automatische Host-Topologie, Notfall-Kurzzeilen (WLAN/Strom/Wasser).

![Meine Dokumentation — Screenshot (2/4)](assets/screen-meine-dokumentation-admin-2.png)

*Aufnahme: AutoDoc **0.9.36**, ioBroker Admin **≥ 7.6.20** (Stand **2026-05**).*

**3/4 —** Kurzzeile Sonstiges (optional); Adapter- und Raum-Notizen.

![Meine Dokumentation — Screenshot (3/4)](assets/screen-meine-dokumentation-admin-3.png)

*Aufnahme: AutoDoc **0.9.36**, ioBroker Admin **≥ 7.6.20** (Stand **2026-05**).*

**4/4 —** Räume/Adapter pro Profil ausblenden (Onboarding vs. User/Familie); Anzeige interner JavaScript-Dateinamen für Gäste.

![Meine Dokumentation — Screenshot (4/4)](assets/screen-meine-dokumentation-admin-4.png)

*Aufnahme: AutoDoc **0.9.36**, ioBroker Admin **≥ 7.6.20** (Stand **2026-05**).*

![Erweitert — Basis-URL und Hinweise (Schema, Beispieldomain)](assets/fig-erweitert-basisurl.svg)

*Echte Admin-Oberfläche — Tab **Erweitert**, langer Scroll; zwei Screenshots **von oben nach unten** (Demo; **Basis-URL** und Exportpfade nur **Beispiele**):*

**1/2 —** Inhalt & Grenzen; **Dokumentation in States**; optionale **Basis-URL**.

![Erweitert — Screenshot (1/2)](assets/screen-erweitert-basisurl-admin.png)

*Aufnahme: AutoDoc **0.9.36**, ioBroker Admin **≥ 7.6.20** (Stand **2026-05**).*

**2/2 —** **Doku-Setup-Score**; optionaler **Dateisystem-Export**; **PDF nach jedem Lauf** (Puppeteer/Chromium).

![Erweitert — Screenshot (2/2)](assets/screen-erweitert-basisurl-admin-2.png)

*Aufnahme: AutoDoc **0.9.36**, ioBroker Admin **≥ 7.6.20** (Stand **2026-05**).*

*Echte Admin-Oberfläche — Tab **HTML-Export & Zusatzkapitel**, drei Screenshots **von oben nach unten** (Demo). Im Einleitungstext Hinweis auf **PDF** (Schalter unter **Erweitert**). Für öffentliche Repos: Logo-URLs und Mustertexte in **eigenen** Zusatzkapiteln durch **generische Beispiele** ersetzen.*

**1/3 —** Darstellung: **Farbschema** & **Preset** (HTML), optionale **Logo-URL** (Seitenleiste).

![HTML-Export & Zusatzkapitel — Screenshot (1/3)](assets/screen-html-export-pdf-hint-admin.png)

*Aufnahme: AutoDoc **0.9.36**, ioBroker Admin **≥ 7.6.20** (Stand **2026-05**).*

**2/3 —** **Admin**: Kapitel-Reihenfolge & ausgeblendete Kapitel (**JSON**). **User/Familie**: ausgeblendete Kapitel & Reihenfolge (**JSON**).

![HTML-Export & Zusatzkapitel — Screenshot (2/3)](assets/screen-html-export-pdf-hint-admin-2.png)

*Aufnahme: AutoDoc **0.9.36**, ioBroker Admin **≥ 7.6.20** (Stand **2026-05**).*

**3/3 —** **Onboarding**: ausgeblendete Kapitel & Reihenfolge (**JSON**); **eigene Markdown-Kapitel** (**JSON**-Objekte); unten Hinweis auf optionale Schrift/zusätzliches CSS.

![HTML-Export & Zusatzkapitel — Screenshot (3/3)](assets/screen-html-export-pdf-hint-admin-3.png)

*Aufnahme: AutoDoc **0.9.36**, ioBroker Admin **≥ 7.6.20** (Stand **2026-05**).*

*Echte Admin-Oberfläche — Tab **Benachrichtigungen** (optional; bei Bedarf **überspringen**). **Instanznamen**, Empfänger und Vorlagen in **öffentlichen Repos** nur mit **Platzhaltern** ausfüllen oder weglassen.*

![Benachrichtigungen — Screenshot](assets/screen-benachrichtigungen-admin.png)

*Aufnahme: AutoDoc **0.9.36**, ioBroker Admin **≥ 7.6.20** (Stand **2026-05**).*

*Echte Admin-Oberfläche — Tab **KI-Dokumentation**, langer Scroll; **zwei Screenshots von oben nach unten** (Demo). Die **Datenschutz-** und **Hardware-Hinweise** im UI sind Bestandteil des Adapters — Cloud‑Anbieter nur nutzen, wenn das für euch passt.*

**1/2 —** Anbieter & Modell, **Ollama-Basis-URL**, Anfrage‑Timeout.

![KI-Dokumentation — Screenshot (1/2)](assets/screen-ki-dokumentation-admin.png)

*Aufnahme: AutoDoc **0.9.36**, ioBroker Admin **≥ 7.6.20** (Stand **2026-05**).*

**2/2 —** **KI-Kontexthinweise** (nur für die Anfrage); **Temperatur**; Opt-in **„KI erklärt JavaScript-Skripte“**.

![KI-Dokumentation — Screenshot (2/2)](assets/screen-ki-dokumentation-admin-2.png)

*Aufnahme: AutoDoc **0.9.36**, ioBroker Admin **≥ 7.6.20** (Stand **2026-05**).*

Hinweise zu **Dateinamen**, **Verpixelung** und **Datenschutz**: **[`assets/SCREENSHOTS.md`](assets/SCREENSHOTS.md)**.

---

## Wo liegen die Ergebnisse?

- Alle Profile (Admin-/User-/Onboarding-HTML, Markdown, JSON) unter **`/files/autodoc.<instanz>/`**, Dateien wie `autodoc-latest.*` sowie ältere **zeitgestempelte** Versionen (je nach Einstellung).
- Datenpunkte z. B. **`info.htmlUrlAdmin`** / **`User`** / **`Onboarding`**, **`info.lastGeneration`**.
- **Immer aktualisiert:** **`documentation.exportHashes`** — SHA‑256‑Hex-Werte, um zu erkennen, ob sich einer der drei „latest“-Exporte (Markdown, Admin-HTML, JSON) seit dem letzten Lesen geändert hat; nach erfolgreichem **PDF**-Export stehen dort zusätzlich die Prüfsummen der **`autodoc-*.pdf`** (sowohl bei `full` **als auch** bei `metadata`).

**„Voll“ vs. nur Metadaten:** Bei **`metadata`** liegt der **vollständige Inhalt** nur in **`/files`**; die **`documentation.*`-States** enthalten nur **Platzhalter** — eigene Skripte, die bisher Volltext aus States gelesen haben, sollten auf **`/files`** oder URLs umgestellt werden.

---

## Szenario: **„Muster-Einfamilienhaus“** (nur Demonstration)

> Alle folgenden Werte sind **bewusst generisch**. Verwenden Sie **keine** echten IPs, Hostnamen, Forum-Karten oder **Gast-WLAN**-Angaben — nutzen Sie Platzhalter wie **Hausnummer XY** oder **beispiel.domain**, und passen Sie die Einträge nach dem ersten Test an.

**Ausganglage:** Zweistöckiges Einfamilienhaus mit ioBroker (**Heizszenen**, Licht in **„Wohnzimmer“, „Treppenhaus“ und Kinderzimmer**), vereinzelt **Rauchmelder- oder KNX-Anbindungen**; es geht **nicht** um produktive Zugangsdaten in der Doku, sondern um **Nachvollziehbarkeit** für Leser.

### Schritt 1 — Basis

- Projektbezeichnung: z. B. **„Musterhaus Schulweg“** — **keine** echte Adresse, zum Schutz vor OSINT.
- Dokumentationssprache: **DE** (später bei Bedarf weitere Sprachen über Profilwahl).
- **Erzeugung** mindestens **einmal nach Konfigurationsänderung** anstoßen (Schaltfläche).

### Schritt 2 — Gäste & Familie (Tab „Meine Dokumentation“)

- **`guestHelpNote`**: stichwortartig (**Notfallkontakt**, **Standort der Sicherungen** (z. B. unten rechts), **wie das Gäste-WLAN vom Hauptnetz getrennt ist** — frei formulieren, keine erfundenen Fakten).
- Optional **Kurzzeilen** zu WLAN/Strom/Wasser, wenn Sie das im Notfallbuch so handhaben.
- **`ownerPlaybookNote`**: drei Stichpunkte (z. B. „**Warmwasser erst nach XYZ** öffnen“).
- Alle Texte können Sie beliebig löschen oder leer lassen — **ohne Ihre Angaben** füllt sich nichts von alleine.

### Schritt 3 — QR & Link (**Erweitert**)

Die Basis-URL entspricht **genau der Adresse**, unter der Sie den Admin öffnen (**https://…** oder **http://hostname:8081**) — **ohne** abschließenden Schrägstrich. Nach Änderungen: **Dokumentation erneut erzeugen**.

**Test ohne öffentliche Freigabe:** nur im **Heim-WLAN** ausprobieren, nicht ins offene Internet stellen.

### Schritt 4 — Zusätzliches Markdown-Kapitel (Tab **„HTML … & Zusatzkapitel“** → **Custom sections**, JSON-Feld **`customDocSectionsJson`**)

Dort finden Sie den **grauen Hinweistext**, die **Feldbeschreibung** und den **Platzhalter** im Eingabefeld (ein **JSON-Array** mit Objekten `title`, `body`, optional `profiles`).

Beispiel (nur Musterinhalt):

```json
[
  {
    "title": "Musterhilfe Gast-WLAN",
    "body": "Beispieldaten: Hier steht später _Ihr_echter Hinweistext (Markdown)._",
    "profiles": ["onboarding", "user"]
  }
]
```

Maximal **12** Einträge; **überlange** Inhalte werden gekürzt.

### Schritt 5 — Optional Mermaid (Tab **„Meine Dokumentation“**)

Im Textfeld dient der **Platzhalter** als **Starter** (zum Überschreiben). Ist die **Mermaid‑CLI** auf dem ioBroker-Rechner installiert, werden Diagramme beim Generieren als **SVG** ins HTML eingebettet (**offlinefreundlich**). Sind **alle** Diagramme eingebettet, lädt die HTML-Datei **kein** Mermaid mehr von jsDelivr. Bleibt ein `<pre class="mermaid">` übrig (CLI fehlt oder Fehler), greift der **Browser-Fallback** über ein CDN — siehe Hilfetext im Admin.

**Ausblenden:** Kapitel-IDs **`mermaid`** (**manuell**) und **`mermaidAuto`** (**nur** Auto-Host-Graph) in den jeweiligen **„Ausblenden“**-Listen.

### Schritt 6 — Kapitelreihenfolge oder verstecken

Die JSON-Arrays (**Admin**, **User**, **Onboarding**) sind im Admin mit **kurzen gültigen IDs** und **Platzhaltern** versehen — für die Standardreihenfolge bzw. **keine** zusätzliche Ausblendung verwenden Sie **`"[]"`**.

Nach jeder strukturellen Änderung: **Dokumentation erneut erzeugen** und einen HTML-Profil-Link (`info.*Url*`) gegenlesen.

---

## Für Maintainer: lokaler Repo-Check

```bash
npm install
npm run adapter-check   # lokaler @iobroker/repochecker, siehe CONTRIBUTING.md
```

---

## Nur Demo-Inhalte in dieser Anleitung

Die Beispiele dienen dem **Üben mit den Feldern**. **Private Adressen**, **WLAN-Passwörter**, **IPs** oder eine **Forum-Karte ungekürzt kopiert** gehören **nicht** ins öffentliche Git — besser eine **eigene lokale Dokumentation** oder **bearbeitbare Dateien** im lokalen Netz **ohne** Commit verwenden.
