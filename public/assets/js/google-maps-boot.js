/**
 * Load Google Maps JS API after the page map script defines window[callback].
 * Handles gm_authFailure (bad key, referrer, or disabled APIs).
 */
(function () {
  'use strict';

  var boot = document.currentScript;
  if (!boot) return;

  var key = boot.getAttribute('data-key') || '';
  var callback = boot.getAttribute('data-callback') || '';
  if (!key || !callback) return;

  var FALLBACK =
    'Google Maps could not load. In Google Cloud Console, enable Maps JavaScript API (and Directions API for the travel route), confirm billing is on, and add this site to your API key HTTP referrers — e.g. http://localhost:4321/* for local Astro dev (WordPress used port 8888).';

  function showFallback() {
    var ids = [
      'az-travel-airport-map-canvas',
      'az-travel-route-map-canvas',
      'az-accommodation-map-canvas',
      'az-things-to-do-map-canvas',
    ];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el.querySelector('.az-maps-fallback')) return;
      var p = document.createElement('p');
      p.className = 'az-maps-fallback small text-muted p-3 mb-0';
      p.textContent = FALLBACK;
      el.appendChild(p);
    });
  }

  window.gm_authFailure = function () {
    if (window.console && console.error) {
      console.error(
        'Google Maps authentication failed. Check API key, HTTP referrer restrictions, and enabled APIs in Google Cloud Console.'
      );
    }
    showFallback();
  };

  function runCallback() {
    if (typeof window[callback] === 'function') {
      window[callback]();
      return true;
    }
    if (window.console && console.error) {
      console.error('Google Maps callback is not defined:', callback);
    }
    showFallback();
    return false;
  }

  if (window.google && window.google.maps) {
    runCallback();
    return;
  }

  if (typeof window[callback] !== 'function') {
    if (window.console && console.error) {
      console.error('Load the page map script before google-maps-boot.js:', callback);
    }
    showFallback();
    return;
  }

  var params = new URLSearchParams({
    key: key,
    callback: callback,
    loading: 'async',
    v: 'weekly',
  });

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://maps.googleapis.com/maps/api/js?' + params.toString();
  s.onerror = function () {
    if (window.console && console.error) {
      console.error('Google Maps script failed to load.');
    }
    showFallback();
  };
  document.body.appendChild(s);
})();
