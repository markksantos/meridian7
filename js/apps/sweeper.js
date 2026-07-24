/* MERIDIAN 7 — Sweeper */
(function (M7) {
  'use strict';

  var el = M7.el;

  var LEVELS = {
    beginner:     { w: 9,  h: 9,  mines: 10 },
    intermediate: { w: 16, h: 16, mines: 40 },
    expert:       { w: 24, h: 16, mines: 70 }
  };

  function launch() {
    var level = 'beginner';
    var grid = [], w = 0, h = 0, mines = 0;
    var started = false, over = false, won = false;
    var flags = 0, revealed = 0, seconds = 0, timer = null;

    var boardEl = el('div', { class: 'sw-board bevel-in' });
    var mineEl = el('div', { class: 'sw-count mono' });
    var timeEl = el('div', { class: 'sw-count mono' });
    var faceEl = el('button', { class: 'btn sw-face', text: ':-)' });
    var win;

    function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

    function startTimer() {
      stopTimer();
      timer = setInterval(function () {
        seconds += 1;
        timeEl.textContent = pad(Math.min(999, seconds));
      }, 1000);
    }

    function pad(n) { return ('00' + n).slice(-3); }

    function neighbors(x, y, fn) {
      for (var dy = -1; dy <= 1; dy += 1) {
        for (var dx = -1; dx <= 1; dx += 1) {
          if (!dx && !dy) continue;
          var nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          fn(grid[ny][nx], nx, ny);
        }
      }
    }

    function build() {
      var cfg = LEVELS[level];
      w = cfg.w; h = cfg.h; mines = cfg.mines;
      grid = [];
      started = over = won = false;
      flags = 0; revealed = 0; seconds = 0;
      stopTimer();
      timeEl.textContent = pad(0);
      mineEl.textContent = pad(mines);
      faceEl.textContent = ':-)';

      for (var y = 0; y < h; y += 1) {
        var row = [];
        for (var x = 0; x < w; x += 1) row.push({ mine: false, open: false, flag: false, n: 0, el: null });
        grid.push(row);
      }
      render();
      status();
    }

    function seed(sx, sy) {
      var placed = 0;
      while (placed < mines) {
        var x = (Math.random() * w) | 0, y = (Math.random() * h) | 0;
        if (grid[y][x].mine) continue;
        if (Math.abs(x - sx) <= 1 && Math.abs(y - sy) <= 1) continue;
        grid[y][x].mine = true;
        placed += 1;
      }
      for (var yy = 0; yy < h; yy += 1) {
        for (var xx = 0; xx < w; xx += 1) {
          var n = 0;
          neighbors(xx, yy, function (c) { if (c.mine) n += 1; });
          grid[yy][xx].n = n;
        }
      }
      started = true;
      startTimer();
    }

    function paint(cell) {
      var e = cell.el;
      e.className = 'sw-cell' + (cell.open ? ' open' : '') + (cell.flag ? ' flag' : '');
      if (cell.open) {
        if (cell.mine) { e.textContent = '*'; e.classList.add('mine'); }
        else if (cell.n) { e.textContent = String(cell.n); e.dataset.n = cell.n; }
        else e.textContent = '';
      } else {
        e.textContent = cell.flag ? 'P' : '';
        delete e.dataset.n;
      }
    }

    function reveal(x, y) {
      var cell = grid[y][x];
      if (cell.open || cell.flag || over) return;
      cell.open = true;
      revealed += 1;
      paint(cell);
      if (cell.mine) { lose(); return; }
      if (cell.n === 0) neighbors(x, y, function (c, nx, ny) { reveal(nx, ny); });
      checkWin();
    }

    function chord(x, y) {
      var cell = grid[y][x];
      if (!cell.open || !cell.n) return;
      var f = 0;
      neighbors(x, y, function (c) { if (c.flag) f += 1; });
      if (f !== cell.n) { M7.audio.play('error'); return; }
      neighbors(x, y, function (c, nx, ny) { if (!c.flag) reveal(nx, ny); });
    }

    function lose() {
      over = true; stopTimer();
      faceEl.textContent = 'X-(';
      grid.forEach(function (row) {
        row.forEach(function (c) { if (c.mine) { c.open = true; paint(c); } });
      });
      M7.audio.play('lose');
      status();
    }

    function checkWin() {
      if (over) return;
      if (revealed === w * h - mines) {
        over = true; won = true; stopTimer();
        faceEl.textContent = 'B-)';
        grid.forEach(function (row) {
          row.forEach(function (c) { if (c.mine && !c.flag) { c.flag = true; flags += 1; paint(c); } });
        });
        mineEl.textContent = pad(Math.max(0, mines - flags));
        M7.audio.play('win');
        status();
      }
    }

    function render() {
      boardEl.innerHTML = '';
      boardEl.style.gridTemplateColumns = 'repeat(' + w + ', 18px)';
      for (var y = 0; y < h; y += 1) {
        for (var x = 0; x < w; x += 1) {
          (function (cx, cy) {
            var cell = grid[cy][cx];
            var node = el('button', { class: 'sw-cell' });
            cell.el = node;
            node.addEventListener('click', function () {
              if (over) return;
              if (!started) seed(cx, cy);
              if (cell.open) { chord(cx, cy); return; }
              M7.audio.play('click');
              reveal(cx, cy);
              status();
            });
            node.addEventListener('contextmenu', function (ev) {
              ev.preventDefault();
              if (over || cell.open) return;
              cell.flag = !cell.flag;
              flags += cell.flag ? 1 : -1;
              mineEl.textContent = pad(Math.max(0, mines - flags));
              paint(cell);
              M7.audio.play('toggle');
              status();
            });
            boardEl.appendChild(node);
          })(x, y);
        }
      }
    }

    function status() {
      win.setStatus(level, mines + ' mines', flags + ' flagged',
        over ? (won ? 'CLEARED' : 'DETONATED') : started ? 'in play' : 'ready');
    }

    faceEl.addEventListener('click', function () { M7.audio.play('click'); build(); });

    win = M7.wm.open({
      app: 'sweeper', title: 'Sweeper', icon: 'sweeper',
      w: 300, h: 330, resizable: false, singleton: true, status: true,
      menus: [
        {
          label: 'Game',
          items: function () {
            return [
              { label: 'New Game', action: build },
              { sep: true },
              { label: 'Beginner', checked: level === 'beginner', action: function () { level = 'beginner'; build(); resize(); } },
              { label: 'Intermediate', checked: level === 'intermediate', action: function () { level = 'intermediate'; build(); resize(); } },
              { label: 'Expert', checked: level === 'expert', action: function () { level = 'expert'; build(); resize(); } },
              { sep: true },
              { label: 'How to Play', action: function () {
                M7.dialog.show({
                  title: 'Sweeper', icon: 'sweeper', heading: 'Clear the field',
                  message: 'Click a square to uncover it. A number tells you how many mines touch that square.\n' +
                           'Right-click to plant a flag. Click an uncovered number with the right count of\n' +
                           'flags around it to open the rest of its neighbours at once.'
                });
              } }
            ];
          }
        }
      ],
      onClose: function () { stopTimer(); return true; },
      build: function (body) {
        body.appendChild(el('div', { class: 'sw' }, [
          el('div', { class: 'sw-head bevel-in' }, [
            el('div', { class: 'sw-lcd bevel-in' }, mineEl),
            faceEl,
            el('div', { class: 'sw-lcd bevel-in' }, timeEl)
          ]),
          boardEl
        ]));
      }
    });

    function resize() {
      var cfg = LEVELS[level];
      win.el.style.width = (cfg.w * 18 + 30) + 'px';
      win.el.style.height = (cfg.h * 18 + 108) + 'px';
    }

    build();
    resize();
    return win;
  }

  M7.registerApp({ id: 'sweeper', name: 'Sweeper', icon: 'sweeper', launch: launch });
})(window.M7);
