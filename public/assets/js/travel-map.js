/**
 * Travel page: Google Maps JS API — airport pin + driving route.
 * Styled to match assets/js/accommodation-map.js (warm editorial palette).
 * Config: window.azTravelMap (wp_localize_script).
 *
 * Airport place name uses the same OverlayView HTML label pattern as accommodation-map.js
 * so the marker reads like default Google Maps (pin + label beside it).
 */
(function () {
  'use strict';

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
      this.placement = options.placement || 'e';
      this.className = options.className || '';
      this.zIndex = options.zIndex || '10';
      this.anchorLiftPx =
        typeof options.anchorLiftPx === 'number' ? options.anchorLiftPx : 42;
      this.visible = true;
      this.setMap(map);
    }

    MapHtmlLabel.prototype = Object.create(gmaps.OverlayView.prototype);
    MapHtmlLabel.prototype.constructor = MapHtmlLabel;

    MapHtmlLabel.prototype.onAdd = function () {
      var div = document.createElement('div');
      div.className = 'az-travel-airport-map__place-label ' + this.className;
      div.setAttribute('role', 'presentation');
      div.style.position = 'absolute';
      div.style.zIndex = String(this.zIndex);
      div.style.pointerEvents = 'none';
      div.style.margin = '0';
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

      var gap = 10;
      var pl = this.placement;
      var lift = this.anchorLiftPx;

      this.div.style.position = 'absolute';
      this.div.style.left = pos.x + 'px';
      this.div.style.top = pos.y + 'px';

      switch (pl) {
        case 'n':
          this.div.style.transform =
            'translate(-50%, calc(-100% - ' + (gap + lift) + 'px))';
          break;
        case 's':
          this.div.style.transform = 'translate(-50%, ' + gap + 'px)';
          break;
        case 'e':
          this.div.style.transform = 'translate(' + gap + 'px, -50%)';
          break;
        case 'w':
          this.div.style.transform =
            'translate(calc(-100% - ' + gap + 'px), -50%)';
          break;
        default:
          this.div.style.transform = 'translate(' + gap + 'px, -50%)';
      }

      this.div.style.visibility = this.visible ? 'visible' : 'hidden';
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

  /**
   * @param {typeof google.maps} gmaps
   * @return {function(new:Object, google.maps.Map, google.maps.LatLngLiteral): void}
   */
  function createRouteBadgeClass(gmaps) {
    function RouteBadge(map, position) {
      this.position =
        position instanceof gmaps.LatLng
          ? position
          : new gmaps.LatLng(position.lat, position.lng);
      this.durationText = '';
      this.distanceText = '';
      this.div = null;
      this.setMap(map);
    }

    RouteBadge.prototype = Object.create(gmaps.OverlayView.prototype);
    RouteBadge.prototype.constructor = RouteBadge;

    RouteBadge.prototype.onAdd = function () {
      var div = document.createElement('div');
      div.className = 'az-travel-route__badge';
      div.style.position = 'absolute';
      div.style.pointerEvents = 'none';
      div.innerHTML =
        '<span class="az-travel-route__badge-icon" aria-hidden="true">&#128663;</span>' +
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
      var timeEl = this.div.querySelector('.az-travel-route__badge-time');
      var distEl = this.div.querySelector('.az-travel-route__badge-dist');
      if (timeEl) {
        timeEl.textContent = this.durationText || '';
      }
      if (distEl) {
        distEl.textContent = this.distanceText || '';
      }
    };

    RouteBadge.prototype.update = function (position, durationText, distanceText) {
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
   * @param {string} s
   * @return {string}
   */
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
    return new gmaps.LatLng(
      (a.lat() + b.lat()) / 2,
      (a.lng() + b.lng()) / 2
    );
  }

  /**
   * @return {Array<Object>} Google Maps styling (same spirit as accommodation map)
   */
  function getMapStyles() {
    return [
      { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', stylers: [{ visibility: 'off' }] },
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
  }

  window.azTravelMapInit = function () {
    var cfg = window.azTravelMap;
    if (!cfg || typeof google === 'undefined' || !google.maps) {
      return;
    }

    var gmaps = google.maps;
    var styles = getMapStyles();
    var MapHtmlLabel = createMapHtmlLabelClass(gmaps);
    var RouteBadge = createRouteBadgeClass(gmaps);

    if (cfg.airport && cfg.airport.lat != null && cfg.airport.lng != null) {
      var elAir = document.getElementById('az-travel-airport-map-canvas');
      if (elAir) {
        var zoom =
          typeof cfg.airport.zoom === 'number' && cfg.airport.zoom > 0
            ? cfg.airport.zoom
            : 12;
        var center = { lat: cfg.airport.lat, lng: cfg.airport.lng };
        var mapAir = new gmaps.Map(elAir, {
          center: center,
          zoom: zoom,
          styles: styles,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        new gmaps.Marker({
          position: center,
          map: mapAir,
          title: cfg.airport.title || '',
        });

        var placeTitle =
          (cfg.airport.title && String(cfg.airport.title).trim()) ||
          'Cam Ranh International Airport';
        var airportLabel = new MapHtmlLabel(mapAir, center, placeTitle, {
          placement: 'e',
          className: 'az-travel-airport-map__place-label--pin',
          zIndex: '5000',
          anchorLiftPx: 44,
        });

        function syncAirportLabel() {
          airportLabel.draw();
        }
        gmaps.event.addListenerOnce(mapAir, 'idle', function () {
          google.maps.event.trigger(mapAir, 'resize');
        });
        gmaps.event.addListener(mapAir, 'idle', syncAirportLabel);
        gmaps.event.addListener(mapAir, 'bounds_changed', syncAirportLabel);
      }
    }

    if (
      cfg.route &&
      cfg.route.origin &&
      cfg.route.destination &&
      cfg.route.origin.lat != null &&
      cfg.route.origin.lng != null &&
      cfg.route.destination.lat != null &&
      cfg.route.destination.lng != null
    ) {
      var elRoute = document.getElementById('az-travel-route-map-canvas');
      if (elRoute) {
        var oLat = parseFloat(cfg.route.origin.lat, 10);
        var oLng = parseFloat(cfg.route.origin.lng, 10);
        var dLat = parseFloat(cfg.route.destination.lat, 10);
        var dLng = parseFloat(cfg.route.destination.lng, 10);

        var mapRoute = new gmaps.Map(elRoute, {
          zoom: 10,
          center: {
            lat: (oLat + dLat) / 2,
            lng: (oLng + dLng) / 2,
          },
          styles: styles,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        var directionsService = new gmaps.DirectionsService();
        var directionsRenderer = new gmaps.DirectionsRenderer({
          map: mapRoute,
          suppressMarkers: false,
          preserveViewport: false,
          polylineOptions: {
            strokeColor: '#1a73e8',
            strokeWeight: 5,
            strokeOpacity: 0.95,
          },
        });

        var errEl = document.getElementById('az-travel-route-error');
        function showRouteError(msg) {
          if (errEl) {
            errEl.textContent = msg;
            errEl.hidden = false;
          }
        }
        function clearRouteError() {
          if (errEl) {
            errEl.textContent = '';
            errEl.hidden = true;
          }
        }

        var routeBadge = null;

        directionsService.route(
          {
            origin: new gmaps.LatLng(oLat, oLng),
            destination: new gmaps.LatLng(dLat, dLng),
            travelMode: gmaps.TravelMode.DRIVING,
            region: 'vn',
            unitSystem: gmaps.UnitSystem.METRIC,
            provideRouteAlternatives: true,
          },
          function (response, status) {
            if (status !== 'OK' || !response || !response.routes || !response.routes.length) {
              if (window.console && console.warn) {
                console.warn('Travel route directions:', status, response);
              }
              showRouteError(
                'Driving directions could not be loaded. If this persists, confirm the Directions API is enabled for your Google Cloud project and that this site’s domain is allowed for your API key.'
              );
              return;
            }

            clearRouteError();

            gmaps.event.addListenerOnce(directionsRenderer, 'directions_changed', function () {
              var dir = directionsRenderer.getDirections();
              if (!dir || !dir.routes || !dir.routes.length || !dir.routes[0].legs || !dir.routes[0].legs.length) {
                return;
              }
              var primary = dir.routes[0];
              var leg = primary.legs[0];
              var durationText = leg.duration ? leg.duration.text : '';
              var distanceText = leg.distance ? leg.distance.text : '';
              if (!durationText && !distanceText) {
                return;
              }
              var mid = routeMidLatLng(gmaps, primary);
              if (!routeBadge) {
                routeBadge = new RouteBadge(mapRoute, mid);
              }
              routeBadge.update(
                mid,
                escapeHtml(durationText),
                escapeHtml(distanceText)
              );
            });

            directionsRenderer.setDirections(response);

            gmaps.event.addListenerOnce(mapRoute, 'idle', function () {
              gmaps.event.trigger(mapRoute, 'resize');
            });
          }
        );

        gmaps.event.addListenerOnce(mapRoute, 'idle', function () {
          gmaps.event.trigger(mapRoute, 'resize');
        });
      }
    }
  };
})();
