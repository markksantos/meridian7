/* MERIDIAN 7 — themes, desktop patterns, CRT layer, pixel cursor */
(function (M7) {
  'use strict';

  var THEMES = [
    { id: 'oyster',    name: 'Oyster',    note: 'Warm plastic, oxblood titles' },
    { id: 'graphite',  name: 'Graphite',  note: 'Cool steel, navy titles' },
    { id: 'ferro',     name: 'Ferro',     note: 'Oxide red, industrial' },
    { id: 'blueprint', name: 'Blueprint', note: 'Drafting navy and cyan' },
    { id: 'phosphor',  name: 'Phosphor',  note: 'Green CRT monochrome' },
    { id: 'amber',     name: 'Amber',     note: 'Amber CRT monochrome' }
  ];

  var PATTERNS = ['solid', 'dither', 'dots', 'grid', 'crosshatch', 'diagonal', 'weave', 'static'];

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function makePattern(kind) {
    var base = cssVar('--desktop') || '#5a6b7b';
    var alt = cssVar('--desktop-alt') || '#4a5a6a';
    var size = 8;
    var c = document.createElement('canvas');
    var g;
    if (kind === 'solid') { c.width = c.height = 2; g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, 2, 2); return c.toDataURL(); }
    if (kind === 'dither') {
      c.width = c.height = 4; g = c.getContext('2d');
      g.fillStyle = base; g.fillRect(0, 0, 4, 4);
      g.fillStyle = alt; g.fillRect(0, 0, 2, 2); g.fillRect(2, 2, 2, 2);
      return c.toDataURL();
    }
    c.width = c.height = size;
    g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, size, size);
    g.fillStyle = alt;
    if (kind === 'dots') { g.fillRect(0, 0, 1, 1); g.fillRect(4, 4, 1, 1); }
    else if (kind === 'grid') { g.fillRect(0, 0, size, 1); g.fillRect(0, 0, 1, size); }
    else if (kind === 'crosshatch') {
      for (var i = 0; i < size; i += 1) { g.fillRect(i, i, 1, 1); g.fillRect(size - 1 - i, i, 1, 1); }
    } else if (kind === 'diagonal') {
      for (var j = 0; j < size; j += 1) { g.fillRect(j, j, 2, 1); }
    } else if (kind === 'weave') {
      g.fillRect(0, 0, 4, 1); g.fillRect(4, 4, 4, 1); g.fillRect(0, 0, 1, 4); g.fillRect(4, 4, 1, 4);
    } else if (kind === 'static') {
      var img = g.getImageData(0, 0, size, size);
      for (var k = 0; k < img.data.length; k += 4) {
        var n = (Math.random() * 26) | 0;
        img.data[k] = Math.max(0, img.data[k] - n);
        img.data[k + 1] = Math.max(0, img.data[k + 1] - n);
        img.data[k + 2] = Math.max(0, img.data[k + 2] - n);
      }
      g.putImageData(img, 0, 0);
    }
    return c.toDataURL();
  }

  function applyWallpaper() {
    var desk = document.getElementById('desktop');
    if (!desk) return;
    var kind = M7.store.get('wallpaper');
    desk.style.backgroundImage = 'url(' + makePattern(kind) + ')';
    var splash = document.getElementById('splash');
    if (splash) splash.style.backgroundImage = desk.style.backgroundImage;
  }

  var ARROW =
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="24" viewBox="0 0 20 24" shape-rendering="crispEdges">' +
    '<path d="M2 1 L2 18 L6 14 L9 21 L12 20 L9 13 L15 13 Z" fill="#fff"/>' +
    '<path d="M3 3 L3 15.6 L6.4 12.4 L9.4 19.4 L10.4 19 L7.4 12 L12.6 12 Z" fill="#000"/></svg>';

  function applyCursor() {
    var on = M7.store.get('pixelCursor');
    var url = 'url("data:image/svg+xml;base64,' + btoa(ARROW) + '") 2 1, default';
    document.documentElement.style.setProperty('--cur-arrow', on ? url : 'default');
  }

  function applyCRT() {
    document.body.classList.toggle('no-crt', !M7.store.get('crt'));
    document.documentElement.style.setProperty('--crt-scan', String(M7.store.get('scanlines')));
    document.documentElement.style.setProperty('--crt-vig', M7.store.get('crt') ? '1' : '0');
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', M7.store.get('theme'));
    applyWallpaper();
  }

  function applyAll() { applyTheme(); applyCursor(); applyCRT(); }

  M7.theme = {
    THEMES: THEMES, PATTERNS: PATTERNS,
    patternURL: makePattern,
    applyAll: applyAll, applyTheme: applyTheme, applyWallpaper: applyWallpaper,
    applyCursor: applyCursor, applyCRT: applyCRT, cssVar: cssVar
  };
})(window.M7);
