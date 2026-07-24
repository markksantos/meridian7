/* MERIDIAN 7 — Picture Viewer */
(function (M7) {
  'use strict';

  var el = M7.el;

  function launch(path) {
    var current = typeof path === 'string' ? path : null;
    var img = el('img', { class: 'vw-img', alt: '' });
    var stage = el('div', { class: 'vw-stage bevel-in' }, img);
    var zoom = 2;
    var win;

    function show(p) {
      var data = M7.vfs.read(p);
      if (!data) { M7.dialog.error('That picture could not be read.', 'Open failed'); return; }
      current = p;
      img.src = data;
      img.onload = function () {
        img.style.width = (img.naturalWidth * zoom) + 'px';
        img.style.height = (img.naturalHeight * zoom) + 'px';
        win.setStatus(img.naturalWidth + ' × ' + img.naturalHeight, zoom + '×', M7.util.fmtBytes(data.length));
      };
      win.setTitle(M7.vfs.baseName(p));
      M7.audio.play('disk');
    }

    function setZoom(z) {
      zoom = z;
      if (!img.naturalWidth) return;
      img.style.width = (img.naturalWidth * zoom) + 'px';
      img.style.height = (img.naturalHeight * zoom) + 'px';
      win.setStatus(img.naturalWidth + ' × ' + img.naturalHeight, zoom + '×', '');
      M7.audio.play('click');
    }

    win = M7.wm.open({
      app: 'viewer', title: 'Picture Viewer', icon: 'viewer',
      w: 620, h: 440, minW: 260, minH: 180, status: true,
      menus: [
        {
          label: 'File',
          items: function () {
            return [
              { label: 'Open…', icon: 'folder', action: function () {
                M7.dialog.chooseFile({ title: 'Open Picture', start: '/Pictures',
                  filter: function (i) { return i.kind === 'image'; } })
                  .then(function (p) { if (p) show(p); });
              } },
              { label: 'Edit in Paint', icon: 'paint', disabled: !current,
                action: function () { M7.launch('paint', current); } },
              { sep: true },
              { label: 'Close', action: function () { win.close(); } }
            ];
          }
        },
        {
          label: 'View',
          items: function () {
            return [1, 2, 3, 4].map(function (z) {
              return { label: z + '× Actual Size', checked: zoom === z, action: function () { setZoom(z); } };
            });
          }
        }
      ],
      build: function (body) { body.appendChild(stage); }
    });

    if (current) show(current);
    else win.setStatus('no picture open');
    return win;
  }

  M7.registerApp({ id: 'viewer', name: 'Picture Viewer', icon: 'viewer', launch: launch });
})(window.M7);
