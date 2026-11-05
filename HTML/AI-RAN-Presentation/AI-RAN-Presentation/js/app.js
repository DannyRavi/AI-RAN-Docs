/* ==========================================================================
   AI-RAN Presentation — app.js
   Bootstrap, global error capture, first-run hints and the built-in QA
   self-test (open index.html?selftest=1 to run it).

   The self-test writes a JSON report into #selftest-output and into
   window.__SELFTEST__ so it can be read by an automated headless browser.
   ========================================================================== */
(function () {
  'use strict';

  var A = window.AIRAN;
  var errors = [];

  window.__ERRORS__ = errors;

  function recordError(kind, detail) {
    errors.push({ kind: kind, detail: String(detail) });
    var box = document.getElementById('selftest-output');
    if (box) box.textContent = JSON.stringify({ ok: false, errors: errors }, null, 2);
  }

  window.addEventListener('error', function (e) {
    if (e && e.target && e.target.tagName === 'IMG') {
      recordError('image', e.target.getAttribute('src'));
      return;
    }
    recordError('script', (e && (e.message || e.error)) || 'unknown error');
  }, true);

  window.addEventListener('unhandledrejection', function (e) {
    recordError('promise', (e && e.reason) || 'unhandled rejection');
  });

  function fatal(msg) {
    var el = document.getElementById('boot-error');
    if (!el) return;
    el.hidden = false;
    el.textContent = msg;
  }

  function boot() {
    if (!A || !A.ready || !A.Presentation) {
      fatal('محتوای ارائه بارگذاری نشد. بررسی کنید که فایل‌های content/ و js/ در کنار index.html باشند.');
      return;
    }
    try {
      A.Presentation.build();
    } catch (err) {
      recordError('build', err && err.stack ? err.stack : err);
      fatal('خطا در ساخت ارائه: ' + (err && err.message ? err.message : err));
      return;
    }

    document.body.classList.add('is-ready');
    var loader = document.getElementById('boot');
    if (loader) {
      loader.classList.add('is-done');
      setTimeout(function () {
        loader.parentNode && loader.parentNode.removeChild(loader);
      }, 700);
    }

    /* first-visit hint */
    setTimeout(function () {
      if (!sessionStorage.getItem('airan-hint')) {
        sessionStorage.setItem('airan-hint', '1');
        A.Presentation.toast('با کلیدهای ← → حرکت کنید · Home برای نمای کلی · ? برای راهنما');
      }
    }, 1600);

    if (/[?&]selftest/.test(location.search)) runSelftest();

    /* optional deep-link helpers: ?notes=1 opens presenter notes, ?toc=1 the index */
    if (/[?&]notes=1/.test(location.search)) A.Presentation.toggleNotes();
    if (/[?&]toc=1/.test(location.search)) A.Presentation.toggleTOC(true);
  }

  function runSelftest() {
    var box = document.getElementById('selftest-output');
    if (!box) {
      box = document.createElement('pre');
      box.id = 'selftest-output';
      document.body.appendChild(box);
    }
    A.Presentation.selftest().then(function (report) {
      report.errors = errors;
      if (errors.length) {
        report.ok = false;
        report.problems = (report.problems || []).concat(
          errors.map(function (e) {
            return e.kind + ': ' + e.detail;
          })
        );
      }
      window.__SELFTEST__ = report;
      box.textContent = JSON.stringify(report, null, 2);
      if (window.console && console.info) console.info('[AI-RAN selftest]', report);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
