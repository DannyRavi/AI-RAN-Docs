/* ==========================================================================
   AI-RAN Presentation — navigation.js
   Prezi-style camera: automatic knowledge-map layout, fly-to transitions,
   wheel zoom (to cursor), drag pan, pinch, minimap viewport and deep links.

   World coordinates are plain CSS pixels; the camera applies
       transform: translate(tx, ty) scale(s)
   with  tx = viewportW/2 - cx * s .
   ========================================================================== */
(function () {
  'use strict';

  var A = (window.AIRAN = window.AIRAN || {});

  var CFG = {
    card: { w: 1760, h: 1040 },
    gap: { x: 260, y: 260 },
    pad: 120,
    head: 380,
    minScale: 0.018,
    maxScale: 2.4,
    fitPad: 0.92,
    flyMs: 1150,
    ease: 'cubic-bezier(0.22,0.61,0.36,1)'
  };

  /* vertical anchor of every zone (top edge) */
  var ZONE_TOP = {
    intro: -4600,
    for: -1400,
    in: -1400,
    on: -1400,
    compare: 4380,
    eco: 6320,
    wrap: 8260
  };

  var ZONE_CX = {
    intro: 0,
    for: -6600,
    in: 0,
    on: 6600,
    compare: 0,
    eco: 0,
    wrap: 0
  };

  var Camera = {
    stage: null,
    world: null,
    scenes: [],
    zones: [],
    bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    state: { cx: 0, cy: 0, s: 1 },
    zoomTier: '',
    _animating: false,
    _animTimer: null,
    _onChange: null,

    /* ---------------------------------------------------------- geometry */
    layout: function (scenes, sections) {
      var cw = CFG.card.w;
      var ch = CFG.card.h;

      /* pass 1 — measure every section zone */
      var spec = sections.map(function (sec) {
        var list = scenes.filter(function (s) {
          return s.sec === sec.id;
        });
        var cols = Math.min(sec.cols || 3, list.length) || 1;
        var rows = Math.ceil(list.length / cols);
        return {
          sec: sec,
          list: list,
          cols: cols,
          rows: rows,
          width: cols * cw + (cols - 1) * CFG.gap.x + CFG.pad * 2,
          height: CFG.head + rows * ch + (rows - 1) * CFG.gap.y + CFG.pad,
          cx: ZONE_CX[sec.id] || 0,
          top: 0
        };
      });

      function byId(id) {
        for (var i = 0; i < spec.length; i++) if (spec[i].sec.id === id) return spec[i];
        return null;
      }

      /* pass 2 — pack vertically so zones can never overlap */
      var intro = byId('intro');
      var branches = ['for', 'in', 'on'].map(byId).filter(Boolean);
      var compare = byId('compare');
      var eco = byId('eco');
      var wrap = byId('wrap');

      if (intro) intro.top = ZONE_TOP.intro;
      var cursor = (intro ? intro.top + intro.height : ZONE_TOP.intro) + 360;

      var branchBottom = cursor;
      branches.forEach(function (b) {
        b.top = cursor;
        branchBottom = Math.max(branchBottom, b.top + b.height);
      });
      cursor = branchBottom + 520;

      [compare, eco, wrap].forEach(function (s) {
        if (!s) return;
        s.top = cursor;
        cursor = s.top + s.height + 500;
      });

      /* pass 3 — place cards */
      var out = [];
      spec.forEach(function (s) {
        var left = s.cx - s.width / 2;
        s.left = left;
        s.list.forEach(function (scene, i) {
          var row = Math.floor(i / s.cols);
          var col = i % s.cols;
          var inRow = Math.min(s.cols, s.list.length - row * s.cols);
          var rowW = inRow * cw + (inRow - 1) * CFG.gap.x;
          var rowLeft = left + (s.width - rowW) / 2;
          out.push({
            id: scene.id,
            sec: s.sec.id,
            x: rowLeft + col * (cw + CFG.gap.x),
            y: s.top + CFG.head + row * (ch + CFG.gap.y),
            w: cw,
            h: ch,
            cx: rowLeft + col * (cw + CFG.gap.x) + cw / 2,
            cy: s.top + CFG.head + row * (ch + CFG.gap.y) + ch / 2
          });
        });
      });

      var zones = spec.map(function (s) {
        return {
          id: s.sec.id,
          title: s.sec.title,
          en: s.sec.en,
          index: s.sec.index,
          accent: s.sec.accent,
          minutes: s.sec.minutes,
          left: s.left,
          top: s.top,
          width: s.width,
          height: s.height,
          cols: s.cols,
          rows: s.rows
        };
      });

      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      zones.forEach(function (z) {
        minX = Math.min(minX, z.left);
        minY = Math.min(minY, z.top - 40);
        maxX = Math.max(maxX, z.left + z.width);
        maxY = Math.max(maxY, z.top + z.height + 120);
      });

      this.scenes = out;
      this.zones = zones;
      this.bounds = { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
      return { scenes: out, zones: zones, bounds: this.bounds };
    },

    sceneById: function (id) {
      for (var i = 0; i < this.scenes.length; i++) {
        if (this.scenes[i].id === id) return this.scenes[i];
      }
      return null;
    },

    zoneById: function (id) {
      for (var i = 0; i < this.zones.length; i++) {
        if (this.zones[i].id === id) return this.zones[i];
      }
      return null;
    },

    viewport: function () {
      return { w: this.stage.clientWidth, h: this.stage.clientHeight };
    },

    /* ------------------------------------------------------------- camera */
    init: function (opts) {
      this.stage = opts.stage;
      this.world = opts.world;
      this._onChange = opts.onChange || function () {};
      this._bindEvents();
      this.centreOn(this.bounds.minX / 2 + this.bounds.maxX / 2, this.bounds.minY / 2 + this.bounds.maxY / 2, 0.06, false);
    },

    _apply: function (animate) {
      var vp = this.viewport();
      var s = this.state.s;
      var tx = vp.w / 2 - this.state.cx * s;
      var ty = vp.h / 2 - this.state.cy * s;
      this.world.style.transition = animate ? 'transform ' + CFG.flyMs + 'ms ' + CFG.ease : 'none';
      this.world.style.transform = 'translate3d(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px,0) scale(' + s.toFixed(5) + ')';
      this._syncTier();
      this._onChange(this.state, this.viewportWorld());
    },

    _syncTier: function () {
      var s = this.state.s;
      var tier = s < 0.14 ? 'micro' : s < 0.55 ? 'far' : 'near';
      if (tier !== this.zoomTier) {
        this.zoomTier = tier;
        this.world.setAttribute('data-zoom', tier);
      }
    },

    viewportWorld: function () {
      var vp = this.viewport();
      var s = this.state.s;
      return {
        x: this.state.cx - vp.w / (2 * s),
        y: this.state.cy - vp.h / (2 * s),
        w: vp.w / s,
        h: vp.h / s
      };
    },

    animateLock: function (lock) {
      this._animating = lock;
      if (this._animTimer) clearTimeout(this._animTimer);
      if (lock) {
        var self = this;
        this._animTimer = setTimeout(function () {
          self._animating = false;
        }, CFG.flyMs + 60);
      }
    },

    centreOn: function (cx, cy, s, animate) {
      this.state.cx = cx;
      this.state.cy = cy;
      this.state.s = Math.min(CFG.maxScale, Math.max(CFG.minScale, s));
      this.animateLock(!!animate);
      this._apply(!!animate);
    },

    /** fit a world-space rectangle into the viewport */
    fitRect: function (x, y, w, h, animate, pad) {
      var vp = this.viewport();
      var p = pad === undefined ? CFG.fitPad : pad;
      var s = Math.min((vp.w * p) / w, (vp.h * p) / h);
      s = Math.min(CFG.maxScale, Math.max(CFG.minScale, s));
      this.centreOn(x + w / 2, y + h / 2, s, animate);
    },

    flyToScene: function (id, animate) {
      var sc = this.sceneById(id);
      if (!sc) return;
      this.fitRect(sc.x, sc.y, sc.w, sc.h, animate !== false, 0.9);
    },

    flyToSection: function (id, animate) {
      var z = this.zoneById(id);
      if (!z) return;
      this.fitRect(z.left, z.top - 30, z.width, z.height + 60, animate !== false, 0.94);
    },

    flyToOverview: function (animate) {
      var b = this.bounds;
      this.fitRect(b.minX, b.minY, b.maxX - b.minX, b.maxY - b.minY, animate !== false, 0.96);
    },

    /** zoom while keeping a screen point (px, py) anchored */
    zoomAt: function (px, py, factor, animate) {
      var vp = this.viewport();
      var s0 = this.state.s;
      var s1 = Math.min(CFG.maxScale, Math.max(CFG.minScale, s0 * factor));
      if (s1 === s0) return;
      /* world point under cursor before/after */
      var wx = this.state.cx + (px - vp.w / 2) / s0;
      var wy = this.state.cy + (py - vp.h / 2) / s0;
      this.state.s = s1;
      this.state.cx = wx - (px - vp.w / 2) / s1;
      this.state.cy = wy - (py - vp.h / 2) / s1;
      this._apply(!!animate);
    },

    zoomBy: function (factor, animate) {
      var vp = this.viewport();
      this.zoomAt(vp.w / 2, vp.h / 2, factor, animate);
    },

    panBy: function (dxScreen, dyScreen) {
      this.state.cx -= dxScreen / this.state.s;
      this.state.cy -= dyScreen / this.state.s;
      this._apply(false);
    },

    resize: function () {
      /* keep the same world centre, re-apply transform */
      this._apply(false);
    },

    /* ------------------------------------------------------------- events */
    _bindEvents: function () {
      var self = this;
      var stage = this.stage;
      var drag = null;
      var pointers = {};
      var moved = 0;

      stage.addEventListener(
        'wheel',
        function (e) {
          if (e.ctrlKey && Math.abs(e.deltaY) > 0) {
            /* pinch-zoom gesture on trackpads arrives as ctrl+wheel */
          }
          e.preventDefault();
          var rect = stage.getBoundingClientRect();
          var factor = Math.exp(-e.deltaY * 0.0016);
          self.zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor, false);
        },
        { passive: false }
      );

      stage.addEventListener('pointerdown', function (e) {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
        var ids = Object.keys(pointers);
        if (ids.length === 1) {
          drag = { x: e.clientX, y: e.clientY };
          moved = 0;
          stage.classList.add('is-dragging');
          if (stage.setPointerCapture) {
            try { stage.setPointerCapture(e.pointerId); } catch (err) {}
          }
        }
      });

      stage.addEventListener('pointermove', function (e) {
        if (!pointers[e.pointerId]) return;
        var prev = pointers[e.pointerId];
        pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
        var ids = Object.keys(pointers);

        if (ids.length >= 2) {
          /* pinch */
          var p1 = pointers[ids[0]];
          var p2 = pointers[ids[1]];
          var dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          if (self._pinchDist) {
            var rect = stage.getBoundingClientRect();
            var midX = (p1.x + p2.x) / 2 - rect.left;
            var midY = (p1.y + p2.y) / 2 - rect.top;
            self.zoomAt(midX, midY, dist / self._pinchDist, false);
          }
          self._pinchDist = dist;
          return;
        }

        if (drag) {
          var dx = e.clientX - prev.x;
          var dy = e.clientY - prev.y;
          moved += Math.abs(dx) + Math.abs(dy);
          if (moved > 3) self.panBy(dx, dy);
          drag = { x: e.clientX, y: e.clientY };
        }
      });

      function endPointer(e) {
        var wasDrag = drag;
        delete pointers[e.pointerId];
        if (Object.keys(pointers).length < 2) self._pinchDist = null;
        if (Object.keys(pointers).length === 0) {
          drag = null;
          stage.classList.remove('is-dragging');
        }
        if (wasDrag && moved <= 4 && e.pointerType !== undefined) {
          /* a click, not a drag: let the app decide (handled by click listener) */
        }
      }

      stage.addEventListener('pointerup', endPointer);
      stage.addEventListener('pointercancel', endPointer);
      stage.addEventListener('pointerleave', function (e) {
        if (drag) endPointer(e);
      });
    }
  };

  A.Camera = Camera;
  A.CFG = CFG;
})();
