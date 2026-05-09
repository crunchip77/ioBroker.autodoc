# Echte Screenshots für den User-Guide (optional)

Die Dateien **`fig-*.svg`** im Ordner **`assets/`** sind **Schemas** („Drahtgitter“): sie sind **kein** Ersatz für echtes Admin‑UI‑Pixel‑Layout, laden aber ohne persönliche Daten und werden auf GitHub sauber angezeigt.

Willst du **echte Screenshots**, arbeite vorzugsweise mit **neutralen Platzhaltern** oder **Demo-Installation**:

## Aufnahmen

| Dateiname (Empfehlung) | Kurz beschreibbarer Inhalt |
| ----------------------- | ---------------------------- |
| `screen-grundeinstellungen-admin.png` | Tab **Grundeinstellungen**, nur nicht-kritische Felder sichtbar (Projektname z. B. „Demo …“). |
| `screen-meine-dokumentation-admin.png` … `screen-meine-dokumentation-admin-4.png` | Tab **Meine Dokumentation** als **vier** zusammenhängende Screenshots (langer Scroll): Projekt/Gästetexte; Playbook/Mermaid/Auto-Topologie/Notfall; Adapter-/Raum-Notizen; Sichtbarkeit pro Profil. |
| `screen-erweitert-basisurl-admin.png` … `screen-erweitert-basisurl-admin-2.png` | Tab **Erweitert**, **zwei** Teile (Scroll): Grenzen & **States-Modus** & Basis-URL; **Setup-Score**, Dateisystem-Export, **PDF**. Basis-URL/Pfade immer **erfunden** oder geschwärzt. |
| `screen-html-export-pdf-hint-admin.png` … `screen-html-export-pdf-hint-admin-3.png` | Tab **HTML-Export & Zusatzkapitel**, **drei** Teile: Darstellung/PDF-Hinweis; Admin- & User-Kapitel (**JSON**); Onboarding-Kapitel, **eigene Kapitel** (**JSON**), Schrift/CSS-Hinweis. Keine sensiblen Daten in Logo/JSON-Demos. |
| `screen-benachrichtigungen-admin.png` | Tab **Benachrichtigungen** — Adapter‑Instanz, Empfänger, Vorlage: **keine** echten Tokens/Chat‑IDs in öffentlichen Commits (Platzhalter oder leere Felder). |
| `screen-ki-dokumentation-admin.png` … `screen-ki-dokumentation-admin-2.png` | Tab **KI-Dokumentation**, **zwei** Teile (Scroll): Anbieter/Modell/URL/Timeout; Kontexthinweise, Temperatur, Opt‑in „Skripte erklären“. **Keine** API‑Keys, Abrechnungsdaten oder produktiven Cloud‑Felder zeigen — lieber **Ollama‑localhost‑Demo** oder schwärzen. |

**Eingebunden im Repo:** siehe Tabellenzeilen oben — **alle sechs** Registerkarten mit Screenshots in **`README.md`** und **`README.de.md`**.

- **PNG** oder **WebP**; für **lesbare Beschriftungen** im Admin (v. a. dunkles Theme) lieber **≥ 1280 px** Breite **oder** vor der Aufnahme **Browser-Zoom 125–150 %** und dann den sichtbaren Bereich erfassen. Die frühere **920–1280 px**-Spanne war knapp — bei Bedarf **bis ~1680 px** gehen, solange die Repo-Größe noch vertretbar ist (PNG komprimieren statt harte Qualitätsverluste).
- **Dateigröße:** **< 350 KB** anstreben, aber **Lesbarkeit** hat Vorrang; lieber etwas größere Datei als unleserlich kleine Schrift.
- **Bildunterschrift (Markdown):** Unter jedem eingebundenen **PNG** in **`README.md`** / **`README.de.md`** dieselbe Kurzform verwenden und bei **neuen Aufnahmen** anpassen:
  - **EN:** `*Capture: AutoDoc **0.9.36**, ioBroker Admin **≥ 7.6.20** (May **2026**).*` — `0.9.36` an **`package.json` `version`**, Monat/Jahr an ReShoot, Admin-Version an **`io-package.json` → `common.globalDependencies`** (Admin).
  - **DE:** `*Aufnahme: AutoDoc **0.9.36**, ioBroker Admin **≥ 7.6.20** (Stand **2026-05**).*`

## Lesbarkeit (GitHub, eingebettete Vorschau)

- Eingebettete Markdown-Bilder werden auf der Readme-Seite oft **skaliert**; Kleingedrucktes im Screenshot bleibt **im Vollbild** (Rechtsklick → Bild in neuem Tab) gut lesbar.
- **Neuaufnahmen:** breiteres Fenster, **Zoom im Admin**, oder **Höhe** so wählen, dass weniger Kleintext pro Bild (mehr Teile bei langen Tabs).

## Datenschutz

- **Keine** echten Gast-WLANs, **keine** echten Routen-IPs, QR-Ziele nur mit **erfundener** Basis-URL oder geschwärzte Bereiche.
- **Benachrichtigungen:** Instanzkennung, Empfänger, Vorlage mit **Platzhaltern** oder **Tab leer** halten, wenn die Aufnahme öffentlich wird.
- **KI:** **Keine** Cloud-API-Schlüssel oder produktiven Provider-Konten ablichten; Kontext-Notizen und Skript-Opt-in nur mit **harmlosen Demo-Texten**.

## Lange Tabs (Scroll)

Viele Tabs sind höher als ein Bildschirm — **ein Screenshot pro Aussage** reicht (z. B. nur der relevante Bereich). Optional **mehrere Dateien** pro Tab (`…-admin.png`, `…-admin-2.png`, …) und im Markdown nacheinander einbinden (im Repo z. B. **Meine Dokumentation** vier Teile, **Erweitert** zwei, **HTML-Export & Zusatzkapitel** drei, **KI-Dokumentation** zwei). Technischer Footer der Instanz (RAM, Node…) im Guide oft **wegschneiden**.

## SVG-Schemas (`fig-*.svg`)

Die **von Hand** gepflegten Diagramme sind **gültiges XML**: im Text **`&`** nur als **`&amp;`**; keine **Steuerzeichen** aus Word/Clipboard — sonst meldet GitHub z. B. „Invalid image source“ bei der eingebetteten Vorschau.

## Markdown einbinden

In **`README.md`** oder **`README.de.md`** z. B.:

```md
![Grundeinstellungen (Demo)](assets/screen-grundeinstellungen-admin.png)
```

Die bestehenden **SVG-Verweise** kannst du ersetzen oder darunter echte Screenshots ergänzen.
