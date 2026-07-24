/* MERIDIAN 7 — power on, POST, splash, shutdown */
(function (M7) {
  'use strict';

  var el = M7.el;
  var skipped = false;
  var onReady = null;

  function wait(ms) {
    return new Promise(function (res) {
      if (skipped || ms <= 0) { res(); return; }
      setTimeout(res, ms);
    });
  }

  function speed() {
    var mode = M7.store.get('bootMode');
    return mode === 'instant' ? 0 : mode === 'fast' ? 0.35 : 1;
  }

  var POST = [
    { t: 'MERIDIAN SYSTEMS ROM BIOS   v2.14', c: 'hi' },
    { t: '(C) 1989-1993 Meridian Systems Inc.  All rights reserved.', c: 'dim' },
    { t: '' },
    { t: 'PROCESSOR ....... MS-68030 @ 33.0 MHz', ok: 'OK' },
    { t: 'COPROCESSOR ..... MS-68882 FPU', ok: 'OK' },
    { t: 'MEMORY TEST ..... ', mem: true },
    { t: 'SYSTEM BUS ...... 32-BIT MERIDIAN LOCAL', ok: 'OK' },
    { t: 'FLOPPY DRIVE A .. 1.44M 3.5"', ok: 'OK' },
    { t: 'FIXED DISK 0 .... 80M CARTOGRAPHER', ok: 'OK' },
    { t: 'KEYBOARD ........ 105-KEY EXTENDED', ok: 'OK' },
    { t: 'POINTING DEVICE . 2-BUTTON BUS MOUSE', ok: 'OK' },
    { t: 'AUDIO SUBSYSTEM . 8-BIT STEREO DAC', ok: 'OK' },
    { t: 'DISPLAY ......... 1024x768 @ 256 COLORS', ok: 'OK' },
    { t: '' },
    { t: 'Reading boot sector from FIXED DISK 0 ...', c: 'dim' },
    { t: 'Loading MERIDIAN 7 System Software ...', c: 'hi' }
  ];

  var EXTENSIONS = ['disk', 'control', 'speakerOn', 'clock', 'files', 'terminal', 'paint', 'notes'];

  function line(html, cls) {
    var post = document.getElementById('post');
    var span = el('div', { class: cls || '', html: html });
    post.appendChild(span);
    return span;
  }

  async function typeLine(text, cls) {
    var node = line('', cls);
    var s = speed();
    if (!s) { node.innerHTML = text; return node; }
    for (var i = 0; i < text.length; i += 1) {
      node.textContent += text.charAt(i);
      if (i % 3 === 0) M7.audio.play('key');
      await wait(6 * s);
    }
    return node;
  }

  async function memoryTest(node) {
    var total = 16384, step = 1024;
    var s = speed();
    for (var k = step; k <= total; k += step) {
      node.innerHTML = 'MEMORY TEST ..... ' + k + 'K';
      if (s) { M7.audio.play('tick'); await wait(38 * s); }
    }
    node.innerHTML = 'MEMORY TEST ..... ' + total + 'K  <span class="ok">OK</span>';
  }

  async function runPost() {
    document.getElementById('post').innerHTML = '';
    for (var i = 0; i < POST.length; i += 1) {
      var item = POST[i];
      if (item.mem) {
        var n = line('MEMORY TEST ..... 0K');
        await memoryTest(n);
        continue;
      }
      var node = await typeLine(item.t, item.c);
      if (item.ok) {
        node.innerHTML = M7.util.esc(item.t) + '  <span class="ok">' + item.ok + '</span>';
        M7.audio.play('tick');
      }
      await wait(40 * speed());
    }
    M7.audio.play('beep');
    await wait(320 * speed());
  }

  async function runSplash() {
    var splash = document.getElementById('splash');
    var fill = document.getElementById('splash-fill');
    var status = document.getElementById('splash-status');
    var exts = document.getElementById('splash-exts');
    document.getElementById('post').style.display = 'none';
    document.getElementById('splash-logo').innerHTML = M7.icons.get('logo');
    exts.innerHTML = '';
    splash.hidden = false;

    var steps = [
      'Checking disk directory…',
      'Loading Sound Manager…',
      'Loading Display Enabler…',
      'Mounting Cartographer…',
      'Reading preferences…',
      'Starting Finder…'
    ];

    for (var i = 0; i < steps.length; i += 1) {
      status.textContent = steps[i];
      fill.style.width = Math.round(((i + 1) / steps.length) * 100) + '%';
      var ico = el('span', { html: M7.icons.get(EXTENSIONS[i % EXTENSIONS.length]) });
      ico.style.animationDelay = '0s';
      exts.appendChild(ico);
      if (i === 1) M7.audio.play('disk');
      M7.audio.play('tick');
      await wait(340 * speed());
    }
    status.textContent = 'Welcome to Meridian 7.';
    await wait(420 * speed());
  }

  function enterSystem() {
    document.getElementById('boot').hidden = true;
    var sys = document.getElementById('system');
    sys.hidden = false;
    document.body.classList.remove('powered-off');
    if (M7.store.get('startupChime')) M7.audio.play('chime');
    M7.wm.mount();
    M7.saver.schedule();
    if (onReady) onReady();
  }

  async function sequence() {
    document.getElementById('power-screen').hidden = true;
    document.getElementById('boot').hidden = false;
    document.getElementById('post').style.display = '';
    document.getElementById('splash').hidden = true;

    if (M7.store.get('bootMode') !== 'instant') {
      await runPost();
      await runSplash();
    }
    enterSystem();
  }

  function onSkipKey(e) {
    if (e.key === 'Escape') skipped = true;
  }

  function begin(ready) {
    onReady = ready;
    var pw = document.getElementById('power-screen');
    var btn = document.getElementById('power-button');
    document.addEventListener('keydown', onSkipKey);

    btn.addEventListener('click', function () {
      M7.audio.init();
      M7.audio.resume();
      M7.audio.setVolume(M7.store.get('volume'));
      M7.audio.play('disk');
      pw.classList.add('spinning');
      sequence();
    });

    /* Keyboard also powers on, once the user has interacted. */
    document.addEventListener('keydown', function once(e) {
      if (pw.hidden) return;
      if (e.key === 'Enter' || e.key === ' ') {
        document.removeEventListener('keydown', once);
        btn.click();
      }
    });
  }

  async function shutdown() {
    var ok = await M7.dialog.confirm('Any unsaved work in open programs will be lost.',
      'Shut down the workstation?', 'Shut Down');
    if (!ok) return;
    M7.menu.close();
    M7.wm.closeAll();
    M7.audio.play('shutdown');
    var sd = document.getElementById('shutdown');
    var msg = document.getElementById('sd-msg');
    document.getElementById('system').hidden = true;
    sd.hidden = false;
    msg.textContent = 'Shutting down…';
    await wait(700);
    msg.textContent = 'Closing open programs…';
    await wait(600);
    msg.textContent = 'Writing preferences to disk…';
    M7.audio.play('disk');
    await wait(700);
    msg.textContent = 'It is now safe to close this window.';
    var btn = document.getElementById('sd-restart');
    btn.hidden = false;
    btn.onclick = function () { location.reload(); };
  }

  async function restart() {
    var ok = await M7.dialog.confirm('The workstation will restart now.', 'Restart?', 'Restart');
    if (!ok) return;
    M7.audio.play('shutdown');
    await wait(500);
    location.reload();
  }

  M7.boot = { begin: begin, shutdown: shutdown, restart: restart };
})(window.M7);
