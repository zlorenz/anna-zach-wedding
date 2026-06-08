/**
 * Home welcome body copy — one line revealed at a time while scrolling.
 * Signature is handled separately in home-signature-reveal.js.
 */
(function () {
  'use strict';

  var root = document.querySelector('[data-az-welcome-reveal]');
  if (!root) return;

  var REVEAL_Y = 0.72;
  var REVEAL_RANGE = 0.1;
  var measureEl = null;
  var lineItems = [];
  var rafId = 0;
  var resizeTimer = 0;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  function getOriginalText(block) {
    var stored = block.getAttribute('data-welcome-text');
    if (stored) return stored.trim();
    var text = block.textContent.trim();
    block.setAttribute('data-welcome-text', text);
    return text;
  }

  function getMeasureElement() {
    if (!measureEl) {
      measureEl = document.createElement('span');
      measureEl.id = 'az-welcome-measure';
      measureEl.setAttribute('aria-hidden', 'true');
      measureEl.className = 'az-welcome-reveal__measure';
      document.body.appendChild(measureEl);
    }

    var copyStyle = window.getComputedStyle(root);
    measureEl.style.font = copyStyle.font;
    measureEl.style.letterSpacing = copyStyle.letterSpacing;
    measureEl.style.textTransform = copyStyle.textTransform;
    return measureEl;
  }

  function measureLineWidth(text, measure) {
    measure.textContent = text;
    return measure.offsetWidth;
  }

  function wrapWordsToLines(words, maxWidth, measure) {
    var lines = [];
    var current = [];
    var i;
    var test;
    var width;

    for (i = 0; i < words.length; i += 1) {
      if (!current.length) {
        current.push(words[i]);
        continue;
      }

      test = current.concat([words[i]]).join(' ');
      width = measureLineWidth(test, measure);

      if (width > maxWidth) {
        lines.push(current);
        current = [words[i]];
      } else {
        current.push(words[i]);
      }
    }

    if (current.length) lines.push(current);
    return lines;
  }

  function renderLine(lineWords, block) {
    var line = document.createElement('span');
    line.className = 'az-welcome-reveal__line';

    var inner = document.createElement('span');
    inner.className = 'az-welcome-reveal__line-inner';
    inner.textContent = lineWords.join(' ');

    line.appendChild(inner);
    block.appendChild(line);
    lineItems.push({ line: line });
  }

  function build() {
    var blocks = root.querySelectorAll('p:not(.az-home-welcome__signature)');
    var measure = getMeasureElement();
    var maxWidth = root.clientWidth;
    var i;
    var block;
    var text;
    var words;
    var lines;
    var j;

    lineItems = [];
    root.classList.remove('is-reveal-ready');

    if (!maxWidth) return;

    for (i = 0; i < blocks.length; i += 1) {
      block = blocks[i];
      text = getOriginalText(block);
      words = text.split(/\s+/).filter(Boolean);
      lines = wrapWordsToLines(words, maxWidth, measure);

      block.textContent = '';
      block.classList.add('az-welcome-reveal__block');

      for (j = 0; j < lines.length; j += 1) {
        renderLine(lines[j], block);
      }
    }

    root.classList.add('is-reveal-ready');
    update();
  }

  function update() {
    if (!lineItems.length) return;

    var vh = window.innerHeight || document.documentElement.clientHeight;
    var revealY = vh * REVEAL_Y;
    var range = Math.max(vh * REVEAL_RANGE, 100);
    var i;
    var rect;
    var center;
    var t;

    for (i = 0; i < lineItems.length; i += 1) {
      rect = lineItems[i].line.getBoundingClientRect();
      center = rect.top + rect.height * 0.5;
      t = smoothstep(clamp((revealY - center) / range + 0.5, 0, 1));
      lineItems[i].line.style.setProperty('--reveal', String(t));
    }
  }

  function scheduleUpdate() {
    if (rafId) return;
    rafId = window.requestAnimationFrame(function () {
      rafId = 0;
      update();
    });
  }

  function scheduleRebuild() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(build, 160);
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('is-reveal-ready');
    return;
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(build).catch(build);
  } else {
    build();
  }

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleRebuild, { passive: true });
})();
