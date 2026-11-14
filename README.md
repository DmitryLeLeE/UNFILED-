# UNFILED-

### THE HOLLOW BROADCAST
**ISSUE 00 / MMXXVI**

> A field guide to messages that arrive after their senders have gone.

[OPEN THE TRANSMISSION →](https://dmitrylelee.github.io/UNFILED-/)

![The Hollow Broadcast — entrance](the-hollow-broadcast/preview.jpg)

This is not a portfolio. It is not a landing page. It is not a place to
"discover my work."

It is an independent transmission: a fictional archive assembled from
public-domain plates, torn paper, photocopier dust, red corrections, damaged
photographs and several wrong decisions made on purpose. The site is a static
publication, but it behaves like a physical object that has been scanned badly
and left online.

The archive is open. The line is not clear.

---

## WHAT THIS IS

**UNFILED-** is the repository. **THE HOLLOW BROADCAST** is the object inside it.

The publication is built as a sequence of graphic compositions rather than a
stack of website sections. Every section has its own proportions, tears, type
scale, noise and rules of assembly. Some pages are broadsides. Some are contact
sheets. Some are faxes, studio boards, or the back cover of something that
should have stayed in a drawer.

The material is deliberately inconsistent:

- black paper and overexposed photography
- white paper and scanner stains
- deep red ink and handwritten interventions
- huge condensed headlines and tiny archival labels
- clean diagrams next to badly damaged surfaces
- interfaces that look borrowed from an obsolete machine

Nothing here is meant to look untouched.

---

## THE CONTENTS

### 00 / ENTRANCE
A title, a sitter, four exposures, a moth, a botanical error, and a signal that
will not identify itself. The entrance is the cover and the first wrong turn.

### 01 / SPECIMENS
Seven public-domain plates recovered from a damaged external drive. Bodies,
botanical errors and instruments of observation, reproduced badly on purpose.
Click a plate to open its file.

### 02 / THE CUTTING TABLE
An interactive composition board. Nine scraps of evidence can be dragged,
turned, shuffled and reset. There is no original arrangement. There is only the
one you leave behind.

### 03 / FRAGMENTS
Notes for a black broadside. The room was empty, but the microphone kept
breathing.

### 04 / APPARATUS
A small machine for making decisions you will later deny. Generate a sigil, read
its designation, save the SVG, or bury it.

### 05 / FREQUENCIES
Four synthesized carriers. No mp3s, no streaming service, no end of track.
Headphones recommended; silence also acceptable.

### 06 / TRANSMISSIONS
A local fax machine and a log of messages from an unknown sender. Nothing is
sent anywhere. Nothing survives after the window closes.

### 07 / OTHER WORLDS
Six real doorways out of this building. They are not affiliated with the
broadcast. The internet is still a place you can get lost in.

### 08 / COLOPHON
Plates, type, machine notes and the end of the transmission.

---

## HOW TO READ IT

There is no correct order, but there is an index.

- Open the **INDEX** tab at the right edge, or press `I`.
- Click any specimen to open its file.
- Drag the scraps on **The Cutting Table**; use `SHUFFLE THE TABLE`, `TURN 15°` and `RESET`.
  With a scrap focused, arrow keys nudge it, `[` and `]` rotate it, and `Shift` makes nudges larger.
- Press **DRAW A MARK** in Apparatus to generate a new sigil, then **SAVE SVG** if you want to keep it.
- Select a frequency and press play. Sound is generated live in the browser.
- Press **RECEIVE TRANSMISSION** in Transmissions. Do not reply.
- Touch the moth three times. It is not a button.

The index scrolls. The page is longer than it looks.

---

## THE MATERIALS

The visual layer is original. It was not applied as a filter over a finished
layout; the paper had to be torn first.

- torn section masks and ripped image silhouettes
- black toner, white scratches, copier streaks and scanner dust
- paper fibres, ink dropout, halftone dots and smudged ink
- transparent tape, paper scraps and red hand-drawn marks
- four self-hosted typefaces: Six Caps, Archivo Black, Bodoni Moda, Space Mono
- public-domain and CC0 plates, recomposed and converted to high-contrast monochrome
- no stock photography, no tracking pixels, no external APIs

All textures, paper silhouettes, tape, scratches and hand-drawn marks live in
[`the-hollow-broadcast/assets/`](the-hollow-broadcast/assets/). The construction
notes are in [`the-hollow-broadcast/README.md`](the-hollow-broadcast/README.md).

![The Index](the-hollow-broadcast/preview-index.jpg)

![The Cutting Table](the-hollow-broadcast/preview-table.jpg)

---

## THE MACHINE

Static HTML, CSS and vanilla JavaScript. No build step. No framework. No backend.
No analytics. No cookies. No master.

The only thing stored locally is the audio volume. Nothing is sent anywhere.

The source starts at [`the-hollow-broadcast/index.html`](the-hollow-broadcast/index.html).
The publication is deployed by the GitHub Pages workflow in
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) whenever `main`
changes.

### Local viewing

```bash
cd the-hollow-broadcast
python -m http.server 8000
```

Then open `http://localhost:8000/`. A local server is better than opening the
file directly, especially for fonts and browser audio.

---

## SOURCES AND RIGHTS

The photographic and illustrative plates are public-domain or CC0 material from
Wikimedia Commons, cropped, mirrored, converted to black and white and recomposed
for this publication. Exact source pages, makers and licences are in
[`the-hollow-broadcast/SOURCES.md`](the-hollow-broadcast/SOURCES.md).

The paper, xerox, ink, tape, torn-edge and hand-drawn assets are original to this
project. Fonts are distributed under the SIL Open Font License; licence files are
in `the-hollow-broadcast/assets/fonts/licenses/`.

The writing, layout and code are released without restriction:

**NO RIGHTS RESERVED / NO RIGHTS OBSERVED.**

All text is fiction. Any resemblance to a living signal is intentional.

---

### FILE STATUS

**PUBLISHED / PUBLIC DOMAIN SOURCES / NO FIXED ORDER**

[Live transmission](https://dmitrylelee.github.io/UNFILED-/) ·
[Source](the-hollow-broadcast/) ·
[Production notes](the-hollow-broadcast/README.md) ·
[Sources](the-hollow-broadcast/SOURCES.md)
