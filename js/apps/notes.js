/* MERIDIAN 7 — Notes (text editor) */
(function (M7) {
  'use strict';

  var el = M7.el;

  function launch(path) {
    var state = { path: null, dirty: false };
    var area = el('textarea', { class: 'notes-area', spellcheck: 'false', wrap: 'off' });
    var win;

    function title() {
      return (state.path ? M7.vfs.baseName(state.path) : 'Untitled') + (state.dirty ? ' •' : '');
    }

    function refreshStatus() {
      var v = area.value;
      var lines = v.split('\n').length;
      var words = v.split(/\s+/).filter(Boolean).length;
      win.setStatus(state.path || 'not saved', lines + ' lines', words + ' words', v.length + ' chars');
      win.setTitle(title());
    }

    function loadPath(p) {
      var content = M7.vfs.read(p);
      if (content === null) { M7.dialog.error('“' + p + '” could not be read.', 'File not found'); return; }
      area.value = content;
      state.path = p;
      state.dirty = false;
      refreshStatus();
      M7.audio.play('disk');
    }

    function save(as) {
      var doWrite = function (p) {
        var res = M7.vfs.write(p, area.value, 'text');
        if (res.error) { M7.dialog.error(res.error, 'Could not save.'); return; }
        state.path = p;
        state.dirty = false;
        M7.audio.play('disk');
        refreshStatus();
      };
      if (state.path && !as) { doWrite(state.path); return; }
      M7.dialog.saveFile({
        title: 'Save Document',
        name: state.path ? M7.vfs.baseName(state.path) : 'Untitled.txt',
        dir: state.path ? M7.vfs.dirName(state.path) : '/Documents'
      }).then(function (p) {
        if (!p) return;
        if (M7.vfs.exists(p)) {
          M7.dialog.confirm('“' + M7.vfs.baseName(p) + '” already exists. Replace it?', 'Replace file?', 'Replace')
            .then(function (ok) { if (ok) doWrite(p); });
        } else doWrite(p);
      });
    }

    function openFile() {
      M7.dialog.chooseFile({
        title: 'Open Document',
        start: '/Documents',
        filter: function (item) { return item.kind !== 'image' && item.kind !== 'system'; }
      }).then(function (p) { if (p) loadPath(p); });
    }

    function confirmDiscard() {
      if (!state.dirty) return Promise.resolve(true);
      return M7.dialog.confirm('Changes to “' + (state.path ? M7.vfs.baseName(state.path) : 'Untitled') + '” will be lost.',
        'Discard changes?', 'Discard');
    }

    win = M7.wm.open({
      app: 'notes', title: 'Untitled', icon: 'notes',
      w: 520, h: 380, minW: 300, minH: 180, status: true,
      menus: [
        {
          label: 'File',
          items: function () {
            return [
              { label: 'New', icon: 'file', action: function () {
                confirmDiscard().then(function (ok) {
                  if (!ok) return;
                  area.value = ''; state.path = null; state.dirty = false; refreshStatus();
                });
              } },
              { label: 'Open…', icon: 'folder', action: function () {
                confirmDiscard().then(function (ok) { if (ok) openFile(); });
              } },
              { sep: true },
              { label: 'Save', key: 'Ctrl S', action: function () { save(false); } },
              { label: 'Save As…', action: function () { save(true); } },
              { sep: true },
              { label: 'Close', action: function () { win.close(); } }
            ];
          }
        },
        {
          label: 'Edit',
          items: function () {
            return [
              { label: 'Select All', key: 'Ctrl A', action: function () { area.focus(); area.select(); } },
              { label: 'Clear', action: function () { area.value = ''; state.dirty = true; refreshStatus(); } },
              { sep: true },
              { label: 'Insert Date', action: function () {
                var d = new Date().toString();
                var pos = area.selectionStart;
                area.value = area.value.slice(0, pos) + d + area.value.slice(area.selectionEnd);
                state.dirty = true; refreshStatus();
              } },
              { label: 'Word Wrap', checked: area.wrap !== 'off', action: function () {
                area.wrap = area.wrap === 'off' ? 'soft' : 'off';
                area.style.whiteSpace = area.wrap === 'off' ? 'pre' : 'pre-wrap';
              } }
            ];
          }
        }
      ],
      onClose: function () {
        if (!state.dirty) return true;
        confirmDiscard().then(function (ok) {
          if (ok) { state.dirty = false; win.close(); }
        });
        return false;
      },
      build: function (body) { body.appendChild(area); }
    });

    area.addEventListener('input', function () {
      state.dirty = true;
      refreshStatus();
    });
    area.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(false); return; }
      if (e.key.length === 1) M7.audio.play('key');
    });

    if (typeof path === 'string' && M7.vfs.exists(path)) loadPath(path);
    else refreshStatus();
    setTimeout(function () { area.focus(); }, 30);
    return win;
  }

  M7.registerApp({ id: 'notes', name: 'Notes', icon: 'notes', launch: launch });
})(window.M7);
