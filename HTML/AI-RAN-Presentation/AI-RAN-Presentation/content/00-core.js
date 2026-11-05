/* ==========================================================================
   AI-RAN Presentation — 00-core.js
   Global namespace, source registry, section definitions and small helpers.
   Load order: content/00-core.js → 10-intro → 20-for → 30-in → 40-on
                → 50-compare → 60-eco → 70-wrap (finalises window.AIRAN)
   ========================================================================== */
(function () {
  'use strict';

  var A = (window.AIRAN = window.AIRAN || {});

  /* ------------------------------------------------------------------ meta */
  A.meta = {
    title: 'AI-RAN: هوش مصنوعی در شبکه دسترسی رادیویی',
    subtitle: 'AI for RAN · AI in RAN · AI on RAN',
    audience: 'مهندسان، دانشجویان و متخصصان مخابرات',
    duration: '۹۰ تا ۱۲۰ دقیقه (قابل تنظیم)',
    level: 'مقدماتی تا پیشرفته',
    lang: 'fa',
    version: '1.0.0',
    tagline: 'یک سفر تعاملی در اکوسیستم AI-RAN'
  };

  /* --------------------------------------------------------------- sources
     Every claim in the deck is traceable to one of these keys.
     kind: official | research | vendor | standard | tool | project        */
  A.sources = {
    wg1: {
      label: 'AI-RAN WG1 — AI-for-RAN Whitepaper',
      short: 'WG1 Whitepaper',
      org: 'AI-RAN Alliance',
      kind: 'official',
      url: 'https://ai-ran.org/documents/AI-RAN-WG1-AI-for-RAN-Whitepaper.pdf'
    },
    wg3: {
      label: 'AI-RAN WG3 — AI-on-RAN Whitepaper',
      short: 'WG3 Whitepaper',
      org: 'AI-RAN Alliance',
      kind: 'official',
      url: 'https://ai-ran.org/documents/AI-RAN-WG3-AI-on-RAN-Whitepaper.pdf'
    },
    vision: {
      label: 'AI-RAN Alliance — Vision and Mission Whitepaper',
      short: 'Alliance Vision',
      org: 'AI-RAN Alliance',
      kind: 'official',
      url: 'https://ai-ran.org/documents/AI-RAN-Alliance-Whitepaper.pdf'
    },
    arch: {
      label: 'AI-RAN Architecture Overview and Component Definitions, v1.2',
      short: 'Architecture v1.2',
      org: 'AI-RAN Alliance',
      kind: 'official',
      url: 'https://ai-ran.org/documents/AI-RAN-Architecture-v1.2.pdf'
    },
    pi: {
      label: 'AI-RAN Platform and Infrastructure Orchestrator (WG2)',
      short: 'P&I Orchestrator',
      org: 'AI-RAN Alliance',
      kind: 'official',
      url: 'https://ai-ran.org/documents/AI-RAN-Platform-Infrastructure-Orchestrator.pdf'
    },
    alliance: {
      label: 'AI-RAN Alliance — official site',
      short: 'ai-ran.org',
      org: 'AI-RAN Alliance',
      kind: 'official',
      url: 'https://ai-ran.org/'
    },
    nvidia: {
      label: 'NVIDIA — AI-RAN solutions for 5G and 6G',
      short: 'NVIDIA AI-RAN',
      org: 'NVIDIA',
      kind: 'vendor',
      url: 'https://www.nvidia.com/en-us/industries/telecommunications/ai-ran/'
    },
    aerial: {
      label: 'NVIDIA Aerial CUDA-Accelerated RAN — documentation',
      short: 'Aerial CUDA RAN docs',
      org: 'NVIDIA',
      kind: 'tool',
      url: 'https://docs.nvidia.com/aerial/cuda-accelerated-ran/latest/index.html'
    },
    aerialfw: {
      label: 'NVIDIA Aerial Framework — documentation',
      short: 'Aerial Framework docs',
      org: 'NVIDIA',
      kind: 'tool',
      url: 'https://docs.nvidia.com/aerial/framework/latest/'
    },
    aodt: {
      label: 'NVIDIA Aerial Omniverse Digital Twin — documentation',
      short: 'AODT docs',
      org: 'NVIDIA',
      kind: 'tool',
      url: 'https://docs.nvidia.com/aerial/aodt/welcome'
    },
    sionna: {
      label: 'NVIDIA Sionna — GPU-accelerated wireless research library',
      short: 'Sionna',
      org: 'NVIDIA',
      kind: 'tool',
      url: 'https://developer.nvidia.com/sionna'
    },
    sionnart: {
      label: 'Sionna RT: Differentiable Ray Tracing for Radio Propagation Modeling',
      short: 'Sionna RT paper',
      org: 'NVIDIA Research',
      kind: 'research',
      url: 'https://research.nvidia.com/publication/2023-12_sionna-rt-differentiable-ray-tracing-radio-propagation-modeling'
    },
    oran: {
      label: 'O-RAN Alliance — open radio access network specifications',
      short: 'O-RAN Alliance',
      org: 'O-RAN Alliance',
      kind: 'standard',
      url: 'https://www.o-ran.org/'
    },
    gpp: {
      label: '3GPP — Release 18/19/20 AI/ML studies for NR',
      short: '3GPP',
      org: '3GPP',
      kind: 'standard',
      url: 'https://www.3gpp.org/'
    },
    oai: {
      label: 'OpenAirInterface Software Alliance — open source 4G/5G implementation',
      short: 'OpenAirInterface',
      org: 'OSA / EURECOM',
      kind: 'project',
      url: 'https://openairinterface.org/'
    },
    flexric: {
      label: 'FlexRIC — near-RT RIC implementation (Mosaic5G)',
      short: 'FlexRIC',
      org: 'EURECOM Mosaic5G',
      kind: 'project',
      url: 'https://gitlab.eurecom.fr/mosaic5g/flexric'
    },
    ericsson: {
      label: 'Ericsson — AI RAN',
      short: 'Ericsson AI-RAN',
      org: 'Ericsson',
      kind: 'vendor',
      url: 'https://www.ericsson.com/en/ai/ran'
    },
    nokia: {
      label: 'Nokia — AI-RAN platform',
      short: 'Nokia AI-RAN',
      org: 'Nokia',
      kind: 'vendor',
      url: 'https://www.nokia.com/radio-access/ai-ran/'
    },
    local: {
      label: 'مجموعه اسناد پژوهشی پروژه (خلاصهها و ترجمههای محلی وایتپیپرها)',
      short: 'اسناد پروژه',
      org: 'پروژه محلی',
      kind: 'project',
      url: ''
    }
  };

  /* -------------------------------------------------------------- sections
     `layout.cols` drives the automatic knowledge-map placement of scenes.   */
  A.sections = [
    {
      id: 'intro',
      index: '۰۰',
      title: 'مقدمه و نقشه کلی',
      en: 'Introduction',
      accent: 'accent-intro',
      minutes: 14,
      cols: 4,
      summary: 'RAN چیست، چرا به AI نیاز دارد و AI-RAN چگونه به سه شاخه تقسیم میشود.'
    },
    {
      id: 'for',
      index: '۰۱',
      title: 'AI for RAN',
      en: 'AI for RAN',
      accent: 'accent-for',
      minutes: 26,
      cols: 3,
      summary: 'هوش مصنوعی بهعنوان لایهٔ هوشمندی برای بهینهسازی، خودکارسازی و نگهداری RAN.'
    },
    {
      id: 'in',
      index: '۰۲',
      title: 'AI in RAN',
      en: 'AI in RAN',
      accent: 'accent-in',
      minutes: 24,
      cols: 3,
      summary: 'ادغام مدلهای AI درون پشتهٔ پردازشی RAN؛ از تخمین کانال تا زمانبندی و RIC.'
    },
    {
      id: 'on',
      index: '۰۳',
      title: 'AI on RAN',
      en: 'AI on RAN',
      accent: 'accent-on',
      minutes: 24,
      cols: 3,
      summary: 'همگرایی زیرساخت RAN و محاسبات شتابیافته برای اجرای بارهای کاری و سرویسهای AI.'
    },
    {
      id: 'compare',
      index: '۰۴',
      title: 'مقایسهٔ سه شاخه',
      en: 'Comparison',
      accent: 'accent-compare',
      minutes: 8,
      cols: 3,
      summary: 'تفاوتها، مرزها و نحوهٔ تکمیل یکدیگر در یک معماری واحد.'
    },
    {
      id: 'eco',
      index: '۰۵',
      title: 'اکوسیستم فناوری',
      en: 'Technology Ecosystem',
      accent: 'accent-eco',
      minutes: 10,
      cols: 4,
      summary: 'NVIDIA، Sionna، OpenAirInterface، FlexRIC و O-RAN در جایگاه واقعی خود.'
    },
    {
      id: 'wrap',
      index: '۰۶',
      title: 'جمعبندی و ارزیابی',
      en: 'Wrap-up',
      accent: 'accent-wrap',
      minutes: 6,
      cols: 5,
      summary: 'پیامهای کلیدی، آزمون دانش، منابع و راهنمای مدرس.'
    }
  ];

  /* ------------------------------------------------------------ small utils */
  A.push = function (scene) {
    (A.scenes = A.scenes || []).push(scene);
  };

  A.section = function (id) {
    for (var i = 0; i < A.sections.length; i++) {
      if (A.sections[i].id === id) return A.sections[i];
    }
    return A.sections[0];
  };

  A.scenes = [];
})();
