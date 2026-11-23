import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  Pressable as TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../components/ScreenHeader';
import AppText from '../components/AppText';
import AppIcon from '../components/AppIcon';
import FloatingChatButton from '../components/FloatingChatButton';
import { apiRequest } from '../api/client';
import { useApp } from '../context/AppContext';
import { colors, fonts, radius, shadowSoft, spacing } from '../theme';

const natureBg = require('../../assets/splash_nature_bg.jpg');

// Default destination datasets with best visiting months & highlights
const FALLBACK_CATEGORY_DESTINATIONS = {
  'Northern Areas': [
    {
      destinationId: 'hunza',
      name: 'Hunza Valley',
      category: 'Northern Areas',
      region: 'Gilgit-Baltistan',
      bestTimeToVisit: 'April to October',
      description: 'Majestic mountain valley surrounded by Rakaposhi, Baltit and Altit forts, turquoise Attabad Lake, and Passu Cones.',
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80',
      weatherCity: 'Hunza',
      rating: 4.9,
      popularActivities: ['Baltit Fort', 'Attabad Lake Boating', 'Passu Cones View', 'Altit Fort Walk'],
    },
    {
      destinationId: 'skardu',
      name: 'Skardu & Deosai',
      category: 'Northern Areas',
      region: 'Gilgit-Baltistan',
      bestTimeToVisit: 'May to October',
      description: 'Gateway to K2, famous for Shangrila Resort, Katpana Cold Desert, and the high-altitude wilderness of Deosai Plains.',
      imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80',
      weatherCity: 'Skardu',
      rating: 4.9,
      popularActivities: ['Shangrila Resort', 'Cold Desert Safari', 'Shigar Fort', 'Deosai Plains'],
    },
    {
      destinationId: 'fairy-meadows',
      name: 'Fairy Meadows & Nanga Parbat',
      category: 'Northern Areas',
      region: 'Gilgit-Baltistan',
      bestTimeToVisit: 'June to September',
      description: 'Lush alpine grassland offering unobstructed views of Nanga Parbat (the Killer Mountain) and Raikhot Glacier.',
      imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80',
      weatherCity: 'Gilgit',
      rating: 4.8,
      popularActivities: ['Jeep Trek', 'Basecamp Hike', 'Star Gazing', 'Alpine Camping'],
    },
    {
      destinationId: 'gilgit',
      name: 'Gilgit & Naltar Valley',
      category: 'Northern Areas',
      region: 'Gilgit-Baltistan',
      bestTimeToVisit: 'April to November',
      description: 'Historic hub on the ancient Silk Road, gateway to multicolored Naltar Lakes and world-famous ski slopes.',
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80',
      weatherCity: 'Gilgit',
      rating: 4.7,
      popularActivities: ['Naltar Lakes', 'Karakoram Highway', 'Kargah Buddha', 'Gilgit Bazaar'],
    },
    {
      destinationId: 'neelum-valley',
      name: 'Neelum Valley (Azad Kashmir)',
      category: 'Northern Areas',
      region: 'Azad Kashmir',
      bestTimeToVisit: 'May to October',
      description: 'A 144km bow-shaped green paradise with lush pine forests, pristine streams, Sharda University ruins, and Arang Kel.',
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
      weatherCity: 'Muzaffarabad',
      rating: 4.8,
      popularActivities: ['Arang Kel Hike', 'Sharda Temple', 'Kutton Waterfall', 'Ratti Gali Lake'],
    },
    {
      destinationId: 'khunjerab-pass',
      name: 'Khunjerab Pass (China Border)',
      category: 'Northern Areas',
      region: 'Gilgit-Baltistan',
      bestTimeToVisit: 'May to October',
      description: 'The highest paved international border crossing in the world at 4,693m (15,397 ft), set inside a national park.',
      imageUrl: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&q=80',
      weatherCity: 'Hunza',
      rating: 4.8,
      popularActivities: ['World Highest ATM', 'China Border Monument', 'Ibex Spotting', 'Snow Mountain Views'],
    },
  ],
  'Adventure & Nature': [
    {
      destinationId: 'naran-kaghan',
      name: 'Naran & Kaghan Valley',
      category: 'Adventure & Nature',
      region: 'Khyber Pakhtunkhwa',
      bestTimeToVisit: 'May to September',
      description: 'Pakistan’s top summer nature haven with Kunhar river rafting, legendary Lake Saif-ul-Malook, and Babusar Pass.',
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
      weatherCity: 'Naran',
      rating: 4.8,
      popularActivities: ['Lake Saif-ul-Malook', 'Babusar Top', 'River Rafting', 'Lulusar Lake'],
    },
    {
      destinationId: 'swat-kalam',
      name: 'Swat & Kalam Valley',
      category: 'Adventure & Nature',
      region: 'Khyber Pakhtunkhwa',
      bestTimeToVisit: 'May to October (Nature) / Dec to Feb (Ski)',
      description: 'The Switzerland of the East with lush pine valleys, rushing rivers, Malam Jabba ski resort, and Mahodand Lake.',
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80',
      weatherCity: 'Swat',
      rating: 4.8,
      popularActivities: ['Malam Jabba Skiing', 'Mahodand Lake Jeep Safari', 'Ushu Forest Walk', 'Kalam Bazaar'],
    },
    {
      destinationId: 'murree-galyat',
      name: 'Murree & Galyat',
      category: 'Adventure & Nature',
      region: 'Punjab / KP',
      bestTimeToVisit: 'Year-round (Summer Cool / Winter Snow)',
      description: 'Accessible hill station chain featuring Mall Road, Patriata chairlift, scenic pipeline tracks in Nathia Gali, and pine forests.',
      imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80',
      weatherCity: 'Murree',
      rating: 4.6,
      popularActivities: ['Patriata Chairlift', 'Nathia Gali Pipeline Track', 'Mukshpuri Peak Trek', 'Mall Road Stroll'],
    },
    {
      destinationId: 'islamabad',
      name: 'Islamabad',
      category: 'Adventure & Nature',
      region: 'Federal Capital',
      bestTimeToVisit: 'September to April',
      description: 'Pakistan’s serene capital nestled at the foothills of Margalla Hills, renowned for scenic hiking trails, Faisal Mosque, and Daman-e-Koh.',
      imageUrl: 'https://images.unsplash.com/photo-1608481337062-4093bf3ed404?w=800&q=80',
      weatherCity: 'Islamabad',
      rating: 4.9,
      popularActivities: ['Trail 3 & 5 Hiking', 'Faisal Mosque', 'Daman-e-Koh Dining', 'Rawal Lake Boating'],
    },
    {
      destinationId: 'kumrat-valley',
      name: 'Kumrat Valley',
      category: 'Adventure & Nature',
      region: 'Khyber Pakhtunkhwa',
      bestTimeToVisit: 'May to September',
      description: 'Pristine forested wilderness featuring towering deodar trees, raging Panjkora River, and untouched waterfalls.',
      imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80',
      weatherCity: 'Dir',
      rating: 4.7,
      popularActivities: ['Kumrat Waterfall', 'Panjkora River Camp', 'Jahaz Banda Trek', 'Pine Forest Walk'],
    },
  ],
  'Cultural & Historical': [
    {
      destinationId: 'lahore',
      name: 'Lahore',
      category: 'Cultural & Historical',
      region: 'Punjab',
      bestTimeToVisit: 'October to March',
      description: 'The cultural capital of Pakistan featuring Badshahi Mosque, Lahore Fort, vibrant food streets, and rich Mughal heritage.',
      imageUrl: 'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=800&q=80',
      weatherCity: 'Lahore',
      rating: 4.9,
      popularActivities: ['Badshahi Mosque', 'Lahore Fort & Sheesh Mahal', 'Food Street Gawalmandi', 'Shalimar Gardens'],
    },
    {
      destinationId: 'multan',
      name: 'Multan',
      category: 'Cultural & Historical',
      region: 'Punjab',
      bestTimeToVisit: 'November to February',
      description: 'The ancient City of Saints famed for cobalt-blue glazed tile shrines, handcrafted blue pottery, and historic bazaars.',
      imageUrl: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&q=80',
      weatherCity: 'Multan',
      rating: 4.7,
      popularActivities: ['Shah Rukn-e-Alam Shrine', 'Bahauddin Zakariya Shrine', 'Blue Pottery Workshop', 'Old Ghanta Ghar'],
    },
    {
      destinationId: 'peshawar',
      name: 'Peshawar',
      category: 'Cultural & Historical',
      region: 'Khyber Pakhtunkhwa',
      bestTimeToVisit: 'October to March',
      description: 'One of South Asia’s oldest living cities, legendary for Qissa Khwani storytellers bazaar and world-famous chapli kababs.',
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80',
      weatherCity: 'Peshawar',
      rating: 4.7,
      popularActivities: ['Qissa Khwani Bazaar', 'Bala Hisar Fort View', 'Namak Mandi Dining', 'Peshawar Museum'],
    },
    {
      destinationId: 'bahawalpur',
      name: 'Bahawalpur & Derawar',
      category: 'Cultural & Historical',
      region: 'Punjab',
      bestTimeToVisit: 'November to February',
      description: 'Princely heritage city boasting Noor Mahal palace, Darbar Mahal, and the mighty 40-bastion Derawar Fort in Cholistan.',
      imageUrl: 'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=800&q=80',
      weatherCity: 'Bahawalpur',
      rating: 4.8,
      popularActivities: ['Noor Mahal Palace', 'Derawar Fort Safari', 'Cholistan Desert Jeep', 'Central Library'],
    },
  ],
  'Coastal Areas': [
    {
      destinationId: 'gwadar',
      name: 'Gwadar & Ormara',
      category: 'Coastal Areas',
      region: 'Balochistan',
      bestTimeToVisit: 'October to March',
      description: 'Dramatic Makran Coastal highway, Hammerhead peninsula, pristine Ormara beaches, and the princess of hope rock.',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
      weatherCity: 'Gwadar',
      rating: 4.8,
      popularActivities: ['Hammerhead Viewpoint', 'Kund Malir Golden Beach', 'Ormara Beach Camp', 'Princess of Hope'],
    },
    {
      destinationId: 'karachi-coast',
      name: 'Karachi Coastline',
      category: 'Coastal Areas',
      region: 'Sindh',
      bestTimeToVisit: 'November to February',
      description: 'Arabian sea coastline with Clifton beach, turtle-nesting Hawksbay, French beach chalets, and sunset camel rides.',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
      weatherCity: 'Karachi',
      rating: 4.6,
      popularActivities: ['Hawksbay Beach', 'Clifton Sunset', 'Do Darya Oceanside Dining', 'Manora Island Boat'],
    },
    {
      destinationId: 'astola-island',
      name: 'Astola Island (Jazira Haft Talar)',
      category: 'Coastal Areas',
      region: 'Balochistan',
      bestTimeToVisit: 'October to March',
      description: 'Pakistan’s largest uninhabited offshore island with turquoise waters, coral reefs, sea turtle sanctuaries, and scuba diving.',
      imageUrl: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&q=80',
      weatherCity: 'Pasni',
      rating: 4.9,
      popularActivities: ['Scuba Diving', 'Cliff Hiking', 'Wild Dolphin Spotting', 'Island Camping'],
    },
  ],
};

