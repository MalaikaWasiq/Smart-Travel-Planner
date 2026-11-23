import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

function mapHtml(props) {
  const {
    routeDay,
    originName = 'Current Location',
    originCoords = [33.7667, 72.3667],
    destinationName = 'Malam Jabba',
    destCoords = [34.7994, 72.5725],
    routeType = 'motorway', // 'motorway' | 'gt_road'
    roadBlock = null,
    vehicleCoords = null,
    currentLocationLabel = '',
    hasArrived = false,
    currentStageIndex = 0,
  } = props || {};

  const inPakistan = (latitude, longitude) =>
    Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= 23.4 && latitude <= 37.2 && longitude >= 60.8 && longitude <= 77.9;

  // Process itinerary scenic stops for the selected destination
  const rawStops = (props?.itineraryMarkers && props.itineraryMarkers.length > 0)
    ? props.itineraryMarkers
    : (routeDay?.activities || []);

  const itineraryMarkers = rawStops
    .map((item, index) => ({
      index: item.index || index + 1,
      label: item.place || `Stop ${index + 1}`,
      time: item.time || '',
      lat: Number(item.lat ?? item.latitude),
      lon: Number(item.lon ?? item.longitude),
    }))
    .filter((item) => inPakistan(item.lat, item.lon));

  const oLat = Number(originCoords?.[0]) || 33.7667;
  const oLon = Number(originCoords?.[1]) || 72.3667;
  const dLat = Number(destCoords?.[0]) || 34.7994;
  const dLon = Number(destCoords?.[1]) || 72.5725;

  const hasRoute = Boolean(
    props?.hasRoute !== false &&
    destinationName &&
    String(destinationName).trim().length > 0 &&
    String(destinationName).trim().toLowerCase() !== 'destination'
  );

  const safeOrigin = (originName || 'Current Location').replace(/[<>'"]/g, '');
  const safeDest = hasRoute ? (destinationName || 'Destination').replace(/[<>'"]/g, '') : '';
  const safeLocationLabel = (currentLocationLabel || safeOrigin).replace(/[<>'"]/g, '');

  const payload = JSON.stringify({
    oLat,
    oLon,
    dLat,
    dLon,
    safeOrigin,
    safeDest,
    safeLocationLabel,
    hasRoute,
    routeType: routeType || 'motorway',
    roadBlock,
    itineraryMarkers: hasRoute ? itineraryMarkers : [],
    vehicleCoords: vehicleCoords || [oLat, oLon],
    hasArrived: !!hasArrived,
    currentStageIndex: Number(currentStageIndex) || 0,
    status: routeDay?.status,
  }).replace(/</g, '\\u003c');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="">
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; }
    body { background: #eaf1ea; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
    .leaflet-control-attribution { font-size: 8px; background: rgba(255,255,255,0.7); }

    /* Top GPS HUD bar (Matches JourneyRouteMap style) */
    .gps-hud {
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
      box-shadow: 0 4px 14px rgba(0,0,0,0.3);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .gps-hud-route {
      font-weight: 700;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .gps-hud-stats {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .stat-pill {
      background: rgba(255,255,255,0.18);
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 11px;
      color: #bbf7d0;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
    }
    .stat-pill-active-motorway {
      background: #15803d;
      color: #ffffff;
      box-shadow: 0 0 0 2px #86efac;
    }
    .stat-pill-active-gt {
      background: #2563eb;
      color: #ffffff;
      box-shadow: 0 0 0 2px #93c5fd;
    }
    .delay-pill {
      background: #dc2626;
      color: #ffffff;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 11px;
      animation: blink-delay 1.5s infinite;
      cursor: pointer;
    }
    @keyframes blink-delay {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.65; }
    }

    /* Live Moving Vehicle Pin */
    .pin-vehicle {
      background: #0284c7;
      color: #ffffff;
      border: 2.5px solid #ffffff;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.5);
      animation: pulse-vehicle 1.6s infinite ease-out;
    }
    .pin-arrived {
      background: #16a34a;
      box-shadow: 0 0 0 5px rgba(22, 163, 74, 0.55);
      animation: pulse-arrived 1.4s infinite ease-out;
    }

    /* Start Marker Pin */
    .pin-start {
      background: #15803d;
      color: #ffffff;
      border: 2.5px solid #ffffff;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      box-shadow: 0 4px 10px rgba(21, 128, 61, 0.6);
      animation: pulse-start 2s infinite ease-out;
    }

    /* Destination Marker Pin */
    .pin-dest {
      background: #dc2626;
      color: #ffffff;
      border: 2.5px solid #ffffff;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      box-shadow: 0 4px 10px rgba(220, 38, 38, 0.6);
    }

    /* RED HAZARD / ROAD BLOCK PIN (Requested by User) */
    .pin-hazard {
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
      box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.5);
      animation: pulse-hazard 1.4s infinite;
      cursor: pointer;
    }

    /* Highway Tag Pill on Map */
    .highway-tag {
      background: #15803d;
      color: #ffffff;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 800;
      border: 1.5px solid #ffffff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      white-space: nowrap;
      cursor: pointer;
    }
    .highway-tag-gt {
      background: #2563eb;
    }

    /* Numbered Itinerary Activity Marker */
    .marker-pin {
      background: #174f36;
      color: #ffffff;
      border: 2px solid #ffffff;
      border-radius: 50%;
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 11px;
      box-shadow: 0 3px 6px rgba(0,0,0,0.35);
      text-align: center;
      line-height: 22px;
    }

    @keyframes pulse-start {
      0% { box-shadow: 0 0 0 0 rgba(21, 128, 61, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(21, 128, 61, 0); }
      100% { box-shadow: 0 0 0 0 rgba(21, 128, 61, 0); }
    }
    @keyframes pulse-vehicle {
      0% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.7); }
      70% { box-shadow: 0 0 0 12px rgba(2, 132, 199, 0); }
      100% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0); }
    }
    @keyframes pulse-arrived {
      0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.8); }
      70% { box-shadow: 0 0 0 14px rgba(22, 163, 74, 0); }
      100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
    }
    @keyframes pulse-hazard {
      0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.8); transform: scale(1); }
      50% { box-shadow: 0 0 0 9px rgba(220, 38, 38, 0); transform: scale(1.08); }
      100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); transform: scale(1); }
    }

    /* Leaflet Popups */
    .leaflet-popup-content-wrapper { border-radius: 10px; padding: 5px; box-shadow: 0 4px 16px rgba(0,0,0,0.25); max-width: 290px; }
    .popup-title { font-weight: 800; font-size: 12px; color: #153226; margin-bottom: 2px; }
    .popup-subtitle { font-size: 11px; color: #5a7366; font-weight: 600; }
    
    /* Hazard Popup Specifics */
    .popup-hazard-title { font-weight: 900; font-size: 12px; color: #dc2626; margin-bottom: 4px; display: flex; align-items: center; gap: 4px; }
    .popup-hazard-loc { font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
    .popup-hazard-box-speed {
      background: #fee2e2;
      border-left: 3px solid #dc2626;
      padding: 5px 7px;
      border-radius: 4px;
      font-size: 10.5px;
      color: #991b1b;
      font-weight: 700;
      margin-bottom: 4px;
      line-height: 14px;
    }
    .popup-hazard-box-const {
      background: #fef3c7;
      border-left: 3px solid #d97706;
      padding: 5px 7px;
      border-radius: 4px;
      font-size: 10px;
      color: #92400e;
      font-weight: 600;
      margin-bottom: 4px;
      line-height: 14px;
    }
    .popup-hazard-detour {
      font-size: 10px;
      color: #15803d;
      font-weight: 700;
      margin-top: 3px;
    }

    /* Bottom Route Legend */
    .route-legend {
      position: absolute;
      bottom: 12px;
      left: 10px;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(4px);
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.18);
      display: flex;
      flex-direction: column;
      gap: 4px;
      border: 1px solid #cbd5e1;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }
    .legend-line-shortest {
      width: 18px;
      height: 4px;
      background: #15803d;
      border-radius: 2px;
    }
    .legend-line-alt {
      width: 18px;
      height: 4px;
      background: #2563eb;
      border-radius: 2px;
      border-style: dashed;
    }
    .legend-text {
      font-weight: 700;
      color: #1e293b;
    }

    /* Bottom Floating Action Controls */
    .map-controls-dock {
      position: absolute;
      bottom: 12px;
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
      background: #eff6ff;
      border-color: #93c5fd;
      color: #1e40af;
    }
    .map-ctrl-btn-full:hover, .map-ctrl-btn-full:active {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
    }
  </style>
</head>
<body>
<div class="gps-hud">
  <div class="gps-hud-route" id="hud-route">
    <span id="hud-orig-link" style="cursor: pointer; text-decoration: underline;" title="Tap to zoom to your exact house & streets">📍 <span id="hud-orig">...</span></span>
    <span style="color:#86efac;">➔</span>
    <span id="hud-dest-link" style="cursor: pointer; text-decoration: underline;" title="Tap to zoom to destination">🏁 <span id="hud-dest">...</span></span>
  </div>
  <div class="gps-hud-stats" id="hud-stats">
    <span class="stat-pill stat-pill-active-motorway" id="hud-shortest">⚡ Shortest: Calculating...</span>
    <span class="stat-pill" id="hud-alt">🚗 Alt GT Road: Calculating...</span>
  </div>
</div>

<div id="map"></div>

<div class="map-controls-dock">
  <button type="button" class="map-ctrl-btn" id="btn-osm-home" title="Zoom directly to your house and streets">
    📍 My Location (Streets)
  </button>
  <button type="button" class="map-ctrl-btn map-ctrl-btn-full" id="btn-osm-full" title="View Full Route">
    🗺️ Full Route
  </button>
  <button type="button" class="map-ctrl-btn map-ctrl-btn-dest" id="btn-osm-dest" title="Zoom to Destination">
    🏁 Destination
  </button>
</div>

<div class="route-legend">
  <div class="legend-item" id="legend-shortest">
    <div class="legend-line-shortest"></div>
    <span class="legend-text">⚡ Shortest Route (Motorway)</span>
  </div>
  <div class="legend-item" id="legend-alt">
    <div class="legend-line-alt"></div>
    <span class="legend-text">🚗 Alternative Route (GT Road)</span>
  </div>
</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<script>
  try {
    const data = ${payload};
    document.getElementById('hud-orig').innerText = data.safeOrigin;
    document.getElementById('hud-dest').innerText = data.safeDest;

    const map = L.map('map', { zoomControl: true, attributionControl: false });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // 1. START MARKER (Emerald Green Pulsing Pin)
    const startIcon = L.divIcon({
      className: '',
      html: '<div class="pin-start" title="Tap to zoom to your exact house & streets!">📍</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    const startMarker = L.marker([data.oLat, data.oLon], { icon: startIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup('<div class="popup-title">📍 ' + data.safeOrigin + '</div><div class="popup-subtitle">Departure Origin / Real Live Location (Home)</div><div style="margin-top:4px;font-size:10px;color:#15803d;font-weight:700;">🏠 Exact Location & Streets Active</div>');

    // Click Start Pin flies straight to user house at street level (zoom 18)
    startMarker.on('click', function() {
      map.flyTo([data.oLat, data.oLon], 18, { animate: true, duration: 1.2 });
      startMarker.openPopup();
    });

    // Quick links on HUD
    const hudOrigLink = document.getElementById('hud-orig-link');
    if (hudOrigLink) {
      hudOrigLink.onclick = function() {
        map.flyTo([data.oLat, data.oLon], 18, { animate: true, duration: 1.2 });
        startMarker.openPopup();
      };
    }

    // Bottom Action Button: My Location
    document.getElementById('btn-osm-home').onclick = function() {
      map.flyTo([data.oLat, data.oLon], 18, { animate: true, duration: 1.2 });
      startMarker.openPopup();
    };

    if (!data.hasRoute) {
      // ══════════════════════════════════════════════════════════
      // CASE: NO ACTIVE DESTINATION / NO ITINERARY
      // Show ONLY the user's current live location with streets!
      // NO route lines (no green line, no blue line), NO hazard marker!
      // ══════════════════════════════════════════════════════════
      map.setView([data.oLat, data.oLon], 16);

      const destSpan = document.getElementById('hud-dest');
      if (destSpan) destSpan.innerText = 'Search or select destination below ➔';
      const destLink = document.getElementById('hud-dest-link');
      if (destLink) destLink.style.opacity = '0.7';

      const shortestPill = document.getElementById('hud-shortest');
      if (shortestPill) {
        shortestPill.innerText = '📍 Live GPS Active (Street View)';
        shortestPill.className = 'stat-pill stat-pill-active-motorway';
      }
      const altPill = document.getElementById('hud-alt');
      if (altPill) altPill.style.display = 'none';

      const legendEl = document.querySelector('.route-legend');
      if (legendEl) legendEl.style.display = 'none';

      const btnDest = document.getElementById('btn-osm-dest');
      if (btnDest) btnDest.style.display = 'none';

      document.getElementById('btn-osm-full').onclick = function() {
        map.setView([data.oLat, data.oLon], 16);
      };

      setTimeout(() => {
        startMarker.openPopup();
        map.invalidateSize();
      }, 350);

    } else {
      // ══════════════════════════════════════════════════════════
      // CASE: ACTIVE DESTINATION SELECTED (from Itinerary or Search)
      // Display full route, shortest motorway (green), alt GT road, and hazard!
      // ══════════════════════════════════════════════════════════
      document.getElementById('hud-dest').innerText = data.safeDest;

      // 2. DESTINATION MARKER (Crimson Red Pin)
      const destIcon = L.divIcon({
        className: '',
        html: '<div class="pin-dest" title="Tap to zoom to destination!">🏁</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      const destMarker = L.marker([data.dLat, data.dLon], { icon: destIcon })
        .addTo(map)
        .bindPopup('<div class="popup-title">🏁 ' + data.safeDest + '</div><div class="popup-subtitle">Final Destination</div>');

      destMarker.on('click', function() {
        map.flyTo([data.dLat, data.dLon], 15, { animate: true, duration: 1.2 });
        destMarker.openPopup();
      });

      const hudDestLink = document.getElementById('hud-dest-link');
      if (hudDestLink) {
        hudDestLink.onclick = function() {
          map.flyTo([data.dLat, data.dLon], 15, { animate: true, duration: 1.2 });
          destMarker.openPopup();
        };
      }

      document.getElementById('btn-osm-full').onclick = function() {
        if (shortestPolyline) {
          map.fitBounds(shortestPolyline.getBounds(), { padding: [55, 55] });
        } else {
          map.fitBounds([[data.oLat, data.oLon], [data.dLat, data.dLon]], { padding: [55, 55] });
        }
      };
      document.getElementById('btn-osm-dest').onclick = function() {
        map.flyTo([data.dLat, data.dLon], 15, { animate: true, duration: 1.2 });
        destMarker.openPopup();
      };

    // 3. RED HAZARD / ROAD BLOCK MARKER WITH SPEED & CONSTRUCTION ADVISORY
    let hazardMarker = null;
    let hazardCircle = null;
    if (data.roadBlock && data.roadBlock.hasBlock && data.roadBlock.coords) {
      const rb = data.roadBlock;
      const hazardIcon = L.divIcon({
        className: '',
        html: '<div class="pin-hazard" title="Road hazard alert: Tap to inspect road block">⚠️</div>',
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const speedMsg = rb.speedWarning || 'Speed slow karein! Aagay road block aur high traffic jam hai.';
      const constMsg = rb.constructionNotice || 'Sadak ki construction chal rahi hai: Two-way road ab single one-way lane mein convert ho gayi hai aur gariyan aik hi lane se aa jaa rahi hain.';

      const hazardPopupContent =
        '<div class="popup-hazard-title">⚠️ ⛔ SPEED SLOW KAREIN — ROAD BLOCK</div>' +
        '<div class="popup-hazard-loc">📍 ' + rb.locationName + '</div>' +
        '<div class="popup-hazard-box-speed">⚠️ <b>Speed Alert:</b> ' + speedMsg + '</div>' +
        '<div class="popup-hazard-box-const">🚧 <b>Construction Work:</b> ' + constMsg + '</div>' +
        '<div class="popup-hazard-detour">⏱️ +' + rb.delayMins + ' min delay | 🔄 ' + (rb.detourAdvice || 'Use Motorway') + '</div>';

      hazardMarker = L.marker(rb.coords, { icon: hazardIcon, zIndexOffset: 1500 })
        .addTo(map)
        .bindPopup(hazardPopupContent);

      hazardMarker.on('click', function() {
        map.setView(hazardMarker.getLatLng(), 14);
        hazardMarker.openPopup();
      });

      // Red Hazard danger zone aura
      hazardCircle = L.circle(rb.coords, {
        radius: 2200,
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: 0.35,
        weight: 2.5
      }).addTo(map);

      // Add Hazard Delay Pill in HUD
      const delaySpan = document.createElement('span');
      delaySpan.className = 'delay-pill';
      delaySpan.innerText = '⛔ +' + rb.delayMins + 'm Hazard';
      delaySpan.onclick = function() {
        if (hazardMarker) {
          map.setView(hazardMarker.getLatLng(), 13);
          hazardMarker.openPopup();
        }
      };
      document.getElementById('hud-stats').appendChild(delaySpan);
    }

    // 4. ITINERARY DAY ACTIVITIES SCENIC STOPS
    if (data.itineraryMarkers && data.itineraryMarkers.length > 0) {
      data.itineraryMarkers.forEach(m => {
        const icon = L.divIcon({
          className: '',
          html: '<div class="marker-pin">' + m.index + '</div>',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });
        const popupContent = '<div class="popup-title">' + m.index + '. ' + m.label.replace(/[<>]/g, '') + '</div>'
          + (m.time ? '<div class="popup-subtitle">' + m.time + '</div>' : '');
        L.marker([m.lat, m.lon], { icon: icon }).addTo(map).bindPopup(popupContent);
      });
    }

    // 5. LIVE VEHICLE / TRACKING MARKER
    const vLat = Number(data.vehicleCoords?.[0]) || data.oLat;
    const vLon = Number(data.vehicleCoords?.[1]) || data.oLon;
    const isArrived = data.hasArrived;

    const carHtml = isArrived ? '<div class="pin-vehicle pin-arrived">🎉</div>' : '<div class="pin-vehicle">🚗</div>';
    const carIcon = L.divIcon({
      className: '',
      html: carHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
    const vehicleMarker = L.marker([vLat, vLon], { icon: carIcon, zIndexOffset: 2000 }).addTo(map);

    if (isArrived) {
      vehicleMarker.bindPopup(
        '<div class="popup-title" style="color:#15803d; font-size:13px; font-weight:900;">🎉 YOU REACHED THE FINAL DESTINATION!</div>' +
        '<div class="popup-subtitle" style="font-size:11px; font-weight:700;">' + data.safeDest + '</div>' +
        '<div style="margin-top:3px; color:#166534; font-size:10px;">Journey successfully completed!</div>'
      ).openPopup();
    } else {
      vehicleMarker.bindPopup(
        '<div class="popup-title">🚗 Current Vehicle Location</div>' +
        '<div class="popup-subtitle">' + data.safeLocationLabel + '</div>'
      );
    }

    // 6. DUAL ROUTE SYSTEM (Shortest Motorway Route vs Alternative GT Road Route)
    let currentSelectedRoute = data.routeType || 'motorway'; // 'motorway' | 'gt_road'

    let shortestPolyline = null;
    let shortestGlow = null;
    let shortestBadgeMarker = null;

    let altPolyline = null;
    let altGlow = null;
    let altBadgeMarker = null;

    let shortestCoords = [];
    let altCoords = [];

    let shortestMetrics = { dist: 0, durStr: '' };
    let altMetrics = { dist: 0, durStr: '' };

    function highlightActiveRoute(activeType) {
      currentSelectedRoute = activeType;
      const isMotorway = activeType === 'motorway';

      if (shortestPolyline && shortestGlow) {
        shortestPolyline.setStyle({
          color: '#15803d',
          weight: isMotorway ? 7 : 4,
          opacity: isMotorway ? 0.95 : 0.65,
          dashArray: null
        });
        shortestGlow.setStyle({ opacity: isMotorway ? 0.5 : 0.2 });
      }

      if (altPolyline && altGlow) {
        altPolyline.setStyle({
          color: '#2563eb',
          weight: !isMotorway ? 7 : 4,
          opacity: !isMotorway ? 0.95 : 0.65,
          dashArray: !isMotorway ? null : '8 6'
        });
        altGlow.setStyle({ opacity: !isMotorway ? 0.5 : 0.2 });
      }

      const shortestPill = document.getElementById('hud-shortest');
      const altPill = document.getElementById('hud-alt');

      if (shortestPill && altPill) {
        if (isMotorway) {
          shortestPill.className = 'stat-pill stat-pill-active-motorway';
          altPill.className = 'stat-pill';
        } else {
          shortestPill.className = 'stat-pill';
          altPill.className = 'stat-pill stat-pill-active-gt';
        }
      }
    }

    // Toggle click listeners on HUD & Legend
    document.getElementById('hud-shortest').onclick = () => highlightActiveRoute('motorway');
    document.getElementById('hud-alt').onclick = () => highlightActiveRoute('gt_road');
    document.getElementById('legend-shortest').onclick = () => highlightActiveRoute('motorway');
    document.getElementById('legend-alt').onclick = () => highlightActiveRoute('gt_road');

    // Fetch Routes from OSRM
    const osrmUrl = 'https://router.project-osrm.org/route/v1/driving/' +
      data.oLon + ',' + data.oLat + ';' + data.dLon + ',' + data.dLat +
      '?overview=full&geometries=geojson&alternatives=true';

    fetch(osrmUrl)
      .then(r => r.json())
      .then(resData => {
        if (resData && resData.routes && resData.routes.length > 0) {
          // Route 0: Shortest / Motorway Route
          const r0 = resData.routes[0];
          const raw0 = r0.geometry.coordinates.map(pt => [pt[1], pt[0]]);
          shortestCoords = [[data.oLat, data.oLon], ...raw0, [data.dLat, data.dLon]];
          const distKm0 = Math.round(r0.distance / 1000);
          const totalMins0 = Math.round(r0.duration / 60);
          const hrs0 = Math.floor(totalMins0 / 60);
          const mins0 = totalMins0 % 60;
          shortestMetrics = { dist: distKm0, durStr: hrs0 > 0 ? (hrs0 + 'h ' + mins0 + 'm') : (mins0 + 'm') };

          // Route 1: Alternative Route (from OSRM or via GT Road corridor waypoint)
          if (resData.routes.length > 1) {
            const r1 = resData.routes[1];
            const raw1 = r1.geometry.coordinates.map(pt => [pt[1], pt[0]]);
            altCoords = [[data.oLat, data.oLon], ...raw1, [data.dLat, data.dLon]];
            const distKm1 = Math.round(r1.distance / 1000);
            const totalMins1 = Math.round(r1.duration / 60);
            const hrs1 = Math.floor(totalMins1 / 60);
            const mins1 = totalMins1 % 60;
            altMetrics = { dist: distKm1, durStr: hrs1 > 0 ? (hrs1 + 'h ' + mins1 + 'm') : (mins1 + 'm') };
            renderBothRoutes();
          } else {
            // Fetch alternative route with GT Road waypoint
            const midLat = (data.oLat + data.dLat) / 2 - 0.12;
            const midLon = (data.oLon + data.dLon) / 2 - 0.12;
            const altOsrmUrl = 'https://router.project-osrm.org/route/v1/driving/' +
              data.oLon + ',' + data.oLat + ';' + midLon + ',' + midLat + ';' + data.dLon + ',' + data.dLat +
              '?overview=full&geometries=geojson';

            fetch(altOsrmUrl)
              .then(r2 => r2.json())
              .then(d2 => {
                if (d2 && d2.routes && d2.routes[0]) {
                  const rAlt = d2.routes[0];
                  const rawAlt = rAlt.geometry.coordinates.map(pt => [pt[1], pt[0]]);
                  altCoords = [[data.oLat, data.oLon], ...rawAlt, [data.dLat, data.dLon]];
                  const distKm1 = Math.round(rAlt.distance / 1000);
                  const totalMins1 = Math.round(rAlt.duration / 60);
                  const hrs1 = Math.floor(totalMins1 / 60);
                  const mins1 = totalMins1 % 60;
                  altMetrics = { dist: distKm1, durStr: hrs1 > 0 ? (hrs1 + 'h ' + mins1 + 'm') : (mins1 + 'm') };
                } else {
                  generateFallbackAltCoords();
                }
                renderBothRoutes();
              })
              .catch(() => {
                generateFallbackAltCoords();
                renderBothRoutes();
              });
          }
        } else {
          renderFallbackStraightRoutes();
        }
      })
      .catch(err => {
        console.warn('OSRM dual route fetch error, using fallback:', err);
        renderFallbackStraightRoutes();
      });

    function generateFallbackAltCoords() {
      const midLat = (data.oLat + data.dLat) / 2 - 0.18;
      const midLon = (data.oLon + data.dLon) / 2 - 0.18;
      altCoords = [[data.oLat, data.oLon], [midLat, midLon], [data.dLat, data.dLon]];
      altMetrics = {
        dist: Math.round(shortestMetrics.dist * 1.08),
        durStr: (Math.round((shortestMetrics.dist * 1.08) / 55 * 10) / 10) + ' hrs'
      };
    }

    function renderBothRoutes() {
      // 1. Draw Alternative Route (Blue)
      if (altCoords.length > 0) {
        altGlow = L.polyline(altCoords, {
          color: '#93c5fd',
          weight: 8,
          opacity: 0.35,
          lineJoin: 'round'
        }).addTo(map);

        altPolyline = L.polyline(altCoords, {
          color: '#2563eb',
          weight: 5,
          opacity: 0.85,
          dashArray: '8 6',
          lineJoin: 'round'
        }).addTo(map);

        altPolyline.on('click', () => highlightActiveRoute('gt_road'));

        // Alternative Midpoint Tag
        if (altCoords.length > 10) {
          const midAlt = altCoords[Math.floor(altCoords.length / 2)];
          const altTagIcon = L.divIcon({
            className: '',
            html: '<div class="highway-tag highway-tag-gt">🚗 Alternative GT Road (' + altMetrics.dist + ' km)</div>',
            iconSize: [180, 24],
            iconAnchor: [90, 12]
          });
          altBadgeMarker = L.marker(midAlt, { icon: altTagIcon }).addTo(map);
          altBadgeMarker.on('click', () => highlightActiveRoute('gt_road'));
        }
      }

      // 2. Draw Shortest Route (Green)
      if (shortestCoords.length > 0) {
        shortestGlow = L.polyline(shortestCoords, {
          color: '#86efac',
          weight: 9,
          opacity: 0.45,
          lineJoin: 'round'
        }).addTo(map);

        shortestPolyline = L.polyline(shortestCoords, {
          color: '#15803d',
          weight: 6,
          opacity: 0.95,
          lineJoin: 'round'
        }).addTo(map);

        shortestPolyline.on('click', () => highlightActiveRoute('motorway'));

        // Shortest Midpoint Tag
        if (shortestCoords.length > 10) {
          const midShort = shortestCoords[Math.floor(shortestCoords.length / 2)];
          const shortTagIcon = L.divIcon({
            className: '',
            html: '<div class="highway-tag">⚡ Shortest Motorway (' + shortestMetrics.dist + ' km)</div>',
            iconSize: [180, 24],
            iconAnchor: [90, 12]
          });
          shortestBadgeMarker = L.marker(midShort, { icon: shortTagIcon }).addTo(map);
          shortestBadgeMarker.on('click', () => highlightActiveRoute('motorway'));
        }
      }

      // Update HUD Stats
      document.getElementById('hud-shortest').innerText = '⚡ Shortest: ' + shortestMetrics.dist + ' km (~' + shortestMetrics.durStr + ')';
      document.getElementById('hud-alt').innerText = '🚗 Alt GT Road: ' + altMetrics.dist + ' km (~' + altMetrics.durStr + ')';

      highlightActiveRoute(currentSelectedRoute);

      // Fit bounds
      if (isArrived) {
        map.setView([vLat, vLon], 12);
      } else if (data.currentStageIndex > 0) {
        map.fitBounds([[vLat, vLon], [data.dLat, data.dLon]], { padding: [55, 55], maxZoom: 12 });
      } else if (shortestPolyline) {
        map.fitBounds(shortestPolyline.getBounds(), { padding: [55, 55] });
      }

      // Snap hazard marker directly onto the actual route polyline
      if (hazardMarker && shortestCoords.length > 5) {
        let bestHazardPoint = shortestCoords[Math.floor(shortestCoords.length * 0.48)];
        if (data.roadBlock && data.roadBlock.coords) {
          const target = data.roadBlock.coords;
          let minDistance = 999999;
          let nearestOnRoute = null;
          // Find the point on the driving route closest to the specified hazard coordinates
          for (let i = 2; i < shortestCoords.length - 2; i++) {
            const pt = shortestCoords[i];
            const dist = Math.hypot(pt[0] - target[0], pt[1] - target[1]);
            if (dist < minDistance) {
              minDistance = dist;
              nearestOnRoute = pt;
            }
          }
          // If within ~0.45 degrees (~50km) of the route corridor, snap to that exact point on the highway
          if (minDistance < 0.45 && nearestOnRoute) {
            bestHazardPoint = nearestOnRoute;
          }
        }
        hazardMarker.setLatLng(bestHazardPoint);
        if (hazardCircle) {
          hazardCircle.setLatLng(bestHazardPoint);
        }
      }

      // Open hazard popup after 1s so the user clearly sees the warning
      if (hazardMarker) {
        setTimeout(() => {
          hazardMarker.openPopup();
        }, 1200);
      }
    }

    function renderFallbackStraightRoutes() {
      const R = 6371;
      const dLatRad = (data.dLat - data.oLat) * Math.PI / 180;
      const dLonRad = (data.dLon - data.oLon) * Math.PI / 180;
      const a = Math.sin(dLatRad/2)**2 + Math.cos(data.oLat*Math.PI/180) * Math.cos(data.dLat*Math.PI/180) * Math.sin(dLonRad/2)**2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const estKm0 = Math.round(R * c * 1.32);
      const estHrs0 = (estKm0 / 70).toFixed(1);

      shortestCoords = [[data.oLat, data.oLon], [(data.oLat + data.dLat)/2 + 0.05, (data.oLon + data.dLon)/2 + 0.05], [data.dLat, data.dLon]];
      shortestMetrics = { dist: estKm0, durStr: estHrs0 + ' hrs' };

      const estKm1 = Math.round(R * c * 1.45);
      const estHrs1 = (estKm1 / 55).toFixed(1);
      altCoords = [[data.oLat, data.oLon], [(data.oLat + data.dLat)/2 - 0.08, (data.oLon + data.dLon)/2 - 0.08], [data.dLat, data.dLon]];
      altMetrics = { dist: estKm1, durStr: estHrs1 + ' hrs' };

      renderBothRoutes();
    }
  } // End of else (data.hasRoute)

    setTimeout(() => { map.invalidateSize(); }, 300);
  } catch (err) {
    console.error('Leaflet initialization error:', err);
  }
</script>
</body>
</html>`;
}

export default function OpenStreetMap(props) {
  const { height = 340 } = props || {};
  const html = mapHtml(props);

  const cacheKey = `${props.hasRoute ? 'route' : 'noroute'}-${props.originName}-${props.destinationName}-${props.routeType}-${props.currentStageIndex}-${props.vehicleCoords?.[0]}-${props.vehicleCoords?.[1]}-${props.hasArrived}`;

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { height }]}>
        {React.createElement('iframe', {
          key: cacheKey,
          title: 'OpenStreetMap Live Navigation Route',
          srcDoc: html,
          style: {
            width: '100%',
            height: '100%',
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
    <View style={[styles.container, { height }]}>
      <WebView
        key={cacheKey}
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
  },
});
