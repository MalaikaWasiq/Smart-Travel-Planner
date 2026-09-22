import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, Pressable as TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScreenHeader from '../components/ScreenHeader';
import PrimaryButton from '../components/PrimaryButton';
import { apiRequest } from '../api/client';
import { useApp } from '../context/AppContext';
import { colors, shadow } from '../theme';
import AppIcon from '../components/AppIcon';
import Text from '../components/AppText';

const cities = ['Lahore', 'Islamabad', 'Karachi', 'Hunza', 'Skardu', 'Murree', 'Swat', 'Peshawar'];
const interests = ['History', 'Food', 'Nature', 'Adventure', 'Shopping', 'Culture'];
const dayOptions = [1, 2, 3, 4, 5, 7, 10, 14];

export default function HomeScreen({ navigation }) {
  const { user, generateTrip } = useApp();
  const [destination, setDestination] = useState('Lahore');
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState(user?.preferences?.defaultBudget ? String(user.preferences.defaultBudget) : '75000');
  const [selected, setSelected] = useState(user?.preferences?.interests?.length ? user.preferences.interests : ['History', 'Food']);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [weatherError, setWeatherError] = useState('');
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user?.preferences?.defaultBudget) setBudget(String(user.preferences.defaultBudget));
    if (user?.preferences?.interests?.length) setSelected(user.preferences.interests);
  }, [user?.preferences?.defaultBudget, user?.preferences?.interests?.join('|')]);

  useEffect(() => {
    if (!destination.trim()) return undefined;
    let active = true;
    const timer = setTimeout(async () => {
      setWeatherLoading(true);
      setWeatherError('');
      try {
        const data = await apiRequest(`/weather?city=${encodeURIComponent(destination.trim())}&days=${days}`);
        if (active) { setWeather(data.weather || null); setForecast(data.forecast || []); }
      } catch (error) {
        if (active) { setWeather(null); setForecast([]); setWeatherError(error.message || 'Weather is temporarily unavailable'); }
      } finally { if (active) setWeatherLoading(false); }
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [days, destination]);

  function toggleInterest(value) {
    setSelected((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  async function submit() {
    const normalizedBudget = Number(budget);
    if (!destination.trim()) return Alert.alert('Destination required', 'Enter a city to continue.');
    if (!Number.isFinite(normalizedBudget) || normalizedBudget <= 0) return Alert.alert('Budget required', 'Enter a positive budget in PKR.');
    setGenerating(true);
    try {
      const trip = await generateTrip({ destination: destination.trim(), days, budget: normalizedBudget, interests: selected });
      navigation.navigate('Itinerary', { trip });
    } catch (error) {
      Alert.alert('Could not generate trip', error.message);
    } finally { setGenerating(false); }
  }

  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <ScreenHeader title={`Hello, ${user?.fullName?.split(' ')[0] || 'Traveler'}`} subtitle="Build a practical AI-assisted Pakistan itinerary" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>POPULAR DESTINATIONS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontal}>
          {cities.map((city) => (
            <TouchableOpacity key={city} style={[styles.chip, destination === city && styles.chipOn]} onPress={() => setDestination(city)}>
              <Text style={[styles.chipText, destination === city && styles.chipTextOn]}>{city}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open detailed weather and packing guidance" style={styles.weatherCard} onPress={() => navigation.navigate('WeatherDetail', { weather, forecast, city: destination })}>
          <View>
            <Text style={styles.eyebrow}>CURRENT CONDITIONS</Text>
            <Text style={styles.weatherCity}>{destination || 'Choose a city'}</Text>
            <Text style={[styles.weatherDescription, weatherError && styles.weatherError]}>{weatherError || weather?.description || 'Weather will appear here'}</Text>
          </View>
          {weatherLoading ? <ActivityIndicator color={colors.forest} /> : <Text style={styles.temperature}>{weather ? `${weather.temp} C` : '--'}</Text>}
        </TouchableOpacity>

        {forecast.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastRow}>
            {forecast.map((item) => (
              <View key={`${item.dayNumber}-${item.label}`} style={styles.forecastCard}>
                <Text style={styles.forecastLabel}>{item.label || `Day ${item.dayNumber}`}</Text>
                <Text style={styles.forecastTemp}>{item.temp} C</Text>
                <Text style={styles.forecastMain}>{item.main}</Text>
              </View>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Trip brief</Text>
          <Text style={styles.label}>Destination</Text>
          <TextInput value={destination} onChangeText={setDestination} placeholder="e.g. Hunza" placeholderTextColor="#94a098" style={styles.input} />

          <Text style={styles.label}>Number of days</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dayOptions.map((value) => (
              <TouchableOpacity key={value} style={[styles.smallChip, days === value && styles.chipOn]} onPress={() => setDays(value)}>
                <Text style={[styles.chipText, days === value && styles.chipTextOn]}>{value}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Budget in PKR</Text>
          <TextInput value={budget} onChangeText={setBudget} keyboardType="numeric" placeholder="75000" placeholderTextColor="#94a098" style={styles.input} />

          <Text style={styles.label}>Interests</Text>
          <View style={styles.wrap}>
            {interests.map((value) => (
              <TouchableOpacity key={value} style={[styles.smallChip, selected.includes(value) && styles.chipOn]} onPress={() => toggleInterest(value)}>
                <Text style={[styles.chipText, selected.includes(value) && styles.chipTextOn]}>{value}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <PrimaryButton title="GENERATE ITINERARY" onPress={submit} loading={generating} />
          <Text style={styles.disclaimer}>AI suggestions and estimated costs should be verified before booking.</Text>
        </View>
      </ScrollView>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open travel assistant" style={styles.chatFab} onPress={() => navigation.navigate('Chat')}><AppIcon name="chatbubble-ellipses" color={colors.white} size={24} /></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 16, paddingBottom: 34 },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  horizontal: { marginHorizontal: -16, paddingLeft: 16, marginTop: 9, marginBottom: 15 },
  chip: { borderRadius: 22, paddingVertical: 9, paddingHorizontal: 15, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, marginRight: 8 },
  smallChip: { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 13, backgroundColor: '#f5f6f2', borderWidth: 1, borderColor: colors.line, marginRight: 7, marginBottom: 7 },
  chipOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  chipTextOn: { color: '#fff' },
  weatherCard: { ...shadow, backgroundColor: colors.mint, borderRadius: 20, padding: 19, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  weatherCity: { color: colors.ink, fontSize: 21, fontWeight: '900', marginTop: 5 },
  weatherDescription: { color: colors.muted, fontSize: 13, textTransform: 'capitalize', marginTop: 3 },
  weatherError: { color: colors.red, textTransform: 'none' },
  forecastRow: { marginHorizontal: -16, paddingLeft: 16, marginTop: -5, marginBottom: 16 },
  forecastCard: { width: 112, backgroundColor: colors.paper, borderRadius: 15, borderWidth: 1, borderColor: colors.line, padding: 12, marginRight: 8 },
  forecastLabel: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  forecastTemp: { color: colors.forest, fontSize: 19, fontWeight: '900', marginTop: 5 },
  forecastMain: { color: colors.ink, fontSize: 11, marginTop: 2 },
  temperature: { color: colors.forest, fontSize: 31, fontWeight: '900' },
  formCard: { ...shadow, backgroundColor: colors.paper, borderRadius: 22, padding: 20 },
  cardTitle: { color: colors.ink, fontSize: 23, fontWeight: '900', marginBottom: 4 },
  label: { color: colors.ink, fontSize: 12, fontWeight: '900', marginTop: 15, marginBottom: 7 },
  input: { borderWidth: 1, borderColor: colors.line, backgroundColor: '#f7f8f5', borderRadius: 12, minHeight: 48, paddingHorizontal: 13, color: colors.ink },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  disclaimer: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 12 },
  chatFab: { position: 'absolute', right: 18, bottom: 82, width: 54, height: 54, borderRadius: 27, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center', ...shadow },
});
