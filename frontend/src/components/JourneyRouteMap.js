import React, { useState, useEffect } from 'react';
import { Platform, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * Builds the Leaflet HTML page with OpenStreetMap tiles, live GPS tracker,
 * draggable departure pin (Home/Office/School/Uni), tap-to-relocate,
 * destination marker, and real driving road polyline fetched from OSRM.
 */
function buildJourneyMapHtml(originName, originCoords, destinationName, destCoords) {
  const oLat = Number(originCoords?.[0]) || 33.7667;
  const oLon = Number(originCoords?.[1]) || 72.3667;
  const dLat = Number(destCoords?.[0]) || 34.7994;
  const dLon = Number(destCoords?.[1]) || 72.5725;

  const safeOrigin = (originName || 'Current Location').replace(/[<>'"]/g, '');
  const safeDest = (destinationName || 'Destination').replace(/[<>'"]/g, '');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <style>
    html, body { height: 100%; width: 100%; margin: 0; padding: 0; }
    body { background: #eaf1ea; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; position: relative; }
    #map { position: absolute; top: 0; bottom: 0; left: 0; right: 0; width: 100%; height: 100%; margin: 0; padding: 0; }
    
    /* Top floating journey badge */
    .journey-hud {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      z-index: 1000;
      background: rgba(23, 79, 54, 0.94);
      backdrop-filter: blur(6px);
      color: #ffffff;
      padding: 8px 12px;
      border-radius: 10px;
      font-size: 11px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      display: flex;
      justify-content: space-between;
      align-items: center;
      pointer-events: auto;
    }
    .journey-hud-title {
      font-weight: 700;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }
    .journey-hud-metrics {
      display: flex;
      gap: 8px;
      font-weight: 600;
      font-size: 11px;
      color: #bbf7d0;
      white-space: nowrap;
    }
    .hud-badge {
      background: rgba(255,255,255,0.18);
      padding: 2px 7px;
      border-radius: 6px;
    }

    /* Floating Tip / Instruction Banner */
    .map-tip-pill {
      position: absolute;
      top: 52px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 999;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid #86efac;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      color: #166534;
      pointer-events: none;
      white-space: nowrap;
    }

    /* Start Marker Pin (Emerald Green) */
    .pin-start {
      background: #15803d;
      color: #ffffff;
      border: 2.5px solid #ffffff;
      border-radius: 50%;
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(21, 128, 61, 0.55);
      animation: pulse-ring 2.2s infinite ease-out;
      cursor: grab;
    }
    .pin-start:active {
      cursor: grabbing;
      transform: scale(1.1);
    }

    /* Destination Marker Pin (Crimson Red) */
    .pin-dest {
      background: #dc2626;
      color: #ffffff;
      border: 2.5px solid #ffffff;
      border-radius: 50%;
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.5);
    }

    /* Live GPS Pulsing Blue Dot (Google Maps Style) */
    .gps-pulse-wrap {
      position: relative;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .gps-pulse-ring {
      position: absolute;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.35);
      animation: gps-wave 1.8s infinite ease-out;
    }
    .gps-pulse-core {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #2563eb;
      border: 2.5px solid #ffffff;
      box-shadow: 0 0 6px rgba(37, 99, 235, 0.8);
    }
    @keyframes gps-wave {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(2.2); opacity: 0; }
    }

    @keyframes pulse-ring {
      0% { box-shadow: 0 0 0 0 rgba(21, 128, 61, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(21, 128, 61, 0); }
      100% { box-shadow: 0 0 0 0 rgba(21, 128, 61, 0); }
    }

    /* Leaflet popup styling */
    .leaflet-popup-content-wrapper {
      border-radius: 10px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    }
    .popup-label {
      font-weight: 700;
      font-size: 12px;
      color: #174f36;
      margin-bottom: 2px;
    }
    .popup-sub {
      font-size: 11px;
      color: #556b5f;
    }

    /* Bottom Floating Action Controls */
    .map-controls-dock {
      position: absolute;
      bottom: 10px;
      right: 10px;
      z-index: 1000;
      display: flex;
      gap: 6px;
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(6px);
      padding: 5px 8px;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
      border: 1px solid #d1e3d6;
    }
    .map-ctrl-btn {
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      color: #166534;
      padding: 6px 11px;
      border-radius: 7px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      transition: all 0.2s ease;
      user-select: none;
    }
    .map-ctrl-btn:hover, .map-ctrl-btn:active {
      background: #15803d;
      color: #ffffff;
      border-color: #15803d;
      transform: translateY(-1px);
    }
    .map-ctrl-btn-gps {
      background: #eff6ff;
      border-color: #60a5fa;
      color: #1d4ed8;
    }
    .map-ctrl-btn-gps:hover, .map-ctrl-btn-gps:active {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
    }
    .map-ctrl-btn-dest {
      background: #fef2f2;
      border-color: #fca5a5;
      color: #991b1b;
    }
    .map-ctrl-btn-dest:hover, .map-ctrl-btn-dest:active {
      background: #dc2626;
      color: #ffffff;
      border-color: #dc2626;
    }
    .map-ctrl-btn-full {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #334155;
    }
    .map-ctrl-btn-full:hover, .map-ctrl-btn-full:active {
      background: #475569;
      color: #ffffff;
      border-color: #475569;
    }
    .map-search-bar-wrap {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 1000;
      width: 240px;
      max-width: calc(100vw - 160px);
    }
    .map-search-input {
      width: 100%;
      padding: 7px 12px;
      font-size: 11px;
      font-weight: 600;
      color: #0f172a;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid #94a3b8;
      border-radius: 20px;
      outline: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.18);
      box-sizing: border-box;
      backdrop-filter: blur(4px);
    }
    .map-search-input:focus {
      border-color: #15803d;
      background: #ffffff;
      box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.2);
    }
    .map-search-dropdown {
      position: absolute;
      top: 36px;
      left: 0;
      right: 0;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      max-height: 180px;
      overflow-y: auto;
      z-index: 1100;
      border: 1px solid #e2e8f0;
    }
    .map-search-item {
      padding: 7px 10px;
      font-size: 11px;
      color: #334155;
      cursor: pointer;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      gap: 6px;
      line-height: 1.3;
    }
    .map-search-item:hover {
      background: #f0fdf4;
      color: #15803d;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="journey-hud">
    <div class="journey-hud-title">
      <span id="hud-origin-link" style="cursor: pointer; text-decoration: underline;" title="Tap to zoom to departure location">From: <span id="hud-origin-text">${safeOrigin}</span></span>
      <span style="color:#86efac; margin: 0 4px;">&rarr;</span>
      <span id="hud-dest-link" style="cursor: pointer; text-decoration: underline;" title="Tap to zoom to destination">To: ${safeDest}</span>
    </div>
    <div class="journey-hud-metrics" id="hud-metrics">
      <span class="hud-badge" id="hud-dist">Calculating route...</span>
    </div>
  </div>

  <div class="map-search-bar-wrap">
    <input type="text" id="map-street-search" class="map-search-input" placeholder="Search address, neighborhood, university, colony..." autocomplete="off" />
    <div id="map-search-dropdown" class="map-search-dropdown" style="display:none;"></div>
  </div>

  <div class="map-tip-pill">
    Tap map or drag pin to set exact departure location
  </div>

  <div class="map-controls-dock">
    <button type="button" class="map-ctrl-btn map-ctrl-btn-gps" id="btn-zoom-gps" title="Find my real GPS location">
      Live GPS
    </button>
    <button type="button" class="map-ctrl-btn" id="btn-zoom-home" title="Zoom to Departure Location">
      My Location
    </button>
    <button type="button" class="map-ctrl-btn map-ctrl-btn-full" id="btn-zoom-full" title="View Full Route">
      Full Route
    </button>
    <button type="button" class="map-ctrl-btn map-ctrl-btn-dest" id="btn-zoom-dest" title="Zoom to Destination">
      Destination
    </button>
  </div>

  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <script>
    try {
      let curOLat = ${oLat};
      let curOLon = ${oLon};
      const dLat = ${dLat};
      const dLon = ${dLon};
      let curOName = ${JSON.stringify(safeOrigin)};
      const dName = ${JSON.stringify(safeDest)};

      const map = L.map('map', {
        zoomControl: true,
        attributionControl: false
      }).setView([(curOLat + dLat) / 2, (curOLon + dLon) / 2], 7);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      // Start Marker (User / Current Location - Draggable!)
      const startIcon = L.divIcon({
        className: '',
        html: '<div class="pin-start" title="Drag to set your exact location"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>',
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
      const startMarker = L.marker([curOLat, curOLon], { icon: startIcon, zIndexOffset: 1000, draggable: true })
        .addTo(map)
        .bindPopup('<div class="popup-label"><span id="popup-origin-name">' + curOName + '</span></div><div class="popup-sub">Departure Point (Home / Office / School / Uni)</div><div style="margin-top:4px;font-size:10px;color:#15803d;font-weight:700;">Drag pin or tap anywhere on map to change location</div>');

      // Destination Marker
      const destIcon = L.divIcon({
        className: '',
        html: '<div class="pin-dest" title="Destination"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg></div>',
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
      const destMarker = L.marker([dLat, dLon], { icon: destIcon })
        .addTo(map)
        .bindPopup('<div class="popup-label">' + dName + '</div><div class="popup-sub">Final Destination</div>');

      // Live GPS Tracker Blue Dot & Accuracy Circle
      let gpsMarker = null;
      let gpsAccuracyCircle = null;

      const gpsDotIcon = L.divIcon({
        className: '',
        html: '<div class="gps-pulse-wrap" title="Your Live GPS Position"><div class="gps-pulse-ring"></div><div class="gps-pulse-core"></div></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      // Show Live GPS Blue Dot at the detected origin coords
      gpsAccuracyCircle = L.circle([curOLat, curOLon], { radius: 100, color: '#3b82f6', fillColor: '#93c5fd', fillOpacity: 0.22, weight: 1.5 }).addTo(map);
      gpsMarker = L.marker([curOLat, curOLon], { icon: gpsDotIcon, zIndexOffset: 2000 }).addTo(map);
      gpsMarker.bindPopup('<b>Live GPS Location</b><br>' + curOName + '<br><small>Coordinates: ' + curOLat.toFixed(4) + '° N, ' + curOLon.toFixed(4) + '° E</small>');

      map.on('locationfound', function(e) {
        if (gpsMarker) {
          gpsMarker.setLatLng(e.latlng);
          gpsAccuracyCircle.setLatLng(e.latlng);
          gpsAccuracyCircle.setRadius(e.accuracy);
          gpsMarker.bindPopup('<b>Live GPS Location</b><br><small>Accuracy: ~' + Math.round(e.accuracy) + 'm</small>');
        }
      });

      // Continuous high accuracy device GPS tracking
      try {
        map.locate({ watch: true, enableHighAccuracy: true });
      } catch(_) {}

      let currentRouteLines = [];
      let fullBounds = null;

      // Draw Driving Route Function via OSRM
      function fetchRoute(fromLat, fromLon, toLat, toLon) {
        // Clear previous lines
        currentRouteLines.forEach(l => map.removeLayer(l));
        currentRouteLines = [];

        document.getElementById('hud-metrics').innerHTML = '<span class="hud-badge">Calculating road route...</span>';

        const osrmUrl = 'https://router.project-osrm.org/route/v1/driving/' + fromLon + ',' + fromLat + ';' + toLon + ',' + toLat + '?overview=full&geometries=geojson';

        let routeDrawn = false;
        function drawFallback() {
          if (routeDrawn) return;
          const fallbackCoords = [[fromLat, fromLon], [(fromLat + toLat) / 2 + 0.1, (fromLon + toLon) / 2 + 0.1], [toLat, toLon]];
          const fbLine = L.polyline(fallbackCoords, {
            color: '#15803d',
            weight: 5,
            opacity: 0.9,
            dashArray: '8 8',
            lineJoin: 'round'
          }).addTo(map);
          currentRouteLines.push(fbLine);
          fullBounds = fbLine.getBounds();
          const R = 6371;
          const dLatRad = (toLat - fromLat) * Math.PI / 180;
          const dLonRad = (toLon - fromLon) * Math.PI / 180;
          const a = Math.sin(dLatRad/2) * Math.sin(dLatRad/2) + Math.cos(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) * Math.sin(dLonRad/2) * Math.sin(dLonRad/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const estRoadKm = Math.round(R * c * 1.35);
          const estHours = (estRoadKm / 65).toFixed(1);
          document.getElementById('hud-metrics').innerHTML =
            '<span class="hud-badge">' + estRoadKm + ' km</span>' +
            '<span class="hud-badge">' + estHours + ' hrs</span>';
        }

        const timeoutId = setTimeout(drawFallback, 3500);

        fetch(osrmUrl)
          .then(res => res.json())
          .then(data => {
            clearTimeout(timeoutId);
            if (data && data.routes && data.routes.length > 0) {
              routeDrawn = true;
              const route = data.routes[0];
              const rawCoords = route.geometry.coordinates.map(pt => [pt[1], pt[0]]);
              const coordinates = [[fromLat, fromLon], ...rawCoords, [toLat, toLon]];

              const glowLine = L.polyline(coordinates, {
                color: '#86efac',
                weight: 8,
                opacity: 0.5,
                lineJoin: 'round'
              }).addTo(map);
              currentRouteLines.push(glowLine);

              const mainLine = L.polyline(coordinates, {
                color: '#15803d',
                weight: 5,
                opacity: 0.95,
                lineJoin: 'round'
              }).addTo(map);
              currentRouteLines.push(mainLine);

              fullBounds = mainLine.getBounds();

              const distKm = Math.round(route.distance / 1000);
              const totalMins = Math.round(route.duration / 60);
              const hrs = Math.floor(totalMins / 60);
              const mins = totalMins % 60;
              const timeStr = hrs > 0 ? (hrs + 'h ' + mins + 'm') : (mins + 'm');

              document.getElementById('hud-metrics').innerHTML =
                '<span class="hud-badge">' + distKm + ' km</span>' +
                '<span class="hud-badge">' + timeStr + ' drive</span>';
            } else {
              drawFallback();
            }
          })
          .catch(() => drawFallback());
      }

      // Initial route fetch
      fetchRoute(curOLat, curOLon, dLat, dLon);

      // Relocate / Update Departure Point Function
      async function updateDeparturePoint(lat, lon, knownName) {
        curOLat = lat;
        curOLon = lon;
        startMarker.setLatLng([lat, lon]);

        let resolvedName = knownName;
        if (!resolvedName) {
          try {
            const revRes = await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + lat + '&lon=' + lon + '&accept-language=en');
            const revData = await revRes.json();
            const addr = revData.address || {};
            const specific = addr.amenity || addr.building || addr.neighbourhood || addr.suburb || addr.residential || addr.hamlet || addr.road || addr.village || addr.city_district || addr.town || addr.city;
            const city = addr.city || addr.town || addr.county || '';
            if (specific && city && !specific.toLowerCase().includes(city.toLowerCase())) {
              resolvedName = specific + ', ' + city;
            } else if (specific) {
              resolvedName = specific;
            } else if (city) {
              resolvedName = city;
            } else {
              resolvedName = 'Selected Spot (' + lat.toFixed(4) + '°, ' + lon.toFixed(4) + '°)';
            }
          } catch(e) {
            resolvedName = 'Selected Spot (' + lat.toFixed(4) + '°, ' + lon.toFixed(4) + '°)';
          }
        }

        curOName = resolvedName;
        const hudOrigText = document.getElementById('hud-origin-text');
        if (hudOrigText) hudOrigText.innerText = resolvedName;
        const popupName = document.getElementById('popup-origin-name');
        if (popupName) popupName.innerText = resolvedName;

        startMarker.bindPopup('<div class="popup-label"><span id="popup-origin-name">' + resolvedName + '</span></div><div class="popup-sub">Departure Point (Home / Office / School / Uni)</div><div style="margin-top:4px;font-size:10px;color:#15803d;font-weight:700;">Exact Location & Streets Active</div>');
        startMarker.openPopup();

        // Redraw route from new spot
        fetchRoute(lat, lon, dLat, dLon);

        // Notify parent React Native Web application
        if (window.parent) {
          window.parent.postMessage({
            type: 'UPDATE_START_LOCATION',
            lat: lat,
            lon: lon,
            name: resolvedName
          }, '*');
        }
      }

      // 1. DRAG START PIN DIRECTLY TO HOME / OFFICE / SCHOOL / UNI
      startMarker.on('dragend', function() {
        const pt = startMarker.getLatLng();
        updateDeparturePoint(pt.lat, pt.lng);
      });

      // 2. TAP / CLICK ANYWHERE ON MAP TO SET DEPARTURE POINT
      map.on('click', function(e) {
        updateDeparturePoint(e.latlng.lat, e.latlng.lng);
      });

      // Button Handlers
      document.getElementById('btn-zoom-home').onclick = function() {
        map.flyTo([curOLat, curOLon], 18, { animate: true, duration: 1.2 });
        startMarker.openPopup();
      };
      document.getElementById('btn-zoom-dest').onclick = function() {
        map.flyTo([dLat, dLon], 15, { animate: true, duration: 1.2 });
        destMarker.openPopup();
      };
      document.getElementById('btn-zoom-full').onclick = function() {
        if (fullBounds) {
          map.fitBounds(fullBounds, { padding: [55, 55] });
        } else {
          map.fitBounds([[curOLat, curOLon], [dLat, dLon]], { padding: [55, 55] });
        }
      };

      // 3. LIVE GPS BUTTON: Center on device GPS & relocate start pin
      document.getElementById('btn-zoom-gps').onclick = function() {
        if (gpsMarker) {
          map.flyTo(gpsMarker.getLatLng(), 17, { animate: true, duration: 1.2 });
          gpsMarker.openPopup();
          return;
        }
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            function(pos) {
              const lat = pos.coords.latitude;
              const lon = pos.coords.longitude;
              map.flyTo([lat, lon], 17, { animate: true, duration: 1.2 });
              updateDeparturePoint(lat, lon);
            },
            function(err) {
              map.flyTo([curOLat, curOLon], 17, { animate: true, duration: 1.2 });
              startMarker.openPopup();
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
          );
        } else {
          map.flyTo([curOLat, curOLon], 17, { animate: true, duration: 1.2 });
          startMarker.openPopup();
        }
      };

      const hudOriginEl = document.getElementById('hud-origin-link');
      if (hudOriginEl) {
        hudOriginEl.onclick = function() {
          map.flyTo([curOLat, curOLon], 18, { animate: true, duration: 1.2 });
          startMarker.openPopup();
        };
      }
      const hudDestEl = document.getElementById('hud-dest-link');
      if (hudDestEl) {
        hudDestEl.onclick = function() {
          map.flyTo([dLat, dLon], 15, { animate: true, duration: 1.2 });
          destMarker.openPopup();
        };
      }

      // 4. In-Map Live Search Input (for Home, Uni, Office, Colony, etc.)
      const searchInput = document.getElementById('map-street-search');
      const searchDropdown = document.getElementById('map-search-dropdown');
      let searchTimer = null;

      if (searchInput && searchDropdown) {
        searchInput.addEventListener('input', function() {
          const query = searchInput.value.trim();
          clearTimeout(searchTimer);
          if (query.length < 2) {
            searchDropdown.style.display = 'none';
            searchDropdown.innerHTML = '';
            return;
          }

          searchTimer = setTimeout(async function() {
            try {
              const sUrl = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query) + '&countrycodes=pk&addressdetails=1&limit=5';
              const res = await fetch(sUrl);
              const items = await res.json();
              if (Array.isArray(items) && items.length > 0) {
                searchDropdown.innerHTML = '';
                items.forEach(function(item) {
                  const div = document.createElement('div');
                  div.className = 'map-search-item';
                  const title = item.name || item.display_name.split(',')[0];
                  div.innerHTML = '<span><b>' + title + '</b><br><small style=\"color:#64748b;\">' + item.display_name.slice(0, 48) + '...</small></span>';
                  div.onclick = function() {
                    const lat = parseFloat(item.lat);
                    const lon = parseFloat(item.lon);
                    map.flyTo([lat, lon], 17, { animate: true, duration: 1.2 });
                    updateDeparturePoint(lat, lon, title);
                    searchDropdown.style.display = 'none';
                    searchInput.value = title;
                  };
                  searchDropdown.appendChild(div);
                });
                searchDropdown.style.display = 'block';
              } else {
                searchDropdown.style.display = 'none';
              }
            } catch (_) {
              searchDropdown.style.display = 'none';
            }
          }, 350);
        });

        document.addEventListener('click', function(ev) {
          if (!searchInput.contains(ev.target) && !searchDropdown.contains(ev.target)) {
            searchDropdown.style.display = 'none';
          }
        });
      }

      setTimeout(() => { map.invalidateSize(); }, 300);
    } catch(e) {
      console.error('Leaflet map error:', e);
    }
  </script>
</body>
</html>`;
}

export default function JourneyRouteMap({
  originName = 'Current Location',
  originCoords = [33.7667, 72.3667],
  destinationName = 'Malam Jabba',
  destCoords = [34.7994, 72.5725],
  height = 320,
  style,
}) {
  const html = buildJourneyMapHtml(originName, originCoords, destinationName, destCoords);
  const mapKey = `${originName}-${originCoords?.[0]}-${originCoords?.[1]}-${destinationName}-${destCoords?.[0]}-${destCoords?.[1]}`;

  if (Platform.OS === 'web') {
    const pixelHeight = typeof height === 'number' ? `${height}px` : (height || '360px');
    return (
      <View style={[styles.container, { height }, style]}>
        {React.createElement('iframe', {
          key: mapKey,
          title: 'Live Journey Route Map',
          srcDoc: html,
          allow: 'geolocation; camera; microphone',
          style: {
            width: '100%',
            height: pixelHeight,
            minHeight: pixelHeight,
            border: 'none',
            borderRadius: 12,
            display: 'block',
            backgroundColor: '#eaf1ea',
          },
        })}
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }, style]}>
      <WebView
        key={mapKey}
        source={{ html }}
        originWhitelist={['*']}
        style={{ flex: 1, borderRadius: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#eaf1ea',
    borderWidth: 1,
    borderColor: '#d1e3d6',
    marginTop: 10,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
});
