/**
 * Full-screen mobile nav — slides in from the left (md breakpoint and below).
 */
(function () {
  'use strict';

  var MOBILE_MQ = window.matchMedia('(max-width: 767.98px)');
  var REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');
  var drawer = document.getElementById('az-mobile-nav');
  var toggle = document.querySelector('[data-az-mobile-nav-toggle]');
  var panel = drawer && drawer.querySelector('.az-mobile-nav__panel');
  if (!drawer || !toggle || !panel) return;

  var links = drawer.querySelectorAll('.az-mobile-nav__link');
  var lastFocus = null;
  var closing = false;
  var afterClose = null;

  function isMobile() {
    return MOBILE_MQ.matches;
  }

  function applyClosedState() {
    closing = false;
    afterClose = null;
    drawer.classList.remove('is-open', 'is-closing');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('inert', '');
    document.body.classList.remove('az-mobile-nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');

    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
      lastFocus = null;
    }
  }

  function openMenu() {
    if (!isMobile()) return;

    closing = false;
    afterClose = null;
    drawer.classList.remove('is-closing');
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    drawer.removeAttribute('inert');
    document.body.classList.add('az-mobile-nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');

    lastFocus = document.activeElement;
    window.requestAnimationFrame(function () {
      var first = drawer.querySelector('.az-mobile-nav__link');
      if (first) first.focus();
    });
  }

  function closeMenu(done) {
    if (!drawer.classList.contains('is-open')) return;

    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('az-mobile-nav-open');
    afterClose = typeof done === 'function' ? done : null;

    if (REDUCE_MOTION.matches) {
      applyClosedState();
      if (afterClose) {
        afterClose();
        afterClose = null;
      }
      return;
    }

    if (closing) return;
    closing = true;
    drawer.classList.add('is-closing');
  }

  function toggleMenu() {
    if (closing) {
      closing = false;
      afterClose = null;
      drawer.classList.remove('is-closing');
      openMenu();
      return;
    }

    if (drawer.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  panel.addEventListener('transitionend', function (e) {
    if (e.target !== panel || e.propertyName !== 'transform' || !closing) return;

    var cb = afterClose;
    applyClosedState();
    if (cb) cb();
  });

  toggle.addEventListener('click', toggleMenu);

  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (!drawer.classList.contains('is-open')) return;

      var href = link.getAttribute('href');
      if (!href || link.target === '_blank') return;

      e.preventDefault();
      closeMenu(function () {
        window.location.assign(href);
      });
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      e.preventDefault();
      closeMenu();
    }
  });

  MOBILE_MQ.addEventListener('change', function () {
    if (!isMobile()) applyClosedState();
  });
})();
