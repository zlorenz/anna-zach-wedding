/**
 * Toggle #header between light and dark nav chrome based on background
 * behind the fixed navbar (solid colors, marked sections, and hero photos).
 */
(function () {
  'use strict';

  var nav = document.querySelector('#header.az-nav-scroll');
  if (!nav) return;

  var brandImg = nav.querySelector('.az-brand-symbol--nav');
  var brandDark = brandImg && brandImg.getAttribute('data-brand-dark');
  var brandLight = brandImg && brandImg.getAttribute('data-brand-light');

  var DARK_SECTION_SELECTOR =
    '.az-hero, .az-section--dark, [data-nav-tone="dark"]';
  var LIGHT_SECTION_SELECTOR = '[data-nav-tone="light"]';

  var LUMINANCE_THRESHOLD = 0.42;
  var sampleXs = [0.14, 0.5, 0.86];
  var rafId = 0;

  function parseRgb(color) {
    if (!color) return null;
    var m = color.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/i);
    if (!m) return null;
    return {
      r: Number(m[1]),
      g: Number(m[2]),
      b: Number(m[3]),
      a: m[4] === undefined ? 1 : Number(m[4]),
    };
  }

  function relativeLuminance(r, g, b) {
    var rs = r / 255;
    var gs = g / 255;
    var bs = b / 255;
    rs = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
    gs = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
    bs = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  function luminanceFromCssColor(color) {
    var rgb = parseRgb(color);
    if (!rgb || rgb.a < 0.08) return null;
    return relativeLuminance(rgb.r, rgb.g, rgb.b);
  }

  function getBackgroundLuminance(el) {
    var node = el;
    while (node && node !== document.documentElement) {
      var style = window.getComputedStyle(node);
      var lum = luminanceFromCssColor(style.backgroundColor);
      if (lum !== null) return lum;

      if (node.classList && node.classList.contains('az-hero-bg')) {
        return 0.12;
      }

      node = node.parentElement;
    }
    return 0.88;
  }

  function getImageLuminance(img, x, y) {
    if (!img.complete || !img.naturalWidth) return null;
    try {
      var rect = img.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return null;
      var ix = ((x - rect.left) / rect.width) * img.naturalWidth;
      var iy = ((y - rect.top) / rect.height) * img.naturalHeight;
      var canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      var ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(img, ix, iy, 1, 1, 0, 0, 1, 1);
      var px = ctx.getImageData(0, 0, 1, 1).data;
      return relativeLuminance(px[0], px[1], px[2]);
    } catch (err) {
      return null;
    }
  }

  function toneFromElement(el, x, y) {
    if (!el) return null;

    var lightMarked = el.closest(LIGHT_SECTION_SELECTOR);
    if (lightMarked) return 'over-light';

    var darkMarked = el.closest(DARK_SECTION_SELECTOR);
    if (darkMarked) return 'over-dark';

    if (el.tagName === 'IMG') {
      var imgLum = getImageLuminance(el, x, y);
      if (imgLum !== null) {
        return imgLum < LUMINANCE_THRESHOLD ? 'over-dark' : 'over-light';
      }
    }

    var lum = getBackgroundLuminance(el);
    return lum < LUMINANCE_THRESHOLD ? 'over-dark' : 'over-light';
  }

  function samplePoint(x, y) {
    var stack = document.elementsFromPoint(x, y);
    for (var i = 0; i < stack.length; i++) {
      var el = stack[i];
      if (nav === el || nav.contains(el)) continue;
      return toneFromElement(el, x, y);
    }
    return 'over-light';
  }

  function update() {
    rafId = 0;
    var rect = nav.getBoundingClientRect();
    if (rect.height < 1) return;

    var y = rect.top + Math.min(rect.height * 0.45, 72);
    var tones = [];
    var i;

    for (i = 0; i < sampleXs.length; i++) {
      tones.push(samplePoint(window.innerWidth * sampleXs[i], y));
    }

    var useDarkChrome = false;
    for (i = 0; i < tones.length; i++) {
      if (tones[i] === 'over-dark') {
        useDarkChrome = true;
        break;
      }
    }

    nav.classList.toggle('az-nav-over-dark', useDarkChrome);
    nav.classList.toggle('az-nav-over-light', !useDarkChrome);

    if (brandImg && brandDark && brandLight) {
      brandImg.src = useDarkChrome ? brandLight : brandDark;
    }
  }

  function scheduleUpdate() {
    if (rafId) return;
    rafId = window.requestAnimationFrame(update);
  }

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('load', scheduleUpdate);
  document.fonts && document.fonts.ready && document.fonts.ready.then(scheduleUpdate);

  var main = document.getElementById('az-main');
  if (main) {
    main.addEventListener(
      'load',
      function (e) {
        if (e.target && e.target.tagName === 'IMG') scheduleUpdate();
      },
      true
    );
  }

  if (document.readyState === 'complete') {
    scheduleUpdate();
  } else {
    window.addEventListener('DOMContentLoaded', scheduleUpdate);
  }
})();
