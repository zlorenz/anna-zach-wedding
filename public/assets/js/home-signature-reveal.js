/**
 * Home welcome signature — left-to-right wipe (clip-path on full-width line; no width reflow).
 */
(function () {
  'use strict';

  var clip = document.querySelector('[data-az-signature-reveal]');
  if (!clip) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    clip.style.clipPath = 'none';
    clip.style.webkitClipPath = 'none';
    return;
  }

  var REVEAL_Y = 0.72;
  var REVEAL_RANGE = 0.2;
  var rafId = 0;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  function update() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var rect = clip.getBoundingClientRect();
    var center = rect.top + rect.height * 0.5;
    var revealY = vh * REVEAL_Y;
    var range = Math.max(vh * REVEAL_RANGE, 140);
    var t = smoothstep(clamp((revealY - center) / range + 0.5, 0, 1));
    var clipRight = ((1 - t) * 100).toFixed(2) + '%';
    var path = 'inset(0 ' + clipRight + ' 0 0)';

    clip.style.clipPath = path;
    clip.style.webkitClipPath = path;
  }

  function scheduleUpdate() {
    if (rafId) return;
    rafId = window.requestAnimationFrame(function () {
      rafId = 0;
      update();
    });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(update).catch(update);
  } else {
    update();
  }

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
})();
