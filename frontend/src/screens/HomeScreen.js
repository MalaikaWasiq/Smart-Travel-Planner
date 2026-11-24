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
import { apiRequest } from '../api/client';
import { useApp } from '../context/AppContext';
import { colors, fonts, radius, shadowSoft, spacing } from '../theme';
import AppIcon from '../components/AppIcon';
import AppText from '../components/AppText';
import FloatingChatButton from '../components/FloatingChatButton';

const natureBg = require('../../assets/splash_nature_bg.jpg');
const mountainLogo = require('../../assets/stp_mountain_logo_clean.png');

// 4 Official Categories matching reference design
const CATEGORIES_DATA = [
  {
    id: 'Adventure & Nature',
    title: 'Adventure & Nature',
    iconEmoji: '',
    iconName: 'compass-outline',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
    desc: 'Discover breathtaking landscapes, thrilling adventures, hiking trails, valleys, lakes, and peaceful escapes across Pakistan.',
    color: '#c46816',
    bg: '#fef3e9',
    defaultCount: 10,
  },
  {
    id: 'Northern Areas',
    title: 'Northern Areas',
    iconEmoji: '',
    iconName: 'snow-outline',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80',
    desc: "Explore Pakistan's majestic mountains, beautiful valleys, glaciers, lakes, and unforgettable northern landscapes.",
    color: '#186443',
    bg: '#edf6f1',
    defaultCount: 13,
  },
  {
    id: 'Cultural & Historical',
    title: 'Cultural & Historical',
    iconEmoji: '',
    iconName: 'shield-outline',
    image: 'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=800&q=80',
    desc: "Experience Pakistan's rich history, ancient civilizations, magnificent forts, heritage sites, and vibrant cultural cities.",
    color: '#8c5e0e',
    bg: '#fdf7eb',
    defaultCount: 17,
  },
  {
    id: 'Coastal Areas',
    title: 'Coastal Areas',
    iconEmoji: '',
    iconName: 'water-outline',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    desc: "Relax by Pakistan's beautiful coastline, explore beaches and islands, and discover unforgettable coastal adventures.",
    color: '#16658b',
    bg: '#ebf5fc',
    defaultCount: 8,
  },
];

const FALLBACK_DEST_IMAGE = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80';

