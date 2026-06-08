/**
 * Travel page image-break parallax.
 * Subtle transform-only effect for performance/accessibility.
 */
(function () {
  'use strict';

  var tiles = Array.prototype.slice.call(
    document.querySelectorAll('.az-travel-image-break__tile img')
  );
  if (!tiles.length) {
    return;
  }

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) {
    return;
  }

  var visible = new Set();
  var ticking = false;
  var maxShift = 18;

  function speedFor(img) {
    var tile = img.closest('.az-travel-image-break__tile');
    if (!tile) {
      return 0.05;
    }
    if (tile.classList.contains('az-travel-image-break__tile--center')) {
      return 0.045;
    }
    if (tile.classList.contains('az-travel-image-break__tile--large')) {
      return 0.04;
    }
    if (tile.classList.contains('az-travel-image-break__tile--small')) {
      return 0.055;
    }
    return 0.05;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function update() {
    ticking = false;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var viewportCenter = vh / 2;

    visible.forEach(function (img) {
      var rect = img.getBoundingClientRect();
      var imgCenter = rect.top + rect.height / 2;
      var delta = viewportCenter - imgCenter;
      var shift = clamp(delta * speedFor(img), -maxShift, maxShift);
      img.style.setProperty('--az-parallax-y', shift.toFixed(2) + 'px');
    });
  }

  function requestUpdate() {
    if (ticking) {
      return;
    }
    ticking = true;
    window.requestAnimationFrame(update);
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          visible.add(entry.target);
        } else {
          visible.delete(entry.target);
        }
      });
      requestUpdate();
    },
    { root: null, threshold: 0, rootMargin: '20% 0px 20% 0px' }
  );

  tiles.forEach(function (img) {
    io.observe(img);
  });

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  window.addEventListener('orientationchange', requestUpdate, { passive: true });

  requestUpdate();
})();
