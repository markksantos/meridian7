/* MERIDIAN 7 — About This Workstation */
(function (M7) {
  'use strict';

  var el = M7.el;
  var BOOTED = Date.now();

  function launch() {
    var uptimeEl = el('span', { class: 'mono' });
    var win;

    function uptime() {
      var s = Math.floor((Date.now() - BOOTED) / 1000);
      var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
      return (h ? h + 'h ' : '') + m + 'm ' + (s % 60) + 's';
    }

    function bar(label, pct, note) {
      return el('div', { class: 'si-bar' }, [
        el('div', { class: 'si-bar-head' }, [
          el('span', { text: label }),
          el('span', { class: 'mono dim', text: note })
        ]),
        el('div', { class: 'si-gauge bevel-in' }, el('i', { style: { width: Math.min(100, pct) + '%' } }))
      ]);
    }

    function row(k, v) {
      return el('div', { class: 'si-row' }, [
        el('span', { class: 'si-key', text: k }),
        el('span', { class: 'si-val mono', text: v })
      ]);
    }

    var fsBytes = JSON.stringify(M7.vfs.root).length;
    var prefBytes = M7.store.usage();
    var diskPct = ((fsBytes + prefBytes) / (5 * 1024 * 1024)) * 100;
    var memUsed = 640 + M7.wm.windows.length * 180 + Math.round(fsBytes / 512);

    var real = [
      row('Display', window.screen.width + ' × ' + window.screen.height + ' @ ' +
                     (window.devicePixelRatio || 1) + 'x'),
      row('Colour depth', (window.screen.colorDepth || 24) + '-bit'),
      row('Logical CPUs', String(navigator.hardwareConcurrency || 'unknown')),
      row('Language', navigator.language || 'en'),
      row('Host', location.protocol === 'file:' ? 'local disk' : location.host)
    ];

    win = M7.wm.open({
      app: 'sysinfo', title: 'About This Workstation', icon: 'logo',
      w: 424, h: 540, minW: 340, minH: 300, singleton: true, status: true,
      build: function (body) {
        body.appendChild(el('div', { class: 'si scroll' }, [
          el('div', { class: 'si-head' }, [
            el('span', { class: 'si-logo', html: M7.icons.get('logo') }),
            el('div', {}, [
              el('div', { class: 'si-title', text: 'Meridian 7' }),
              el('div', { class: 'si-sub', text: 'Workstation System Software 7.0.2' }),
              el('div', { class: 'si-sub dim', text: '© 1989–1993 Meridian Systems Inc.' })
            ])
          ]),
          el('div', { class: 'si-block' }, [
            row('Model', 'MS-7 Cartographer'),
            row('Processor', 'MS-68030 @ 33 MHz'),
            row('Coprocessor', 'MS-68882 FPU'),
            row('Machine name', M7.store.get('machineName')),
            row('Operator', M7.store.get('userName')),
            el('div', { class: 'si-row' }, [
              el('span', { class: 'si-key', text: 'Uptime' }), uptimeEl
            ])
          ]),
          el('div', { class: 'si-block' }, [
            bar('Total memory', (memUsed / 16384) * 100, memUsed + 'K of 16384K'),
            bar('Fixed disk 0', diskPct, M7.util.fmtBytes(fsBytes + prefBytes) + ' of 5.00 M'),
            bar('System software', 22, '3608K')
          ]),
          el('fieldset', { class: 'si-real' }, [
            el('legend', { text: 'HOST HARDWARE' })
          ].concat(real)),
          el('div', { class: 'si-foot' }, [
            el('button', { class: 'btn', text: 'Control Panel', onclick: function () { M7.launch('control'); } }),
            el('button', { class: 'btn', text: 'Handbook', onclick: function () { M7.launch('handbook'); } }),
            el('button', { class: 'btn', text: 'Restart…', onclick: function () { M7.boot.restart(); } })
          ])
        ]));
      },
      onClose: function () { clearInterval(win.data.timer); return true; }
    });

    uptimeEl.textContent = uptime();
    win.data.timer = setInterval(function () { uptimeEl.textContent = uptime(); }, 1000);
    win.setStatus('MS-7 Cartographer', '16384K RAM', 'System 7.0.2');
    return win;
  }

  M7.registerApp({ id: 'sysinfo', name: 'About This Workstation', icon: 'logo', launch: launch });
})(window.M7);
