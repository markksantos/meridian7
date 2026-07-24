/* MERIDIAN 7 — Control Panel */
(function (M7) {
  'use strict';

  var el = M7.el, store = M7.store;

  var TABS = [
    { id: 'appearance', label: 'Appearance' },
    { id: 'sound', label: 'Sound' },
    { id: 'system', label: 'System' },
    { id: 'storage', label: 'Storage' }
  ];

  function launch(tab) {
    var current = typeof tab === 'string' ? tab : 'appearance';
    var tabsEl = el('div', { class: 'cp-tabs' });
    var paneEl = el('div', { class: 'cp-pane scroll' });
    var win;

    function setTab(id) {
      current = id;
      M7.$$('.cp-tab', tabsEl).forEach(function (b) { b.classList.toggle('pressed', b.dataset.tab === id); });
      paneEl.innerHTML = '';
      PANES[id]();
      win.setStatus('Control Panel', TABS.filter(function (t) { return t.id === id; })[0].label);
    }

    TABS.forEach(function (t) {
      tabsEl.appendChild(el('button', {
        class: 'btn cp-tab', 'data-tab': t.id, text: t.label,
        onclick: function () { M7.audio.play('click'); setTab(t.id); }
      }));
    });

    function group(title, children) {
      return el('fieldset', {}, [el('legend', { text: title })].concat(children));
    }

    function rowCheck(label, key, after) {
      var input = el('input', { type: 'checkbox' });
      input.checked = !!store.get(key);
      input.addEventListener('change', function () {
        store.set(key, input.checked);
        M7.audio.play('toggle');
        if (after) after();
      });
      return el('label', { class: 'check' }, [input, el('span', { text: label })]);
    }

    function rowRange(label, key, min, max, step, fmt, after) {
      var value = el('span', { class: 'cp-val mono' });
      var input = el('input', { type: 'range', min: min, max: max, step: step });
      input.value = store.get(key);
      function paint() { value.textContent = fmt(Number(input.value)); }
      paint();
      input.addEventListener('input', function () {
        store.set(key, Number(input.value));
        paint();
        if (after) after();
      });
      input.addEventListener('change', function () { M7.audio.play('tick'); });
      return el('div', { class: 'cp-row' }, [el('span', { class: 'cp-label', text: label }), input, value]);
    }

    var PANES = {

      appearance: function () {
        var themeGrid = el('div', { class: 'cp-themes' });
        M7.theme.THEMES.forEach(function (t) {
          var chip = el('button', {
            class: 'cp-theme' + (store.get('theme') === t.id ? ' selected' : ''),
            'data-theme-id': t.id,
            title: t.note,
            onclick: function () {
              store.set('theme', t.id);
              M7.theme.applyTheme();
              M7.audio.play('toggle');
              M7.$$('.cp-theme', themeGrid).forEach(function (n) {
                n.classList.toggle('selected', n.dataset.themeId === t.id);
              });
              paintPatterns();
            }
          }, [
            el('span', { class: 'cp-theme-swatch', 'data-swatch': t.id }),
            el('span', { class: 'cp-theme-name', text: t.name })
          ]);
          themeGrid.appendChild(chip);
        });

        var patternGrid = el('div', { class: 'cp-patterns' });
        function paintPatterns() {
          patternGrid.innerHTML = '';
          M7.theme.PATTERNS.forEach(function (p) {
            var sw = el('button', {
              class: 'cp-pattern' + (store.get('wallpaper') === p ? ' selected' : ''),
              title: p,
              onclick: function () {
                store.set('wallpaper', p);
                M7.theme.applyWallpaper();
                M7.audio.play('toggle');
                paintPatterns();
              }
            }, el('span', { class: 'cp-pattern-name', text: p }));
            /* Preview swatch uses the same generator that paints the desktop. */
            var prev = el('span', { class: 'cp-pattern-swatch' });
            prev.style.backgroundImage = 'url(' + M7.theme.patternURL(p) + ')';
            sw.insertBefore(prev, sw.firstChild);
            patternGrid.appendChild(sw);
          });
        }

        paintPatterns();

        paneEl.append(
          group('COLOR SCHEME', [themeGrid]),
          group('DESKTOP PATTERN', [patternGrid]),
          group('SCREEN', [
            rowCheck('CRT effect (scanlines and vignette)', 'crt', function () { M7.theme.applyCRT(); }),
            rowRange('Scanline strength', 'scanlines', 0, 1, 0.05,
              function (v) { return Math.round(v * 100) + '%'; },
              function () { M7.theme.applyCRT(); }),
            rowCheck('Pixel arrow cursor', 'pixelCursor', function () { M7.theme.applyCursor(); })
          ])
        );
      },

      sound: function () {
        paneEl.append(
          group('OUTPUT', [
            rowRange('Master volume', 'volume', 0, 1, 0.05,
              function (v) { return Math.round(v * 100) + '%'; },
              function () { M7.audio.setVolume(store.get('volume')); })
          ]),
          group('SYSTEM SOUNDS', [
            rowCheck('Interface sound effects', 'sfx'),
            rowCheck('Key clicks while typing', 'keyClicks'),
            rowCheck('Startup chime', 'startupChime')
          ]),
          group('TEST', [
            el('div', { class: 'cp-sfx' }, ['chime', 'open', 'close', 'error', 'alert', 'trash', 'disk', 'beep', 'win']
              .map(function (name) {
                return el('button', {
                  class: 'btn', text: name,
                  onclick: function () { M7.audio.init(); M7.audio.resume(); M7.audio.play(name); }
                });
              }))
          ])
        );
      },

      system: function () {
        var nameInput = el('input', { type: 'text', value: store.get('userName') });
        nameInput.addEventListener('change', function () {
          store.set('userName', nameInput.value.trim() || 'Operator');
          M7.audio.play('tick');
        });

        var machineInput = el('input', { type: 'text', value: store.get('machineName') });
        machineInput.addEventListener('change', function () {
          store.set('machineName', (machineInput.value.trim() || 'CARTOGRAPHER').toUpperCase());
          M7.audio.play('tick');
        });

        var bootSelect = el('select', {}, [
          el('option', { value: 'full', text: 'Full — POST, memory test and splash' }),
          el('option', { value: 'fast', text: 'Fast — same sequence, hurried' }),
          el('option', { value: 'instant', text: 'Instant — straight to the desktop' })
        ]);
        bootSelect.value = store.get('bootMode');
        bootSelect.addEventListener('change', function () {
          store.set('bootMode', bootSelect.value);
          M7.audio.play('toggle');
        });

        var saverSelect = el('select', {}, [
          el('option', { value: 'stars', text: 'Starfield' }),
          el('option', { value: 'bouncer', text: 'Bouncing Logo' }),
          el('option', { value: 'static', text: 'No Signal' }),
          el('option', { value: 'off', text: 'Off' })
        ]);
        saverSelect.value = store.get('saver');
        saverSelect.addEventListener('change', function () {
          store.set('saver', saverSelect.value);
          M7.audio.play('toggle');
        });

        paneEl.append(
          group('IDENTIFICATION', [
            el('div', { class: 'cp-row' }, [el('span', { class: 'cp-label', text: 'Operator' }), nameInput]),
            el('div', { class: 'cp-row' }, [el('span', { class: 'cp-label', text: 'Machine' }), machineInput])
          ]),
          group('STARTUP', [
            el('div', { class: 'cp-row' }, [el('span', { class: 'cp-label', text: 'Boot sequence' }), bootSelect]),
            el('div', { class: 'cp-note', text: 'Press ESC during startup to skip ahead.' })
          ]),
          group('SCREEN SAVER', [
            el('div', { class: 'cp-row' }, [el('span', { class: 'cp-label', text: 'Pattern' }), saverSelect]),
            rowRange('Start after', 'saverDelay', 0, 600, 30,
              function (v) { return v ? Math.round(v / 60 * 10) / 10 + ' min' : 'never'; }),
            el('div', { class: 'row' }, [
              el('button', { class: 'btn', text: 'Test Now', onclick: function () { M7.saver.start(true); } })
            ])
          ])
        );
      },

      storage: function () {
        var fsBytes = JSON.stringify(M7.vfs.root).length;
        var prefBytes = store.usage();
        var cap = 5 * 1024 * 1024;
        var used = fsBytes + prefBytes;
        var pct = Math.min(100, (used / cap) * 100);

        var bar = el('div', { class: 'cp-gauge bevel-in' }, el('i', { style: { width: pct.toFixed(1) + '%' } }));

        var counts = { dirs: 0, files: 0 };
        M7.vfs.walk('/', function (p, item) {
          if (item.type === 'dir') counts.dirs += 1; else counts.files += 1;
        });

        paneEl.append(
          group('FIXED DISK 0 — CARTOGRAPHER', [
            bar,
            el('div', { class: 'cp-note mono', text: M7.util.fmtBytes(used) + ' used of ' + M7.util.fmtBytes(cap) + '  (' + pct.toFixed(1) + '%)' }),
            el('div', { class: 'cp-note', text: counts.files + ' files in ' + counts.dirs + ' folders' }),
            el('div', { class: 'cp-note mono', text: 'documents ' + M7.util.fmtBytes(fsBytes) + '   ·   preferences ' + M7.util.fmtBytes(prefBytes) })
          ]),
          group('MAINTENANCE', [
            el('div', { class: 'row' }, [
              el('button', {
                class: 'btn', text: 'Empty Trash',
                onclick: function () {
                  var n = Object.keys(M7.vfs.node('/Trash').children).length;
                  if (!n) { M7.audio.play('error'); return; }
                  M7.dialog.confirm('Remove ' + n + ' item' + (n === 1 ? '' : 's') + ' for good?', 'Empty the Trash?', 'Empty')
                    .then(function (ok) { if (ok) { M7.vfs.emptyTrash(); M7.audio.play('trash'); setTab('storage'); } });
                }
              }),
              el('button', {
                class: 'btn', text: 'Reset Preferences…',
                onclick: function () {
                  M7.dialog.confirm('Themes, sound settings and icon positions return to factory values. Your files are untouched.',
                    'Reset preferences?', 'Reset').then(function (ok) {
                    if (!ok) return;
                    store.reset();
                    M7.theme.applyAll();
                    M7.desktop.refresh();
                    M7.audio.setVolume(store.get('volume'));
                    M7.audio.play('chime');
                    setTab('appearance');
                  });
                }
              }),
              el('button', {
                class: 'btn', text: 'Erase Disk…',
                onclick: function () {
                  M7.dialog.confirm('Every file you have created will be destroyed and the disk returned to its factory contents. This cannot be undone.',
                    'Erase the disk?', 'Erase').then(function (ok) {
                    if (!ok) return;
                    M7.vfs.reset();
                    M7.wm.closeAll();
                    M7.desktop.refresh();
                    M7.audio.play('trash');
                    M7.dialog.alert('The disk has been erased and reformatted.', 'Erase complete', 'info');
                  });
                }
              })
            ])
          ])
        );
      }
    };

    win = M7.wm.open({
      app: 'control', title: 'Control Panel', icon: 'control',
      w: 468, h: 486, minW: 380, minH: 300, singleton: true, status: true,
      build: function (body) {
        body.appendChild(el('div', { class: 'cp' }, [tabsEl, paneEl]));
      }
    });

    setTab(current);
    return win;
  }

  M7.registerApp({ id: 'control', name: 'Control Panel', icon: 'control', launch: launch });
})(window.M7);
