import React, { useEffect, useState, createContext, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Alert, Animated, ActivityIndicator, Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

// ─── USER CONTEXT ─────────────────────────────────────────────
const UserContext = createContext(null);

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
const AUTH_TOKEN_KEY = 'smartTravelPlanner.authToken';
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

// ─── USER DATABASE ────────────────────────────────────────────
// Backend-backed auth is implemented via /api/auth.

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── CITY DATABASE ────────────────────────────────────────────
function toAppUser(user) {
  return user ? { ...user, initials: getInitials(user.fullName) } : null;
}

async function apiRequest(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const CITY_DATA = {
  lahore: {
    name: 'Lahore',
    historic: ['Badshahi Mosque', 'Lahore Fort', 'Minar-e-Pakistan', 'Walled City of Lahore', 'Shalimar Gardens', 'Chauburji'],
    food:     ['Food Street Gawalmandi', 'Cooco Den Restaurant', 'Cafe Aylanto', 'Andaaz Restaurant', 'Cosa Nostra', 'Haveli Restaurant'],
    nature:   ['Jilani Park', 'Lawrence Garden', 'Race Course Park', 'Bagh-e-Jinnah', 'Gulshan Iqbal Park'],
    shopping: ['Anarkali Bazaar', 'Liberty Market', 'Packages Mall', 'MM Alam Road', 'Gulberg Galleria'],
    culture:  ['Lahore Museum', 'National College of Arts', 'Alhamra Arts Council', 'Lahore Fort Sound Show'],
  },
  islamabad: {
    name: 'Islamabad',
    historic: ['Faisal Mosque', 'Pakistan Monument', 'Lok Virsa Museum', 'Shakarparian Hills', 'Rawal Fort'],
    food:     ['Monal Restaurant', 'Kohsar Market', 'Saidpur Village', 'Street 1 Cafe', 'Tuscany Courtyard'],
    nature:   ['Margalla Hills', 'Rawal Lake', 'Daman-e-Koh', 'Trail 5 Hiking', 'Rose Garden'],
    shopping: ['Centaurus Mall', 'Jinnah Super Market', 'F-7 Markaz', 'Melody Food Park'],
    culture:  ['PNCA Gallery', 'Pakistan Museum of Natural History', 'Fatima Jinnah Park'],
  },
  karachi: {
    name: 'Karachi',
    historic: ['Mohatta Palace', 'Quaid-e-Azam Mausoleum', 'Empress Market', 'Frere Hall', 'Clifton Bridge'],
    food:     ['Burns Road Food Street', 'BBQ Tonight', 'Kolachi Restaurant', 'Boat Basin Food Street', 'Cafe Flo'],
    nature:   ['Clifton Beach', 'French Beach', 'Manora Island', 'Hawkes Bay Beach', 'Bagh Ibn-e-Qasim'],
    shopping: ['Dolmen Mall', 'Tariq Road', 'Zamzama Boulevard', 'Lucky One Mall'],
    culture:  ['National Museum of Pakistan', 'Karachi Arts Council', 'The Second Floor Cafe'],
  },
  hunza: {
    name: 'Hunza',
    historic: ['Baltit Fort', 'Altit Fort', 'Ganish Village', 'Karimabad Bazaar', 'Ultar Meadows'],
    food:     ['Cafe De Hunza', 'Old Hunza Inn Restaurant', 'Diran Guest House', 'Eagles Nest Dining', 'Serena Hotel Dining'],
    nature:   ['Attabad Lake', 'Rakaposhi View Point', 'Borith Lake', 'Passu Cones', 'Hussaini Bridge'],
    shopping: ['Hunza Gems Market', 'Local Handicraft Shops', 'Karimabad Market', 'Dry Fruit Shops'],
    culture:  ['Heirloom Museum', 'Hunza Cultural Show', 'Local Pottery Workshop', 'Heritage Walk'],
  },
  skardu: {
    name: 'Skardu',
    historic: ['Skardu Fort', 'Shigar Fort', 'Kharpocho Fort', 'Ancient Rock Carvings', 'Satpara Village'],
    food:     ['Shangrila Restaurant', 'K2 Motel Dining', 'Mashabrum Restaurant', 'Village Guest House', 'Mountain View Cafe'],
    nature:   ['Shangrila Lake', 'Upper Kachura Lake', 'Deosai Plains', 'Satpara Dam', 'Cold Desert'],
    shopping: ['Skardu Bazaar', 'Gem Stone Shops', 'Local Dry Fruit Market', 'Woolen Shawl Shops'],
    culture:  ['Skardu Museum', 'Buddhist Rock Carvings', 'Local Village Tour', 'Balti Cultural Show'],
  },
  murree: {
    name: 'Murree',
    historic: ['Lawrence College', 'Pindi Point', 'Christ Church Murree', 'GPO Chowk', 'Kashmir Point'],
    food:     ['Lintotts Restaurant', 'Sajjad Hotel Restaurant', 'Cecil Hotel Dining', 'Mall Road Cafes', 'Shangrila Restaurant'],
    nature:   ['Patriata New Murree', 'Ayubia National Park', 'Ghora Gali', 'Nathia Gali', 'Thandiani'],
    shopping: ['Mall Road Murree', 'Kashmir Point Shops', 'Local Woolen Market', 'Souvenir Bazaar'],
    culture:  ['Pine Forest Walk', 'Chairlift Experience', 'Murree Hills Festival', 'British Era Buildings'],
  },
  peshawar: {
    name: 'Peshawar',
    historic: ['Peshawar Museum', 'Bala Hisar Fort', 'Sethi House', 'Mahabat Khan Mosque', 'Qissa Khwani Bazaar'],
    food:     ['Namak Mandi Chapli Kabab', 'Charsi Tikka', 'Fakhr-e-Alam Road Food', 'Greens Hotel Restaurant', 'Khyber Restaurant'],
    nature:   ['Warsak Dam', 'Shahi Bagh', 'Hayatabad Sports Complex', 'Charsadda Road Park'],
    shopping: ['Saddar Bazaar', 'Karkhano Market', 'Shujaabad Market', 'Qissa Khwani Antiques'],
    culture:  ['Khyber Museum', 'Deans Hotel', 'Peshawar Zoo', 'Gor Khatri Archaeological Site'],
  },
  swat: {
    name: 'Swat',
    historic: ['Swat Museum', 'Butkara Stupa', 'Udegram Fort', 'Jehanabad Buddha', 'Mingora Old Town'],
    food:     ['Serena Hotel Swat', 'Fizagat Park Cafe', 'Miandam Guest House', 'Kalam Valley Restaurant', 'Green Hotel Dining'],
    nature:   ['Malam Jabba Ski Resort', 'Fizagat Park', 'Madyan River Side', 'Kalam Valley', 'Mahodand Lake'],
    shopping: ['Mingora Bazaar', 'Swat Embroidery Shops', 'Local Gem Market', 'Wooden Craft Shops'],
    culture:  ['Swat Cultural Museum', 'Traditional Dance Show', 'Pashto Poetry Night', 'Mingora Cultural Walk'],
  },
};

function generateItinerary(destination, numberOfDays) {
  const cityKey = destination.toLowerCase().trim().split(' ')[0];
  const city = CITY_DATA[cityKey] || {
    name: destination,
    historic: ['Grand Mosque', 'Historic Fort', 'Old City Tour', 'Heritage Museum', 'Ancient Temple'],
    food:     ['Local Food Street', 'Traditional Restaurant', 'Street Food Tour', 'Rooftop Cafe', 'River Side Dining'],
    nature:   ['City Park', 'Riverside Walk', 'Hill View Point', 'Botanical Garden', 'Lake Side Walk'],
    shopping: ['Main Bazaar', 'City Mall', 'Handicraft Market', 'Souvenir Shops', 'Night Bazaar'],
    culture:  ['City Museum', 'Cultural Center', 'Art Gallery', 'Local Festival', 'Heritage Walk'],
  };

  const timeSlots = [
    { time: '8:00 AM',  type: 'nature'   },
    { time: '10:30 AM', type: 'historic' },
    { time: '1:00 PM',  type: 'food'     },
    { time: '3:30 PM',  type: 'culture'  },
    { time: '6:00 PM',  type: 'shopping' },
    { time: '8:00 PM',  type: 'food'     },
  ];

  const dayTitles = [
    'Arrival & Exploration', 'Heritage & History', 'Nature & Adventure',
    'Food & Culture', 'Shopping & Local Life', 'Hidden Gems',
    'Farewell Day', 'City Highlights', 'Day Trip', 'Relaxation Day',
  ];

  const used = { historic: 0, food: 0, nature: 0, shopping: 0, culture: 0 };
  const days = [];

  for (let d = 1; d <= numberOfDays; d++) {
    const activities = timeSlots.map(slot => {
      const arr = city[slot.type];
      const idx = used[slot.type] % arr.length;
      used[slot.type]++;
      return { time: slot.time, place: arr[idx], type: slot.type };
    });
    days.push({ day: d, title: dayTitles[(d - 1) % dayTitles.length], activities });
  }
  return { cityName: city.name, days };
}

// ─── SPLASH SCREEN ────────────────────────────────────────────
function SplashScreen({ navigation }) {
  const { currentUser, authLoading } = useContext(UserContext);
  const scale   = new Animated.Value(0);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale,   { toValue: 1, friction: 4, tension: 40, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const t = setTimeout(() => navigation.replace(currentUser ? 'MainApp' : 'Login'), 3500);
    return () => clearTimeout(t);
  }, [authLoading, currentUser]);

  return (
    <LinearGradient colors={['#0d5c2e', '#1a7a4a', '#25a865']} style={s.splashBg}>
      <StatusBar style="light" />
      <Animated.View style={[s.globe, { transform: [{ scale }] }]}>
        <Text style={s.globeIcon}>✈</Text>
      </Animated.View>
      <Animated.View style={{ opacity, alignItems: 'center' }}>
        <Text style={s.splashTitle1}>Smart Travel</Text>
        <Text style={s.splashTitle2}>Planner</Text>
        <Text style={s.splashTagline}>AI-POWERED TRAVEL COMPANION</Text>
        <View style={s.splashLine} />
        <Text style={s.splashSub}>Explore Pakistan. Smarter.</Text>
      </Animated.View>
      <View style={s.splashBottom}>
        <View style={s.dots}>
          <View style={[s.dot, s.dotActive]} />
          <View style={s.dot} /><View style={s.dot} />
        </View>
        <Text style={s.uniText}>COMSATS University Islamabad</Text>
        <Text style={s.campusText}>Attock Campus  •  BSE 2023–2026</Text>
      </View>
    </LinearGradient>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────
function LoginScreen({ navigation, route }) {
  const { setCurrentUser, setAuthToken } = useContext(UserContext);
  const successMessage = route?.params?.successMessage;
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [emailErr, setEmailErr] = useState('');
  const [passErr,  setPassErr]  = useState('');

  const handleLogin = async () => {
    if (loading) return;
    setEmailErr(''); setPassErr('');
    let ok = true;
    if (!email.trim())              { setEmailErr('Email is required'); ok = false; }
    else if (!isValidEmail(email))  { setEmailErr('Enter a valid email e.g. name@gmail.com'); ok = false; }
    if (!password)                  { setPassErr('Password is required'); ok = false; }
    else if (password.length < 6)   { setPassErr('Password must be at least 6 characters'); ok = false; }
    if (!ok) return;

    setLoading(true);
    try {
      const { token, user } = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email: email.trim(), password },
      });

      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      setAuthToken(token);
      setCurrentUser(toAppUser(user));
      navigation.replace('MainApp');
    } catch (error) {
      const msg = error?.message || 'Login failed';
      setEmailErr(msg);
      setPassErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.authBg} keyboardShouldPersistTaps="handled">
      <StatusBar style="light" />
      <LinearGradient colors={['#0d5c2e', '#25a865']} style={s.authTop}>
        <Text style={s.globeIcon}>✈</Text>
        <Text style={s.authTopTitle}>Smart Travel Planner</Text>
        <Text style={s.authTopSub}>Welcome back!</Text>
      </LinearGradient>
      <View style={s.authCard}>
        <Text style={s.authCardTitle}>Sign In</Text>
        {!!successMessage && (
          <View style={s.successBanner}>
            <Text style={s.successBannerTitle}>Account created</Text>
            <Text style={s.successBannerTxt}>{successMessage}</Text>
          </View>
        )}
        <Text style={s.lbl}>Email</Text>
        <View style={[s.field, emailErr && s.fieldErr]}>
          <Text style={s.fieldIcon}>✉</Text>
          <TextInput style={s.fieldInput} placeholder="Enter your email" placeholderTextColor="#aaa" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={t => { setEmail(t); setEmailErr(''); }} />
        </View>
        {!!emailErr && <Text style={s.errTxt}>⚠  {emailErr}</Text>}

        <Text style={s.lbl}>Password</Text>
        <View style={[s.field, passErr && s.fieldErr]}>
          <Text style={s.fieldIcon}>🔒</Text>
          <TextInput style={s.fieldInput} placeholder="Min 6 characters" placeholderTextColor="#aaa" secureTextEntry={!showPass} value={password} onChangeText={t => { setPassword(t); setPassErr(''); }} />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Text style={s.showHide}>{showPass ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
        {!!passErr && <Text style={s.errTxt}>⚠  {passErr}</Text>}

        <TouchableOpacity style={s.forgotWrap}><Text style={s.forgotTxt}>Forgot Password?</Text></TouchableOpacity>

        <TouchableOpacity style={s.bigBtn} onPress={handleLogin} disabled={loading}>
          <LinearGradient colors={['#1a7a4a', '#25a865']} style={s.bigBtnGrad}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.bigBtnTxt}>LOGIN</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <View style={s.switchRow}>
          <Text style={s.switchTxt}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={s.switchLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <View style={s.hint}>
          <Text style={s.hintTitle}>Backend Login</Text>
          <Text style={s.hintTxt}>Sign up first, then log in with your email and password.</Text>
          <Text style={s.hintTxt}>API: {API_BASE_URL}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── SIGNUP SCREEN ────────────────────────────────────────────
function SignupScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [nameErr,  setNameErr]  = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [passErr,  setPassErr]  = useState('');
  const [confErr,  setConfErr]  = useState('');

  const handleSignup = async () => {
    if (loading) return;
    setNameErr(''); setEmailErr(''); setPassErr(''); setConfErr('');
    let ok = true;
    if (!fullName.trim()) { setNameErr('Full name is required'); ok = false; }
    if (!email.trim())    { setEmailErr('Email is required'); ok = false; }
    else if (!isValidEmail(email)) { setEmailErr('Enter a valid email address'); ok = false; }
    if (!password)              { setPassErr('Password is required'); ok = false; }
    else if (password.length < 6) { setPassErr('Password must be at least 6 characters'); ok = false; }
    if (!confirm)               { setConfErr('Please confirm your password'); ok = false; }
    else if (password !== confirm) { setConfErr('Passwords do not match'); ok = false; }
    if (!ok) return;

    setLoading(true);
    try {
      await apiRequest('/auth/signup', {
        method: 'POST',
        body: { fullName: fullName.trim(), email: email.trim(), password },
      });

      navigation.replace('Login', {
        successMessage: 'Your account was created successfully. Please log in with your email and password.',
      });
    } catch (error) {
      const msg = error?.message || 'Signup failed';
      setEmailErr(msg);
      setPassErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.authBg} keyboardShouldPersistTaps="handled">
      <StatusBar style="light" />
      <LinearGradient colors={['#0d5c2e', '#25a865']} style={s.authTop}>
        <Text style={s.globeIcon}>✈</Text>
        <Text style={s.authTopTitle}>Smart Travel Planner</Text>
        <Text style={s.authTopSub}>Create your account</Text>
      </LinearGradient>
      <View style={s.authCard}>
        <Text style={s.authCardTitle}>Sign Up</Text>
        <Text style={s.lbl}>Full Name</Text>
        <View style={[s.field, nameErr && s.fieldErr]}>
          <Text style={s.fieldIcon}>👤</Text>
          <TextInput style={s.fieldInput} placeholder="Enter your full name" placeholderTextColor="#aaa" value={fullName} onChangeText={t => { setFullName(t); setNameErr(''); }} />
        </View>
        {!!nameErr && <Text style={s.errTxt}>⚠  {nameErr}</Text>}

        <Text style={s.lbl}>Email</Text>
        <View style={[s.field, emailErr && s.fieldErr]}>
          <Text style={s.fieldIcon}>✉</Text>
          <TextInput style={s.fieldInput} placeholder="Enter your email" placeholderTextColor="#aaa" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={t => { setEmail(t); setEmailErr(''); }} />
        </View>
        {!!emailErr && <Text style={s.errTxt}>⚠  {emailErr}</Text>}

        <Text style={s.lbl}>Password</Text>
        <View style={[s.field, passErr && s.fieldErr]}>
          <Text style={s.fieldIcon}>🔒</Text>
          <TextInput style={s.fieldInput} placeholder="Min 6 characters" placeholderTextColor="#aaa" secureTextEntry={!showPass} value={password} onChangeText={t => { setPassword(t); setPassErr(''); }} />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Text style={s.showHide}>{showPass ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
        {!!passErr && <Text style={s.errTxt}>⚠  {passErr}</Text>}

        <Text style={s.lbl}>Confirm Password</Text>
        <View style={[s.field, confErr && s.fieldErr]}>
          <Text style={s.fieldIcon}>🔒</Text>
          <TextInput style={s.fieldInput} placeholder="Re-enter your password" placeholderTextColor="#aaa" secureTextEntry={!showPass} value={confirm} onChangeText={t => { setConfirm(t); setConfErr(''); }} />
        </View>
        {!!confErr && <Text style={s.errTxt}>⚠  {confErr}</Text>}

        <TouchableOpacity style={s.bigBtn} onPress={handleSignup} disabled={loading}>
          <LinearGradient colors={['#1a7a4a', '#25a865']} style={s.bigBtnGrad}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.bigBtnTxt}>SIGN UP</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <View style={s.switchRow}>
          <Text style={s.switchTxt}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={s.switchLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── HOME SCREEN ──────────────────────────────────────────────
const INTERESTS = ['Historic Sites', 'Food Tours', 'Nature', 'Adventure', 'Shopping', 'Culture'];
const CITIES    = ['Lahore', 'Islamabad', 'Karachi', 'Hunza', 'Skardu', 'Murree', 'Swat', 'Peshawar'];
const DAYS_LIST = ['1', '2', '3', '4', '5', '6', '7', '10', '14'];

function HomeScreen({ navigation }) {
  const { currentUser, authToken } = useContext(UserContext);
  const [dest,     setDest]     = useState('');
  const [days,     setDays]     = useState('3');
  const [budget,   setBudget]   = useState('');
  const [selected, setSelected] = useState([]);
  const [weather,  setWeather]  = useState(null);
  const [forecast, setForecast] = useState([]);
  const [wLoading, setWLoading] = useState(false);
  const [wError,   setWError]   = useState('');
  const [genLoading, setGenLoading] = useState(false);

  const toggle = i => setSelected(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);

  useEffect(() => {
    const city = dest.trim();
    const dayCount = parseInt(days, 10) || 3;

    if (!city) {
      setWeather(null);
      setForecast([]);
      setWError('');
      return;
    }

    let cancelled = false;
    setWLoading(true);
    setWError('');

    apiRequest(`/weather?city=${encodeURIComponent(city)}&days=${dayCount}`)
      .then((data) => {
        if (cancelled) return;
        setWeather(data.weather || null);
        setForecast(Array.isArray(data.forecast) ? data.forecast : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setWeather(null);
        setForecast([]);
        setWError(err?.message || 'Weather request failed');
      })
      .finally(() => {
        if (cancelled) return;
        setWLoading(false);
      });

    return () => { cancelled = true; };
  }, [dest, days]);

  const handleGenerate = async () => {
    const city = dest.trim();
    const dayCount = parseInt(days, 10) || 3;
    const budgetValue = Number(budget);

    if (!city) { Alert.alert('Missing', 'Please enter a destination'); return; }
    if (!Number.isFinite(budgetValue) || budgetValue <= 0) { Alert.alert('Missing', 'Please enter a valid budget'); return; }
    if (!authToken) { Alert.alert('Login Required', 'Please login to generate and save trips.'); navigation.navigate('Login'); return; }

    setGenLoading(true);
    try {
      const { trip } = await apiRequest('/trips/generate', {
        method: 'POST',
        token: authToken,
        body: { destination: city, days: dayCount, budget: budgetValue, interests: selected },
      });

      navigation.navigate('Itinerary', { trip });
    } catch (error) {
      Alert.alert('Generate Failed', error?.message || 'Trip generation failed');
    } finally {
      setGenLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0d5c2e', '#25a865']} style={s.homeHeader}>
        <Text style={s.homeHello}>Hello, {currentUser?.fullName?.split(' ')[0] || 'Traveler'} 👋</Text>
        <Text style={s.homeTitle}>Smart Travel Planner</Text>
        <Text style={s.homeSub}>AI-powered itineraries for Pakistan</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={s.secLabel}>Popular Destinations</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16, marginBottom: 8 }}>
          {CITIES.map(c => (
            <TouchableOpacity key={c} style={[s.cityChip, dest === c && s.cityChipOn]} onPress={() => setDest(c)}>
              <Text style={[s.cityChipTxt, dest === c && s.cityChipTxtOn]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {wLoading && !!dest.trim() && (
          <View style={s.sec}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator color="#1a7a4a" />
              <Text style={{ marginLeft: 10, color: '#555', fontSize: 13 }}>Loading weather for {dest.trim()}...</Text>
            </View>
          </View>
        )}

        {!!wError && (
          <View style={s.sec}>
            <Text style={s.secTitle}>Weather</Text>
            <Text style={{ color: '#e53935', fontSize: 13 }}>{wError}</Text>
            <Text style={{ color: '#888', fontSize: 12, marginTop: 6 }}>Backend: {API_BASE_URL}</Text>
          </View>
        )}

        {!wLoading && weather && (
          <View style={s.sec}>
            <Text style={s.secTitle}>Weather in {weather.city}</Text>
            <Text style={{ fontSize: 34, fontWeight: '800', color: '#222' }}>{weather.temp}°C</Text>
            <Text style={{ fontSize: 13, color: '#555', textTransform: 'capitalize' }}>{weather.description}</Text>
            <Text style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
              Humidity {weather.humidity}%  •  Wind {weather.wind} m/s  •  Feels {weather.feelsLike}°C
            </Text>
          </View>
        )}

        {!wLoading && forecast.length > 0 && (
          <View style={s.sec}>
            <Text style={s.secTitle}>{forecast.length}-Day Forecast</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {forecast.map((d) => (
                <View
                  key={String(d.dayNumber || d.label)}
                  style={{
                    backgroundColor: '#f8f8f8',
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    marginRight: 10,
                    minWidth: 110,
                  }}
                >
                  <Text style={{ fontSize: 11, color: '#888', fontWeight: '600' }}>{d.label}</Text>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: '#1a7a4a', marginTop: 4 }}>{d.temp}°C</Text>
                  <Text style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{d.main}</Text>
                </View>
              ))}
            </ScrollView>
            {!!forecast[0]?.advisory && (
              <Text style={{ fontSize: 12, color: '#1a7a4a', marginTop: 10 }}>{forecast[0].advisory}</Text>
            )}
          </View>
        )}

        <View style={s.formCard}>
          <Text style={s.formTitle}>Plan Your Trip</Text>

          <Text style={s.lbl}>Destination</Text>
          <View style={s.field}>
            <Text style={s.fieldIcon}>📍</Text>
            <TextInput style={s.fieldInput} placeholder="e.g. Lahore, Hunza, Islamabad" placeholderTextColor="#aaa" value={dest} onChangeText={setDest} />
          </View>

          <Text style={s.lbl}>Number of Days</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            {DAYS_LIST.map(d => (
              <TouchableOpacity key={d} style={[s.dayChip, days === d && s.dayChipOn]} onPress={() => setDays(d)}>
                <Text style={[s.dayChipTxt, days === d && s.dayChipTxtOn]}>{d} {d === '1' ? 'Day' : 'Days'}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={s.lbl}>Budget (PKR)</Text>
          <View style={s.field}>
            <Text style={s.fieldIcon}>💰</Text>
            <TextInput style={s.fieldInput} placeholder="e.g. 50000" placeholderTextColor="#aaa" keyboardType="numeric" value={budget} onChangeText={setBudget} />
          </View>

          <Text style={s.lbl}>Your Interests</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {INTERESTS.map(i => (
              <TouchableOpacity key={i} style={[s.intChip, selected.includes(i) && s.intChipOn]} onPress={() => toggle(i)}>
                <Text style={[s.intChipTxt, selected.includes(i) && s.intChipTxtOn]}>{i}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={s.genBtn} onPress={handleGenerate} disabled={genLoading}>
            <LinearGradient colors={['#1a7a4a', '#25a865']} style={s.genBtnGrad}>
              {genLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.genBtnTxt}>✨  Generate Itinerary</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── ITINERARY SCREEN ─────────────────────────────────────────
const T_BG  = { historic: '#e8f5e9', food: '#fff3e0', nature: '#e3f2fd', shopping: '#fce4ec', culture: '#f3e5f5' };
const T_CLR = { historic: '#1a7a4a', food: '#e65100', nature: '#1565c0', shopping: '#c62828', culture: '#6a1b9a' };
const T_LBL = { historic: 'Historic', food: 'Food', nature: 'Nature', shopping: 'Shopping', culture: 'Culture' };

function ItineraryScreen({ navigation, route }) {
  const { trip, destination = 'Lahore', numberOfDays = 3, budget = '50000' } = route?.params || {};

  const fallback = generateItinerary(destination, numberOfDays);
  const daysData = Array.isArray(trip?.itinerary) && trip.itinerary.length ? trip.itinerary : fallback.days;
  const cityName = trip?.destination || fallback.cityName;
  const dayCount = trip?.days || numberOfDays;
  const budgetValue = trip?.budget ?? budget;

  const [day, setDay] = useState(1);
  const cur = daysData.find(d => d.day === day) || daysData[0];

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0d5c2e', '#25a865']} style={s.itinHead}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.itinTitle}>{cityName} Trip</Text>
        <Text style={s.itinSub}>{dayCount} Days  •  {dayCount * 5} Activities</Text>
        <View style={s.budgBadge}><Text style={s.budgBadgeTxt}>Budget: PKR {Number(budgetValue).toLocaleString()}</Text></View>
      </LinearGradient>

      <View style={{ backgroundColor: '#fff', paddingVertical: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 12 }}>
          {daysData.map(d => (
            <TouchableOpacity key={d.day} style={[s.dayTab, day === d.day && s.dayTabOn]} onPress={() => setDay(d.day)}>
              <Text style={[s.dayTabTxt, day === d.day && s.dayTabTxtOn]}>Day {d.day}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={s.dayTitle}>{cur.title}</Text>
          <Text style={{ fontSize: 12, color: '#888' }}>Day {day} of {dayCount}</Text>
        </View>
        {!!cur.weatherNote && (
          <View style={[s.sec, { marginHorizontal: 0 }]}>
            <Text style={{ fontSize: 12, color: '#555' }}>{cur.weatherNote}</Text>
          </View>
        )}
        {cur.activities.map((a, i) => (
          <View key={i} style={s.actRow}>
            <View style={s.tlCol}>
              <View style={s.tlDot} />
              {i < cur.activities.length - 1 && <View style={s.tlLine} />}
            </View>
            <View style={s.actCard}>
              <Text style={s.actTime}>{a.time}</Text>
              <Text style={s.actPlace}>{a.place}</Text>
              <View style={[s.actBadge, { backgroundColor: T_BG[a.type] || '#f5f5f5' }]}>
                <Text style={[s.actBadgeTxt, { color: T_CLR[a.type] || '#333' }]}>{T_LBL[a.type] || a.type}</Text>
              </View>
            </View>
          </View>
        ))}
        <View style={s.navRow}>
          <TouchableOpacity style={{ opacity: day === 1 ? 0.3 : 1 }} onPress={() => day > 1 && setDay(day - 1)}>
            <Text style={s.navTxt}>← Previous Day</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ opacity: day === dayCount ? 0.3 : 1 }} onPress={() => day < dayCount && setDay(day + 1)}>
            <Text style={s.navTxt}>Next Day →</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

// ─── MAP SCREEN — NO react-native-maps ────────────────────────
function MapScreen() {
  const [sel, setSel] = useState(null);
  const pins = [
    { id: 1, name: 'Badshahi Mosque',  time: '9:00 AM',  top: '20%', left: '30%' },
    { id: 2, name: 'Lahore Fort',      time: '11:30 AM', top: '38%', left: '58%' },
    { id: 3, name: 'Food Street',      time: '1:00 PM',  top: '54%', left: '38%' },
    { id: 4, name: 'Minar-e-Pakistan', time: '3:00 PM',  top: '65%', left: '62%' },
    { id: 5, name: 'Anarkali Bazaar',  time: '7:00 PM',  top: '78%', left: '44%' },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0d5c2e', '#25a865']} style={s.mapHead}>
        <Text style={s.mapHeadTitle}>Map View</Text>
        <Text style={s.mapHeadSub}>Smart Travel Planner</Text>
      </LinearGradient>
      <View style={s.mapBox}>
        <View style={s.mapGrid}>
          {[30, 55, 75].map(p => <View key={'h'+p} style={[s.gridLine, { top: p+'%', width: '100%', height: 1 }]} />)}
          {[30, 55, 75].map(p => <View key={'v'+p} style={[s.gridLine, { left: p+'%', height: '100%', width: 1 }]} />)}
          {pins.map(pin => (
            <TouchableOpacity key={pin.id} style={[s.pin, { top: pin.top, left: pin.left }, sel === pin.id && s.pinSel]} onPress={() => setSel(pin.id)}>
              <Text style={s.pinTxt}>{pin.id}</Text>
            </TouchableOpacity>
          ))}
          <Text style={s.mapWatermark}>OpenStreetMap</Text>
        </View>
      </View>
      <View style={s.mapSummary}>
        <Text style={s.mapSummaryTitle}>Today's Plan</Text>
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 190 }}>
          {pins.map((pin, i) => (
            <TouchableOpacity key={pin.id} style={[s.mapRow, sel === pin.id && s.mapRowSel]} onPress={() => setSel(pin.id)}>
              <View style={s.mapNum}><Text style={s.mapNumTxt}>{i + 1}</Text></View>
              <Text style={s.mapPlace}>{pin.name}</Text>
              <Text style={s.mapTime}>{pin.time}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

// ─── HOTEL SCREEN ─────────────────────────────────────────────
const HOTELS = [
  { id: 1, name: 'Serena Hotel Islamabad',   loc: 'Islamabad', price: 15000, stars: 5, tag: 'Luxury'    },
  { id: 2, name: 'Avari Towers Lahore',      loc: 'Lahore',    price: 12000, stars: 4, tag: 'Popular'   },
  { id: 3, name: 'Pearl Continental Lahore', loc: 'Lahore',    price: 13000, stars: 5, tag: 'Top Rated' },
  { id: 4, name: 'Shangrila Resort Skardu',  loc: 'Skardu',    price: 8000,  stars: 4, tag: 'Scenic'    },
  { id: 5, name: 'PC Bhurban Murree',        loc: 'Murree',    price: 9000,  stars: 4, tag: 'Hill Top'  },
  { id: 6, name: 'Hotel One Lahore',         loc: 'Lahore',    price: 5500,  stars: 3, tag: 'Budget'    },
];

function HotelScreen() {
  const [sel, setSel] = useState(null);
  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0d5c2e', '#25a865']} style={s.hotelHead}>
        <Text style={s.hotelHeadTitle}>Select Hotel</Text>
        <Text style={s.hotelHeadSub}>Best stays for your trip</Text>
      </LinearGradient>
      <ScrollView style={{ padding: 12 }} showsVerticalScrollIndicator={false}>
        {HOTELS.map(h => (
          <View key={h.id} style={[s.hotelCard, sel === h.id && s.hotelCardSel]}>
            <LinearGradient colors={['#1a7a4a', '#25a865']} style={s.hotelImg}>
              <Text style={s.hotelImgTxt}>{h.name[0]}</Text>
            </LinearGradient>
            <View style={s.hotelInfo}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[s.hotelName, { flex: 1, marginRight: 6 }]}>{h.name}</Text>
                <View style={s.hotelTag}><Text style={s.hotelTagTxt}>{h.tag}</Text></View>
              </View>
              <Text style={s.hotelLoc}>📍 {h.loc}</Text>
              <Text style={s.hotelStars}>{'★'.repeat(h.stars)}{'☆'.repeat(5 - h.stars)}</Text>
              <View style={s.hotelBottom}>
                <Text style={s.hotelPrice}>PKR {h.price.toLocaleString()}<Text style={s.perNight}>/night</Text></Text>
                <TouchableOpacity style={[s.selBtn, sel === h.id && s.selBtnOn]}
                  onPress={() => { setSel(h.id); Alert.alert('Selected!', h.name + ' added to your trip!'); }}>
                  <Text style={[s.selBtnTxt, sel === h.id && s.selBtnTxtOn]}>{sel === h.id ? 'Selected' : 'Select'}</Text>
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

// ─── BUDGET SCREEN ────────────────────────────────────────────
const CATS = [
  { name: 'Hotels',     color: '#1a7a4a', spent: 13000 },
  { name: 'Food',       color: '#f57c00', spent: 8000  },
  { name: 'Transport',  color: '#1565c0', spent: 4000  },
  { name: 'Activities', color: '#6a1b9a', spent: 5000  },
];

function BudgetScreen() {
  const total = 50000;
  const spent = CATS.reduce((s, c) => s + c.spent, 0);
  const rem   = total - spent;
  const pct   = Math.round((spent / total) * 100);
  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0d5c2e', '#25a865']} style={s.budgHead}>
        <Text style={s.budgHeadTitle}>Budget Tracker</Text>
        <Text style={s.budgHeadSub}>Stay within your limits</Text>
      </LinearGradient>
      <ScrollView style={{ padding: 14 }} showsVerticalScrollIndicator={false}>
        <View style={s.budgCards}>
          <View style={[s.budgCard, { backgroundColor: '#e8f5e9' }]}>
            <Text style={s.budgCardLbl}>Total Budget</Text>
            <Text style={[s.budgCardVal, { color: '#1a7a4a' }]}>PKR {total.toLocaleString()}</Text>
          </View>
          <View style={[s.budgCard, { backgroundColor: '#fff3e0' }]}>
            <Text style={s.budgCardLbl}>Spent</Text>
            <Text style={[s.budgCardVal, { color: '#e65100' }]}>PKR {spent.toLocaleString()}</Text>
          </View>
          <View style={[s.budgCard, { backgroundColor: '#e3f2fd' }]}>
            <Text style={s.budgCardLbl}>Remaining</Text>
            <Text style={[s.budgCardVal, { color: '#1565c0' }]}>PKR {rem.toLocaleString()}</Text>
          </View>
        </View>
        <View style={s.sec}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: '#555' }}>Spent {pct}% of budget</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1a7a4a' }}>{pct}%</Text>
          </View>
          <View style={s.progBar}><View style={[s.progFill, { width: pct + '%', backgroundColor: pct > 80 ? '#e53935' : '#1a7a4a' }]} /></View>
        </View>
        <View style={s.sec}>
          <Text style={s.secTitle}>Spending by Category</Text>
          {CATS.map(c => (
            <View key={c.name} style={s.catRow}>
              <View style={[s.catDot, { backgroundColor: c.color }]} />
              <Text style={s.catName}>{c.name}</Text>
              <View style={s.catBarWrap}><View style={[s.catBar, { width: Math.round((c.spent / spent) * 100) + '%', backgroundColor: c.color }]} /></View>
              <Text style={s.catAmt}>PKR {c.spent.toLocaleString()}</Text>
            </View>
          ))}
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

// ─── PROFILE SCREEN ───────────────────────────────────────────
function ProfileScreen({ navigation }) {
  const { currentUser, setCurrentUser, authToken, setAuthToken } = useContext(UserContext);
  const [trips, setTrips] = useState([]);
  const [tLoading, setTLoading] = useState(false);
  const [tError, setTError] = useState('');

  const loadTrips = async () => {
    if (!authToken) return;
    setTLoading(true);
    setTError('');
    try {
      const data = await apiRequest('/trips', { token: authToken });
      setTrips(Array.isArray(data.trips) ? data.trips : []);
    } catch (error) {
      setTrips([]);
      setTError(error?.message || 'Failed to load trips');
    } finally {
      setTLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
    const unsubscribe = navigation.addListener('focus', loadTrips);
    return unsubscribe;
  }, [authToken, navigation]);

  const tripCount = trips.length;
  const totalDays = trips.reduce((sum, trip) => sum + (Number(trip.days) || 0), 0);
  const cityCount = new Set(trips.map((t) => t.destination)).size;
  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0d5c2e', '#25a865']} style={s.profHead}>
        <View style={s.avatar}><Text style={s.avatarTxt}>{currentUser?.initials || 'U'}</Text></View>
        <Text style={s.profName}>{currentUser?.fullName || 'User'}</Text>
        <Text style={s.profEmail}>{currentUser?.email || 'user@example.com'}</Text>
        <View style={s.profBadge}><Text style={s.profBadgeTxt}>Smart Travel Planner Member</Text></View>
      </LinearGradient>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={s.statsRow}>
          <View style={s.statItem}><Text style={s.statVal}>{tripCount}</Text><Text style={s.statLbl}>Trips</Text></View>
          <View style={s.statDiv} />
          <View style={s.statItem}><Text style={s.statVal}>{totalDays}</Text><Text style={s.statLbl}>Days</Text></View>
          <View style={s.statDiv} />
          <View style={s.statItem}><Text style={s.statVal}>{cityCount}</Text><Text style={s.statLbl}>Cities</Text></View>
        </View>
        <View style={s.sec}>
          <Text style={s.secTitle}>Account Info</Text>
          <View style={s.infoRow}><Text style={s.infoLbl}>Full Name</Text><Text style={s.infoVal}>{currentUser?.fullName}</Text></View>
          <View style={s.infoRow}><Text style={s.infoLbl}>Email</Text><Text style={s.infoVal}>{currentUser?.email}</Text></View>
          <View style={s.infoRow}><Text style={s.infoLbl}>Member Since</Text><Text style={s.infoVal}>{currentUser?.createdAt ? new Date(currentUser.createdAt).getFullYear() : '2026'}</Text></View>
        </View>
        <View style={s.sec}>
          <Text style={s.secTitle}>My Trips</Text>
          {tLoading && (
            <View style={{ paddingVertical: 14, alignItems: 'center' }}>
              <ActivityIndicator color="#1a7a4a" />
              <Text style={{ fontSize: 12, color: '#888', marginTop: 8 }}>Loading trips...</Text>
            </View>
          )}
          {!tLoading && !!tError && (
            <Text style={{ fontSize: 13, color: '#e53935', textAlign: 'center', paddingVertical: 10 }}>{tError}</Text>
          )}
          {!tLoading && !tError && trips.length === 0 && (
            <Text style={{ fontSize: 13, color: '#aaa', textAlign: 'center', paddingVertical: 20 }}>No trips yet. Generate your first itinerary!</Text>
          )}
          {!tLoading && trips.length > 0 && trips.map((trip) => (
            <TouchableOpacity
              key={trip._id}
              style={[s.infoRow, { borderBottomColor: '#f0f0f0' }]}
              onPress={() => navigation.navigate('Itinerary', { trip })}
            >
              <Text style={[s.infoLbl, { color: '#222' }]}>{trip.destination}</Text>
              <Text style={s.infoVal}>{trip.days} days</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={() =>
          Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => {
              AsyncStorage.removeItem(AUTH_TOKEN_KEY).catch(() => {});
              setAuthToken(null);
              setCurrentUser(null);
              navigation.replace('Login');
            } },
          ])
        }>
          <Text style={s.logoutTxt}>Logout</Text>
        </TouchableOpacity>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

// ─── BOTTOM TABS ──────────────────────────────────────────────
function MainApp() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#1a7a4a',
      tabBarInactiveTintColor: '#aaa',
      tabBarStyle: { borderTopWidth: 0.5, borderTopColor: '#e0e0e0', paddingBottom: 6, paddingTop: 4, height: 60 },
      tabBarIcon: () => {
        const icons = { Home: '🏠', Map: '🗺', Hotels: '🏨', Budget: '💰', Profile: '👤' };
        return <Text style={{ fontSize: 20 }}>{icons[route.name]}</Text>;
      },
    })}>
      <Tab.Screen name="Home"    component={HomeScreen}    />
      <Tab.Screen name="Map"     component={MapScreen}     />
      <Tab.Screen name="Hotels"  component={HotelScreen}   />
      <Tab.Screen name="Budget"  component={BudgetScreen}  />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) {
          if (!cancelled) setAuthLoading(false);
          return;
        }

        const data = await apiRequest('/auth/me', { token });
        if (cancelled) return;

        setAuthToken(token);
        setCurrentUser(toAppUser(data.user));
      } catch (error) {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY).catch(() => {});
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, authToken, setAuthToken, authLoading, setAuthLoading }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash"    component={SplashScreen}    />
          <Stack.Screen name="Login"     component={LoginScreen}     />
          <Stack.Screen name="Signup"    component={SignupScreen}     />
          <Stack.Screen name="MainApp"   component={MainApp}         />
          <Stack.Screen name="Itinerary" component={ItineraryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserContext.Provider>
  );
}

// ─── STYLES ───────────────────────────────────────────────────
const s = StyleSheet.create({
  // Splash
  splashBg:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  globe:          { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 28 },
  globeIcon:      { fontSize: 38, color: '#fff' },
  splashTitle1:   { fontSize: 42, color: '#fff', fontWeight: '800', letterSpacing: 1 },
  splashTitle2:   { fontSize: 42, color: 'rgba(255,255,255,0.8)', fontWeight: '300', letterSpacing: 1, marginTop: -6 },
  splashTagline:  { fontSize: 12, color: 'rgba(255,255,255,0.8)', letterSpacing: 2, marginTop: 10 },
  splashLine:     { width: 50, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1, marginVertical: 14 },
  splashSub:      { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontStyle: 'italic' },
  splashBottom:   { position: 'absolute', bottom: 48, alignItems: 'center' },
  dots:           { flexDirection: 'row', gap: 6, marginBottom: 14 },
  dot:            { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive:      { backgroundColor: '#fff', width: 24 },
  uniText:        { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  campusText:     { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3 },
  // Auth
  authBg:         { flexGrow: 1, backgroundColor: '#f5f5f5' },
  authTop:        { paddingTop: 60, paddingBottom: 24, alignItems: 'center' },
  authTopTitle:   { fontSize: 20, color: '#fff', fontWeight: '800', marginTop: 6, textAlign: 'center' },
  authTopSub:     { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  authCard:       { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 28, flex: 1 },
  authCardTitle:  { fontSize: 24, fontWeight: '700', color: '#1a7a4a', textAlign: 'center', marginBottom: 20 },
  lbl:            { fontSize: 13, color: '#555', fontWeight: '600', marginBottom: 6, marginTop: 12 },
  field:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', paddingHorizontal: 12, height: 50 },
  fieldErr:       { borderColor: '#e53935', borderWidth: 1.5, backgroundColor: '#fff5f5' },
  fieldIcon:      { fontSize: 16, marginRight: 8 },
  fieldInput:     { flex: 1, fontSize: 14, color: '#333' },
  showHide:       { fontSize: 13, color: '#1a7a4a', fontWeight: '600' },
  errTxt:         { fontSize: 12, color: '#e53935', marginTop: 5, marginLeft: 4 },
  successBanner:  { backgroundColor: '#ecfdf3', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#b7ebc6', marginBottom: 18 },
  successBannerTitle: { color: '#0d5c2e', fontSize: 14, fontWeight: '800', marginBottom: 3 },
  successBannerTxt: { color: '#25613c', fontSize: 13, lineHeight: 18 },
  forgotWrap:     { alignItems: 'flex-end', marginTop: 8 },
  forgotTxt:      { fontSize: 13, color: '#1a7a4a', fontWeight: '500' },
  bigBtn:         { marginTop: 24, borderRadius: 12, overflow: 'hidden' },
  bigBtnGrad:     { height: 52, alignItems: 'center', justifyContent: 'center' },
  bigBtnTxt:      { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  switchRow:      { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  switchTxt:      { fontSize: 14, color: '#666' },
  switchLink:     { fontSize: 14, color: '#1a7a4a', fontWeight: '700' },
  hint:           { marginTop: 20, backgroundColor: '#f0f9f4', borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: '#1a7a4a' },
  hintTitle:      { fontSize: 12, fontWeight: '700', color: '#1a7a4a', marginBottom: 4 },
  hintTxt:        { fontSize: 12, color: '#555', marginTop: 2 },
  // Home
  homeHeader:     { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  homeHello:      { fontSize: 15, color: 'rgba(255,255,255,0.8)' },
  homeTitle:      { fontSize: 24, color: '#fff', fontWeight: '800' },
  homeSub:        { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  secLabel:       { fontSize: 15, fontWeight: '700', color: '#333', marginTop: 16, marginLeft: 16, marginBottom: 8 },
  cityChip:       { backgroundColor: '#e8f5e9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: '#c8e6c9' },
  cityChipOn:     { backgroundColor: '#1a7a4a', borderColor: '#1a7a4a' },
  cityChipTxt:    { color: '#1a7a4a', fontWeight: '600', fontSize: 13 },
  cityChipTxtOn:  { color: '#fff' },
  formCard:       { backgroundColor: '#fff', borderRadius: 20, margin: 16, padding: 20, elevation: 4 },
  formTitle:      { fontSize: 18, fontWeight: '700', color: '#1a7a4a', marginBottom: 4 },
  dayChip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#f8f8f8', marginRight: 8, marginTop: 6 },
  dayChipOn:      { backgroundColor: '#1a7a4a', borderColor: '#1a7a4a' },
  dayChipTxt:     { fontSize: 13, color: '#555' },
  dayChipTxtOn:   { color: '#fff', fontWeight: '600' },
  intChip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#f8f8f8' },
  intChipOn:      { backgroundColor: '#1a7a4a', borderColor: '#1a7a4a' },
  intChipTxt:     { fontSize: 13, color: '#555' },
  intChipTxtOn:   { color: '#fff', fontWeight: '600' },
  genBtn:         { marginTop: 24, borderRadius: 14, overflow: 'hidden' },
  genBtnGrad:     { height: 54, alignItems: 'center', justifyContent: 'center' },
  genBtnTxt:      { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  // Itinerary
  itinHead:       { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
  backTxt:        { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginBottom: 8 },
  itinTitle:      { fontSize: 24, color: '#fff', fontWeight: '800' },
  itinSub:        { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  budgBadge:      { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start' },
  budgBadgeTxt:   { color: '#fff', fontSize: 13, fontWeight: '600' },
  dayTab:         { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8 },
  dayTabOn:       { backgroundColor: '#1a7a4a' },
  dayTabTxt:      { fontSize: 13, fontWeight: '600', color: '#666' },
  dayTabTxtOn:    { color: '#fff' },
  dayTitle:       { fontSize: 18, fontWeight: '700', color: '#1a7a4a' },
  actRow:         { flexDirection: 'row', marginBottom: 4 },
  tlCol:          { width: 24, alignItems: 'center' },
  tlDot:          { width: 12, height: 12, borderRadius: 6, backgroundColor: '#1a7a4a', marginTop: 14 },
  tlLine:         { width: 2, flex: 1, backgroundColor: '#c8e6c9', marginTop: 4 },
  actCard:        { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginLeft: 8, marginBottom: 8, elevation: 2 },
  actTime:        { fontSize: 12, color: '#888', marginBottom: 4 },
  actPlace:       { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 6 },
  actBadge:       { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  actBadgeTxt:    { fontSize: 11, fontWeight: '600' },
  navRow:         { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 16 },
  navTxt:         { fontSize: 14, color: '#1a7a4a', fontWeight: '600', padding: 12 },
  // Map
  mapHead:        { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20 },
  mapHeadTitle:   { fontSize: 22, fontWeight: '800', color: '#fff' },
  mapHeadSub:     { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  mapBox:         { flex: 1, padding: 12 },
  mapGrid:        { flex: 1, backgroundColor: '#d4edda', borderRadius: 16, overflow: 'hidden', position: 'relative' },
  gridLine:       { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.07)' },
  pin:            { position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: '#1a7a4a', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', elevation: 4 },
  pinSel:         { backgroundColor: '#e53935', width: 36, height: 36, borderRadius: 18 },
  pinTxt:         { color: '#fff', fontWeight: '800', fontSize: 13 },
  mapWatermark:   { position: 'absolute', bottom: 8, right: 10, fontSize: 10, color: 'rgba(0,0,0,0.3)' },
  mapSummary:     { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, elevation: 5 },
  mapSummaryTitle:{ fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 10 },
  mapRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  mapRowSel:      { backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 4 },
  mapNum:         { width: 26, height: 26, borderRadius: 13, backgroundColor: '#1a7a4a', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  mapNumTxt:      { fontSize: 12, fontWeight: '700', color: '#fff' },
  mapPlace:       { flex: 1, fontSize: 13, color: '#222', fontWeight: '600' },
  mapTime:        { fontSize: 12, color: '#888' },
  // Hotel
  hotelHead:      { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
  hotelHeadTitle: { fontSize: 24, color: '#fff', fontWeight: '800' },
  hotelHeadSub:   { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  hotelCard:      { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, marginBottom: 12, overflow: 'hidden', elevation: 3 },
  hotelCardSel:   { borderWidth: 2, borderColor: '#1a7a4a' },
  hotelImg:       { width: 90, alignItems: 'center', justifyContent: 'center' },
  hotelImgTxt:    { fontSize: 32, color: '#fff', fontWeight: '800' },
  hotelInfo:      { flex: 1, padding: 12 },
  hotelName:      { fontSize: 14, fontWeight: '700', color: '#222' },
  hotelLoc:       { fontSize: 12, color: '#888', marginTop: 3 },
  hotelStars:     { fontSize: 12, color: '#f4a61d', marginTop: 3 },
  hotelBottom:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  hotelPrice:     { fontSize: 15, fontWeight: '800', color: '#1a7a4a' },
  perNight:       { fontSize: 11, fontWeight: '400', color: '#888' },
  hotelTag:       { backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  hotelTagTxt:    { fontSize: 10, color: '#1a7a4a', fontWeight: '600' },
  selBtn:         { backgroundColor: '#e8f5e9', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  selBtnOn:       { backgroundColor: '#1a7a4a' },
  selBtnTxt:      { fontSize: 13, color: '#1a7a4a', fontWeight: '600' },
  selBtnTxtOn:    { color: '#fff' },
  // Budget
  budgHead:       { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
  budgHeadTitle:  { fontSize: 24, color: '#fff', fontWeight: '800' },
  budgHeadSub:    { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  budgCards:      { flexDirection: 'row', gap: 8, marginBottom: 12 },
  budgCard:       { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  budgCardLbl:    { fontSize: 11, color: '#666', marginBottom: 4 },
  budgCardVal:    { fontSize: 12, fontWeight: '800' },
  progBar:        { height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, overflow: 'hidden' },
  progFill:       { height: '100%', borderRadius: 5 },
  catRow:         { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  catDot:         { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  catName:        { width: 80, fontSize: 13, color: '#555' },
  catBarWrap:     { flex: 1, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden', marginHorizontal: 8 },
  catBar:         { height: '100%', borderRadius: 4 },
  catAmt:         { fontSize: 12, fontWeight: '600', color: '#333', width: 80, textAlign: 'right' },
  // Profile
  profHead:       { paddingTop: 56, paddingBottom: 28, alignItems: 'center' },
  avatar:         { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff', marginBottom: 12 },
  avatarTxt:      { fontSize: 28, color: '#fff', fontWeight: '800' },
  profName:       { fontSize: 22, color: '#fff', fontWeight: '800' },
  profEmail:      { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  profBadge:      { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4 },
  profBadgeTxt:   { color: '#fff', fontSize: 12 },
  statsRow:       { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 16, elevation: 3 },
  statItem:       { flex: 1, alignItems: 'center' },
  statVal:        { fontSize: 22, fontWeight: '800', color: '#1a7a4a' },
  statLbl:        { fontSize: 12, color: '#888', marginTop: 2 },
  statDiv:        { width: 1, backgroundColor: '#eee' },
  infoRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#f5f5f5' },
  infoLbl:        { fontSize: 13, color: '#888' },
  infoVal:        { fontSize: 13, fontWeight: '600', color: '#222' },
  logoutBtn:      { marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#ffcdd2' },
  logoutTxt:      { fontSize: 15, fontWeight: '700', color: '#e53935' },
  // Shared
  sec:            { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 12, elevation: 2 },
  secTitle:       { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 14 },
});
