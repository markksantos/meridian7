/* MERIDIAN 7 — synthesized sound. No audio files anywhere in this system. */
(function (M7) {
  'use strict';

  var ctx = null, master = null, noiseBuf = null;
  var analyser = null;

  function init() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = M7.store.get('volume');
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    master.connect(analyser);
    analyser.connect(ctx.destination);

    var len = Math.floor(ctx.sampleRate * 0.6);
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var ch = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i += 1) ch[i] = Math.random() * 2 - 1;
    return ctx;
  }

  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }
  function now() { return ctx ? ctx.currentTime : 0; }
  function setVolume(v) { if (master) master.gain.value = v; }

  /* ---- primitives ---- */

  function tone(o) {
    if (!init()) return;
    var t = now() + (o.delay || 0);
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + o.dur);
    var peak = (o.gain === undefined ? 0.16 : o.gain);
    var atk = o.attack === undefined ? 0.004 : o.attack;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    var node = osc;
    if (o.filter) {
      var f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = o.filter;
      osc.connect(f); node = f;
    }
    node.connect(g); g.connect(o.dest || master);
    osc.start(t); osc.stop(t + o.dur + 0.02);
  }

  function noise(o) {
    if (!init()) return;
    var t = now() + (o.delay || 0);
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    var f = ctx.createBiquadFilter();
    f.type = o.type || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 1800, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(Math.max(60, o.to), t + o.dur);
    f.Q.value = o.q === undefined ? 1.2 : o.q;
    var g = ctx.createGain();
    var peak = o.gain === undefined ? 0.1 : o.gain;
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t); src.stop(t + o.dur + 0.02);
  }

  /* ---- voices ---- */

  var VOICES = {
    click: function () {
      noise({ freq: 2600, q: 0.9, dur: 0.028, gain: 0.075 });
      tone({ freq: 1500, type: 'square', dur: 0.022, gain: 0.045 });
    },
    select: function () {
      tone({ freq: 880, to: 1320, type: 'square', dur: 0.05, gain: 0.07 });
    },
    open: function () {
      tone({ freq: 300, to: 760, type: 'triangle', dur: 0.09, gain: 0.11 });
      noise({ freq: 900, to: 3000, dur: 0.09, gain: 0.045 });
    },
    close: function () {
      tone({ freq: 760, to: 260, type: 'triangle', dur: 0.09, gain: 0.11 });
      noise({ freq: 2800, to: 700, dur: 0.08, gain: 0.04 });
    },
    minimize: function () {
      tone({ freq: 900, to: 300, type: 'square', dur: 0.11, gain: 0.06 });
    },
    restore: function () {
      tone({ freq: 300, to: 900, type: 'square', dur: 0.11, gain: 0.06 });
    },
    error: function () {
      tone({ freq: 233, type: 'square', dur: 0.16, gain: 0.13 });
      tone({ freq: 175, type: 'square', dur: 0.24, gain: 0.13, delay: 0.17 });
    },
    alert: function () {
      tone({ freq: 660, type: 'triangle', dur: 0.12, gain: 0.12 });
      tone({ freq: 990, type: 'triangle', dur: 0.16, gain: 0.1, delay: 0.13 });
    },
    key: function () {
      noise({ freq: 3400, q: 0.7, dur: 0.014, gain: 0.035 });
    },
    drop: function () {
      noise({ freq: 400, to: 140, dur: 0.1, gain: 0.09, type: 'lowpass' });
    },
    trash: function () {
      noise({ freq: 1600, to: 220, dur: 0.28, gain: 0.11, q: 0.6 });
      tone({ freq: 160, to: 70, type: 'sawtooth', dur: 0.22, gain: 0.05 });
    },
    toggle: function () {
      tone({ freq: 620, type: 'square', dur: 0.03, gain: 0.06 });
      tone({ freq: 940, type: 'square', dur: 0.04, gain: 0.06, delay: 0.035 });
    },
    tick: function () {
      noise({ freq: 5200, q: 1.6, dur: 0.01, gain: 0.03 });
    },
    beep: function () {
      tone({ freq: 1046, type: 'square', dur: 0.09, gain: 0.1 });
    },
    disk: function () {
      noise({ freq: 700, q: 2.4, dur: 0.06, gain: 0.05 });
      noise({ freq: 520, q: 2.4, dur: 0.05, gain: 0.045, delay: 0.08 });
    },
    chime: function () {
      var notes = [261.63, 329.63, 392.0, 523.25];
      notes.forEach(function (f, i) {
        tone({ freq: f, type: 'triangle', dur: 1.5 - i * 0.12, gain: 0.1, attack: 0.06, delay: i * 0.085 });
        tone({ freq: f * 2, type: 'sine', dur: 1.1, gain: 0.035, attack: 0.1, delay: i * 0.085 });
      });
      noise({ freq: 5200, to: 900, dur: 1.2, gain: 0.02, q: 0.4, delay: 0.05 });
    },
    shutdown: function () {
      var notes = [523.25, 392.0, 329.63, 261.63];
      notes.forEach(function (f, i) {
        tone({ freq: f, type: 'triangle', dur: 0.7, gain: 0.09, attack: 0.03, delay: i * 0.11 });
      });
      noise({ freq: 1800, to: 90, dur: 1.1, gain: 0.05, q: 0.5, delay: 0.4 });
    },
    win: function () {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
        tone({ freq: f, type: 'square', dur: 0.16, gain: 0.09, delay: i * 0.09 });
      });
    },
    lose: function () {
      [392, 330, 262, 196].forEach(function (f, i) {
        tone({ freq: f, type: 'sawtooth', dur: 0.2, gain: 0.08, delay: i * 0.11, filter: 1400 });
      });
    }
  };

  function play(name) {
    if (!M7.store.get('sfx')) return;
    if (name === 'key' && !M7.store.get('keyClicks')) return;
    var v = VOICES[name];
    if (!v) return;
    init(); resume();
    v();
  }

  /* ---- music: tiny note sequencer used by the Tape Deck ---- */

  var NOTE_RE = /^([A-G])(#|b)?(-?\d)$/;
  var SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  function freqOf(note) {
    if (!note || note === '-') return 0;
    var m = NOTE_RE.exec(note);
    if (!m) return 0;
    var s = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    var oct = parseInt(m[3], 10);
    return 440 * Math.pow(2, (s - 9) / 12 + (oct - 4));
  }

  function Player() {
    this.timer = null;
    this.step = 0;
    this.track = null;
    this.onStep = null;
    this.playing = false;
  }

  Player.prototype.start = function (track, onStep) {
    var self = this;
    if (!init()) return;
    resume();
    this.stop();
    this.track = track;
    this.onStep = onStep || null;
    this.step = 0;
    this.playing = true;
    var interval = 60000 / track.bpm / 4; /* 16ths */
    var tick = function () {
      if (!self.playing) return;
      var s = self.step % track.length;
      track.channels.forEach(function (ch) {
        var n = ch.pattern[s % ch.pattern.length];
        if (!n || n === '-') return;
        if (ch.type === 'noise') {
          noise({ freq: 2400, to: 400, dur: ch.dur || 0.07, gain: (ch.gain || 0.09) });
          return;
        }
        var f = freqOf(n);
        if (!f) return;
        tone({ freq: f, type: ch.type || 'square', dur: ch.dur || 0.16,
               gain: ch.gain || 0.07, filter: ch.filter });
      });
      if (self.onStep) self.onStep(s);
      self.step += 1;
      self.timer = setTimeout(tick, interval);
    };
    tick();
  };

  Player.prototype.stop = function () {
    this.playing = false;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
  };

  function levels(arr) {
    if (!analyser) return 0;
    analyser.getByteFrequencyData(arr);
    return arr;
  }

  M7.audio = {
    init: init, resume: resume, play: play, setVolume: setVolume,
    tone: tone, noise: noise, Player: Player, freqOf: freqOf,
    analyserSize: function () { return analyser ? analyser.frequencyBinCount : 0; },
    levels: levels,
    get ctx() { return ctx; }
  };
})(window.M7);
