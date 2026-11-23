import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Modal,
  Platform,
  Pressable as TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AppIcon from '../components/AppIcon';
import AppText from '../components/AppText';
import { useApp } from '../context/AppContext';
import { apiRequest, userStorage } from '../api/client';
import { colors, fonts } from '../theme';
import { navigateRoot } from '../navigation/navigationRef';

function deriveNameFromEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const username = email.split('@')[0] || '';
  if (!username) return '';
  const cleaned = username.replace(/[0-9]+/g, ' ').replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return username.charAt(0).toUpperCase() + username.slice(1);
  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function getStoredUserInfo() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem('smartTravelPlanner.currentUser') || window.localStorage.getItem('stp_last_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const email = String(parsed.email || '').trim();
        const fullName = String(parsed.fullName || parsed.name || '').trim();
        if (email || fullName) return { ...parsed, email, fullName };
      }
    }
  } catch (_) {}
  const email = String(window.localStorage.getItem('stp_user_email') || '').trim();
  const fullName = String(window.localStorage.getItem('stp_user_fullname') || '').trim();
  if (email || fullName) return { email, fullName };
  return null;
}

const natureBg = require('../../assets/splash_nature_bg.jpg');
const mountainLogo = require('../../assets/stp_mountain_logo_clean.png');
const leafFlourish = require('../../assets/auth_leaf_flourish_clean.png');
const bottomMountains = require('../../assets/auth_bottom_mountains_clean.png');

