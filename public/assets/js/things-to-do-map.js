/**
 * Google Maps: curated pins from window.azThingsToDoMap (things-to-do-places.json).
 * Categories: restaurants, nightlife, sightseeing, entertainment — color-coded pins.
 * Place name labels appear only when zoomed in (mapUi.zoomLabelMin).
 */
(function () {
  'use strict';

  var PIN_TEARDROP =
    'M12 0C5.373 0 0 5.373 0 12c0 8.25 12 24 12 24s12-15.75 12-24C24 5.373 18.627 0 12 0z';

  var CATEGORY_COLORS = {
    restaurants: { fill: '#EA4335', stroke: '#C5221F', dot: '#B31412' },
    nightlife: { fill: '#9C27B0', stroke: '#6A1B9A', dot: '#4A148C' },
    sightseeing: { fill: '#4285F4', stroke: '#1967D2', dot: '#174EA6' },
    entertainment: { fill: '#34A853', stroke: '#188038', dot: '#137333' },
  };

  function computeCentroid(picks) {
    if (!picks || picks.length === 0) {
      return null;
    }
    var lat = 0;
    var lng = 0;
    picks.forEach(function (p) {
      lat += p.lat;
      lng += p.lng;
    });
    return { lat: lat / picks.length, lng: lng / picks.length };
  }

  function placementSide(p, centroid, ordinal) {
    if (!centroid) {
      return ordinal % 2 === 0 ? 'e' : 'w';
    }
    var dg = p.lng - centroid.lng;
    if (Math.abs(dg) < 1e-9) {
      return ordinal % 2 === 0 ? 'e' : 'w';
    }
    return dg >= 0 ? 'e' : 'w';
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function nlToBr(s) {
    return String(s || '')
      .split(/\r?\n/)
      .map(function (line) {
        return escapeHtml(line);
      })
      .join('<br>');
  }

  function infoWindowHtml(p, openLabel) {
    var mapsUrl = p.mapsUrl || '';
    var html =
      '<div class="az-things-to-do-map__info">' +
      '<div class="az-things-to-do-map__info-title">' +
      escapeHtml(p.title || '') +
      '</div>';

    if (p.blurb) {
      html +=
        '<div class="az-things-to-do-map__info-line">' + nlToBr(p.blurb) + '</div>';
    }

    if (p.note) {
      html +=
        '<div class="az-things-to-do-map__info-line az-things-to-do-map__info-line--secondary">' +
        escapeHtml(p.note) +
        '</div>';
    }

    if (mapsUrl) {
      html +=
        '<a href="#" class="az-things-to-do-map__info-link" data-az-maps-link role="button">' +
        escapeHtml(openLabel) +
        '</a>';
    }

    return html + '</div>';
  }

  /** InfoWindow HTML breaks place URLs with @ in href — open via script instead. */
  function attachInfoMapsLinkHandler(infoWindow, mapsUrl) {
    if (!mapsUrl) {
      return;
    }
    google.maps.event.addListenerOnce(infoWindow, 'domready', function () {
      var canvas = document.getElementById('az-things-to-do-map-canvas');
      var link = canvas ? canvas.querySelector('[data-az-maps-link]') : null;
      if (!link) {
        return;
      }
      link.addEventListener('click', function (e) {
        e.preventDefault();
        window.open(mapsUrl, '_blank', 'noopener,noreferrer');
      });
    });
  }

  function pinIcon(gmaps, category) {
    var colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.restaurants;
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36">' +
      '<path fill="' +
      colors.fill +
      '" stroke="' +
      colors.stroke +
      '" stroke-width="1" stroke-linejoin="round" d="' +
      PIN_TEARDROP +
      '"/>' +
      '<circle cx="12" cy="12" r="5.25" fill="' +
      colors.dot +
      '"/>' +
      '</svg>';
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new gmaps.Size(28, 42),
      anchor: new gmaps.Point(14, 42),
    };
  }

  /**
   * @param {typeof google.maps} gmaps
   */
  function createMapHtmlLabelClass(gmaps) {
    function MapHtmlLabel(map, position, text, options) {
      options = options || {};
      this.position =
        position instanceof gmaps.LatLng
          ? position
          : new gmaps.LatLng(position.lat, position.lng);
      this.text = text;
      this.placement = options.placement || 'e';
      this.className = options.className || '';
      this.zIndex = options.zIndex || '10';
      this.anchorLiftPx = typeof options.anchorLiftPx === 'number' ? options.anchorLiftPx : 40;
      this.pinHalfWidthPx = typeof options.pinHalfWidthPx === 'number' ? options.pinHalfWidthPx : 12;
      this.labelGapPx = typeof options.labelGapPx === 'number' ? options.labelGapPx : 6;
      this.visible = true;
      this.setMap(map);
    }

    MapHtmlLabel.prototype = Object.create(gmaps.OverlayView.prototype);
    MapHtmlLabel.prototype.constructor = MapHtmlLabel;

    MapHtmlLabel.prototype.onAdd = function () {
      var side = this.placement === 'w' ? 'w' : 'e';
      var div = document.createElement('div');
      div.className =
        'az-things-to-do-map__html-label az-things-to-do-map__html-label--placement-' +
        side +
        ' ' +
        this.className;
      div.setAttribute('role', 'presentation');
      div.style.position = 'absolute';
      div.style.zIndex = String(this.zIndex);
      div.style.pointerEvents = 'none';
      div.style.margin = '0';
      div.style.display = 'inline-block';
      div.style.width = 'auto';
      div.style.transform = 'none';
      div.textContent = this.text;
      this.div = div;
      this.getMap().getDiv().appendChild(div);
    };

    MapHtmlLabel.prototype.onRemove = function () {
      if (this.div && this.div.parentNode) {
        this.div.parentNode.removeChild(this.div);
      }
      this.div = null;
    };

    MapHtmlLabel.prototype.draw = function () {
      var projection = this.getProjection();
      if (!projection || !this.div) {
        return;
      }
      var map = this.getMap();
      if (!map) {
        return;
      }

      var pos =
        typeof projection.fromLatLngToContainerPixel === 'function'
          ? projection.fromLatLngToContainerPixel(this.position)
          : projection.fromLatLngToDivPixel(this.position);
      if (
        !pos ||
        typeof pos.x !== 'number' ||
        typeof pos.y !== 'number' ||
        isNaN(pos.x) ||
        isNaN(pos.y)
      ) {
        return;
      }

      var gap = this.labelGapPx;
      var pinHalf = this.pinHalfWidthPx;
      var hOffset = pinHalf + gap;
      var pl = this.placement;
      var lift = this.anchorLiftPx;
      var labelLiftY = pl === 'e' || pl === 'w' ? Math.round(lift * 0.45) : 0;
      var div = this.div;

      div.style.transform = 'none';
      div.style.visibility = 'hidden';
      div.style.left = '0px';
      div.style.top = '0px';

      var w = div.offsetWidth;
      var h = div.offsetHeight;
      var anchorX = pos.x;
      var anchorY = pos.y;
      var left;
      var top;

      if (pl === 'w') {
        left = anchorX - hOffset - w;
        top = anchorY - h / 2 - labelLiftY;
      } else {
        left = anchorX + hOffset;
        top = anchorY - h / 2 - labelLiftY;
      }

      div.style.left = Math.round(left) + 'px';
      div.style.top = Math.round(top) + 'px';
      div.style.visibility = this.visible ? 'visible' : 'hidden';
    };

    MapHtmlLabel.prototype.setVisible = function (on) {
      this.visible = !!on;
      if (this.div) {
        this.div.style.visibility = this.visible ? 'visible' : 'hidden';
      }
      if (this.getMap()) {
        this.draw();
      }
    };

    return MapHtmlLabel;
  }

  var MAP_STYLES = [
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#b8ac9d' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#f5efe8' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#c8d5db' }],
    },
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ color: '#f2ebe4' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#e8dfd6' }],
    },
  ];

  window.azThingsToDoMapInit = function () {
    var cfg = window.azThingsToDoMap;
    if (!cfg || !Array.isArray(cfg.places) || cfg.places.length === 0) {
      return;
    }

    var el = document.getElementById('az-things-to-do-map-canvas');
    if (!el || typeof google === 'undefined' || !google.maps) {
      return;
    }

    var gmaps = google.maps;
    var MapHtmlLabel = createMapHtmlLabelClass(gmaps);
    var mapUi = cfg.mapUi || {};
    var i18n = cfg.i18n || {};
    var fitZoomTarget =
      typeof mapUi.fitZoom === 'number' && mapUi.fitZoom > 0 ? mapUi.fitZoom : 14;
    var zoomLabelMin =
      typeof mapUi.zoomLabelMin === 'number' && mapUi.zoomLabelMin > 0 ? mapUi.zoomLabelMin : 16;
    var openLabel = i18n.openInMaps || 'Open in Google Maps';

    var activeCategories = {
      restaurants: true,
      nightlife: true,
      sightseeing: true,
      entertainment: true,
    };

    var bounds = new gmaps.LatLngBounds();
    cfg.places.forEach(function (p) {
      bounds.extend(new gmaps.LatLng(p.lat, p.lng));
    });

    var map = new gmaps.Map(el, {
      center: bounds.getCenter(),
      zoom: 12,
      styles: MAP_STYLES,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    var info = new gmaps.InfoWindow({ maxWidth: 320 });
    var calibratingClass = 'az-things-to-do-map__canvas--calibrating';
    var centroid = computeCentroid(cfg.places);
    var tracked = [];
    var ordinal = 0;

    cfg.places.forEach(function (p) {
      var position = { lat: p.lat, lng: p.lng };
      var placement = placementSide(p, centroid, ordinal);
      ordinal += 1;
      var categoryClass = 'az-things-to-do-map__html-label--' + (p.category || 'restaurants');

      var marker = new gmaps.Marker({
        map: map,
        position: position,
        title: p.title || '',
        icon: pinIcon(gmaps, p.category),
      });

      var labelOverlay = new MapHtmlLabel(map, position, p.title || '', {
        placement: placement,
        className: categoryClass,
        zIndex: '4000',
        anchorLiftPx: 40,
        pinHalfWidthPx: 12,
        labelGapPx: 6,
      });
      labelOverlay.setVisible(false);

      tracked.push({
        marker: marker,
        labelOverlay: labelOverlay,
        category: p.category || 'restaurants',
      });

      marker.addListener('click', function () {
        var mapsUrl = p.mapsUrl || '';
        info.setContent(infoWindowHtml(p, openLabel));
        info.open({ anchor: marker, map: map });
        attachInfoMapsLinkHandler(info, mapsUrl);
      });
    });

    function isCategoryActive(category) {
      return activeCategories[category] !== false;
    }

    function applyCategoryFilter() {
      tracked.forEach(function (entry) {
        var on = isCategoryActive(entry.category);
        entry.marker.setMap(on ? map : null);
        if (entry.labelOverlay) {
          entry.labelOverlay.setMap(on ? map : null);
        }
      });
      info.close();
      syncZoomGatedLabels();
      redrawAllLabels();
    }

    function syncZoomGatedLabels() {
      var showLabels = map.getZoom() >= zoomLabelMin;
      tracked.forEach(function (entry) {
        if (!entry.labelOverlay) {
          return;
        }
        var visible = showLabels && isCategoryActive(entry.category);
        entry.labelOverlay.setVisible(visible);
      });
    }

    function redrawAllLabels() {
      tracked.forEach(function (entry) {
        if (entry.labelOverlay) {
          entry.labelOverlay.draw();
        }
      });
    }

    function allCategoriesActive() {
      return Object.keys(activeCategories).every(function (key) {
        return activeCategories[key];
      });
    }

    function syncFilterButtons() {
      if (!filtersEl) {
        return;
      }
      filtersEl.querySelectorAll('[data-az-category-filter]').forEach(function (btn) {
        var cat = btn.getAttribute('data-az-category-filter');
        if (!cat || !(cat in activeCategories)) {
          return;
        }
        var on = activeCategories[cat];
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.classList.toggle('is-active', on);
      });
      var allBtn = filtersEl.querySelector('[data-az-category-filter-all]');
      if (allBtn) {
        var allOn = allCategoriesActive();
        allBtn.setAttribute('aria-pressed', allOn ? 'true' : 'false');
        allBtn.classList.toggle('is-active', allOn);
      }
    }

    function setAllCategories(on) {
      Object.keys(activeCategories).forEach(function (key) {
        activeCategories[key] = on;
      });
      syncFilterButtons();
      applyCategoryFilter();
    }

    map.addListener('zoom_changed', function () {
      syncZoomGatedLabels();
      redrawAllLabels();
    });
    map.addListener('bounds_changed', redrawAllLabels);

    var filtersEl = document.querySelector('[data-az-things-to-do-filters]');
    if (filtersEl) {
      var allBtn = filtersEl.querySelector('[data-az-category-filter-all]');
      if (allBtn) {
        allBtn.addEventListener('click', function () {
          setAllCategories(!allCategoriesActive());
        });
      }
      filtersEl.querySelectorAll('[data-az-category-filter]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var cat = btn.getAttribute('data-az-category-filter');
          if (!cat || !(cat in activeCategories)) {
            return;
          }
          activeCategories[cat] = !activeCategories[cat];
          syncFilterButtons();
          applyCategoryFilter();
        });
      });
    }

    map.fitBounds(bounds, { top: 28, right: 28, bottom: 28, left: 28 });

    gmaps.event.addListenerOnce(map, 'idle', function () {
      if (map.getZoom() > fitZoomTarget) {
        map.setZoom(fitZoomTarget);
      }
      syncZoomGatedLabels();
      redrawAllLabels();
      el.classList.remove(calibratingClass);
      el.removeAttribute('aria-busy');
    });
  };
})();
