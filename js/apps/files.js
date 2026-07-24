/* MERIDIAN 7 — Files */
(function (M7) {
  'use strict';

  var el = M7.el;

  function makeBrowser(win, startPath) {
    var path = startPath || '/';
    var view = 'icon';
    var selected = null;

    var pathBar = el('div', { class: 'fb-path' });
    var listEl = el('div', { class: 'fb-list scroll' });
    var toolbar = el('div', { class: 'fb-tools' });

    function toolBtn(label, title, fn) {
      return el('button', { class: 'btn fb-tool', text: label, title: title, onclick: fn });
    }

    var upBtn = toolBtn('Up', 'Go to the enclosing folder', function () { go(M7.vfs.dirName(path)); });
    var newBtn = toolBtn('New Folder', 'Create a folder here', newFolder);
    var delBtn = toolBtn('Trash', 'Move the selection to the Trash', trashSelected);
    var infoBtn = toolBtn('Info', 'Show information', infoSelected);
    var viewBtn = toolBtn('List', 'Switch between icon and list view', function () {
      view = view === 'icon' ? 'list' : 'icon';
      viewBtn.textContent = view === 'icon' ? 'List' : 'Icons';
      render();
    });

    toolbar.append(upBtn, newBtn, delBtn, infoBtn, el('div', { class: 'grow' }), viewBtn);

    function go(next) {
      if (!M7.vfs.isDir(next)) return;
      path = next === '' ? '/' : next;
      selected = null;
      M7.audio.play('select');
      render();
    }

    function crumbs() {
      pathBar.innerHTML = '';
      var parts = path.split('/').filter(Boolean);
      var acc = '';
      pathBar.appendChild(el('button', {
        class: 'fb-crumb', html: M7.icons.get('disk') + '<span>Cartographer</span>',
        onclick: function () { go('/'); }
      }));
      parts.forEach(function (p) {
        acc += '/' + p;
        var target = acc;
        pathBar.appendChild(el('span', { class: 'fb-sep', text: '>' }));
        pathBar.appendChild(el('button', { class: 'fb-crumb', text: p, onclick: function () { go(target); } }));
      });
    }

    function openItem(item, full) {
      if (item.type === 'dir') { go(full); return; }
      var app = M7.vfs.appFor(item);
      if (!app) {
        M7.dialog.alert('“' + item.name + '” is part of the system software and cannot be opened.', 'System file', 'info');
        return;
      }
      M7.launch(app, full);
    }

    function itemMenu(item, full, x, y) {
      M7.menu.context(x, y, [
        { label: 'Open', icon: M7.vfs.iconFor(item), action: function () { openItem(item, full); } },
        { sep: true },
        {
          label: 'Rename…',
          action: function () {
            M7.dialog.prompt('New name for “' + item.name + '”:', item.name, 'Rename').then(function (name) {
              if (!name || name === item.name) return;
              var res = M7.vfs.rename(full, name);
              if (res.error) M7.dialog.error(res.error, 'Could not rename.');
              else render();
            });
          }
        },
        {
          label: 'Duplicate',
          action: function () {
            var base = item.name.replace(/(\.[^.]+)?$/, '');
            var ext = (item.name.match(/\.[^.]+$/) || [''])[0];
            var res = M7.vfs.copy(full, M7.vfs.dirName(full) + '/' + base + ' copy' + ext);
            if (res.error) M7.dialog.error(res.error, 'Could not duplicate.');
            else { M7.audio.play('disk'); render(); }
          }
        },
        { sep: true },
        { label: 'Get Info…', action: function () { showInfo(item, full); } },
        {
          label: path.indexOf('/Trash') === 0 ? 'Delete Immediately…' : 'Move to Trash',
          action: function () { trash(item, full); }
        }
      ]);
    }

    function trash(item, full) {
      var permanent = path.indexOf('/Trash') === 0;
      var run = function () {
        var res = M7.vfs.remove(full, permanent);
        if (res.error) M7.dialog.error(res.error, 'Could not remove the item.');
        else { M7.audio.play('trash'); selected = null; render(); M7.desktop.refresh(); }
      };
      if (permanent) {
        M7.dialog.confirm('“' + item.name + '” will be removed for good.', 'Delete immediately?', 'Delete')
          .then(function (ok) { if (ok) run(); });
      } else run();
    }

    function showInfo(item, full) {
      var lines = [
        'Where: ' + M7.vfs.dirName(full),
        'Kind: ' + (item.type === 'dir' ? 'folder' : item.kind === 'image' ? 'picture' : item.kind === 'system' ? 'system file' : 'text document'),
        'Size: ' + M7.util.fmtBytes(M7.vfs.sizeOf(item)),
        item.type === 'dir' ? 'Contains: ' + Object.keys(item.children).length + ' items' : '',
        'Modified: ' + new Date(item.modified || Date.now()).toLocaleString()
      ].filter(Boolean).join('\n');
      M7.dialog.show({ title: 'Info', icon: M7.vfs.iconFor(item), heading: item.name, message: lines });
    }

    function selectedFull() { return selected ? (path === '/' ? '' : path) + '/' + selected : null; }

    function trashSelected() {
      var full = selectedFull();
      if (!full) { M7.audio.play('error'); return; }
      trash(M7.vfs.node(full), full);
    }

    function infoSelected() {
      var full = selectedFull();
      if (!full) { M7.audio.play('error'); return; }
      showInfo(M7.vfs.node(full), full);
    }

    function newFolder() {
      M7.dialog.prompt('Name the new folder:', 'Untitled Folder', 'New Folder').then(function (name) {
        if (!name) return;
        var res = M7.vfs.mkdir((path === '/' ? '' : path) + '/' + name);
        if (res.error) M7.dialog.error(res.error, 'Could not create the folder.');
        else { M7.audio.play('disk'); render(); }
      });
    }

    function render() {
      crumbs();
      listEl.className = 'fb-list scroll ' + (view === 'icon' ? 'fb-icons' : 'fb-rows');
      listEl.innerHTML = '';
      upBtn.disabled = path === '/';

      var items = M7.vfs.list(path) || [];
      if (!items.length) {
        listEl.appendChild(el('div', { class: 'fb-empty', text: 'This folder is empty.' }));
      }

      items.forEach(function (item) {
        var full = (path === '/' ? '' : path) + '/' + item.name;
        var node;
        if (view === 'icon') {
          node = el('div', { class: 'fb-item' }, [
            el('span', { class: 'fb-glyph', html: M7.icons.get(M7.vfs.iconFor(item)) }),
            el('span', { class: 'fb-name', text: item.name })
          ]);
        } else {
          node = el('div', { class: 'fb-row' }, [
            el('span', { class: 'fb-glyph', html: M7.icons.get(M7.vfs.iconFor(item)) }),
            el('span', { class: 'fb-name', text: item.name }),
            el('span', { class: 'fb-meta', text: item.type === 'dir' ? '—' : M7.util.fmtBytes((item.content || '').length) }),
            el('span', { class: 'fb-meta', text: M7.util.fmtDate(new Date(item.modified || Date.now())) })
          ]);
        }
        if (selected === item.name) node.classList.add('selected');
        node.addEventListener('click', function () {
          selected = item.name;
          M7.$$('.selected', listEl).forEach(function (n) { n.classList.remove('selected'); });
          node.classList.add('selected');
          M7.audio.play('select');
          updateStatus();
        });
        node.addEventListener('dblclick', function () { openItem(item, full); });
        node.addEventListener('contextmenu', function (ev) {
          ev.preventDefault();
          selected = item.name;
          M7.$$('.selected', listEl).forEach(function (n) { n.classList.remove('selected'); });
          node.classList.add('selected');
          itemMenu(item, full, ev.clientX, ev.clientY);
        });
        listEl.appendChild(node);
      });

      listEl.addEventListener('contextmenu', function (ev) {
        if (ev.target.closest('.fb-item, .fb-row')) return;
        ev.preventDefault();
        M7.menu.context(ev.clientX, ev.clientY, [
          { label: 'New Folder…', icon: 'folder', action: newFolder },
          { label: 'New Text File…', icon: 'file', action: function () {
            M7.dialog.prompt('Name the new document:', 'Untitled.txt', 'New Document').then(function (name) {
              if (!name) return;
              M7.vfs.write((path === '/' ? '' : path) + '/' + name, '');
              render();
            });
          } },
          { sep: true },
          { label: 'Open Terminal Here', icon: 'terminal', action: function () { M7.launch('terminal', path); } }
        ]);
      });

      win.setTitle(path === '/' ? 'Cartographer' : M7.vfs.baseName(path));
      updateStatus();
    }

    function updateStatus() {
      var items = M7.vfs.list(path) || [];
      var size = items.reduce(function (s, i) { return s + M7.vfs.sizeOf(i); }, 0);
      win.setStatus(items.length + ' item' + (items.length === 1 ? '' : 's'),
                    M7.util.fmtBytes(size) + ' in folder',
                    selected ? 'Selected: ' + selected : '');
    }

    var root = el('div', { class: 'fb' }, [toolbar, pathBar, listEl]);
    return { root: root, go: go, render: render, newFolder: newFolder, get path() { return path; } };
  }

  /* Any window open on the filesystem redraws when the filesystem changes. */
  M7.vfs.onChange(function () {
    M7.wm.byApp('files').forEach(function (w) {
      if (w.data.browser) w.data.browser.render();
    });
  });

  M7.registerApp({
    id: 'files',
    name: 'Files',
    icon: 'files',
    launch: function (path) {
      var target = typeof path === 'string' ? path : '/';
      var existing = M7.wm.byApp('files')[0];
      if (existing) {
        existing.data.browser.go(target);
        M7.wm.focus(existing);
        return existing;
      }
      var browser;
      var win = M7.wm.open({
        app: 'files', title: 'Files', icon: 'files',
        w: 560, h: 380, minW: 360, minH: 220, status: true,
        menus: [
          {
            label: 'File',
            items: function () {
              return [
                { label: 'New Folder…', icon: 'folder', action: function () { browser.newFolder(); } },
                { sep: true },
                { label: 'Close', action: function () { win.close(); } }
              ];
            }
          },
          {
            label: 'Go',
            items: function () {
              return [
                { label: 'Cartographer', icon: 'disk', action: function () { browser.go('/'); } },
                { label: 'Documents', icon: 'folder', action: function () { browser.go('/Documents'); } },
                { label: 'Pictures', icon: 'folder', action: function () { browser.go('/Pictures'); } },
                { label: 'System', icon: 'folder', action: function () { browser.go('/System'); } },
                { sep: true },
                { label: 'Trash', icon: 'trash', action: function () { browser.go('/Trash'); } }
              ];
            }
          }
        ],
        build: function (body, w) {
          browser = makeBrowser(w, target);
          w.data.browser = browser;
          body.appendChild(browser.root);
          browser.render();
        }
      });
      return win;
    }
  });
})(window.M7);
