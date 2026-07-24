/* MERIDIAN 7 — icon set. Hand-authored on a 16x16 grid, crisp edges, theme-aware fills. */
(function (M7) {
  'use strict';

  function wrap(body) {
    return '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">' + body + '</svg>';
  }

  var I = 'var(--ink)';
  var L = 'var(--chrome-lighter)';
  var C = 'var(--chrome-light)';
  var D = 'var(--chrome-dark)';
  var A = 'var(--accent)';
  var T = 'var(--term-ink)';
  var TB = 'var(--term-bg)';

  function r(x, y, w, h, f) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + f + '"/>'; }
  function p(d, f) { return '<path d="' + d + '" fill="' + f + '"/>'; }

  var ICONS = {

    logo: wrap(
      r(1, 1, 14, 14, I) + r(2, 2, 12, 12, C) +
      p('M3 12 L3 4 L5 4 L8 8 L11 4 L13 4 L13 12 L11 12 L11 7 L8 11 L5 7 L5 12 Z', I) +
      r(3, 12, 10, 1, A)
    ),

    terminal: wrap(
      r(0, 1, 16, 14, I) + r(1, 2, 14, 12, TB) +
      r(2, 4, 1, 1, T) + r(3, 5, 1, 1, T) + r(4, 6, 1, 1, T) + r(3, 7, 1, 1, T) + r(2, 8, 1, 1, T) +
      r(6, 8, 5, 1, T) + r(2, 10, 8, 1, A)
    ),

    files: wrap(
      p('M1 3 L6 3 L7 5 L15 5 L15 14 L1 14 Z', I) +
      p('M2 4 L5.5 4 L6.4 6 L14 6 L14 13 L2 13 Z', C) +
      r(2, 6, 12, 1, L) + r(4, 9, 8, 1, D) + r(4, 11, 6, 1, D)
    ),

    folder: wrap(
      p('M1 3 L6 3 L7 5 L15 5 L15 14 L1 14 Z', I) +
      p('M2 4 L5.5 4 L6.4 6 L14 6 L14 13 L2 13 Z', C) +
      r(2, 6, 12, 1, L)
    ),

    folderOpen: wrap(
      p('M1 3 L6 3 L7 5 L15 5 L15 14 L1 14 Z', I) +
      p('M2 4 L5.5 4 L6.4 6 L14 6 L14 8 L4 8 L2 13 Z', C) +
      p('M3 9 L15 9 L13 14 L1 14 Z', L) + p('M4 10 L14 10 L12.5 13 L2.5 13 Z', C)
    ),

    file: wrap(
      p('M3 1 L10 1 L13 4 L13 15 L3 15 Z', I) +
      p('M4 2 L9.5 2 L12 4.5 L12 14 L4 14 Z', L) +
      p('M9 2 L12 5 L9 5 Z', D) +
      r(5, 7, 6, 1, D) + r(5, 9, 6, 1, D) + r(5, 11, 4, 1, D)
    ),

    notes: wrap(
      p('M2 1 L14 1 L14 15 L2 15 Z', I) +
      r(3, 2, 10, 12, L) +
      r(5, 4, 7, 1, D) + r(5, 6, 7, 1, D) + r(5, 8, 7, 1, D) + r(5, 10, 4, 1, D) +
      r(3, 2, 1, 12, A)
    ),

    paint: wrap(
      p('M1 2 L15 2 L15 12 L1 12 Z', I) + r(2, 3, 12, 8, L) +
      r(3, 4, 3, 3, A) + r(7, 4, 3, 3, 'var(--title-a1)') + r(11, 4, 2, 3, 'var(--accent)') +
      r(3, 8, 10, 2, D) +
      p('M10 13 L13 10 L15 12 L12 15 Z', I) + p('M11 13 L13 11 L14 12 L12 14 Z', A)
    ),

    picture: wrap(
      p('M1 2 L15 2 L15 14 L1 14 Z', I) + r(2, 3, 12, 10, L) +
      p('M2 11 L6 6 L9 10 L11 8 L14 12 L14 13 L2 13 Z', D) +
      r(11, 4, 2, 2, A)
    ),

    calculator: wrap(
      p('M2 1 L14 1 L14 15 L2 15 Z', I) + r(3, 2, 10, 12, C) +
      r(4, 3, 8, 3, TB) + r(9, 4, 2, 1, T) +
      r(4, 7, 2, 2, L) + r(7, 7, 2, 2, L) + r(10, 7, 2, 2, A) +
      r(4, 10, 2, 2, L) + r(7, 10, 2, 2, L) + r(10, 10, 2, 2, L)
    ),

    sweeper: wrap(
      r(1, 1, 14, 14, I) + r(2, 2, 12, 12, C) +
      p('M5 11 A3 3 0 1 1 11 11 A3 3 0 1 1 5 11 Z', I) +
      r(9, 4, 1, 3, I) + r(10, 3, 2, 1, A) + r(11, 4, 1, 1, A)
    ),

    tapedeck: wrap(
      p('M1 3 L15 3 L15 13 L1 13 Z', I) + r(2, 4, 12, 8, C) +
      p('M4 8 A1.6 1.6 0 1 1 7.2 8 A1.6 1.6 0 1 1 4 8 Z', I) +
      p('M8.8 8 A1.6 1.6 0 1 1 12 8 A1.6 1.6 0 1 1 8.8 8 Z', I) +
      r(5.2, 7.4, 1, 1, L) + r(10, 7.4, 1, 1, L) +
      r(3, 10, 10, 1, A)
    ),

    control: wrap(
      r(1, 1, 14, 14, I) + r(2, 2, 12, 12, C) +
      r(4, 3, 1, 10, D) + r(8, 3, 1, 10, D) + r(12, 3, 1, 10, D) +
      r(3, 5, 3, 2, L) + r(3, 5, 3, 1, I) +
      r(7, 8, 3, 2, L) + r(7, 8, 3, 1, I) +
      r(11, 4, 3, 2, A) + r(11, 4, 3, 1, I)
    ),

    sysinfo: wrap(
      r(1, 2, 14, 10, I) + r(2, 3, 12, 8, TB) +
      r(3, 5, 6, 1, T) + r(3, 7, 8, 1, T) + r(3, 9, 4, 1, A) +
      r(5, 13, 6, 2, I) + r(3, 14, 10, 1, I)
    ),

    handbook: wrap(
      p('M1 2 L7 2 L8 3 L9 2 L15 2 L15 14 L9 14 L8 13 L7 14 L1 14 Z', I) +
      p('M2 3 L7 3 L7 13 L2 13 Z', L) + p('M9 3 L14 3 L14 13 L9 13 Z', L) +
      r(3, 5, 3, 1, D) + r(3, 7, 3, 1, D) + r(10, 5, 3, 1, D) + r(10, 7, 3, 1, D) +
      r(7.5, 2, 1, 12, A)
    ),

    trash: wrap(
      r(5, 1, 6, 1, I) + r(3, 2, 10, 2, I) + r(4, 3, 8, 1, L) +
      p('M4 5 L12 5 L11 15 L5 15 Z', I) + p('M5 6 L11 6 L10.2 14 L5.8 14 Z', C) +
      r(6.5, 7, 1, 6, D) + r(8.5, 7, 1, 6, D)
    ),

    trashFull: wrap(
      r(5, 1, 6, 1, I) + r(3, 2, 10, 2, I) + r(4, 3, 8, 1, A) +
      p('M4 5 L12 5 L11 15 L5 15 Z', I) + p('M5 6 L11 6 L10.2 14 L5.8 14 Z', C) +
      r(6, 7, 4, 2, A) + r(6.5, 10, 1, 3, D) + r(8.5, 10, 1, 3, D)
    ),

    disk: wrap(
      r(1, 1, 14, 14, I) + r(2, 2, 12, 12, C) +
      r(5, 2, 6, 5, L) + r(6, 3, 4, 3, I) +
      r(4, 9, 8, 5, L) + r(5, 10, 5, 1, D) + r(5, 12, 3, 1, D)
    ),

    viewer: wrap(
      p('M1 3 L15 3 L15 13 L1 13 Z', I) + r(2, 4, 12, 8, TB) +
      p('M3 11 L6 7 L8 10 L10 8 L13 12 L13 12 L3 12 Z', A)
    ),

    speakerOn: wrap(
      p('M2 6 L5 6 L9 3 L9 13 L5 10 L2 10 Z', I) +
      r(10, 6, 1, 1, I) + r(11, 5, 1, 3, I) + r(12, 4, 1, 5, I) +
      r(10, 9, 1, 1, I) + r(11, 9, 1, 2, I) + r(12, 10, 1, 2, I)
    ),

    speakerOff: wrap(
      p('M2 6 L5 6 L9 3 L9 13 L5 10 L2 10 Z', I) +
      p('M11 6 L12 6 L12 7 L13 7 L13 6 L14 6 L14 7 L13 7 L13 8 L14 8 L14 9 L13 9 L13 8 L12 8 L12 9 L11 9 L11 8 L12 8 L12 7 L11 7 Z', I)
    ),

    alert: wrap(
      p('M8 0 L16 15 L0 15 Z', I) + p('M8 3 L13.6 14 L2.4 14 Z', A) +
      r(7, 6, 2, 4, I) + r(7, 11, 2, 2, I)
    ),

    info: wrap(
      p('M8 0 A8 8 0 1 1 7.99 0 Z', I) + p('M8 1.4 A6.6 6.6 0 1 1 7.99 1.4 Z', C) +
      r(7, 3, 2, 2, I) + r(7, 6, 2, 7, I)
    ),

    question: wrap(
      p('M8 0 A8 8 0 1 1 7.99 0 Z', I) + p('M8 1.4 A6.6 6.6 0 1 1 7.99 1.4 Z', C) +
      p('M5.6 5 A2.4 2.4 0 0 1 10.4 5 C10.4 7 8.6 7.2 8.6 9 L7 9 C7 6.6 8.8 6.6 8.8 5 A0.9 0.9 0 0 0 7.2 5 Z', I) +
      r(7, 10.5, 2, 2, I)
    ),

    stop: wrap(
      p('M5 0 L11 0 L16 5 L16 11 L11 16 L5 16 L0 11 L0 5 Z', I) +
      p('M5.6 1.4 L10.4 1.4 L14.6 5.6 L14.6 10.4 L10.4 14.6 L5.6 14.6 L1.4 10.4 L1.4 5.6 Z', A) +
      r(3.5, 7, 9, 2, L)
    ),

    power: wrap(
      p('M7 1 L9 1 L9 8 L7 8 Z', I) +
      p('M8 2.4 A6 6 0 1 0 8.01 2.4 L8.01 4.6 A3.8 3.8 0 1 1 8 4.6 Z', I)
    ),

    clock: wrap(
      p('M8 0 A8 8 0 1 1 7.99 0 Z', I) + p('M8 1.4 A6.6 6.6 0 1 1 7.99 1.4 Z', L) +
      r(7.5, 3.5, 1, 5, I) + r(8, 7.5, 3.5, 1, A)
    ),

    lock: wrap(
      p('M4 7 L4 5 A4 4 0 0 1 12 5 L12 7 L10 7 L10 5 A2 2 0 0 0 6 5 L6 7 Z', I) +
      r(3, 7, 10, 8, I) + r(4, 8, 8, 6, C) + r(7, 10, 2, 3, I)
    )
  };

  function get(name) { return ICONS[name] || ICONS.file; }
  function node(name, cls) {
    var s = document.createElement('span');
    if (cls) s.className = cls;
    s.innerHTML = get(name);
    return s;
  }

  M7.icons = { get: get, node: node, names: Object.keys(ICONS) };
})(window.M7);
