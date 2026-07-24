/* MERIDIAN 7 — virtual filesystem. A tree in localStorage; every app reads and writes it. */
(function (M7) {
  'use strict';

  var KEY = 'm7.fs';
  var root = null;
  var listeners = [];

  function dir(name) { return { type: 'dir', name: name, children: {}, modified: Date.now() }; }
  function file(name, content, kind) {
    return { type: 'file', name: name, content: content || '', kind: kind || 'text', modified: Date.now() };
  }

  var README =
    'MERIDIAN 7 — READ ME\n' +
    '====================\n\n' +
    'Welcome to Meridian 7, system software for the MS-7 workstation.\n\n' +
    'GETTING AROUND\n' +
    '  Double-click a desktop icon to open a program.\n' +
    '  The Programs menu lists everything installed.\n' +
    '  Drag a window by its title bar. Drag the corner grip to resize.\n' +
    '  The close box sits on the LEFT of the title bar, as it should.\n\n' +
    'MAKING IT YOURS\n' +
    '  Control Panel holds themes, desktop patterns, sound and boot options.\n' +
    '  Six palettes ship with the system, including two monochrome CRT sets.\n\n' +
    'YOUR FILES\n' +
    '  Everything under /Documents and /Pictures is stored on this machine\n' +
    '  and survives a restart. Empty the Trash and it is gone for good.\n\n' +
    'Type HELP in the Terminal for the full command list.\n';

  var NOTE =
    'Field notes — MS-7 bring-up\n' +
    '---------------------------\n' +
    'Day 1. Bus timing is off by a hair on the second slot. Reseated it twice.\n' +
    'Day 2. Audio subsystem passes POST but the startup chord sounds a semitone\n' +
    '       flat on cold boot. Warms into tune after a minute.\n' +
    'Day 3. Wrote the whole log in Notes and it survived a hard power cycle.\n' +
    '       The filesystem holds.\n';

  var SEED = {
    'System': {
      'Extensions': {
        'Sound Manager': 'ext',
        'Display Enabler': 'ext',
        'File Sharing': 'ext',
        'Clock Daemon': 'ext'
      },
      'Preferences': {},
      'Fonts': { 'Meridian 12': 'ext', 'Console 10': 'ext' }
    },
    'Documents': {
      'Read Me.txt': README,
      'Field Notes.txt': NOTE
    },
    'Pictures': {},
    'Programs': {},
    'Trash': {}
  };

  function build(spec, parent) {
    Object.keys(spec).forEach(function (name) {
      var v = spec[name];
      if (typeof v === 'string') {
        parent.children[name] = v === 'ext'
          ? file(name, '', 'system')
          : file(name, v, 'text');
      } else {
        var d = dir(name);
        parent.children[name] = d;
        build(v, d);
      }
    });
  }

  function load() {
    if (root) return root;
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { root = JSON.parse(raw); return root; }
    } catch (e) { /* fall through to seed */ }
    root = dir('');
    build(SEED, root);
    save();
    return root;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(root)); } catch (e) { /* quota */ }
    listeners.forEach(function (fn) { fn(); });
  }

  function onChange(fn) { listeners.push(fn); }

  /* ---- paths ---- */

  function split(path) {
    return String(path).split('/').filter(function (s) { return s.length && s !== '.'; });
  }

  function normalize(path, cwd) {
    var parts;
    if (String(path).charAt(0) === '/') parts = split(path);
    else parts = split(cwd || '/').concat(split(path));
    var out = [];
    parts.forEach(function (p) {
      if (p === '..') out.pop();
      else out.push(p);
    });
    return '/' + out.join('/');
  }

  function node(path) {
    var parts = split(path);
    var cur = load();
    for (var i = 0; i < parts.length; i += 1) {
      if (cur.type !== 'dir' || !cur.children[parts[i]]) return null;
      cur = cur.children[parts[i]];
    }
    return cur;
  }

  function parentOf(path) {
    var parts = split(path);
    parts.pop();
    return node('/' + parts.join('/'));
  }

  function baseName(path) {
    var parts = split(path);
    return parts.length ? parts[parts.length - 1] : '/';
  }

  function dirName(path) {
    var parts = split(path);
    parts.pop();
    return '/' + parts.join('/');
  }

  function exists(path) { return !!node(path); }

  function isDir(path) { var n = node(path); return !!n && n.type === 'dir'; }

  function list(path) {
    var n = node(path);
    if (!n || n.type !== 'dir') return null;
    return Object.keys(n.children).sort(function (a, b) {
      var A = n.children[a], B = n.children[b];
      if (A.type !== B.type) return A.type === 'dir' ? -1 : 1;
      return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    }).map(function (k) { return n.children[k]; });
  }

  function mkdir(path) {
    var parent = parentOf(path), name = baseName(path);
    if (!parent || parent.type !== 'dir') return { error: 'no such directory' };
    if (parent.children[name]) return { error: 'already exists' };
    parent.children[name] = dir(name);
    save();
    return { ok: true };
  }

  function write(path, content, kind) {
    var parent = parentOf(path), name = baseName(path);
    if (!parent || parent.type !== 'dir') return { error: 'no such directory' };
    var existing = parent.children[name];
    if (existing && existing.type === 'dir') return { error: 'is a directory' };
    parent.children[name] = file(name, content, kind || (existing && existing.kind) || 'text');
    save();
    return { ok: true };
  }

  function read(path) {
    var n = node(path);
    if (!n) return null;
    if (n.type === 'dir') return null;
    return n.content;
  }

  function remove(path, permanent) {
    var parent = parentOf(path), name = baseName(path);
    if (!parent || !parent.children[name]) return { error: 'no such file' };
    if (path.indexOf('/System') === 0) return { error: 'system files are locked' };
    var item = parent.children[name];
    if (permanent || path.indexOf('/Trash') === 0) {
      delete parent.children[name];
    } else {
      var trash = node('/Trash');
      var target = name;
      var i = 2;
      while (trash.children[target]) { target = name + ' (' + i + ')'; i += 1; }
      item.name = target;
      trash.children[target] = item;
      delete parent.children[name];
    }
    save();
    return { ok: true };
  }

  function emptyTrash() {
    var trash = node('/Trash');
    var n = Object.keys(trash.children).length;
    trash.children = {};
    save();
    return n;
  }

  function rename(path, newName) {
    var parent = parentOf(path), name = baseName(path);
    if (!parent || !parent.children[name]) return { error: 'no such file' };
    if (parent.children[newName]) return { error: 'name already in use' };
    var item = parent.children[name];
    delete parent.children[name];
    item.name = newName;
    item.modified = Date.now();
    parent.children[newName] = item;
    save();
    return { ok: true };
  }

  function move(from, to) {
    var item = node(from);
    if (!item) return { error: 'no such file' };
    var destDir = isDir(to) ? node(to) : parentOf(to);
    var newName = isDir(to) ? item.name : baseName(to);
    if (!destDir || destDir.type !== 'dir') return { error: 'bad destination' };
    if (destDir.children[newName]) return { error: 'name already in use' };
    var srcParent = parentOf(from);
    delete srcParent.children[item.name];
    item.name = newName;
    destDir.children[newName] = item;
    save();
    return { ok: true };
  }

  function copy(from, to) {
    var item = node(from);
    if (!item) return { error: 'no such file' };
    var clone = JSON.parse(JSON.stringify(item));
    var destDir = isDir(to) ? node(to) : parentOf(to);
    var newName = isDir(to) ? item.name : baseName(to);
    if (!destDir) return { error: 'bad destination' };
    if (destDir.children[newName]) return { error: 'name already in use' };
    clone.name = newName;
    destDir.children[newName] = clone;
    save();
    return { ok: true };
  }

  function sizeOf(n) {
    if (!n) return 0;
    if (n.type === 'file') return (n.content || '').length;
    return Object.keys(n.children).reduce(function (sum, k) { return sum + sizeOf(n.children[k]); }, 0);
  }

  function countOf(n) {
    if (!n) return 0;
    if (n.type === 'file') return 1;
    return Object.keys(n.children).reduce(function (sum, k) { return sum + countOf(n.children[k]); }, 0);
  }

  function walk(path, fn, depth) {
    var n = node(path);
    if (!n || n.type !== 'dir') return;
    Object.keys(n.children).forEach(function (k) {
      var child = n.children[k];
      var childPath = (path === '/' ? '' : path) + '/' + k;
      fn(childPath, child, depth || 0);
      if (child.type === 'dir') walk(childPath, fn, (depth || 0) + 1);
    });
  }

  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    root = null;
    load();
  }

  /* Pick the app that should open a file. */
  function appFor(item) {
    if (!item || item.type === 'dir') return 'files';
    if (item.kind === 'image') return 'viewer';
    if (item.kind === 'system') return null;
    return 'notes';
  }

  function iconFor(item) {
    if (!item) return 'file';
    if (item.type === 'dir') return item.name === 'Trash' ? 'trash' : 'folder';
    if (item.kind === 'image') return 'picture';
    if (item.kind === 'system') return 'disk';
    return 'file';
  }

  M7.vfs = {
    load: load, save: save, onChange: onChange, node: node, list: list,
    normalize: normalize, baseName: baseName, dirName: dirName, exists: exists, isDir: isDir,
    mkdir: mkdir, write: write, read: read, remove: remove, rename: rename, move: move, copy: copy,
    emptyTrash: emptyTrash, sizeOf: sizeOf, countOf: countOf, walk: walk, reset: reset,
    appFor: appFor, iconFor: iconFor,
    get root() { return load(); }
  };
})(window.M7);
