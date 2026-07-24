/* MERIDIAN 7 — idle screen saver */
(function (M7) {
  'use strict';

  var canvas = null, ctx = null, raf = null, idleTimer = null;
  var running = false;
  var stars = [], box = null, t = 0;

  function size() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function initStars() {
    stars = [];
    for (var i = 0; i < 240; i += 1) {
      stars.push({
        x: (Math.random() - 0.5) * canvas.width,
        y: (Math.random() - 0.5) * canvas.height,
        z: Math.random() * canvas.width
      });
    }
  }

  function drawStars() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    var cx = canvas.width / 2, cy = canvas.height / 2;
    var ink = M7.theme.cssVar('--accent') || '#fff';
    stars.forEach(function (s) {
      s.z -= 4.2;
      if (s.z <= 1) { s.z = canvas.width; s.x = (Math.random() - 0.5) * canvas.width; s.y = (Math.random() - 0.5) * canvas.height; }
      var k = 128 / s.z;
      var px = cx + s.x * k, py = cy + s.y * k;
      if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) return;
      var sz = Math.max(1, (1 - s.z / canvas.width) * 3) | 0;
      ctx.fillStyle = s.z < canvas.width * 0.28 ? ink : '#c8d2dc';
      ctx.fillRect(px | 0, py | 0, sz, sz);
    });
  }

  function initBox() {
    box = { x: 60, y: 60, dx: 2.2, dy: 1.6, w: 260, h: 92 };
  }

  function drawBouncer() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    box.x += box.dx; box.y += box.dy;
    if (box.x <= 0 || box.x + box.w >= canvas.width) { box.dx *= -1; box.x = Math.max(0, Math.min(box.x, canvas.width - box.w)); }
    if (box.y <= 0 || box.y + box.h >= canvas.height) { box.dy *= -1; box.y = Math.max(0, Math.min(box.y, canvas.height - box.h)); }

    var hue = (t * 0.4) % 360;
    ctx.strokeStyle = 'hsl(' + hue + ',60%,62%)';
    ctx.fillStyle = 'hsl(' + hue + ',55%,58%)';
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w, box.h);
    ctx.font = '30px Geneva, Verdana, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('MERIDIAN 7', box.x + 20, box.y + box.h / 2 - 8);
    ctx.font = '11px Monaco, Menlo, monospace';
    ctx.fillStyle = 'hsl(' + hue + ',35%,45%)';
    ctx.fillText('MERIDIAN SYSTEMS INC.', box.x + 22, box.y + box.h / 2 + 22);
  }

  function drawStatic() {
    var img = ctx.createImageData(canvas.width, canvas.height);
    var d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var v = Math.random() < 0.5 ? 0 : (Math.random() * 210) | 0;
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(0, canvas.height / 2 - 26, canvas.width, 52);
    ctx.fillStyle = '#d8d8d8';
    ctx.font = '13px Monaco, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NO SIGNAL — MERIDIAN 7', canvas.width / 2, canvas.height / 2 + 5);
    ctx.textAlign = 'left';
  }

  function frame() {
    t += 1;
    var mode = M7.store.get('saver');
    if (mode === 'bouncer') drawBouncer();
    else if (mode === 'static') { if (t % 3 === 0) drawStatic(); }
    else drawStars();
    raf = requestAnimationFrame(frame);
  }

  function start(force) {
    if (running) return;
    if (!force && M7.store.get('saver') === 'off') return;
    if (document.getElementById('system').hidden) return;
    M7.menu.close();
    canvas.hidden = false;
    size();
    initStars(); initBox();
    t = 0;
    running = true;
    frame();
    M7.audio.play('minimize');
  }

  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    canvas.hidden = true;
    M7.audio.play('tick');
    schedule();
  }

  function schedule() {
    clearTimeout(idleTimer);
    var delay = M7.store.get('saverDelay');
    if (!delay || M7.store.get('saver') === 'off') return;
    idleTimer = setTimeout(function () { start(false); }, delay * 1000);
  }

  function bump() {
    if (running) { stop(); return; }
    schedule();
  }

  function init() {
    canvas = document.getElementById('screensaver');
    ctx = canvas.getContext('2d');
    window.addEventListener('resize', function () { if (running) size(); });
    ['pointerdown', 'keydown', 'wheel'].forEach(function (evt) {
      window.addEventListener(evt, bump, true);
    });
    schedule();
    M7.store.onChange(function (keys) {
      if (keys.indexOf('saverDelay') >= 0 || keys.indexOf('saver') >= 0) schedule();
    });
  }

  M7.saver = { init: init, start: start, stop: stop, schedule: schedule, get running() { return running; } };
})(window.M7);
