(function () {
  'use strict';

  var button = document.querySelector('[data-az-back-to-top]');
  if (!button) {
    return;
  }

  var showAfter = 320;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setVisible(visible) {
    button.classList.toggle('is-visible', visible);
    button.setAttribute('aria-hidden', visible ? 'false' : 'true');
    button.tabIndex = visible ? 0 : -1;
  }

  function update() {
    setVisible(window.scrollY > showAfter);
  }

  button.addEventListener('click', function () {
    window.scrollTo({
      top: 0,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  });

  update();

  window.addEventListener('scroll', update, { passive: true });
})();
