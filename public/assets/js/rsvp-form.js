(function () {
  'use strict';

  const form = document.getElementById('az-rsvp-form');
  if (!form) return;

  const declineBlock = document.getElementById('az-rsvp-decline');
  const acceptCols = form.querySelectorAll('.az-rsvp-accept-col');
  const guestsCountBlock = document.getElementById('az-rsvp-guests-count');
  const guestFields = document.getElementById('az-rsvp-guest-fields');
  const statusEl = document.getElementById('az-rsvp-status');

  function setVisible(el, show) {
    if (!el) return;
    el.classList.toggle('d-none', !show);
  }

  function renderGuestFields(count) {
    if (!guestFields) return;
    guestFields.innerHTML = '';
    for (let i = 1; i <= count; i++) {
      const block = document.createElement('div');
      block.className = 'az-rsvp-guest';
      block.innerHTML =
        '<p class="az-rsvp-guest-title">Guest ' +
        i +
        '</p>' +
        '<div class="row g-3 g-lg-4 az-rsvp-guest-fields-row">' +
        '<div class="col-12 col-lg-4">' +
        '<label class="az-rsvp-label" for="guest' +
        i +
        'Name">Name</label>' +
        '<input class="az-rsvp-input" type="text" id="guest' +
        i +
        'Name" name="guest' +
        i +
        'Name" />' +
        '</div>' +
        '<div class="col-12 col-lg-4">' +
        '<label class="az-rsvp-label" for="guest' +
        i +
        'Age">Age</label>' +
        '<select class="az-rsvp-select" id="guest' +
        i +
        'Age" name="guest' +
        i +
        'Age">' +
        '<option value="">Select</option>' +
        '<option value="Adult">Adult</option>' +
        '<option value="Child">Child</option>' +
        '<option value="Infant">Infant</option>' +
        '</select>' +
        '</div>' +
        '<div class="col-12 col-lg-4">' +
        '<label class="az-rsvp-label" for="guest' +
        i +
        'Dietary">Food allergies or restrictions</label>' +
        '<input class="az-rsvp-input" type="text" id="guest' +
        i +
        'Dietary" name="guest' +
        i +
        'Dietary" autocomplete="off" />' +
        '</div>' +
        '</div>';
      guestFields.appendChild(block);
    }
  }

  function updateAttendingUI() {
    const attending = form.querySelector('input[name="attending"]:checked');
    const val = attending ? attending.value : '';
    const isYes = /yes/i.test(val);
    const isNo = /no/i.test(val);
    setVisible(declineBlock, isNo);
    acceptCols.forEach(function (col) {
      setVisible(col, isYes);
    });
    if (!isYes) {
      setVisible(guestsCountBlock, false);
      renderGuestFields(0);
    }
  }

  function updateGuestsUI() {
    const joining = form.querySelector('input[name="joining"]:checked');
    const showCount = joining && /yes/i.test(joining.value);
    setVisible(guestsCountBlock, showCount);
    const addlSelect = form.elements.namedItem('additionalGuests');
    const addlValue =
      addlSelect && 'value' in addlSelect ? addlSelect.value : '0';
    const count = showCount ? parseInt(addlValue || '0', 10) : 0;
    renderGuestFields(Math.min(3, Math.max(0, count || 0)));
  }

  function showStatus(message, type) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = 'az-rsvp-status az-rsvp-status--' + type;
    statusEl.classList.remove('d-none');
  }

  function validateForm(fd) {
    if (!String(fd.get('firstName') || '').trim()) {
      return 'Please enter your first name.';
    }
    if (!String(fd.get('lastName') || '').trim()) {
      return 'Please enter your last name.';
    }
    if (!String(fd.get('email') || '').trim()) {
      return 'Please enter your email.';
    }
    if (!fd.get('attending')) {
      return 'Please choose whether you will be attending.';
    }
    return '';
  }

  form.addEventListener('change', function (e) {
    if (e.target.name === 'attending') updateAttendingUI();
    if (e.target.name === 'joining' || e.target.name === 'additionalGuests') updateGuestsUI();
  });

  // Enter in name/email fields submits the form by default; block until the user clicks Submit.
  form.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.defaultPrevented) return;
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type === 'submit' || target.type === 'button') return;
    e.preventDefault();
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    if (btn) btn.disabled = true;

    const fd = new FormData(form);
    const validationError = validateForm(fd);
    if (validationError) {
      showStatus(validationError, 'danger');
      if (btn) btn.disabled = false;
      return;
    }
    const attending = fd.get('attending');
    const isYes = attending && /yes/i.test(String(attending));
    const addl = isYes ? parseInt(String(fd.get('additionalGuests') || '0'), 10) : 0;
    const guests = [];
    for (let i = 1; i <= addl; i++) {
      guests.push({
        name: String(fd.get('guest' + i + 'Name') || ''),
        age: String(fd.get('guest' + i + 'Age') || ''),
        dietary: String(fd.get('guest' + i + 'Dietary') || ''),
      });
    }

    const payload = {
      firstName: String(fd.get('firstName') || ''),
      lastName: String(fd.get('lastName') || ''),
      email: String(fd.get('email') || ''),
      attending: String(attending || ''),
      dietary: String(fd.get('dietary') || ''),
      declineMessage: String(fd.get('declineMessage') || ''),
      joining: String(fd.get('joining') || ''),
      additionalGuests: String(fd.get('additionalGuests') || '0'),
      guests,
      honeypot: String(fd.get('website') || ''),
    };

    try {
      const res = await fetch('/api/rsvp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      showStatus('Thank you! Your RSVP has been received.', 'success');
      form.reset();
      updateAttendingUI();
    } catch (err) {
      showStatus(err.message || 'Something went wrong. Please try again.', 'danger');
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  updateAttendingUI();
})();
