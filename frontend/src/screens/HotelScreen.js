import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Pressable as TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScreenHeader from '../components/ScreenHeader';
import EmptyTrip from '../components/EmptyTrip';
import { useApp } from '../context/AppContext';
import { colors, shadow } from '../theme';
import Text from '../components/AppText';

export default function HotelScreen({ navigation }) {
  const { currentTrip, selectHotel } = useApp();
  const [savingId, setSavingId] = useState(null);
  if (!currentTrip) return <View style={styles.page}><ScreenHeader title="Hotels" subtitle="Curated planning estimates" /><EmptyTrip /></View>;
  const hotels = currentTrip.hotelSuggestions || currentTrip.hotels || [];

  async function choose(hotel) {
    setSavingId(hotel.id);
    try { await selectHotel(hotel.id); }
    catch (error) { Alert.alert('Could not select hotel', error.message); }
    finally { setSavingId(null); }
  }

  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <ScreenHeader title="Hotel options" subtitle={`${currentTrip.destination}, prices are estimates`} />
      {hotels.length === 0 ? <EmptyTrip message="No curated hotels are available for this destination yet. The trip remains usable without a hotel selection." /> : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {hotels.map((hotel) => {
            const selected = currentTrip.selectedHotel?.id === hotel.id;
            return (
              <View key={hotel.id} style={[styles.card, selected && styles.cardSelected]}>
                {hotel.imageUrl ? <Image source={{ uri: hotel.imageUrl }} style={styles.image} /> : <View style={[styles.image, styles.placeholder]}><Text style={styles.placeholderText}>{hotel.name[0]}</Text></View>}
                <View style={styles.info}>
                  <View style={styles.top}><Text style={styles.name}>{hotel.name}</Text><Text style={styles.rating}>{hotel.rating.toFixed(1)} / 5</Text></View>
                  <Text style={styles.city}>{hotel.city}, {hotel.nights} night{hotel.nights === 1 ? '' : 's'}</Text>
                  <Text style={styles.amenities}>{(hotel.amenities || []).join(' | ')}</Text>
                  <View style={styles.bottom}>
                    <View><Text style={styles.price}>PKR {Number(hotel.pricePerNight).toLocaleString()}</Text><Text style={styles.perNight}>per night, estimated</Text></View>
                    <View style={{ flexDirection: 'row', gap: 7 }}><TouchableOpacity style={styles.details} onPress={() => navigation.navigate('HotelDetail', { hotel })}><Text style={styles.detailsText}>Details</Text></TouchableOpacity><TouchableOpacity disabled={selected || savingId === hotel.id} style={[styles.select, selected && styles.selected]} onPress={() => choose(hotel)}><Text style={[styles.selectText, selected && styles.selectedText]}>{savingId === hotel.id ? 'Saving...' : selected ? 'Selected' : 'Select'}</Text></TouchableOpacity></View>
                  </View>
                  <Text style={styles.disclaimer}>{hotel.priceDisclaimer}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream }, content: { padding: 14, paddingBottom: 34 },
  card: { ...shadow, backgroundColor: colors.paper, borderRadius: 20, overflow: 'hidden', marginBottom: 15, borderWidth: 2, borderColor: 'transparent' }, cardSelected: { borderColor: colors.green }, image: { width: '100%', height: 145, backgroundColor: colors.mint }, placeholder: { alignItems: 'center', justifyContent: 'center' }, placeholderText: { fontSize: 40, color: colors.forest, fontWeight: '900' },
  info: { padding: 16 }, top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, name: { flex: 1, color: colors.ink, fontSize: 18, fontWeight: '900', marginRight: 8 }, rating: { color: colors.amber, fontWeight: '900', fontSize: 12 }, city: { color: colors.muted, marginTop: 5 }, amenities: { color: colors.green, fontSize: 12, marginTop: 8 }, bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }, price: { color: colors.ink, fontSize: 17, fontWeight: '900' }, perNight: { color: colors.muted, fontSize: 10, marginTop: 2 }, select: { borderWidth: 1, borderColor: colors.forest, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 10 }, details: { borderRadius: 11, backgroundColor: colors.mint, paddingHorizontal: 12, paddingVertical: 11 }, detailsText: { color: colors.forest, fontWeight: '900', fontSize: 11 }, selected: { backgroundColor: colors.forest }, selectText: { color: colors.forest, fontWeight: '900' }, selectedText: { color: '#fff' }, disclaimer: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 12 },
});
