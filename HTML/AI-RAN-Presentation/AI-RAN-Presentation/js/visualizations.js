/* ==========================================================================
   AI-RAN Presentation — visualizations.js
   Inline, dependency-free SVG diagrams used inside scene cards.
   Every diagram is a pure function returning an <svg> string; colours follow
   the deck palette so diagrams read as part of the same visual language.

   Labels are intentionally short and mostly Latin (technical terminology);
   Persian captions are rendered with direction:rtl where needed.
   ========================================================================== */
(function () {
  'use strict';

  var A = (window.AIRAN = window.AIRAN || {});

  /* ------------------------------------------------------------- palette */
  var C = {
    ink: '#e9eefb',
    dim: '#a8b8d6',
    mute: '#6d80a3',
    line: 'rgba(150,184,240,0.34)',
    lineSoft: 'rgba(150,184,240,0.18)',
    box: '#12243f',
    box2: '#0c1729',
    box3: '#162c4d',
    blue: '#4f8cff',
    blueSoft: '#9dc0ff',
    teal: '#2dd4bf',
    tealSoft: '#86f2e4',
    purple: '#a855f7',
    purpleSoft: '#d3aaff',
    amber: '#fbbf24',
    rose: '#fb7185',
    green: '#4ade80'
  };

  var FONT = "Vazirmatn, 'Segoe UI', Tahoma, sans-serif";

  /* ------------------------------------------------------------- helpers */
  function attrs(o) {
    var out = '';
    for (var k in o) {
      if (o[k] === undefined || o[k] === null) continue;
      out += ' ' + k + '="' + String(o[k]).replace(/"/g, '&quot;') + '"';
    }
    return out;
  }

  function rect(x, y, w, h, o) {
    o = o || {};
    return (
      '<rect' +
      attrs({
        x: x,
        y: y,
        width: w,
        height: h,
        rx: o.rx === undefined ? 12 : o.rx,
        fill: o.fill || C.box,
        stroke: o.stroke || C.line,
        'stroke-width': o.sw || 1.5,
        'stroke-dasharray': o.dash,
        opacity: o.opacity
      }) +
      '/>'
    );
  }

  function txt(x, y, s, o) {
    o = o || {};
    /* For RTL labels the caller thinks in visual terms ("end" = right edge),
       while SVG anchors follow the inline direction — so flip them. */
    var anchor = o.anchor || 'middle';
    if (o.rtl && anchor === 'end') anchor = 'start';
    else if (o.rtl && anchor === 'start') anchor = 'end';
    return (
      '<text' +
      attrs({
        x: x,
        y: y,
        fill: o.fill || C.ink,
        'font-size': o.size || 15,
        'font-weight': o.weight || 400,
        'font-family': FONT,
        'text-anchor': anchor,
        'dominant-baseline': o.baseline || 'middle',
        'letter-spacing': o.ls,
        direction: o.rtl ? 'rtl' : 'ltr',
        style: o.rtl ? 'unicode-bidi:isolate' : undefined,
        opacity: o.opacity
      }) +
      '>' +
      String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;') +
      '</text>'
    );
  }

  function line(x1, y1, x2, y2, o) {
    o = o || {};
    return (
      '<line' +
      attrs({
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        stroke: o.stroke || C.line,
        'stroke-width': o.sw || 2,
        'stroke-dasharray': o.dash,
        'stroke-linecap': 'round',
        opacity: o.opacity
      }) +
      '/>'
    );
  }

  /** straight arrow with a triangular head */
  function arrow(x1, y1, x2, y2, o) {
    o = o || {};
    var col = o.stroke || C.line;
    var sw = o.sw || 2.2;
    var ang = Math.atan2(y2 - y1, x2 - x1);
    var head = o.head || 9;
    var bx = x2 - Math.cos(ang) * head;
    var by = y2 - Math.sin(ang) * head;
    var w = head * 0.52;
    var px = Math.cos(ang + Math.PI / 2) * w;
    var py = Math.sin(ang + Math.PI / 2) * w;
    return (
      '<g>' +
      line(x1, y1, bx, by, { stroke: col, sw: sw, dash: o.dash }) +
      '<polygon' +
      attrs({
        points:
          x2 + ',' + y2 + ' ' + (bx + px) + ',' + (by + py) + ' ' + (bx - px) + ',' + (by - py),
        fill: col,
        opacity: o.opacity
      }) +
      '/>' +
      '</g>'
    );
  }

  /** curved connector */
  function curve(x1, y1, x2, y2, bow, o) {
    o = o || {};
    var mx = (x1 + x2) / 2;
    var my = (y1 + y2) / 2;
    var nx = -(y2 - y1);
    var ny = x2 - x1;
    var len = Math.sqrt(nx * nx + ny * ny) || 1;
    var cx = mx + (nx / len) * (bow || 0);
    var cy = my + (ny / len) * (bow || 0);
    var col = o.stroke || C.line;
    return (
      '<path' +
      attrs({
        d: 'M' + x1 + ',' + y1 + ' Q' + cx + ',' + cy + ' ' + x2 + ',' + y2,
        fill: 'none',
        stroke: col,
        'stroke-width': o.sw || 2,
        'stroke-dasharray': o.dash,
        'stroke-linecap': 'round',
        'marker-end': o.marker || undefined
      }) +
      '/>'
    );
  }

  function circle(cx, cy, r, o) {
    o = o || {};
    return (
      '<circle' +
      attrs({
        cx: cx,
        cy: cy,
        r: r,
        fill: o.fill || 'none',
        stroke: o.stroke || C.line,
        'stroke-width': o.sw || 2,
        'stroke-dasharray': o.dash,
        opacity: o.opacity
      }) +
      '/>'
    );
  }

  function chip(x, y, w, s, o) {
    o = o || {};
    var h = o.h || 26;
    return (
      rect(x, y, w, h, { rx: h / 2, fill: o.fill || 'rgba(150,184,240,0.10)', stroke: o.stroke || C.lineSoft }) +
      txt(x + w / 2, y + h / 2 + 0.5, s, { size: o.size || 12, fill: o.color || C.dim, weight: o.weight || 500 })
    );
  }

  /* ======================================================================
     Diagrams
     ====================================================================== */

  /* ---------------------------------------------------------- timeline --- */
  function timeline() {
    var stages = [
      { t: 'D-RAN', s: 'RU + BBU', d: 'سخت‌افزار اختصاصی' },
      { t: 'C-RAN', s: 'Centralized', d: 'تجمیع پردازش' },
      { t: 'vRAN', s: 'Cloud-native', d: 'نرم‌افزاری شدن' },
      { t: 'Open RAN', s: 'RIC + Interfaces', d: 'رابط باز و برنامه‌پذیری' },
      { t: 'AI-RAN', s: 'AI-native', d: 'هوشمندی یکپارچه' }
    ];
    var w = 940, y = 150, step = 176, x0 = 78;
    var out = '<svg viewBox="0 0 ' + w + ' 300" role="img" aria-label="RAN evolution timeline">';
    out += line(x0 - 10, y, x0 + step * 4 + 24, y, { stroke: C.lineSoft, sw: 3 });
    out += arrow(x0 + step * 3 + 40, y, x0 + step * 4 + 30, y, { stroke: C.blue, sw: 3 });

    stages.forEach(function (st, i) {
      var cx = x0 + i * step;
      var isLast = i === stages.length - 1;
      var col = isLast ? C.purple : i >= 3 ? C.teal : C.blue;
      out += circle(cx, y, 12, { fill: C.box2, stroke: col, sw: 2.5 });
      out += circle(cx, y, 5, { fill: col, stroke: col });
      out += txt(cx, y - 40, st.t, { size: 17, weight: 700, fill: isLast ? C.purpleSoft : C.ink });
      out += txt(cx, y + 36, st.s, { size: 12, fill: col });
      out += txt(cx, y + 58, st.d, { size: 12, fill: C.mute, rtl: true });
    });

    out += rect(20, 240, 900, 42, { rx: 10, fill: 'rgba(168,85,247,0.08)', stroke: 'rgba(168,85,247,0.28)' });
    out += txt(470, 261, 'AI-RAN: از «بهینه‌سازی شبکه» به «شبکه به‌عنوان زیرساخت محاسباتی»', {
      size: 14,
      fill: C.purpleSoft,
      rtl: true
    });
    return out + '</svg>';
  }

  /* ------------------------------------------------------ threeBranches --- */
  function threeBranches() {
    var out = '<svg viewBox="0 0 900 520" role="img" aria-label="Three AI-RAN branches">';
    var cx = 450, cy = 262;

    /* hub */
    out += circle(cx, cy, 96, { fill: 'rgba(79,140,255,0.10)', stroke: 'rgba(120,165,235,0.5)', sw: 2 });
    out += circle(cx, cy, 74, { fill: '#0e1e38', stroke: 'rgba(120,165,235,0.6)', sw: 1.4 });
    out += txt(cx, cy - 12, 'AI-RAN', { size: 26, weight: 700 });
    out += txt(cx, cy + 18, 'مرکز', { size: 13, fill: C.dim, rtl: true });

    var nodes = [
      { x: 172, y: 118, col: C.blue, soft: C.blueSoft, t: 'AI for RAN', q: 'چگونه شبکه بهتر شود؟', d: 'Optimize · Predict · Automate' },
      { x: 728, y: 118, col: C.teal, soft: C.tealSoft, t: 'AI in RAN', q: 'AI کجای پردازش قرار گیرد؟', d: 'PHY · MAC · RAN stack' },
      { x: 450, y: 432, col: C.purple, soft: C.purpleSoft, t: 'AI on RAN', q: 'شبکه چه سرویسی می‌دهد؟', d: 'Edge AI · Services · Revenue' }
    ];

    nodes.forEach(function (n) {
      out += line(cx, cy, n.x, n.y, { stroke: 'rgba(150,184,240,0.22)', sw: 2 });
      out += rect(n.x - 132, n.y - 48, 264, 96, { rx: 18, fill: n.col === C.blue ? 'rgba(79,140,255,0.10)' : n.col === C.teal ? 'rgba(45,212,191,0.10)' : 'rgba(168,85,247,0.10)', stroke: n.col, sw: 1.6 });
      out += txt(n.x, n.y - 22, n.t, { size: 18, weight: 700, fill: n.soft });
      out += txt(n.x, n.y + 4, n.d, { size: 11.5, fill: C.dim });
      out += txt(n.x, n.y + 26, n.q, { size: 12, fill: C.mute, rtl: true });
    });

    out += txt(cx, 500, 'سه پرسش متفاوت — نه سه سطح از یک چیز', { size: 13, fill: C.mute, rtl: true });
    return out + '</svg>';
  }

  /* --------------------------------------------------------- closedLoop --- */
  function closedLoop() {
    var out = '<svg viewBox="0 0 820 520" role="img" aria-label="Closed loop optimization">';
    var cx = 410, cy = 258, r = 150;
    var nodes = [
      { a: -90, t: 'Data', s: 'KPI · Telemetry', col: C.blue },
      { a: -18, t: 'Model', s: 'Predict · Classify', col: C.blueSoft },
      { a: 54, t: 'Decision', s: 'Policy · Params', col: C.teal },
      { a: 126, t: 'Actuation', s: 'RIC · SON · OSS', col: C.tealSoft },
      { a: 198, t: 'Feedback', s: 'Measure impact', col: C.amber }
    ];
    nodes.forEach(function (n, i) {
      var ang = (n.a * Math.PI) / 180;
      var x = cx + Math.cos(ang) * r;
      var y = cy + Math.sin(ang) * r;
      var nxt = nodes[(i + 1) % nodes.length];
      var ang2 = (nxt.a * Math.PI) / 180;
      var x2 = cx + Math.cos(ang2) * r;
      var y2 = cy + Math.sin(ang2) * r;
      out += curve(x, y, x2, y2, -34, { stroke: 'rgba(150,184,240,0.3)', sw: 2 });
      out += rect(x - 74, y - 34, 148, 68, { rx: 14, fill: C.box, stroke: n.col, sw: 1.4 });
      out += txt(x, y - 10, n.t, { size: 15, weight: 600, fill: n.col });
      out += txt(x, y + 12, n.s, { size: 10.5, fill: C.mute });
    });
    out += circle(cx, cy, 62, { fill: 'rgba(79,140,255,0.08)', stroke: C.lineSoft, dash: '5 6' });
    out += txt(cx, cy - 8, 'Closed', { size: 16, weight: 700, fill: C.ink });
    out += txt(cx, cy + 14, 'Loop', { size: 16, weight: 700, fill: C.ink });
    out += txt(cx, cy + 42, 'حلقهٔ بسته', { size: 11, fill: C.mute, rtl: true });
    return out + '</svg>';
  }

  /* ----------------------------------------------------- trafficForecast --- */
  function trafficForecast() {
    var out = '<svg viewBox="0 0 820 460" role="img" aria-label="Traffic forecast">';
    var x0 = 70, y0 = 380, w = 690, h = 290;
    out += line(x0, y0, x0 + w, y0, { stroke: C.line, sw: 1.4 });
    out += line(x0, y0, x0, y0 - h, { stroke: C.line, sw: 1.4 });
    out += txt(x0 - 12, y0 - h, 'load', { size: 11, fill: C.mute, anchor: 'end' });
    out += txt(x0 + w, y0 + 22, 'time', { size: 11, fill: C.mute, anchor: 'end' });
    out += txt(x0 - 12, y0, '0', { size: 10, fill: C.mute, anchor: 'end' });

    /* grid */
    for (var i = 1; i <= 4; i++) {
      var gy = y0 - (h / 4) * i;
      out += line(x0, gy, x0 + w, gy, { stroke: 'rgba(150,184,240,0.08)', sw: 1 });
    }

    /* history (solid) */
    var hist = [0.12, 0.2, 0.42, 0.5, 0.38, 0.55, 0.78, 0.9, 0.72, 0.6, 0.48];
    var hw = w * 0.62;
    var pts = hist.map(function (v, k) {
      var x = x0 + (hw / (hist.length - 1)) * k;
      var y = y0 - v * h;
      return x + ',' + y;
    }).join(' ');
    out += '<polyline points="' + pts + '" fill="none" stroke="' + C.blue + '" stroke-width="2.6" stroke-linejoin="round"/>';

    /* forecast (dashed) */
    var fc = [0.48, 0.44, 0.58, 0.86, 0.98];
    var fx0 = x0 + hw;
    var fpts = fc.map(function (v, k) {
      var x = fx0 + ((w - hw) / (fc.length - 1)) * k;
      var y = y0 - v * h;
      return x + ',' + y;
    }).join(' ');
    out += '<polyline points="' + fpts + '" fill="none" stroke="' + C.purple + '" stroke-width="2.6" stroke-dasharray="7 6" stroke-linejoin="round"/>';

    /* peak marker */
    out += line(x0 + w - 14, y0 - h, x0 + w - 14, y0, { stroke: 'rgba(251,191,36,0.5)', sw: 1.4, dash: '4 5' });
    out += txt(x0 + w - 22, y0 - h - 12, 'peak', { size: 11, fill: C.amber, anchor: 'end' });

    /* action window band */
    out += rect(fx0 - 6, y0 - h, w - hw + 12, h, { rx: 8, fill: 'rgba(168,85,247,0.07)', stroke: 'rgba(168,85,247,0.22)', dash: '5 5' });
    out += txt(fx0 + (w - hw) / 2, y0 - h + 18, 'پیش‌بینی + پنجرهٔ اقدام', { size: 12, fill: C.purpleSoft, rtl: true });

    /* legend */
    out += line(x0 + 10, 56, x0 + 46, 56, { stroke: C.blue, sw: 2.6 });
    out += txt(x0 + 54, 56, 'اندازه‌گیری', { size: 12, fill: C.dim, anchor: 'start', rtl: true });
    out += line(x0 + 168, 56, x0 + 204, 56, { stroke: C.purple, sw: 2.6, dash: '7 6' });
    out += txt(x0 + 212, 56, 'پیش‌بینی مدل', { size: 12, fill: C.dim, anchor: 'start', rtl: true });
    out += txt(x0 + w, 56, 'شماتیک آموزشی — بدون دادهٔ واقعی', { size: 11, fill: C.mute, anchor: 'end', rtl: true });
    return out + '</svg>';
  }

  /* ------------------------------------------------------------ scheduler --- */
  function scheduler() {
    var out = '<svg viewBox="0 0 820 460" role="img" aria-label="Scheduling as multi-objective decision">';
    /* resource grid */
    var gx = 430, gy = 70, cw = 26, ch = 30, cols = 12, rows = 7;
    out += txt(gx + (cw * cols) / 2, gy - 26, 'PRB × Slot', { size: 12, fill: C.mute });
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var fill = 'rgba(150,184,240,0.06)';
        if (r < 3 && c < 5) fill = 'rgba(79,140,255,0.55)';
        else if (r >= 4 && c >= 6) fill = 'rgba(45,212,191,0.45)';
        out += rect(gx + c * cw + 1, gy + r * ch + 1, cw - 2, ch - 2, { rx: 3, fill: fill, stroke: 'none' });
      }
    }
    out += rect(gx + 0 * cw, gy + 0 * ch, cw * 5, ch * 3, { rx: 7, fill: 'none', stroke: C.blue, sw: 1.6 });
    out += rect(gx + 6 * cw, gy + 4 * ch, cw * 6, ch * 3, { rx: 7, fill: 'none', stroke: C.teal, sw: 1.6 });
    out += txt(gx + 46, gy - 6, 'UE-1', { size: 11, fill: C.blueSoft, anchor: 'start' });
    out += txt(gx + 100, gy + ch * 7 + 16, 'UE-2', { size: 11, fill: C.tealSoft, anchor: 'end' });

    /* users */
    out += rect(64, 96, 210, 96, { rx: 14, fill: 'rgba(79,140,255,0.10)', stroke: C.blue, sw: 1.4 });
    out += txt(169, 120, 'UE-1', { size: 15, weight: 700, fill: C.blueSoft });
    out += txt(169, 144, 'SINR 25 dB · CQI 14', { size: 11, fill: C.dim });
    out += txt(169, 166, 'Best Effort', { size: 11, fill: C.mute });

    out += rect(64, 218, 210, 96, { rx: 14, fill: 'rgba(45,212,191,0.10)', stroke: C.teal, sw: 1.4 });
    out += txt(169, 242, 'UE-2', { size: 15, weight: 700, fill: C.tealSoft });
    out += txt(169, 266, 'SINR 8 dB · CQI 5', { size: 11, fill: C.dim });
    out += txt(169, 288, 'Low Latency · High priority', { size: 11, fill: C.mute });

    out += arrow(280, 150, 420, 150, { stroke: C.line });
    out += arrow(280, 270, 420, 270, { stroke: C.line });

    /* objective box */
    out += rect(64, 344, 420, 92, { rx: 14, fill: C.box2, stroke: 'rgba(251,191,36,0.35)' });
    out += txt(274, 368, 'Multi-objective decision', { size: 14, weight: 600, fill: C.amber });
    out += txt(274, 392, 'Throughput · Fairness · Latency · BLER · Energy', { size: 11, fill: C.dim });
    out += txt(274, 414, 'انتخاب «بهترین کانال» ≠ بهترین تصمیم', { size: 12, fill: C.mute, rtl: true });

    out += rect(516, 344, 240, 92, { rx: 14, fill: 'rgba(79,140,255,0.08)', stroke: C.lineSoft });
    out += txt(636, 372, 'AI / DRL Agent', { size: 14, weight: 600, fill: C.ink });
    out += txt(636, 396, 'state → action → reward', { size: 11, fill: C.dim });
    out += arrow(636, 340, 636, 300, { stroke: C.blueSoft });
    out += txt(636, 288, 'تنظیم تخصیص', { size: 11, fill: C.blueSoft, rtl: true });
    return out + '</svg>';
  }

  /* -------------------------------------------------------------- anomaly --- */
  function anomaly() {
    var out = '<svg viewBox="0 0 820 420" role="img" aria-label="Anomaly detection flow">';
    var xs = 60, ys = 300, w = 360, h = 220;
    var series = [0.5, 0.52, 0.48, 0.55, 0.53, 0.58, 0.6, 0.57, 0.62, 0.9, 0.68, 0.6];
    var pts = series.map(function (v, i) {
      return xs + (w / (series.length - 1)) * i + ',' + (ys - v * h);
    }).join(' ');
    out += line(xs, ys, xs + w, ys, { stroke: C.line });
    out += line(xs, ys, xs, ys - h, { stroke: C.line });
    out += '<polyline points="' + pts + '" fill="none" stroke="' + C.teal + '" stroke-width="2.4" stroke-linejoin="round"/>';
    var ax = xs + (w / (series.length - 1)) * 9;
    out += circle(ax, ys - 0.9 * h, 22, { fill: 'rgba(251,191,36,0.14)', stroke: C.amber, sw: 1.4, dash: '3 4' });
    out += circle(ax, ys - 0.9 * h, 5, { fill: C.amber, stroke: C.amber });
    out += txt(xs + 6, ys + 22, 'KPI / telemetry', { size: 11, fill: C.mute, anchor: 'start' });

    var cols = [
      { x: 470, y: 52, t: '1 · Detect', d: 'انحراف از الگوی نرمال', col: C.amber },
      { x: 470, y: 150, t: '2 · Diagnose', d: 'ریشه‌یابی و تعارض xApp', col: C.blueSoft },
      { x: 470, y: 248, t: '3 · Act', d: 'هشدار یا اقدام اصلاحی', col: C.teal },
      { x: 470, y: 346, t: '4 · Learn', d: 'بازخورد و بازآموزی', col: C.purpleSoft }
    ];
    cols.forEach(function (c, i) {
      out += rect(c.x, c.y - 30, 300, 66, { rx: 13, fill: C.box, stroke: c.col, sw: 1.3 });
      out += txt(c.x + 150, c.y - 8, c.t, { size: 15, weight: 600, fill: c.col });
      out += txt(c.x + 150, c.y + 16, c.d, { size: 12, fill: C.dim, rtl: true });
      if (i < cols.length - 1) out += arrow(c.x + 150, c.y + 36, c.x + 150, c.y + 50, { stroke: C.line });
    });
    out += arrow(xs + w, ys - 0.9 * h, 462, 74, { stroke: C.amber, dash: '5 5' });
    out += txt(415, 396, 'معیار موفقیت: نسبت هشدار مفید به هشدار کاذب — نه حساسیت صرف', { size: 12, fill: C.mute, rtl: true });
    return out + '</svg>';
  }

  /* ------------------------------------------------------------------- rl --- */
  function rl() {
    var out = '<svg viewBox="0 0 820 460" role="img" aria-label="Reinforcement learning loop">';
    out += rect(56, 120, 220, 150, { rx: 16, fill: 'rgba(79,140,255,0.10)', stroke: C.blue, sw: 1.5 });
    out += txt(166, 152, 'Agent', { size: 18, weight: 700, fill: C.blueSoft });
    out += txt(166, 180, 'سیاست تصمیم', { size: 12, fill: C.dim, rtl: true });
    out += txt(166, 206, 'Policy π', { size: 12, fill: C.mute });
    out += txt(166, 240, 'Neural Network', { size: 11, fill: C.mute });

    out += rect(544, 120, 220, 150, { rx: 16, fill: 'rgba(45,212,191,0.10)', stroke: C.teal, sw: 1.5 });
    out += txt(654, 152, 'Environment', { size: 18, weight: 700, fill: C.tealSoft });
    out += txt(654, 180, 'شبکهٔ رادیویی', { size: 12, fill: C.dim, rtl: true });
    out += txt(654, 206, 'RAN / Digital Twin', { size: 12, fill: C.mute });
    out += txt(654, 240, 'state, reward', { size: 11, fill: C.mute });

    out += arrow(280, 168, 540, 168, { stroke: C.blueSoft, sw: 2.4 });
    out += txt(410, 150, 'action', { size: 13, fill: C.blueSoft });
    out += txt(410, 190, 'توان · پرتو · تخصیص', { size: 12, fill: C.mute, rtl: true });

    out += arrow(540, 232, 280, 232, { stroke: C.tealSoft, sw: 2.4 });
    out += txt(410, 214, 'state + reward', { size: 13, fill: C.tealSoft });
    out += txt(410, 254, 'KPI و بازخورد', { size: 12, fill: C.mute, rtl: true });

    out += rect(56, 322, 708, 106, { rx: 14, fill: C.box2, stroke: 'rgba(251,191,36,0.3)' });
    out += txt(410, 350, 'Reward design = طراحی سیاست', { size: 15, weight: 600, fill: C.amber });
    out += txt(410, 378, 'Reward = α·Throughput − β·Latency − γ·PacketLoss − δ·Energy', { size: 12, fill: C.dim });
    out += txt(410, 404, 'مثال مفهومی برای آموزش — نه فرمول استاندارد 3GPP', { size: 11, fill: C.mute, rtl: true });
    return out + '</svg>';
  }

  /* ------------------------------------------------------------- forVsIn --- */
  function forVsIn() {
    var out = '<svg viewBox="0 0 900 470" role="img" aria-label="AI for RAN versus AI in RAN placement">';
    /* left panel */
    out += rect(28, 40, 400, 390, { rx: 18, fill: 'rgba(79,140,255,0.05)', stroke: 'rgba(79,140,255,0.35)' });
    out += txt(228, 68, 'AI for RAN', { size: 19, weight: 700, fill: C.blueSoft });
    out += txt(228, 92, 'مدل بیرون از RAN', { size: 12, fill: C.mute, rtl: true });

    out += rect(74, 120, 150, 84, { rx: 12, fill: C.box, stroke: C.blue, sw: 1.3 });
    out += txt(149, 148, 'AI / ML', { size: 15, weight: 600, fill: C.blueSoft });
    out += txt(149, 176, 'Model', { size: 11, fill: C.mute });

    out += rect(74, 250, 310, 150, { rx: 14, fill: C.box2, stroke: C.line });
    out += txt(229, 278, 'RAN functions', { size: 15, weight: 600, fill: C.ink });
    out += txt(229, 304, 'RU · DU · CU', { size: 12, fill: C.dim });
    out += txt(229, 334, 'الگوریتم کلاسیک اجرا می‌شود', { size: 12, fill: C.mute, rtl: true });
    out += rect(96, 352, 266, 30, { rx: 8, fill: 'rgba(79,140,255,0.12)', stroke: 'none' });
    out += txt(229, 367, 'KPI / Telemetry / CSI', { size: 11, fill: C.blueSoft });

    out += arrow(149, 206, 149, 246, { stroke: C.blueSoft });
    out += txt(214, 226, 'KPI + params', { size: 10.5, fill: C.dim });
    out += arrow(330, 250, 330, 210, { stroke: C.tealSoft, dash: '4 4' });
    out += txt(378, 232, 'policy', { size: 10.5, fill: C.tealSoft, anchor: 'start' });

    /* right panel */
    out += rect(472, 40, 400, 390, { rx: 18, fill: 'rgba(45,212,191,0.05)', stroke: 'rgba(45,212,191,0.35)' });
    out += txt(672, 68, 'AI in RAN', { size: 19, weight: 700, fill: C.tealSoft });
    out += txt(672, 92, 'مدل درون RAN', { size: 12, fill: C.mute, rtl: true });

    var layers = ['CU (RRC / PDCP)', 'DU (RLC / MAC)', 'L1 PHY'];
    layers.forEach(function (l, i) {
      var y = 120 + i * 66;
      out += rect(512, y, 320, 52, { rx: 10, fill: C.box2, stroke: C.line });
      out += txt(672, y + 26, l, { size: 13, fill: C.dim });
    });
    out += rect(536, 200, 272, 34, { rx: 9, fill: 'rgba(45,212,191,0.22)', stroke: C.teal, sw: 1.2 });
    out += txt(672, 217, 'NN: scheduling / link adaptation', { size: 11, fill: C.tealSoft });
    out += rect(536, 266, 272, 34, { rx: 9, fill: 'rgba(45,212,191,0.18)', stroke: C.teal, sw: 1.2 });
    out += txt(672, 283, 'NN: channel estimation', { size: 11, fill: C.tealSoft });

    out += rect(512, 330, 320, 66, { rx: 12, fill: C.box, stroke: 'rgba(45,212,191,0.4)' });
    out += txt(672, 354, 'budget: µs – ms', { size: 13, weight: 600, fill: C.amber });
    out += txt(672, 378, 'قطعیت زمانی > دقت مدل', { size: 12, fill: C.mute, rtl: true });

    out += txt(450, 458, 'مرز اصلی: محل اجرای مدل، نه نوع مدل', { size: 13, fill: C.dim, rtl: true });
    return out + '</svg>';
  }

  /* ---------------------------------------------------------------- stack --- */
  function stack() {
    var out = '<svg viewBox="0 0 820 570" role="img" aria-label="RAN protocol stack with AI entry points">';
    var rows = [
      { t: 'RRC', s: 'Connection · Mobility · Config', ai: 'Policy & parameter tuning', col: C.blueSoft, budget: '۱۰۰ ms – s' },
      { t: 'PDCP', s: 'Ciphering · Duplication · Reordering', ai: 'Limited / rule-based', col: C.blueSoft, budget: 'ms' },
      { t: 'RLC', s: 'ARQ · Segmentation', ai: 'Limited / research', col: C.tealSoft, budget: 'ms' },
      { t: 'MAC', s: 'Scheduling · Link adaptation · HARQ', ai: 'AI-native scheduler', col: C.teal, budget: '1 slot' },
      { t: 'PHY', s: 'Channel est. · Detecting · Precoding', ai: 'Neural receiver / CSI', col: C.blue, budget: 'µs – ms' }
    ];
    var x = 70, w = 470;
    rows.forEach(function (r, i) {
      var y = 44 + i * 96;
      out += rect(x, y, w, 78, { rx: 12, fill: i >= 3 ? 'rgba(45,212,191,0.07)' : 'rgba(79,140,255,0.06)', stroke: r.col, sw: 1.3 });
      out += txt(x + w - 18, y + 26, r.t, { size: 17, weight: 700, fill: r.col, anchor: 'end' });
      out += txt(x + w - 18, y + 52, r.s, { size: 11, fill: C.dim, anchor: 'end' });
      out += txt(x + 16, y + 26, r.budget, { size: 11, fill: C.mute, anchor: 'start' });
      out += arrow(x + w + 8, y + 39, x + w + 92, y + 39, { stroke: 'rgba(150,184,240,0.28)' });
      out += rect(x + w + 100, y + 14, 240, 50, { rx: 10, fill: C.box2, stroke: C.lineSoft });
      out += txt(x + w + 220, y + 39, r.ai, { size: 11.5, fill: C.dim });
    });
    out += txt(x + w / 2, 540, 'AI entry point per layer', { size: 12, fill: C.mute });
    out += txt(x + w + 220, 540, 'نوع مشروع استفاده از AI', { size: 12, fill: C.mute, rtl: true });
    out += txt(26, 24, 'Layer', { size: 11, fill: C.mute, anchor: 'start' });
    return out + '</svg>';
  }

  /* ---------------------------------------------------------- channelEst --- */
  function channelEst() {
    var out = '<svg viewBox="0 0 820 430" role="img" aria-label="Classic versus neural channel estimation">';
    /* classic */
    out += txt(60, 44, 'Classic', { size: 15, weight: 700, fill: C.dim, anchor: 'start' });
    var y1 = 78;
    out += rect(60, y1, 150, 62, { rx: 10, fill: C.box, stroke: C.line });
    out += txt(135, y1 + 24, 'Reference', { size: 12, fill: C.dim });
    out += txt(135, y1 + 44, 'signal (DMRS)', { size: 11, fill: C.mute });
    out += arrow(214, y1 + 31, 268, y1 + 31, { stroke: C.line });
    out += rect(272, y1, 200, 62, { rx: 10, fill: C.box, stroke: C.blueSoft, sw: 1.4 });
    out += txt(372, y1 + 24, 'LS / MMSE', { size: 13, weight: 600, fill: C.blueSoft });
    out += txt(372, y1 + 44, 'assumption-based', { size: 11, fill: C.mute });
    out += arrow(476, y1 + 31, 530, y1 + 31, { stroke: C.line });
    out += rect(534, y1, 226, 62, { rx: 10, fill: 'rgba(79,140,255,0.10)', stroke: C.blue, sw: 1.4 });
    out += txt(647, y1 + 24, 'Channel estimate', { size: 13, weight: 600, fill: C.blueSoft });
    out += txt(647, y1 + 44, '→ equalizer', { size: 11, fill: C.mute });

    /* neural */
    out += txt(60, 196, 'Neural', { size: 15, weight: 700, fill: C.tealSoft, anchor: 'start' });
    var y2 = 230;
    out += rect(60, y2, 150, 62, { rx: 10, fill: C.box, stroke: C.line });
    out += txt(135, y2 + 24, 'Received', { size: 12, fill: C.dim });
    out += txt(135, y2 + 44, 'signal (grid)', { size: 11, fill: C.mute });
    out += arrow(214, y2 + 31, 268, y2 + 31, { stroke: C.line });
    out += rect(272, y2 - 8, 200, 78, { rx: 12, fill: 'rgba(45,212,191,0.14)', stroke: C.teal, sw: 1.8 });
    out += txt(372, y2 + 16, 'Neural network', { size: 13, weight: 700, fill: C.tealSoft });
    out += txt(372, y2 + 40, 'trained on data', { size: 11, fill: C.dim });
    out += txt(372, y2 + 58, 'CNN / Transformer', { size: 10.5, fill: C.mute });
    out += arrow(476, y2 + 31, 530, y2 + 31, { stroke: C.line });
    out += rect(534, y2, 226, 62, { rx: 10, fill: 'rgba(45,212,191,0.10)', stroke: C.teal, sw: 1.4 });
    out += txt(647, y2 + 24, 'Better estimate?', { size: 13, weight: 600, fill: C.tealSoft });
    out += txt(647, y2 + 44, 'low SNR / high mobility', { size: 11, fill: C.mute });

    out += rect(60, 340, 700, 62, { rx: 12, fill: C.box2, stroke: 'rgba(251,191,36,0.3)' });
    out += txt(410, 362, 'Trade-off', { size: 13, weight: 600, fill: C.amber });
    out += txt(410, 386, 'دقت بالاتر در شرایط سخت ← هزینهٔ محاسباتی بیشتر + نیاز به دادهٔ آموزش و اعتبارسنجی میدانی', { size: 11.5, fill: C.dim, rtl: true });
    return out + '</svg>';
  }

  /* ------------------------------------------------------------ neuralRx --- */
  function neuralRx() {
    var out = '<svg viewBox="0 0 900 400" role="img" aria-label="Classic receiver versus neural receiver">';
    var classic = ['Sync', 'Ch. Est.', 'Equalize', 'Demap', 'Decode'];
    var x = 44, y = 74, w = 132, h = 54, gap = 22;
    out += txt(44, 44, 'Classic receiver', { size: 14, weight: 700, fill: C.dim, anchor: 'start' });
    classic.forEach(function (c, i) {
      var bx = x + i * (w + gap);
      out += rect(bx, y, w, h, { rx: 10, fill: C.box, stroke: C.line });
      out += txt(bx + w / 2, y + h / 2, c, { size: 12, fill: C.dim });
      if (i < classic.length - 1) out += arrow(bx + w + 2, y + h / 2, bx + w + gap - 2, y + h / 2, { stroke: C.line, head: 6 });
    });
    out += txt(44, 152, 'hand-designed blocks, block-by-block optimisation', { size: 11, fill: C.mute, anchor: 'start' });

    var y2 = 210;
    out += txt(44, 190, 'Neural receiver', { size: 14, weight: 700, fill: C.tealSoft, anchor: 'start' });
    out += rect(x, y2, w, h, { rx: 10, fill: C.box, stroke: C.line });
    out += txt(x + w / 2, y2 + h / 2, 'Sync', { size: 12, fill: C.dim });
    out += arrow(x + w + 2, y2 + h / 2, x + w + gap + 20, y2 + h / 2, { stroke: C.line, head: 6 });

    var bx2 = x + w + gap + 24;
    out += rect(bx2, y2 - 12, 420, h + 24, { rx: 14, fill: 'rgba(45,212,191,0.13)', stroke: C.teal, sw: 1.8 });
    out += txt(bx2 + 210, y2 + 6, 'Neural network  →  LLR', { size: 14, weight: 700, fill: C.tealSoft });
    out += txt(bx2 + 210, y2 + 30, 'channel estimation + equalisation + demapping jointly learned', { size: 11, fill: C.dim });

    out += arrow(bx2 + 424, y2 + h / 2, bx2 + 476, y2 + h / 2, { stroke: C.line, head: 6 });
    out += rect(bx2 + 480, y2, 132, h, { rx: 10, fill: C.box, stroke: C.line });
    out += txt(bx2 + 546, y2 + h / 2, 'Decode', { size: 12, fill: C.dim });

    out += txt(44, 336, 'سطح بلوغ: نمونهٔ پژوهشی و آزمایشگاهی — نه قابلیت تجاری سراسری', { size: 12, fill: C.amber, anchor: 'start', rtl: true });
    out += txt(44, 362, 'الزام: اجرای بلادرنگ روی GPU + اعتبارسنجی Over-the-Air', { size: 12, fill: C.mute, anchor: 'start', rtl: true });
    return out + '</svg>';
  }

  /* ------------------------------------------------------------------ ric --- */
  function ric() {
    var out = '<svg viewBox="0 0 860 620" role="img" aria-label="O-RAN RIC architecture">';
    /* SMO */
    out += rect(40, 40, 780, 132, { rx: 16, fill: 'rgba(79,140,255,0.06)', stroke: 'rgba(79,140,255,0.35)' });
    out += txt(430, 62, 'SMO  ·  Service Management & Orchestration', { size: 14, weight: 600, fill: C.dim });
    out += rect(64, 84, 340, 68, { rx: 12, fill: C.box, stroke: C.blue, sw: 1.4 });
    out += txt(234, 108, 'Non-RT RIC', { size: 15, weight: 700, fill: C.blueSoft });
    out += txt(234, 132, 'analysis · training · policy   ( > 1 s )', { size: 11, fill: C.mute });
    out += rect(424, 84, 200, 68, { rx: 12, fill: 'rgba(79,140,255,0.12)', stroke: C.line });
    out += txt(524, 108, 'rApp', { size: 14, weight: 600, fill: C.blueSoft });
    out += txt(524, 132, 'non-real-time', { size: 11, fill: C.mute });
    out += rect(644, 84, 152, 68, { rx: 12, fill: 'rgba(150,184,240,0.06)', stroke: C.lineSoft });
    out += txt(720, 118, 'O1 / OAM', { size: 12, fill: C.dim });

    /* A1 */
    out += arrow(234, 176, 234, 246, { stroke: C.blueSoft, sw: 2.2 });
    out += chip(250, 196, 78, 'A1', { fill: 'rgba(79,140,255,0.18)', stroke: C.blue, color: C.blueSoft, size: 12, weight: 700 });

    /* Near-RT RIC */
    out += rect(40, 250, 780, 118, { rx: 16, fill: 'rgba(45,212,191,0.06)', stroke: 'rgba(45,212,191,0.38)' });
    out += rect(64, 274, 320, 70, { rx: 12, fill: C.box, stroke: C.teal, sw: 1.5 });
    out += txt(224, 298, 'Near-RT RIC', { size: 15, weight: 700, fill: C.tealSoft });
    out += txt(224, 322, 'control loop   ( 10 ms – 1 s )', { size: 11, fill: C.mute });
    out += rect(404, 274, 180, 70, { rx: 12, fill: 'rgba(45,212,191,0.14)', stroke: C.line });
    out += txt(494, 298, 'xApp', { size: 14, weight: 600, fill: C.tealSoft });
    out += txt(494, 322, 'near-real-time', { size: 11, fill: C.mute });
    out += rect(600, 274, 196, 70, { rx: 12, fill: 'rgba(150,184,240,0.06)', stroke: C.lineSoft });
    out += txt(698, 298, 'E2 Node / RAN', { size: 12, fill: C.dim });
    out += txt(698, 322, 'CU · DU · RU', { size: 11, fill: C.mute });

    /* E2 */
    out += arrow(218, 372, 218, 442, { stroke: C.tealSoft, sw: 2.2 });
    out += chip(234, 392, 78, 'E2', { fill: 'rgba(45,212,191,0.18)', stroke: C.teal, color: C.tealSoft, size: 12, weight: 700 });

    /* RAN */
    out += rect(40, 446, 780, 100, { rx: 16, fill: C.box2, stroke: C.line });
    out += txt(430, 468, 'RAN  —  real-time processing', { size: 13, fill: C.dim });
    var blocks = ['RU', 'DU (L1/L2)', 'CU (RRC/PDCP)'];
    blocks.forEach(function (b, i) {
      out += rect(72 + i * 246, 484, 218, 46, { rx: 10, fill: 'rgba(150,184,240,0.06)', stroke: C.lineSoft });
      out += txt(72 + i * 246 + 109, 507, b, { size: 12, fill: C.dim });
    });
    out += txt(430, 596, 'xApp و rApp برنامهٔ کنترلی/تحلیلی هستند — نه بلوک لایهٔ فیزیکی', { size: 12, fill: C.amber, rtl: true });
    return out + '</svg>';
  }

  /* ------------------------------------------------------------------ lab --- */
  function lab() {
    var out = '<svg viewBox="0 0 900 440" role="img" aria-label="Lab toolchain">';
    var items = [
      { x: 40, t: 'Sionna', s: 'RT · PHY · SYS', d: 'شبیه‌سازی و تولید داده', col: C.blueSoft, tag: 'simulate' },
      { x: 250, t: 'Digital Twin', s: 'AODT / Sionna', d: 'محیط شهری و کالیبراسیون', col: C.purpleSoft, tag: 'model env.' },
      { x: 460, t: 'OAI', s: 'gNB · Core', d: 'RAN اجرایی روی سرور', col: C.teal, tag: 'run RAN' },
      { x: 670, t: 'FlexRIC', s: 'Near-RT RIC', d: 'xApp development', col: C.amber, tag: 'control' }
    ];
    items.forEach(function (it, i) {
      out += rect(it.x, 90, 190, 170, { rx: 14, fill: 'rgba(150,184,240,0.05)', stroke: it.col, sw: 1.4 });
      out += chip(it.x + 20, 108, 96, it.tag, { fill: 'rgba(255,255,255,0.06)', stroke: C.lineSoft, color: C.mute, size: 10 });
      out += txt(it.x + 95, 168, it.t, { size: 17, weight: 700, fill: it.col });
      out += txt(it.x + 95, 196, it.s, { size: 12, fill: C.dim });
      out += txt(it.x + 95, 226, it.d, { size: 11, fill: C.mute, rtl: true });
      if (i < items.length - 1) out += arrow(it.x + 194, 175, it.x + 246, 175, { stroke: 'rgba(150,184,240,0.3)' });
    });
    out += rect(40, 300, 820, 54, { rx: 12, fill: 'rgba(79,140,255,0.08)', stroke: C.lineSoft });
    out += txt(450, 327, 'مدل AI  →  xApp  →  E2  →  RAN  →  KPI  →  بازخورد', { size: 13, fill: C.dim, rtl: true });
    out += txt(450, 386, 'این ترکیب، محیط اعتبارسنجی «AI for RAN» است؛ برای «AI in RAN» باید مدل به مسیر پردازش L1/L2 منتقل شود.', { size: 11.5, fill: C.mute, rtl: true });
    out += txt(450, 414, 'هیچ‌کدام از این ابزارها به‌تنهایی یک شبکهٔ تجاری نیستند.', { size: 11.5, fill: C.amber, rtl: true });
    return out + '</svg>';
  }

  /* ------------------------------------------------------------- edgeArch --- */
  function edgeArch() {
    var out = '<svg viewBox="0 0 880 540" role="img" aria-label="AI on RAN edge architecture with local breakout">';
    /* device */
    out += rect(30, 220, 132, 96, { rx: 12, fill: 'rgba(168,85,247,0.10)', stroke: C.purple, sw: 1.4 });
    out += txt(96, 250, 'Camera /', { size: 12, fill: C.purpleSoft });
    out += txt(96, 270, 'Robot / XR', { size: 12, fill: C.purpleSoft });
    out += txt(96, 296, 'UE', { size: 11, fill: C.mute });

    out += arrow(166, 268, 216, 268, { stroke: C.purpleSoft });
    out += txt(190, 250, 'UL', { size: 10.5, fill: C.purpleSoft });

    /* RAN */
    out += rect(220, 200, 150, 136, { rx: 12, fill: 'rgba(45,212,191,0.07)', stroke: C.teal, sw: 1.4 });
    out += txt(295, 226, 'RAN', { size: 14, weight: 700, fill: C.tealSoft });
    out += txt(295, 250, 'RU → DU → CU', { size: 11, fill: C.dim });
    out += txt(295, 278, 'slicing + QoS', { size: 11, fill: C.mute });
    out += txt(295, 302, 'Uplink scheduling', { size: 11, fill: C.mute });

    out += arrow(374, 268, 420, 268, { stroke: C.tealSoft });
    out += txt(397, 250, 'N3/N6', { size: 10.5, fill: C.tealSoft });

    /* UPF / dUPF */
    out += rect(424, 190, 148, 156, { rx: 12, fill: C.box, stroke: C.blue, sw: 1.5 });
    out += txt(498, 214, 'UPF', { size: 13, weight: 600, fill: C.blueSoft });
    out += txt(498, 238, 'dUPF', { size: 13, weight: 700, fill: C.amber });
    out += txt(498, 264, 'local breakout', { size: 11, fill: C.dim });
    out += txt(498, 290, 'traffic offload', { size: 11, fill: C.mute });
    out += txt(498, 318, 'privacy boundary', { size: 11, fill: C.mute });

    /* edge AI */
    out += rect(614, 160, 236, 216, { rx: 14, fill: 'rgba(168,85,247,0.09)', stroke: C.purple, sw: 1.5 });
    out += txt(732, 186, 'Edge AI host', { size: 14, weight: 700, fill: C.purpleSoft });
    out += txt(732, 212, 'GPU / AI accelerator', { size: 11, fill: C.dim });
    out += rect(636, 232, 192, 52, { rx: 10, fill: 'rgba(168,85,247,0.16)', stroke: C.lineSoft });
    out += txt(732, 258, 'Model inference', { size: 12, fill: C.purpleSoft });
    out += rect(636, 294, 192, 52, { rx: 10, fill: 'rgba(168,85,247,0.10)', stroke: C.lineSoft });
    out += txt(732, 320, 'Model (customer)', { size: 12, fill: C.dim });

    out += arrow(572, 268, 610, 268, { stroke: C.purpleSoft });

    /* return path */
    out += curve(732, 380, 96, 380, 30, { stroke: C.purpleSoft, dash: '6 6' });
    out += arrow(300, 380, 118, 380, { stroke: C.purpleSoft, dash: '6 6' });
    out += txt(430, 408, 'پاسخ / فرمان کنترل با تأخیر کران‌دار', { size: 12, fill: C.purpleSoft, rtl: true });

    /* cloud */
    out += rect(424, 40, 426, 96, { rx: 12, fill: 'rgba(150,184,240,0.05)', stroke: C.lineSoft, dash: '5 5' });
    out += txt(637, 66, 'Central cloud / DC', { size: 12, fill: C.dim });
    out += txt(637, 92, 'training · analytics · non-real-time AI', { size: 11, fill: C.mute });
    out += arrow(560, 190, 560, 140, { stroke: 'rgba(150,184,240,0.3)', dash: '4 5' });
    out += arrow(660, 140, 660, 190, { stroke: 'rgba(150,184,240,0.3)', dash: '4 5' });

    out += txt(440, 462, 'برنامه و مدل AI خارج از پشتهٔ RAN هستند؛ اتصال از طریق صفحهٔ کاربر و با تفکیک منطقی/امنیتی', { size: 11.5, fill: C.mute, rtl: true });
    out += txt(440, 492, 'Edge همیشه بهترین گزینه نیست: هزینه، توان و ظرفیت باید سنجیده شود', { size: 11.5, fill: C.amber, rtl: true });
    return out + '</svg>';
  }

  /* ---------------------------------------------------------------- aerial --- */
  function aerial() {
    var out = '<svg viewBox="0 0 860 560" role="img" aria-label="GPU accelerated RAN stack">';
    var layers = [
      { y: 420, t: 'Radio & Fronthaul', d: 'RU · antenna · PTP / SyncE · Ethernet', col: C.mute, fill: 'rgba(150,184,240,0.04)' },
      { y: 336, t: 'Accelerated compute', d: 'GPU · CPU · NIC · ARC (MGX)', col: C.blue, fill: 'rgba(79,140,255,0.07)' },
      { y: 252, t: 'cuPHY  ·  cuMAC  ·  cuBB', d: 'L1/L2 PHY & MAC processing on GPU', col: C.teal, fill: 'rgba(45,212,191,0.08)' },
      { y: 168, t: 'Aerial Framework', d: 'MLIR · TensorRT · CUDA Graphs · GPUDirect RDMA', col: C.tealSoft, fill: 'rgba(45,212,191,0.10)' },
      { y: 84, t: 'AI workloads', d: 'inference · training · vision · GenAI', col: C.purple, fill: 'rgba(168,85,247,0.10)' }
    ];
    layers.forEach(function (l) {
      out += rect(150, l.y, 560, 72, { rx: 12, fill: l.fill, stroke: l.col, sw: 1.4 });
      out += txt(430, l.y + 26, l.t, { size: 14, weight: 600, fill: l.col === C.mute ? C.dim : l.col });
      out += txt(430, l.y + 52, l.d, { size: 11, fill: C.mute });
    });
    [384, 300, 216, 132].forEach(function (y) {
      out += arrow(430, y, 430, y - 14, { stroke: 'rgba(150,184,240,0.3)', head: 6 });
    });

    /* side: design & validation */
    out += rect(736, 84, 106, 408, { rx: 12, fill: 'rgba(251,191,36,0.06)', stroke: 'rgba(251,191,36,0.3)', dash: '5 5' });
    out += txt(789, 118, 'Design', { size: 12, weight: 600, fill: C.amber });
    out += txt(789, 140, '& test', { size: 12, weight: 600, fill: C.amber });
    out += txt(789, 190, 'Sionna', { size: 11, fill: C.dim });
    out += txt(789, 216, 'RT/PHY', { size: 10.5, fill: C.mute });
    out += txt(789, 260, 'AODT', { size: 11, fill: C.dim });
    out += txt(789, 286, 'digital', { size: 10.5, fill: C.mute });
    out += txt(789, 310, 'twin', { size: 10.5, fill: C.mute });
    out += txt(789, 366, 'pyAerial', { size: 11, fill: C.dim });
    out += txt(789, 392, 'datasets', { size: 10.5, fill: C.mute });

    /* side: real-time constraint */
    out += rect(30, 168, 100, 324, { rx: 12, fill: 'rgba(251,191,36,0.05)', stroke: C.lineSoft });
    out += txt(80, 194, 'Real-time', { size: 11, fill: C.amber });
    out += txt(80, 218, 'µs – ms', { size: 10.5, fill: C.mute });
    out += txt(80, 262, 'determinism', { size: 10, fill: C.mute });
    out += txt(80, 286, 'synchronisation', { size: 10, fill: C.mute });
    out += txt(80, 310, 'GPU isolation', { size: 10, fill: C.mute });

    out += txt(430, 526, 'نمودار مفهومی بر پایهٔ مستندات NVIDIA Aerial — دیاگرام رسمی محصول نیست', { size: 11, fill: C.mute, rtl: true });
    return out + '</svg>';
  }

  /* --------------------------------------------------------------- stack3 --- */
  function stack3() {
    var out = '<svg viewBox="0 0 860 520" role="img" aria-label="Three branches in one architecture">';
    /* shared infra base */
    out += rect(80, 392, 700, 88, { rx: 14, fill: 'rgba(150,184,240,0.05)', stroke: C.line });
    out += txt(430, 418, 'Shared accelerated infrastructure', { size: 14, weight: 600, fill: C.dim });
    out += txt(430, 444, 'GPU · CPU · cloud-native platform · AI runtime · ARC', { size: 11, fill: C.mute });
    out += txt(430, 468, 'زیرساخت مشترک (AI-and-RAN)', { size: 11, fill: C.mute, rtl: true });

    /* RAN functions */
    out += rect(80, 258, 700, 112, { rx: 14, fill: 'rgba(45,212,191,0.08)', stroke: C.teal, sw: 1.4 });
    out += txt(430, 282, 'RAN functions — L1 / L2 / L3', { size: 14, weight: 600, fill: C.tealSoft });
    ['PHY', 'MAC', 'RLC', 'PDCP', 'RRC'].forEach(function (l, i) {
      out += rect(108 + i * 132, 302, 116, 48, { rx: 9, fill: 'rgba(45,212,191,0.10)', stroke: C.lineSoft });
      out += txt(166 + i * 132, 326, l, { size: 12, fill: C.tealSoft });
    });
    out += chip(300, 236, 260, 'AI in RAN — models inside the stack', { fill: 'rgba(45,212,191,0.16)', stroke: C.teal, color: C.tealSoft, size: 11, h: 26 });

    /* AI services */
    out += rect(80, 118, 700, 112, { rx: 14, fill: 'rgba(168,85,247,0.08)', stroke: C.purple, sw: 1.4 });
    out += txt(430, 142, 'AI applications & services', { size: 14, weight: 600, fill: C.purpleSoft });
    ['Vision AI', 'GenAI', 'Robotics', 'XR', 'Analytics'].forEach(function (l, i) {
      out += rect(108 + i * 132, 162, 116, 48, { rx: 9, fill: 'rgba(168,85,247,0.10)', stroke: C.lineSoft });
      out += txt(166 + i * 132, 186, l, { size: 11.5, fill: C.purpleSoft });
    });
    out += chip(300, 96, 260, 'AI on RAN — services on the network', { fill: 'rgba(168,85,247,0.16)', stroke: C.purple, color: C.purpleSoft, size: 11, h: 26 });

    /* control loop */
    out += curve(80, 200, 80, 360, -52, { stroke: C.blueSoft, sw: 2, dash: '6 6' });
    out += txt(40, 282, 'AI', { size: 12, fill: C.blueSoft });
    out += txt(40, 302, 'for', { size: 12, fill: C.blueSoft });
    out += txt(40, 322, 'RAN', { size: 12, fill: C.blueSoft });
    out += chip(20, 344, 120, 'predict → tune', { fill: 'rgba(79,140,255,0.12)', stroke: C.blue, color: C.blueSoft, size: 10, h: 22 });

    out += txt(430, 60, 'یک شبکه، سه لایهٔ استفاده از AI', { size: 13, fill: C.dim, rtl: true });
    return out + '</svg>';
  }

  /* ------------------------------------------------------------ scenario3 --- */
  function scenario3() {
    var out = '<svg viewBox="0 0 900 470" role="img" aria-label="One scenario, three AI-RAN layers">';
    /* shared cell */
    out += rect(360, 300, 180, 120, { rx: 14, fill: C.box, stroke: C.line });
    out += txt(450, 330, 'gNB / cell', { size: 13, weight: 600, fill: C.ink });
    out += txt(450, 356, 'RU · DU · CU', { size: 11, fill: C.dim });
    out += txt(450, 382, 'shared asset', { size: 10.5, fill: C.mute });
    out += circle(450, 470, 26, { fill: 'none', stroke: C.lineSoft });

    var cards = [
      { x: 40, y: 60, col: C.blue, t: 'AI for RAN', d: 'پیش‌بینی ازدحام + تعادل بار', k: 'KPI: drop / PRB' },
      { x: 350, y: 40, col: C.teal, t: 'AI in RAN', d: 'تخمین کانال + زمان‌بند', k: 'KPI: SE / BLER' },
      { x: 660, y: 60, col: C.purple, t: 'AI on RAN', d: 'استنتاج بینایی ماشین', k: 'SLA: latency' }
    ];
    cards.forEach(function (c) {
      out += rect(c.x, c.y, 200, 120, { rx: 14, fill: C.box2, stroke: c.col, sw: 1.4 });
      out += txt(c.x + 100, c.y + 30, c.t, { size: 14, weight: 700, fill: c.col });
      out += txt(c.x + 100, c.y + 60, c.d, { size: 11, fill: C.dim, rtl: true });
      out += chip(c.x + 22, c.y + 80, 156, c.k, { fill: 'rgba(255,255,255,0.05)', stroke: C.lineSoft, color: C.mute, size: 10, h: 22 });
      out += line(c.x + 100, c.y + 124, 450, 296, { stroke: 'rgba(150,184,240,0.2)', sw: 1.5, dash: '4 5' });
    });

    out += txt(450, 268, 'یک دارایی، سه لایهٔ ارزش', { size: 12.5, fill: C.dim, rtl: true });
    return out + '</svg>';
  }

  /* ------------------------------------------------------------- maturity --- */
  function maturity() {
    var out = '<svg viewBox="0 0 840 480" role="img" aria-label="Maturity ladder">';
    var bands = [
      {
        y: 48,
        col: C.teal,
        soft: C.tealSoft,
        t: 'Deployed / Commercial',
        d: 'RIC · xApp / rApp · AI link adaptation · energy automation',
        tag: 'قابل خرید، پشتیبانی‌شده، مستندات عملیاتی',
        lvl: 'level 3'
      },
      {
        y: 172,
        col: C.amber,
        soft: C.amber,
        t: 'Trial / Pilot',
        d: 'Neural channel estimation · real-time neural receiver · digital twin',
        tag: 'نتایج آزمایشگاهی یا شبکهٔ محدود، بدون SLA عمومی',
        lvl: 'level 2'
      },
      {
        y: 296,
        col: C.purple,
        soft: C.purpleSoft,
        t: 'Research',
        d: 'AI-native air interface · CSI compression · semantic comms · XL-MIMO',
        tag: 'مقاله و شبیه‌سازی، بدون قابلیت محصول',
        lvl: 'level 1'
      }
    ];
    bands.forEach(function (b) {
      out += rect(16, b.y, 762, 112, { rx: 14, fill: 'rgba(255,255,255,0.04)', stroke: b.col, sw: 1.6 });
      out += rect(16, b.y, 9, 112, { rx: 4, fill: b.col, stroke: 'none' });
      out += chip(40, b.y + 16, 96, b.lvl, { fill: 'rgba(255,255,255,0.05)', stroke: C.lineSoft, color: C.mute, size: 11, h: 24 });
      out += txt(754, b.y + 32, b.t, { size: 17, weight: 700, fill: b.soft, anchor: 'end' });
      out += txt(754, b.y + 60, b.d, { size: 12, fill: C.dim, anchor: 'end' });
      out += txt(754, b.y + 88, b.tag, { size: 12, fill: C.mute, anchor: 'end', rtl: true });
    });
    /* maturity axis */
    out += arrow(806, 424, 806, 48, { stroke: C.teal, sw: 2.4 });
    out += txt(420, 460, 'هر ادعای AI-RAN باید در یکی از این سه سطح جای گیرد', { size: 13, fill: C.mute, rtl: true });
    return out + '</svg>';
  }

  /* ------------------------------------------------------------- registry --- */
  var registry = {
    timeline: timeline,
    threeBranches: threeBranches,
    closedLoop: closedLoop,
    trafficForecast: trafficForecast,
    scheduler: scheduler,
    anomaly: anomaly,
    rl: rl,
    forVsIn: forVsIn,
    stack: stack,
    channelEst: channelEst,
    neuralRx: neuralRx,
    ric: ric,
    lab: lab,
    edgeArch: edgeArch,
    aerial: aerial,
    stack3: stack3,
    scenario3: scenario3,
    maturity: maturity
  };

  A.diagrams = {
    has: function (key) {
      return Object.prototype.hasOwnProperty.call(registry, key);
    },
    keys: function () {
      return Object.keys(registry);
    },
    render: function (key) {
      var fn = registry[key];
      if (!fn) {
        return (
          '<svg viewBox="0 0 400 200" role="img" aria-label="missing diagram">' +
          rect(0, 0, 400, 200, { fill: 'rgba(251,191,36,0.08)', stroke: C.amber }) +
          txt(200, 100, 'diagram not found: ' + key, { size: 13, fill: C.amber }) +
          '</svg>'
        );
      }
      /* Diagrams are authored at a reference width of ~820–940 user units and
         rendered inside a card column, so labels are nudged up to stay legible
         in a room-sized projection. */
      return fn().replace(/font-size="([0-9.]+)"/g, function (m, n) {
        return 'font-size="' + Math.round(parseFloat(n) * 1.2) + '"';
      });
    }
  };
})();
