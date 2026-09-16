// HomeScreen.js — FRONTEND ONLY (no API calls)
// Mock weather + forecast data per city
// When backend is ready, just replace MOCK_WEATHER and MOCK_FORECAST
// with real apiGetWeather() and apiGetForecast() calls

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

// ── Constants ────────────────────────────────────────────────
const CITIES    = ['Lahore', 'Islamabad', 'Karachi', 'Hunza', 'Skardu', 'Murree', 'Swat', 'Peshawar'];
const DAYS_LIST = ['1', '2', '3', '4', '5', '6', '7'];
const INTERESTS = ['Historic Sites', 'Food Tours', 'Nature', 'Adventure', 'Shopping', 'Culture'];

// ── Mock weather per city ────────────────────────────────────
const MOCK_WEATHER = {
  Lahore:    { city: 'Lahore',    temp: 34, feelsLike: 37, humidity: 55, wind: 3.2, description: 'hazy sunshine',   icon: '🌁', main: 'Haze'   },
  Islamabad: { city: 'Islamabad', temp: 26, feelsLike: 25, humidity: 60, wind: 4.1, description: 'partly cloudy',   icon: '⛅',  main: 'Clouds' },
  Karachi:   { city: 'Karachi',   temp: 32, feelsLike: 36, humidity: 70, wind: 5.5, description: 'humid and hot',   icon: '☀️',  main: 'Clear'  },
  Hunza:     { city: 'Hunza',     temp: 14, feelsLike: 11, humidity: 45, wind: 2.8, description: 'clear and cold',  icon: '☀️',  main: 'Clear'  },
  Skardu:    { city: 'Skardu',    temp: 8,  feelsLike: 5,  humidity: 40, wind: 3.0, description: 'cold and clear',  icon: '❄️',  main: 'Clear'  },
  Murree:    { city: 'Murree',    temp: 18, feelsLike: 16, humidity: 68, wind: 4.4, description: 'light rain',      icon: '🌧️', main: 'Rain'   },
  Swat:      { city: 'Swat',      temp: 22, feelsLike: 21, humidity: 50, wind: 3.6, description: 'mostly clear',    icon: '🌤️', main: 'Clear'  },
  Peshawar:  { city: 'Peshawar',  temp: 30, feelsLike: 33, humidity: 48, wind: 2.9, description: 'sunny and warm',  icon: '☀️',  main: 'Clear'  },
};

