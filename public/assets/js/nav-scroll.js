(() => {
  'use strict';

  const nav = document.querySelector('#header.az-nav-scroll');
  if (!nav) return;

  const navCollapse = document.getElementById('navbar');
  const MOBILE_MQ = window.matchMedia('(max-width: 767.98px)');

  const isMobile = () => MOBILE_MQ.matches;

  const isMenuOpen = () => {
    if (document.body.classList.contains('az-mobile-nav-open')) return true;
    return navCollapse && navCollapse.classList.contains('show');
  };

  const setVisible = (visible) => {
    if (isMobile()) {
      nav.classList.remove('is-hidden');
      nav.classList.add('is-visible');
      return;
    }
    nav.classList.toggle('is-hidden', !visible);
    nav.classList.toggle('is-visible', visible);
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setVisible(true);
    return;
  }

  let lastY = window.scrollY;
  const hideThreshold = 4;
  const revealThreshold = 1;
  const topBuffer = 8;

  setVisible(window.scrollY <= topBuffer);

  MOBILE_MQ.addEventListener('change', () => setVisible(true));

  window.addEventListener(
    'scroll',
    () => {
      if (isMobile()) {
        setVisible(true);
        return;
      }

      const y = window.scrollY;
      const delta = y - lastY;
      lastY = y;

      if (isMenuOpen()) {
        setVisible(true);
        return;
      }

      if (y <= topBuffer) {
        setVisible(true);
        return;
      }

      if (delta > hideThreshold) {
        setVisible(false);
      } else if (delta < -revealThreshold) {
        setVisible(true);
      }
    },
    { passive: true }
  );

  navCollapse?.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      if (!navCollapse.classList.contains('show')) return;
      const instance = window.bootstrap?.Collapse?.getInstance(navCollapse);
      if (instance) instance.hide();
    });
  });
})();
