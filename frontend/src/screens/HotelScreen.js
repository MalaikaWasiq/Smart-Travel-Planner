import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const HOTELS = [
  { id: 1, name: 'Serena Hotel Islamabad',   location: 'Islamabad', price: 15000, rating: 5, tag: 'Luxury'   },
  { id: 2, name: 'Avari Towers Lahore',      location: 'Lahore',    price: 12000, rating: 4, tag: 'Popular'  },
  { id: 3, name: 'Pearl Continental Lahore', location: 'Lahore',    price: 13000, rating: 5, tag: 'Top Rated'},
  { id: 4, name: 'Shangrila Resort Skardu',  location: 'Skardu',    price: 8000,  rating: 4, tag: 'Scenic'   },
  { id: 5, name: 'PC Bhurban Murree',        location: 'Murree',    price: 9000,  rating: 4, tag: 'Hill Top' },
  { id: 6, name: 'Hotel One Lahore',         location: 'Lahore',    price: 5500,  rating: 3, tag: 'Budget'   },
];

const FILTERS = ['All', '3 Star', '4 Star', '5 Star', 'Budget'];

export default function HotelScreen() {
  const [filter,   setFilter]   = useState('All');
  const [selected, setSelected] = useState(null);

  const filtered = filter === 'All' ? HOTELS : HOTELS.filter(h => {
    if (filter === 'Budget') return h.price < 7000;
    if (filter === '3 Star') return h.rating === 3;
    if (filter === '4 Star') return h.rating === 4;
    if (filter === '5 Star') return h.rating === 5;
    return true;
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient colors={['#0d5c2e', '#25a865']} style={styles.header}>
        <Text style={styles.headerTitle}>Select Hotel</Text>
        <Text style={styles.headerSub}>Best stays for your trip</Text>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.hotelScroll} showsVerticalScrollIndicator={false}>
        {filtered.map(hotel => (
          <View key={hotel.id} style={[styles.hotelCard, selected === hotel.id && styles.hotelCardSelected]}>
            <LinearGradient colors={['#1a7a4a', '#25a865']} style={styles.hotelImage}>
              <Text style={styles.hotelImageText}>{hotel.name[0]}</Text>
            </LinearGradient>
            <View style={styles.hotelInfo}>
              <View style={styles.hotelTopRow}>
                <Text style={styles.hotelName}>{hotel.name}</Text>
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>{hotel.tag}</Text>
                </View>
              </View>
              <Text style={styles.hotelLocation}>📍 {hotel.location}</Text>
              <Text style={styles.hotelRating}>{'★'.repeat(hotel.rating)}{'☆'.repeat(5 - hotel.rating)}</Text>
              <View style={styles.hotelBottom}>
                <Text style={styles.hotelPrice}>
                  PKR {hotel.price.toLocaleString()}
                  <Text style={styles.perNight}>/night</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.selectBtn, selected === hotel.id && styles.selectBtnActive]}
                  onPress={() => {
                    setSelected(hotel.id);
                    Alert.alert('Hotel Selected', hotel.name + ' added to your trip!');
                  }}
                >
                  <Text style={[styles.selectBtnText, selected === hotel.id && styles.selectBtnTextActive]}>
                    {selected === hotel.id ? 'Selected' : 'Select'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#f5f5f5' },
  header:             { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle:        { fontSize: 24, color: '#fff', fontWeight: '800' },
  headerSub:          { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  filterScroll:       { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', maxHeight: 55 },
  filterChip:         { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#e0e0e0', marginRight: 8, backgroundColor: '#f8f8f8' },
  filterActive:       { backgroundColor: '#1a7a4a', borderColor: '#1a7a4a' },
  filterText:         { fontSize: 13, color: '#666' },
  filterTextActive:   { color: '#fff', fontWeight: '600' },
  hotelScroll:        { flex: 1, padding: 12 },
  hotelCard:          { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  hotelCardSelected:  { borderWidth: 2, borderColor: '#1a7a4a' },
  hotelImage:         { width: 90, alignItems: 'center', justifyContent: 'center' },
  hotelImageText:     { fontSize: 32, color: '#fff', fontWeight: '800' },
  hotelInfo:          { flex: 1, padding: 12 },
  hotelTopRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  hotelName:          { fontSize: 14, fontWeight: '700', color: '#222', flex: 1, marginRight: 8 },
  tagBadge:           { backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  tagText:            { fontSize: 10, color: '#1a7a4a', fontWeight: '600' },
  hotelLocation:      { fontSize: 12, color: '#888', marginTop: 3 },
  hotelRating:        { fontSize: 12, color: '#f4a61d', marginTop: 3 },
  hotelBottom:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  hotelPrice:         { fontSize: 15, fontWeight: '800', color: '#1a7a4a' },
  perNight:           { fontSize: 11, fontWeight: '400', color: '#888' },
  selectBtn:          { backgroundColor: '#e8f5e9', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  selectBtnActive:    { backgroundColor: '#1a7a4a' },
  selectBtnText:      { fontSize: 13, color: '#1a7a4a', fontWeight: '600' },
  selectBtnTextActive:{ color: '#fff' },
});