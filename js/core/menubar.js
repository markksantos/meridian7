/* MERIDIAN 7 — dropdown menus and the top menu bar */
(function (M7) {
  'use strict';

  var el = M7.el;
  var openEl = null, openAnchor = null;

  /* ---------------- menu primitive ---------------- */

  function closeMenu() {
    if (openEl) { openEl.remove(); openEl = null; }
    if (openAnchor) { openAnchor.classList.remove('open'); openAnchor = null; }
  }

  function build(items) {
    var menu = el('div', { class: 'menu' });
    items.forEach(function (it) {
      if (!it) return;
      if (it.sep) { menu.appendChild(el('div', { class: 'menu-sep' })); return; }
      if (it.header) { menu.appendChild(el('div', { class: 'menu-label', text: it.header })); return; }
      var btn = el('button', {
        class: 'menu-item',
        disabled: it.disabled ? true : null,
        onclick: function () {
          if (it.disabled) return;
          closeMenu();
          M7.audio.play('click');
          if (it.action) it.action();
        }
      }, [
        el('span', { class: 'mi-ico', html: it.icon ? M7.icons.get(it.icon) : (it.checked ? '&#10003;' : '') }),
        el('span', { text: it.label }),
        it.key ? el('span', { class: 'mi-key', text: it.key }) : null
      ]);
      menu.appendChild(btn);
    });
    return menu;
  }

  function place(menu, x, y) {
    document.getElementById('menu-layer').appendChild(menu);
    var r = menu.getBoundingClientRect();
    if (x + r.width > window.innerWidth - 4) x = window.innerWidth - r.width - 4;
    if (y + r.height > window.innerHeight - 4) y = Math.max(24, window.innerHeight - r.height - 4);
    menu.style.left = Math.max(2, x) + 'px';
    menu.style.top = Math.max(2, y) + 'px';
  }

  function open(anchor, items, placement) {
    var wasSame = openAnchor === anchor;
    closeMenu();
    if (wasSame) return;
    var menu = build(items);
    var r = anchor.getBoundingClientRect();
    place(menu, placement === 'below' ? r.left : r.left, r.bottom);
    openEl = menu;
    openAnchor = anchor;
    anchor.classList.add('open');
    M7.audio.play('tick');
  }

  function context(x, y, items) {
    closeMenu();
    var menu = build(items);
    place(menu, x, y);
    openEl = menu;
    M7.audio.play('tick');
  }

  document.addEventListener('pointerdown', function (e) {
    if (!openEl) return;
    if (e.target.closest('.menu')) return;
    if (openAnchor && e.target.closest('.mb-item, .win-menubar button') === openAnchor) return;
    closeMenu();
  }, true);

  window.addEventListener('blur', closeMenu);

  M7.menu = { open: open, context: context, close: closeMenu, build: build };

  /* ---------------- top menu bar ---------------- */

  function programsMenu() {
    return M7.appOrder.filter(function (id) { return !M7.apps[id].hidden; }).map(function (id) {
      var a = M7.apps[id];
      return { label: a.name, icon: a.icon, key: a.key, action: function () { M7.launch(id); } };
    });
  }

  function systemMenu() {
    return [
      { header: 'MERIDIAN 7' },
      { label: 'About This Workstation…', icon: 'logo', action: function () { M7.launch('sysinfo'); } },
      { sep: true },
      { label: 'Control Panel…', icon: 'control', action: function () { M7.launch('control'); } },
      { label: 'Handbook', icon: 'handbook', action: function () { M7.launch('handbook'); } },
      { sep: true },
      { label: 'Start Screen Saver', icon: 'lock', action: function () { M7.saver.start(true); } },
      { label: 'Restart…', action: function () { M7.boot.restart(); } },
      { label: 'Shut Down…', icon: 'power', action: function () { M7.boot.shutdown(); } }
    ];
  }

  function viewMenu() {
    var cur = M7.store.get('theme');
    var items = [{ header: 'COLOR SCHEME' }];
    M7.theme.THEMES.forEach(function (t) {
      items.push({
        label: t.name, checked: cur === t.id,
        action: function () { M7.store.set('theme', t.id); M7.theme.applyTheme(); M7.audio.play('toggle'); }
      });
    });
    items.push({ sep: true });
    items.push({ label: 'Desktop Pattern…', icon: 'paint', action: function () { M7.launch('control', 'appearance'); } });
    items.push({
      label: 'CRT Effect', checked: M7.store.get('crt'),
      action: function () { M7.store.set('crt', !M7.store.get('crt')); M7.theme.applyCRT(); M7.audio.play('toggle'); }
    });
    return items;
  }

  function specialMenu() {
    var trash = M7.vfs.node('/Trash');
    var count = trash ? Object.keys(trash.children).length : 0;
    return [
      { label: 'Clean Up Desktop', action: function () { M7.desktop.arrange(); } },
      { label: 'Tile Windows', action: function () { M7.wm.tile(); } },
      { label: 'Stack Windows', action: function () { M7.wm.stack(); } },
      { label: 'Close All Windows', disabled: !M7.wm.windows.length, action: function () { M7.wm.closeAll(); } },
      { sep: true },
      {
        label: 'Empty Trash…', icon: count ? 'trashFull' : 'trash', disabled: !count,
        action: function () {
          M7.dialog.confirm(
            'The Trash holds ' + count + ' item' + (count === 1 ? '' : 's') + '. This cannot be undone.',
            'Empty the Trash?', 'Empty'
          ).then(function (ok) {
            if (!ok) return;
            M7.vfs.emptyTrash();
            M7.audio.play('trash');
            M7.desktop.refresh();
          });
        }
      },
      { sep: true },
      { label: 'Eject Disk', disabled: true },
      { label: 'Erase Disk…', disabled: true }
    ];
  }

  function initBar() {
    var map = { system: systemMenu, programs: programsMenu, view: viewMenu, special: specialMenu };
    M7.$$('#menubar .mb-item').forEach(function (btn) {
      btn.addEventListener('mousedown', function (e) {
        e.preventDefault();
        open(btn, map[btn.dataset.menu](), 'below');
      });
      btn.addEventListener('mouseenter', function () {
        if (openEl && openAnchor && openAnchor !== btn && openAnchor.classList.contains('mb-item')) {
          open(btn, map[btn.dataset.menu](), 'below');
        }
      });
    });

    var clock = document.getElementById('mb-clock');
    function tickClock() { clock.textContent = M7.util.fmtClock(new Date()); }
    tickClock();
    setInterval(tickClock, 5000);
    clock.addEventListener('click', function () { M7.launch('sysinfo'); });

    var mem = document.getElementById('mb-mem');
    function tickMem() {
      var used = 640 + Math.round(M7.store.usage() / 512) + M7.wm.windows.length * 180;
      mem.textContent = used + 'K / 16384K';
    }
    tickMem();
    setInterval(tickMem, 4000);

    var sound = document.getElementById('mb-sound');
    function paintSound() {
      sound.innerHTML = M7.icons.get(M7.store.get('sfx') && M7.store.get('volume') > 0 ? 'speakerOn' : 'speakerOff');
    }
    paintSound();
    sound.addEventListener('click', function () {
      M7.store.set('sfx', !M7.store.get('sfx'));
      paintSound();
      M7.audio.play('toggle');
    });

    var vol = document.getElementById('tb-vol');
    vol.value = Math.round(M7.store.get('volume') * 100);
    vol.addEventListener('input', function () {
      var v = Number(vol.value) / 100;
      M7.store.set('volume', v);
      M7.audio.setVolume(v);
      paintSound();
    });
    vol.addEventListener('change', function () { M7.audio.play('tick'); });

    document.getElementById('tb-saver').addEventListener('click', function () { M7.saver.start(true); });

    M7.store.onChange(function (keys) {
      if (keys.indexOf('volume') >= 0) vol.value = Math.round(M7.store.get('volume') * 100);
      if (keys.indexOf('sfx') >= 0 || keys.indexOf('volume') >= 0) paintSound();
    });

    M7.menubar.paintSound = paintSound;
  }

  M7.menubar = { init: initBar };
})(window.M7);