// ── Mock 5-day forecast per city ─────────────────────────────
const MOCK_FORECAST = {
  Lahore: [
    { dayNumber: 1, label: 'Mon, Nov 4',  temp: 34, tempMin: 26, tempMax: 36, humidity: 55, main: 'Haze',          description: 'hazy sunshine',    icon: '🌁',  wind: 3.2, isRainy: false, isSnowy: false, isHot: true,  isCold: false, isClear: false, advisory: 'HOT — plan outdoor visits before 10 AM or after 5 PM' },
    { dayNumber: 2, label: 'Tue, Nov 5',  temp: 28, tempMin: 22, tempMax: 30, humidity: 60, main: 'Rain',          description: 'light rain',        icon: '🌧️', wind: 4.0, isRainy: true,  isSnowy: false, isHot: false, isCold: false, isClear: false, advisory: 'RAINY — prefer indoor bazaars, museums, food streets' },
    { dayNumber: 3, label: 'Wed, Nov 6',  temp: 25, tempMin: 20, tempMax: 27, humidity: 52, main: 'Clouds',        description: 'partly cloudy',     icon: '⛅',  wind: 3.5, isRainy: false, isSnowy: false, isHot: false, isCold: false, isClear: false, advisory: 'MILD — great mix of indoor and outdoor activities' },
    { dayNumber: 4, label: 'Thu, Nov 7',  temp: 30, tempMin: 23, tempMax: 32, humidity: 48, main: 'Clear',         description: 'clear sky',         icon: '☀️',  wind: 2.8, isRainy: false, isSnowy: false, isHot: false, isCold: false, isClear: true,  advisory: 'CLEAR SKY — perfect for monuments, parks, photography' },
    { dayNumber: 5, label: 'Fri, Nov 8',  temp: 27, tempMin: 21, tempMax: 29, humidity: 58, main: 'Drizzle',       description: 'light drizzle',     icon: '🌦️', wind: 3.8, isRainy: true,  isSnowy: false, isHot: false, isCold: false, isClear: false, advisory: 'RAINY — great day for Lahore\'s indoor heritage sites' },
    { dayNumber: 6, label: 'Sat, Nov 9',  temp: 32, tempMin: 25, tempMax: 34, humidity: 50, main: 'Clear',         description: 'sunny and bright',  icon: '☀️',  wind: 3.0, isRainy: false, isSnowy: false, isHot: false, isCold: false, isClear: true,  advisory: 'CLEAR SKY — ideal for open-air sightseeing' },
    { dayNumber: 7, label: 'Sun, Nov 10', temp: 29, tempMin: 22, tempMax: 31, humidity: 54, main: 'Clouds',        description: 'mostly cloudy',     icon: '🌥️', wind: 4.2, isRainy: false, isSnowy: false, isHot: false, isCold: false, isClear: false, advisory: 'MILD — comfortable for both indoor and outdoor plans' },
  ],
  Islamabad: [
    { dayNumber: 1, label: 'Mon, Nov 4',  temp: 26, tempMin: 19, tempMax: 28, humidity: 60, main: 'Clouds',        description: 'partly cloudy',     icon: '⛅',  wind: 4.1, isRainy: false, isSnowy: false, isHot: false, isCold: false, isClear: false, advisory: 'MILD — great for both Faisal Mosque and Margalla hikes' },
    { dayNumber: 2, label: 'Tue, Nov 5',  temp: 22, tempMin: 16, tempMax: 24, humidity: 70, main: 'Rain',          description: 'moderate rain',     icon: '🌧️', wind: 5.0, isRainy: true,  isSnowy: false, isHot: false, isCold: false, isClear: false, advisory: 'RAINY — visit Pakistan Monument, Lok Virsa Museum' },
    { dayNumber: 3, label: 'Wed, Nov 6',  temp: 24, tempMin: 17, tempMax: 26, humidity: 55, main: 'Clear',         description: 'clear sky',         icon: '☀️',  wind: 3.5, isRainy: false, isSnowy: false, isHot: false, isCold: false, isClear: true,  advisory: 'CLEAR SKY — perfect for Daman-e-Koh and Shakarparian' },
    { dayNumber: 4, label: 'Thu, Nov 7',  temp: 20, tempMin: 14, tempMax: 22, humidity: 65, main: 'Clouds',        description: 'overcast',          icon: '☁️',  wind: 4.0, isRainy: false, isSnowy: false, isHot: false, isCold: false, isClear: false, advisory: 'MILD — good for Centaurus Mall and food streets' },
    { dayNumber: 5, label: 'Fri, Nov 8',  temp: 18, tempMin: 12, tempMax: 20, humidity: 72, main: 'Rain',          description: 'light rain',        icon: '🌦️', wind: 4.8, isRainy: true,  isSnowy: false, isHot: false, isCold: false, isClear: false, advisory: 'RAINY — cozy cafes and indoor shopping recommended' },
    { dayNumber: 6, label: 'Sat, Nov 9',  temp: 23, tempMin: 16, tempMax: 25, humidity: 58, main: 'Clear',         description: 'sunny',             icon: '☀️',  wind: 3.2, isRainy: false, isSnowy: false, isHot: false, isCold: false, isClear: true,  advisory: 'CLEAR SKY — ideal for Rawal Lake and Rose Garden' },
    { dayNumber: 7, label: 'Sun, Nov 10', temp: 21, tempMin: 15, tempMax: 23, humidity: 62, main: 'Clouds',        description: 'partly cloudy',     icon: '⛅',  wind: 3.8, isRainy: false, isSnowy: false, isHot: false, isCold: false, isClear: false, advisory: 'MILD — comfortable weather for all activities' },
  ],
  Hunza: [
    { dayNumber: 1, label: 'Mon, Nov 4',  temp: 14, tempMin: 7,  tempMax: 16, humidity: 45, main: 'Clear',         description: 'clear and crisp',   icon: '☀️',  wind: 2.5, isRainy: false, isSnowy: false, isHot: false, isCold: true,  isClear: true,  advisory: 'COLD — warm layers needed, beautiful clear views of Rakaposhi' },
    { dayNumber: 2, label: 'Tue, Nov 5',  temp: 10, tempMin: 4,  tempMax: 12, humidity: 50, main: 'Clouds',        description: 'partly cloudy',     icon: '⛅',  wind: 3.0, isRainy: false, isSnowy: false, isHot: false, isCold: true,  isClear: false, advisory: 'COLD — visit Baltit Fort and warm up at local chai shops' },
    { dayNumber: 3, label: 'Wed, Nov 6',  temp: 8,  tempMin: 2,  tempMax: 10, humidity: 55, main: 'Snow',          description: 'light snow',        icon: '❄️',  wind: 2.8, isRainy: false, isSnowy: true,  isHot: false, isCold: true,  isClear: false, advisory: 'SNOWY — snow photography, warm lodges, Hunza apricot tea' },
    { dayNumber: 4, label: 'Thu, Nov 7',  temp: 12, tempMin: 5,  tempMax: 14, humidity: 42, main: 'Clear',         description: 'sunny after snow',  icon: '🌤️', wind: 2.2, isRainy: false, isSnowy: false, isHot: false, isCold: true,  isClear: true,  advisory: 'COLD & CLEAR — stunning post-snow mountain views, Attabad Lake' },
    { dayNumber: 5, label: 'Fri, Nov 8',  temp: 15, tempMin: 8,  tempMax: 17, humidity: 40, main: 'Clear',         description: 'bright and clear',  icon: '☀️',  wind: 2.0, isRainy: false, isSnowy: false, isHot: false, isCold: true,  isClear: true,  advisory: 'COLD & CLEAR — ideal for Eagle\'s Nest viewpoint visit' },
    { dayNumber: 6, label: 'Sat, Nov 9',  temp: 11, tempMin: 4,  tempMax: 13, humidity: 48, main: 'Clouds',        description: 'cloudy',            icon: '☁️',  wind: 3.5, isRainy: false, isSnowy: false, isHot: false, isCold: true,  isClear: false, advisory: 'COLD — Ganish Village heritage walk and local craft shops' },
    { dayNumber: 7, label: 'Sun, Nov 10', temp: 9,  tempMin: 3,  tempMax: 11, humidity: 52, main: 'Snow',          description: 'snow showers',      icon: '🌨️', wind: 3.2, isRainy: false, isSnowy: true,  isHot: false, isCold: true,  isClear: false, advisory: 'SNOWY — cozy guesthouses, local food, winter photography' },
  ],
  Skardu: [
    { dayNumber: 1, label: 'Mon, Nov 4',  temp: 8,  tempMin: 2,  tempMax: 10, humidity: 38, main: 'Clear',         description: 'clear mountain air',icon: '☀️',  wind: 2.0, isRainy: false, isSnowy: false, isHot: false, isCold: true,  isClear: true,  advisory: 'COLD & CLEAR — Shangrila Resort, Kachura Lake, mountain views' },
    { dayNumber: 2, label: 'Tue, Nov 5',  temp: 5,  tempMin: -1, tempMax: 7,  humidity: 42, main: 'Snow',          description: 'snow showers',      icon: '❄️',  wind: 2.5, isRainy: false, isSnowy: true,  isHot: false, isCold: true,  isClear: false, advisory: 'SNOWY — Deosai in snow is magical; dress in heavy layers' },
    { dayNumber: 3, label: 'Wed, Nov 6',  temp: 10, tempMin: 3,  tempMax: 12, humidity: 35, main: 'Clear',         description: 'sunny and cold',    icon: '🌤️', wind: 1.8, isRainy: false, isSnowy: false, isHot: false, isCold: true,  isClear: true,  advisory: 'COLD & CLEAR — Skardu Fort, Satpara Lake photography' },
    { dayNumber: 4, label: 'Thu, Nov 7',  temp: 6,  tempMin: 0,  tempMax: 8,  humidity: 44, main: 'Clouds',        description: 'overcast',          icon: '☁️',  wind: 3.0, isRainy: false, isSnowy: false, isHot: false, isCold: true,  isClear: false, advisory: 'COLD — warm guesthouse, local Balti food, indoor activities' },
    { dayNumber: 5, label: 'Fri, Nov 8',  temp: 9,  tempMin: 2,  tempMax: 11, humidity: 36, main: 'Clear',         description: 'clear and sunny',   icon: '☀️',  wind: 2.2, isRainy: false, isSnowy: false, isHot: false, isCold: true,  isClear: true,  advisory: 'COLD & CLEAR — best day for K2 Museum and bazaar walk' },
    { dayNumber: 6, label: 'Sat, Nov 9',  temp: 7,  tempMin: 1,  tempMax: 9,  humidity: 40, main: 'Snow',          description: 'light snow',        icon: '🌨️', wind: 2.8, isRainy: false, isSnowy: true,  isHot: false, isCold: true,  isClear: false, advisory: 'SNOWY — scenic drive, snow photography, warm chai stops' },
    { dayNumber: 7, label: 'Sun, Nov 10', temp: 11, tempMin: 4,  tempMax: 13, humidity: 33, main: 'Clear',         description: 'bright winter sun', icon: '☀️',  wind: 1.5, isRainy: false, isSnowy: false, isHot: false, isCold: true,  isClear: true,  advisory: 'COLD & CLEAR — final day panoramic viewpoints' },
  ],
  Murree: [
    { dayNumber: 1, label: 'Mon, Nov 4',  temp: 18, tempMin: 12, tempMax: 20, humidity: 68, main: 'Rain',          description: 'light rain',        icon: '🌧️', wind: 4.4, isRainy: true,  isSnowy: false, isHot: false, isCold: false, isClear: false, advisory: 'RAINY — Mall Road shops, Kashmir Point covered gallery' },
    { dayNumber: 2, label: 'Tue, Nov 5',  temp: 16, tempMin: 10, tempMax: 18, humidity: 72, main: 'Drizzle',       description: 'light drizzle',     icon: '🌦️', wind: 3.8, isRainy: true,  isSnowy: false, isHot: false, isCold: false, isClear: false, advisory: 'RAINY — cozy cafes, indoor handicraft shopping' },
    { dayNumber: 3, label: 'Wed, Nov 6',  temp: 20, tempMin: 14, tempMax: 22, humidity: 60, main: 'Clear',         description: 'clear and pleasant',icon: '☀️',  wind: 3.5, isRainy: false, isSnowy: false, isHot: false, isCold: false, isClear: true,  advisory: 'CLEAR SKY — perfect for Pindi Point and Patriata chair lift' },
    { dayNumber: 4, label: 'Thu, Nov 7',  temp: 14, tempMin: 8,  tempMax: 16, humidity: 75, main: 'Rain',          description: 'heavy showers',     icon: '🌧️', wind: 5.2, isRainy: true,  isSnowy: false, isHot: false, isCold: false, isClear: false, advisory: 'RAINY — stay in hotel, local food, indoor board games' },
    { dayNumber: 5, label: 'Fri, Nov 8',  temp: 17, tempMin: 11, tempMax: 19, humidity: 65, main: 'Clouds',        description: 'cloudy',            icon: '🌥️', wind: 4.0, isRainy: false, isSnowy: false, isHot: false, isCold: false, isClear: false, advisory: 'MILD — moderate walking tours, Murree Brewery museum' },
    { dayNumber: 6, label: 'Sat, Nov 9',  temp: 22, tempMin: 15, tempMax: 24, humidity: 55, main: 'Clear',         description: 'sunny and bright',  icon: '☀️',  wind: 3.2, isRainy: false, isSnowy: false, isHot: false, isCold: false, isClear: true,  advisory: 'CLEAR SKY — scenic hike to Mushkpuri Top' },
    { dayNumber: 7, label: 'Sun, Nov 10', temp: 15, tempMin: 9,  tempMax: 17, humidity: 70, main: 'Rain',          description: 'rainy afternoon',   icon: '🌧️', wind: 4.6, isRainy: true,  isSnowy: false, isHot: false, isCold: false, isClear: false, advisory: 'RAINY — morning walks then afternoon indoor shopping' },
  ],
};

