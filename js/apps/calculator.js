/* MERIDIAN 7 — Calculator */
(function (M7) {
  'use strict';

  var el = M7.el;

  var KEYS = [
    ['MC', 'MR', 'M+', 'C'],
    ['7', '8', '9', '/'],
    ['4', '5', '6', '*'],
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+']
  ];

  function launch() {
    var acc = null, pending = null, fresh = true, memory = 0;
    var display = el('div', { class: 'calc-display mono', text: '0' });
    var tape = el('div', { class: 'calc-tape mono' });
    var win;

    function show(v) {
      var s = String(v);
      if (s.length > 14) s = Number(v).toPrecision(10);
      display.textContent = s;
    }

    function current() { return parseFloat(display.textContent) || 0; }

    function note(text) {
      tape.appendChild(el('div', { text: text }));
      while (tape.children.length > 40) tape.removeChild(tape.firstChild);
      tape.scrollTop = tape.scrollHeight;
    }

    function digit(d) {
      if (fresh) { display.textContent = d === '.' ? '0.' : d; fresh = false; return; }
      if (d === '.' && display.textContent.indexOf('.') >= 0) return;
      if (display.textContent === '0' && d !== '.') display.textContent = d;
      else display.textContent += d;
    }

    function applyOp(op) {
      var v = current();
      if (pending && acc !== null) {
        var r = acc;
        if (pending === '+') r = acc + v;
        else if (pending === '-') r = acc - v;
        else if (pending === '*') r = acc * v;
        else if (pending === '/') {
          if (v === 0) {
            display.textContent = 'ERROR';
            M7.audio.play('error');
            acc = null; pending = null; fresh = true;
            note('  division by zero');
            return;
          }
          r = acc / v;
        }
        note(acc + ' ' + pending + ' ' + v + ' = ' + r);
        show(r);
        acc = r;
      } else {
        acc = v;
      }
      pending = op === '=' ? null : op;
      fresh = true;
    }

    function press(key) {
      M7.audio.play(key === '=' ? 'select' : 'click');
      if (/^[0-9.]$/.test(key)) { digit(key); return; }
      if (key === 'C') { acc = null; pending = null; fresh = true; display.textContent = '0'; note('  clear'); return; }
      if (key === 'MC') { memory = 0; note('  memory cleared'); return; }
      if (key === 'MR') { show(memory); fresh = true; note('  recall ' + memory); return; }
      if (key === 'M+') { memory += current(); note('  memory = ' + memory); return; }
      applyOp(key);
      win.setStatus(memory ? 'M ' + memory : '', pending ? 'pending ' + pending : 'ready');
    }

    var pad = el('div', { class: 'calc-pad' });
    KEYS.forEach(function (row) {
      row.forEach(function (k) {
        var cls = 'btn calc-key';
        if (/[-+*/=]/.test(k)) cls += ' op';
        if (k === 'C') cls += ' clear';
        if (/^M/.test(k)) cls += ' mem';
        pad.appendChild(el('button', { class: cls, text: k, onclick: function () { press(k); } }));
      });
    });

    win = M7.wm.open({
      app: 'calculator', title: 'Calculator', icon: 'calculator',
      w: 268, h: 330, resizable: false, singleton: true, status: true,
      build: function (body) {
        body.appendChild(el('div', { class: 'calc' }, [
          el('div', { class: 'calc-screen bevel-in' }, [display]),
          pad,
          el('div', { class: 'calc-tape-wrap bevel-in' }, tape)
        ]));
      }
    });

    win.setStatus('', 'ready');

    win.el.setAttribute('tabindex', '-1');
    win.el.addEventListener('keydown', function (e) {
      var k = e.key;
      if (/^[0-9.]$/.test(k)) { press(k); e.preventDefault(); return; }
      if (['+', '-', '*', '/'].indexOf(k) >= 0) { press(k); e.preventDefault(); return; }
      if (k === 'Enter' || k === '=') { press('='); e.preventDefault(); return; }
      if (k === 'Escape' || k.toLowerCase() === 'c') { press('C'); e.preventDefault(); }
    });
    setTimeout(function () { win.el.focus(); }, 30);
    win.onFocus = function () { win.el.focus(); };

    return win;
  }

  M7.registerApp({ id: 'calculator', name: 'Calculator', icon: 'calculator', launch: launch });
})(window.M7);
