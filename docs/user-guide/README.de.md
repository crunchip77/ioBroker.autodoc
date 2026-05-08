# AutoDoc — Kurzanleitung (erste Schritte)

Orientierung für **Betreuer**, die den Adapter über das **[GitHub-Repository](https://github.com/crunchip77/ioBroker.autodoc)** installieren. Detail-Hilfe je Feld liefert weiter die **Inline-Hilfe** in der ioBroker-Admin-Oberfläche (`jsonConfig`); technische Grundlagen im **[README (EN)](../../README.md)**.

**Abbildungen:** unten **SVG-Schemas** (stilisiert, ohne echtes UI und ohne Ihre Daten). **Echte PNG/WebP:** Anleitung und Dateinamen-Empfehlung in [`assets/SCREENSHOTS.md`](assets/SCREENSHOTS.md).

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
3. **Erweitert** — Basis-URL (für **QR/link** beim Onboarding-HTML), **`documentationStatesMode`** (`full` vs. `metadata`), optionaler **Filesystem-Export**, Wartungs-Score-Schwellen, …
4. **HTML & Zusatzkapitel** — Kapitel ausblenden, **Reihenfolge**, **freie Markdown-Zusatzkapitel**, Theme.
5. **Benachrichtigungen** — optional Telegram/Push-Mail bei erzeugter Doku (adapterabhängig).
6. **KI-Dokumentation** — nur bei **gewähltem Anbieter** relevant; wenn **„Deaktiviert“**, bleibt nur Hinweis/Kontrollkästichen oben ohne Funktion.

Nach Änderungen: **Dokumentation generieren** (Button / Datenpunkt **`action.generate`**) oder eingerichteten Cron abwarten.

### Abbildungen (Schemas — stilisiert)

Die folgenden **SVG** sind **vereinfachte Drahtgitter** (keine produkt­getreuen Screenshots).

![Grundeinstellungen — überblicksartiges Schema](assets/fig-tab-grundeinstellungen.svg)

![Meine Dokumentation — Freitext- und Diagrammbereiche (Schema)](assets/fig-tab-meine-dokumentation.svg)

![Erweitert — Basis-URL und Hinweise (Schema, Beispieldomain)](assets/fig-erweitert-basisurl.svg)

**Echte Fotos vom Admin:** siehe **[`assets/SCREENSHOTS.md`](assets/SCREENSHOTS.md)** (Dateien z. B. `screen-*-admin.png` ins gleiche **`assets/`**-Verzeichnis legen und in diesem Markdown wie dort beschrieben verlinken).

---

## Wo landen Ergebnisse?

- Alle Profile (Admin-/User-/Onboarding-HTML, Markdown, JSON) unter **`/files/autodoc.<instanz>/`**, Dateien wie `autodoc-latest.*` sowie rollierende Versionen (je nach Einstellung).
- Datenpunkte z. B. **`info.htmlUrlAdmin`** / **`User`** / **`Onboarding`**, **`info.lastGeneration`**.
- **Immer aktualisiert:** **`documentation.exportHashes`** — SHA‑256‑Hex zum Erkennen, ob sich einer der drei „latest“-Exporte seit dem letzten Lesen geändert hat (bei `full` **und** bei `metadata`).

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

Im Textfeld gilt der **Placeholder** als **Starter** (zum Überschreiben). Bei installierter **Mermaid‑CLI** auf dem ioBroker-Rechner: Einbettung als **SVG** im HTML beim Generieren (**offline‑freundlicher**); sonst Fallback mit Browser/JavaScript beim Öffnen (siehe Hilfetext dort).

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
