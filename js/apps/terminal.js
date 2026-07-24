/* MERIDIAN 7 — Terminal */
(function (M7) {
  'use strict';

  var el = M7.el, esc = M7.util.esc;

  var LOGO = [
    '   ##     ##   ',
    '   ###   ###   ',
    '   #### ####   ',
    '   ## ### ##   ',
    '   ##  #  ##   ',
    '   ##     ##   ',
    '  =========== '
  ];

  var FORTUNES = [
    'A patched kernel is a promise you made to yourself.',
    'The bus is never the problem. Until it is the problem.',
    'Save early. The capacitor does not negotiate.',
    'Every workstation sounds different on a cold morning.',
    'Documentation is a letter to the person you will be in March.',
    'There are two hard problems: cache invalidation, and the third slot.',
    'Never trust a machine that boots silently.'
  ];

  function makeTerminal(startPath) {
    var cwd = startPath || '/Documents';
    var history = [];
    var histIndex = 0;

    var out = el('div', { class: 'term-out' });
    var mirror = el('span', { class: 'term-mirror' });
    var caret = el('span', { class: 'term-caret', text: ' ' });
    var tail = el('span', { class: 'term-tail' });
    var promptEl = el('span', { class: 'term-prompt' });
    var input = el('input', { class: 'term-input', type: 'text', spellcheck: 'false', autocomplete: 'off' });
    var lineEl = el('div', { class: 'term-line' }, [promptEl, mirror, caret, tail, input]);
    var root = el('div', { class: 'term' }, [out, lineEl]);

    var win = null;

    function prompt() {
      return M7.store.get('machineName') + ':' + cwd + '> ';
    }

    function syncLine() {
      promptEl.textContent = prompt();
      var v = input.value;
      var pos = input.selectionStart === null ? v.length : input.selectionStart;
      mirror.textContent = v.slice(0, pos);
      caret.textContent = v.charAt(pos) || ' ';
      tail.textContent = v.slice(pos + 1);
    }

    function print(text, cls) {
      var node = el('div', { class: 'term-row ' + (cls || ''), html: text });
      out.appendChild(node);
      out.scrollTop = out.scrollHeight;
      return node;
    }

    function printRaw(text, cls) { return print(esc(text), cls); }

    function abs(p) { return M7.vfs.normalize(p, cwd); }

    /* Split a command line, honouring "quoted names with spaces". */
    function tokenize(text) {
      var out = [], cur = '', quote = null, started = false;
      for (var i = 0; i < text.length; i += 1) {
        var ch = text.charAt(i);
        if (quote) {
          if (ch === quote) { quote = null; continue; }
          cur += ch; continue;
        }
        if (ch === '"' || ch === "'") { quote = ch; started = true; continue; }
        if (/\s/.test(ch)) {
          if (cur.length || started) { out.push(cur); cur = ''; started = false; }
          continue;
        }
        cur += ch;
      }
      if (cur.length || started) out.push(cur);
      return out;
    }

    /* Commands that take one path accept an unquoted name with spaces,
       so `cat Read Me.txt` behaves the way anyone would expect. */
    function onePath(args, rest) {
      if (rest && M7.vfs.exists(abs(rest))) return rest;
      return args[0];
    }

    /* ---------------- commands ---------------- */

    var COMMANDS = {};

    function cmd(name, help, args, fn) { COMMANDS[name] = { help: help, args: args, run: fn }; }

    cmd('help', 'list every command', '', function () {
      var names = Object.keys(COMMANDS).sort();
      print('<span class="hl">MERIDIAN 7 COMMAND REFERENCE</span>');
      names.forEach(function (n) {
        var c = COMMANDS[n];
        var usage = n + (c.args ? ' ' + c.args : '');
        print('  <span class="cmd">' + esc(padRight(usage, 22)) + '</span>' +
              '<span class="dim2">' + esc(c.help) + '</span>');
      });
      print('');
      print('<span class="dim2">Tab completes paths. Up/Down walks history. Ctrl-L clears.</span>');
    });

    cmd('ls', 'list a directory', '[path]', function (a, raw) {
      var p = onePath(a, raw);
      var target = p ? abs(p) : cwd;
      var items = M7.vfs.list(target);
      if (!items) { printRaw('ls: ' + target + ': no such directory', 'err'); return; }
      if (!items.length) { print('<span class="dim2">(empty)</span>'); return; }
      items.forEach(function (it) {
        var size = it.type === 'dir' ? '<DIR>' : String((it.content || '').length);
        print('  <span class="' + (it.type === 'dir' ? 'dirn' : '') + '">' + esc(padRight(it.name, 26)) + '</span>' +
              '<span class="dim2">' + esc(padLeft(size, 8)) + '  ' +
              esc(M7.util.fmtDate(new Date(it.modified || Date.now()))) + '</span>');
      });
      print('<span class="dim2">  ' + items.length + ' item' + (items.length === 1 ? '' : 's') + '</span>');
    });
    COMMANDS.dir = COMMANDS.ls;

    function padRight(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }
    function padLeft(s, n) { s = String(s); while (s.length < n) s = ' ' + s; return s; }

    cmd('cd', 'change directory', '<path>', function (a, raw) {
      if (!a[0]) { cwd = '/'; return; }
      var target = abs(onePath(a, raw));
      if (!M7.vfs.isDir(target)) { printRaw('cd: ' + target + ': not a directory', 'err'); return; }
      cwd = target === '' ? '/' : target;
    });

    cmd('pwd', 'print the working directory', '', function () { printRaw(cwd || '/'); });

    cmd('cat', 'show the contents of a file', '<file>', function (a, raw) {
      if (!a[0]) { printRaw('cat: no file given', 'err'); return; }
      var p = onePath(a, raw);
      var n = M7.vfs.node(abs(p));
      if (!n) { printRaw('cat: ' + p + ': no such file', 'err'); return; }
      if (n.type === 'dir') { printRaw('cat: ' + p + ': is a directory', 'err'); return; }
      if (n.kind === 'image') { printRaw('cat: ' + p + ': binary picture data (' + (n.content || '').length + ' bytes)', 'err'); return; }
      String(n.content || '').split('\n').forEach(function (l) { printRaw(l); });
    });
    COMMANDS.type = COMMANDS.cat;

    cmd('echo', 'print text; > writes it to a file', '<text> [> file]', function (a, raw) {
      var m = /^(.*?)\s*>\s*(\S+)\s*$/.exec(raw);
      if (m) {
        var res = M7.vfs.write(abs(m[2]), m[1]);
        if (res.error) printRaw('echo: ' + res.error, 'err');
        return;
      }
      printRaw(raw);
    });

    cmd('mkdir', 'create a directory', '<name>', function (a) {
      if (!a[0]) { printRaw('mkdir: no name given', 'err'); return; }
      var res = M7.vfs.mkdir(abs(a[0]));
      if (res.error) printRaw('mkdir: ' + res.error, 'err');
      else M7.audio.play('disk');
    });

    cmd('touch', 'create an empty file', '<name>', function (a) {
      if (!a[0]) { printRaw('touch: no name given', 'err'); return; }
      if (M7.vfs.exists(abs(a[0]))) return;
      var res = M7.vfs.write(abs(a[0]), '');
      if (res.error) printRaw('touch: ' + res.error, 'err');
    });

    cmd('rm', 'move a file to the Trash (-f deletes it)', '[-f] <path>', function (a, raw) {
      var force = a[0] === '-f';
      var target = force ? a.slice(1).join(' ') : onePath(a, raw);
      if (!target) { printRaw('rm: no path given', 'err'); return; }
      var res = M7.vfs.remove(abs(target), force);
      if (res.error) printRaw('rm: ' + res.error, 'err');
      else { M7.audio.play('trash'); M7.desktop.refresh(); }
    });
    COMMANDS.del = COMMANDS.rm;

    cmd('mv', 'move or rename', '<from> <to>', function (a) {
      if (a.length < 2) { printRaw('mv: needs a source and a destination', 'err'); return; }
      var res = M7.vfs.move(abs(a[0]), abs(a[1]));
      if (res.error) printRaw('mv: ' + res.error, 'err');
    });

    cmd('cp', 'copy a file', '<from> <to>', function (a) {
      if (a.length < 2) { printRaw('cp: needs a source and a destination', 'err'); return; }
      var res = M7.vfs.copy(abs(a[0]), abs(a[1]));
      if (res.error) printRaw('cp: ' + res.error, 'err');
    });

    cmd('tree', 'draw the directory tree', '[path]', function (a, raw) {
      var p = onePath(a, raw);
      var base = p ? abs(p) : cwd;
      if (!M7.vfs.isDir(base)) { printRaw('tree: not a directory', 'err'); return; }
      printRaw(base === '' ? '/' : base, 'dirn');
      M7.vfs.walk(base, function (path, item, depth) {
        var indent = '  ' + Array(depth + 1).join('  ');
        print(esc(indent) + '<span class="' + (item.type === 'dir' ? 'dirn' : '') + '">' +
              (item.type === 'dir' ? '+ ' : '- ') + esc(item.name) + '</span>');
      });
    });

    cmd('find', 'search file names', '<text>', function (a) {
      if (!a[0]) { printRaw('find: nothing to look for', 'err'); return; }
      var q = a[0].toLowerCase(), hits = 0;
      M7.vfs.walk('/', function (path, item) {
        if (item.name.toLowerCase().indexOf(q) >= 0) { printRaw(path); hits += 1; }
      });
      print('<span class="dim2">' + hits + ' match' + (hits === 1 ? '' : 'es') + '</span>');
    });

    cmd('wc', 'count lines, words and characters', '<file>', function (a, raw) {
      var c = M7.vfs.read(abs(onePath(a, raw) || ''));
      if (c === null) { printRaw('wc: no such file', 'err'); return; }
      var lines = c.split('\n').length;
      var words = c.split(/\s+/).filter(Boolean).length;
      printRaw('  ' + lines + ' lines  ' + words + ' words  ' + c.length + ' chars');
    });

    cmd('df', 'show storage in use', '', function () {
      var used = M7.store.usage() + JSON.stringify(M7.vfs.root).length;
      var cap = 5 * 1024 * 1024;
      var pct = Math.min(100, (used / cap) * 100);
      printRaw('FIXED DISK 0  CARTOGRAPHER');
      printRaw('  used ' + M7.util.fmtBytes(used) + ' of ' + M7.util.fmtBytes(cap) + '  (' + pct.toFixed(1) + '%)');
      var bars = Math.round(pct / 2.5);
      print('  <span class="hl">[' + Array(bars + 1).join('#') + Array(41 - bars).join('.') + ']</span>');
    });

    cmd('open', 'launch a program', '<program|file>', function (a, raw) {
      if (!a[0]) { printRaw('open: name a program or file. Try APPS.', 'err'); return; }
      var key = raw.toLowerCase();
      if (M7.apps[key]) { M7.launch(key); return; }
      var target = onePath(a, raw);
      var path = abs(target);
      var node = M7.vfs.node(path);
      if (!node) { printRaw('open: ' + target + ': not found', 'err'); return; }
      if (node.type === 'dir') { M7.launch('files', path); return; }
      var app = M7.vfs.appFor(node);
      if (!app) { printRaw('open: no program can open that', 'err'); return; }
      M7.launch(app, path);
    });

    cmd('apps', 'list installed programs', '', function () {
      M7.appOrder.forEach(function (id) {
        print('  <span class="cmd">' + padRight(id, 12) + '</span><span class="dim2">' + esc(M7.apps[id].name) + '</span>');
      });
    });

    cmd('ps', 'list open windows', '', function () {
      var ws = M7.wm.windows;
      if (!ws.length) { print('<span class="dim2">no windows open</span>'); return; }
      printRaw('  PID  PROGRAM      TITLE');
      ws.forEach(function (w, i) {
        printRaw('  ' + padLeft(100 + i, 3) + '  ' + padRight(w.app, 12) + ' ' + w.title);
      });
    });

    cmd('kill', 'close a window by PID', '<pid>', function (a) {
      var pid = parseInt(a[0], 10);
      var w = M7.wm.windows[pid - 100];
      if (!w) { printRaw('kill: no such process', 'err'); return; }
      w.close();
    });

    cmd('theme', 'change the color scheme', '[name]', function (a) {
      var ids = M7.theme.THEMES.map(function (t) { return t.id; });
      if (!a[0]) { printRaw('themes: ' + ids.join(', ') + '   (current: ' + M7.store.get('theme') + ')'); return; }
      var id = a[0].toLowerCase();
      if (ids.indexOf(id) < 0) { printRaw('theme: unknown scheme "' + a[0] + '"', 'err'); return; }
      M7.store.set('theme', id);
      M7.theme.applyTheme();
      M7.audio.play('toggle');
    });

    cmd('wall', 'change the desktop pattern', '[name]', function (a) {
      if (!a[0]) { printRaw('patterns: ' + M7.theme.PATTERNS.join(', ') + '   (current: ' + M7.store.get('wallpaper') + ')'); return; }
      if (M7.theme.PATTERNS.indexOf(a[0]) < 0) { printRaw('wall: unknown pattern', 'err'); return; }
      M7.store.set('wallpaper', a[0]);
      M7.theme.applyWallpaper();
    });

    cmd('vol', 'set the master volume', '[0-100]', function (a) {
      if (!a[0]) { printRaw('volume: ' + Math.round(M7.store.get('volume') * 100)); return; }
      var v = M7.util.clamp(parseInt(a[0], 10) || 0, 0, 100) / 100;
      M7.store.set('volume', v);
      M7.audio.setVolume(v);
      M7.audio.play('beep');
    });

    cmd('sfx', 'turn sound effects on or off', '<on|off|name>', function (a) {
      if (a[0] === 'on' || a[0] === 'off') {
        M7.store.set('sfx', a[0] === 'on');
        M7.audio.play('toggle');
        printRaw('sound effects ' + a[0]);
        return;
      }
      if (a[0]) { M7.audio.play(a[0]); return; }
      printRaw('sfx is ' + (M7.store.get('sfx') ? 'on' : 'off') + '. Try: sfx chime');
    });

    cmd('saver', 'start the screen saver', '', function () { M7.saver.start(true); });

    cmd('date', 'show the date and time', '', function () { printRaw(new Date().toString()); });

    cmd('whoami', 'show the current operator', '', function () { printRaw(M7.store.get('userName')); });

    cmd('uname', 'show system identification', '', function () {
      printRaw('Meridian 7 7.0.2 MS-7 CARTOGRAPHER m68030');
    });
    COMMANDS.ver = COMMANDS.uname;

    cmd('history', 'show recent commands', '', function () {
      history.forEach(function (h, i) { printRaw('  ' + padLeft(i + 1, 3) + '  ' + h); });
    });

    cmd('clear', 'clear the screen', '', function () { out.innerHTML = ''; });
    COMMANDS.cls = COMMANDS.clear;

    cmd('neofetch', 'system summary with logo', '', function () {
      var info = [
        ['operator', M7.store.get('userName')],
        ['host', 'Meridian MS-7 Cartographer'],
        ['system', 'Meridian 7 v7.0.2'],
        ['kernel', 'MSK 2.14'],
        ['shell', 'msh 1.4'],
        ['theme', M7.store.get('theme')],
        ['pattern', M7.store.get('wallpaper')],
        ['windows', String(M7.wm.windows.length) + ' open'],
        ['files', String(M7.vfs.countOf(M7.vfs.root))],
        ['memory', '16384K'],
        ['uptime', uptime()]
      ];
      var rows = Math.max(LOGO.length, info.length);
      for (var i = 0; i < rows; i += 1) {
        var left = LOGO[i] || '               ';
        var right = info[i] ? '<span class="cmd">' + padRight(info[i][0], 9) + '</span> ' + esc(info[i][1]) : '';
        print('<span class="hl">' + esc(left) + '</span>  ' + right);
      }
    });

    cmd('fortune', 'a thought from the machine', '', function () {
      printRaw(FORTUNES[(Math.random() * FORTUNES.length) | 0], 'hl');
    });

    cmd('banner', 'print big letters', '<text>', function (a, raw) {
      var text = (raw || 'MERIDIAN').toUpperCase().slice(0, 10);
      var FONT = {
        A: ['.##.', '#..#', '####', '#..#', '#..#'], B: ['###.', '#..#', '###.', '#..#', '###.'],
        C: ['.###', '#...', '#...', '#...', '.###'], D: ['###.', '#..#', '#..#', '#..#', '###.'],
        E: ['####', '#...', '###.', '#...', '####'], F: ['####', '#...', '###.', '#...', '#...'],
        G: ['.###', '#...', '#.##', '#..#', '.###'], H: ['#..#', '#..#', '####', '#..#', '#..#'],
        I: ['###', '.#.', '.#.', '.#.', '###'], J: ['..##', '...#', '...#', '#..#', '.##.'],
        K: ['#..#', '#.#.', '##..', '#.#.', '#..#'], L: ['#...', '#...', '#...', '#...', '####'],
        M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'], N: ['#..#', '##.#', '#.##', '#..#', '#..#'],
        O: ['.##.', '#..#', '#..#', '#..#', '.##.'], P: ['###.', '#..#', '###.', '#...', '#...'],
        Q: ['.##.', '#..#', '#..#', '#.##', '.###'], R: ['###.', '#..#', '###.', '#.#.', '#..#'],
        S: ['.###', '#...', '.##.', '...#', '###.'], T: ['#####', '..#..', '..#..', '..#..', '..#..'],
        U: ['#..#', '#..#', '#..#', '#..#', '.##.'], V: ['#..#', '#..#', '#..#', '.##.', '.##.'],
        W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'], X: ['#..#', '.##.', '.##.', '.##.', '#..#'],
        Y: ['#..#', '#..#', '.##.', '..#.', '..#.'], Z: ['####', '...#', '.##.', '#...', '####'],
        ' ': ['..', '..', '..', '..', '..'], '7': ['####', '...#', '..#.', '.#..', '.#..']
      };
      for (var r = 0; r < 5; r += 1) {
        var lineStr = '';
        for (var i = 0; i < text.length; i += 1) {
          var g = FONT[text.charAt(i)] || FONT[' '];
          lineStr += g[r].replace(/#/g, '█').replace(/\./g, ' ') + ' ';
        }
        print('<span class="hl">' + esc(lineStr) + '</span>');
      }
    });

    cmd('cowsay', 'consult the machine', '<text>', function (a, raw) {
      var text = raw || 'meridian seven';
      var bar = Array(text.length + 3).join('-');
      printRaw(' ' + bar);
      printRaw('< ' + text + ' >');
      printRaw(' ' + bar);
      printRaw('     \\   ___');
      printRaw('      \\ [o o]');
      printRaw('        [___]  MS-7');
      printRaw('        |   |');
    });

    cmd('matrix', 'let the phosphor run', '', function () {
      var rows = 16, cols = 62, node = print('');
      var chars = '01<>[]{}#@$%&*+=-';
      var n = 0;
      var timer = setInterval(function () {
        var buf = '';
        for (var y = 0; y < rows; y += 1) {
          for (var x = 0; x < cols; x += 1) {
            buf += Math.random() < 0.16 ? chars.charAt((Math.random() * chars.length) | 0) : ' ';
          }
          buf += '\n';
        }
        node.innerHTML = '<span class="hl">' + esc(buf) + '</span>';
        out.scrollTop = out.scrollHeight;
        n += 1;
        if (n > 26) { clearInterval(timer); node.innerHTML = '<span class="dim2">…phosphor settled.</span>'; }
      }, 70);
    });

    cmd('beep', 'sound the system bell', '', function () { M7.audio.play('beep'); });

    cmd('man', 'explain one command', '<command>', function (a) {
      var c = COMMANDS[(a[0] || '').toLowerCase()];
      if (!c) { printRaw('man: no entry for "' + (a[0] || '') + '"', 'err'); return; }
      print('<span class="hl">' + esc(a[0].toUpperCase()) + '</span>');
      printRaw('  usage: ' + a[0] + (c.args ? ' ' + c.args : ''));
      printRaw('  ' + c.help);
    });

    cmd('reboot', 'restart the workstation', '', function () { M7.boot.restart(); });
    cmd('shutdown', 'shut the workstation down', '', function () { M7.boot.shutdown(); });

    cmd('about', 'about Meridian 7', '', function () {
      printRaw('Meridian 7 — Workstation System Software, version 7.0.2');
      printRaw('(C) 1989-1993 Meridian Systems Inc.');
      printRaw('Built for the MS-7 Cartographer. 16384K RAM, 80M fixed disk.');
    });

    var started = Date.now();
    function uptime() {
      var s = Math.floor((Date.now() - started) / 1000);
      var m = Math.floor(s / 60);
      return m ? m + 'm ' + (s % 60) + 's' : s + 's';
    }

    /* ---------------- input handling ---------------- */

    function run(raw) {
      var text = raw.trim();
      print('<span class="term-prompt">' + esc(prompt()) + '</span>' + esc(raw));
      if (!text) return;
      history.push(text);
      histIndex = history.length;
      var parts = tokenize(text);
      var name = parts[0].toLowerCase();
      var args = parts.slice(1);
      var rest = text.slice(parts[0].length).trim();
      var c = COMMANDS[name];
      if (!c) {
        printRaw(name + ': command not found. Type HELP.', 'err');
        M7.audio.play('error');
        return;
      }
      try {
        c.run(args, rest);
      } catch (e) {
        printRaw('error: ' + e.message, 'err');
      }
      if (win) win.setStatus(cwd, history.length + ' commands');
    }

    function complete() {
      var v = input.value;
      var parts = v.split(/\s+/);
      var frag = parts[parts.length - 1] || '';
      var pool;
      if (parts.length === 1) {
        pool = Object.keys(COMMANDS);
      } else {
        var dirPart = frag.indexOf('/') >= 0 ? frag.slice(0, frag.lastIndexOf('/') + 1) : '';
        var namePart = frag.slice(dirPart.length);
        var listing = M7.vfs.list(M7.vfs.normalize(dirPart || '.', cwd)) || [];
        pool = listing.map(function (i) { return dirPart + i.name + (i.type === 'dir' ? '/' : ''); });
        frag = dirPart + namePart;
      }
      var hits = pool.filter(function (n) { return n.toLowerCase().indexOf(frag.toLowerCase()) === 0; });
      if (!hits.length) { M7.audio.play('error'); return; }
      if (hits.length === 1) {
        parts[parts.length - 1] = hits[0];
        input.value = parts.join(' ');
        M7.audio.play('tick');
      } else {
        print('<span class="dim2">' + hits.map(esc).join('   ') + '</span>');
        M7.audio.play('tick');
      }
      syncLine();
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var v = input.value;
        input.value = '';
        run(v);
        syncLine();
        out.scrollTop = out.scrollHeight;
        return;
      }
      if (e.key === 'Tab') { e.preventDefault(); complete(); return; }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!history.length) return;
        histIndex = Math.max(0, histIndex - 1);
        input.value = history[histIndex] || '';
        syncLine();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        histIndex = Math.min(history.length, histIndex + 1);
        input.value = history[histIndex] || '';
        syncLine();
        return;
      }
      if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); out.innerHTML = ''; return; }
      if (e.key.length === 1) M7.audio.play('key');
      setTimeout(syncLine, 0);
    });

    input.addEventListener('input', syncLine);
    input.addEventListener('click', syncLine);
    root.addEventListener('pointerdown', function () { setTimeout(function () { input.focus(); }, 0); });

    function greet() {
      print('<span class="hl">Meridian 7 Command Shell — msh 1.4</span>');
      print('<span class="dim2">(C) 1989-1993 Meridian Systems Inc.   Type HELP for commands.</span>');
      print('');
    }

    return {
      root: root,
      attach: function (w) {
        win = w;
        greet();
        syncLine();
        w.setStatus(cwd, '0 commands');
        setTimeout(function () { input.focus(); }, 30);
        w.onFocus = function () { input.focus(); };
      }
    };
  }

  M7.registerApp({
    id: 'terminal',
    name: 'Terminal',
    icon: 'terminal',
    launch: function (path) {
      var term = makeTerminal(typeof path === 'string' ? path : undefined);
      var win = M7.wm.open({
        app: 'terminal', title: 'Terminal', icon: 'terminal',
        w: 620, h: 380, minW: 340, minH: 200, status: true,
        menus: [
          {
            label: 'Shell',
            items: [
              { label: 'New Terminal', icon: 'terminal', action: function () { M7.launch('terminal'); } },
              { sep: true },
              { label: 'Close', key: 'Ctrl W', action: function () { win.close(); } }
            ]
          }
        ],
        build: function (body) { body.appendChild(term.root); }
      });
      term.attach(win);
      return win;
    }
  });
})(window.M7);
