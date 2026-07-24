# MERIDIAN 7 — Design Plan

A fictional workstation operating system, in the browser.
**Meridian Systems Inc., est. 1989.** Model MS-7 "Cartographer".

---

## 1. Design direction

**Not modern.** No rounded corners, no blur, no soft shadows, no gradients-as-decoration,
no system-ui font, no flat pastel. The target is the 1988–1993 workstation era — the visual
language of Mac System 7, Amiga Workbench, and CDE/Motif on a Sun box — with its own identity
rather than a copy of any one of them.

### Rules
| Rule | Value |
|---|---|
| Corner radius | `0` everywhere. No exceptions. |
| Depth | Hard 2px double bevels (light NW / dark SE). Never a blur radius on a control. |
| Outlines | 1px pure `--ink` around every panel, window, button, field. |
| Type | `Geneva, Verdana, sans-serif` for UI; `Monaco, Menlo, monospace` for terminal/code. No webfonts, no downloads. |
| Title bars | Pinstriped (1px repeating rules), close box on the **left**, title centered — System 7 grammar. |
| Icons | Hand-authored SVG on a 16×16 grid, `shape-rendering: crispEdges`. Chunky, 2-tone + accent. |
| Cursor | Custom pixel arrow via inline SVG data URI. |
| Motion | Snap, don't ease. Windows appear instantly; only the boot screen and screensaver animate. |
| Screen | Optional CRT layer: scanlines + vignette + subtle phosphor bloom. |

### Palette (default theme "Oyster")
```
--ink            #17150F   near-black outline
--chrome         #C6C2B6   warm plastic
--chrome-lighter #FFFFFF   bevel highlight
--chrome-light   #E4E0D4
--chrome-dark    #8B8779
--chrome-darker  #4A473F   bevel shadow
--desktop        #5A6B7B   slate, dithered
--title-a        #6E2B23   oxblood active title
--title-i        #A19C8E   inactive title
--accent         #B4532A   rust
--field          #F2EFE4   paper
```

### Themes shipped
`Oyster` (default warm beige) · `Graphite` (cool grey/steel blue) · `Ferro` (oxide red industrial)
· `Blueprint` (navy/cyan drafting) · `Phosphor` (green CRT mono) · `Amber` (amber CRT mono).

Each theme is a set of CSS custom properties on `:root[data-theme]`. Wallpaper is a runtime-generated
canvas pattern (dither / crosshatch / diagonal / dots / grid / static / solid) tinted by the theme.

---

## 2. Startup

1. **Power screen** — dead CRT, a physical power button. Clicking it is the user gesture that
   unlocks WebAudio. (Authentic *and* required by browsers.)
2. **POST** — ROM banner, CPU probe, memory counting up in 512K steps, bus/floppy/disk/keyboard/
   audio checks, each line typed with a tick. Hardware beep on completion.
3. **Splash** — logo, "Starting up…", extension icons marching in along the bottom, progress bar.
4. **Chime** — four-note synthesized startup chord, desktop wipes in.

`ESC` skips. Control Panel has Full / Fast / Instant boot.
Shutdown runs the sequence in reverse and ends on "It is now safe to close this window."

---

## 3. System architecture

```
index.html
  css/system.css    chrome, windows, controls, menus, desktop, taskbar, dialogs
  css/themes.css    six palettes
  css/apps.css      per-application styling
  js/core/
    util.js         DOM helpers, formatting
    store.js        localStorage persistence + change events
    audio.js        WebAudio SFX synth (no audio files) + music sequencer
    icons.js        SVG icon set
    theme.js        theme + wallpaper + CRT + cursor
    vfs.js          virtual filesystem (tree in localStorage)
    wm.js           window manager: drag, resize, z-order, focus, min/zoom, taskbar
    dialog.js       modal alert / confirm / prompt in system style
    menubar.js      top menu bar, clock, indicators
    desktop.js      desktop icons, selection, context menu
    screensaver.js  idle lock: starfield / bouncer / static
    boot.js         power, POST, splash, shutdown
  js/apps/*.js      one file per application
  js/main.js        wiring
```

Zero dependencies, zero build step, classic scripts under a global `M7` namespace so it runs
from `file://` or a static server. All state (files, settings, icon positions) in `localStorage`.

---

## 4. Applications

| App | What it does |
|---|---|
| **Terminal** | ~30 commands over the real VFS, history, tab-completion, `neofetch`, `theme`, `matrix`, easter eggs. |
| **Files** | Browse/create/rename/delete in the VFS, icon + list views, opens files in the right app. |
| **Notes** | Text editor with File/Edit menus, save to VFS, word count. |
| **Paint** | 320×200 canvas, 16-color palette, pencil/line/rect/ellipse/fill/spray/eraser, save as `.pic`. |
| **Calculator** | Beveled keypad, keyboard bindings, memory keys. |
| **Sweeper** | Minesweeper, three difficulties, timer, flag counter. |
| **Tape Deck** | Chiptune sequencer — built-in tracks, transport, VU meters, spectrum visualizer. |
| **Control Panel** | Appearance / Sound / System / Storage. Every knob persists. |
| **System Info** | Fake specs mixed with real `navigator` data, uptime, storage gauge. |
| **Handbook** | In-system documentation, paged. |
| **Viewer** | Opens `.pic` files saved from Paint. |

Plus: desktop right-click menu, per-window menus, modal dialogs with sfx, idle screensaver,
Trash, and a shutdown sequence.

---

## 5. Sound

Everything is synthesized at runtime — no asset files. `M7.audio` exposes
`click, select, open, close, minimize, error, alert, key, drop, trash, toggle, tick,
chime, shutdown` built from oscillator + noise-buffer recipes with per-event envelopes.
Master volume, per-category mute, and startup-chime toggle live in the Control Panel.
