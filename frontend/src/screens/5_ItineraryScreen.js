import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

// Sample data — will be replaced by real AI response from HuggingFace
const SAMPLE_ITINERARY = [
  {
    day: 1, title: 'Lahore Exploration',
    activities: [
      { time: '9:00 AM',  place: 'Badshahi Mosque',        type: 'Historic', weather: '☀' },
      { time: '11:30 AM', place: 'Lahore Fort',             type: 'Historic', weather: '☀' },
      { time: '1:00 PM',  place: 'Food Street Gawalmandi',  type: 'Food',     weather: '⛅' },
      { time: '3:00 PM',  place: 'Minar-e-Pakistan',        type: 'Historic', weather: '⛅' },
      { time: '7:00 PM',  place: 'Anarkali Bazaar',         type: 'Shopping', weather: '🌙' },
    ],
  },
  {
    day: 2, title: 'Culture & Museums',
    activities: [
      { time: '9:00 AM',  place: 'Lahore Museum',           type: 'Culture',  weather: '☀' },
      { time: '11:00 AM', place: 'Shalimar Gardens',        type: 'Nature',   weather: '☀' },
      { time: '1:30 PM',  place: 'Cooco\'s Den Restaurant', type: 'Food',     weather: '⛅' },
      { time: '4:00 PM',  place: 'Walled City of Lahore',   type: 'Historic', weather: '⛅' },
      { time: '8:00 PM',  place: 'Howl at the Moon Cafe',   type: 'Food',     weather: '🌙' },
    ],
  },
  {
    day: 3, title: 'Day Trip & Shopping',
    activities: [
      { time: '8:00 AM',  place: 'Wagah Border Ceremony',   type: 'Culture',  weather: '☀' },
      { time: '12:00 PM', place: 'Packages Mall',           type: 'Shopping', weather: '☀' },
      { time: '3:00 PM',  place: 'Gulberg Galleria',        type: 'Shopping', weather: '⛅' },
      { time: '7:30 PM',  place: 'Cosa Nostra Restaurant',  type: 'Food',     weather: '🌙' },
    ],
  },
];

const TYPE_COLORS = {
  Historic: '#e8f5e9',
  Food:     '#fff3e0',
  Nature:   '#e3f2fd',
  Shopping: '#fce4ec',
  Culture:  '#f3e5f5',
};
const TYPE_TEXT = {
  Historic: '#1a7a4a',
  Food:     '#e65100',
  Nature:   '#1565c0',
  Shopping: '#c62828',
  Culture:  '#6a1b9a',
};

export default function ItineraryScreen({ navigation, route }) {
  const { destination = 'Lahore', startDate = 'Oct 26', endDate = 'Oct 28', budget = '50,000' } = route?.params || {};
  const [activeDay, setActiveDay] = useState(1);

  const currentDay = SAMPLE_ITINERARY.find(d => d.day === activeDay);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient colors={['#0d5c2e', '#25a865']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.tripTitle}>Pakistan Adventure</Text>
        <Text style={styles.tripSub}>{destination}  •  {startDate} – {endDate}</Text>
        <View style={styles.budgetBadge}>
          <Text style={styles.budgetText}>Budget: PKR {budget}</Text>
        </View>
        {/* Share button */}
        <TouchableOpacity style={styles.shareBtn}>
          <Text style={styles.shareText}>Share ↗</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Day tabs */}
      <View style={styles.dayTabs}>
        {SAMPLE_ITINERARY.map(d => (
          <TouchableOpacity
            key={d.day}
            style={[styles.dayTab, activeDay === d.day && styles.dayTabActive]}
            onPress={() => setActiveDay(d.day)}
          >
            <Text style={[styles.dayTabText, activeDay === d.day && styles.dayTabTextActive]}>Day {d.day}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Activities */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle}>{currentDay.title}</Text>
          <Text style={styles.dayWeather}>☀ Pleasant</Text>
        </View>

        {currentDay.activities.map((act, idx) => (
          <View key={idx} style={styles.activityCard}>
            {/* Timeline dot */}
            <View style={styles.timelineCol}>
              <View style={styles.timelineDot} />
              {idx < currentDay.activities.length - 1 && <View style={styles.timelineLine} />}
            </View>
            {/* Content */}
            <View style={styles.activityContent}>
              <Text style={styles.activityTime}>{act.time}  {act.weather}</Text>
              <Text style={styles.activityPlace}>{act.place}</Text>
              <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[act.type] || '#f5f5f5' }]}>
                <Text style={[styles.typeText, { color: TYPE_TEXT[act.type] || '#333' }]}>{act.type}</Text>
              </View>
            </View>
          </View>
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f5f5f5' },
  header:          { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
  backBtn:         { marginBottom: 8 },
  backText:        { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  tripTitle:       { fontSize: 24, color: '#ffffff', fontWeight: '800' },
  tripSub:         { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  budgetBadge:     { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start' },
  budgetText:      { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  shareBtn:        { position: 'absolute', top: 60, right: 20 },
  shareText:       { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  dayTabs:         { flexDirection: 'row', backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 10, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  dayTab:          { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  dayTabActive:    { backgroundColor: '#1a7a4a' },
  dayTabText:      { fontSize: 13, fontWeight: '600', color: '#666' },
  dayTabTextActive:{ color: '#ffffff' },
  scroll:          { flex: 1, padding: 16 },
  dayHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dayTitle:        { fontSize: 18, fontWeight: '700', color: '#1a7a4a' },
  dayWeather:      { fontSize: 13, color: '#888' },
  activityCard:    { flexDirection: 'row', marginBottom: 4 },
  timelineCol:     { width: 24, alignItems: 'center' },
  timelineDot:     { width: 12, height: 12, borderRadius: 6, backgroundColor: '#1a7a4a', marginTop: 14 },
  timelineLine:    { width: 2, flex: 1, backgroundColor: '#c8e6c9', marginTop: 4 },
  activityContent: { flex: 1, backgroundColor: '#ffffff', borderRadius: 12, padding: 14, marginLeft: 8, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  activityTime:    { fontSize: 12, color: '#888', marginBottom: 4 },
  activityPlace:   { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 6 },
  typeBadge:       { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  typeText:        { fontSize: 11, fontWeight: '600' },
});
