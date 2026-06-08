/**
 * Dev photo preview: favorites, lightbox zoom, keyboard nav.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'az-engagement-favorites';
  var root = document.getElementById('az-photos-preview');
  if (!root) return;

  var photos = [];
  try {
    photos = JSON.parse(root.getAttribute('data-photos') || '[]');
  } catch (e) {
    photos = [];
  }

  var favoritesListEl = root.querySelector('[data-az-favorites-list]');
  var filenamesEl = root.querySelector('[data-az-favorites-filenames]');
  var countEl = root.querySelector('[data-az-favorites-count]');
  var gridEl = root.querySelector('[data-az-photos-grid]');
  var clearBtn = root.querySelector('[data-az-favorites-clear]');
  var copyBtn = root.querySelector('[data-az-favorites-copy]');

  var lightboxEl = root.querySelector('[data-az-photos-lightbox]');
  var lightboxImg = root.querySelector('[data-az-lightbox-img]');
  var lightboxFilename = root.querySelector('[data-az-lightbox-filename]');
  var lightboxCounter = root.querySelector('[data-az-lightbox-counter]');
  var lightboxHeart = root.querySelector('[data-az-lightbox-heart]');

  var favorites = loadFavorites();
  var dragName = null;
  var dragFrom = null;
  var lightboxIndex = -1;
  var lightboxPhotoName = '';
  var lastFocus = null;

  function loadFavorites() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return [];
      return list.filter(function (name) {
        return photos.some(function (p) {
          return p.name === name;
        });
      });
    } catch (err) {
      return [];
    }
  }

  function saveFavorites() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }

  function photoByName(name) {
    for (var i = 0; i < photos.length; i++) {
      if (photos[i].name === name) return photos[i];
    }
    return null;
  }

  function isFavorite(name) {
    return favorites.indexOf(name) !== -1;
  }

  function addFavorite(name, index) {
    if (isFavorite(name)) return;
    if (typeof index === 'number' && index >= 0 && index <= favorites.length) {
      favorites.splice(index, 0, name);
    } else {
      favorites.push(name);
    }
    saveFavorites();
    render();
  }

  function removeFavorite(name) {
    var i = favorites.indexOf(name);
    if (i === -1) return;
    favorites.splice(i, 1);
    saveFavorites();
    render();
  }

  function toggleFavorite(name) {
    if (isFavorite(name)) removeFavorite(name);
    else addFavorite(name);
  }

  function moveFavorite(name, toIndex) {
    var from = favorites.indexOf(name);
    if (from === -1) {
      favorites.splice(toIndex, 0, name);
    } else {
      favorites.splice(from, 1);
      if (from < toIndex) toIndex -= 1;
      favorites.splice(toIndex, 0, name);
    }
    saveFavorites();
    render();
  }

  function sortedPhotos() {
    var rest = photos
      .filter(function (p) {
        return !isFavorite(p.name);
      })
      .sort(function (a, b) {
        return a.name.localeCompare(b.name);
      });
    var favs = favorites
      .map(function (name) {
        return photoByName(name);
      })
      .filter(Boolean);
    return favs.concat(rest);
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function heartIcon(fav) {
    return fav ? '♥' : '♡';
  }

  function updateHeartButton(btn, name) {
    if (!btn) return;
    var fav = isFavorite(name);
    btn.classList.toggle('is-active', fav);
    btn.setAttribute('aria-pressed', fav ? 'true' : 'false');
    btn.setAttribute('aria-label', fav ? 'Remove from favorites' : 'Add to favorites');
    var icon = btn.querySelector('.az-photos-heart-icon');
    if (icon) icon.textContent = heartIcon(fav);
  }

  function renderFavoritesBar() {
    if (!favoritesListEl) return;

    favoritesListEl.innerHTML = '';
    if (countEl) countEl.textContent = String(favorites.length);

    if (favorites.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'az-photos-favorites__empty mb-0';
      empty.textContent =
        'No favorites yet. Tap ♡ on a photo, or drag a thumbnail into this area.';
      favoritesListEl.appendChild(empty);
    } else {
      favorites.forEach(function (name, index) {
        var photo = photoByName(name);
        if (!photo) return;
        favoritesListEl.appendChild(createChip(photo, index));
      });
    }

    if (filenamesEl) {
      filenamesEl.textContent = favorites.length ? favorites.join('\n') : '(none)';
    }
  }

  function openLightbox(name) {
    var list = sortedPhotos();
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].name === name) {
        idx = i;
        break;
      }
    }
    if (idx === -1) return;
    lightboxPhotoName = name;
    lightboxIndex = idx;
    lastFocus = document.activeElement;
    lightboxEl.hidden = false;
    document.body.classList.add('az-photos-lightbox-open');
    showLightboxPhoto();
    lightboxEl.querySelector('[data-az-lightbox-close]').focus();
  }

  function closeLightbox() {
    if (!lightboxEl || lightboxEl.hidden) return;
    lightboxEl.hidden = true;
    document.body.classList.remove('az-photos-lightbox-open');
    lightboxIndex = -1;
    lightboxPhotoName = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function showLightboxPhoto() {
    var list = sortedPhotos();
    if (lightboxPhotoName) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].name === lightboxPhotoName) {
          lightboxIndex = i;
          break;
        }
      }
    }
    if (lightboxIndex < 0 || lightboxIndex >= list.length) return;
    var photo = list[lightboxIndex];
    lightboxPhotoName = photo.name;
    if (lightboxImg) {
      lightboxImg.src = photo.url;
      lightboxImg.alt = photo.name;
    }
    if (lightboxFilename) lightboxFilename.textContent = photo.name;
    if (lightboxCounter) {
      lightboxCounter.textContent = lightboxIndex + 1 + ' / ' + list.length;
    }
    updateHeartButton(lightboxHeart, photo.name);
  }

  function stepLightbox(delta) {
    var list = sortedPhotos();
    if (!list.length) return;
    lightboxIndex = (lightboxIndex + delta + list.length) % list.length;
    lightboxPhotoName = list[lightboxIndex].name;
    showLightboxPhoto();
  }

  function setupLightbox() {
    if (!lightboxEl) return;

    root.querySelectorAll('[data-az-lightbox-close]').forEach(function (btn) {
      btn.addEventListener('click', closeLightbox);
    });

    var prevBtn = root.querySelector('[data-az-lightbox-prev]');
    var nextBtn = root.querySelector('[data-az-lightbox-next]');
    if (prevBtn) prevBtn.addEventListener('click', function () { stepLightbox(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { stepLightbox(1); });

    if (lightboxHeart) {
      lightboxHeart.addEventListener('click', function () {
        var list = sortedPhotos();
        if (lightboxIndex < 0 || !list[lightboxIndex]) return;
        toggleFavorite(list[lightboxIndex].name);
        showLightboxPhoto();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (lightboxEl.hidden) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepLightbox(-1);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepLightbox(1);
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        var list = sortedPhotos();
        if (lightboxIndex < 0 || !list[lightboxIndex]) return;
        toggleFavorite(list[lightboxIndex].name);
        showLightboxPhoto();
      }
    });
  }

  function createChip(photo, index) {
    var chip = document.createElement('div');
    chip.className = 'az-photos-fav-chip';
    chip.draggable = true;
    chip.dataset.name = photo.name;
    chip.dataset.index = String(index);

    chip.innerHTML =
      '<button type="button" class="az-photos-fav-chip__thumb" data-az-chip-open aria-label="Zoom ' +
      escapeHtml(photo.name) +
      '">' +
      '<img src="' +
      escapeHtml(photo.url) +
      '" alt="" width="48" height="48" loading="lazy" draggable="false" />' +
      '</button>' +
      '<span class="az-photos-fav-chip__name" title="' +
      escapeHtml(photo.name) +
      '">' +
      escapeHtml(photo.name) +
      '</span>' +
      '<button type="button" class="az-photos-fav-chip__remove" aria-label="Remove from favorites">×</button>';

    chip.querySelector('[data-az-chip-open]').addEventListener('click', function () {
      openLightbox(photo.name);
    });

    chip.addEventListener('dragstart', function (e) {
      if (e.target && e.target.closest('[data-az-chip-open]')) {
        e.preventDefault();
        return;
      }
      dragName = photo.name;
      dragFrom = 'chip';
      chip.classList.add('is-dragging');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', photo.name);
      }
    });

    chip.addEventListener('dragend', function () {
      chip.classList.remove('is-dragging');
      dragName = null;
      dragFrom = null;
      favoritesListEl.classList.remove('is-drag-over');
    });

    chip.addEventListener('dragover', function (e) {
      if (dragFrom !== 'chip' && dragFrom !== 'grid') return;
      e.preventDefault();
      chip.classList.add('is-drop-target');
    });

    chip.addEventListener('dragleave', function () {
      chip.classList.remove('is-drop-target');
    });

    chip.addEventListener('drop', function (e) {
      e.preventDefault();
      chip.classList.remove('is-drop-target');
      var name = (e.dataTransfer && e.dataTransfer.getData('text/plain')) || dragName;
      if (!name) return;
      moveFavorite(name, parseInt(chip.dataset.index, 10));
    });

    chip.querySelector('.az-photos-fav-chip__remove').addEventListener('click', function (e) {
      e.stopPropagation();
      removeFavorite(photo.name);
    });

    return chip;
  }

  function createThumb(photo) {
    var fav = isFavorite(photo.name);
    var card = document.createElement('div');
    card.className = 'az-photos-thumb' + (fav ? ' is-favorite' : '');
    card.dataset.name = photo.name;

    card.innerHTML =
      '<button type="button" class="az-photos-thumb__open" data-az-thumb-open aria-label="Zoom ' +
      escapeHtml(photo.name) +
      '">' +
      '<img src="' +
      escapeHtml(photo.url) +
      '" alt="" loading="lazy" draggable="false" />' +
      '</button>' +
      '<button type="button" class="az-photos-thumb__heart" data-az-thumb-heart aria-pressed="' +
      (fav ? 'true' : 'false') +
      '" aria-label="' +
      (fav ? 'Remove from favorites' : 'Add to favorites') +
      '">' +
      '<span class="az-photos-heart-icon" aria-hidden="true">' +
      heartIcon(fav) +
      '</span>' +
      '</button>' +
      '<span class="az-photos-thumb__name">' +
      escapeHtml(photo.name) +
      '</span>';

    var openBtn = card.querySelector('[data-az-thumb-open]');
    var heartBtn = card.querySelector('[data-az-thumb-heart]');

    openBtn.addEventListener('click', function () {
      openLightbox(photo.name);
    });

    heartBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleFavorite(photo.name);
    });

    card.draggable = true;
    card.addEventListener('dragstart', function (e) {
      if (e.target && e.target.closest('[data-az-thumb-heart]')) {
        e.preventDefault();
        return;
      }
      dragName = photo.name;
      dragFrom = 'grid';
      card.classList.add('is-dragging');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'copyMove';
        e.dataTransfer.setData('text/plain', photo.name);
      }
    });

    card.addEventListener('dragend', function () {
      card.classList.remove('is-dragging');
      dragName = null;
      dragFrom = null;
      favoritesListEl.classList.remove('is-drag-over');
    });

    return card;
  }

  function renderGrid() {
    if (!gridEl) return;
    gridEl.innerHTML = '';
    var list = sortedPhotos();
    list.forEach(function (photo, i) {
      var wrap = document.createElement('div');
      wrap.className = 'col-6 col-md-4 col-lg-3';
      if (favorites.length > 0 && i === favorites.length - 1) {
        wrap.dataset.azFavoritesEnd = 'true';
      }
      wrap.appendChild(createThumb(photo));
      gridEl.appendChild(wrap);
    });

    if (favorites.length > 0 && list.length > favorites.length) {
      var divider = document.createElement('div');
      divider.className = 'col-12 az-photos-grid__divider';
      divider.innerHTML = '<span>All photos</span>';
      var lastFav = gridEl.querySelector('[data-az-favorites-end]');
      if (lastFav && lastFav.nextSibling) {
        gridEl.insertBefore(divider, lastFav.nextSibling);
      }
    }

    if (!lightboxEl.hidden && lightboxIndex >= 0) {
      showLightboxPhoto();
    }
  }

  function setupDropZone() {
    if (!favoritesListEl) return;

    favoritesListEl.addEventListener('dragover', function (e) {
      e.preventDefault();
      favoritesListEl.classList.add('is-drag-over');
    });

    favoritesListEl.addEventListener('dragleave', function (e) {
      if (!favoritesListEl.contains(e.relatedTarget)) {
        favoritesListEl.classList.remove('is-drag-over');
      }
    });

    favoritesListEl.addEventListener('drop', function (e) {
      e.preventDefault();
      favoritesListEl.classList.remove('is-drag-over');
      var name = (e.dataTransfer && e.dataTransfer.getData('text/plain')) || dragName;
      if (!name || isFavorite(name)) return;
      addFavorite(name);
    });
  }

  function render() {
    renderFavoritesBar();
    renderGrid();
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (!favorites.length) return;
      if (window.confirm('Clear all favorites?')) {
        favorites = [];
        saveFavorites();
        render();
      }
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      if (!favorites.length) return;
      var text = favorites.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          copyBtn.textContent = 'Copied!';
          setTimeout(function () {
            copyBtn.textContent = 'Copy filenames';
          }, 1500);
        });
      }
    });
  }

  setupDropZone();
  setupLightbox();
  render();
})();