export default function HomeScreen({ navigation }) {
  const { user, token, currentTrip, openTrip, isFavorite, toggleFavorite: appToggleFavorite } = useApp();
  const { width: windowWidth } = useWindowDimensions();
  const isWide = windowWidth >= 700;

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  const [mapSearchResults, setMapSearchResults] = useState([]);
  const [mapSearchLoading, setMapSearchLoading] = useState(false);

  // Category state (Default to 'Adventure & Nature' to display category cards & 2-col cities grid)
  const [activeCategory, setActiveCategory] = useState('Adventure & Nature');

  // Favorites state (Set of destinationIds)
  const [favorites, setFavorites] = useState(new Set());

  // All destinations from API
  const [allDestinations, setAllDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // DYNAMIC SIGNED-IN USER NAME (Strictly avoids hardcoded "Amima")
  const displayName = useMemo(() => {
    if (user?.fullName && user.fullName.trim().length > 0) {
      return user.fullName.trim();
    }
    if (user?.name && user.name.trim().length > 0) {
      return user.name.trim();
    }
    if (user?.email) {
      const emailPrefix = user.email.split('@')[0];
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
    return 'Traveler';
  }, [user]);

  const initials = useMemo(() => {
    if (user?.initials) return user.initials;
    const parts = displayName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }, [displayName, user]);

  async function loadAllDestinations() {
    try {
      const res = await apiRequest('/destinations', { token });
      setAllDestinations(res.destinations || []);
    } catch (_) {
      // Fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAllDestinations();
  }, [token]);

  // Live Map Geocoding Search Debounce (Discovers any Pakistani city dynamically from OpenRouteService)
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setMapSearchResults([]);
      setMapSearchLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setMapSearchLoading(true);
      try {
        const res = await apiRequest(`/destinations/search-map?q=${encodeURIComponent(query)}`, { token });
        if (res && res.results && Array.isArray(res.results)) {
          setMapSearchResults(res.results);
        }
      } catch (err) {
        console.warn('Map search query failed:', err.message);
      } finally {
        setMapSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, token]);

  // Destination counts by category
  const categoryCounts = useMemo(() => {
    const counts = {};
    if (allDestinations.length > 0) {
      allDestinations.forEach((d) => {
        if (d.category) {
          counts[d.category] = (counts[d.category] || 0) + 1;
        }
      });
    } else {
      CATEGORIES_DATA.forEach((cat) => {
        counts[cat.title] = cat.defaultCount;
      });
    }
    return counts;
  }, [allDestinations]);

  // Toggle favorite bookmark
  function toggleFavorite(dest) {
    if (appToggleFavorite) {
      appToggleFavorite(dest);
    }
  }

  // Filter destinations for the current active category (or search)
  const q = searchQuery.trim().toLowerCase();
  const displayedDestinations = useMemo(() => {
    if (q.length > 0) {
      // 1. Matches from local curated catalog
      const localMatches = allDestinations.filter((d) => {
        const nameMatch = d.name.toLowerCase().includes(q);
        const regionMatch = d.region && d.region.toLowerCase().includes(q);
        const catMatch = d.category && d.category.toLowerCase().includes(q);
        return nameMatch || regionMatch || catMatch;
      });

      // 2. Matches from live OpenStreetMap / OpenRouteService geocoding (e.g. Attock, Abbottabad, etc.)
      const localNames = new Set(localMatches.map((d) => d.name.toLowerCase().trim()));
      const mapMatches = (mapSearchResults || []).filter((m) => {
        const cleanName = (m.name || '').toLowerCase().trim();
        return !localNames.has(cleanName);
      });

      return [...localMatches, ...mapMatches];
    }
    // Normal: show all destinations belonging to active category
    return allDestinations.filter((d) => d.category === activeCategory);
  }, [allDestinations, activeCategory, q, mapSearchResults]);

  // Category switch handler - Opens dedicated full-page cities & seasons view
  function handleSelectCategory(cat) {
    const catTitle = typeof cat === 'string' ? cat : cat.title;
    setActiveCategory(catTitle);
    setSearchQuery('');
    const catObj = typeof cat === 'object' ? cat : CATEGORIES_DATA.find((c) => c.title === catTitle) || {};
    navigation.navigate('CategoryCities', {
      category: catTitle,
      categoryData: catObj,
    });
  }

  // Show all / View all category destinations handler
  function handleShowAllCategory() {
    if (searchQuery && searchQuery.trim().length > 0) {
      setSearchQuery('');
      return;
    }
    navigation.navigate('CategoryCities', {
      category: 'All',
      categoryData: {
        id: 'All',
        title: 'All Destinations in Pakistan',
        iconEmoji: '',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80',
        desc: 'Explore all 48 curated destinations across Pakistan — from northern glaciers and alpine meadows to ancient heritage forts and sunny coastal beaches.',
      },
    });
  }

  // City click handler - Opens dedicated Destination Detail screen
  function handleSelectCity(dest) {
    navigation.navigate('DestinationDetail', {
      destination: dest,
    });
  }

  // Search submit handler - Navigates directly to the first matched city screen
  function handleSearchSubmit() {
    if (displayedDestinations.length > 0) {
      const firstMatch = displayedDestinations[0];
      navigation.navigate('DestinationDetail', {
        destination: firstMatch,
      });
    }
  }

  // Clear search handler
  function handleClearSearch() {
    setSearchQuery('');
  }

  return (
    <View style={styles.page}>
      <StatusBar style="light" />

      {/* 1. Full Scenic Pakistan Northern Areas Background */}
      <ImageBackground
        source={natureBg}
        style={styles.pageBackground}
        resizeMode="cover"
      >
        {/* Soft atmospheric gradient/overlay to ensure high contrast and readable text */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.40)',
            'rgba(255, 255, 255, 0.22)',
            'rgba(240, 248, 243, 0.32)',
            'rgba(230, 244, 238, 0.52)',
          ]}
          locations={[0, 0.28, 0.65, 1]}
          style={styles.gradientOverlay}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); loadAllDestinations(); }}
                tintColor={colors.forest}
              />
            }
          >
            <View style={styles.mainContainer}>

              {/* =====================================================================
                  1. TOP HEADER SECTION (Matches Reference Mockup)
                  - Handwritten slogan: "Pakistan is always a good idea  "
                  - Centered greeting: "Hi, Traveler " with Mountain Emblem
                  - Subtitle: "Plan smarter · Travel better · Explore Pakistan"
                  - Search bar with Emerald Green [Search] button
                  - Profile avatar on right
                 ===================================================================== */}
              <View style={styles.headerContainer}>
                {/* Top Row: Slogan on Left, Avatar on Right */}
                <View style={styles.topUtilityRow}>
                  <View style={styles.sloganContainer}>
                    <AppText style={styles.sloganLine1}>Pakistan is</AppText>
                    <View style={styles.sloganRow2}>
                      <AppText style={styles.sloganLine2}>always a good idea </AppText>
                      <AppText style={styles.sloganHeart}> </AppText>
                      <AppIcon name="airplane" size={13} color="#145a38" />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.profileBadge}
                    onPress={() => navigation.navigate('Profile')}
                    accessibilityRole="button"
                    accessibilityLabel="Open profile"
                  >
                    <AppText style={styles.initialsText}>{initials}</AppText>
                  </TouchableOpacity>
                </View>

                {/* Center Greeting & Mountain Peaks Graphic */}
                <View style={styles.centerGreetingBox}>
                  <View style={styles.greetingTitleRow}>
                    <Image
                      source={mountainLogo}
                      style={styles.greetingLogo}
                      resizeMode="contain"
                    />
                    <AppText style={styles.greetingText}>
                      {user?.fullName ? `Hi, ${displayName} ` : 'Hi, Traveler '}
                    </AppText>
                  </View>

                  <AppText style={styles.quoteSubtitle}>
                    Plan smarter · Travel better · Explore Pakistan
                  </AppText>
                </View>

                {/* Pill Search Bar with Emerald Green [Search] Button */}
                <View style={styles.searchBar}>
                  <AppIcon name="search-outline" size={19} color="#64748b" style={styles.searchIcon} />
                  <TextInput
                    id="search-destinations-input"
                    nativeID="search-destinations-input"
                    name="searchQuery"
                    accessibilityLabel="Search destinations, cities, regions"
                    value={searchQuery}
                    onChangeText={(text) => setSearchQuery(text)}
                    onSubmitEditing={handleSearchSubmit}
                    placeholder="Search destinations, cities, regions..."
                    placeholderTextColor="#94a3b8"
                    style={styles.searchInput}
                    returnKeyType="search"
                  />
                  {searchQuery.trim().length > 0 ? (
                    <TouchableOpacity onPress={handleClearSearch} hitSlop={10} style={styles.searchClearBtn}>
                      <AppIcon name="close-circle" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={styles.searchButton}
                    onPress={handleSearchSubmit}
                    accessibilityRole="button"
                    accessibilityLabel="Search destinations"
                  >
                    <AppText style={styles.searchButtonText}>Search</AppText>
                  </TouchableOpacity>
                </View>
              </View>

              {/* =====================================================================
                  2. SECTION DIVIDER: "— Explore Pakistan —"
                 ===================================================================== */}
              <View style={styles.sectionDividerRow}>
                <View style={styles.sectionDividerLine} />
                <View style={styles.sectionTitleRow}>
                  <AppText style={styles.sectionTitleExplore}>Explore </AppText>
                  <AppText style={styles.sectionTitlePakistan}>Pakistan</AppText>
                </View>
                <View style={styles.sectionDividerLine} />
              </View>

              {/* =====================================================================
                  3. 4 CATEGORY CARDS (2x2 Responsive Grid - Reference Mockup)
                  1. Adventure & Nature
                  2. Northern Areas
                  3. Cultural & Historical
                  4. Coastal Areas
                 ===================================================================== */}
              <View style={styles.categoriesGrid}>
                {CATEGORIES_DATA.map((cat) => {
                  const isSelected = activeCategory === cat.title;
                  const count = categoryCounts[cat.title] || cat.defaultCount;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryCard,
                        isWide && styles.categoryCardHalf,
                        isSelected && styles.categoryCardActive,
                      ]}
                      onPress={() => handleSelectCategory(cat)}
                      activeOpacity={0.88}
                      accessibilityRole="button"
                      accessibilityLabel={`Select category ${cat.title}`}
                    >
                      <Image
                        source={{ uri: cat.image }}
                        style={[styles.categoryImage, !isWide && styles.categoryImageMobile]}
                        resizeMode="cover"
                      />
                      <View style={styles.categoryCardContent}>
                        <View style={styles.categoryTitleRow}>
                          <AppIcon name={cat.iconName || 'compass-outline'} size={20} color={cat.color || colors.forest} style={{ marginRight: 6 }} />
                          <AppText style={styles.categoryCardTitle} numberOfLines={1}>
                            {cat.title}
                          </AppText>
                        </View>
                        <AppText style={styles.categoryCardDesc} numberOfLines={3}>
                          {cat.desc}
                        </AppText>
                        <View style={styles.countRow}>
                          <AppIcon name="location-sharp" size={13} color="#e11d48" style={{ marginRight: 4 }} />
                          <AppText style={[styles.categoryCardCount, isSelected && styles.categoryCardCountActive]}>
                            {count} destinations  →
                          </AppText>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

          {/* Search results only shown when user is actively searching */}
          {q.length > 0 && (
          <View style={styles.destinationsSection}>
            <View style={styles.categoryHeaderRow}>
              <View style={styles.categoryHeadingLeft}>
                <AppText style={styles.categoryHeadingTitle}>
                  {`Search Results ("${searchQuery}")`}
                </AppText>
              </View>

              <TouchableOpacity
                onPress={handleClearSearch}
                hitSlop={8}
                style={styles.showAllButton}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Clear search filter"
              >
                <AppText style={styles.showAllText}>Clear search</AppText>
                <AppIcon name="chevron-forward" size={14} color="#186443" style={{ marginLeft: 3 }} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={colors.forest} />
                <AppText style={styles.loadingText}>Loading destinations...</AppText>
              </View>
            ) : displayedDestinations.length === 0 ? (
              <View style={styles.noMatchCard}>
                <AppIcon name="alert-circle-outline" size={28} color={colors.muted} />
                <AppText style={styles.noMatchTitle}>No destinations found for "{searchQuery}"</AppText>
                <TouchableOpacity
                  style={styles.customPlanButton}
                  onPress={() => navigation.navigate('TripPlanning', {
                    preselectedDestination: searchQuery.trim(),
                    preselectedCategory: activeCategory,
                  })}
                >
                  <AppText style={styles.customPlanButtonText}>Plan Custom Trip to "{searchQuery.trim()}"</AppText>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.cityGrid}>
                {displayedDestinations.map((dest) => {
                  const cardKey = dest.destinationId || dest.id || String(dest.name);
                  const isFavorited = isFavorite ? isFavorite(dest) : false;
                  return (
                    <TouchableOpacity
                      key={cardKey}
                      style={[
                        styles.cityCard,
                        isWide && styles.cityCardHalf,
                        dest.isMapLocation && styles.cityCardMapHighlight,
                      ]}
                      onPress={() => handleSelectCity(dest)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={`View destination ${dest.name}`}
                    >
                      <Image
                        source={{ uri: dest.imageUrl || FALLBACK_DEST_IMAGE }}
                        style={styles.cityCardThumb}
                        resizeMode="cover"
                      />
                      <View style={styles.cityCardInfo}>
                        <AppText style={styles.cityCardName} numberOfLines={1}>
                          {dest.name}
                        </AppText>
                        {dest.isMapLocation ? (
                          <View style={styles.mapGeocodedPill}>
                            <AppText style={styles.mapGeocodedPillText}> Live Map ({dest.region || 'Pakistan'})</AppText>
                          </View>
                        ) : (
                          <AppText style={styles.cityCardRegion} numberOfLines={1}>
                            {dest.region}
                          </AppText>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.heartButton}
                        onPress={() => toggleFavorite(dest)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Favorite"
                      >
                        <AppIcon
                          name={isFavorited ? 'heart' : 'heart-outline'}
                          size={19}
                          color={isFavorited ? '#ef4444' : '#94a3b8'}
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
          )}

        </View>
      </ScrollView>
    </LinearGradient>
  </ImageBackground>

  {/* Floating Chatbot Button */}
  <FloatingChatButton navigation={navigation} style={styles.floatingChatBtn} />
</View>
  );
}

const styles = StyleSheet.create({
  floatingChatBtn: {
    bottom: 84,
    right: 22,
  },
  page: {
    flex: 1,
    backgroundColor: '#0a2318',
  },
  pageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  mainContainer: {
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  /* 1. TOP HEADER STYLES */
  headerContainer: {
    paddingTop: 6,
    paddingBottom: 20,
  },
  topUtilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: 48,
    marginBottom: 6,
  },
  sloganContainer: {
    transform: [{ rotate: '-3deg' }],
    paddingTop: 2,
  },
  sloganLine1: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#145a38',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  sloganRow2: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sloganLine2: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#145a38',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  sloganHeart: {
    fontSize: 13,
    color: '#145a38',
    fontWeight: 'bold',
  },
  profileBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    shadowColor: '#072517',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  initialsText: {
    color: '#145a38',
    fontFamily: fonts.bold,
    fontSize: 13.5,
  },

  centerGreetingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 20,
  },
  greetingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  greetingLogo: {
    width: 28,
    height: 25,
  },
  greetingText: {
    fontSize: 27,
    fontFamily: fonts.bold,
    color: '#134932',
    letterSpacing: -0.4,
  },
  quoteSubtitle: {
    fontSize: 13,
    color: '#334155',
    fontFamily: fonts.medium,
    textAlign: 'center',
  },

  /* SEARCH BAR */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 30,
    height: 52,
    paddingLeft: 18,
    paddingRight: 6,
    borderWidth: 1,
    borderColor: '#ffffff',
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#072517',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 8px 24px rgba(7, 37, 23, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
        }
      : {}),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#134932',
    paddingVertical: 8,
  },
  searchClearBtn: {
    paddingHorizontal: 6,
  },
  searchButton: {
    backgroundColor: '#145a38',
    borderRadius: 22,
    paddingVertical: 9,
    paddingHorizontal: 22,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#145a38',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  searchButtonText: {
    color: '#ffffff',
    fontFamily: fonts.bold,
    fontSize: 13.5,
    letterSpacing: 0.2,
  },

  /* 2. SECTION DIVIDER: "— Explore Pakistan —" */
  sectionDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 22,
  },
  sectionDividerLine: {
    width: 50,
    height: 1.5,
    backgroundColor: '#145a38',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleExplore: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  sectionTitlePakistan: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: '#145a38',
    letterSpacing: -0.3,
  },

  /* 3. 4 CATEGORY CARDS (2x2 GRID) */
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  categoryCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.93)',
    borderRadius: 22,
    padding: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.88)',
    alignItems: 'center',
    shadowColor: '#072517',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 8px 24px rgba(7, 37, 23, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
        }
      : {}),
  },
  categoryCardHalf: {
    width: '48.8%',
  },
  categoryCardActive: {
    borderColor: '#145a38',
    borderWidth: 1.8,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  categoryImage: {
    width: 145,
    height: 104,
    borderRadius: 15,
    backgroundColor: '#e2e8f0',
  },
  categoryImageMobile: {
    width: 110,
    height: 94,
    borderRadius: 13,
  },
  categoryCardContent: {
    flex: 1,
    paddingLeft: 14,
    justifyContent: 'space-between',
    height: 104,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryCardEmoji: {
    fontSize: 15,
  },
  categoryCardTitle: {
    fontSize: 15.5,
    fontFamily: fonts.bold,
    color: '#134932',
    flex: 1,
  },
  categoryCardDesc: {
    fontSize: 12,
    lineHeight: 16.5,
    color: '#475569',
    fontFamily: fonts.regular,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  categoryCardCount: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#145a38',
  },
  categoryCardCountActive: {
    color: '#145a38',
  },

  /* 4. DESTINATIONS SECTION (2-COLUMN GRID) */
  destinationsSection: {
    marginBottom: 30,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryHeadingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  categoryHeadingTitle: {
    fontSize: 19,
    fontFamily: fonts.displayBold,
    color: '#0f172a',
  },
  activeSelectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  activeSelectionBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#166534',
  },
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: '#edf7f1',
    borderWidth: 1,
    borderColor: '#c6e7d4',
  },
  showAllText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#186443',
    fontWeight: '700',
  },

  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
  },
  cityCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadowSoft,
  },
  cityCardHalf: {
    width: '48.8%',
  },
  cityCardSelected: {
    borderColor: '#0f5132',
    borderWidth: 2,
    backgroundColor: '#f0fdf4',
  },
  cityCardThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  cityCardInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  cityCardName: {
    fontSize: 14.5,
    fontFamily: fonts.bold,
    color: '#0f172a',
    marginBottom: 2,
  },
  cityCardNameSelected: {
    color: '#0f5132',
  },
  cityCardRegion: {
    fontSize: 11.5,
    color: '#64748b',
    fontFamily: fonts.medium,
  },
  heartButton: {
    padding: 6,
  },

  noMatchCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  noMatchTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  customPlanButton: {
    backgroundColor: colors.forest,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: 6,
  },
  customPlanButtonText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 13,
  },

  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: fonts.medium,
  },

  /* 5. CITY DETAILS STYLES */
  cityDetailsSection: {
    gap: 16,
    marginTop: 10,
  },
  cityBannerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e7f5ed',
    borderColor: '#b2dec6',
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cityBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cityBannerTitle: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.forest,
    letterSpacing: 0.5,
  },
  cityBannerCat: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#4b7561',
  },

  showcaseCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.white,
    ...shadowSoft,
  },
  showcaseImageWrap: {
    width: '100%',
    height: 230,
    position: 'relative',
  },
  showcaseImage: {
    width: '100%',
    height: '100%',
  },
  showcaseImageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
  showcaseBadgesRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  regionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  regionBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: fonts.semibold,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  ratingBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  showcaseTitleOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  showcaseCityName: {
    fontSize: 28,
    fontFamily: fonts.displayBold,
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  infoCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadowSoft,
  },
  infoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSectionTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  beautyDescription: {
    fontSize: 13,
    lineHeight: 21,
    color: '#2d473b',
    fontFamily: fonts.body,
  },
  infoSubtext: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: fonts.medium,
    marginBottom: 12,
  },
  spotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  spotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#edf6f1',
    borderColor: '#cde4d6',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  spotChipText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  noSpotsText: {
    fontSize: 12,
    color: colors.muted,
    fontStyle: 'italic',
  },

  seasonBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  seasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3e9',
    borderColor: '#fed6b3',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  seasonBadgeText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#a85507',
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#edf6f1',
    borderColor: '#cde4d6',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  difficultyBadgeText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  seasonNote: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: fonts.medium,
    lineHeight: 16,
    marginTop: 4,
  },

  /* WEATHER & HAZARDS */
  weatherBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: 12,
    gap: 12,
  },
  weatherTempBadge: {
    backgroundColor: '#0284c7',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherTempNumber: {
    color: colors.white,
    fontFamily: fonts.displayBold,
    fontSize: 20,
    lineHeight: 24,
  },
  weatherConditionTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#0369a1',
  },
  weatherDetailsText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#0c4a6e',
  },
  hazardContainer: {
    gap: 8,
    marginTop: 4,
  },
  hazardAlertCard: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    padding: 12,
    gap: 6,
  },
  hazardDangerCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  hazardWarningCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  hazardAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hazardAlertTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    flex: 1,
  },
  hazardAlertMessage: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#475569',
    lineHeight: 17,
  },
  hazardActionBox: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.sm,
    padding: 8,
    marginTop: 4,
  },
  hazardActionLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#0f172a',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  hazardActionText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#334155',
    lineHeight: 15,
  },
  safeConditionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: 12,
    gap: 10,
  },
  safeConditionsText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#166534',
    lineHeight: 17,
  },
  helplineBox: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 10,
    gap: 6,
    marginTop: 2,
  },
  helplineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  helplineLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#065f46',
    letterSpacing: 0.5,
  },
  helplinePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  helplinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#6ee7b7',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  helplinePillName: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.muted,
  },
  helplinePillNumber: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.forest,
  },

  /* PLAN A TRIP HERE BAR */
  planTripHereBar: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 8,
    ...shadowSoft,
  },
  planTripHereGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 14,
  },
  planTripIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTripHereTitle: {
    color: colors.white,
    fontSize: 18,
    fontFamily: fonts.displayBold,
  },
  planTripHereSubtitle: {
    color: '#dff3e8',
    fontSize: 11,
    fontFamily: fonts.medium,
    marginTop: 2,
  },
  mapGeocodedPill: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  mapGeocodedPillText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#1d4ed8',
  },
  cityCardMapHighlight: {
    borderColor: '#60a5fa',
    borderWidth: 1.5,
  },

  /* ACTIVE TRIP IN PROGRESS BANNER */
  activeTripCardWrap: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 6,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadowSoft,
  },
  activeTripGradient: {
    padding: 16,
    borderRadius: 20,
  },
  activeTripTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activeTripPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  activeTripPillText: {
    color: '#86efac',
    fontSize: 9,
    fontFamily: fonts.bold,
    letterSpacing: 0.8,
  },
  activeTripDaysBadge: {
    color: '#dcfce7',
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  activeTripContentRow: {
    marginBottom: 12,
  },
  activeTripTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontFamily: fonts.displayBold,
  },
  activeTripSubtitle: {
    color: '#bbf7d0',
    fontSize: 12,
    fontFamily: fonts.medium,
    marginTop: 3,
  },
  activeTripButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  activeTripResumeButton: {
    flex: 1.3,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    ...shadowSoft,
  },
  activeTripResumeButtonText: {
    color: '#134e34',
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  activeTripMapButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  activeTripMapButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: fonts.bold,
  },
});
