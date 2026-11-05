/* ==========================================================================
   AI-RAN Presentation — presentation.js
   Renders the knowledge map from content/, builds the presentation chrome
   (progress, TOC, minimap, presenter notes, quiz, references, help) and owns
   the "current scene" state machine.
   ========================================================================== */
(function () {
  'use strict';

  var A = (window.AIRAN = window.AIRAN || {});
  var P = (A.Presentation = {});

  var REF_GROUPS = [
    { kind: 'official', label: 'اسناد رسمی · وایت‌پیپرها و معماری' },
    { kind: 'standard', label: 'استانداردها و اتحادهای صنعتی' },
    { kind: 'research', label: 'منابع پژوهشی' },
    { kind: 'vendor', label: 'مستندات سازندگان' },
    { kind: 'tool', label: 'ابزارها و مستندات فنی' },
    { kind: 'project', label: 'اسناد پروژه' }
  ];

  var els = {};
  var scenes = [];
  var current = 0;
  var notesOpen = false;
  var tocOpen = false;
  var helpOpen = false;
  var started = false;

  /* ------------------------------------------------------------------ util */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function q(sel, root) {
    return (root || document).querySelector(sel);
  }

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function sceneIndexById(id) {
    for (var i = 0; i < scenes.length; i++) if (scenes[i].id === id) return i;
    return -1;
  }

  /* ----------------------------------------------------------- scene html */
  function sourcesHTML(sc) {
    if (!sc.srcs || !sc.srcs.length) return '';
    var out = '';
    sc.srcs.forEach(function (k) {
      var s = A.sources[k];
      if (!s) return;
      out += '<span class="src"><b>' + esc(s.short || s.label) + '</b></span>';
    });
    return out;
  }

  function figureHTML(v) {
    if (!v || v.type === 'none') return '';
    if (v.type === 'image') {
      var span = v.wide ? ' style="grid-column:1/-1"' : '';
      return (
        '<figure class="figure"' + span + '>' +
        '<div class="frame' + (v.dark ? ' is-dark' : '') + '">' +
        '<img src="' + esc(v.src) + '" alt="' + esc(v.alt || '') + '" decoding="async">' +
        '</div>' +
        (v.caption || v.credit
          ? '<figcaption>' + esc(v.caption || '') +
            (v.credit ? '<span class="credit">منبع: ' + esc(v.credit) + '</span>' : '') +
            '</figcaption>'
          : '') +
        '</figure>'
      );
    }
    if (v.type === 'svg') {
      return (
        '<figure class="figure figure-diagram"' + (v.wide ? ' style="grid-column:1/-1"' : '') + '>' +
        '<div class="diagram">' + A.diagrams.render(v.key) + '</div>' +
        (v.caption || v.credit
          ? '<figcaption>' + esc(v.caption || '') +
            (v.credit ? '<span class="credit">' + esc(v.credit) + '</span>' : '') +
            '</figcaption>'
          : '') +
        '</figure>'
      );
    }
    return '';
  }

  function cardsHTML(cards) {
    if (!cards || !cards.length) return '';
    var cls = cards.length === 2 ? 'two' : cards.length === 3 ? 'three' : 'four';
    var out = '<div class="cards ' + cls + '">';
    cards.forEach(function (c) {
      out +=
        '<div class="card ' + (c.cls || '') + '">' +
        '<div class="card-title">' + esc(c.title) +
        (c.tag ? '<span class="tag">' + esc(c.tag) + '</span>' : '') +
        '</div>' +
        (c.text ? '<p>' + esc(c.text) + '</p>' : '') +
        '</div>';
    });
    return out + '</div>';
  }

  function stepsHTML(steps, horizontal) {
    if (!steps || !steps.length) return '';
    var out = '<ol class="steps' + (horizontal ? ' horizontal' : '') + '">';
    steps.forEach(function (s) {
      out += '<li><div><b>' + esc(s.t) + '</b>' + (s.d ? '<br><span style="color:var(--ink-dim)">' + esc(s.d) + '</span>' : '') + '</div></li>';
    });
    return out + '</ol>';
  }

  function tableHTML(t) {
    if (!t) return '';
    var out = '<div class="tbl-wrap"><table class="tbl ' + (t.cls || '') + '">';
    if (t.caption) out += '<caption>' + esc(t.caption) + '</caption>';
    out += '<thead><tr>';
    t.head.forEach(function (h) {
      out += '<th>' + esc(h) + '</th>';
    });
    out += '</tr></thead><tbody>';
    t.rows.forEach(function (r) {
      out += '<tr>';
      r.forEach(function (cell, i) {
        out += (i === 0 ? '<td><b>' + esc(cell) + '</b></td>' : '<td>' + esc(cell) + '</td>');
      });
      out += '</tr>';
    });
    out += '</tbody></table></div>';
    return out;
  }

  function quizHTML(list) {
    var out = '<div class="quiz' + (list.length > 4 ? ' is-grid' : '') + '">';
    list.forEach(function (item, i) {
      out +=
        '<div class="quiz-item" data-q="' + i + '" data-correct="' + item.c + '">' +
        '<div class="quiz-q"><span class="qn">' + pad2(i + 1) + '</span><span>' + esc(item.q) + '</span></div>' +
        '<div class="quiz-opts">';
      item.opts.forEach(function (o, k) {
        out += '<button class="quiz-opt" type="button" data-k="' + k + '">' + esc(o) + '</button>';
      });
      out += '</div><div class="quiz-exp">' + esc(item.exp || '') + '</div></div>';
    });
    out +=
      '<div class="quiz-score">پاسخ صحیح: <b id="quiz-score">۰</b> از <b id="quiz-total">' +
      list.length +
      '</b><span class="dot-sep"></span><button class="nav-btn" type="button" id="quiz-reset">شروع دوباره</button></div>';
    return out + '</div>';
  }

  function refsHTML() {
    var out = '<div class="refs">';
    REF_GROUPS.forEach(function (g) {
      var items = Object.keys(A.sources)
        .map(function (k) {
          return A.sources[k];
        })
        .filter(function (s) {
          return s.kind === g.kind;
        });
      if (!items.length) return;
      out += '<div class="ref-group"><h4>' + esc(g.label) + '</h4><ul class="ref-list">';
      items.forEach(function (s) {
        out +=
          '<li>' +
          (s.url
            ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.label) + '</a>'
            : esc(s.label)) +
          ' — <span style="color:var(--ink-mute)">' + esc(s.org) + '</span></li>';
      });
      out += '</ul></div>';
    });
    out += '</div>';
    out +=
      '<div class="callout note" style="margin-top:16px"><div class="ico">i</div><div>' +
      'تصاویر فنی از دارایی‌های تصویری پروژه و از شکل‌های وایت‌پیپرهای AI-RAN Alliance گرفته شده‌اند؛ ' +
      'نمودارهای مفهومی (با برچسب «نمودار مفهومی») برای این ارائه ساخته شده‌اند و ادعای رسمی بودن ندارند. ' +
      'تصاویر شبیه‌سازی با ابزار Sionna RT نمایش داده شده‌اند و تصویر رسمی معماری محصول نیستند.' +
      '</div></div>';
    return out;
  }

  function engageHTML(e) {
    if (!e) return '';
    return (
      '<div class="engage">' +
      '<button type="button" aria-expanded="false"><span class="q">؟</span><span>' +
      esc(e.q) +
      '</span><span style="margin-inline-start:auto;font-size:.9em;color:var(--ink-mute)">نمایش پاسخ</span></button>' +
      '<div class="answer">' + esc(e.a) + '</div>' +
      '</div>'
    );
  }

  function coverHTML(sc) {
    var c = sc.cover || {};
    var out = '<div class="cover">';
    out += coverArt();
    out += '<div class="cover-copy">';
    out += '<div class="cover-eyebrow">' + esc(c.eyebrow || 'AI-RAN') + '</div>';
    out += '<h1 class="cover-title">' + esc(sc.title) + '<span class="l2">' + esc(c.l2 || '') + '</span></h1>';
    if (c.branches) {
      out += '<div class="cover-branches">';
      c.branches.forEach(function (b) {
        out +=
          '<div class="cover-branch ' + esc(b.cls) + '">' +
          '<span class="n">' + esc(b.n) + '</span>' +
          '<span class="t">' + esc(b.t) + '</span>' +
          '<span class="d">' + esc(b.d) + '</span></div>';
      });
      out += '</div>';
    }
    if (c.meta) {
      out += '<div class="cover-meta">';
      c.meta.forEach(function (m) {
        out += '<span>' + esc(m[0]) + ' <b>' + esc(m[1]) + '</b></span>';
      });
      out += '</div>';
    }
    out += '</div></div>';
    return out;
  }

  function sceneBody(sc) {
    var v = sc.visual || { type: 'none' };
    var hasVisual = v.type !== 'none';
    var hasText = !!(sc.lead || sc.bullets || sc.cards || sc.steps || sc.table || sc.quiz);

    if (sc.kind === 'cover') {
      return { cls: 'layout-center', html: coverHTML(sc) };
    }
    if (sc.kind === 'quiz') {
      return { cls: 'layout-text', html: '<div class="scene-text">' + quizHTML(sc.quiz || []) + '</div>' };
    }
    if (sc.kind === 'refs') {
      return { cls: 'layout-text', html: '<div class="scene-text">' + refsHTML() + '</div>' };
    }
    if (sc.kind === 'end') {
      return {
        cls: 'layout-center',
        html:
          '<div class="scene-text" style="text-align:center;align-items:center">' +
          (sc.lead ? '<p class="lead" style="max-width:1100px">' + esc(sc.lead) + '</p>' : '') +
          (sc.bullets
            ? '<ul class="bullets" style="text-align:right;max-width:1180px">' +
              sc.bullets.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') +
              '</ul>'
            : '') +
          '</div>'
      };
    }

    /* text column */
    var t = '';
    if (sc.lead) t += '<p class="lead">' + esc(sc.lead) + '</p>';
    if (sc.cards) t += cardsHTML(sc.cards);
    if (sc.steps) t += stepsHTML(sc.steps, !!sc.stepsHorizontal);
    if (sc.table) t += tableHTML(sc.table);
    if (sc.bullets) {
      t += '<ul class="bullets' + (sc.bullets.length > 4 ? ' compact' : '') + '">';
      sc.bullets.forEach(function (b) {
        t += '<li>' + esc(b) + '</li>';
      });
      t += '</ul>';
    }
    if (sc.example) {
      t +=
        '<div class="example"><span class="lbl">مثال عملی</span>' +
        esc(sc.example.text) +
        '</div>';
    }
    if (sc.callout) {
      t +=
        '<div class="callout ' + (sc.callout.kind || '') + '">' +
        '<div class="ico">' + (sc.callout.kind === 'warn' ? '!' : 'i') + '</div>' +
        '<div>' + (sc.callout.title ? '<b>' + esc(sc.callout.title) + ' · </b>' : '') + esc(sc.callout.text) + '</div>' +
        '</div>';
    }
    if (sc.engage) t += engageHTML(sc.engage);

    var textBlock = t ? '<div class="scene-text">' + t + '</div>' : '';
    var figBlock = hasVisual ? figureHTML(v) : '';

    if (hasVisual && hasText) {
      /* diagrams need more room than photos to stay legible */
      var cls = v.type === 'svg' ? 'layout-split-visual' : 'layout-split';
      return { cls: cls, html: textBlock + figBlock };
    }
    if (hasVisual && !hasText) return { cls: 'layout-visual', html: figBlock };
    return { cls: 'layout-text', html: textBlock || '<div class="scene-text"></div>' };
  }

  function coverArt() {
    /* decorative network motif for the cover card (pure SVG, no assets) */
    var nodes = [
      [120, 210], [250, 120], [330, 250], [180, 330], [300, 380], [420, 190], [90, 330]
    ];
    var rays = [
      { x: 40, y: 300, c: 'rgba(79,140,255,0.45)' },
      { x: 480, y: 150, c: 'rgba(45,212,191,0.4)' },
      { x: 300, y: 470, c: 'rgba(168,85,247,0.42)' }
    ];
    var out =
      '<svg class="cover-art" viewBox="0 0 520 480" aria-hidden="true">' +
      '<defs><radialGradient id="caGlow" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="rgba(79,140,255,0.32)"/><stop offset="100%" stop-color="rgba(79,140,255,0)"/>' +
      '</radialGradient></defs>' +
      '<circle cx="260" cy="240" r="210" fill="url(#caGlow)"/>';
    for (var i = 1; i <= 4; i++) {
      out +=
        '<circle cx="260" cy="240" r="' + i * 48 + '" fill="none" stroke="rgba(140,180,240,' +
        (0.15 - i * 0.024).toFixed(3) + ')" stroke-width="1.2"/>';
    }
    rays.forEach(function (r) {
      out +=
        '<path d="M260,240 L' + r.x + ',' + r.y + '" stroke="' + r.c +
        '" stroke-width="1.4" stroke-dasharray="4 6"/>';
    });
    nodes.forEach(function (n, k) {
      out +=
        '<circle cx="' + n[0] + '" cy="' + n[1] + '" r="' + (k % 3 === 0 ? 7 : 4.5) +
        '" fill="rgba(180,210,255,0.75)"/>';
      out +=
        '<circle cx="' + n[0] + '" cy="' + n[1] + '" r="' + (k % 3 === 0 ? 16 : 10) +
        '" fill="none" stroke="rgba(140,180,240,0.25)"/>';
    });
    out +=
      '<rect x="212" y="192" width="96" height="96" rx="16" fill="rgba(9,17,31,0.92)" stroke="rgba(140,180,240,0.45)"/>' +
      '<text x="260" y="249" text-anchor="middle" font-family="Vazirmatn, Segoe UI, sans-serif" font-size="22" font-weight="700" fill="#dce8ff">AI</text>' +
      '</svg>';
    return out;
  }

  function sceneHTML(sc, idx) {
    var sec = A.section(sc.sec);
    var body = sceneBody(sc);
    var size = sc.size === 'L' ? ' is-large' : '';
    var out =
      '<section class="scene ' + sec.accent + size + ' kind-' + (sc.kind || 'topic') + '"' +
      ' id="scene-' + esc(sc.id) + '" data-id="' + esc(sc.id) + '" data-sec="' + esc(sc.sec) + '"' +
      ' role="group" aria-label="' + esc(sc.title) + '">';

    out +=
      '<div class="scene-mini"><span class="dot"></span><span class="mini-title">' +
      esc(sc.title) +
      '</span></div>';

    out += '<div class="scene-inner">';
    if (sc.kind !== 'cover') {
      out += '<header class="scene-head">';
      out +=
        '<span class="scene-kicker"><span class="idx">' + esc(sec.index) + ' · ' + pad2(idx + 1) + '</span>' +
        esc(sc.kicker || sec.title) +
        '</span>';
      out += '<h2 class="scene-title">' + esc(sc.title) + '</h2>';
      if (sc.en) out += '<p class="scene-en">' + esc(sc.en) + '</p>';
      out += '</header>';
    } else {
      out +=
        '<header class="scene-head scene-head-cover"><span class="scene-kicker"><span class="idx">' +
        esc(sec.index) + ' · ' + pad2(idx + 1) + '</span>' + esc(sc.kicker || sec.title) + '</span></header>';
    }

    out += '<div class="scene-body ' + body.cls + '">' + body.html + '</div>';

    out += '<footer class="scene-foot">';
    out += sourcesHTML(sc);
    out += '<span class="minutes-chip">~' + esc(sc.minutes || 2) + ' دقیقه</span>';
    out += '</footer>';
    out += '</div></section>';
    return out;
  }

  /* ------------------------------------------------------------- chrome */
  function buildProgress() {
    return (
      '<div class="top-progress">' +
      '<div class="progress-track"><div class="progress-bar" id="progress-bar"></div></div>' +
      '<div class="progress-meta">' +
      '<span class="sec" id="progress-sec">—</span>' +
      '<span class="cnt" id="progress-cnt">0 / 0</span>' +
      '</div></div>'
    );
  }

  function buildTOC() {
    var out = '<div class="drawer-head"><div><h2>فهرست موضوع‌ها</h2>' +
      '<div class="sub">' + scenes.length + ' موضوع · حدود ' + A.stats.minutes + ' دقیقه</div></div>' +
      '<button class="icon-btn" type="button" data-act="toc-close" aria-label="بستن فهرست">✕</button></div>';
    out += '<div class="toc-body scroll-y">';
    A.sections.forEach(function (sec) {
      var list = scenes
        .map(function (s, i) {
          return { s: s, i: i };
        })
        .filter(function (o) {
          return o.s.sec === sec.id;
        });
      out += '<div class="toc-section ' + sec.accent + '">';
      out +=
        '<button class="toc-sec-btn" type="button" data-act="section" data-sec="' + esc(sec.id) + '">' +
        '<span class="swatch"></span><span>' + esc(sec.index + ' · ' + sec.title) + '</span>' +
        '<span class="min">' + esc(sec.minutes) + ' min</span></button>';
      out += '<div class="toc-items">';
      list.forEach(function (o) {
        out +=
          '<button class="toc-item" type="button" data-act="goto" data-i="' + o.i + '" data-id="' + esc(o.s.id) + '">' +
          '<span class="n">' + pad2(o.i + 1) + '</span><span>' + esc(o.s.title) + '</span></button>';
      });
      out += '</div></div>';
    });
    out += '</div>';
    return out;
  }

  function buildMinimap() {
    var b = A.Camera.bounds;
    var pad = 260;
    var vb = {
      x: b.minX - pad,
      y: b.minY - pad,
      w: b.maxX - b.minX + pad * 2,
      h: b.maxY - b.minY + pad * 2
    };
    var out =
      '<div class="map-label"><b>نقشه</b><span>برای پرش کلیک کنید</span></div>' +
      '<svg viewBox="' + vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="minimap">';
    A.Camera.zones.forEach(function (z) {
      out +=
        '<rect class="map-zone" x="' + z.left + '" y="' + z.top + '" width="' + z.width + '" height="' + z.height + '" rx="' + 60 + '"/>';
    });
    A.Camera.scenes.forEach(function (s) {
      out +=
        '<rect class="map-scene" data-id="' + esc(s.id) + '" x="' + s.x + '" y="' + s.y + '" width="' + s.w + '" height="' + s.h + '" rx="' + 26 + '"/>';
    });
    out += '<rect class="map-vp" id="map-vp" x="0" y="0" width="0" height="0" rx="30"/>';
    out += '</svg>';
    return out;
  }

  function buildNotes() {
    return (
      '<div class="notes-head">' +
      '<span class="nt" id="notes-title">—</span>' +
      '<span class="ns" id="notes-sec">—</span>' +
      '<span class="time" id="notes-time">—</span>' +
      '<button class="icon-btn" type="button" data-act="notes-close" aria-label="بستن یادداشت">✕</button>' +
      '</div>' +
      '<div class="notes-body scroll-y">' +
      '<div class="col"><h3>یادداشت مدرس</h3><div id="notes-text">—</div>' +
      '<div id="notes-engage"></div></div>' +
      '<div class="col"><h3>منابع این موضوع</h3><div class="src-list" id="notes-src"></div></div>' +
      '</div>'
    );
  }

  function buildHelp() {
    var rows = [
      ['→ / Space', 'موضوع بعدی'],
      ['←', 'موضوع قبلی'],
      ['Home', 'بازگشت به نمای کلی'],
      ['Esc', 'بستن پنجره‌ها / نمای کلی'],
      ['+ / −', 'بزرگ‌نمایی و کوچک‌نمایی'],
      ['F', 'حالت تمام‌صفحه'],
      ['N', 'یادداشت مدرس'],
      ['T', 'فهرست موضوع‌ها'],
      ['1 … 7', 'پرش به بخش'],
      ['Q', 'آزمون دانش'],
      ['M', 'نمایش/پنهان‌کردن نقشه'],
      ['?', 'همین راهنما']
    ];
    var out = '<div class="modal-card"><h2>راهنمای ناوبری</h2>' +
      '<div class="m-sub">نقشه را با درگ جابه‌جا کنید، با اسکرول بزرگ‌نمایی کنید و با کلیک روی هر موضوع به آن پرواز کنید.</div>' +
      '<div class="keys">';
    rows.forEach(function (r) {
      out += '<div class="key-row"><span class="k">' + esc(r[0]) + '</span><span class="d">' + esc(r[1]) + '</span></div>';
    });
    out += '</div><div class="modal-note">این ارائه کاملاً آفلاین اجرا می‌شود: فونت‌ها، تصاویر و نمودارها همه محلی هستند. برای حالت ارائه، کلید F را بزنید و نشانگر ماوس را کنار بگذارید.</div></div>';
    return out;
  }

  /* ------------------------------------------------------------- render */
  P.build = function () {
    var world = (els.world = q('#world'));
    var stage = (els.stage = q('#stage'));
    els.toc = q('#toc');
    els.notes = q('#notes');
    els.help = q('#help');
    els.map = q('#hud-map');

    scenes = A.scenes.slice();

    /* static markup that lives outside the world */
    q('#hud-top').innerHTML =
      '<div class="brand"><div class="brand-mark" aria-hidden="true"></div>' +
      '<div class="brand-text"><b>AI-RAN</b><span>' + esc(A.meta.subtitle) + '</span></div></div>' +
      buildProgress() +
      '<div class="top-actions">' +
      '<button class="icon-btn" type="button" data-act="toc" title="فهرست (T)" aria-label="فهرست">☰</button>' +
      '<button class="icon-btn" type="button" data-act="notes" title="یادداشت مدرس (N)" aria-label="یادداشت">✎</button>' +
      '<button class="icon-btn" type="button" data-act="fullscreen" title="تمام‌صفحه (F)" aria-label="تمام‌صفحه">⛶</button>' +
      '<button class="icon-btn" type="button" data-act="help" title="راهنما (?)" aria-label="راهنما">?</button>' +
      '</div>';

    q('#hud-nav').innerHTML =
      '<div class="nav-pill">' +
      '<button class="nav-btn" type="button" data-act="overview" title="نمای کلی (Home)">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/></svg>' +
      '<span class="label">نمای کلی</span></button>' +
      '<span class="nav-divider"></span>' +
      '<button class="nav-btn" type="button" data-act="prev" title="قبلی (←)">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M15 5l-7 7 7 7"/></svg>' +
      '<span class="label">قبلی</span></button>' +
      '<span class="nav-counter" id="nav-counter">— / —</span>' +
      '<button class="nav-btn primary" type="button" data-act="next" title="بعدی (→)">' +
      '<span class="label">بعدی</span>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M9 5l7 7-7 7"/></svg></button>' +
      '</div>';

    q('#hud-zoom').innerHTML =
      '<button class="zoom-btn" type="button" data-act="zoom-in" title="بزرگ‌نمایی (+)">+</button>' +
      '<button class="zoom-btn" type="button" data-act="zoom-out" title="کوچک‌نمایی (−)">−</button>' +
      '<button class="zoom-btn fit" type="button" data-act="overview" title="نمای کلی (Home)">FIT</button>';

    q('#hud-map').innerHTML = '';
    q('#toc').innerHTML = buildTOC();
    q('#notes').innerHTML = buildNotes();
    q('#help').innerHTML = buildHelp();

    /* world content */
    var layout = A.Camera.layout(scenes, A.sections);

    var html = '';
    /* zone plates */
    layout.zones.forEach(function (z) {
      var sec = A.section(z.id);
      html +=
        '<div class="zone ' + sec.accent + '" style="left:' + z.left + 'px;top:' + z.top + 'px;width:' +
        z.width + 'px;height:' + z.height + 'px" data-zone="' + esc(z.id) + '">' +
        '<div class="zone-head">' +
        '<span class="zone-index">' + esc(sec.index) + '</span>' +
        '<span class="zone-title">' + esc(sec.en) + '</span>' +
        '<span class="zone-sub">' + esc(sec.title) + '</span>' +
        '<span class="zone-meta">' + esc(sec.minutes) + ' min</span>' +
        '</div></div>';
    });

    scenes.forEach(function (sc, i) {
      html += sceneHTML(sc, i);
    });

    world.innerHTML = '<svg class="world-links" id="world-links"></svg>' + html;

    /* size the world exactly to its bounds so the grid texture is aligned */
    world.style.width = layout.bounds.maxX - layout.bounds.minX + 'px';
    world.style.height = layout.bounds.maxY - layout.bounds.minY + 'px';

    /* position the scene cards */
    layout.scenes.forEach(function (s) {
      var el = q('#scene-' + s.id);
      if (!el) return;
      el.style.left = s.x + 'px';
      el.style.top = s.y + 'px';
      el.style.width = s.w + 'px';
      el.style.height = s.h + 'px';
    });

    /* links between the hub and each branch */
    var links = q('#world-links');
    links.setAttribute('viewBox', [layout.bounds.minX, layout.bounds.minY, layout.bounds.maxX - layout.bounds.minX, layout.bounds.maxY - layout.bounds.minY].join(' '));
    links.style.left = layout.bounds.minX + 'px';
    links.style.top = layout.bounds.minY + 'px';
    links.style.width = layout.bounds.maxX - layout.bounds.minX + 'px';
    links.style.height = layout.bounds.maxY - layout.bounds.minY + 'px';

    var hub = A.Camera.sceneById('i07');
    var targets = [
      { id: 'for', cls: 'is-for' },
      { id: 'in', cls: 'is-in' },
      { id: 'on', cls: 'is-on' },
      { id: 'compare', cls: '' },
      { id: 'eco', cls: '' },
      { id: 'wrap', cls: '' }
    ];
    if (hub) {
      targets.forEach(function (t) {
        var z = A.Camera.zoneById(t.id);
        if (!z) return;
        var tx = z.left + z.width / 2;
        var ty = z.top + 40;
        var d =
          'M' + hub.cx + ',' + (hub.y + hub.h) +
          ' C' + hub.cx + ',' + (hub.y + hub.h + 900) + ' ' + tx + ',' + (ty - 900) + ' ' + tx + ',' + ty;
        links.innerHTML += '<path class="link ' + t.cls + '" d="' + d + '"/>';
        links.innerHTML += '<circle class="node-dot" cx="' + tx + '" cy="' + ty + '" r="34"/>';
      });
    }

    q('#hud-map').innerHTML = buildMinimap();

    /* camera */
    A.Camera.init({
      stage: stage,
      world: world,
      onChange: function (state, vpWorld) {
        onCamera(state, vpWorld);
      }
    });

    bindUI();
    A._fitDebugWanted = /[?&]fitdebug/.test(location.search);
    fitContent();

    /* typography and images change the measured content height, so re-fit the
       cards once the webfonts are ready and once every figure has decoded */
    P.refit = function () {
      fitContent();
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        fitContent();
      });
    }
    window.addEventListener('load', function () {
      fitContent();
    });
    var pendingImgs = Array.prototype.slice.call(document.querySelectorAll('.figure img'));
    var refitTimer = null;
    function scheduleRefit() {
      if (refitTimer) clearTimeout(refitTimer);
      refitTimer = setTimeout(fitContent, 120);
    }
    pendingImgs.forEach(function (img) {
      if (img.complete) return;
      img.addEventListener('load', scheduleRefit);
      img.addEventListener('error', scheduleRefit);
    });

    /* deep link or start */
    var start = 0;
    var hash = (location.hash || '').replace('#', '');
    if (hash) {
      var idx = sceneIndexById(hash) >= 0 ? sceneIndexById(hash) : parseInt(hash.replace(/^s/, ''), 10) - 1;
      if (!isNaN(idx) && idx >= 0 && idx < scenes.length) start = idx;
    }

    P.goTo(start, false);
    window.addEventListener('resize', onResize);

    /* first paint: show overview, then fly into the start scene */
    A.Camera.flyToOverview(false);
    if (hash === 'overview') {
      updateChrome(scenes[start], start);
      setTimeout(function () {
        started = true;
        A.Camera.flyToOverview(true);
      }, 120);
    } else {
      setTimeout(function () {
        started = true;
        P.goTo(start, true);
      }, 260);
    }
  };

  /* fit text inside every card by tuning the --fit custom property.
     Measurement must happen at 1:1 world scale — the live camera transform
     would otherwise make every rect sub-pixel and the fit test unreliable. */
  function fitContent() {
    var world = els.world;
    var prevVis = world.style.visibility;
    var prevTier = world.getAttribute('data-zoom');
    var prevTransform = world.style.transform;
    var prevTransition = world.style.transition;

    world.style.visibility = 'hidden';
    world.style.transition = 'none';
    world.style.transform = 'none';
    world.setAttribute('data-zoom', 'near');

    scenes.forEach(function (sc) {
      var el = q('#scene-' + sc.id);
      if (!el) return;
      var inner = el.querySelector('.scene-inner');
      var body = el.querySelector('.scene-body');
      var foot = el.querySelector('.scene-foot');
      if (!inner || !body) return;

      inner.style.setProperty('--fit', '1');
      var fit = 1;
      var guard = 0;

      function overflow() {
        var limit = (foot ? foot.getBoundingClientRect().top : el.getBoundingClientRect().bottom) - 4;
        var worst = 0;
        Array.prototype.forEach.call(body.children, function (child) {
          var r = child.getBoundingClientRect();
          if (r.height > 0 && r.bottom > limit) worst = Math.max(worst, r.bottom - limit);
        });
        return worst;
      }

      while (overflow() > 1 && guard < 22) {
        fit -= 0.03;
        if (fit < 0.54) {
          fit = 0.54;
          el.classList.add('is-dense');
          inner.style.setProperty('--fit', '0.54');
          break;
        }
        inner.style.setProperty('--fit', fit.toFixed(2));
        guard++;
      }
      el.setAttribute('data-fit', fit.toFixed(2));

      if (A._fitDebugWanted && ['i01', 'f02', 'c01'].indexOf(sc.id) >= 0) {
        A._fitDebug = A._fitDebug || {};
        var fr = foot ? foot.getBoundingClientRect() : el.getBoundingClientRect();
        A._fitDebug[sc.id] = {
          fit: fit.toFixed(2),
          bodyH: Math.round(body.getBoundingClientRect().height),
          footTop: Math.round(fr.top),
          cardTop: Math.round(el.getBoundingClientRect().top),
          cardBottom: Math.round(el.getBoundingClientRect().bottom),
          children: Array.prototype.map.call(body.children, function (c) {
            var r = c.getBoundingClientRect();
            return (c.className || c.tagName) + ' h=' + Math.round(r.height) + ' b=' + Math.round(r.bottom);
          })
        };
      }
    });

    world.setAttribute('data-zoom', prevTier || 'far');
    world.style.transform = prevTransform;
    world.style.transition = prevTransition;
    world.style.visibility = prevVis || '';
  }

  /* ---------------------------------------------------------- navigation */
  P.goTo = function (index, animate) {
    if (!scenes.length) return;
    var i = Math.max(0, Math.min(scenes.length - 1, index));
    current = i;
    var sc = scenes[i];

    /* active styling */
    var prev = q('.scene.is-active');
    if (prev) prev.classList.remove('is-active');
    var el = q('#scene-' + sc.id);
    if (el) el.classList.add('is-active');

    A.Camera.flyToScene(sc.id, animate !== false);
    updateChrome(sc, i);
    if (notesOpen) renderNotes(sc);

    if (history.replaceState) {
      history.replaceState(null, '', '#' + sc.id);
    } else {
      location.hash = sc.id;
    }
    return sc;
  };

  P.next = function () {
    P.goTo(current + 1, true);
  };
  P.prev = function () {
    P.goTo(current - 1, true);
  };
  P.overview = function () {
    A.Camera.flyToOverview(true);
    toast('نمای کلی — روی هر موضوع کلیک کنید');
  };
  P.section = function (id) {
    A.Camera.flyToSection(id, true);
    var first = scenes.findIndex(function (s) {
      return s.sec === id;
    });
    if (first >= 0) {
      var sc = scenes[first];
      var el = q('#scene-' + sc.id);
      var prev = q('.scene.is-active');
      if (prev) prev.classList.remove('is-active');
      if (el) el.classList.add('is-active');
      current = first;
      updateChrome(sc, first);
      if (notesOpen) renderNotes(sc);
      history.replaceState(null, '', '#' + sc.id);
    }
    toast('بخش: ' + A.section(id).title);
  };
  P.jump = function (i) {
    closeOverlays();
    P.goTo(i, true);
  };

  function updateChrome(sc, i) {
    var sec = A.section(sc.sec);
    var bar = q('#progress-bar');
    if (bar) bar.style.width = ((i + 1) / scenes.length) * 100 + '%';
    var secEl = q('#progress-sec');
    if (secEl) secEl.textContent = sec.index + ' · ' + sec.title;
    var cnt = q('#progress-cnt');
    if (cnt) cnt.textContent = pad2(i + 1) + ' / ' + pad2(scenes.length);
    var nav = q('#nav-counter');
    if (nav) nav.textContent = pad2(i + 1) + ' / ' + pad2(scenes.length);

    var active = q('.toc-item.is-current');
    if (active) active.classList.remove('is-current');
    var item = q('.toc-item[data-id="' + sc.id + '"]');
    if (item) item.classList.add('is-current');

    var cur = q('.map-scene.is-current');
    if (cur) cur.classList.remove('is-current');
    var node = q('.map-scene[data-id="' + sc.id + '"]');
    if (node) node.classList.add('is-current');

    document.body.setAttribute('data-accent', sec.accent);
    if (notesOpen) renderNotes(sc);
    A.current = { scene: sc, index: i };
  }

  function onCamera(state, vpWorld) {
    var vpEl = q('#map-vp');
    if (vpEl) {
      vpEl.setAttribute('x', vpWorld.x);
      vpEl.setAttribute('y', vpWorld.y);
      vpEl.setAttribute('width', vpWorld.w);
      vpEl.setAttribute('height', vpWorld.h);
    }
    var world = els.world;
    if (world) world.setAttribute('data-scale', state.s.toFixed(3));
  }

  function onResize() {
    A.Camera.resize();
  }

  /* --------------------------------------------------------------- notes */
  function renderNotes(sc) {
    var sec = A.section(sc.sec);
    var t = q('#notes-title');
    var s = q('#notes-sec');
    var time = q('#notes-time');
    var text = q('#notes-text');
    var engage = q('#notes-engage');
    var src = q('#notes-src');
    if (t) t.textContent = sc.title;
    if (s) s.textContent = sec.index + ' · ' + sec.title + ' — ' + sc.en;
    if (time) time.textContent = '~' + (sc.minutes || 2) + ' min';
    if (text) text.textContent = sc.note || 'یادداشتی برای این موضوع ثبت نشده است.';
    if (engage) {
      engage.innerHTML = sc.engage
        ? '<div class="note-q"><b>پرسش تعاملی:</b> ' + esc(sc.engage.q) + '<br><br><b>پاسخ پیشنهادی:</b> ' + esc(sc.engage.a) + '</div>'
        : '';
    }
    if (src) {
      src.innerHTML = (sc.srcs || [])
        .map(function (k) {
          var so = A.sources[k];
          if (!so) return '';
          return so.url
            ? '<a href="' + esc(so.url) + '" target="_blank" rel="noopener">' + esc(so.short || so.label) + '</a>'
            : '<span>' + esc(so.short || so.label) + '</span>';
        })
        .join('');
    }
  }

  P.toggleNotes = function () {
    notesOpen = !notesOpen;
    els.notes.classList.toggle('is-open', notesOpen);
    document.body.classList.toggle('is-notes', notesOpen);
    var btn = q('[data-act="notes"]');
    if (btn) btn.classList.toggle('is-on', notesOpen);
    if (notesOpen) renderNotes(scenes[current]);
  };

  P.toggleTOC = function (force) {
    tocOpen = force === undefined ? !tocOpen : !!force;
    els.toc.classList.toggle('is-open', tocOpen);
    var btn = q('[data-act="toc"]');
    if (btn) btn.classList.toggle('is-on', tocOpen);
  };

  function toggleHelp(force) {
    helpOpen = force === undefined ? !helpOpen : !!force;
    els.help.classList.toggle('is-open', helpOpen);
  }

  function closeOverlays() {
    if (tocOpen) P.toggleTOC(false);
    if (helpOpen) toggleHelp(false);
  }

  P.toggleFullscreen = function () {
    var d = document;
    if (!d.fullscreenElement) {
      var el = d.documentElement;
      var r = el.requestFullscreen && el.requestFullscreen();
      if (r && r.catch) r.catch(function () {});
      document.body.classList.add('is-presenting');
    } else {
      if (d.exitFullscreen) d.exitFullscreen();
      document.body.classList.remove('is-presenting');
    }
  };

  /* ---------------------------------------------------------------- toast */
  var toastTimer = null;
  function toast(msg) {
    var el = q('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-open');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove('is-open');
    }, 1900);
  }
  P.toast = toast;

  /* ------------------------------------------------------------ bindings */
  function bindUI() {
    document.addEventListener('click', function (e) {
      var actEl = e.target.closest('[data-act]');
      if (actEl) {
        var act = actEl.getAttribute('data-act');
        switch (act) {
          case 'next': P.next(); break;
          case 'prev': P.prev(); break;
          case 'overview': P.overview(); break;
          case 'toc': P.toggleTOC(); break;
          case 'toc-close': P.toggleTOC(false); break;
          case 'notes': P.toggleNotes(); break;
          case 'notes-close': P.toggleNotes(); break;
          case 'help': toggleHelp(); break;
          case 'fullscreen': P.toggleFullscreen(); break;
          case 'zoom-in': A.Camera.zoomBy(1.35, true); break;
          case 'zoom-out': A.Camera.zoomBy(1 / 1.35, true); break;
          case 'goto': P.jump(parseInt(actEl.getAttribute('data-i'), 10)); break;
          case 'section': P.toggleTOC(false); P.section(actEl.getAttribute('data-sec')); break;
          case 'quiz-reset': resetQuiz(); break;
        }
        return;
      }

      /* engage toggle */
      var engageBtn = e.target.closest('.engage > button');
      if (engageBtn) {
        var box = engageBtn.parentElement;
        var open = box.classList.toggle('is-open');
        engageBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        return;
      }

      /* quiz answer */
      var opt = e.target.closest('.quiz-opt');
      if (opt) {
        var item = opt.closest('.quiz-item');
        if (!item || item.classList.contains('is-answered')) return;
        var correct = parseInt(item.getAttribute('data-correct'), 10);
        var chosen = parseInt(opt.getAttribute('data-k'), 10);
        item.classList.add('is-answered');
        Array.prototype.forEach.call(item.querySelectorAll('.quiz-opt'), function (b, k) {
          if (k === correct) b.classList.add('is-correct');
          else if (k === chosen) b.classList.add('is-wrong');
          b.disabled = true;
        });
        updateQuizScore();
        return;
      }

      /* click on a scene while zoomed out -> fly into it */
      var sceneEl = e.target.closest('.scene');
      if (sceneEl) {
        var id = sceneEl.getAttribute('data-id');
        var idx = sceneIndexById(id);
        if (idx >= 0 && (A.Camera.state.s < 0.6 || idx !== current)) {
          P.goTo(idx, true);
        }
        return;
      }

      /* minimap click -> centre there */
      if (e.target.closest('#hud-map')) {
        var svg = q('#hud-map svg');
        if (!svg) return;
        var rect = svg.getBoundingClientRect();
        var vb = svg.viewBox.baseVal;
        var fx = (e.clientX - rect.left) / rect.width;
        var fy = (e.clientY - rect.top) / rect.height;
        var wx = vb.x + fx * vb.width;
        var wy = vb.y + fy * vb.height;
        A.Camera.centreOn(wx, wy, A.Camera.state.s, true);
      }
    });

    document.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', function () {
      if (!document.fullscreenElement) document.body.classList.remove('is-presenting');
    });
    if (els.stage) {
      els.stage.addEventListener('dblclick', function (e) {
        if (e.target.closest('.scene')) return;
        A.Camera.zoomBy(1.5, true);
      });
    }
  }

  function updateQuizScore() {
    var items = document.querySelectorAll('.quiz-item');
    var score = 0;
    Array.prototype.forEach.call(items, function (it) {
      if (!it.classList.contains('is-answered')) return;
      var correct = parseInt(it.getAttribute('data-correct'), 10);
      var picked = it.querySelector('.quiz-opt.is-correct');
      var wrong = it.querySelector('.quiz-opt.is-wrong');
      if (picked && !wrong) score++;
    });
    var el = q('#quiz-score');
    if (el) el.textContent = score;
    var total = q('#quiz-total');
    if (total) total.textContent = items.length;
  }

  function resetQuiz() {
    Array.prototype.forEach.call(document.querySelectorAll('.quiz-item'), function (it) {
      it.classList.remove('is-answered');
      Array.prototype.forEach.call(it.querySelectorAll('.quiz-opt'), function (b) {
        b.classList.remove('is-correct', 'is-wrong');
        b.disabled = false;
      });
    });
    updateQuizScore();
    toast('آزمون از نو آغاز شد');
  }

  function onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    var key = e.key;
    switch (key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
      case ' ':
      case 'Spacebar':
        e.preventDefault();
        P.next();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        P.prev();
        break;
      case 'Home':
        e.preventDefault();
        P.overview();
        break;
      case 'Escape':
        if (helpOpen) toggleHelp(false);
        else if (tocOpen) P.toggleTOC(false);
        else if (notesOpen) P.toggleNotes();
        else if (document.fullscreenElement) P.toggleFullscreen();
        else P.overview();
        break;
      case '+':
      case '=':
        e.preventDefault();
        A.Camera.zoomBy(1.3, true);
        break;
      case '-':
      case '_':
        e.preventDefault();
        A.Camera.zoomBy(1 / 1.3, true);
        break;
      case 'f':
      case 'F':
        P.toggleFullscreen();
        break;
      case 'n':
      case 'N':
        P.toggleNotes();
        break;
      case 't':
      case 'T':
        P.toggleTOC();
        break;
      case 'm':
      case 'M':
        els.map.classList.toggle('hidden');
        break;
      case 'q':
      case 'Q':
        jumpToKind('quiz');
        break;
      case '?':
      case 'h':
      case 'H':
        toggleHelp();
        break;
      default:
        if (/^[1-7]$/.test(key)) {
          var sec = A.sections[parseInt(key, 10) - 1];
          if (sec) P.section(sec.id);
        }
    }
  }

  function jumpToKind(kind) {
    var idx = scenes.findIndex(function (s) {
      return s.kind === kind;
    });
    if (idx >= 0) P.jump(idx);
  }

  /* -------------------------------------------------------------- expose */
  P.state = function () {
    return {
      current: current,
      scene: scenes[current],
      scenes: scenes.length,
      camera: A.Camera.state,
      tier: A.Camera.zoomTier,
      images: document.querySelectorAll('.figure img').length,
      diagrams: document.querySelectorAll('.diagram svg').length
    };
  };

  P.selftest = function () {
    var report = { ok: true, problems: [], info: {} };
    var problems = report.problems;

    /* 1. counts */
    report.info.scenes = document.querySelectorAll('.scene').length;
    report.info.zones = document.querySelectorAll('.zone').length;
    report.info.expectedScenes = A.scenes.length;
    if (report.info.scenes !== A.scenes.length) problems.push('scene count mismatch');

    /* 2. every scene has a title + body */
    A.scenes.forEach(function (s) {
      var el = document.getElementById('scene-' + s.id);
      if (!el) problems.push('missing scene ' + s.id);
      else {
        if (!el.querySelector('.scene-title, .cover-title')) problems.push('missing title ' + s.id);
        if (!el.querySelector('.scene-body')) problems.push('missing body ' + s.id);
      }
    });

    /* 3. diagrams referenced by content all exist */
    A.scenes.forEach(function (s) {
      if (s.visual && s.visual.type === 'svg' && !A.diagrams.has(s.visual.key)) {
        problems.push('missing diagram ' + s.visual.key + ' (' + s.id + ')');
      }
    });

    /* 4. source keys resolve */
    A.scenes.forEach(function (s) {
      (s.srcs || []).forEach(function (k) {
        if (!A.sources[k]) problems.push('unknown source ' + k + ' in ' + s.id);
      });
    });

    /* 4b. every teaching scene must carry a presenter note, a timing hint and
           at least one traceable source (documentation requirement) */
    var missingMeta = [];
    A.scenes.forEach(function (s) {
      var lacks = [];
      if (!s.note || !String(s.note).trim()) lacks.push('note');
      if (!s.minutes) lacks.push('minutes');
      /* the references scene renders the whole registry, so it carries no list */
      if (s.kind !== 'refs' && (!s.srcs || !s.srcs.length)) lacks.push('sources');
      if (s.kind !== 'quiz' && s.kind !== 'end' && (!s.visual || !s.visual.type)) lacks.push('visual');
      if (lacks.length) missingMeta.push(s.id + '(' + lacks.join(',') + ')');
    });
    report.info.missingMeta = missingMeta;
    if (missingMeta.length) problems.push('scenes missing meta: ' + missingMeta.join(' '));

    /* 5. TOC items */
    report.info.tocItems = document.querySelectorAll('.toc-item').length;
    if (report.info.tocItems !== A.scenes.length) problems.push('toc item count mismatch');

    /* 5b. report cards that had to shrink a lot (content density signal) */
    var tight = [];
    document.querySelectorAll('.scene').forEach(function (el) {
      var f = parseFloat(el.getAttribute('data-fit') || '1');
      if (f < 0.86) tight.push(el.getAttribute('data-id') + ':' + f.toFixed(2));
    });
    report.info.tightCards = tight;
    if (A._fitDebug) report.info.fitDebug = A._fitDebug;

    /* 6. quiz wiring */
    report.info.quizItems = document.querySelectorAll('.quiz-item').length;
    if (report.info.quizItems !== (A.stats.quiz || []).length) problems.push('quiz count mismatch');

    /* 7. camera transform sanity at a known state */
    var home = { index: current };
    A.Camera.centreOn(0, 0, 0.5, false);
    var m = new DOMMatrixReadOnly(getComputedStyle(els.world).transform);
    var vp = A.Camera.viewport();
    if (Math.abs(m.a - 0.5) > 1e-3) problems.push('camera scale not applied');
    if (Math.abs(m.e - vp.w / 2) > 2) problems.push('camera translate x wrong');

    /* 8. navigation by keyboard + buttons */
    P.goTo(0, false);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    if (current !== 1) problems.push('ArrowRight did not advance (current=' + current + ')');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    if (current !== 0) problems.push('ArrowLeft did not go back (current=' + current + ')');
    q('[data-act="next"]').click();
    if (current !== 1) problems.push('next button did not advance');
    q('[data-act="prev"]').click();
    if (current !== 0) problems.push('prev button did not go back');

    /* 9. overview mode sets the far/micro tier and hides card bodies */
    A.Camera.flyToOverview(false);
    report.info.overviewScale = Number(A.Camera.state.s.toFixed(4));
    if (A.Camera.zoomTier !== 'micro' && A.Camera.zoomTier !== 'far') {
      problems.push('overview tier not far/micro: ' + A.Camera.zoomTier);
    }
    var miniVisible = getComputedStyle(q('#scene-i01 .scene-mini')).display !== 'none';
    if (!miniVisible) problems.push('overview mode does not show mini cards');

    /* 10. zoom controls */
    var s0 = A.Camera.state.s;
    A.Camera.zoomBy(1.3, false);
    if (!(A.Camera.state.s > s0)) problems.push('zoom in had no effect');
    A.Camera.zoomBy(1 / 1.3, false);
    if (Math.abs(A.Camera.state.s - s0) > 1e-6) problems.push('zoom out did not restore scale');

    /* 11. TOC + notes + help toggles */
    P.toggleTOC(true);
    if (!els.toc.classList.contains('is-open')) problems.push('TOC did not open');
    P.toggleTOC(false);
    if (els.toc.classList.contains('is-open')) problems.push('TOC did not close');
    P.toggleNotes();
    if (!els.notes.classList.contains('is-open')) problems.push('notes did not open');
    if (!q('#notes-text').textContent.trim()) problems.push('notes text empty');
    P.toggleNotes();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }));
    if (!els.help.classList.contains('is-open')) problems.push('help did not open');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    if (els.help.classList.contains('is-open')) problems.push('help did not close on Escape');

    /* 12. quiz interaction */
    var quizIdx = scenes.findIndex(function (s) {
      return s.kind === 'quiz';
    });
    if (quizIdx >= 0) {
      P.goTo(quizIdx, false);
      var item = q('.quiz-item');
      var correctBtn = item && item.querySelector('.quiz-opt[data-k="' + item.getAttribute('data-correct') + '"]');
      if (!correctBtn) problems.push('quiz correct option not found');
      else {
        correctBtn.click();
        var scoreEl = q('#quiz-score');
        if (!scoreEl || scoreEl.textContent.trim() !== '1') {
          problems.push('quiz scoring failed (' + (scoreEl && scoreEl.textContent) + ')');
        }
        if (!item.classList.contains('is-answered')) problems.push('quiz item not marked answered');
      }
    }

    /* 13. click-to-fly from overview */
    A.Camera.flyToOverview(false);
    var target = q('#scene-f07');
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    if (current !== sceneIndexById('f07')) problems.push('click-to-fly failed');

    /* 14. references scene renders all sources */
    var refIdx = scenes.findIndex(function (s) {
      return s.kind === 'refs';
    });
    if (refIdx >= 0) {
      P.goTo(refIdx, false);
      report.info.refLinks = document.querySelectorAll('#scene-w03 .ref-list a').length;
      if (report.info.refLinks < 10) problems.push('references scene looks empty');
    }

    /* restore a predictable state */
    P.goTo(home.index || 0, false);
    A.Camera.flyToOverview(false);

    /* 15. images load */
    var srcs = [];
    document.querySelectorAll('.figure img').forEach(function (img) {
      if (srcs.indexOf(img.getAttribute('src')) === -1) srcs.push(img.getAttribute('src'));
    });
    report.info.images = srcs.length;

    return new Promise(function (resolve) {
      var pending = srcs.length;
      var failed = [];
      if (!pending) {
        finish();
        return;
      }
      srcs.forEach(function (src) {
        var im = new Image();
        im.onload = function () {
          done();
        };
        im.onerror = function () {
          failed.push(src);
          done();
        };
        im.src = src;
      });
      function done() {
        pending--;
        if (pending === 0) finish();
      }
      function finish() {
        report.info.checkedImages = srcs.length;
        if (failed.length) {
          report.info.failedImages = failed;
          problems.push('images failed to load: ' + failed.join(', '));
        }
        report.ok = problems.length === 0;
        resolve(report);
      }
    });
  };

  A.Presentation = P;
})();
