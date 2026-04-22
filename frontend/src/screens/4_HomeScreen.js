import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const INTERESTS = ['Historic Sites', 'Food Tours', 'Nature', 'Adventure', 'Shopping', 'Culture', 'Photography', 'Beaches'];
const POPULAR   = ['Lahore', 'Islamabad', 'Karachi', 'Hunza', 'Skardu', 'Peshawar', 'Murree', 'Swat'];

export default function HomeScreen({ navigation }) {
  const [destination, setDestination] = useState('');
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');
  const [budget,      setBudget]      = useState('');
  const [selected,    setSelected]    = useState([]);
  const [loading,     setLoading]     = useState(false);

  const toggleInterest = (item) => {
    setSelected(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleGenerate = () => {
    if (!destination || !startDate || !budget) {
      Alert.alert('Missing Info', 'Please enter destination, dates and budget');
      return;
    }
    setLoading(true);
    // TODO: call POST /api/itinerary/generate on your Node.js backend
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('Itinerary', { destination, startDate, endDate, budget, interests: selected });
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient colors={['#0d5c2e', '#25a865']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.greeting}>Welcome to</Text>
        <Text style={styles.appName}>Smart Travel Planner</Text>
        <Text style={styles.headerSub}>Plan your perfect Pakistan trip</Text>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Popular destinations */}
        <Text style={styles.sectionTitle}>Popular Destinations</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {POPULAR.map(city => (
            <TouchableOpacity key={city} style={styles.cityChip} onPress={() => setDestination(city)}>
              <Text style={styles.cityChipText}>{city}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Form card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Plan Your Trip</Text>

          {/* Destination */}
          <Text style={styles.label}>Destination</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.icon}>📍</Text>
            <TextInput style={styles.input} placeholder="e.g. Lahore, Pakistan" placeholderTextColor="#aaa" value={destination} onChangeText={setDestination} />
          </View>

          {/* Dates */}
          <View style={styles.dateRow}>
            <View style={[styles.inputWrap, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.icon}>📅</Text>
              <TextInput style={styles.input} placeholder="Start date" placeholderTextColor="#aaa" value={startDate} onChangeText={setStartDate} />
            </View>
            <View style={[styles.inputWrap, { flex: 1 }]}>
              <Text style={styles.icon}>📅</Text>
              <TextInput style={styles.input} placeholder="End date" placeholderTextColor="#aaa" value={endDate} onChangeText={setEndDate} />
            </View>
          </View>

          {/* Budget */}
          <Text style={styles.label}>Budget (PKR)</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.icon}>💰</Text>
            <TextInput style={styles.input} placeholder="e.g. 50000" placeholderTextColor="#aaa" keyboardType="numeric" value={budget} onChangeText={setBudget} />
          </View>

          {/* Interests */}
          <Text style={styles.label}>Your Interests</Text>
          <View style={styles.interestGrid}>
            {INTERESTS.map(item => (
              <TouchableOpacity
                key={item}
                style={[styles.interestChip, selected.includes(item) && styles.interestSelected]}
                onPress={() => toggleInterest(item)}
              >
                <Text style={[styles.interestText, selected.includes(item) && styles.interestTextSelected]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Generate button */}
          <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={loading}>
            <LinearGradient colors={['#1a7a4a', '#25a865']} style={styles.generateGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.generateText}>✨  Generate Itinerary</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#f5f5f5' },
  header:             { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  greeting:           { fontSize: 15, color: 'rgba(255,255,255,0.8)' },
  appName:            { fontSize: 32, color: '#ffffff', fontWeight: '800' },
  headerSub:          { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  scroll:             { flex: 1 },
  sectionTitle:       { fontSize: 15, fontWeight: '700', color: '#333', marginTop: 16, marginLeft: 16, marginBottom: 8 },
  chipScroll:         { paddingLeft: 16, marginBottom: 4 },
  cityChip:           { backgroundColor: '#e8f5e9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: '#c8e6c9' },
  cityChipText:       { color: '#1a7a4a', fontWeight: '600', fontSize: 13 },
  card:               { backgroundColor: '#fff', borderRadius: 20, margin: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  cardTitle:          { fontSize: 18, fontWeight: '700', color: '#1a7a4a', marginBottom: 16 },
  label:              { fontSize: 13, color: '#555', fontWeight: '600', marginBottom: 6, marginTop: 12 },
  inputWrap:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', paddingHorizontal: 12, height: 50 },
  icon:               { fontSize: 16, marginRight: 8 },
  input:              { flex: 1, fontSize: 14, color: '#333' },
  dateRow:            { flexDirection: 'row', marginTop: 12 },
  interestGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  interestChip:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#f8f8f8' },
  interestSelected:   { backgroundColor: '#1a7a4a', borderColor: '#1a7a4a' },
  interestText:       { fontSize: 13, color: '#555' },
  interestTextSelected:{ color: '#ffffff', fontWeight: '600' },
  generateBtn:        { marginTop: 24, borderRadius: 14, overflow: 'hidden' },
  generateGrad:       { height: 54, alignItems: 'center', justifyContent: 'center' },
  generateText:       { color: '#ffffff', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
});
