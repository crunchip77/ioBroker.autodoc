# AutoDoc — Kurzanleitung (erste Schritte)

Orientierung für **Betreuer**, die den Adapter über das **[GitHub-Repository](https://github.com/crunchip77/ioBroker.autodoc)** installieren. Detail-Hilfe je Feld liefert weiter die **Inline-Hilfe** in der ioBroker-Admin-Oberfläche (`jsonConfig`); technische Grundlagen im **[README (EN)](../../README.md)**.

**Abbildungen:** Wo ein **SVG** existiert, steht es **immer vor** dem passenden **Screenshot** — das Schema zeigt die Tab-Logik, der Screenshot das echte Admin-Layout (beides absichtlich). Lesbarkeit in der eingebetteten Vorschau: **[`SCREENSHOTS.md`](assets/SCREENSHOTS.md)** („Lesbarkeit“). Aufnahmen/Datenschutz: ebenda.

**englische Kurzfassung:** [`README.md`](README.md).

---

## Voraussetzungen

- **Node.js** ≥ 22  
- **Requirements** wie im Haupt-[README](../../README.md) beschrieben (JS-Controller, Admin-Version).

---

## Installation (URL / Clone)

Solange der Adapter noch **nicht** über die normale Adapter-Liste (npm **+** [ioBroker.repositories](https://github.com/ioBroker/ioBroker.repositories)) installierbar ist, typischerweise per **„Installieren aus URL“** oder **Git**.

Nach dem Instanziieren der Instanz: **Instanzen → autodoc.0 → Schraubenschlüssel**.

---

## Registerkarten überblick — was zuerst?

1. **Grundeinstellungen** — Projektname, **Sprache** der erzeugten Doku, welches Markdown-Profil standardmäßig **exportiert** wird; **Auslöser** (bei Start, Cron, Änderungen, …).
2. **Meine Dokumentation** — **eigene** Texte für Familie/Gäste (Notfallhilfe, Abläufe, Playbook); optionale Kurzzeilen (WLAN/Strom/Wasser); optional ein **selbst geschriebenes Mermaid-Diagramm** sowie die Auto-Host-Topologie.
3. **Erweitert** — Basis-URL (für **QR/link** beim Onboarding-HTML), **`documentationStatesMode`** (`full` vs. `metadata`), optionaler **Filesystem-Export**, optional **PDF nach jedem Lauf** ( **`puppeteer`** im Adapterordner), Wartungs-Score-Schwellen, …
4. **HTML & Zusatzkapitel** — Kapitel ausblenden, **Reihenfolge**, **freie Markdown-Zusatzkapitel**, Theme; im **Einleitungstext** dieses Tabs Kurzverweis auf **PDF** (Schalter unter **Erweitert**).
5. **Benachrichtigungen** — optional Telegram/Push-Mail bei erzeugter Doku (adapterabhängig).
6. **KI-Dokumentation** — nur bei **gewähltem Anbieter** relevant; wenn **„Deaktiviert“**, bleibt nur Hinweis/Kontrollkästichen oben ohne Funktion.

Nach Änderungen: **Dokumentation generieren** (Button / Datenpunkt **`action.generate`**) oder eingerichteten Cron abwarten.

### Abbildungen

**SVGs** und **Screenshots** pro Tab gehören **zusammen**: das **SVG** fasst Tabs und Felder schematisch zusammen (**kein** exaktes UI), der **PNG** zeigt dieselbe Ecke der **echten Oberfläche** (Demo). In GitHub wirken eingebettete Bilder oft klein — **auf das Bild klicken** („Open image in new tab“) oder Seite zoomen zum Mitlesen.

![Grundeinstellungen — überblicksartiges Schema](assets/fig-tab-grundeinstellungen.svg)

*Echte Admin-Oberfläche (Demo-Instanz; je nach Theme/Version abweichend):*

![Grundeinstellungen — Screenshot](assets/screen-grundeinstellungen-admin.png)

![Meine Dokumentation — Freitext- und Diagrammbereiche (Schema)](assets/fig-tab-meine-dokumentation.svg)

*Echte Admin-Oberfläche — **Meine Dokumentation** ist ein langer Scroll; vier Screenshots **von oben nach unten** (Demo):*

**1/4 —** Projekt, Kontakt & Hinweise; Hilfe & Abläufe (Klartext).

![Meine Dokumentation — Screenshot (1/4)](assets/screen-meine-dokumentation-admin.png)

**2/4 —** Playbook, optionales **Mermaid**-Diagramm, automatische Host-Topologie, Notfall-Kurzzeilen (WLAN/Strom/Wasser).

![Meine Dokumentation — Screenshot (2/4)](assets/screen-meine-dokumentation-admin-2.png)

**3/4 —** Kurzzeile Sonstiges (optional); Adapter- und Raum-Notizen.

![Meine Dokumentation — Screenshot (3/4)](assets/screen-meine-dokumentation-admin-3.png)

**4/4 —** Räume/Adapter pro Profil ausblenden (Onboarding vs. User/Familie); Anzeige interner JavaScript-Dateinamen für Gäste.

![Meine Dokumentation — Screenshot (4/4)](assets/screen-meine-dokumentation-admin-4.png)

![Erweitert — Basis-URL und Hinweise (Schema, Beispieldomain)](assets/fig-erweitert-basisurl.svg)

*Echte Admin-Oberfläche — Tab **Erweitert**, langer Scroll; zwei Screenshots **von oben nach unten** (Demo; **Basis-URL** und Exportpfade nur **Beispiele**):*

**1/2 —** Inhalt & Grenzen; **Dokumentation in States**; optionale **Basis-URL**.

![Erweitert — Screenshot (1/2)](assets/screen-erweitert-basisurl-admin.png)

**2/2 —** **Doku-Setup-Score**; optionaler **Dateisystem-Export**; **PDF nach jedem Lauf** (Puppeteer/Chromium).

![Erweitert — Screenshot (2/2)](assets/screen-erweitert-basisurl-admin-2.png)

*Echte Admin-Oberfläche — Tab **HTML-Export & Zusatzkapitel**, drei Screenshots **von oben nach unten** (Demo). Im Einleitungstext Hinweis auf **PDF** (Schalter unter **Erweitert**). Für öffentliche Repos: Logo-URLs und Mustertexte in **eigenen** Zusatzkapiteln durch **generische Beispiele** ersetzen.*

**1/3 —** Darstellung: **Farbschema** & **Preset** (HTML), optionale **Logo-URL** (Seitenleiste).

![HTML-Export & Zusatzkapitel — Screenshot (1/3)](assets/screen-html-export-pdf-hint-admin.png)

**2/3 —** **Admin**: Kapitel-Reihenfolge & ausgeblendete Kapitel (**JSON**). **User/Familie**: ausgeblendete Kapitel & Reihenfolge (**JSON**).

![HTML-Export & Zusatzkapitel — Screenshot (2/3)](assets/screen-html-export-pdf-hint-admin-2.png)

**3/3 —** **Onboarding**: ausgeblendete Kapitel & Reihenfolge (**JSON**); **eigene Markdown-Kapitel** (**JSON**-Objekte); unten Hinweis auf optionale Schrift/zusätzliches CSS.

![HTML-Export & Zusatzkapitel — Screenshot (3/3)](assets/screen-html-export-pdf-hint-admin-3.png)

*Echte Admin-Oberfläche — Tab **Benachrichtigungen** (optional; Tab überspringen, wenn nicht benötigt). **Instanznamen**, Empfänger und Vorlagen für **öffentliche Repos** nur mit **Platzhaltern** oder weglassen.*

![Benachrichtigungen — Screenshot](assets/screen-benachrichtigungen-admin.png)

*Echte Admin-Oberfläche — Tab **KI-Dokumentation**, langer Scroll; **zwei Screenshots von oben nach unten** (Demo). Die **Datenschutz-** und **Hardware-Hinweise** im UI sind Bestandteil des Adapters — Cloud‑Anbieter nur nutzen, wenn das für euch passt.*

**1/2 —** Anbieter & Modell, **Ollama-Basis-URL**, Anfrage‑Timeout.

![KI-Dokumentation — Screenshot (1/2)](assets/screen-ki-dokumentation-admin.png)

**2/2 —** **KI-Kontexthinweise** (nur für die Anfrage); **Temperatur**; Opt-in **„KI erklärt JavaScript-Skripte“**.

![KI-Dokumentation — Screenshot (2/2)](assets/screen-ki-dokumentation-admin-2.png)

Dateinamen wechseln, verpixeln, Datenschutz: **[`assets/SCREENSHOTS.md`](assets/SCREENSHOTS.md)**.

---

## Wo landen Ergebnisse?

- Alle Profile (Admin-/User-/Onboarding-HTML, Markdown, JSON) unter **`/files/autodoc.<instanz>/`**, Dateien wie `autodoc-latest.*` sowie rollierende Versionen (je nach Einstellung).
- Datenpunkte z. B. **`info.htmlUrlAdmin`** / **`User`** / **`Onboarding`**, **`info.lastGeneration`**.
- **Immer aktualisiert:** **`documentation.exportHashes`** — SHA‑256‑Hex zum Erkennen, ob sich einer der drei „latest“-Exporte (Markdown, Admin-HTML, JSON) seit dem letzten Lesen geändert hat; nach erfolgreichem **PDF**-Export stehen dort zusätzlich die Prüfsummen der **`autodoc-*.pdf`** (bei `full` **und** bei `metadata`).

**„Voll“ vs. nur Metadaten:** bei **`metadata`** liegt der **Kanontext nur in `/files`**; **`documentation.*` große States sind Platzhalter** — eigene Skripte, die früher Volltext aus States lesen, umstellen.

---

## Szenario: **„Muster-Einfamilienhaus“** (nur Demonstration)

> Alle folgenden Werte sind **bewusst generisch**. **Keine** echten IPs, Hostnames, Forum-Karten oder Gäste-WLANs verwenden — lieber mit **Hausnummer XY / Beispieldomain** formulieren und nach dem ersten Test löschen/anpassen.

**Ausganglage:** Zweistöckiges Einfamilienhaus mit ioBroker (**Heizungs-Szenen**, Licht in **„Wohnzimmer“, „Treppenhaus“, Kinderzimmer**), ein **Smoke/KNX**-Pfad hier und da, keine produktiven Zugänge dokumentieren — nur die **Nachvollziehbarkeit**.

### Schritt 1 — Basis

- Projektbezeichnung: z. B. **„Musterhaus Schulweg“** — **kein** echte Adresse zum Schutz gegen OSINT.
- Dokumentations-Sprache: **DE** (oder zweisprachig später mit Profilwahl).
- **Erzeugung** mindestens **einmal nach Konfig ändern** auslösen (Button).

### Schritt 2 — Gäste & Familie (Tab „Meine Dokumentation“)

- **`guestHelpNote`**: Stichwortartig (**wer anrufen**, **Sicherungen unten rechts**, **wie Gästenetz getrennt** — frei formulieren, keine erfundenen Fakten).
- Optional **Kurzzeilen** Wi‑Fi/Strom/Wasser wenn ihr das im Notfallbuch so führet.
- **`ownerPlaybookNote`**: 3 Bullets („**Warmwasser erst nach XYZ** öffnen“ usw.).
- Alle Texte können Sie beliebig löschen/leerlassen — **nichts** ergänzt sich automatisch ohne Ihre Daten.

### Schritt 3 — QR & Link (**Erweitert**)

Basis-URL = **genau wie** Sie den Admin öffnen (**https://… oder http://hostname:8081**) **ohne** Schrägstrich Ende. Nach Änderung: **erneut dokumentieren**.

**Test ohne öffentliche Freigabe:** nur im **Haus-WLAN**, nicht für Open-Internet freigeben.

### Schritt 4 — Zusätzliches Markdown-Kapitel (Tab **„HTML … & Zusatzkapitel“** → **Custom sections**, JSON-Feld **`customDocSectionsJson`**)

Siehe dort den **graue Hinweistext**, die **Feldbeschreibung** und den **Placeholder** im Eingabefeld (ein **JSON-Array** mit Objekten `title`, `body`, optional `profiles`).

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

Max. **12** Einträge, überschuende Länge wird gekürzt.

### Schritt 5 — Optional Mermaid (Tab **„Meine Dokumentation“**)

Im Textfeld gilt der **Placeholder** als **Starter** (zum Überschreiben). Bei installierter **Mermaid‑CLI** auf dem ioBroker-Rechner: Einbettung als **SVG** im HTML beim Generieren (**offline‑freundlich**); sind **alle** Diagramme eingebettet, lädt die HTML-Datei **kein** Mermaid von jsDelivr mehr. Bleibt ein `<pre class="mermaid">` (CLI fehlt oder Fehler), greift der **Browser-Fallback** mit CDN — siehe Hilfetext im Admin.

Ausblenden: Kapitel-Ids **`mermaid`** (**manuell**) und **`mermaidAuto`** (**nur** Auto-Host-Graph) in den jeweiligen **„Ausblenden“**-Listen.

### Schritt 6 — Kapitelreihenfolge oder verstecken

JSON-Arrays (**Admin**, **User**, **Onboarding**) sind im Admin mit **kurzen gültigen Ids** und **Placeholder** versehen — nutzen Sie **leer `"[]"`** für Standardreihenfolge bzw. **keine** zusätzliche Ausblendung.

Nach jeder strukturellen Änderung: **Doku erneut erzeugen** und einen HTML-Profil-Link (`info.*Url*`) gegenlesen.

---

## Maintainers: lokaler Repo-Check

```bash
npm install
npm run adapter-check   # lokaler @iobroker/repochecker, siehe CONTRIBUTING.md
```

---

## Nur Demo-Inhalte in dieser Anleitung

Beispiele dienen zum **Üben der Felder**. **Privat-Adressen**, **WLAN-Pass**, **IPs**, **Forum-Karte roh kopiert** gehören **nicht** ins öffentliche Git — lieber eigene lokale Dokument oder bearbeitbare Datein im Netz ohne Commit.
