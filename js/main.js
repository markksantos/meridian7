/* MERIDIAN 7 — startup wiring */
(function (M7) {
  'use strict';

  function firstRun() {
    if (!M7.store.get('firstRun')) return;
    M7.store.set('firstRun', false);
    setTimeout(function () {
      M7.dialog.show({
        title: 'Welcome',
        icon: 'logo',
        heading: 'Welcome to Meridian 7.',
        message: 'Everything you make here stays on this machine.\n\n' +
                 'Double-click an icon to begin, or open the Handbook for a tour of the system.',
        buttons: [
          { label: 'Look Around', value: false },
          { label: 'Open Handbook', value: true, default: true }
        ]
      }).then(function (open) { if (open) M7.launch('handbook'); });
    }, 900);
  }

  function ready() {
    M7.desktop.init();
    M7.menubar.init();
    M7.saver.init();
    firstRun();
  }

  function boot() {
    M7.theme.applyAll();
    M7.vfs.load();
    M7.boot.begin(ready);

    /* Keep the desktop pattern in step with theme changes made anywhere. */
    M7.store.onChange(function (keys) {
      if (keys.indexOf('theme') >= 0) M7.theme.applyTheme();
    });

    window.addEventListener('contextmenu', function (e) {
      /* The system supplies its own menus; suppress the browser's. */
      if (!e.target.closest('input, textarea')) e.preventDefault();
    });

    window.addEventListener('resize', function () {
      var d = document.getElementById('desktop');
      if (!d) return;
      M7.wm.windows.forEach(function (w) {
        var maxX = d.clientWidth - 60, maxY = d.clientHeight - 24;
        if (w.el.offsetLeft > maxX) w.el.style.left = Math.max(0, maxX) + 'px';
        if (w.el.offsetTop > maxY) w.el.style.top = Math.max(0, maxY) + 'px';
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.M7);
