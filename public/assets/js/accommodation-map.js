/**
 * Google Maps: curated pins from window.azAccommodationMap (accommodation-map.json).
 * Featured resort: red star; hotels: default pins; terminals: green pins.
 * Door-to-door journey: drive → cable car/ferry → island drive (hybrid Directions + static crossing).
 * HTML labels (multi-line, offset). Hotel/terminal names: zoom-gated labels.
 *
 * Init: canvas hidden → fitBounds + zoom calibration → mount all markers/labels → reveal → route.
 * MapHtmlLabel is defined inside the Maps callback — do not reference google.* at file load time.
 */
(function () {
  'use strict';

  /**
   * @param {Array<{ lat: number, lng: number }>} picks
   * @return {{ lat: number, lng: number }|null}
   */
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

  /**
   * Place labels only left/right (Google-like), never above/below.
   * @param {{ lng: number }} p
   * @param {{ lng: number }|null} centroid
   * @param {number} ordinal
   * @return {'e'|'w'}
   */
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

  /**
   * @param {typeof google.maps} gmaps
   * @param {google.maps.DirectionsRoute} route
   * @return {google.maps.LatLng}
   */
  function routeMidLatLng(gmaps, route) {
    var path = route.overview_path;
    if (path && path.length) {
      return path[Math.floor(path.length / 2)];
    }
    var leg = route.legs[0];
    if (!leg) {
      return new gmaps.LatLng(0, 0);
    }
    var a = leg.start_location;
    var b = leg.end_location;
    return new gmaps.LatLng((a.lat() + b.lat()) / 2, (a.lng() + b.lng()) / 2);
  }

  function latLngFromPoint(gmaps, pt) {
    return new gmaps.LatLng(parseFloat(pt.lat, 10), parseFloat(pt.lng, 10));
  }

  function midpointLatLng(gmaps, a, b) {
    return new gmaps.LatLng((a.lat() + b.lat()) / 2, (a.lng() + b.lng()) / 2);
  }

  function hasValidEndpoints(leg) {
    return (
      leg &&
      leg.origin &&
      leg.destination &&
      leg.origin.lat != null &&
      leg.origin.lng != null &&
      leg.destination.lat != null &&
      leg.destination.lng != null
    );
  }

  /**
   * Route summary badge (reuses travel page styles: az-travel-route__badge).
   * @param {typeof google.maps} gmaps
   */
  function createRouteBadgeClass(gmaps) {
    function RouteBadge(map, position, options) {
      options = options || {};
      this.position =
        position instanceof gmaps.LatLng
          ? position
          : new gmaps.LatLng(position.lat, position.lng);
      this.durationText = '';
      this.distanceText = '';
      this.iconHtml = options.iconHtml != null ? options.iconHtml : '&#128663;';
      this.badgeClass = options.badgeClass || '';
      this.div = null;
      this.setMap(map);
    }

    RouteBadge.prototype = Object.create(gmaps.OverlayView.prototype);
    RouteBadge.prototype.constructor = RouteBadge;

    RouteBadge.prototype.onAdd = function () {
      var div = document.createElement('div');
      div.className = 'az-travel-route__badge' + (this.badgeClass ? ' ' + this.badgeClass : '');
      div.style.position = 'absolute';
      div.style.pointerEvents = 'none';
      div.innerHTML =
        '<span class="az-travel-route__badge-icon" aria-hidden="true"></span>' +
        '<span class="az-travel-route__badge-time"></span>' +
        '<span class="az-travel-route__badge-dist"></span>';
      this.div = div;
      this.getPanes().floatPane.appendChild(div);
      this.applyContent();
    };

    RouteBadge.prototype.onRemove = function () {
      if (this.div && this.div.parentNode) {
        this.div.parentNode.removeChild(this.div);
      }
      this.div = null;
    };

    RouteBadge.prototype.draw = function () {
      var projection = this.getProjection();
      if (!projection || !this.div || !this.position) {
        return;
      }
      var pos = projection.fromLatLngToDivPixel(this.position);
      if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') {
        return;
      }
      this.div.style.left = pos.x + 'px';
      this.div.style.top = pos.y + 'px';
      this.div.style.transform = 'translate(12px, -55%)';
    };

    RouteBadge.prototype.applyContent = function () {
      if (!this.div) {
        return;
      }
      var iconEl = this.div.querySelector('.az-travel-route__badge-icon');
      var timeEl = this.div.querySelector('.az-travel-route__badge-time');
      var distEl = this.div.querySelector('.az-travel-route__badge-dist');
      if (iconEl) {
        iconEl.innerHTML = this.iconHtml || '';
      }
      if (timeEl) {
        timeEl.textContent = this.durationText || '';
      }
      if (distEl) {
        distEl.textContent = this.distanceText || '';
      }
    };

    RouteBadge.prototype.update = function (position, durationText, distanceText, options) {
      options = options || {};
      if (options.iconHtml != null) {
        this.iconHtml = options.iconHtml;
      }
      this.position =
        position instanceof gmaps.LatLng
          ? position
          : new gmaps.LatLng(position.lat, position.lng);
      this.durationText = durationText || '';
      this.distanceText = distanceText || '';
      this.applyContent();
      this.draw();
    };

    return RouteBadge;
  }

  /**
   * @param {typeof google.maps} gmaps
   * @return {function(new:Object, google.maps.Map, google.maps.LatLngLiteral, string, Object): void}
   */
  function createMapHtmlLabelClass(gmaps) {
    function MapHtmlLabel(map, position, text, options) {
      options = options || {};
      this.position =
        position instanceof gmaps.LatLng
          ? position
          : new gmaps.LatLng(position.lat, position.lng);
      this.text = text;
      this.placement = options.placement || 'n';
      this.className = options.className || '';
      this.zIndex = options.zIndex || '10';
      /*
       * Pixels: map anchor is the pin tip; the icon extends above the tip. For labels placed
       * above ("n"), we must shift by full icon height + gap or the box overlaps the marker.
       */
      this.anchorLiftPx =
        typeof options.anchorLiftPx === 'number' ? options.anchorLiftPx : 42;
      /* Horizontal offset from pin tip to label (half icon width + gap), like native Maps */
      this.pinHalfWidthPx =
        typeof options.pinHalfWidthPx === 'number' ? options.pinHalfWidthPx : 12;
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
        'az-accommodation-map__html-label az-accommodation-map__html-label--placement-' +
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
      /* overlayMouseTarget sits below floatPane (InfoWindows, route badges) so labels stay visible under popups */
      var pane = this.getPanes().overlayMouseTarget;
      if (pane) {
        pane.appendChild(div);
      } else {
        this.getMap().getDiv().appendChild(div);
      }
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

      var pos = projection.fromLatLngToDivPixel(this.position);
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
      /* Pin head sits above the geographic anchor (tip) */
      var labelLiftY = pl === 'e' || pl === 'w' ? Math.round(lift * 0.45) : 0;
      var div = this.div;

      /*
       * Pixel placement from measured box size — avoids transform(-100%) using the wrong
       * containing block width. text-align is set per side in CSS (--placement-w/e).
       */
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

      switch (pl) {
        case 's':
          left = anchorX - w / 2;
          top = anchorY + hOffset;
          break;
        case 'e':
          left = anchorX + hOffset;
          top = anchorY - h / 2 - labelLiftY;
          break;
        case 'w':
          left = anchorX - hOffset - w;
          top = anchorY - h / 2 - labelLiftY;
          break;
        case 'n':
        default:
          left = anchorX - w / 2;
          top = anchorY - h - hOffset - lift;
      }

      div.style.left = Math.round(left) + 'px';
      div.style.top = Math.round(top) + 'px';
      div.style.visibility = this.visible ? 'visible' : 'hidden';
    };

    MapHtmlLabel.prototype.setVisible = function (on) {
      this.visible = !!on;
      if (this.div) {
        this.div.style.visibility = this.visible ? 'visible' : 'hidden';
        this.div.style.display = '';
      }
      if (this.getMap()) {
        this.draw();
      }
    };

    return MapHtmlLabel;
  }

  window.azAccommodationMapInit = function () {
    var cfg = window.azAccommodationMap;
    if (!cfg || !Array.isArray(cfg.places) || cfg.places.length === 0) {
      return;
    }

    var el = document.getElementById('az-accommodation-map-canvas');
    if (!el || typeof google === 'undefined' || !google.maps) {
      return;
    }

    var gmaps = google.maps;
    var MapHtmlLabel = createMapHtmlLabelClass(gmaps);
    var RouteBadge = createRouteBadgeClass(gmaps);

    var i18n = cfg.i18n || {};
    var mapUi = cfg.mapUi || {};
    var zoomLabelMin =
      typeof mapUi.zoomLabelMin === 'number' && mapUi.zoomLabelMin > 0 ? mapUi.zoomLabelMin : 17;

    var styles = [
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

    var markerBounds = new gmaps.LatLngBounds();
    cfg.places.forEach(function (p) {
      markerBounds.extend(new gmaps.LatLng(p.lat, p.lng));
    });
    var initialCenter = markerBounds.getCenter();
    var calibratingClass = 'az-accommodation-map__canvas--calibrating';

    var map = new gmaps.Map(el, {
      center: initialCenter,
      zoom: 12,
      styles: styles,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    var info = new gmaps.InfoWindow({ maxWidth: 320 });

    var MAP_FIT_PADDING = 28;
    var viewportLocked = false;
    var fitZoomTarget =
      typeof mapUi.fitZoom === 'number' && mapUi.fitZoom > 0 ? mapUi.fitZoom : 15;

    var clusterPoints = cfg.places.filter(function (p) {
      return !p.isWeddingVenue && p.source !== 'terminal';
    });
    var centroid = computeCentroid(clusterPoints);

    var tracked = [];
    var placeEntries = [];
    var pickOrdinal = 0;
    var featuresMounted = false;
    var mapListenersAttached = false;

    function venueStarIcon() {
      /* Match default Google Maps pin red (#EA4335) + darker edge (#C5221F) */
      var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
        '<path fill="#EA4335" stroke="#C5221F" stroke-width="1" stroke-linejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>' +
        '</svg>';
      return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new gmaps.Size(44, 44),
        anchor: new gmaps.Point(22, 44),
      };
    }

    /* Google default pin shape (teardrop + inner dot + stroke); green variant for terminals */
    var GOOGLE_PIN_TEARDROP =
      'M12 0C5.373 0 0 5.373 0 12c0 8.25 12 24 12 24s12-15.75 12-24C24 5.373 18.627 0 12 0z';

    function terminalPinIcon() {
      var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36">' +
        '<path fill="#34A853" stroke="#188038" stroke-width="1" stroke-linejoin="round" d="' +
        GOOGLE_PIN_TEARDROP +
        '"/>' +
        '<circle cx="12" cy="12" r="5.25" fill="#137333"/>' +
        '</svg>';
      return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new gmaps.Size(21, 34),
        anchor: new gmaps.Point(11, 34),
      };
    }

    function labelModeForPlace(p) {
      if (p.isWeddingVenue) {
        return 'venue';
      }
      if (p.source === 'terminal') {
        return 'terminal_zoom';
      }
      if (p.source === 'pick') {
        return 'pick_zoom';
      }
      return 'none';
    }

    cfg.places.forEach(function (p) {
      var pos = { lat: p.lat, lng: p.lng };
      var mode = labelModeForPlace(p);
      var placement = 'e';

      if (p.isWeddingVenue) {
        placement = placementSide(p, centroid, 0);
      } else if (p.source === 'pick') {
        placement = placementSide(p, centroid, pickOrdinal);
        pickOrdinal += 1;
      } else if (p.source === 'terminal') {
        placement = placementSide(p, centroid, 0);
      }

      placeEntries.push({
        place: p,
        pos: pos,
        mode: mode,
        placement: placement,
      });
    });

    function infoWindowHtml(p) {
      var mapsUrl = p.url || '';
      var html =
        '<div class="az-accommodation-map__info">' +
        '<div class="az-accommodation-map__info-title">' +
        escapeHtml(p.title || '') +
        '</div>';

      if (p.pricing) {
        html +=
          '<div class="az-accommodation-map__info-line">' +
          '<span class="az-accommodation-map__info-kicker">' +
          escapeHtml(i18n.labelPricing || 'Pricing') +
          '</span>' +
          ' · ' +
          '<span>' +
          escapeHtml(String(p.pricing).trim()) +
          '</span>' +
          '</div>';
      }

      if (p.areaLifestyle) {
        html +=
          '<div class="az-accommodation-map__info-line az-accommodation-map__info-line--secondary">' +
          nlToBr(p.areaLifestyle) +
          '</div>';
      }

      if (mapsUrl) {
        html +=
          '<a href="#" class="az-accommodation-map__info-link" data-az-maps-link role="button">' +
          escapeHtml(i18n.openInMaps || 'Open in Google Maps') +
          '</a>';
      }

      return html + '</div>';
    }

    function attachInfoMapsLinkHandler(mapsUrl) {
      if (!mapsUrl) {
        return;
      }
      google.maps.event.addListenerOnce(info, 'domready', function () {
        var canvas = document.getElementById('az-accommodation-map-canvas');
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

    function mountMarkersAndLabels() {
      if (featuresMounted) {
        return;
      }
      featuresMounted = true;

      placeEntries.forEach(function (entry) {
        var p = entry.place;
        var pos = entry.pos;
        var markerOpts = {
          position: pos,
          map: map,
          title: p.title || '',
          zIndex: p.isWeddingVenue ? 1000 : p.source === 'terminal' ? 800 : 1,
        };
        if (p.isWeddingVenue) {
          markerOpts.icon = venueStarIcon();
        } else if (p.source === 'terminal') {
          markerOpts.icon = terminalPinIcon();
        }

        var marker = new gmaps.Marker(markerOpts);
        var labelOverlay = null;

        if (entry.mode === 'venue') {
          labelOverlay = new MapHtmlLabel(map, pos, p.title || '', {
            placement: entry.placement,
            className: 'az-accommodation-map__html-label--venue',
            zIndex: '5',
            anchorLiftPx: 44,
            pinHalfWidthPx: 22,
            labelGapPx: 8,
          });
        } else if (entry.mode === 'pick_zoom') {
          labelOverlay = new MapHtmlLabel(map, pos, p.title || '', {
            placement: entry.placement,
            className: 'az-accommodation-map__html-label--pick',
            zIndex: '4',
            anchorLiftPx: 40,
            pinHalfWidthPx: 12,
            labelGapPx: 6,
          });
          labelOverlay.setVisible(false);
        } else if (entry.mode === 'terminal_zoom') {
          labelOverlay = new MapHtmlLabel(map, pos, p.title || '', {
            placement: entry.placement,
            className: 'az-accommodation-map__html-label--terminal',
            zIndex: '4',
            anchorLiftPx: 34,
            pinHalfWidthPx: 11,
            labelGapPx: 6,
          });
          labelOverlay.setVisible(false);
        }

        tracked.push({
          marker: marker,
          labelMode: entry.mode,
          title: p.title || '',
          labelOverlay: labelOverlay,
        });

        marker.addListener('click', function () {
          var mapsUrl = p.url || '';
          info.setContent(infoWindowHtml(p));
          info.open({ anchor: marker, map: map });
          attachInfoMapsLinkHandler(mapsUrl);
        });
      });
    }

    function attachMapListeners() {
      if (mapListenersAttached) {
        return;
      }
      mapListenersAttached = true;
      map.addListener('zoom_changed', function () {
        syncZoomGatedLabels();
        redrawAllLabels();
      });
      map.addListener('bounds_changed', redrawAllLabels);
    }

    function redrawAllLabels() {
      tracked.forEach(function (entry) {
        if (entry.labelOverlay) {
          entry.labelOverlay.draw();
        }
      });
    }

    function syncZoomGatedLabels() {
      var z = map.getZoom();
      var show = z >= zoomLabelMin;
      tracked.forEach(function (entry) {
        if (
          (entry.labelMode === 'pick_zoom' || entry.labelMode === 'terminal_zoom') &&
          entry.labelOverlay
        ) {
          entry.labelOverlay.setVisible(show);
        }
      });
    }

    var journeyBadges = [];
    var journeyIdleRedrawAttached = false;

    function allPlacesInView() {
      var view = map.getBounds();
      if (!view) {
        return false;
      }
      for (var i = 0; i < cfg.places.length; i++) {
        var place = cfg.places[i];
        if (!view.contains(new gmaps.LatLng(place.lat, place.lng))) {
          return false;
        }
      }
      return true;
    }

    function revealMap() {
      mountMarkersAndLabels();
      attachMapListeners();
      el.classList.remove(calibratingClass);
      el.setAttribute('aria-busy', 'false');
      syncZoomGatedLabels();
      redrawAllLabels();
      loadJourneyRoutes();
    }

    function applyMapViewport() {
      if (viewportLocked) {
        return;
      }
      viewportLocked = true;

      if (cfg.places.length === 1) {
        var only = cfg.places[0];
        map.setCenter({ lat: only.lat, lng: only.lng });
        map.setZoom(14);
        revealMap();
        return;
      }

      /* Calibrate while canvas is hidden: fitBounds + binary search, then reveal at final zoom */
      map.fitBounds(markerBounds, MAP_FIT_PADDING);

      gmaps.event.addListenerOnce(map, 'idle', function () {
        var minZoom = map.getZoom();
        var maxZoom = Math.min(fitZoomTarget, 21);

        function setFinalZoom(zoom) {
          if (map.getZoom() !== zoom) {
            map.setZoom(zoom);
            gmaps.event.addListenerOnce(map, 'idle', revealMap);
          } else {
            revealMap();
          }
        }

        if (minZoom >= maxZoom) {
          setFinalZoom(minZoom);
          return;
        }

        function findLargestZoom(low, high, done) {
          if (low >= high) {
            done(low);
            return;
          }
          if (low + 1 === high) {
            map.setZoom(high);
            gmaps.event.addListenerOnce(map, 'idle', function () {
              done(allPlacesInView() ? high : low);
            });
            return;
          }
          var mid = Math.floor((low + high + 1) / 2);
          map.setZoom(mid);
          gmaps.event.addListenerOnce(map, 'idle', function () {
            if (allPlacesInView()) {
              findLargestZoom(mid, high, done);
            } else {
              findLargestZoom(low, mid - 1, done);
            }
          });
        }

        findLargestZoom(minZoom, maxZoom, setFinalZoom);
      });
    }

    var routeLoadStarted = false;

    function attachJourneyBadgeRedraw() {
      if (journeyIdleRedrawAttached) {
        return;
      }
      journeyIdleRedrawAttached = true;
      map.addListener('idle', function () {
        journeyBadges.forEach(function (badge) {
          badge.draw();
        });
      });
    }

    function addJourneyBadge(badge) {
      journeyBadges.push(badge);
      attachJourneyBadgeRedraw();
    }

    function drawCrossingLeg(leg) {
      var origin = latLngFromPoint(gmaps, leg.origin);
      var destination = latLngFromPoint(gmaps, leg.destination);
      /* Dashed crossing — slightly shorter dashes than mid setting */
      var dashSymbol = {
        path: 'M 0,-1.5 0,1.5',
        strokeColor: '#00897b',
        strokeOpacity: 1,
        strokeWeight: 3,
        scale: 1.5,
      };

      new gmaps.Polyline({
        map: map,
        path: [origin, destination],
        geodesic: true,
        strokeOpacity: 0,
        strokeWeight: 0,
        icons: [
          {
            icon: dashSymbol,
            offset: '0',
            repeat: '11px',
          },
        ],
      });

      var mid = midpointLatLng(gmaps, origin, destination);
      var durationText = leg.durationText || '10 min';
      var distanceText = leg.distanceText || leg.label || 'Cable car / ferry';
      var badge = new RouteBadge(map, mid, {
        iconHtml: '&#9973;',
        badgeClass: 'az-travel-route__badge--crossing',
      });
      badge.update(mid, durationText, distanceText);
      addJourneyBadge(badge);
    }

    function requestDrivingLeg(leg, legIndex) {
      var origin = latLngFromPoint(gmaps, leg.origin);
      var destination = latLngFromPoint(gmaps, leg.destination);
      var directionsService = new gmaps.DirectionsService();
      var directionsRenderer = new gmaps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        preserveViewport: true,
        polylineOptions: {
          strokeColor: '#1a73e8',
          strokeWeight: 5,
          strokeOpacity: 0.95,
          zIndex: 10 + legIndex,
        },
      });

      directionsService.route(
        {
          origin: origin,
          destination: destination,
          travelMode: gmaps.TravelMode.DRIVING,
          region: 'vn',
          unitSystem: gmaps.UnitSystem.METRIC,
        },
        function (response, status) {
          if (status !== 'OK' || !response || !response.routes || !response.routes.length) {
            if (window.console && console.warn) {
              console.warn('Accommodation journey driving leg:', leg.id || legIndex, status, response);
            }
            return;
          }

          gmaps.event.addListenerOnce(directionsRenderer, 'directions_changed', function () {
            var dir = directionsRenderer.getDirections();
            if (!dir || !dir.routes || !dir.routes.length) {
              return;
            }
            var primary = dir.routes[0];
            var routeLeg = primary.legs && primary.legs[0];
            if (!routeLeg) {
              return;
            }
            var durationText = routeLeg.duration ? routeLeg.duration.text : '';
            var distanceText = routeLeg.distance ? routeLeg.distance.text : '';
            if (!durationText && !distanceText) {
              return;
            }
            var mid = routeMidLatLng(gmaps, primary);
            var badge = new RouteBadge(map, mid, { iconHtml: '&#128663;' });
            badge.update(mid, escapeHtml(durationText), escapeHtml(distanceText));
            addJourneyBadge(badge);
          });

          directionsRenderer.setDirections(response);
        }
      );
    }

    function loadJourneyRoutes() {
      if (routeLoadStarted) {
        return;
      }
      routeLoadStarted = true;

      var legs = cfg.journeyLegs;
      if (!legs || !legs.length) {
        var legacy = cfg.hotelToTerminalRoute;
        if (hasValidEndpoints(legacy)) {
          legs = [{ id: 'legacy', mode: 'driving', origin: legacy.origin, destination: legacy.destination }];
        } else {
          return;
        }
      }

      legs.forEach(function (leg, index) {
        if (!hasValidEndpoints(leg)) {
          return;
        }
        if (leg.mode === 'crossing') {
          drawCrossingLeg(leg);
        } else if (leg.mode === 'driving' || !leg.mode) {
          requestDrivingLeg(leg, index);
        }
      });
    }

    applyMapViewport();
  };
})();