const COUNTRIES = [
  { name: 'Pakistan', flag: '🇵🇰' },
  { name: 'United Arab Emirates', flag: '🇦🇪' },
  { name: 'Saudi Arabia', flag: '🇸🇦' },
  { name: 'United Kingdom', flag: '🇬🇧' },
  { name: 'United States', flag: '🇺🇸' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Turkey', flag: '🇹🇷' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'Malaysia', flag: '🇲🇾' },
  { name: 'Australia', flag: '🇦🇺' },
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80',
];

const ALL_INTERESTS = ['Nature', 'Adventure', 'History', 'Culture', 'Food', 'Shopping'];
const HOTEL_TYPES = ['Any', 'Budget', 'Mid-range', 'Luxury', 'Boutique'];

export default function ProfileScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 940;

  const {
    user,
    token,
    logout,
    trips,
    tripsLoading,
    refreshTrips,
    openTrip,
    deleteTrip,
    currentTrip,
    updateProfile,
    updatePreferences,
  } = useApp();

  // Navigation / Tabs state
  const [sidebarTab, setSidebarTab] = useState('profile'); // 'profile' | 'favorites' | 'trips'
  const [profileTab, setProfileTab] = useState('personal'); // 'personal' | 'preferences' | 'stats'

  // Input ref for editing full name
  const fullNameInputRef = useRef(null);
  const [isEditingName, setIsEditingName] = useState(false);

  // Dynamic User Profile Form State - Strictly follows logged-in user with storage fallback
  const storedUser = useMemo(() => getStoredUserInfo(), []);
  const initialEmail = user?.email || storedUser?.email || '';
  const initialName = user?.fullName || storedUser?.fullName || (initialEmail ? deriveNameFromEmail(initialEmail) : '');

  const [fullName, setFullName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [country, setCountry] = useState(user?.country || storedUser?.country || 'Pakistan');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || storedUser?.avatarUrl || '');

  // Country Picker Modal
  const [countryModalVisible, setCountryModalVisible] = useState(false);

  // Avatar Picker Modal (for URL / Presets / File)
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [customAvatarUrlInput, setCustomAvatarUrlInput] = useState('');

  // Preferences State
  const [selectedInterests, setSelectedInterests] = useState(user?.preferences?.interests || ['Nature', 'Adventure']);
  const [hotelType, setHotelType] = useState(user?.preferences?.preferredHotelType || 'Mid-range');
  const [budgetVal, setBudgetVal] = useState(String(user?.preferences?.defaultBudget || 75000));

  // Favorites & Trips State
  const [favorites, setFavorites] = useState([]);
  const [favLoading, setFavLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Synchronize user profile from AppContext and LocalStorage
  function syncUserProfile() {
    const stored = getStoredUserInfo();
    const activeEmail = String(user?.email || stored?.email || email || '').trim();
    let activeName = String(user?.fullName || user?.name || stored?.fullName || fullName || '').trim();
    if ((!activeName || activeName.toLowerCase() === 'traveler' || activeName.toLowerCase() === 'user') && activeEmail) {
      activeName = deriveNameFromEmail(activeEmail);
    }
    if (activeName) setFullName(activeName);
    if (activeEmail) setEmail(activeEmail);
    if (user?.country || stored?.country) setCountry(String(user?.country || stored?.country || 'Pakistan'));

    let dp = user?.avatarUrl || stored?.avatarUrl;
    if (!dp && typeof window !== 'undefined' && window.localStorage) {
      dp = window.localStorage.getItem(`stp_avatar_${user?.id || user?.email || activeEmail || 'user'}`) || '';
    }
    if (dp) setAvatarUrl(dp);

    if (user?.preferences) {
      if (Array.isArray(user.preferences.interests)) setSelectedInterests(user.preferences.interests);
      if (user.preferences.preferredHotelType) setHotelType(user.preferences.preferredHotelType);
      if (user.preferences.defaultBudget) setBudgetVal(String(user.preferences.defaultBudget));
    }
  }

  // Trigger edit on name input
  function handleStartEditName() {
    setProfileTab('personal');
    setIsEditingName(true);
    setTimeout(() => {
      fullNameInputRef.current?.focus();
    }, 100);
  }

  // Sync state whenever logged-in user changes
  useEffect(() => {
    syncUserProfile();
  }, [user]);

  // Load Trips and Favorites data
  async function loadData() {
    syncUserProfile();
    setError('');
    try {
      await refreshTrips();
    } catch (requestError) {
      setError(requestError.message);
    }

    if (token) {
      setFavLoading(true);
      try {
        const favRes = await apiRequest('/destinations/favorites', { token });
        setFavorites(favRes.favorites || []);
      } catch (err) {
        // silent fail on favorites in profile
      } finally {
        setFavLoading(false);
      }
    }
  }

  useEffect(() => {
    loadData();
    const unsub = navigation?.addListener ? navigation.addListener('focus', loadData) : () => {};
    return unsub;
  }, [navigation, token]);

  // Compute User Initials strictly from logged in user
  const userInitials = useMemo(() => {
    if (user?.initials) return user.initials;
    const name = (fullName || user?.fullName || '').trim();
    if (name && name.toLowerCase() !== 'user') {
      const parts = name.split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return (parts[0]?.[0] || 'T').toUpperCase();
    }
    const em = (email || user?.email || '').trim();
    if (em) return em[0].toUpperCase();
    return 'U';
  }, [user?.initials, fullName, user?.fullName, email, user?.email]);

  // Find country flag
  const currentFlag = useMemo(() => {
    const found = COUNTRIES.find((c) => c.name.toLowerCase() === country.toLowerCase());
    return found ? found.flag : '🇵🇰';
  }, [country]);

  // Top Back handler
  function handleGoBack() {
    if (currentTrip) {
      openTrip(currentTrip);
      navigateRoot('Itinerary', { trip: currentTrip });
    } else if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigateRoot('MainApp', { screen: 'Home' });
    }
  }

  // Handle Image Upload / DP selection
  function handlePickImage() {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);

      fileInput.onchange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (loadEvent) => {
            const img = new (window.Image || Image)();
            img.onload = () => {
              // Scale to max 300x300 for fast loading
              const canvas = document.createElement('canvas');
              let w = img.width;
              let h = img.height;
              const maxDim = 300;
              if (w > maxDim || h > maxDim) {
                if (w > h) {
                  h = Math.round((h * maxDim) / w);
                  w = maxDim;
                } else {
                  w = Math.round((w * maxDim) / h);
                  h = maxDim;
                }
              }
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, w, h);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

              setAvatarUrl(compressedDataUrl);
              saveAvatarDirect(compressedDataUrl);
            };
            img.src = loadEvent.target.result;
          };
          reader.readAsDataURL(file);
        }
        document.body.removeChild(fileInput);
      };
      fileInput.click();
    } else {
      // Mobile fallback: open modal with presets or URL input
      setAvatarModalVisible(true);
    }
  }

  async function saveAvatarDirect(newAvatar) {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(`stp_avatar_${user?.id || user?.email || 'user'}`, newAvatar);
      } catch (_) {}
    }
    try {
      await updateProfile({ avatarUrl: newAvatar });
      setSaveSuccess('Display picture updated! ✨');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      console.warn('Avatar update failed:', err.message);
    }
  }

  // Save Changes in Personal Info
  async function handleSaveChanges() {
    const cleanName = String(fullName || '').trim();
    if (!cleanName) {
      setError('Full name cannot be empty');
      return;
    }
    setSaving(true);
    setError('');
    setSaveSuccess('');
    try {
      await updateProfile({
        fullName: cleanName,
        country: String(country || 'Pakistan').trim(),
        avatarUrl: avatarUrl || '',
      });
      if (typeof window !== 'undefined' && window.localStorage) {
        if (avatarUrl) window.localStorage.setItem(`stp_avatar_${user?.id || user?.email || email || 'user'}`, avatarUrl);
        window.localStorage.setItem('stp_user_fullname', cleanName);
        if (email) window.localStorage.setItem('stp_user_email', String(email).trim().toLowerCase());
        const existingStored = userStorage.getSync() || {};
        window.localStorage.setItem('smartTravelPlanner.currentUser', JSON.stringify({
          ...existingStored,
          fullName: cleanName,
          country: String(country || 'Pakistan').trim(),
          avatarUrl: avatarUrl || '',
        }));
      }
      setIsEditingName(false);
      setSaveSuccess('Profile changes saved successfully! ✨');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  // Save Preferences
  async function handleSavePreferences() {
    setSaving(true);
    setError('');
    try {
      const budgetNum = parseInt(budgetVal, 10) || 50000;
      await updatePreferences({
        interests: selectedInterests,
        preferredHotelType: hotelType,
        defaultBudget: budgetNum,
      });
      setSaveSuccess('Travel preferences updated! ✨');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }

  function toggleInterest(item) {
    setSelectedInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }

  // Logout Handler
  async function performLogout() {
    setLoggingOut(true);
    try {
      await logout();
      const parent = navigation?.getParent ? navigation.getParent() : null;
      if (parent && parent.reset) {
        parent.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      } else if (navigation?.reset) {
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      } else {
        navigation?.navigate ? navigation.navigate('Welcome') : navigateRoot('Welcome');
      }
    } catch (err) {
      console.error('Logout error:', err);
      navigateRoot('Welcome');
    } finally {
      setLoggingOut(false);
    }
  }

  function confirmLogout() {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && window.confirm
        ? window.confirm('Are you sure you want to sign out?')
        : true;
      if (confirmed) performLogout();
    } else {
      Alert.alert('Sign out', 'End this session?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: performLogout },
      ]);
    }
  }

  function confirmDelete(trip) {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && window.confirm
        ? window.confirm(`Delete ${trip.destination} saved trip?`)
        : true;
      if (confirmed) {
        deleteTrip(trip._id).catch((requestError) => {
          Alert.alert('Delete failed', requestError.message);
        });
      }
      return;
    }
    Alert.alert('Delete saved trip?', `${trip.destination} and its expenses will be removed.`, [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTrip(trip._id);
          } catch (requestError) {
            Alert.alert('Delete failed', requestError.message);
          }
        },
      },
    ]);
  }

  function chooseTrip(trip) {
    openTrip(trip);
    navigation.navigate('Itinerary', { trip });
  }

  return (
    <View style={styles.page}>
      <StatusBar style="light" />

      {/* Scenic Alpine Mountain Wallpaper */}
      <ImageBackground source={natureBg} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.bgOverlay}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.shell}>

              {/* ==============================================================
                  TOP FLOATING HEADER BAR (Matches Reference Replica)
                  - Left: Back arrow, Mountain logo emblem, "Smart Travel Planner"
                  - Right: Notification Bell, User Avatar Badge / DP
                 ============================================================== */}
              <View style={styles.topHeader}>
                <View style={styles.topHeaderLeft}>
                  <TouchableOpacity
                    onPress={handleGoBack}
                    style={styles.backBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                  >
                    <AppIcon name="arrow-back" size={20} color="#1F2937" />
                  </TouchableOpacity>

                  <View style={styles.logoBadge}>
                    <Image source={mountainLogo} style={styles.logoImg} resizeMode="contain" />
                  </View>

                  <AppText style={styles.brandTitle}>Smart Travel Planner</AppText>
                </View>

                <View style={styles.topHeaderRight}>
                  <TouchableOpacity
                    style={styles.headerIconBtn}
                    onPress={() => navigation.navigate('Alerts')}
                    accessibilityRole="button"
                    accessibilityLabel="Notifications"
                  >
                    <AppIcon name="notifications-outline" size={21} color="#1F2937" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.headerAvatarBadge}
                    onPress={() => {
                      setSidebarTab('profile');
                      setProfileTab('personal');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Open profile"
                  >
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={styles.headerAvatarImg} resizeMode="cover" />
                    ) : (
                      <AppText style={styles.headerAvatarInitials}>{userInitials}</AppText>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* ==============================================================
                  TWO-COLUMN APP LAYOUT (Sidebar on Left, Main Card on Right)
                 ============================================================== */}
              <View style={[styles.mainLayout, isDesktop ? styles.desktopMainLayout : styles.mobileMainLayout]}>

                {/* ------------------------------------------------------------
                    LEFT SIDEBAR
                    - Profile (Active in #0F766E)
                    - Favorites
                    - My Trips
                    - Budget Planner
                    - Settings
                    - Logout
                    - Decorative: Mountain graphic + "Explore Pakistan" script
                   ------------------------------------------------------------ */}
                <View style={[styles.sidebarCard, isDesktop ? styles.desktopSidebar : styles.mobileSidebar]}>
                  <View style={styles.sidebarMenuList}>
                    {/* 1. Profile */}
                    <TouchableOpacity
                      style={[styles.sidebarBtn, sidebarTab === 'profile' && styles.sidebarBtnActive]}
                      onPress={() => setSidebarTab('profile')}
                      activeOpacity={0.85}
                    >
                      <AppIcon
                        name="person"
                        size={18}
                        color={sidebarTab === 'profile' ? '#FFFFFF' : '#475569'}
                        style={styles.sidebarBtnIcon}
                      />
                      <AppText style={[styles.sidebarBtnText, sidebarTab === 'profile' && styles.sidebarBtnTextActive]}>
                        Profile
                      </AppText>
                    </TouchableOpacity>

                    {/* 2. Favorites */}
                    <TouchableOpacity
                      style={[styles.sidebarBtn, sidebarTab === 'favorites' && styles.sidebarBtnActive]}
                      onPress={() => setSidebarTab('favorites')}
                      activeOpacity={0.85}
                    >
                      <AppIcon
                        name="heart-outline"
                        size={18}
                        color={sidebarTab === 'favorites' ? '#FFFFFF' : '#475569'}
                        style={styles.sidebarBtnIcon}
                      />
                      <AppText style={[styles.sidebarBtnText, sidebarTab === 'favorites' && styles.sidebarBtnTextActive]}>
                        Favorites
                      </AppText>
                    </TouchableOpacity>

                    {/* 3. My Trips */}
                    <TouchableOpacity
                      style={[styles.sidebarBtn, sidebarTab === 'trips' && styles.sidebarBtnActive]}
                      onPress={() => setSidebarTab('trips')}
                      activeOpacity={0.85}
                    >
                      <AppIcon
                        name="airplane-outline"
                        size={18}
                        color={sidebarTab === 'trips' ? '#FFFFFF' : '#475569'}
                        style={styles.sidebarBtnIcon}
                      />
                      <AppText style={[styles.sidebarBtnText, sidebarTab === 'trips' && styles.sidebarBtnTextActive]}>
                        My Trips
                      </AppText>
                    </TouchableOpacity>

                    {/* 4. Budget Planner */}
                    <TouchableOpacity
                      style={styles.sidebarBtn}
                      onPress={() => navigation.navigate('MainApp', { screen: 'Budget' })}
                      activeOpacity={0.85}
                    >
                      <AppIcon name="wallet-outline" size={18} color="#475569" style={styles.sidebarBtnIcon} />
                      <AppText style={styles.sidebarBtnText}>Budget Planner</AppText>
                    </TouchableOpacity>

                    {/* 5. Settings */}
                    <TouchableOpacity
                      style={styles.sidebarBtn}
                      onPress={() => navigation.navigate('Settings')}
                      activeOpacity={0.85}
                    >
                      <AppIcon name="settings-outline" size={18} color="#475569" style={styles.sidebarBtnIcon} />
                      <AppText style={styles.sidebarBtnText}>Settings</AppText>
                    </TouchableOpacity>

                    {/* 6. Logout */}
                    <TouchableOpacity
                      style={styles.sidebarBtn}
                      onPress={confirmLogout}
                      activeOpacity={0.85}
                    >
                      <AppIcon name="log-out-outline" size={18} color="#475569" style={styles.sidebarBtnIcon} />
                      <AppText style={styles.sidebarBtnText}>Logout</AppText>
                    </TouchableOpacity>
                  </View>

                  {/* Sidebar Bottom Scenic Footer */}
                  <View style={styles.sidebarFooter}>
                    <Image source={bottomMountains} style={styles.sidebarMountainImg} resizeMode="contain" />
                    <View style={styles.sidebarScriptBox}>
                      <AppText style={styles.sidebarScriptText}>Explore Pakistan</AppText>
                      <View style={styles.sidebarAirplaneTrail}>
                        <AppText style={styles.trailDashes}>·· ·-♡-· ·</AppText>
                        <AppIcon name="airplane" size={13} color="#0F766E" style={{ marginLeft: 3 }} />
                      </View>
                    </View>
                  </View>
                </View>

                {/* ------------------------------------------------------------
                    MAIN CONTENT CARD
                    - Header: "My Profile" + "Manage your account information and preferences"
                    - Leaf Flourish in top-right
                    - Left Sub-card: Avatar with Camera button + Name + Info rows + "👑 Travel Explorer"
                    - Right Sub-card: Tabs ("Personal Info", "Preferences", "Travel Stats") + Form
                   ------------------------------------------------------------ */}
                <View style={styles.mainCard}>
                  {/* Decorative Leaf Flourish (Top Right) */}
                  <View style={styles.leafWrapper} pointerEvents="none">
                    <Image source={leafFlourish} style={styles.leafImg} resizeMode="contain" />
                  </View>

                  {/* Main Card Header */}
                  <View style={styles.mainCardHeader}>
                    <View style={styles.headerUserIconBadge}>
                      <AppIcon name="person" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.mainCardHeaderTexts}>
                      <AppText style={styles.mainCardTitle}>My Profile</AppText>
                      <AppText style={styles.mainCardSubtitle}>
                        Manage your account information and preferences
                      </AppText>
                    </View>
                  </View>

                  {/* Success Alert Banner */}
                  {saveSuccess ? (
                    <View style={styles.successBanner}>
                      <AppIcon name="checkmark-circle" size={18} color="#0F766E" style={{ marginRight: 8 }} />
                      <AppText style={styles.successBannerText}>{saveSuccess}</AppText>
                    </View>
                  ) : null}

                  {/* Error Alert Banner */}
                  {error ? (
                    <View style={styles.errorBanner}>
                      <AppIcon name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
                      <AppText style={styles.errorBannerText}>{error}</AppText>
                    </View>
                  ) : null}

                  {/* SIDEBAR TAB 1: PROFILE MAIN VIEW */}
                  {sidebarTab === 'profile' && (
                    <View style={[styles.profileContentGrid, isDesktop ? styles.desktopGrid : styles.mobileGrid]}>
                      
                      {/* ========================================================
                          PROFILE SUB-CARD (Left)
                          - Circular DP Avatar with Camera icon overlay
                          - Full Name with Edit Icon
                          - Email Address
                          - Info rows: Email, Country
                          - "👑 Travel Explorer" pill
                         ======================================================== */}
                      <View style={[styles.profileSubCard, isDesktop ? styles.desktopProfileSubCard : styles.mobileProfileSubCard]}>
                        {/* Avatar with Camera Overlay */}
                        <View style={styles.avatarWrapper}>
                          {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.profileAvatarImg} resizeMode="cover" />
                          ) : (
                            <View style={styles.profileAvatarFallback}>
                              <AppText style={styles.profileAvatarInitials}>{userInitials}</AppText>
                            </View>
                          )}

                          <TouchableOpacity
                            style={styles.cameraOverlayBtn}
                            onPress={handlePickImage}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel="Change Profile Picture"
                          >
                            <AppIcon name="camera" size={15} color="#0F766E" />
                          </TouchableOpacity>
                        </View>

                        {/* Name with Edit Button & Subtitle Email */}
                        <View style={styles.profileCardNameRow}>
                          <AppText style={styles.profileCardName}>{fullName || user?.fullName || 'Traveler'}</AppText>
                          <TouchableOpacity
                            style={styles.nameEditIconBtn}
                            onPress={handleStartEditName}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel="Edit Name"
                          >
                            <AppIcon name="create-outline" size={16} color="#0F766E" />
                          </TouchableOpacity>
                        </View>

                        <AppText style={styles.profileCardEmailSub} numberOfLines={1}>
                          {email || user?.email || 'traveler@gmail.com'}
                        </AppText>

                        {/* User Details Rows with Green Icons (Phone removed) */}
                        <View style={styles.profileDetailsList}>
                          <View style={styles.profileDetailRow}>
                            <AppIcon name="mail" size={16} color="#0F766E" style={styles.profileDetailIcon} />
                            <AppText style={styles.profileDetailText} numberOfLines={1}>
                              {email || user?.email || 'Not provided'}
                            </AppText>
                          </View>

                          <View style={styles.profileDetailRow}>
                            <AppIcon name="location-sharp" size={16} color="#0F766E" style={styles.profileDetailIcon} />
                            <AppText style={styles.profileDetailText} numberOfLines={1}>
                              {country || user?.country || 'Pakistan'}
                            </AppText>
                          </View>
                        </View>

                        {/* Travel Explorer Badge */}
                        <View style={styles.badgePill}>
                          <AppText style={styles.badgeCrown}>👑</AppText>
                          <AppText style={styles.badgeText}>Travel Explorer</AppText>
                        </View>
                      </View>

                      {/* ========================================================
                          RIGHT SUB-CARD: TABS & FORM
                          - Tabs: "Personal Info", "Preferences", "Travel Stats"
                          - Form: Full Name, Email, Country, [Save Changes]
                         ======================================================== */}
                      <View style={styles.profileFormCard}>
                        {/* 3 Tabs Bar */}
                        <View style={styles.tabNavBar}>
                          <TouchableOpacity
                            style={[styles.tabNavBtn, profileTab === 'personal' && styles.tabNavBtnActive]}
                            onPress={() => setProfileTab('personal')}
                          >
                            <AppText style={[styles.tabNavText, profileTab === 'personal' && styles.tabNavTextActive]}>
                              Personal Info
                            </AppText>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.tabNavBtn, profileTab === 'preferences' && styles.tabNavBtnActive]}
                            onPress={() => setProfileTab('preferences')}
                          >
                            <AppText style={[styles.tabNavText, profileTab === 'preferences' && styles.tabNavTextActive]}>
                              Preferences
                            </AppText>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.tabNavBtn, profileTab === 'stats' && styles.tabNavBtnActive]}
                            onPress={() => setProfileTab('stats')}
                          >
                            <AppText style={[styles.tabNavText, profileTab === 'stats' && styles.tabNavTextActive]}>
                              Travel Stats
                            </AppText>
                          </TouchableOpacity>
                        </View>

                        {/* TAB 1: PERSONAL INFORMATION FORM */}
                        {profileTab === 'personal' && (
                          <View style={styles.formContainer}>
                            {/* Full Name with Edit Sign */}
                            <View style={styles.fieldGroup}>
                              <View style={styles.fieldLabelRow}>
                                <AppText style={styles.fieldLabel}>Full Name</AppText>
                                <TouchableOpacity
                                  style={styles.fieldEditBadge}
                                  onPress={handleStartEditName}
                                  activeOpacity={0.7}
                                  accessibilityRole="button"
                                  accessibilityLabel="Edit Full Name"
                                >
                                  <AppIcon name="create-outline" size={13} color="#0F766E" />
                                  <AppText style={styles.fieldEditText}>Edit</AppText>
                                </TouchableOpacity>
                              </View>
                              <View style={[styles.inputBox, isEditingName && styles.inputBoxEditing]}>
                                <AppIcon name="person-outline" size={18} color="#0F766E" style={styles.inputIcon} />
                                <TextInput
                                  ref={fullNameInputRef}
                                  value={fullName}
                                  onChangeText={(text) => {
                                    setFullName(text);
                                    setIsEditingName(true);
                                  }}
                                  placeholder="Full Name"
                                  placeholderTextColor="#9CA3AF"
                                  style={styles.textInput}
                                  onFocus={() => setIsEditingName(true)}
                                  onBlur={() => setIsEditingName(false)}
                                />
                                <TouchableOpacity
                                  style={styles.inputEditPencilBtn}
                                  onPress={handleStartEditName}
                                  activeOpacity={0.7}
                                  accessibilityRole="button"
                                  accessibilityLabel="Edit Full Name"
                                >
                                  <AppIcon name="pencil" size={15} color="#0F766E" />
                                </TouchableOpacity>
                              </View>
                            </View>

                            {/* Email Address */}
                            <View style={styles.fieldGroup}>
                              <AppText style={styles.fieldLabel}>Email Address</AppText>
                              <View style={styles.inputBox}>
                                <AppIcon name="mail-outline" size={18} color="#6B7280" style={styles.inputIcon} />
                                <TextInput
                                  value={email}
                                  onChangeText={setEmail}
                                  placeholder="Email Address"
                                  placeholderTextColor="#9CA3AF"
                                  keyboardType="email-address"
                                  autoCapitalize="none"
                                  style={styles.textInput}
                                />
                              </View>
                            </View>

                            {/* Country Selector */}
                            <View style={styles.fieldGroup}>
                              <AppText style={styles.fieldLabel}>Country</AppText>
                              <TouchableOpacity
                                style={styles.countrySelectBox}
                                onPress={() => setCountryModalVisible(true)}
                                activeOpacity={0.8}
                                accessibilityRole="button"
                                accessibilityLabel="Select Country"
                              >
                                <View style={styles.countryFlagNameRow}>
                                  <AppText style={styles.countryFlagEmoji}>{currentFlag}</AppText>
                                  <AppText style={styles.countryNameText}>{country}</AppText>
                                </View>
                                <AppIcon name="chevron-down" size={18} color="#6B7280" />
                              </TouchableOpacity>
                            </View>

                            {/* Save Changes Button */}
                            <TouchableOpacity
                              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                              onPress={handleSaveChanges}
                              disabled={saving}
                              activeOpacity={0.85}
                              accessibilityRole="button"
                              accessibilityLabel="Save Changes"
                            >
                              {saving ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                              ) : (
                                <>
                                  <AppIcon name="save-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                                  <AppText style={styles.saveBtnText}>Save Changes</AppText>
                                </>
                              )}
                            </TouchableOpacity>
                          </View>
                        )}

                        {/* TAB 2: PREFERENCES */}
                        {profileTab === 'preferences' && (
                          <View style={styles.formContainer}>
                            <AppText style={styles.fieldLabel}>Travel Interests</AppText>
                            <View style={styles.interestsWrap}>
                              {ALL_INTERESTS.map((interest) => {
                                const selected = selectedInterests.includes(interest);
                                return (
                                  <TouchableOpacity
                                    key={interest}
                                    style={[styles.interestChip, selected && styles.interestChipSelected]}
                                    onPress={() => toggleInterest(interest)}
                                  >
                                    <AppText style={[styles.interestChipText, selected && styles.interestChipTextSelected]}>
                                      {interest} {selected ? '✓' : '+'}
                                    </AppText>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>

                            <AppText style={[styles.fieldLabel, { marginTop: 14 }]}>Preferred Hotel Type</AppText>
                            <View style={styles.interestsWrap}>
                              {HOTEL_TYPES.map((type) => {
                                const active = hotelType === type;
                                return (
                                  <TouchableOpacity
                                    key={type}
                                    style={[styles.interestChip, active && styles.interestChipSelected]}
                                    onPress={() => setHotelType(type)}
                                  >
                                    <AppText style={[styles.interestChipText, active && styles.interestChipTextSelected]}>
                                      {type}
                                    </AppText>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>

                            <View style={[styles.fieldGroup, { marginTop: 14 }]}>
                              <AppText style={styles.fieldLabel}>Default Trip Budget (PKR)</AppText>
                              <View style={styles.inputBox}>
                                <AppIcon name="cash-outline" size={18} color="#6B7280" style={styles.inputIcon} />
                                <TextInput
                                  value={budgetVal}
                                  onChangeText={setBudgetVal}
                                  placeholder="75000"
                                  keyboardType="numeric"
                                  style={styles.textInput}
                                />
                              </View>
                            </View>

                            <TouchableOpacity
                              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                              onPress={handleSavePreferences}
                              disabled={saving}
                              activeOpacity={0.85}
                            >
                              <AppIcon name="save-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                              <AppText style={styles.saveBtnText}>Save Preferences</AppText>
                            </TouchableOpacity>
                          </View>
                        )}

                        {/* TAB 3: TRAVEL STATS */}
                        {profileTab === 'stats' && (
                          <View style={styles.statsContainer}>
                            <View style={styles.statsRow}>
                              <View style={styles.statBox}>
                                <AppText style={styles.statNumber}>{trips.length}</AppText>
                                <AppText style={styles.statTitle}>TRIPS</AppText>
                              </View>
                              <View style={styles.statBox}>
                                <AppText style={styles.statNumber}>
                                  {trips.reduce((sum, t) => sum + Number(t.days || 0), 0)}
                                </AppText>
                                <AppText style={styles.statTitle}>DAYS</AppText>
                              </View>
                              <View style={styles.statBox}>
                                <AppText style={styles.statNumber}>
                                  {new Set(trips.map((t) => t.destination)).size}
                                </AppText>
                                <AppText style={styles.statTitle}>CITIES</AppText>
                              </View>
                              <View style={styles.statBox}>
                                <AppText style={styles.statNumber}>{favorites.length}</AppText>
                                <AppText style={styles.statTitle}>FAVORITES</AppText>
                              </View>
                            </View>

                            <View style={{ marginTop: 20 }}>
                              <AppText style={styles.subSectionTitle}>Recent Saved Trips</AppText>
                              {trips.length === 0 ? (
                                <AppText style={styles.emptyNote}>
                                  No saved trips yet. Explore destinations to plan your journey!
                                </AppText>
                              ) : (
                                trips.slice(0, 3).map((trip) => (
                                  <View key={trip._id} style={styles.tripListItem}>
                                    <View style={{ flex: 1 }}>
                                      <AppText style={styles.tripDestName}>{trip.destination}</AppText>
                                      <AppText style={styles.tripDaysBudget}>
                                        {trip.days} days • PKR {Number(trip.budget || 0).toLocaleString()}
                                      </AppText>
                                    </View>
                                    <TouchableOpacity
                                      style={styles.openTripBtn}
                                      onPress={() => chooseTrip(trip)}
                                    >
                                      <AppText style={styles.openTripBtnText}>View Itinerary →</AppText>
                                    </TouchableOpacity>
                                  </View>
                                ))
                              )}
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* SIDEBAR TAB 2: FAVORITES VIEW */}
                  {sidebarTab === 'favorites' && (
                    <View style={styles.sidebarViewContainer}>
                      <View style={styles.sectionTitleRow}>
                        <AppText style={styles.subSectionTitle}>Favorite Destinations ❤️</AppText>
                        <TouchableOpacity onPress={() => navigation.navigate('MainApp', { screen: 'Home' })}>
                          <AppText style={styles.exploreMoreLink}>Explore more →</AppText>
                        </TouchableOpacity>
                      </View>

                      {favLoading ? (
                        <ActivityIndicator color="#0F766E" style={{ marginVertical: 30 }} />
                      ) : favorites.length === 0 ? (
                        <View style={styles.emptyCardBox}>
                          <AppText style={styles.emptyNote}>
                            No favorites saved yet. Tap the heart icon on any destination to save it here!
                          </AppText>
                        </View>
                      ) : (
                        <View style={styles.favoritesGrid}>
                          {favorites.map((dest) => (
                            <TouchableOpacity
                              key={dest._id}
                              style={styles.favDestinationCard}
                              onPress={() => navigation.navigate('DestinationDetail', { destination: dest })}
                              activeOpacity={0.88}
                            >
                              <Image source={{ uri: dest.imageUrl }} style={styles.favDestImg} />
                              <View style={styles.favDestInfo}>
                                <AppText style={styles.favDestName} numberOfLines={1}>{dest.name}</AppText>
                                <AppText style={styles.favDestRegion} numberOfLines={1}>{dest.region}</AppText>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {/* SIDEBAR TAB 3: MY TRIPS VIEW */}
                  {sidebarTab === 'trips' && (
                    <View style={styles.sidebarViewContainer}>
                      <View style={styles.sectionTitleRow}>
                        <AppText style={styles.subSectionTitle}>My Saved Trips 🎒</AppText>
                        <TouchableOpacity onPress={() => navigation.navigate('MainApp', { screen: 'Home' })}>
                          <AppText style={styles.exploreMoreLink}>+ Plan New Trip</AppText>
                        </TouchableOpacity>
                      </View>

                      {tripsLoading ? (
                        <ActivityIndicator color="#0F766E" style={{ marginVertical: 30 }} />
                      ) : trips.length === 0 ? (
                        <View style={styles.emptyCardBox}>
                          <AppText style={styles.emptyNote}>
                            No trips planned yet. Go to Home or Map to generate a tailored itinerary!
                          </AppText>
                        </View>
                      ) : (
                        trips.map((trip) => (
                          <View key={trip._id} style={styles.tripCardRow}>
                            <View style={{ flex: 1 }}>
                              <AppText style={styles.tripDestName}>{trip.destination}</AppText>
                              <AppText style={styles.tripDaysBudget}>
                                {trip.days} days • PKR {Number(trip.budget || 0).toLocaleString()}
                                {trip.travelType ? ` • ${trip.travelType}` : ''}
                              </AppText>
                            </View>
                            <TouchableOpacity
                              style={styles.deleteTripBtn}
                              onPress={() => confirmDelete(trip)}
                              accessibilityLabel={`Delete ${trip.destination}`}
                            >
                              <AppIcon name="trash-outline" size={18} color="#DC2626" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.openTripBtn}
                              onPress={() => chooseTrip(trip)}
                            >
                              <AppText style={styles.openTripBtnText}>Open Plan</AppText>
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                    </View>
                  )}

                </View>
              </View>

            </View>
          </ScrollView>
        </View>
      </ImageBackground>

      {/* ==============================================================
          COUNTRY SELECTOR MODAL
         ============================================================== */}
      <Modal
        visible={countryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCountryModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>Select Country</AppText>
              <TouchableOpacity onPress={() => setCountryModalVisible(false)}>
                <AppIcon name="close" size={22} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {COUNTRIES.map((c) => {
                const isSelected = c.name.toLowerCase() === country.toLowerCase();
                return (
                  <TouchableOpacity
                    key={c.name}
                    style={[styles.modalCountryItem, isSelected && styles.modalCountryItemSelected]}
                    onPress={() => {
                      setCountry(c.name);
                      setCountryModalVisible(false);
                    }}
                  >
                    <AppText style={styles.modalFlag}>{c.flag}</AppText>
                    <AppText style={[styles.modalCountryName, isSelected && styles.modalCountryNameSelected]}>
                      {c.name}
                    </AppText>
                    {isSelected && <AppIcon name="checkmark" size={18} color="#0F766E" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ==============================================================
          AVATAR SELECTOR MODAL (Fallback / Presets)
         ============================================================== */}
      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAvatarModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>Choose Profile Picture</AppText>
              <TouchableOpacity onPress={() => setAvatarModalVisible(false)}>
                <AppIcon name="close" size={22} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <AppText style={[styles.fieldLabel, { marginTop: 6, marginBottom: 8 }]}>Select a Traveler Avatar:</AppText>
            <View style={styles.presetAvatarsRow}>
              {PRESET_AVATARS.map((url, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setAvatarUrl(url);
                    saveAvatarDirect(url);
                    setAvatarModalVisible(false);
                  }}
                  style={styles.presetAvatarBtn}
                >
                  <Image source={{ uri: url }} style={styles.presetAvatarImg} />
                </TouchableOpacity>
              ))}
            </View>

            <AppText style={[styles.fieldLabel, { marginTop: 14, marginBottom: 6 }]}>Or Enter Image URL:</AppText>
            <View style={styles.inputBox}>
              <TextInput
                value={customAvatarUrlInput}
                onChangeText={setCustomAvatarUrlInput}
                placeholder="https://example.com/my-photo.jpg"
                placeholderTextColor="#9CA3AF"
                style={styles.textInput}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { marginTop: 14 }]}
              onPress={() => {
                if (customAvatarUrlInput.trim()) {
                  const cleaned = customAvatarUrlInput.trim();
                  setAvatarUrl(cleaned);
                  saveAvatarDirect(cleaned);
                  setAvatarModalVisible(false);
                }
              }}
            >
              <AppText style={styles.saveBtnText}>Set URL as Picture</AppText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#0a2318',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bgOverlay: {
    flex: 1,
    backgroundColor: 'rgba(244, 250, 247, 0.40)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(3px)' } : {}),
  },
  scrollContent: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    paddingBottom: 85,
    alignItems: 'center',
  },
  shell: {
    width: '100%',
    maxWidth: 1180,
  },

  /* ---------------- TOP FLOATING HEADER ---------------- */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(220, 236, 229, 0.85)',
    marginBottom: 18,
    elevation: 4,
    shadowColor: '#072517',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } : {}),
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#F3F4F6',
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  logoImg: {
    width: 26,
    height: 26,
  },
  brandTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#1F2937',
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0F766E',
    overflow: 'hidden',
  },
  headerAvatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  headerAvatarInitials: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '800',
    color: '#0F766E',
  },

  /* ---------------- MAIN LAYOUT: SIDEBAR + MAIN CARD ---------------- */
  mainLayout: {
    width: '100%',
  },
  desktopMainLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
  },
  mobileMainLayout: {
    flexDirection: 'column',
    gap: 16,
  },

  /* ---------------- LEFT SIDEBAR ---------------- */
  sidebarCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(220, 236, 229, 0.85)',
    elevation: 3,
    shadowColor: '#072517',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    justifyContent: 'space-between',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } : {}),
  },
  desktopSidebar: {
    width: 220,
    minHeight: 480,
  },
  mobileSidebar: {
    width: '100%',
  },
  sidebarMenuList: {
    gap: 6,
  },
  sidebarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  sidebarBtnActive: {
    backgroundColor: '#0F766E',
  },
  sidebarBtnIcon: {
    marginRight: 10,
  },
  sidebarBtnText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    fontWeight: '600',
    color: '#334155',
  },
  sidebarBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  sidebarFooter: {
    marginTop: 24,
    alignItems: 'center',
    paddingTop: 12,
  },
  sidebarMountainImg: {
    width: '100%',
    height: 48,
    opacity: 0.8,
  },
  sidebarScriptBox: {
    alignItems: 'center',
    marginTop: 4,
  },
  sidebarScriptText: {
    fontSize: 16,
    fontFamily: fonts.displayBold || 'cursive',
    color: '#0F766E',
    fontStyle: 'italic',
    fontWeight: '700',
  },
  sidebarAirplaneTrail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  trailDashes: {
    fontSize: 11,
    color: '#0F766E',
    letterSpacing: 1.5,
  },

  /* ---------------- MAIN CARD ---------------- */
  mainCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(220, 236, 229, 0.85)',
    elevation: 3,
    shadowColor: '#072517',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 480,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } : {}),
  },
  leafWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 140,
    height: 110,
    zIndex: 1,
  },
  leafImg: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  mainCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 2,
  },
  headerUserIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  mainCardHeaderTexts: {
    flex: 1,
  },
  mainCardTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  mainCardSubtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#6B7280',
    marginTop: 2,
  },

  /* Alerts / Banners */
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7EE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successBannerText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
    color: '#0F766E',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
    color: '#DC2626',
  },

  /* ---------------- PROFILE TWO COLUMNS (SUB-CARD + FORM) ---------------- */
  profileContentGrid: {
    width: '100%',
    zIndex: 2,
  },
  desktopGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  mobileGrid: {
    flexDirection: 'column',
    gap: 18,
  },

  /* Profile Sub-card (Left) */
  profileSubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  desktopProfileSubCard: {
    width: 290,
  },
  mobileProfileSubCard: {
    width: '100%',
  },
  avatarWrapper: {
    position: 'relative',
    width: 104,
    height: 104,
    borderRadius: 52,
    marginBottom: 12,
  },
  profileAvatarImg: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: '#0F766E',
  },
  profileAvatarFallback: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0b524d',
  },
  profileAvatarInitials: {
    fontSize: 34,
    fontFamily: fonts.bold,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  cameraOverlayBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DCECE5',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  profileCardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  nameEditIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E6F7EE',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCardName: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  profileCardEmailSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  profileDetailsList: {
    width: '100%',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  profileDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileDetailIcon: {
    marginRight: 10,
    width: 18,
  },
  profileDetailText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#374151',
    flex: 1,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F7EE',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  badgeCrown: {
    fontSize: 14,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F766E',
  },

  /* Right Sub-card: Tabs & Form */
  profileFormCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabNavBar: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabNavBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabNavBtnActive: {
    backgroundColor: '#0F766E',
  },
  tabNavText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
    color: '#4B5563',
  },
  tabNavTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  formContainer: {
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldEditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F7EE',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  fieldEditText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: '#0F766E',
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
    color: '#374151',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  inputBoxEditing: {
    borderColor: '#0F766E',
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 3px rgba(15, 118, 110, 0.15)',
      },
    }),
  },
  inputEditPencilBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#1F2937',
    paddingVertical: 0,
    outlineStyle: 'none',
  },
  countrySelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  countryFlagNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryFlagEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  countryNameText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#1F2937',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    borderRadius: 12,
    height: 46,
    marginTop: 6,
    elevation: 2,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Preferences chips */
  interestsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  interestChipSelected: {
    backgroundColor: '#E6F7EE',
    borderColor: '#0F766E',
  },
  interestChipText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#4B5563',
  },
  interestChipTextSelected: {
    color: '#0F766E',
    fontWeight: '700',
  },

  /* Stats Tab */
  statsContainer: {
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 22,
    fontFamily: fonts.bold,
    fontWeight: '800',
    color: '#0F766E',
  },
  statTitle: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#6B7280',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  subSectionTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  tripListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  tripDestName: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#1F2937',
  },
  tripDaysBudget: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#6B7280',
    marginTop: 2,
  },
  openTripBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E6F7EE',
  },
  openTripBtnText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F766E',
  },

  /* Sidebar Views: Favorites & Trips */
  sidebarViewContainer: {
    gap: 16,
    zIndex: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exploreMoreLink: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F766E',
  },
  emptyCardBox: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyNote: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  favoritesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  favDestinationCard: {
    width: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  favDestImg: {
    width: '100%',
    height: 90,
    backgroundColor: '#E5E7EB',
  },
  favDestInfo: {
    padding: 8,
  },
  favDestName: {
    fontSize: 12,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#1F2937',
  },
  favDestRegion: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: '#6B7280',
    marginTop: 2,
  },
  tripCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
    marginBottom: 8,
  },
  deleteTripBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    fontWeight: '800',
    color: '#1F2937',
  },
  modalCountryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  modalCountryItemSelected: {
    backgroundColor: '#E6F7EE',
  },
  modalFlag: {
    fontSize: 20,
    marginRight: 10,
  },
  modalCountryName: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#1F2937',
    flex: 1,
  },
  modalCountryNameSelected: {
    fontWeight: '700',
    color: '#0F766E',
  },
  presetAvatarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  presetAvatarBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#0F766E',
  },
  presetAvatarImg: {
    width: '100%',
    height: '100%',
  },
});
