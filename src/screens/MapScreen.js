import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';

const PINS = [
  { id: 1, title: 'Badshahi Mosque',  time: '9:00 AM',  latitude: 31.5882, longitude: 74.3100 },
  { id: 2, title: 'Lahore Fort',      time: '11:30 AM', latitude: 31.5881, longitude: 74.3151 },
  { id: 3, title: 'Food Street',      time: '1:00 PM',  latitude: 31.5650, longitude: 74.3090 },
  { id: 4, title: 'Minar-e-Pakistan', time: '3:00 PM',  latitude: 31.5921, longitude: 74.3093 },
  { id: 5, title: 'Anarkali Bazaar',  time: '7:00 PM',  latitude: 31.5697, longitude: 74.3145 },
];

export default function MapScreen() {
  const [selected, setSelected] = useState(null);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Map View</Text>
        <Text style={styles.headerSub}>Lahore  •  Day 1</Text>
      </View>

      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: 31.5804,
          longitude: 74.3110,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {PINS.map((pin, idx) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            title={pin.title}
            description={pin.time}
            onPress={() => setSelected(pin)}
          >
            <View style={styles.markerWrap}>
              <View style={styles.markerDot}>
                <Text style={styles.markerNum}>{idx + 1}</Text>
              </View>
            </View>
          </Marker>
        ))}
        <Polyline
          coordinates={PINS.map(p => ({ latitude: p.latitude, longitude: p.longitude }))}
          strokeColor="#1a7a4a"
          strokeWidth={2}
          lineDashPattern={[6, 3]}
        />
      </MapView>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today's Plan Summary</Text>
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 180 }}>
          {PINS.map((pin, idx) => (
            <TouchableOpacity
              key={pin.id}
              style={[styles.summaryRow, selected?.id === pin.id && styles.summaryRowActive]}
              onPress={() => setSelected(pin)}
            >
              <View style={styles.summaryNumWrap}>
                <Text style={styles.summaryNum}>{idx + 1}</Text>
              </View>
              <Text style={styles.summaryPlace}>{pin.title}</Text>
              <Text style={styles.summaryTime}>{pin.time}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#fff' },
  header:           { paddingTop: 56, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  headerTitle:      { fontSize: 22, fontWeight: '800', color: '#1a7a4a' },
  headerSub:        { fontSize: 13, color: '#888', marginTop: 2 },
  map:              { flex: 1 },
  markerWrap:       { alignItems: 'center' },
  markerDot:        { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1a7a4a', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  markerNum:        { color: '#fff', fontWeight: '700', fontSize: 12 },
  summaryCard:      { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 5 },
  summaryTitle:     { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 12 },
  summaryRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  summaryRowActive: { backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 4 },
  summaryNumWrap:   { width: 26, height: 26, borderRadius: 13, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  summaryNum:       { fontSize: 12, fontWeight: '700', color: '#1a7a4a' },
  summaryPlace:     { flex: 1, fontSize: 14, color: '#222', fontWeight: '500' },
  summaryTime:      { fontSize: 12, color: '#888' },
});