// Fill remaining cities with generic data
const DEFAULT_FORECAST = (city) => [1,2,3,4,5,6,7].map((d) => ({
  dayNumber: d, label: `Day ${d}`, temp: 25 + Math.round(Math.random() * 8),
  tempMin: 18, tempMax: 30, humidity: 55, main: d % 3 === 0 ? 'Rain' : 'Clear',
  description: d % 3 === 0 ? 'light rain' : 'clear sky',
  icon: d % 3 === 0 ? '🌧️' : '☀️', wind: 3.0,
  isRainy: d % 3 === 0, isSnowy: false, isHot: false, isCold: false,
  isClear: d % 3 !== 0,
  advisory: d % 3 === 0 ? 'RAINY — prefer indoor venues' : 'CLEAR SKY — great for sightseeing',
}));

// ── Forecast card colour per weather ─────────────────────────
const getCardColor = (day) => {
  if (day.isRainy) return { bg: '#e3f2fd', border: '#1565c0', text: '#1565c0' };
  if (day.isSnowy) return { bg: '#e8eaf6', border: '#3949ab', text: '#3949ab' };
  if (day.isHot)   return { bg: '#fff3e0', border: '#e65100', text: '#e65100' };
  if (day.isCold)  return { bg: '#e0f2f1', border: '#00695c', text: '#00695c' };
  return               { bg: '#e8f5e9', border: '#1a7a4a', text: '#1a7a4a' };
};

