import React from 'react';
import { Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';

function mapHtml(routeDay) {
  const inPakistan = (latitude, longitude) => Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= 23.4 && latitude <= 37.2 && longitude >= 60.8 && longitude <= 77.9;
  const rawRoute = (routeDay?.coordinates || []).map(([longitude, latitude]) => [latitude, longitude]);
  const route = rawRoute.length && rawRoute.every(([latitude, longitude]) => inPakistan(latitude, longitude)) ? rawRoute : [];
  const markers = (routeDay?.activities || [])
    .map((item, index) => ({ ...item, itineraryIndex: index + 1 }))
    .filter((item) => inPakistan(item.latitude, item.longitude))
    .map((item) => ({ index: item.itineraryIndex, label: item.place, lat: item.latitude, lon: item.longitude }));
  const data = JSON.stringify({ route, markers, status: routeDay?.status }).replace(/</g, '\\u003c');
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><style>html,body,#map{height:100%;margin:0}body{background:#dce8dc}.leaflet-control-attribution{font:10px sans-serif}</style></head><body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>const data=${data};const points=data.route.length?data.route:data.markers.map(m=>[m.lat,m.lon]);const map=L.map('map',{zoomControl:true});L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);if(data.route.length>1)L.polyline(data.route,{color:'#174f36',weight:5,opacity:.82,dashArray:data.status==='live'?null:'10 9'}).addTo(map);data.markers.forEach(m=>L.marker([m.lat,m.lon]).addTo(map).bindPopup('<b>'+m.index+'. '+m.label.replace(/[<>]/g,'')+'</b>'));if(points.length)map.fitBounds(points,{padding:[28,28],maxZoom:15});else map.setView([30.3753,69.3451],5);</script></body></html>`;
}

export default function OpenStreetMap({ routeDay, height = 320 }) {
  const html = mapHtml(routeDay);
  if (Platform.OS === 'web') {
    return React.createElement('iframe', {
      title: 'OpenStreetMap itinerary route',
      srcDoc: html,
      style: { width: '100%', height, border: 0, display: 'block' },
      sandbox: 'allow-scripts',
    });
  }
  return <View style={{ height }}><WebView source={{ html }} originWhitelist={['*']} style={{ flex: 1 }} /></View>;
}
