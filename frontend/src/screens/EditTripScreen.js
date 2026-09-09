import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, Pressable as TouchableOpacity, View } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import AppText from '../components/AppText';
import PrimaryButton from '../components/PrimaryButton';
import { useApp } from '../context/AppContext';
import { colors, radius, spacing } from '../theme';

const interests = ['History', 'Food', 'Nature', 'Adventure', 'Shopping', 'Culture'];

export default function EditTripScreen({ navigation }) {
  const { currentTrip, updateTrip } = useApp();
  const [destination, setDestination] = useState(currentTrip?.destination || '');
  const [days, setDays] = useState(String(currentTrip?.days || 3));
  const [budget, setBudget] = useState(String(currentTrip?.budget || 75000));
  const [selected, setSelected] = useState(currentTrip?.interests || []);
  const [loading, setLoading] = useState(false);
  async function submit() {
    Alert.alert('Regenerate this trip?', 'Weather, attractions, routes, hotels, and the itinerary will be recalculated. Recorded expenses are retained.', [
      { text: 'Cancel' },
      { text: 'Regenerate', onPress: async () => {
        setLoading(true);
        try { await updateTrip({ destination, days: Number(days), budget: Number(budget), interests: selected }); navigation.replace('Itinerary'); }
        catch (error) { Alert.alert('Update failed', error.message); }
        finally { setLoading(false); }
      } },
    ]);
  }
  return <View style={styles.page}><ScreenHeader title="Edit trip" subtitle="Regenerate dependent planning data" onBack={() => navigation.goBack()} /><ScrollView contentContainerStyle={styles.content}>
    <AppText variant="caption" color={colors.muted}>DESTINATION</AppText><TextInput style={styles.input} value={destination} onChangeText={setDestination} />
    <AppText variant="caption" color={colors.muted}>DAYS (1-14)</AppText><TextInput style={styles.input} value={days} onChangeText={setDays} keyboardType="number-pad" />
    <AppText variant="caption" color={colors.muted}>TOTAL BUDGET (PKR)</AppText><TextInput style={styles.input} value={budget} onChangeText={setBudget} keyboardType="number-pad" />
    <AppText variant="caption" color={colors.muted}>INTERESTS</AppText><View style={styles.wrap}>{interests.map((item) => <TouchableOpacity key={item} onPress={() => setSelected((old) => old.includes(item) ? old.filter((x) => x !== item) : [...old, item])} style={[styles.chip, selected.includes(item) && styles.chipOn]}><AppText variant="label" color={selected.includes(item) ? colors.white : colors.ink}>{item}</AppText></TouchableOpacity>)}</View>
    <PrimaryButton title="REGENERATE TRIP" onPress={submit} loading={loading} />
  </ScrollView></View>;
}
const styles = StyleSheet.create({ page:{flex:1,backgroundColor:colors.cream},content:{padding:spacing.lg,gap:spacing.sm},input:{minHeight:50,borderWidth:1,borderColor:colors.line,borderRadius:radius.md,backgroundColor:colors.paper,paddingHorizontal:14,color:colors.ink,marginBottom:spacing.sm},wrap:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:12},chip:{paddingHorizontal:13,paddingVertical:9,borderRadius:radius.pill,backgroundColor:colors.paper,borderWidth:1,borderColor:colors.line},chipOn:{backgroundColor:colors.forest,borderColor:colors.forest} });
