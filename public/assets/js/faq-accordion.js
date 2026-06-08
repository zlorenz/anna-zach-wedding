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
