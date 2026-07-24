/* MERIDIAN 7 — desktop: icons, selection, context menu */
(function (M7) {
  'use strict';

  var el = M7.el, clamp = M7.util.clamp;
  var layerEl = null, deskEl = null;
  var items = [];

  /* Fixed desktop items. Files/folders get added from the VFS root. */
  var BUILTIN = [
    { id: 'disk',   label: 'Cartographer', icon: 'disk',    open: function () { M7.launch('files', '/'); } },
    { id: 'docs',   label: 'Documents',    icon: 'folder',  open: function () { M7.launch('files', '/Documents'); } },
    { id: 'pics',   label: 'Pictures',     icon: 'folder',  open: function () { M7.launch('files', '/Pictures'); } },
    { id: 'term',   label: 'Terminal',     icon: 'terminal', open: function () { M7.launch('terminal'); } },
    { id: 'notes',  label: 'Notes',        icon: 'notes',   open: function () { M7.launch('notes'); } },
    { id: 'paint',  label: 'Paint',        icon: 'paint',   open: function () { M7.launch('paint'); } },
    { id: 'sweep',  label: 'Sweeper',      icon: 'sweeper', open: function () { M7.launch('sweeper'); } },
    { id: 'tape',   label: 'Tape Deck',    icon: 'tapedeck', open: function () { M7.launch('tapedeck'); } },
    { id: 'ctrl',   label: 'Control Panel', icon: 'control', open: function () { M7.launch('control'); } },
    { id: 'trash',  label: 'Trash',        icon: 'trash',   open: function () { M7.launch('files', '/Trash'); }, corner: 'bottom' }
  ];

  /* Icons stack down the right edge and wrap into a new column before
     they can reach the Trash, which owns the bottom corner. */
  function defaultPos(index, corner) {
    var r = deskEl.getBoundingClientRect();
    var colW = 92, rowH = 72, top = 10;
    var firstCol = r.width - colW;
    if (corner === 'bottom') return { x: firstCol, y: Math.max(top, r.height - 78) };
    var perCol = Math.max(1, Math.floor((r.height - 84 - top) / rowH));
    var col = Math.floor(index / perCol);
    var row = index % perCol;
    return { x: firstCol - col * colW, y: top + row * rowH };
  }

  function positions() { return M7.store.get('iconPositions') || {}; }

  function savePos(id, x, y) {
    var p = positions();
    p[id] = { x: x, y: y };
    M7.store.set('iconPositions', p);
  }

  function makeIcon(item, index) {
    var node = el('div', { class: 'dicon', 'data-id': item.id, tabindex: '-1' }, [
      el('span', { class: 'di-glyph', html: M7.icons.get(item.icon) }),
      el('span', { class: 'di-label', text: item.label })
    ]);

    var p = positions()[item.id] || defaultPos(index, item.corner);
    node.style.left = p.x + 'px';
    node.style.top = p.y + 'px';

    node.addEventListener('pointerdown', function (ev) {
      ev.stopPropagation();
      select(item.id, ev.shiftKey);
      M7.audio.play('select');
      var sx = node.offsetLeft, sy = node.offsetTop;
      M7.util.drag(ev, {
        begin: function () { node.classList.add('dragging'); },
        move: function (dx, dy) {
          var r = deskEl.getBoundingClientRect();
          node.style.left = clamp(sx + dx, 0, r.width - 76) + 'px';
          node.style.top = clamp(sy + dy, 0, r.height - 60) + 'px';
        },
        end: function (moved) {
          node.classList.remove('dragging');
          if (!moved) return;
          savePos(item.id, node.offsetLeft, node.offsetTop);
          M7.audio.play('drop');
        }
      });
    });

    node.addEventListener('dblclick', function () { item.open(); });

    node.addEventListener('contextmenu', function (ev) {
      ev.preventDefault(); ev.stopPropagation();
      select(item.id, false);
      var menu = [
        { label: 'Open', icon: item.icon, action: item.open },
        { sep: true },
        {
          label: 'Get Info…',
          action: function () {
            M7.dialog.show({
              title: 'Info', icon: item.icon, heading: item.label,
              message: item.info || 'Desktop item. Double-click to open.'
            });
          }
        }
      ];
      if (item.id === 'trash') {
        var n = Object.keys(M7.vfs.node('/Trash').children).length;
        menu.push({ sep: true });
        menu.push({
          label: 'Empty Trash…', disabled: !n,
          action: function () {
            M7.dialog.confirm('Permanently remove ' + n + ' item' + (n === 1 ? '' : 's') + '?', 'Empty the Trash?', 'Empty')
              .then(function (ok) { if (ok) { M7.vfs.emptyTrash(); M7.audio.play('trash'); refresh(); } });
          }
        });
      }
      M7.menu.context(ev.clientX, ev.clientY, menu);
    });

    return node;
  }

  function select(id, additive) {
    M7.$$('.dicon', layerEl).forEach(function (n) {
      if (!additive) n.classList.remove('selected');
      if (n.dataset.id === id) n.classList.add('selected');
    });
  }

  function clearSelection() {
    M7.$$('.dicon.selected', layerEl).forEach(function (n) { n.classList.remove('selected'); });
  }

  function refresh() {
    layerEl.innerHTML = '';
    items = BUILTIN.slice();
    var trash = M7.vfs.node('/Trash');
    var trashItem = items.filter(function (i) { return i.id === 'trash'; })[0];
    if (trashItem) trashItem.icon = trash && Object.keys(trash.children).length ? 'trashFull' : 'trash';
    items.forEach(function (item, i) { layerEl.appendChild(makeIcon(item, i)); });
  }

  function arrange() {
    M7.store.set('iconPositions', {});
    refresh();
    M7.audio.play('drop');
  }

  function contextMenu(ev) {
    ev.preventDefault();
    clearSelection();
    var patterns = M7.theme.PATTERNS.map(function (p) {
      return {
        label: p.charAt(0).toUpperCase() + p.slice(1),
        checked: M7.store.get('wallpaper') === p,
        action: function () { M7.store.set('wallpaper', p); M7.theme.applyWallpaper(); M7.audio.play('toggle'); }
      };
    });
    M7.menu.context(ev.clientX, ev.clientY, [
      { header: 'DESKTOP' },
      {
        label: 'New Folder…', icon: 'folder',
        action: function () {
          M7.dialog.prompt('Name the new folder in Documents:', 'Untitled Folder', 'New Folder')
            .then(function (name) {
              if (!name) return;
              var res = M7.vfs.mkdir('/Documents/' + name);
              if (res.error) M7.dialog.error(res.error, 'Could not create the folder.');
              else { M7.audio.play('disk'); M7.launch('files', '/Documents'); }
            });
        }
      },
      { label: 'Open Terminal', icon: 'terminal', action: function () { M7.launch('terminal'); } },
      { sep: true },
      { label: 'Clean Up Icons', action: arrange },
      { header: 'PATTERN' }
    ].concat(patterns).concat([
      { sep: true },
      { label: 'Control Panel…', icon: 'control', action: function () { M7.launch('control'); } }
    ]));
  }

  function marqueeSelect(ev) {
    if (ev.button !== 0) return;
    clearSelection();
    var box = document.getElementById('marquee');
    var r = deskEl.getBoundingClientRect();
    var ox = ev.clientX - r.left, oy = ev.clientY - r.top;
    M7.util.drag(ev, {
      begin: function () { box.hidden = false; },
      move: function (dx, dy) {
        var x = Math.min(ox, ox + dx), y = Math.min(oy, oy + dy);
        var w = Math.abs(dx), h = Math.abs(dy);
        Object.assign(box.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
        M7.$$('.dicon', layerEl).forEach(function (n) {
          var hit = n.offsetLeft < x + w && n.offsetLeft + n.offsetWidth > x &&
                    n.offsetTop < y + h && n.offsetTop + n.offsetHeight > y;
          n.classList.toggle('selected', hit);
        });
      },
      end: function () { box.hidden = true; }
    });
  }

  function init() {
    deskEl = document.getElementById('desktop');
    layerEl = document.getElementById('icon-layer');
    refresh();
    deskEl.addEventListener('pointerdown', function (ev) {
      if (ev.target.closest('.win') || ev.target.closest('.dicon')) return;
      marqueeSelect(ev);
    });
    deskEl.addEventListener('contextmenu', function (ev) {
      if (ev.target.closest('.win') || ev.target.closest('.dicon')) return;
      contextMenu(ev);
    });
    M7.vfs.onChange(function () {
      var trash = M7.vfs.node('/Trash');
      var node = M7.$('.dicon[data-id="trash"] .di-glyph', layerEl);
      if (node) node.innerHTML = M7.icons.get(trash && Object.keys(trash.children).length ? 'trashFull' : 'trash');
    });
  }

  M7.desktop = { init: init, refresh: refresh, arrange: arrange, clearSelection: clearSelection };
})(window.M7);