const CATEGORY_META = {
  All: {
    id: 'All',
    title: 'All Destinations in Pakistan',
    heroTitle: 'All Destinations in Pakistan',
    badgeText: '🇵🇰 48 Curated Destinations across Pakistan',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80',
    desc: 'Discover all 48 breathtaking destinations across Pakistan — from northern glaciers and alpine meadows to ancient heritage forts and sunny coastal beaches.',
    iconEmoji: '🇵🇰',
  },
  'Adventure & Nature': {
    id: 'Adventure & Nature',
    title: 'Adventure & Nature',
    heroTitle: 'Adventure & Nature',
    badgeText: '🏔️ 10 Adventure & Hiking Destinations',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
    desc: 'Discover breathtaking landscapes, thrilling adventures, hiking trails, valleys, lakes, and peaceful escapes across Pakistan.',
    iconEmoji: '🏔️',
  },
  'Northern Areas': {
    id: 'Northern Areas',
    title: 'Northern Areas',
    heroTitle: 'Northern Areas',
    badgeText: '❄️ 13 Majestic Mountain Valleys & Glaciers',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&q=80',
    desc: "Explore Pakistan's majestic mountains, beautiful valleys, glaciers, lakes, and unforgettable northern landscapes.",
    iconEmoji: '❄️',
  },
  'Cultural & Historical': {
    id: 'Cultural & Historical',
    title: 'Cultural & Historical',
    heroTitle: 'Cultural & Historical',
    badgeText: '🏛️ 17 Ancient Forts & Heritage Sites',
    image: 'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=1200&q=80',
    desc: "Experience Pakistan's rich history, ancient civilizations, magnificent forts, heritage sites, and vibrant cultural cities.",
    iconEmoji: '🏛️',
  },
  'Coastal Areas': {
    id: 'Coastal Areas',
    title: 'Coastal Areas',
    heroTitle: 'Coastal Areas',
    badgeText: '🌊 8 Arabian Sea Beaches & Coastal Peninsulas',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    desc: "Relax by Pakistan's beautiful coastline, explore beaches and islands, and discover unforgettable coastal adventures.",
    iconEmoji: '🌊',
  },
};