const getAdvisoryShort = (day) => {
  if (day.isRainy) return '🏠 Indoor focus';
  if (day.isSnowy) return '❄️ Snow activities';
  if (day.isHot)   return '🌅 Early morning';
  if (day.isCold)  return '☕ Warm venues';
  return '🌳 Outdoor great';
};

// ── Mock itinerary generator (no API) ────────────────────────
const generateMockItinerary = (destination, days, forecast) => {
  const spots = {
    Lahore:    [['Badshahi Mosque','Lahore Fort','Walled City Walk','Food Street Gawalmandi','Shalimar Gardens'],['Anarkali Bazaar','Pakistan Museum','Minar-e-Pakistan','Cooco\'s Den Restaurant','Heera Mandi']],
    Islamabad: [['Faisal Mosque','Daman-e-Koh','Pakistan Monument','F-7 Jinnah Super Market','Rawal Lake'],['Lok Virsa Museum','Margalla Hills Trail','Rose & Jasmine Garden','Centaurus Mall','Shakarparian Park']],
    Karachi:   [['Quaid Mausoleum','Clifton Beach','Port Grand','Empress Market','Frere Hall'],['Mohatta Palace Museum','Sea View Promenade','Burns Road Food Street','National Museum','Defence Shopping']],
    Hunza:     [['Baltit Fort','Altit Fort','Attabad Lake','Eagles Nest Viewpoint','Ganish Village'],['Rakaposhi Viewpoint','Duikar Viewpoint','Hunza Bazaar','Borith Lake','Khunjerab Pass View']],
    Skardu:    [['Shangrila Resort','Skardu Fort','Satpara Lake','K2 Museum','Kachura Lake'],['Deosai Plains','Shigar Fort','Skardu Bazaar','Manthal Rock','Sheosar Lake']],
    Murree:    [['Kashmir Point','Pindi Point','Mall Road','Patriata Chair Lift','Mushkpuri Top'],['Ayubia National Park','Nathiagali Walk','Murree Brewery Museum','Local Handicraft Shops','GPO Chowk']],
    Swat:      [['Mingora Bazaar','Malam Jabba','Fizagat Park','Butkara Stupa','Swat River Walk'],['Udegram','Marghazar White Palace','Saidu Sharif Museum','Green Chowk Food Street','Kalam Valley']],
    Peshawar:  [['Qissa Khwani Bazaar','Peshawar Museum','Bala Hisar Fort','Masjid Mahabat Khan','Sethi House'],['Gor Khatri','Khyber Bazaar','Darra Adam Khel','Namak Mandi Food Street','Jamrud Fort']],
  };

  const citySpots = spots[destination] || [['Main Square','Central Park','Old Town','Food Market','Heritage Site'],['Local Museum','Viewpoint','Bazaar','Restaurant Row','Historic Fort']];

  const weatherTips = {
    true:  ['Perfect clear day for outdoor sightseeing!','Beautiful weather, carry sunscreen','Stunning views expected today','Great photography conditions'],
    false: ['Light rain expected — carry umbrella','Indoor-friendly itinerary for today','Rainy day adventure — warm clothes advised','Cozy indoor experiences planned'],
  };

  return Array.from({ length: days }, (_, i) => {
    const f   = forecast[i];
    const isBad = f?.isRainy || f?.isSnowy;
    const pool  = isBad ? citySpots[1] || citySpots[0] : citySpots[i % 2] || citySpots[0];
    const note  = f?.advisory || (isBad ? weatherTips.false[i % 4] : weatherTips.true[i % 4]);

    const times = ['9:00 AM', '11:30 AM', '2:00 PM', '4:30 PM', '7:00 PM'];
    const types = isBad
      ? ['indoor', 'food', 'culture', 'shopping', 'food']
      : ['historic', 'nature', 'food', 'culture', 'food'];

    return {
      day:          i + 1,
      title:        isBad
        ? `Day ${i + 1} — ${destination}'s Indoor Treasures`
        : `Day ${i + 1} — Exploring ${destination}`,
      weather_note: note,
      activities:   times.map((time, ai) => ({
        time,
        place:       pool[ai % pool.length],
        type:        types[ai],
        description: isBad
          ? `Great indoor spot to visit on a rainy day in ${destination}.`
          : `A must-visit attraction in ${destination} — perfect on a clear day.`,
      })),
    };
  });
};

