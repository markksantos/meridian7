/* MERIDIAN 7 — modal dialogs in system style */
(function (M7) {
  'use strict';

  var el = M7.el;

  function layer() { return document.getElementById('dialog-layer'); }

  function show(opts) {
    return new Promise(function (resolve) {
      var lay = layer();
      lay.classList.add('busy');

      var input = null;
      if (opts.prompt !== undefined) {
        input = el('input', { type: 'text', value: opts.prompt || '', spellcheck: 'false' });
      }

      var dlg = el('div', { class: 'dlg' }, [
        el('div', { class: 'dlg-title', text: opts.title || 'Meridian 7' }),
        el('div', { class: 'dlg-body' }, [
          M7.icons.node(opts.icon || 'info'),
          el('div', { class: 'dlg-msg' }, [
            opts.heading ? el('strong', { text: opts.heading }) : null,
            el('span', { text: opts.message || '' })
          ])
        ]),
        input ? el('div', { class: 'dlg-input' }, input) : null,
        el('div', { class: 'dlg-foot' })
      ]);

      var foot = dlg.querySelector('.dlg-foot');
      var buttons = opts.buttons || [{ label: 'OK', value: true, default: true }];

      function finish(value) {
        document.removeEventListener('keydown', onKey, true);
        dlg.remove();
        if (!lay.children.length) lay.classList.remove('busy');
        resolve(input && value !== false && value !== null ? input.value : value);
      }

      buttons.forEach(function (b) {
        foot.appendChild(el('button', {
          class: 'btn' + (b.default ? ' default' : ''),
          text: b.label,
          onclick: function () { M7.audio.play('click'); finish(b.value); }
        }));
      });

      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); M7.audio.play('click'); finish(false); }
        else if (e.key === 'Enter') {
          e.preventDefault(); e.stopPropagation();
          var def = buttons.filter(function (b) { return b.default; })[0] || buttons[buttons.length - 1];
          M7.audio.play('click');
          finish(def.value);
        }
      }
      document.addEventListener('keydown', onKey, true);

      lay.appendChild(dlg);
      var r = dlg.getBoundingClientRect();
      dlg.style.left = Math.max(8, (window.innerWidth - r.width) / 2) + 'px';
      dlg.style.top = Math.max(30, (window.innerHeight - r.height) / 2.8) + 'px';

      M7.audio.play(opts.sound || 'alert');
      if (input) { input.focus(); input.select(); }
    });
  }

  function alert(message, heading, icon) {
    return show({ message: message, heading: heading, icon: icon || 'alert', sound: 'alert' });
  }

  function error(message, heading) {
    return show({ message: message, heading: heading || 'The system encountered a problem.', icon: 'stop', sound: 'error' });
  }

  function confirm(message, heading, okLabel) {
    return show({
      message: message, heading: heading, icon: 'question', sound: 'alert',
      buttons: [
        { label: 'Cancel', value: false },
        { label: okLabel || 'OK', value: true, default: true }
      ]
    });
  }

  function prompt(message, value, heading) {
    return show({
      message: message, heading: heading, prompt: value || '', icon: 'question', sound: 'alert',
      buttons: [
        { label: 'Cancel', value: false },
        { label: 'OK', value: true, default: true }
      ]
    });
  }

  /* Directory list used by the open/save choosers. */
  function dirOptions() {
    var dirs = ['/'];
    M7.vfs.walk('/', function (path, item) {
      if (item.type === 'dir' && path.indexOf('/System') !== 0) dirs.push(path);
    });
    return dirs;
  }

  /* Open chooser. filter(item, path) decides what is listed. */
  function chooseFile(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var lay = layer();
      lay.classList.add('busy');
      var chosen = null;

      var list = el('div', { class: 'chooser-list scroll' });
      var pathLabel = el('div', { class: 'chooser-path mono' });

      function fill(dir) {
        pathLabel.textContent = dir;
        list.innerHTML = '';
        if (dir !== '/') {
          list.appendChild(el('button', {
            class: 'chooser-row', html: M7.icons.get('folderOpen') + '<span>..</span>',
            onclick: function () { M7.audio.play('select'); fill(M7.vfs.dirName(dir)); }
          }));
        }
        (M7.vfs.list(dir) || []).forEach(function (item) {
          var full = (dir === '/' ? '' : dir) + '/' + item.name;
          if (item.type === 'file' && opts.filter && !opts.filter(item, full)) return;
          var row = el('button', {
            class: 'chooser-row', html: M7.icons.get(M7.vfs.iconFor(item)) + '<span>' + M7.util.esc(item.name) + '</span>',
            onclick: function () {
              M7.audio.play('select');
              if (item.type === 'dir') { fill(full); return; }
              chosen = full;
              M7.$$('.chooser-row', list).forEach(function (n) { n.classList.remove('selected'); });
              row.classList.add('selected');
            },
            ondblclick: function () { if (item.type === 'file') finish(full); }
          });
          list.appendChild(row);
        });
      }

      var dlg = el('div', { class: 'dlg chooser' }, [
        el('div', { class: 'dlg-title', text: opts.title || 'Open' }),
        pathLabel, list,
        el('div', { class: 'dlg-foot' }, [
          el('button', { class: 'btn', text: 'Cancel', onclick: function () { M7.audio.play('click'); finish(false); } }),
          el('button', { class: 'btn default', text: 'Open', onclick: function () {
            M7.audio.play('click');
            if (!chosen) { M7.audio.play('error'); return; }
            finish(chosen);
          } })
        ])
      ]);

      function finish(v) {
        document.removeEventListener('keydown', onKey, true);
        dlg.remove();
        if (!lay.children.length) lay.classList.remove('busy');
        resolve(v);
      }
      function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(false); } }
      document.addEventListener('keydown', onKey, true);

      fill(opts.start || '/Documents');
      lay.appendChild(dlg);
      var r = dlg.getBoundingClientRect();
      dlg.style.left = Math.max(8, (window.innerWidth - r.width) / 2) + 'px';
      dlg.style.top = Math.max(30, (window.innerHeight - r.height) / 3) + 'px';
      M7.audio.play('alert');
    });
  }

  /* Save chooser: name field plus destination folder. Resolves to a full path. */
  function saveFile(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var lay = layer();
      lay.classList.add('busy');

      var name = el('input', { type: 'text', value: opts.name || 'Untitled', spellcheck: 'false' });
      var dirs = dirOptions();
      var select = el('select', {}, dirs.map(function (d) {
        return el('option', { value: d, text: d === '/' ? '/ (Cartographer)' : d });
      }));
      select.value = dirs.indexOf(opts.dir) >= 0 ? opts.dir : '/Documents';

      var dlg = el('div', { class: 'dlg chooser save' }, [
        el('div', { class: 'dlg-title', text: opts.title || 'Save' }),
        el('div', { class: 'chooser-form' }, [
          el('label', { class: 'chooser-field' }, [el('span', { text: 'Save as' }), name]),
          el('label', { class: 'chooser-field' }, [el('span', { text: 'Where' }), select])
        ]),
        el('div', { class: 'dlg-foot' }, [
          el('button', { class: 'btn', text: 'Cancel', onclick: function () { M7.audio.play('click'); finish(false); } }),
          el('button', { class: 'btn default', text: 'Save', onclick: submit })
        ])
      ]);

      function submit() {
        M7.audio.play('click');
        var n = name.value.trim();
        if (!n) { M7.audio.play('error'); return; }
        var dir = select.value;
        finish((dir === '/' ? '' : dir) + '/' + n);
      }
      function finish(v) {
        document.removeEventListener('keydown', onKey, true);
        dlg.remove();
        if (!lay.children.length) lay.classList.remove('busy');
        resolve(v);
      }
      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(false); }
        if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); submit(); }
      }
      document.addEventListener('keydown', onKey, true);

      lay.appendChild(dlg);
      var r = dlg.getBoundingClientRect();
      dlg.style.left = Math.max(8, (window.innerWidth - r.width) / 2) + 'px';
      dlg.style.top = Math.max(30, (window.innerHeight - r.height) / 3) + 'px';
      name.focus(); name.select();
      M7.audio.play('alert');
    });
  }

  M7.dialog = { show: show, alert: alert, error: error, confirm: confirm, prompt: prompt,
                chooseFile: chooseFile, saveFile: saveFile };
})(window.M7);
