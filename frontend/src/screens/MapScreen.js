import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const PINS = [
  { id: 1, title: 'Badshahi Mosque',  time: '9:00 AM',  type: 'Historic' },
  { id: 2, title: 'Lahore Fort',      time: '11:30 AM', type: 'Historic' },
  { id: 3, title: 'Food Street',      time: '1:00 PM',  type: 'Food'     },
  { id: 4, title: 'Minar-e-Pakistan', time: '3:00 PM',  type: 'Historic' },
  { id: 5, title: 'Anarkali Bazaar',  time: '7:00 PM',  type: 'Shopping' },
];

const TYPE_COLORS = {
  Historic: '#e8f5e9',
  Food:     '#fff3e0',
  Shopping: '#fce4ec',
  Nature:   '#e3f2fd',
  Culture:  '#f3e5f5',
};

const TYPE_TEXT = {
  Historic: '#1a7a4a',
  Food:     '#e65100',
  Shopping: '#c62828',
  Nature:   '#1565c0',
  Culture:  '#6a1b9a',
};

export default function MapScreen() {
  const [selected, setSelected] = useState(null);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient colors={['#0d5c2e', '#25a865']} style={styles.header}>
        <Text style={styles.headerTitle}>Map View</Text>
        <Text style={styles.headerSub}>Smart Travel Planner  •  Lahore</Text>
      </LinearGradient>

      {/* Map placeholder — react-native-maps removed to fix web error */}
      <View style={styles.mapArea}>
        <View style={styles.mapVisual}>
          {/* Fake map grid lines */}
          <View style={styles.gridH1} />
          <View style={styles.gridH2} />
          <View style={styles.gridH3} />
          <View style={styles.gridV1} />
          <View style={styles.gridV2} />
          <View style={styles.gridV3} />

          {/* Place markers on fake map */}
          {[
            { top: '20%', left: '25%', num: 1 },
            { top: '35%', left: '55%', num: 2 },
            { top: '55%', left: '35%', num: 3 },
            { top: '65%', left: '65%', num: 4 },
            { top: '75%', left: '45%', num: 5 },
          ].map(pin => (
            <TouchableOpacity
              key={pin.num}
              style={[styles.mapMarker, { top: pin.top, left: pin.left }, selected === pin.num && styles.mapMarkerActive]}
              onPress={() => setSelected(pin.num)}
            >
              <Text style={styles.mapMarkerText}>{pin.num}</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.mapLabel}>OpenStreetMap</Text>
          <Text style={styles.mapSubLabel}>Tap a pin to see details</Text>
        </View>
      </View>

      {/* Today's plan summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today's Plan Summary</Text>
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 200 }}>
          {PINS.map((pin, idx) => (
            <TouchableOpacity
              key={pin.id}
              style={[styles.summaryRow, selected === pin.id && styles.summaryRowActive]}
              onPress={() => setSelected(pin.id)}
            >
              <View style={styles.summaryNumWrap}>
                <Text style={styles.summaryNum}>{idx + 1}</Text>
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryPlace}>{pin.title}</Text>
                <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[pin.type] }]}>
                  <Text style={[styles.typeText, { color: TYPE_TEXT[pin.type] }]}>{pin.type}</Text>
                </View>
              </View>
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
  header:           { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle:      { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub:        { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  mapArea:          { flex: 1, backgroundColor: '#e8f5e9' },
  mapVisual:        { flex: 1, position: 'relative', backgroundColor: '#d4edda', margin: 12, borderRadius: 16, overflow: 'hidden' },
  gridH1:           { position: 'absolute', top: '30%', width: '100%', height: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  gridH2:           { position: 'absolute', top: '55%', width: '100%', height: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  gridH3:           { position: 'absolute', top: '75%', width: '100%', height: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  gridV1:           { position: 'absolute', left: '30%', height: '100%', width: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  gridV2:           { position: 'absolute', left: '55%', height: '100%', width: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  gridV3:           { position: 'absolute', left: '75%', height: '100%', width: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  mapMarker:        { position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: '#1a7a4a', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  mapMarkerActive:  { backgroundColor: '#e53935', width: 36, height: 36, borderRadius: 18 },
  mapMarkerText:    { color: '#fff', fontWeight: '800', fontSize: 13 },
  mapLabel:         { position: 'absolute', bottom: 12, right: 12, fontSize: 11, color: 'rgba(0,0,0,0.4)', fontWeight: '600' },
  mapSubLabel:      { position: 'absolute', bottom: 28, right: 12, fontSize: 10, color: 'rgba(0,0,0,0.3)' },
  summaryCard:      { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 5 },
  summaryTitle:     { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 12 },
  summaryRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  summaryRowActive: { backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 6 },
  summaryNumWrap:   { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1a7a4a', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  summaryNum:       { fontSize: 12, fontWeight: '700', color: '#fff' },
  summaryInfo:      { flex: 1 },
  summaryPlace:     { fontSize: 14, color: '#222', fontWeight: '600', marginBottom: 3 },
  typeBadge:        { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  typeText:         { fontSize: 10, fontWeight: '600' },
  summaryTime:      { fontSize: 12, color: '#888', marginLeft: 8 },
});