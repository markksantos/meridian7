/* MERIDIAN 7 — Handbook */
(function (M7) {
  'use strict';

  var el = M7.el;

  var PAGES = [
    {
      title: 'Welcome',
      body: [
        ['h', 'Meridian 7'],
        ['p', 'This is the system software for the MS-7 Cartographer workstation. It runs entirely on your machine: every file you make, every setting you change and every picture you draw is written to local storage and is still there when you come back.'],
        ['p', 'Nothing here talks to a network. There is no account, no sync and no telemetry — the workstation is yours alone.'],
        ['h', 'The desk'],
        ['l', [
          'Double-click any desktop icon to open it.',
          'Drag icons anywhere; where you leave them is where they stay.',
          'Right-click the desktop for folders, patterns and the Terminal.',
          'The menu bar at the top holds every program on the disk.'
        ]]
      ]
    },
    {
      title: 'Windows',
      body: [
        ['h', 'Working with windows'],
        ['l', [
          'Drag the title bar to move a window. An outline follows the pointer; the window lands when you let go.',
          'The close box is on the LEFT of the title bar. The collapse and zoom boxes are on the right.',
          'Drag the grip in the bottom-right corner to resize.',
          'Double-click the title bar to zoom a window to full screen and back.',
          'Click a window anywhere to bring it forward. Inactive windows lose their pinstripes.'
        ]],
        ['h', 'The task strip'],
        ['p', 'Every open window gets a button along the bottom of the screen. Click it once to bring the window forward, again to put it away. Nothing is ever lost — a collapsed window is still running.'],
        ['h', 'Tidying up'],
        ['p', 'The Special menu can tile or stack every open window, clean up desktop icons, and empty the Trash.']
      ]
    },
    {
      title: 'Programs',
      body: [
        ['h', 'What is on the disk'],
        ['l', [
          'Terminal — a command shell over the real filesystem. Type HELP.',
          'Files — browse, rename, duplicate and trash your documents.',
          'Notes — a plain text editor that saves into any folder.',
          'Paint — a 288×184 canvas with sixteen colours and eight tools.',
          'Picture Viewer — opens the .pic files Paint writes.',
          'Calculator — four functions, one memory register, a paper tape.',
          'Sweeper — three field sizes; right-click plants a flag.',
          'Tape Deck — four synthesized tracks with a live spectrum.',
          'Control Panel — everything you can change.',
          'About This Workstation — specifications and gauges.'
        ]]
      ]
    },
    {
      title: 'Terminal',
      body: [
        ['h', 'The command shell'],
        ['p', 'The Terminal reads and writes the same files the rest of the system uses. Anything you create there shows up in Files immediately.'],
        ['l', [
          'HELP lists every command; MAN <command> explains one.',
          'Tab completes commands and paths. Up and Down walk your history.',
          'LS, CD, CAT, MKDIR, TOUCH, RM, MV, CP, TREE, FIND, WC do what you expect.',
          'THEME, WALL, VOL and SFX change the system without opening a panel.',
          'OPEN <program|file> launches things. APPS lists the programs.',
          'NEOFETCH, FORTUNE, BANNER, COWSAY and MATRIX are there for the pleasure of it.'
        ]]
      ]
    },
    {
      title: 'Customising',
      body: [
        ['h', 'Colour schemes'],
        ['p', 'Six palettes ship with the system: Oyster, Graphite, Ferro, Blueprint, and the two monochrome CRT sets — Phosphor and Amber. Every part of the interface, including the icons, repaints from the scheme you choose.'],
        ['h', 'Desktop patterns'],
        ['p', 'Eight patterns are generated at runtime from the current scheme, so the desk always matches the chrome. Right-click the desktop to switch quickly.'],
        ['h', 'The screen'],
        ['p', 'The CRT effect adds scanlines and a vignette over everything. Its strength is adjustable, and it can be turned off entirely if you prefer a flat picture. The pixel arrow cursor can also be switched back to your system pointer.'],
        ['h', 'Sound'],
        ['p', 'Every sound in Meridian 7 is generated on the fly — there is not a single audio file on the disk. Master volume, interface effects, key clicks and the startup chime are all separate switches in the Control Panel.'],
        ['h', 'Startup'],
        ['p', 'Choose Full, Fast or Instant startup. Full runs the whole power-on self test with the memory count. Pressing ESC during startup skips to the end.']
      ]
    },
    {
      title: 'Keys',
      body: [
        ['h', 'Keyboard'],
        ['l', [
          'ESC — skip the startup sequence; dismiss a dialog.',
          'ENTER — confirm the default button in a dialog.',
          'TAB — complete a command or path in the Terminal.',
          'Ctrl-L — clear the Terminal screen.',
          'Ctrl-S — save in Notes.',
          'Ctrl-Z — undo in Paint.',
          'Any key or click — wake the screen saver.'
        ]],
        ['h', 'If something goes wrong'],
        ['p', 'The Control Panel can reset preferences without touching your files, or erase the disk entirely and return it to its factory contents. Both ask first.']
      ]
    }
  ];

  function launch() {
    var index = 0;
    var listEl = el('div', { class: 'hb-toc' });
    var pageEl = el('div', { class: 'hb-page scroll' });
    var win;

    function render() {
      M7.$$('.hb-item', listEl).forEach(function (b, i) { b.classList.toggle('selected', i === index); });
      pageEl.innerHTML = '';
      var page = PAGES[index];
      pageEl.appendChild(el('div', { class: 'hb-title', text: page.title }));
      page.body.forEach(function (block) {
        if (block[0] === 'h') pageEl.appendChild(el('h3', { text: block[1] }));
        else if (block[0] === 'p') pageEl.appendChild(el('p', { text: block[1] }));
        else if (block[0] === 'l') {
          pageEl.appendChild(el('ul', {}, block[1].map(function (t) { return el('li', { text: t }); })));
        }
      });
      pageEl.scrollTop = 0;
      win.setStatus('Page ' + (index + 1) + ' of ' + PAGES.length, page.title);
    }

    PAGES.forEach(function (p, i) {
      listEl.appendChild(el('button', {
        class: 'hb-item', text: p.title,
        onclick: function () { index = i; M7.audio.play('select'); render(); }
      }));
    });

    win = M7.wm.open({
      app: 'handbook', title: 'Meridian 7 Handbook', icon: 'handbook',
      w: 560, h: 400, minW: 380, minH: 240, singleton: true, status: true,
      menus: [
        {
          label: 'Go',
          items: function () {
            return PAGES.map(function (p, i) {
              return { label: p.title, checked: i === index, action: function () { index = i; render(); } };
            });
          }
        }
      ],
      build: function (body) {
        body.appendChild(el('div', { class: 'hb' }, [
          listEl,
          el('div', { class: 'hb-main' }, [
            pageEl,
            el('div', { class: 'hb-nav' }, [
              el('button', { class: 'btn', text: '◀ Back', onclick: function () {
                index = (index - 1 + PAGES.length) % PAGES.length; M7.audio.play('click'); render();
              } }),
              el('button', { class: 'btn', text: 'Next ▶', onclick: function () {
                index = (index + 1) % PAGES.length; M7.audio.play('click'); render();
              } })
            ])
          ])
        ]));
      }
    });

    render();
    return win;
  }

  M7.registerApp({ id: 'handbook', name: 'Handbook', icon: 'handbook', launch: launch });
})(window.M7);
