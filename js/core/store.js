/* MERIDIAN 7 — persistent settings (localStorage) */
(function (M7) {
  'use strict';

  var KEY = 'm7.settings';

  var DEFAULTS = {
    theme: 'oyster',
    wallpaper: 'dither',
    crt: true,
    scanlines: 0.5,
    pixelCursor: true,
    volume: 0.55,
    sfx: true,
    startupChime: true,
    keyClicks: true,
    bootMode: 'full',          /* full | fast | instant */
    saverDelay: 120,           /* seconds; 0 = off */
    saver: 'stars',            /* stars | bouncer | static | off */
    userName: 'Operator',
    machineName: 'CARTOGRAPHER',
    iconPositions: {},
    firstRun: true
  };

  var data = null;
  var listeners = [];

  function load() {
    if (data) return data;
    data = {};
    Object.keys(DEFAULTS).forEach(function (k) { data[k] = DEFAULTS[k]; });
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        Object.keys(parsed).forEach(function (k) {
          if (k in DEFAULTS) data[k] = parsed[k];
        });
      }
    } catch (e) { /* corrupt or unavailable storage: fall back to defaults */ }
    return data;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(load())); } catch (e) { /* quota / private mode */ }
  }

  function get(key) { var d = load(); return key === undefined ? d : d[key]; }

  function set(key, value) {
    var d = load();
    if (typeof key === 'object') {
      Object.keys(key).forEach(function (k) { d[k] = key[k]; });
    } else {
      if (d[key] === value) return value;
      d[key] = value;
    }
    save();
    var changed = typeof key === 'object' ? Object.keys(key) : [key];
    listeners.forEach(function (fn) { fn(changed, d); });
    return value;
  }

  function onChange(fn) { listeners.push(fn); }

  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    data = null;
    load();
  }

  function usage() {
    var total = 0;
    try {
      for (var i = 0; i < localStorage.length; i += 1) {
        var k = localStorage.key(i);
        if (k.indexOf('m7.') === 0) total += k.length + (localStorage.getItem(k) || '').length;
      }
    } catch (e) { /* ignore */ }
    return total;
  }

  M7.store = { get: get, set: set, onChange: onChange, reset: reset, usage: usage, DEFAULTS: DEFAULTS };
})(window.M7);
