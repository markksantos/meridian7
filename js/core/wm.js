/* MERIDIAN 7 — window manager */
(function (M7) {
  'use strict';

  var el = M7.el, clamp = M7.util.clamp;
  var layer = null, taskbar = null;
  var wins = [];
  var zTop = 10;
  var cascade = 0;
  var focused = null;

  function mount() {
    layer = document.getElementById('window-layer');
    taskbar = document.getElementById('tb-tasks');
  }

  function desktopRect() {
    var d = document.getElementById('desktop');
    return { w: d.clientWidth, h: d.clientHeight };
  }

  function byApp(app) { return wins.filter(function (w) { return w.app === app; }); }

  function focus(win) {
    if (focused === win && !win.el.classList.contains('minimized')) return;
    wins.forEach(function (w) { w.el.classList.add('inactive'); });
    win.el.classList.remove('inactive', 'minimized');
    zTop += 1;
    win.el.style.zIndex = zTop;
    focused = win;
    syncTaskbar();
    if (win.onFocus) win.onFocus();
  }

  function open(opts) {
    if (!layer) mount();
    if (opts.singleton) {
      var existing = byApp(opts.app)[0];
      if (existing) { focus(existing); M7.audio.play('select'); return existing; }
    }

    var d = desktopRect();
    var w = Math.min(opts.w || 460, d.w - 20);
    var h = Math.min(opts.h || 300, d.h - 20);
    var x = opts.x, y = opts.y;
    if (x === undefined || y === undefined) {
      x = 26 + (cascade % 8) * 22;
      y = 20 + (cascade % 8) * 20;
      cascade += 1;
    }
    x = clamp(x, 0, Math.max(0, d.w - w));
    y = clamp(y, 0, Math.max(0, d.h - h));

    var win = {
      id: opts.id || M7.util.uid('win'),
      app: opts.app || 'app',
      title: opts.title || 'Untitled',
      icon: opts.icon || 'file',
      resizable: opts.resizable !== false,
      minW: opts.minW || 220,
      minH: opts.minH || 120,
      onClose: opts.onClose || null,
      onResize: opts.onResize || null,
      onFocus: opts.onFocus || null,
      data: {}
    };

    var closeBtn = el('button', { class: 'win-btn close', title: 'Close' }, el('i'));
    var minBtn = el('button', { class: 'win-btn min', title: 'Collapse' }, el('i'));
    var zoomBtn = el('button', { class: 'win-btn zoom', title: 'Zoom' }, el('i'));
    var label = el('div', { class: 'win-label' }, [
      M7.icons.node(win.icon, 'win-label-icon'),
      el('span', { class: 'win-label-text', text: win.title })
    ]);

    var titlebar = el('div', { class: 'win-title' }, [
      closeBtn,
      el('div', { class: 'win-stripes' }),
      label,
      el('div', { class: 'win-stripes' }),
      minBtn, zoomBtn
    ]);

    var body = el('div', { class: 'win-body' });
    var frame = el('div', { class: 'win' + (win.resizable ? '' : ' no-resize') }, [titlebar]);

    var menubar = null;
    if (opts.menus && opts.menus.length) {
      menubar = el('div', { class: 'win-menubar' });
      opts.menus.forEach(function (m) {
        var btn = el('button', { text: m.label });
        btn.addEventListener('mousedown', function (ev) {
          ev.preventDefault();
          focus(win);
          M7.menu.open(btn, typeof m.items === 'function' ? m.items(win) : m.items, 'below');
        });
        menubar.appendChild(btn);
      });
      frame.appendChild(menubar);
    }

    frame.appendChild(body);

    var status = null;
    if (opts.status) {
      status = el('div', { class: 'win-status' });
      frame.appendChild(status);
    }

    if (win.resizable) frame.appendChild(el('div', { class: 'win-grip', title: 'Resize' }));

    Object.assign(frame.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });

    win.el = frame;
    win.body = body;
    win.titleEl = label.querySelector('.win-label-text');
    win.statusEl = status;

    win.setTitle = function (t) { win.title = t; win.titleEl.textContent = t; syncTaskbar(); };
    win.setStatus = function () {
      if (!status) return;
      status.innerHTML = '';
      Array.prototype.forEach.call(arguments, function (part) {
        status.appendChild(typeof part === 'string' ? el('span', { text: part }) : part);
      });
    };
    win.close = function () { closeWin(win); };
    win.focus = function () { focus(win); };
    win.center = function () {
      var r = desktopRect(), b = frame.getBoundingClientRect();
      frame.style.left = Math.max(0, ((r.w - b.width) / 2) | 0) + 'px';
      frame.style.top = Math.max(0, ((r.h - b.height) / 2.6) | 0) + 'px';
    };

    /* --- interactions --- */
    frame.addEventListener('pointerdown', function () { focus(win); }, true);

    titlebar.addEventListener('pointerdown', function (ev) {
      if (ev.target.closest('.win-btn')) return;
      ev.preventDefault();
      var startX = frame.offsetLeft, startY = frame.offsetTop;
      var ghost = null;
      M7.util.drag(ev, {
        begin: function () {
          ghost = el('div', { class: 'win-drag-ghost' });
          Object.assign(ghost.style, {
            left: startX + 'px', top: startY + 'px',
            width: frame.offsetWidth + 'px', height: frame.offsetHeight + 'px'
          });
          layer.appendChild(ghost);
        },
        move: function (dx, dy) {
          var r = desktopRect();
          ghost.style.left = clamp(startX + dx, -frame.offsetWidth + 60, r.w - 60) + 'px';
          ghost.style.top = clamp(startY + dy, 0, r.h - 22) + 'px';
        },
        end: function (moved) {
          if (!moved || !ghost) return;
          frame.style.left = ghost.style.left;
          frame.style.top = ghost.style.top;
          ghost.remove();
          M7.audio.play('drop');
        }
      });
    });

    var grip = frame.querySelector('.win-grip');
    if (grip) {
      grip.addEventListener('pointerdown', function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        var startW = frame.offsetWidth, startH = frame.offsetHeight;
        var ghost = null;
        M7.util.drag(ev, {
          begin: function () {
            ghost = el('div', { class: 'win-drag-ghost' });
            Object.assign(ghost.style, {
              left: frame.offsetLeft + 'px', top: frame.offsetTop + 'px',
              width: startW + 'px', height: startH + 'px'
            });
            layer.appendChild(ghost);
          },
          move: function (dx, dy) {
            var r = desktopRect();
            ghost.style.width = clamp(startW + dx, win.minW, r.w - frame.offsetLeft) + 'px';
            ghost.style.height = clamp(startH + dy, win.minH, r.h - frame.offsetTop) + 'px';
          },
          end: function (moved) {
            if (!moved || !ghost) return;
            frame.style.width = ghost.style.width;
            frame.style.height = ghost.style.height;
            ghost.remove();
            M7.audio.play('drop');
            if (win.onResize) win.onResize(win);
          }
        });
      });
    }

    closeBtn.addEventListener('click', function (e) { e.stopPropagation(); closeWin(win); });
    minBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      frame.classList.add('minimized');
      M7.audio.play('minimize');
      focused = null;
      syncTaskbar();
    });
    zoomBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleZoom(win);
    });
    titlebar.addEventListener('dblclick', function (e) {
      if (e.target.closest('.win-btn')) return;
      toggleZoom(win);
    });

    layer.appendChild(frame);
    wins.push(win);
    focus(win);
    M7.audio.play('open');

    if (opts.build) opts.build(body, win);
    syncTaskbar();
    return win;
  }

  function toggleZoom(win) {
    var frame = win.el, r = desktopRect();
    if (frame.classList.contains('maximized')) {
      var s = win.data._restore;
      frame.classList.remove('maximized');
      if (s) Object.assign(frame.style, s);
      M7.audio.play('restore');
    } else {
      win.data._restore = {
        left: frame.style.left, top: frame.style.top,
        width: frame.style.width, height: frame.style.height
      };
      frame.classList.add('maximized');
      Object.assign(frame.style, { left: '0px', top: '0px', width: r.w + 'px', height: r.h + 'px' });
      M7.audio.play('restore');
    }
    if (win.onResize) win.onResize(win);
  }

  function closeWin(win) {
    if (win.onClose && win.onClose(win) === false) return;
    win.el.remove();
    wins = wins.filter(function (w) { return w !== win; });
    if (focused === win) focused = null;
    M7.audio.play('close');
    var next = wins.filter(function (w) { return !w.el.classList.contains('minimized'); }).pop();
    if (next) focus(next); else syncTaskbar();
  }

  function closeAll() {
    wins.slice().forEach(function (w) {
      if (w.onClose) w.onClose(w);
      w.el.remove();
    });
    wins = []; focused = null; syncTaskbar();
  }

  function syncTaskbar() {
    if (!taskbar) mount();
    if (!taskbar) return;
    taskbar.innerHTML = '';
    wins.forEach(function (w) {
      var btn = el('button', {
        class: 'tb-task' + (w === focused ? ' active' : ''),
        title: w.title,
        onclick: function () {
          if (w === focused && !w.el.classList.contains('minimized')) {
            w.el.classList.add('minimized');
            focused = null;
            M7.audio.play('minimize');
            syncTaskbar();
          } else {
            focus(w);
            M7.audio.play('restore');
          }
        }
      }, [M7.icons.node(w.icon), el('span', { text: w.title })]);
      taskbar.appendChild(btn);
    });
  }

  function tile() {
    var r = desktopRect();
    var open = wins.filter(function (w) { return !w.el.classList.contains('minimized'); });
    if (!open.length) return;
    var cols = Math.ceil(Math.sqrt(open.length));
    var rows = Math.ceil(open.length / cols);
    var cw = Math.floor(r.w / cols), chh = Math.floor(r.h / rows);
    open.forEach(function (w, i) {
      w.el.classList.remove('maximized');
      Object.assign(w.el.style, {
        left: (i % cols) * cw + 'px',
        top: Math.floor(i / cols) * chh + 'px',
        width: (cw - 3) + 'px',
        height: (chh - 3) + 'px'
      });
      if (w.onResize) w.onResize(w);
    });
    M7.audio.play('drop');
  }

  function stack() {
    wins.filter(function (w) { return !w.el.classList.contains('minimized'); })
      .forEach(function (w, i) {
        w.el.classList.remove('maximized');
        Object.assign(w.el.style, { left: (20 + i * 24) + 'px', top: (16 + i * 22) + 'px' });
      });
    M7.audio.play('drop');
  }

  M7.wm = {
    open: open, focus: focus, close: closeWin, closeAll: closeAll,
    byApp: byApp, syncTaskbar: syncTaskbar, tile: tile, stack: stack, toggleZoom: toggleZoom,
    get windows() { return wins.slice(); },
    get focused() { return focused; },
    mount: mount
  };
})(window.M7);
