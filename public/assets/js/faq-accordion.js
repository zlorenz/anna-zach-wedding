(function () {
  'use strict';

  var root = document.querySelector('[data-az-faq]');
  if (!root) {
    return;
  }

  var triggers = Array.prototype.slice.call(root.querySelectorAll('[data-az-faq-trigger]'));
  var toggleAll = document.querySelector('[data-az-faq-toggle-all]');

  if (!triggers.length) {
    return;
  }

  function getItem(trigger) {
    return trigger.closest('.az-faq__item');
  }

  function getPanel(trigger) {
    var panelId = trigger.getAttribute('aria-controls');
    return panelId ? document.getElementById(panelId) : null;
  }

  function isExpanded(trigger) {
    return trigger.getAttribute('aria-expanded') === 'true';
  }

  function setExpandedState(trigger, expanded) {
    trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');

    var panel = getPanel(trigger);
    if (panel) {
      if (expanded) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    }

    var item = getItem(trigger);
    if (item) {
      item.classList.toggle('is-active', expanded);
    }
  }

  function expand(trigger) {
    setExpandedState(trigger, true);
  }

  function collapse(trigger) {
    setExpandedState(trigger, false);
  }

  function toggle(trigger) {
    setExpandedState(trigger, !isExpanded(trigger));
  }

  function allExpanded() {
    return triggers.every(isExpanded);
  }

  function expandAll() {
    triggers.forEach(expand);
  }

  function collapseAll() {
    triggers.forEach(collapse);
  }

  function updateToggleAll() {
    if (!toggleAll) {
      return;
    }

    var expandLabel = toggleAll.getAttribute('data-expand-label') || 'Expand all';
    var collapseLabel = toggleAll.getAttribute('data-collapse-label') || 'Collapse all';
    var allOpen = allExpanded();
    toggleAll.textContent = allOpen ? collapseLabel : expandLabel;
    toggleAll.setAttribute('aria-expanded', allOpen ? 'true' : 'false');
  }

  triggers.forEach(function (trigger) {
    trigger.addEventListener('click', function (event) {
      event.preventDefault();
      toggle(trigger);
      updateToggleAll();

      if (isExpanded(trigger)) {
        var item = getItem(trigger);
        if (item) {
          window.requestAnimationFrame(function () {
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          });
        }
      }
    });
  });

  if (toggleAll) {
    toggleAll.addEventListener('click', function () {
      if (allExpanded()) {
        collapseAll();
      } else {
        expandAll();
      }

      updateToggleAll();
    });
  }

  updateToggleAll();
})();

(function () {
  'use strict';

  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-az-gift-copy]'));
  if (!buttons.length) {
    return;
  }

  function fallbackCopy(value) {
    var input = document.createElement('textarea');
    input.value = value;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.top = '0';
    input.style.left = '-9999px';
    document.body.appendChild(input);
    input.select();
    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (error) {
      ok = false;
    }
    document.body.removeChild(input);
    return ok;
  }

  buttons.forEach(function (button) {
    var state = button.querySelector('.az-faq-gifts__copy-state');
    var idle = button.getAttribute('data-copy-label') || (state ? state.textContent : '');
    var copied = button.getAttribute('data-copied-label') || idle;
    var timer = 0;

    function showCopied() {
      button.classList.add('is-copied');
      if (state) {
        state.textContent = copied;
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        button.classList.remove('is-copied');
        if (state) {
          state.textContent = idle;
        }
      }, 2000);
    }

    button.addEventListener('click', function () {
      var value = button.getAttribute('data-az-gift-copy') || '';
      if (!value) {
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(showCopied).catch(function () {
          if (fallbackCopy(value)) {
            showCopied();
          }
        });
        return;
      }
      if (fallbackCopy(value)) {
        showCopied();
      }
    });
  });
})();
