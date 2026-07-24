/* MERIDIAN 7 — util */
window.M7 = window.M7 || {};

(function (M7) {
  'use strict';

  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else if (k === 'value') node.value = v;
        else node.setAttribute(k, v === true ? '' : v);
      });
    }
    (Array.isArray(children) ? children : children != null ? [children] : []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return node;
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function clamp(n, lo, hi) { return n < lo ? lo : n > hi ? hi : n; }
  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function fmtBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' K';
    return (n / 1048576).toFixed(2) + ' M';
  }

  function fmtDate(d) {
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[d.getMonth()] + ' ' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  function fmtClock(d) {
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var h = d.getHours(), ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    return days[d.getDay()] + ' ' + h + ':' + pad2(d.getMinutes()) + ' ' + ap;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Drag helper: fires move with (dx, dy, ev) from pointer-down origin. */
  function drag(startEv, opts) {
    var sx = startEv.clientX, sy = startEv.clientY, moved = false;
    function onMove(e) {
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.abs(dx) + Math.abs(dy) > 2) { moved = true; if (opts.begin) opts.begin(e); }
      if (moved && opts.move) opts.move(dx, dy, e);
    }
    function onUp(e) {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (opts.end) opts.end(moved, e);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  var uidN = 0;
  function uid(prefix) { uidN += 1; return (prefix || 'id') + '-' + uidN; }

  /* Application registry. Each js/apps/*.js file registers itself here. */
  M7.apps = {};
  M7.appOrder = [];
  M7.registerApp = function (app) {
    M7.apps[app.id] = app;
    M7.appOrder.push(app.id);
  };
  M7.launch = function (id, arg) {
    var app = M7.apps[id];
    if (!app) return null;
    return app.launch(arg);
  };

  M7.util = { el: el, $: $, $$: $$, clamp: clamp, pad2: pad2, fmtBytes: fmtBytes,
              fmtDate: fmtDate, fmtClock: fmtClock, esc: esc, drag: drag, uid: uid };
  M7.el = el; M7.$ = $; M7.$$ = $$;
})(window.M7);
