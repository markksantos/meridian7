# MERIDIAN 7

A fictional 1989 workstation operating system that runs in a browser.
Boot sequence, window manager, eleven programs, six colour schemes, and a sound
system with no audio files in it.

![desktop](docs/desktop.png)

---

## Run it

```bash
open index.html            # works straight off disk — no server, no build
```

or, if you would rather serve it:

```bash
node serve.mjs             # http://localhost:6060
```

There is no build step, no package.json and no dependencies. Every script is a
plain classic script under one global (`M7`), which is why `file://` works.

**First run:** click the power button on the monitor. That click is what unlocks
WebAudio — the machine cannot chime until you turn it on. Press `ESC` to skip the
startup sequence.

---

## What is in it

| Program | |
|---|---|
| **Terminal** | ~35 commands over the real filesystem, history, tab completion, `neofetch`, `matrix`, `banner`, `cowsay` |
| **Files** | browse, rename, duplicate, trash; icon and list views |
| **Notes** | text editor with open/save into any folder |
| **Paint** | 288×184 canvas, 16 colours, 8 tools, flood fill, undo, saves `.pic` |
| **Picture Viewer** | opens what Paint writes, 1×–4× |
| **Calculator** | four functions, memory register, paper tape |
| **Sweeper** | minesweeper, three field sizes, chording |
| **Tape Deck** | four synthesized chiptune tracks, transport, live spectrum |
| **Control Panel** | appearance, sound, system, storage — every knob persists |
| **About This Workstation** | fake specs, real host hardware, uptime, gauges |
| **Handbook** | six pages of in-system documentation |

Plus: a window manager with outline dragging, corner resize, zoom, collapse and a
task strip; desktop icons you can drag and arrange; right-click menus everywhere;
modal dialogs with open/save choosers; an idle screen saver with three patterns;
and a shutdown sequence that ends the way they used to.

## Making it yours

- **Six colour schemes** — Oyster, Graphite, Ferro, Blueprint, and two monochrome
  CRT sets (Phosphor, Amber). Everything repaints, including the icons.
- **Eight desktop patterns**, generated at runtime from the active scheme so the
  desk always matches the chrome.
- **CRT layer** — scanlines and vignette, strength adjustable, or off.
- **Sound** — master volume, interface effects, key clicks and the startup chime
  are separate switches. Nothing is a sample; it is all oscillators and noise
  buffers built in `js/core/audio.js`.
- **Startup** — Full (POST + memory count + splash), Fast, or Instant.

## Where things live

Everything is in `localStorage` on this machine — no network, no account, no
telemetry.

- `m7.fs` — the filesystem tree
- `m7.settings` — preferences and desktop icon positions

Control Panel → Storage can reset preferences without touching your files, or
erase the disk back to its factory contents.

## Layout

```
index.html
css/      themes.css · system.css · apps.css
js/core/  util store audio icons theme vfs wm dialog menubar desktop screensaver boot
js/apps/  terminal files notes paint viewer calculator sweeper tapedeck control sysinfo handbook
DESIGN.md the design plan this was built from
```

## Design notes

See `DESIGN.md`. The short version: zero border radius, hard 2px bevels, 1px ink
outlines, pinstriped title bars with the close box on the **left**, hand-authored
16×16 SVG icons, and no webfonts. Colour is fully tokenised — no component
hardcodes a hex value, which is what makes the two CRT themes possible.