// ── Component ────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const [destination,  setDestination]  = useState('');
  const [days,         setDays]         = useState('3');
  const [budget,       setBudget]       = useState('');
  const [selected,     setSelected]     = useState([]);
  const [weather,      setWeather]      = useState(null);
  const [forecast,     setForecast]     = useState([]);
  const [loadingW,     setLoadingW]     = useState(false);
  const [generating,   setGenerating]   = useState(false);

  // Simulate weather fetch when destination changes
  useEffect(() => {
    if (destination.length < 3) { setWeather(null); setForecast([]); return; }
    const timer = setTimeout(() => {
      setLoadingW(true);
      setTimeout(() => {
        const w = MOCK_WEATHER[destination] || {
          city: destination, temp: 26, feelsLike: 25, humidity: 55,
          wind: 3.5, description: 'partly cloudy', icon: '⛅', main: 'Clouds',
        };
        const f = MOCK_FORECAST[destination] || DEFAULT_FORECAST(destination);
        setWeather(w);
        setForecast(f.slice(0, parseInt(days, 10)));
        setLoadingW(false);
      }, 900); // simulate network delay
    }, 600);
    return () => clearTimeout(timer);
  }, [destination, days]);

  const toggleInterest = useCallback((item) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }, []);

  const handleGenerate = () => {
    if (!destination.trim()) { alert('Please enter a destination'); return; }
    if (!budget.trim())      { alert('Please enter your budget');   return; }

    setGenerating(true);
    // Simulate AI generation delay
    setTimeout(() => {
      const itinerary = generateMockItinerary(destination, parseInt(days, 10), forecast);
      setGenerating(false);
      navigation.navigate('Itinerary', {
        destination,
        numberOfDays: parseInt(days, 10),
        budget,
        itinerary,
        forecast,
        weather,
      });
    }, 2000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient colors={['#0d5c2e', '#1a7a4a', '#25a865']} style={st.header}>
        <Text style={st.greeting}>Hello, Traveler 👋</Text>
        <Text style={st.headerTitle}>PakExplorer!</Text>
        <Text style={st.headerSub}>Weather-smart trip planning</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* City chips */}
        <Text style={st.sectionLabel}>Popular Destinations</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16, marginBottom: 6 }}>
          {CITIES.map((city) => (
            <TouchableOpacity
              key={city}
              style={[st.cityChip, destination === city && st.cityChipActive]}
              onPress={() => setDestination(city)}
            >
              <Text style={[st.cityChipText, destination === city && st.cityChipTextActive]}>{city}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── WEATHER SECTION ── */}
        {loadingW && (
          <View style={st.weatherCard}>
            <ActivityIndicator color="#1a7a4a" size="small" />
            <Text style={st.weatherLoadText}>Fetching weather for {destination}...</Text>
          </View>
        )}

        {!loadingW && weather && (
          <>
            {/* Current weather */}
            <View style={st.weatherCard}>
              <View style={st.weatherRow}>
                <Text style={st.weatherBigIcon}>{weather.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={st.weatherCityLabel}>{weather.city}  •  Right Now</Text>
                  <Text style={st.weatherBigTemp}>{weather.temp}°C</Text>
                  <Text style={st.weatherDesc}>{weather.description}</Text>
                </View>
                <View style={st.weatherDetailsCol}>
                  <Text style={st.weatherDetail}>💧 {weather.humidity}%</Text>
                  <Text style={st.weatherDetail}>💨 {weather.wind} m/s</Text>
                  <Text style={st.weatherDetail}>🌡️ {weather.feelsLike}°C</Text>
                </View>
              </View>
            </View>

            {/* Forecast strip */}
            {forecast.length > 0 && (
              <View style={st.forecastSection}>
                <Text style={st.forecastTitle}>
                  📅 {forecast.length}-Day Forecast
                  <Text style={st.forecastTitleSub}>  (AI plans around this)</Text>
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.forecastScroll}>
                  {forecast.map((day) => {
                    const c = getCardColor(day);
                    return (
                      <View key={day.dayNumber} style={[st.forecastCard, { backgroundColor: c.bg, borderColor: c.border }]}>
                        <View style={[st.dayBadge, { backgroundColor: c.border }]}>
                          <Text style={st.dayBadgeText}>Day {day.dayNumber}</Text>
                        </View>
                        <Text style={st.fcDate}>{day.label}</Text>
                        <Text style={st.fcIcon}>{day.icon}</Text>
                        <Text style={[st.fcTemp, { color: c.border }]}>{day.temp}°C</Text>
                        <Text style={st.fcDesc}>{day.description}</Text>
                        <View style={[st.fcAdvisoryPill, { borderColor: c.border }]}>
                          <Text style={[st.fcAdvisoryText, { color: c.text }]}>
                            {getAdvisoryShort(day)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
                <View style={st.forecastHint}>
                  <Text style={st.forecastHintText}>
                    ✨ AI automatically plans rainy days indoors, hot days with early-morning visits, and cold days at warm venues.
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* ── FORM ── */}
        <View style={st.formCard}>
          <Text style={st.formTitle}>Plan Your Trip ✨</Text>

          <Text style={st.label}>Destination</Text>
          <View style={st.inputWrap}>
            <Text style={st.inputIcon}>📍</Text>
            <TextInput
              style={st.input}
              placeholder="e.g. Lahore, Islamabad, Hunza"
              placeholderTextColor="#aaa"
              value={destination}
              onChangeText={setDestination}
            />
          </View>

          <Text style={st.label}>Number of Days</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {DAYS_LIST.map((d) => (
              <TouchableOpacity key={d} style={[st.chip, days === d && st.chipActive]} onPress={() => setDays(d)}>
                <Text style={[st.chipText, days === d && st.chipTextActive]}>{d} {d === '1' ? 'Day' : 'Days'}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={st.label}>Budget (PKR)</Text>
          <View style={st.inputWrap}>
            <Text style={st.inputIcon}>💰</Text>
            <TextInput
              style={st.input}
              placeholder="e.g. 50000"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={budget}
              onChangeText={setBudget}
            />
          </View>

          <Text style={st.label}>Your Interests</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {INTERESTS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[st.chip, selected.includes(item) && st.chipActive]}
                onPress={() => toggleInterest(item)}
              >
                <Text style={[st.chipText, selected.includes(item) && st.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Weather-aware ready banner */}
          {forecast.length > 0 && !generating && (
            <View style={st.awareBanner}>
              <Text style={{ fontSize: 20 }}>🌦️</Text>
              <Text style={st.awareBannerText}>
                Weather-aware planning ready for {destination} — {forecast.length} days of forecast loaded
              </Text>
            </View>
          )}

          {/* Generate button */}
          <TouchableOpacity style={st.genBtn} onPress={handleGenerate} disabled={generating}>
            <LinearGradient
              colors={generating ? ['#999', '#777'] : ['#1a7a4a', '#25a865']}
              style={st.genGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {generating ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ActivityIndicator color="#fff" />
                  <Text style={st.genText}>AI planning weather-smart itinerary...</Text>
                </View>
              ) : (
                <Text style={st.genText}>
                  {forecast.length > 0 ? '🌦️  Generate Weather-Smart Itinerary' : '✨  Generate Itinerary'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  header:             { paddingTop: 56, paddingBottom: 22, paddingHorizontal: 20 },
  greeting:           { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  headerTitle:        { fontSize: 30, color: '#fff', fontWeight: '800' },
  headerSub:          { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  sectionLabel:       { fontSize: 14, fontWeight: '700', color: '#333', marginTop: 16, marginLeft: 16, marginBottom: 10 },
  cityChip:           { backgroundColor: '#e8f5e9', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: '#c8e6c9' },
  cityChipActive:     { backgroundColor: '#1a7a4a', borderColor: '#1a7a4a' },
  cityChipText:       { color: '#1a7a4a', fontWeight: '600', fontSize: 13 },
  cityChipTextActive: { color: '#fff' },
  // Weather card
  weatherCard:        { backgroundColor: '#fff', marginHorizontal: 14, marginTop: 14, borderRadius: 16, padding: 16, elevation: 3, flexDirection: 'row', alignItems: 'center', gap: 10 },
  weatherRow:         { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  weatherBigIcon:     { fontSize: 46 },
  weatherCityLabel:   { fontSize: 12, color: '#888', fontWeight: '600', marginBottom: 2 },
  weatherBigTemp:     { fontSize: 34, fontWeight: '800', color: '#222' },
  weatherDesc:        { fontSize: 13, color: '#555', textTransform: 'capitalize', marginTop: 2 },
  weatherDetailsCol:  { alignItems: 'flex-end', gap: 5 },
  weatherDetail:      { fontSize: 12, color: '#888' },
  weatherLoadText:    { fontSize: 13, color: '#888', marginLeft: 10 },
  // Forecast strip
  forecastSection:    { marginHorizontal: 14, marginTop: 16 },
  forecastTitle:      { fontSize: 14, fontWeight: '700', color: '#222', marginBottom: 10 },
  forecastTitleSub:   { fontSize: 11, color: '#aaa', fontWeight: '400' },
  forecastScroll:     { gap: 10, paddingBottom: 4 },
  forecastCard:       { width: 112, borderRadius: 14, padding: 10, borderWidth: 1.5, alignItems: 'center', gap: 3 },
  dayBadge:           { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 2 },
  dayBadgeText:       { color: '#fff', fontSize: 10, fontWeight: '700' },
  fcDate:             { fontSize: 10, color: '#555', textAlign: 'center' },
  fcIcon:             { fontSize: 28, marginVertical: 3 },
  fcTemp:             { fontSize: 20, fontWeight: '800' },
  fcDesc:             { fontSize: 10, color: '#666', textAlign: 'center', textTransform: 'capitalize' },
  fcAdvisoryPill:     { borderWidth: 1, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, marginTop: 5, width: '100%' },
  fcAdvisoryText:     { fontSize: 9.5, fontWeight: '600', textAlign: 'center' },
  forecastHint:       { backgroundColor: '#e8f5e9', borderRadius: 12, padding: 12, marginTop: 10 },
  forecastHintText:   { fontSize: 12, color: '#1a7a4a', lineHeight: 17 },
  // Form
  formCard:           { backgroundColor: '#fff', borderRadius: 20, margin: 14, padding: 20, elevation: 4 },
  formTitle:          { fontSize: 17, fontWeight: '700', color: '#1a7a4a', marginBottom: 4 },
  label:              { fontSize: 13, color: '#555', fontWeight: '600', marginBottom: 6, marginTop: 14 },
  inputWrap:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', paddingHorizontal: 14, height: 52 },
  inputIcon:          { fontSize: 16, marginRight: 10 },
  input:              { flex: 1, fontSize: 14.5, color: '#222' },
  chip:               { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#f8f8f8', marginRight: 8, marginTop: 6 },
  chipActive:         { backgroundColor: '#1a7a4a', borderColor: '#1a7a4a' },
  chipText:           { fontSize: 13, color: '#555' },
  chipTextActive:     { color: '#fff', fontWeight: '600' },
  awareBanner:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', borderRadius: 12, padding: 12, marginTop: 16, gap: 10, borderWidth: 1, borderColor: '#c8e6c9' },
  awareBannerText:    { flex: 1, fontSize: 12.5, color: '#1a7a4a', fontWeight: '500', lineHeight: 17 },
  genBtn:             { marginTop: 20, borderRadius: 14, overflow: 'hidden' },
  genGrad:            { height: 54, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  genText:            { color: '#fff', fontSize: 15, fontWeight: '700' },
});