const CATEGORY_TABS = [
  { id: 'All', title: 'All (48)', iconEmoji: '🇵🇰' },
  { id: 'Adventure & Nature', title: 'Adventure (10)', iconEmoji: '🏔️' },
  { id: 'Northern Areas', title: 'Northern (13)', iconEmoji: '❄️' },
  { id: 'Cultural & Historical', title: 'Historical (17)', iconEmoji: '🏛️' },
  { id: 'Coastal Areas', title: 'Coastal (8)', iconEmoji: '🌊' },
];

export default function CategoryCitiesScreen({ navigation, route }) {
  const initialCategory = route.params?.category || 'All';
  const [activeCat, setActiveCat] = useState(initialCategory);
  const { token } = useApp();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const currentMeta = CATEGORY_META[activeCat] || CATEGORY_META['All'];

  // Load from API or fallback
  async function loadDestinations(cat = activeCat) {
    try {
      setLoading(true);
      const url = cat && cat !== 'All'
        ? `/destinations?category=${encodeURIComponent(cat)}`
        : '/destinations';
      const res = await apiRequest(url, { token });
      if (res.destinations && res.destinations.length > 0) {
        setDestinations(res.destinations);
      } else {
        if (cat === 'All') {
          setDestinations(Object.values(FALLBACK_CATEGORY_DESTINATIONS).flat());
        } else {
          setDestinations(FALLBACK_CATEGORY_DESTINATIONS[cat] || []);
        }
      }
    } catch (_) {
      if (cat === 'All') {
        setDestinations(Object.values(FALLBACK_CATEGORY_DESTINATIONS).flat());
      } else {
        setDestinations(FALLBACK_CATEGORY_DESTINATIONS[cat] || []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDestinations(activeCat);
  }, [activeCat, token]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return destinations;
    return destinations.filter((d) => {
      const name = (d.name || '').toLowerCase();
      const reg = (d.region || '').toLowerCase();
      const desc = (d.description || '').toLowerCase();
      return name.includes(q) || reg.includes(q) || desc.includes(q);
    });
  }, [destinations, search]);

  function handlePlanTrip(item) {
    navigation.navigate('TripPlanning', {
      preselectedDestination: item.name,
      preselectedCategory: item.category || (activeCat === 'All' ? 'Adventure & Nature' : activeCat),
      destinationObj: item,
    });
  }

  function handleViewDetail(item) {
    navigation.navigate('DestinationDetail', {
      destination: item,
    });
  }

  return (
    <View style={styles.page}>
      <StatusBar style="dark" />
      <ImageBackground
        source={natureBg}
        style={styles.pageBackground}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            'rgba(244, 250, 247, 0.20)',
            'rgba(244, 250, 247, 0.32)',
            'rgba(244, 250, 247, 0.45)',
          ]}
          style={styles.pageGradientOverlay}
        >
          {/* SCENIC TOP HEADER (FULL WIDTH) */}
          <LinearGradient colors={['#155E43', '#21845D']} style={styles.scenicHeader}>
            <View style={styles.scenicHeaderInner}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.headerBackBtn}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <AppIcon name="arrow-back" size={18} color="#ffffff" style={{ marginRight: 4 }} />
                <AppText style={styles.headerBackText}>Back</AppText>
              </TouchableOpacity>
              <AppText style={styles.headerTitle}>
                {activeCat === 'All' ? 'All Destinations' : activeCat}
              </AppText>
              <AppText style={styles.headerSubtitle}>
                {`${filtered.length} curated destinations to explore`}
              </AppText>
            </View>
          </LinearGradient>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); loadDestinations(activeCat); }}
                tintColor={colors.forest}
              />
            }
          >
            <View style={styles.contentContainer}>
              {/* CATEGORY FILTER TABS */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsScrollContent}
                style={styles.tabsWrap}
              >
                {CATEGORY_TABS.map((tab) => {
                  const isTabSelected = activeCat === tab.id;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      style={[styles.categoryTab, isTabSelected && styles.categoryTabSelected]}
                      onPress={() => {
                        setActiveCat(tab.id);
                        setSearch('');
                      }}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`Filter by ${tab.title}`}
                    >
                      <AppText style={styles.categoryTabEmoji}>{tab.iconEmoji}</AppText>
                      <AppText style={[styles.categoryTabText, isTabSelected && styles.categoryTabTextSelected]}>
                        {tab.title}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* HERO BANNER FOR CATEGORY */}
              <View style={styles.heroCard}>
                <Image
                  source={{ uri: currentMeta.image }}
                  style={styles.heroImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(12,38,25,0.85)', '#0c2619']}
                  style={styles.heroOverlay}
                >
                  <View style={styles.heroBadge}>
                    <AppText variant="caption" style={styles.heroBadgeText}>
                      {currentMeta.badgeText}
                    </AppText>
                  </View>
                  <AppText variant="title" style={styles.heroTitle}>{currentMeta.heroTitle}</AppText>
                  <AppText style={styles.heroDesc}>
                    {currentMeta.desc}
                  </AppText>
                </LinearGradient>
              </View>

              {/* SEARCH BAR WITHIN CATEGORY */}
              <View style={styles.searchBox}>
                <AppIcon name="search-outline" size={20} color={colors.muted} />
                <TextInput
                  id="category-search-input"
                  nativeID="category-search-input"
                  name="categorySearchQuery"
                  accessibilityLabel="Search destinations in category"
                  style={styles.searchInput}
                  placeholder={activeCat === 'All' ? 'Search all 48 destinations in Pakistan...' : `Search destinations in ${activeCat}...`}
                  placeholderTextColor={colors.muted}
                  value={search}
                  onChangeText={setSearch}
                  clearButtonMode="while-editing"
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <AppIcon name="close-circle" size={18} color={colors.muted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* LOADING INDICATOR */}
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.forest} />
                  <AppText color={colors.muted} style={{ marginTop: spacing.md }}>
                    Loading destinations & visiting seasons...
                  </AppText>
                </View>
              ) : filtered.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <AppIcon name="compass-outline" size={48} color={colors.muted} />
                  <AppText variant="heading" style={{ marginTop: spacing.sm }}>No destinations found</AppText>
                  <AppText color={colors.muted} style={{ textAlign: 'center', marginTop: 4 }}>
                    Try searching with another keyword or explore other categories.
                  </AppText>
                </View>
              ) : (
                /* CITIES GRID */
                <View style={[styles.grid, isWide && styles.gridWide]}>
                  {filtered.map((item, idx) => {
                    const bestMonths = item.bestTimeToVisit || 'May to October';
                    return (
                      <View key={item.destinationId || item.id || idx} style={[styles.cityCard, isWide && styles.cityCardWide]}>
                        {/* CITY IMAGE */}
                        <TouchableOpacity activeOpacity={0.9} onPress={() => handleViewDetail(item)}>
                          <View style={styles.imageWrapper}>
                            <Image
                              source={{ uri: item.imageUrl || item.image || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80' }}
                              style={styles.cityImage}
                            />
                            <LinearGradient
                              colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.7)']}
                              style={styles.imageGradient}
                            />
                            {/* Region Tag */}
                            <View style={styles.regionBadge}>
                              <AppIcon name="location-outline" size={13} color="#ffffff" />
                              <AppText style={styles.regionText}>{item.region || item.category || activeCat}</AppText>
                            </View>
                            {/* Rating Tag */}
                            <View style={styles.ratingBadge}>
                              <AppIcon name="star" size={13} color="#f59e0b" />
                              <AppText style={styles.ratingText}>{item.rating || '4.8'}</AppText>
                            </View>
                          </View>
                        </TouchableOpacity>

                        {/* CITY BODY */}
                        <View style={styles.cardBody}>
                          <TouchableOpacity onPress={() => handleViewDetail(item)}>
                            <AppText variant="title" style={styles.cityName}>
                              {item.name}
                            </AppText>
                          </TouchableOpacity>

                          {/* BEST VISITING MONTHS (SUPERVISOR REQUIREMENT) */}
                          <View style={styles.seasonBanner}>
                            <AppIcon name="calendar-outline" size={16} color="#0F766E" />
                            <View style={{ flex: 1 }}>
                              <AppText variant="caption" style={styles.seasonLabel}>BEST VISITING MONTHS</AppText>
                              <AppText variant="bodyStrong" style={styles.seasonValue}>{bestMonths}</AppText>
                            </View>
                          </View>

                          {/* DESCRIPTION */}
                          <AppText numberOfLines={3} style={styles.cityDesc}>
                            {item.description || 'Stunning destination offering rich scenery, local heritage, and memorable excursions.'}
                          </AppText>

                          {/* ATTRACTIONS PREVIEW */}
                          {item.popularActivities && item.popularActivities.length > 0 && (
                            <View style={styles.activityTagsRow}>
                              {item.popularActivities.slice(0, 3).map((act, aIdx) => (
                                <View key={aIdx} style={styles.activityChip}>
                                  <AppText variant="caption" style={styles.activityChipText}>
                                    • {act}
                                  </AppText>
                                </View>
                              ))}
                            </View>
                          )}

                          {/* ACTION BUTTONS: PLAN A TRIP & EXPLORE */}
                          <View style={styles.cardActions}>
                            <TouchableOpacity
                              style={styles.exploreBtn}
                              onPress={() => handleViewDetail(item)}
                              accessibilityRole="button"
                            >
                              <AppText variant="label" style={styles.exploreBtnText}>Details</AppText>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.planTripBtn}
                              onPress={() => handlePlanTrip(item)}
                              accessibilityRole="button"
                            >
                              <AppIcon name="paper-plane-outline" size={16} color="#ffffff" />
                              <AppText variant="label" style={styles.planTripBtnText}>Plan a Trip</AppText>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          <FloatingChatButton onPress={() => navigation.navigate('Chat')} />
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#0a2318',
  },
  pageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  pageGradientOverlay: {
    flex: 1,
  },
  scenicHeader: {
    width: '100%',
    paddingHorizontal: Platform.OS === 'web' ? 24 : 16,
    paddingTop: Platform.OS === 'ios' ? 18 : 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.20)',
    ...shadowSoft,
    marginBottom: 10,
  },
  scenicHeaderInner: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  headerBackText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#D1FAE5',
    marginTop: 3,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  contentContainer: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  tabsWrap: {
    marginBottom: spacing.md,
  },
  tabsScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: '#DCECE5',
    ...shadowSoft,
  },
  categoryTabSelected: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  categoryTabEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryTabText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: '#1F2937',
  },
  categoryTabTextSelected: {
    color: '#ffffff',
    fontFamily: fonts.bold,
  },
  heroCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    height: 200,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#DCECE5',
    ...shadowSoft,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: 6,
  },
  heroBadgeText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    fontFamily: fonts.serif,
  },
  heroDesc: {
    color: '#e4ebe6',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#DCECE5',
    ...shadowSoft,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#1F2937',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#DCECE5',
  },
  grid: {
    flexDirection: 'column',
    gap: spacing.md,
  },
  gridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DCECE5',
    ...shadowSoft,
    marginBottom: spacing.sm,
  },
  cityCardWide: {
    width: '48.5%',
  },
  imageWrapper: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  cityImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  regionBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15,46,31,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  regionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  ratingText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: spacing.md,
  },
  cityName: {
    fontSize: 19,
    fontFamily: fonts.serif,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 6,
  },
  seasonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#E6F7EE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: '#0F766E',
    marginVertical: 6,
  },
  seasonLabel: {
    color: '#0F766E',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  seasonValue: {
    color: '#134731',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  cityDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: '#4B5563',
    marginVertical: 6,
  },
  activityTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  activityChip: {
    backgroundColor: '#E6F7EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#DCECE5',
  },
  activityChipText: {
    color: '#1F2937',
    fontSize: 10,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#DCECE5',
  },
  exploreBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#DCECE5',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreBtnText: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '700',
  },
  planTripBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: '#0F766E',
    ...shadowSoft,
  },
  planTripBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
