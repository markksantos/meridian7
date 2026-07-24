/* MERIDIAN 7 — Tape Deck: a small chiptune sequencer */
(function (M7) {
  'use strict';

  var el = M7.el;

  function seq(str) { return str.split(' ').filter(function (s) { return s.length; }); }

  var TRACKS = [
    {
      name: 'Boot Sector', bpm: 132, length: 32,
      channels: [
        { type: 'square', gain: 0.05, dur: 0.13, filter: 2400,
          pattern: seq('A4 - E5 - C5 - E5 - A4 - E5 - C5 - E5 - G4 - D5 - B4 - D5 - G4 - D5 - B4 - D5') },
        { type: 'triangle', gain: 0.08, dur: 0.24,
          pattern: seq('A2 - - - A2 - - - G2 - - - G2 - - - F2 - - - F2 - - - E2 - - - E2 - - -') },
        { type: 'noise', gain: 0.035, dur: 0.05,
          pattern: seq('- - x - - - x - - - x - - - x - - - x - - - x - - - x - - - x -') }
      ]
    },
    {
      name: 'Slate Blue', bpm: 96, length: 32,
      channels: [
        { type: 'triangle', gain: 0.09, dur: 0.42,
          pattern: seq('D4 - - - F4 - - - A4 - - - G4 - - - C4 - - - E4 - - - G4 - - - F4 - - -') },
        { type: 'square', gain: 0.035, dur: 0.2, filter: 1600,
          pattern: seq('D3 - A3 - D3 - A3 - D3 - A3 - D3 - A3 - C3 - G3 - C3 - G3 - C3 - G3 - C3 - G3 -') }
      ]
    },
    {
      name: 'Bus Timing', bpm: 150, length: 16,
      channels: [
        { type: 'square', gain: 0.055, dur: 0.1, filter: 3000,
          pattern: seq('E5 E5 - B4 - E5 - G5 - F#5 - E5 - B4 - -') },
        { type: 'sawtooth', gain: 0.05, dur: 0.14, filter: 900,
          pattern: seq('E2 - E2 - E2 - E2 - D2 - D2 - D2 - D2 -') },
        { type: 'noise', gain: 0.045, dur: 0.04,
          pattern: seq('x - x x - x x - x - x x - x x -') }
      ]
    },
    {
      name: 'Phosphor Dream', bpm: 78, length: 32,
      channels: [
        { type: 'sine', gain: 0.1, dur: 0.6,
          pattern: seq('C4 - - - - - - - G4 - - - - - - - A4 - - - - - - - E4 - - - - - - -') },
        { type: 'triangle', gain: 0.05, dur: 0.32,
          pattern: seq('- - E5 - - - G5 - - - D5 - - - B4 - - - C5 - - - E5 - - - A4 - - - G4 -') }
      ]
    }
  ];

  function launch() {
    var player = new M7.audio.Player();
    var index = 0, playing = false, stepNow = 0;
    var raf = null;

    var vis = el('canvas', { class: 'td-vis', width: 300, height: 60 });
    var vctx = vis.getContext('2d');
    var reelA = el('div', { class: 'td-reel' }, el('i'));
    var reelB = el('div', { class: 'td-reel' }, el('i'));
    var listEl = el('div', { class: 'td-list scroll' });
    var nowEl = el('div', { class: 'td-now mono' });
    var stepEl = el('div', { class: 'td-step mono' });
    var win;

    function paintList() {
      listEl.innerHTML = '';
      TRACKS.forEach(function (t, i) {
        var row = el('button', {
          class: 'td-track' + (i === index ? ' selected' : ''),
          onclick: function () { index = i; paintList(); if (playing) play(); else showNow(); M7.audio.play('select'); }
        }, [
          el('span', { class: 'td-num mono', text: ('0' + (i + 1)).slice(-2) }),
          el('span', { class: 'td-name', text: t.name }),
          el('span', { class: 'td-bpm mono', text: t.bpm + ' BPM' })
        ]);
        listEl.appendChild(row);
      });
    }

    function showNow() {
      var t = TRACKS[index];
      nowEl.textContent = (playing ? '▶ ' : '■ ') + t.name;
      win.setStatus(playing ? 'PLAYING' : 'STOPPED', t.name, t.bpm + ' BPM', t.channels.length + ' voices');
    }

    function draw() {
      var bins = M7.audio.analyserSize();
      vctx.fillStyle = M7.theme.cssVar('--term-bg') || '#111';
      vctx.fillRect(0, 0, vis.width, vis.height);
      if (bins) {
        var data = new Uint8Array(bins);
        M7.audio.levels(data);
        var bars = 32, step = Math.floor(bins / bars);
        vctx.fillStyle = M7.theme.cssVar('--term-ink') || '#6f6';
        for (var i = 0; i < bars; i += 1) {
          var v = data[i * step] / 255;
          var hgt = Math.max(1, Math.round(v * (vis.height - 6)));
          vctx.fillRect(4 + i * 9, vis.height - 3 - hgt, 7, hgt);
        }
      }
      vctx.fillStyle = M7.theme.cssVar('--accent') || '#f60';
      vctx.fillRect(0, vis.height - 2, Math.round((stepNow % TRACKS[index].length) / TRACKS[index].length * vis.width), 2);
      raf = requestAnimationFrame(draw);
    }

    function play() {
      player.start(TRACKS[index], function (s) {
        stepNow = s;
        stepEl.textContent = 'STEP ' + ('0' + (s + 1)).slice(-2) + ' / ' + TRACKS[index].length;
      });
      playing = true;
      reelA.classList.add('spin'); reelB.classList.add('spin');
      if (!raf) draw();
      showNow();
      paintList();
    }

    function stop() {
      player.stop();
      playing = false;
      reelA.classList.remove('spin'); reelB.classList.remove('spin');
      showNow();
    }

    function skip(delta) {
      index = (index + delta + TRACKS.length) % TRACKS.length;
      paintList();
      if (playing) play(); else showNow();
      M7.audio.play('click');
    }

    var transport = el('div', { class: 'td-transport' }, [
      el('button', { class: 'btn td-btn', text: '|◀', title: 'Previous', onclick: function () { skip(-1); } }),
      el('button', { class: 'btn td-btn', text: '▶', title: 'Play', onclick: function () { M7.audio.play('click'); play(); } }),
      el('button', { class: 'btn td-btn', text: '■', title: 'Stop', onclick: function () { M7.audio.play('click'); stop(); } }),
      el('button', { class: 'btn td-btn', text: '▶|', title: 'Next', onclick: function () { skip(1); } })
    ]);

    win = M7.wm.open({
      app: 'tapedeck', title: 'Tape Deck', icon: 'tapedeck',
      w: 340, h: 400, resizable: false, singleton: true, status: true,
      onClose: function () { stop(); if (raf) cancelAnimationFrame(raf); raf = null; return true; },
      build: function (body) {
        body.appendChild(el('div', { class: 'td' }, [
          el('div', { class: 'td-deck bevel-in' }, [reelA, el('div', { class: 'td-window' }, [nowEl, stepEl]), reelB]),
          el('div', { class: 'td-vis-wrap bevel-in' }, vis),
          transport,
          listEl
        ]));
      }
    });

    paintList();
    showNow();
    stepEl.textContent = 'STEP 00 / ' + TRACKS[index].length;
    draw();
    return win;
  }

  M7.registerApp({ id: 'tapedeck', name: 'Tape Deck', icon: 'tapedeck', launch: launch });
})(window.M7);
