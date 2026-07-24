/* MERIDIAN 7 — Paint */
(function (M7) {
  'use strict';

  var el = M7.el;

  var W = 288, H = 184, SCALE = 2;

  var PALETTE = [
    '#000000', '#3b3b3b', '#6e6e6e', '#a5a5a5', '#d8d8d8', '#ffffff',
    '#7b2d26', '#b4532a', '#e0a33c', '#f2e2a8', '#2f6b3a', '#68b46a',
    '#1f3d5c', '#3d7fbf', '#6b3b7a', '#c06fa8'
  ];

  var TOOLS = [
    { id: 'pencil', label: 'Pencil' },
    { id: 'eraser', label: 'Eraser' },
    { id: 'line', label: 'Line' },
    { id: 'rect', label: 'Frame' },
    { id: 'rectf', label: 'Block' },
    { id: 'oval', label: 'Oval' },
    { id: 'fill', label: 'Fill' },
    { id: 'spray', label: 'Spray' }
  ];

  function launch(path) {
    var state = { tool: 'pencil', color: PALETTE[0], size: 1, path: null, dirty: false };

    var canvas = el('canvas', { class: 'pt-canvas', width: W, height: H });
    var overlay = el('canvas', { class: 'pt-overlay', width: W, height: H });
    var ctx = canvas.getContext('2d');
    var octx = overlay.getContext('2d');
    canvas.style.width = overlay.style.width = (W * SCALE) + 'px';
    canvas.style.height = overlay.style.height = (H * SCALE) + 'px';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    var undoStack = [];
    function pushUndo() {
      undoStack.push(ctx.getImageData(0, 0, W, H));
      if (undoStack.length > 12) undoStack.shift();
    }
    function undo() {
      var img = undoStack.pop();
      if (!img) { M7.audio.play('error'); return; }
      ctx.putImageData(img, 0, 0);
      state.dirty = true;
      M7.audio.play('click');
    }

    var win;

    /* ---- tool palette ---- */
    var toolBox = el('div', { class: 'pt-tools' });
    TOOLS.forEach(function (t) {
      var b = el('button', { class: 'btn pt-tool' + (t.id === state.tool ? ' pressed' : ''), text: t.label, 'data-tool': t.id });
      b.addEventListener('click', function () {
        state.tool = t.id;
        M7.$$('.pt-tool', toolBox).forEach(function (n) { n.classList.toggle('pressed', n.dataset.tool === t.id); });
        M7.audio.play('click');
        status();
      });
      toolBox.appendChild(b);
    });

    var sizeBox = el('div', { class: 'pt-sizes' });
    [1, 2, 3, 5].forEach(function (s) {
      var b = el('button', { class: 'btn pt-size' + (s === state.size ? ' pressed' : ''), 'data-size': s },
        el('i', { style: { width: (s + 1) + 'px', height: (s + 1) + 'px' } }));
      b.addEventListener('click', function () {
        state.size = s;
        M7.$$('.pt-size', sizeBox).forEach(function (n) { n.classList.toggle('pressed', Number(n.dataset.size) === s); });
        M7.audio.play('click');
        status();
      });
      sizeBox.appendChild(b);
    });

    var swatchBox = el('div', { class: 'pt-palette' });
    PALETTE.forEach(function (c) {
      var b = el('button', { class: 'pt-swatch' + (c === state.color ? ' selected' : ''), 'data-color': c,
        style: { background: c } });
      b.addEventListener('click', function () {
        state.color = c;
        M7.$$('.pt-swatch', swatchBox).forEach(function (n) { n.classList.toggle('selected', n.dataset.color === c); });
        M7.audio.play('select');
        status();
      });
      swatchBox.appendChild(b);
    });

    /* ---- drawing ---- */
    function pos(ev) {
      var r = canvas.getBoundingClientRect();
      return {
        x: Math.floor((ev.clientX - r.left) / SCALE),
        y: Math.floor((ev.clientY - r.top) / SCALE)
      };
    }

    function dot(c, x, y, size, color) {
      c.fillStyle = color;
      var half = Math.floor(size / 2);
      c.fillRect(x - half, y - half, size, size);
    }

    function stroke(c, x0, y0, x1, y1, size, color) {
      var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
      var sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      var err = dx - dy;
      for (;;) {
        dot(c, x0, y0, size, color);
        if (x0 === x1 && y0 === y1) break;
        var e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
      }
    }

    function ellipse(c, x0, y0, x1, y1, size, color, filled) {
      var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      var rx = Math.abs(x1 - x0) / 2, ry = Math.abs(y1 - y0) / 2;
      if (filled) {
        for (var y = -ry; y <= ry; y += 1) {
          var w = rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry || 1)));
          c.fillStyle = color;
          c.fillRect(Math.round(cx - w), Math.round(cy + y), Math.round(w * 2), 1);
        }
        return;
      }
      var steps = Math.max(24, Math.round((rx + ry) * 2));
      var px = null, py = null;
      for (var i = 0; i <= steps; i += 1) {
        var a = (i / steps) * Math.PI * 2;
        var x = Math.round(cx + Math.cos(a) * rx);
        var y = Math.round(cy + Math.sin(a) * ry);
        if (px !== null) stroke(c, px, py, x, y, size, color);
        px = x; py = y;
      }
    }

    function hexToRGBA(hex) {
      return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255];
    }

    function floodFill(sx, sy, hex) {
      var img = ctx.getImageData(0, 0, W, H);
      var d = img.data;
      var idx = (sy * W + sx) * 4;
      var target = [d[idx], d[idx + 1], d[idx + 2], d[idx + 3]];
      var fillC = hexToRGBA(hex);
      if (target[0] === fillC[0] && target[1] === fillC[1] && target[2] === fillC[2]) return;
      var stack = [[sx, sy]];
      while (stack.length) {
        var p = stack.pop();
        var x = p[0], y = p[1];
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        var i = (y * W + x) * 4;
        if (d[i] !== target[0] || d[i + 1] !== target[1] || d[i + 2] !== target[2] || d[i + 3] !== target[3]) continue;
        d[i] = fillC[0]; d[i + 1] = fillC[1]; d[i + 2] = fillC[2]; d[i + 3] = 255;
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
      ctx.putImageData(img, 0, 0);
    }

    function spray(x, y) {
      var r = state.size * 4;
      ctx.fillStyle = state.color;
      for (var i = 0; i < 14; i += 1) {
        var a = Math.random() * Math.PI * 2, d = Math.random() * r;
        ctx.fillRect(Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d), 1, 1);
      }
    }

    var drawing = false, start = null, last = null, sprayTimer = null;

    overlay.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      overlay.setPointerCapture(ev.pointerId);
      var p = pos(ev);
      pushUndo();
      drawing = true;
      start = p; last = p;
      state.dirty = true;
      var color = state.tool === 'eraser' ? '#ffffff' : state.color;

      if (state.tool === 'fill') { floodFill(p.x, p.y, state.color); M7.audio.play('drop'); drawing = false; return; }
      if (state.tool === 'pencil' || state.tool === 'eraser') dot(ctx, p.x, p.y, state.size, color);
      if (state.tool === 'spray') {
        spray(p.x, p.y);
        sprayTimer = setInterval(function () { if (last) spray(last.x, last.y); }, 40);
      }
      M7.audio.play('tick');
    });

    overlay.addEventListener('pointermove', function (ev) {
      var p = pos(ev);
      win.setStatus('x ' + p.x + '  y ' + p.y, state.tool, state.size + 'px', state.path || 'not saved');
      if (!drawing) return;
      var color = state.tool === 'eraser' ? '#ffffff' : state.color;
      if (state.tool === 'pencil' || state.tool === 'eraser') {
        stroke(ctx, last.x, last.y, p.x, p.y, state.size, color);
      } else if (state.tool !== 'spray' && state.tool !== 'fill') {
        octx.clearRect(0, 0, W, H);
        if (state.tool === 'line') stroke(octx, start.x, start.y, p.x, p.y, state.size, color);
        else if (state.tool === 'rect') {
          stroke(octx, start.x, start.y, p.x, start.y, state.size, color);
          stroke(octx, p.x, start.y, p.x, p.y, state.size, color);
          stroke(octx, p.x, p.y, start.x, p.y, state.size, color);
          stroke(octx, start.x, p.y, start.x, start.y, state.size, color);
        } else if (state.tool === 'rectf') {
          octx.fillStyle = color;
          octx.fillRect(Math.min(start.x, p.x), Math.min(start.y, p.y), Math.abs(p.x - start.x), Math.abs(p.y - start.y));
        } else if (state.tool === 'oval') {
          ellipse(octx, start.x, start.y, p.x, p.y, state.size, color, false);
        }
      }
      last = p;
    });

    function endStroke(ev) {
      if (!drawing) return;
      drawing = false;
      clearInterval(sprayTimer); sprayTimer = null;
      var p = last;
      var color = state.tool === 'eraser' ? '#ffffff' : state.color;
      octx.clearRect(0, 0, W, H);
      if (state.tool === 'line') stroke(ctx, start.x, start.y, p.x, p.y, state.size, color);
      else if (state.tool === 'rect') {
        stroke(ctx, start.x, start.y, p.x, start.y, state.size, color);
        stroke(ctx, p.x, start.y, p.x, p.y, state.size, color);
        stroke(ctx, p.x, p.y, start.x, p.y, state.size, color);
        stroke(ctx, start.x, p.y, start.x, start.y, state.size, color);
      } else if (state.tool === 'rectf') {
        ctx.fillStyle = color;
        ctx.fillRect(Math.min(start.x, p.x), Math.min(start.y, p.y), Math.abs(p.x - start.x), Math.abs(p.y - start.y));
      } else if (state.tool === 'oval') {
        ellipse(ctx, start.x, start.y, p.x, p.y, state.size, color, false);
      }
      M7.audio.play('drop');
      status();
    }
    overlay.addEventListener('pointerup', endStroke);
    overlay.addEventListener('pointerleave', function () { if (drawing) endStroke(); });

    function status() {
      win.setStatus(W + ' × ' + H, state.tool, state.size + 'px',
        (state.path || 'not saved') + (state.dirty ? ' •' : ''));
      win.setTitle((state.path ? M7.vfs.baseName(state.path) : 'Untitled') + (state.dirty ? ' •' : ''));
    }

    function clearCanvas() {
      pushUndo();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      state.dirty = true;
      M7.audio.play('trash');
      status();
    }

    function save(as) {
      var write = function (p) {
        if (!/\.pic$/i.test(p)) p += '.pic';
        var res = M7.vfs.write(p, canvas.toDataURL('image/png'), 'image');
        if (res.error) { M7.dialog.error(res.error, 'Could not save.'); return; }
        state.path = p; state.dirty = false;
        M7.audio.play('disk');
        status();
      };
      if (state.path && !as) { write(state.path); return; }
      M7.dialog.saveFile({
        title: 'Save Picture',
        name: state.path ? M7.vfs.baseName(state.path) : 'Untitled.pic',
        dir: state.path ? M7.vfs.dirName(state.path) : '/Pictures'
      }).then(function (p) { if (p) write(p); });
    }

    function loadPath(p) {
      var data = M7.vfs.read(p);
      if (!data) { M7.dialog.error('That picture could not be read.', 'Open failed'); return; }
      var img = new Image();
      img.onload = function () {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
        ctx.drawImage(img, 0, 0);
        state.path = p; state.dirty = false;
        M7.audio.play('disk');
        status();
      };
      img.src = data;
    }

    win = M7.wm.open({
      app: 'paint', title: 'Untitled', icon: 'paint',
      w: W * SCALE + 122, h: H * SCALE + 130, resizable: false, status: true,
      menus: [
        {
          label: 'File',
          items: function () {
            return [
              { label: 'New', icon: 'file', action: clearCanvas },
              { label: 'Open…', icon: 'folder', action: function () {
                M7.dialog.chooseFile({ title: 'Open Picture', start: '/Pictures',
                  filter: function (i) { return i.kind === 'image'; } })
                  .then(function (p) { if (p) loadPath(p); });
              } },
              { sep: true },
              { label: 'Save', action: function () { save(false); } },
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
              { label: 'Undo', key: 'Ctrl Z', disabled: !undoStack.length, action: undo },
              { sep: true },
              { label: 'Clear Canvas', action: clearCanvas },
              { label: 'Invert', action: function () {
                pushUndo();
                var img = ctx.getImageData(0, 0, W, H);
                for (var i = 0; i < img.data.length; i += 4) {
                  img.data[i] = 255 - img.data[i];
                  img.data[i + 1] = 255 - img.data[i + 1];
                  img.data[i + 2] = 255 - img.data[i + 2];
                }
                ctx.putImageData(img, 0, 0);
                state.dirty = true; status();
              } },
              { label: 'Dither Wash', action: function () {
                pushUndo();
                var img = ctx.getImageData(0, 0, W, H);
                for (var y = 0; y < H; y += 1) {
                  for (var x = 0; x < W; x += 1) {
                    if ((x + y) % 2) continue;
                    var i = (y * W + x) * 4;
                    img.data[i] = (img.data[i] * 0.7) | 0;
                    img.data[i + 1] = (img.data[i + 1] * 0.7) | 0;
                    img.data[i + 2] = (img.data[i + 2] * 0.7) | 0;
                  }
                }
                ctx.putImageData(img, 0, 0);
                state.dirty = true; status();
              } }
            ];
          }
        }
      ],
      onClose: function () {
        if (!state.dirty) return true;
        M7.dialog.confirm('This picture has unsaved changes.', 'Close without saving?', 'Discard')
          .then(function (ok) { if (ok) { state.dirty = false; win.close(); } });
        return false;
      },
      build: function (body) {
        body.appendChild(el('div', { class: 'pt' }, [
          el('div', { class: 'pt-side' }, [toolBox, sizeBox]),
          el('div', { class: 'pt-main' }, [
            el('div', { class: 'pt-stage bevel-in' }, [canvas, overlay]),
            swatchBox
          ])
        ]));
      }
    });

    win.el.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
    });

    if (typeof path === 'string' && M7.vfs.exists(path)) loadPath(path);
    else status();
    return win;
  }

  M7.registerApp({ id: 'paint', name: 'Paint', icon: 'paint', launch: launch });
})(window.M7);
