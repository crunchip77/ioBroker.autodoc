# Echte Screenshots für den User-Guide (optional)

Die Dateien **`fig-*.svg`** im Ordner **`assets/`** sind **Schemas** („Drahtgitter“): sie sind **kein** Ersatz für echtes Admin‑UI‑Pixel‑Layout, laden aber ohne persönliche Daten und werden auf GitHub sauber angezeigt.

Willst du **echte Screenshots**, arbeite vorzugsweise mit **neutralen Platzhaltern** oder **Demo-Installation**:

## Aufnahmen

| Dateiname (Empfehlung) | Kurz beschreibbarer Inhalt |
| ----------------------- | ---------------------------- |
| `screen-grundeinstellungen-admin.png` | Tab **Grundeinstellungen**, nur nicht-kritische Felder sichtbar (Projektname z. B. „Demo …“). |
| `screen-meine-dokumentation-admin.png` | Tab **Meine Dokumentation**, Textfelder leer oder mit **MUSTER**‑Text ohne Adressen. |
| `screen-erweitert-basisurl-admin.png` | Tab **Erweitert**, Basis-URL **absichtlich** mit **erfundener** Domain/IP oder verpixelt/blurred. |
| `screen-html-export-pdf-hint-admin.png` | Tab **HTML-Export & Zusatzkapitel** mit Kurztext-Hinweis auf **PDF** (optional). |

- **PNG** oder **WebP**, Breite etwa **920–1280 px**, Dateigröße **< 350 KB**, wo möglich.
- Admin- und AutoDoc-Version in der Bildunterschrift nennen (z. B. „screenshot 2026‑05, Admin ≥ …“).

## Datenschutz

- **Keine** echten Gast-WLANs, **keine** echten Routen IPs, QR-Ziele nur mit **erfundener** Basis-URL oder geschwärzte Bereiche.

## SVG-Schemas (`fig-*.svg`)

Die **von Hand** gepflegten Diagramme sind **gültiges XML**: im Text **`&`** nur als **`&amp;`**; keine **Steuerzeichen** aus Word/Clipboard — sonst meldet GitHub z. B. „Invalid image source“ bei der eingebetteten Vorschau.

## Markdown einbinden

In **`README.md`** oder **`README.de.md`** z. B.:

```md
![Grundeinstellungen (Demo)](assets/screen-grundeinstellungen-admin.png)
```

Die bestehenden **SVG-Verweise** kannst du ersetzen oder darunter echte Screenshots ergänzen.
