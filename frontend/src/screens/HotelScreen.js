import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable as TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../components/ScreenHeader';
import AppIcon from '../components/AppIcon';
import { useApp } from '../context/AppContext';
import { colors, fonts, radius, shadow } from '../theme';
import Text from '../components/AppText';
import { navigateRoot } from '../navigation/navigationRef';
import { apiRequest } from '../api/client';
import fallbackHotels from '../data/hotels.json';

const natureBg = require('../../assets/splash_nature_bg.jpg');

const POPULAR_CITIES = [
  'All Cities',
  'Hunza',
  'Skardu',
  'Swat',
  'Naran & Kaghan',
  'Kumrat',
  'Astore',
  'Murree & Galyat',
  'Malam Jabba',
  'Lahore',
  'Islamabad',
  'Karachi',
  'Gwadar',
  'Quetta',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Bahawalpur',
  'Gilgit',
  'Neelum Valley',
  'Ziarat',
  'Khaplu & Shigar',
  'Muzaffarabad',
  'Taxila',
];

const COMFORT_TIERS = ['All Tiers', 'Luxury', 'Normal', 'Basic'];

export default function HotelScreen({ navigation }) {
  const { currentTrip, trips, selectHotel, openTrip, token } = useApp();
  const { width: windowWidth } = useWindowDimensions();
  const isWide = windowWidth >= 768;

  const [savingId, setSavingId] = useState(null);
  const [allHotels, setAllHotels] = useState(fallbackHotels || []);
  const [loadingHotels, setLoadingHotels] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedComfort, setSelectedComfort] = useState('All Tiers');

  // Mode: if currentTrip exists, default to 'trip', but user can toggle to 'all'
  const [mode, setMode] = useState(currentTrip ? 'trip' : 'all');

  function handleGoBack() {
    if (currentTrip) {
      openTrip(currentTrip);
      navigateRoot('Itinerary', { trip: currentTrip });
    } else {
      navigateRoot('MainApp', { screen: 'Home' });
    }
  }

  // Fetch live hotels list from backend API
  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingHotels(true);
      try {
        const res = await apiRequest('/hotels', { token });
        if (res && res.hotels && Array.isArray(res.hotels) && res.hotels.length > 0 && active) {
          setAllHotels(res.hotels);
        }
      } catch (err) {
        // Fallback to bundled dataset
      } finally {
        if (active) setLoadingHotels(false);
      }
    })();
    return () => { active = false; };
  }, [token]);

  // Dynamic backend search when user types a city or location
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) return;

    const timer = setTimeout(async () => {
      try {
        const res = await apiRequest(`/hotels?city=${encodeURIComponent(q)}`, { token });
        if (res && Array.isArray(res.hotels) && res.hotels.length > 0) {
          setAllHotels((prev) => {
            const existingIds = new Set(prev.map((h) => h.id));
            const fresh = res.hotels.filter((h) => !existingIds.has(h.id));
            return fresh.length > 0 ? [...fresh, ...prev] : prev;
          });
        }
      } catch (_) {}
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, token]);

  // Trip-specific hotels if currentTrip exists
  const tripHotels = useMemo(() => {
    if (!currentTrip) return [];
    return currentTrip.hotelSuggestions || currentTrip.hotels || [];
  }, [currentTrip]);

  // Smart normalized matcher for search queries (city, hotel name, region)
  function matchesQuery(hotel, query) {
    if (!query || !query.trim()) return true;
    const q = query.trim().toLowerCase();
    const name = String(hotel.name || '').toLowerCase();
    const city = String(hotel.city || '').toLowerCase();
    const address = String(hotel.address || '').toLowerCase();
    const amenities = (hotel.amenities || []).join(' ').toLowerCase();

    // 1. Direct or reverse substring match
    if (name.includes(q) || city.includes(q) || address.includes(q) || amenities.includes(q)) return true;
    if (q.length >= 3 && (q.includes(city) || (city && q.replace(/[^a-z0-9]/g, '').includes(city.replace(/[^a-z0-9]/g, ''))))) return true;

    // 2. Normalized token match (e.g. "Hunza Valley" -> "hunza", "valley")
    const qTokens = q.split(/[\s,&/-]+/).filter((t) => t.length >= 2);
    const cTokens = city.split(/[\s,&/-]+/).filter((t) => t.length >= 2);
    const nTokens = name.split(/[\s,&/-]+/).filter((t) => t.length >= 2);
    if (qTokens.some((qt) => cTokens.some((ct) => ct.includes(qt) || qt.includes(ct)))) return true;
    if (qTokens.some((qt) => nTokens.some((nt) => nt.includes(qt)))) return true;

    return false;
  }

  function matchesCityFilter(hotelCity, targetCity) {
    if (!targetCity || targetCity === 'All Cities') return true;
    const h = String(hotelCity || '').toLowerCase();
    const t = String(targetCity || '').toLowerCase();
    if (h.includes(t) || t.includes(h)) return true;
    const normH = h.replace(/[^a-z0-9]/g, '');
    const normT = t.replace(/[^a-z0-9]/g, '');
    if (normH.includes(normT) || normT.includes(normH)) return true;
    const tTokens = t.split(/[\s,&/-]+/).filter((x) => x.length >= 2);
    const hTokens = h.split(/[\s,&/-]+/).filter((x) => x.length >= 2);
    return tTokens.some((tok) => hTokens.some((ht) => ht.includes(tok) || tok.includes(ht)));
  }

  // Filter all hotels across Pakistan
  const filteredAllHotels = useMemo(() => {
    return allHotels.filter((hotel) => {
      // 1. Search query (matches hotel name, city, amenities)
      if (!matchesQuery(hotel, searchQuery)) return false;

      // 2. City filter
      if (!matchesCityFilter(hotel.city, selectedCity)) return false;

      // 3. Comfort filter
      if (selectedComfort !== 'All Tiers') {
        if ((hotel.comfortLevel || '').toLowerCase() !== selectedComfort.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [allHotels, searchQuery, selectedCity, selectedComfort]);

  async function choose(hotel) {
    setSavingId(hotel.id);
    try {
      await selectHotel(hotel.id);
      Alert.alert('Hotel Selected', `${hotel.name} has been selected for your trip to ${currentTrip.destination}!`);
    } catch (error) {
      Alert.alert('Could not select hotel', error.message);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <View style={styles.page}>
      <StatusBar style="light" />

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
          {/* SCENIC TOP HEADER */}
          <View style={styles.scenicHeader}>
            <TouchableOpacity onPress={handleGoBack} style={styles.headerBackBtn} accessibilityRole="button">
              <AppIcon name="arrow-back" size={18} color="#1F2937" style={{ marginRight: 4 }} />
              <Text style={styles.headerBackText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {currentTrip && mode === 'trip' ? 'Hotel Options' : 'Hotels in Pakistan'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {currentTrip && mode === 'trip'
                ? `📍 ${currentTrip.destination} · Verified room rates & details`
                : `📍 ${allHotels.length} curated stays across Northern Areas, Cities & Coast`}
            </Text>
          </View>
          {/* Mode Switcher Tabs when active trip is present */}
      {currentTrip ? (
        <View style={styles.tabToggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'trip' && styles.toggleBtnActive]}
            onPress={() => setMode('trip')}
          >
            <Text style={[styles.toggleText, mode === 'trip' && styles.toggleTextActive]}>
              📍 {currentTrip.destination} Hotels
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'all' && styles.toggleBtnActive]}
            onPress={() => setMode('all')}
          >
            <Text style={[styles.toggleText, mode === 'all' && styles.toggleTextActive]}>
              🇵🇰 All Pakistan Hotels ({allHotels.length})
            </Text>
          </TouchableOpacity>
        </View>
      ) : trips && trips.length > 0 ? (
        /* Helpful banner if user has saved trips */
        <TouchableOpacity
          style={styles.savedTripBanner}
          onPress={() => {
            openTrip(trips[0]);
            setMode('trip');
          }}
        >
          <AppIcon name="navigate-circle" size={20} color="#145a38" />
          <Text style={styles.savedTripText}>
            You have a saved trip to <Text style={{ fontWeight: 'bold' }}>{trips[0].destination}</Text>. Tap to manage its hotel.
          </Text>
          <AppIcon name="chevron-forward" size={16} color="#145a38" />
        </TouchableOpacity>
      ) : null}

      {/* ==========================================================
          VIEW A: TRIP-SPECIFIC HOTELS (when active trip is open)
         ========================================================== */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={true}>
        {/* Top navigation back to itinerary if active trip is open */}
        {currentTrip && mode === 'trip' ? (
          <View style={styles.topBackStrip}>
            <TouchableOpacity
              style={styles.backToItineraryBigBtn}
              onPress={handleGoBack}
              activeOpacity={0.8}
            >
              <AppIcon name="arrow-back" size={17} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.backToItineraryBigText}>
                ← Back to {currentTrip.destination} Itinerary
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Global Search Bar - Search ANY Pakistani city or hotel */}
        <View style={styles.searchBar}>
          <AppIcon name="search-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search any Pakistani city, hotel name, or region..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={10}>
              <AppIcon name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* City Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipScroll}
        >
          {POPULAR_CITIES.map((city) => (
            <TouchableOpacity
              key={city}
              style={[styles.chip, selectedCity === city && styles.chipActive]}
              onPress={() => setSelectedCity(city)}
            >
              <Text style={[styles.chipText, selectedCity === city && styles.chipTextActive]}>
                {city}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Comfort Tier Filter Pills */}
        <View style={styles.tierFilterRow}>
          {COMFORT_TIERS.map((tier) => (
            <TouchableOpacity
              key={tier}
              style={[styles.tierChip, selectedComfort === tier && styles.tierChipActive]}
              onPress={() => setSelectedComfort(tier)}
            >
              <Text style={[styles.tierText, selectedComfort === tier && styles.tierTextActive]}>
                {tier}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Results Summary Bar */}
        <View style={styles.resultsBar}>
          <Text style={styles.resultsCount}>
            Showing{' '}
            <Text style={{ fontWeight: 'bold', color: '#145a38' }}>
              {(searchQuery.trim().length > 0 || selectedCity !== 'All Cities' || selectedComfort !== 'All Tiers' || mode !== 'trip')
                ? filteredAllHotels.length
                : tripHotels.length}
            </Text>{' '}
            verified hotels {selectedCity !== 'All Cities' ? `in ${selectedCity}` : 'across Pakistan'}
          </Text>
        </View>

        {/* Hotel Cards List */}
        {(currentTrip && mode === 'trip' && searchQuery.trim().length === 0 && selectedCity === 'All Cities' && selectedComfort === 'All Tiers') ? (
          tripHotels.length === 0 ? (
            <View style={styles.emptyCard}>
              <AppIcon name="business-outline" size={36} color="#64748b" />
              <Text style={styles.emptyTitle}>No exact hotels in current trip draft</Text>
              <Text style={styles.emptySubtitle}>Explore all {allHotels.length} curated hotels across Pakistan below:</Text>
              <TouchableOpacity style={styles.exploreAllBtn} onPress={() => setMode('all')}>
                <Text style={styles.exploreAllBtnText}>Explore All Pakistan Hotels</Text>
              </TouchableOpacity>
            </View>
          ) : (
            tripHotels.map((hotel) => {
              const selected = currentTrip.selectedHotel?.id === hotel.id;
              return (
                <View key={hotel.id} style={[styles.card, selected && styles.cardSelected]}>
                  {hotel.imageUrl ? (
                    <Image source={{ uri: hotel.imageUrl }} style={styles.image} resizeMode="cover" />
                  ) : (
                    <View style={[styles.image, styles.placeholder]}>
                      <Text style={styles.placeholderText}>{hotel.name?.[0] || 'H'}</Text>
                    </View>
                  )}
                  <View style={styles.info}>
                    <View style={styles.top}>
                      <Text style={styles.name}>{hotel.name}</Text>
                      <View style={styles.ratingBadge}>
                        <AppIcon name="star" size={12} color="#f59e0b" style={{ marginRight: 3 }} />
                        <Text style={styles.rating}>{Number(hotel.rating || 4.2).toFixed(1)}</Text>
                      </View>
                    </View>
                    <Text style={styles.city}>
                      📍 {hotel.city}{hotel.nights ? `, ${hotel.nights} night${hotel.nights === 1 ? '' : 's'}` : ''}
                    </Text>
                    <Text style={styles.amenities} numberOfLines={2}>
                      {(hotel.amenities || []).join(' • ')}
                    </Text>
                    <View style={styles.bottom}>
                      <View>
                        <Text style={styles.price}>PKR {Number(hotel.pricePerNight).toLocaleString()}</Text>
                        <Text style={styles.perNight}>per night, estimated</Text>
                      </View>
                      <View style={styles.actionButtonsRow}>
                        <TouchableOpacity
                          style={[styles.button, selected && styles.buttonSelected]}
                          disabled={savingId === hotel.id || selected}
                          onPress={() => choose(hotel)}
                        >
                          <Text style={[styles.buttonText, selected && styles.buttonTextSelected]}>
                            {selected ? 'SELECTED ✓' : savingId === hotel.id ? 'SAVING...' : 'SELECT HOTEL'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.detailsBtn}
                          onPress={() => navigation.navigate('HotelDetail', { hotel })}
                          accessibilityRole="button"
                          accessibilityLabel={`View details for ${hotel.name}`}
                        >
                          <Text style={styles.detailsBtnText}>Details</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )
        ) : filteredAllHotels.length === 0 ? (
          <View style={styles.emptyCard}>
            <AppIcon name="alert-circle-outline" size={32} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No hotels found matching your filter</Text>
            <TouchableOpacity
              style={styles.exploreAllBtn}
              onPress={() => {
                setSearchQuery('');
                setSelectedCity('All Cities');
                setSelectedComfort('All Tiers');
              }}
            >
              <Text style={styles.exploreAllBtnText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.hotelGrid, isWide && styles.hotelGridWide]}>
            {filteredAllHotels.map((hotel) => {
              const selected = currentTrip && currentTrip.selectedHotel?.id === hotel.id;
              return (
                <View key={hotel.id} style={[styles.card, isWide && styles.cardHalf, selected && styles.cardSelected]}>
                  <Image
                    source={{
                      uri: hotel.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
                    }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  <View style={styles.info}>
                    <View style={styles.top}>
                      <Text style={styles.name} numberOfLines={1}>
                        {hotel.name}
                      </Text>
                      <View style={styles.ratingBadge}>
                        <AppIcon name="star" size={12} color="#f59e0b" style={{ marginRight: 3 }} />
                        <Text style={styles.rating}>{Number(hotel.rating || 4.3).toFixed(1)}</Text>
                      </View>
                    </View>

                    <View style={styles.locationTierRow}>
                      <Text style={styles.city}>📍 {hotel.city}, Pakistan</Text>
                      {hotel.comfortLevel ? (
                        <View
                          style={[
                            styles.comfortBadge,
                            hotel.comfortLevel === 'Luxury'
                              ? styles.badgeLuxury
                              : hotel.comfortLevel === 'Normal'
                              ? styles.badgeNormal
                              : styles.badgeBasic,
                          ]}
                        >
                          <Text style={styles.comfortBadgeText}>{hotel.comfortLevel}</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.amenities} numberOfLines={2}>
                      {(hotel.amenities || []).join(' • ')}
                    </Text>

                    <View style={styles.bottom}>
                      <View>
                        <Text style={styles.price}>PKR {Number(hotel.pricePerNight).toLocaleString()}</Text>
                        <Text style={styles.perNight}>per night, planning estimate</Text>
                      </View>

                      <View style={styles.actionButtonsRow}>
                        {currentTrip && (
                          <TouchableOpacity
                            style={[styles.button, selected && styles.buttonSelected]}
                            disabled={savingId === hotel.id || selected}
                            onPress={() => choose(hotel)}
                          >
                            <Text style={[styles.buttonText, selected && styles.buttonTextSelected]}>
                              {selected ? 'SELECTED ✓' : savingId === hotel.id ? 'SAVING...' : 'SELECT HOTEL'}
                            </Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={styles.planTripBtn}
                          onPress={() =>
                            navigation.navigate('TripPlanning', {
                              preselectedDestination: hotel.city,
                            })
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`Plan trip to ${hotel.city}`}
                        >
                          <Text style={styles.planTripBtnText}>Plan Trip →</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.detailsBtn}
                          onPress={() => navigation.navigate('HotelDetail', { hotel })}
                          accessibilityRole="button"
                          accessibilityLabel={`View details for ${hotel.name}`}
                        >
                          <Text style={styles.detailsBtnText}>Details</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0a2318' },
  pageBackground: { flex: 1, width: '100%', height: '100%' },
  pageGradientOverlay: { flex: 1 },

  scenicHeader: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 14 : 10,
    paddingBottom: 6,
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
    color: '#1F2937',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#374151',
    marginTop: 3,
  },

  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 10,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#DCECE5',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  toggleBtnActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  toggleText: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    fontWeight: '600',
    color: '#0F766E',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontWeight: '800',
  },
  savedTripBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7EE',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCECE5',
    gap: 8,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  savedTripText: {
    flex: 1,
    fontSize: 12.5,
    color: '#1F2937',
    fontFamily: fonts.medium,
  },
  topBackStrip: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backToItineraryBigBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 2,
  },
  backToItineraryBigText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#DCECE5',
    marginBottom: 12,
    ...shadow,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: fonts.medium,
    color: '#1F2937',
  },
  filterChipScroll: {
    gap: 8,
    paddingBottom: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCECE5',
  },
  chipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  chipText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#1F2937',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
  },
  tierFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 6,
  },
  tierChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCECE5',
  },
  tierChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  tierText: {
    fontSize: 11.5,
    fontFamily: fonts.medium,
    color: '#1F2937',
  },
  tierTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
  },
  resultsBar: {
    marginVertical: 10,
    paddingHorizontal: 4,
  },
  resultsCount: {
    fontSize: 12.5,
    color: '#4B5563',
    fontFamily: fonts.regular,
  },
  hotelGrid: {
    gap: 14,
  },
  hotelGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DCECE5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 10,
  },
  cardHalf: {
    width: '48.8%',
  },
  cardSelected: {
    borderColor: '#0F766E',
    borderWidth: 2,
    backgroundColor: '#E6F7EE',
  },
  image: {
    width: 115,
    height: 110,
    borderRadius: 14,
    backgroundColor: '#E6F7EE',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F7EE',
  },
  placeholderText: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: '#0F766E',
  },
  info: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'space-between',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 14.5,
    fontFamily: fonts.bold,
    color: '#1F2937',
    flex: 1,
    marginRight: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rating: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#92400E',
  },
  locationTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  city: {
    fontSize: 11.5,
    color: '#4B5563',
    fontFamily: fonts.medium,
  },
  comfortBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCECE5',
    backgroundColor: '#E6F7EE',
  },
  badgeLuxury: { backgroundColor: '#E6F7EE', borderColor: '#DCECE5' },
  badgeNormal: { backgroundColor: '#E6F7EE', borderColor: '#DCECE5' },
  badgeBasic: { backgroundColor: '#E6F7EE', borderColor: '#DCECE5' },
  comfortBadgeText: {
    fontSize: 9.5,
    fontFamily: fonts.bold,
    color: '#0F766E',
  },
  amenities: {
    fontSize: 11,
    color: '#4B5563',
    fontFamily: fonts.regular,
    marginTop: 3,
    lineHeight: 15,
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F3',
    paddingTop: 6,
  },
  price: {
    fontSize: 13.5,
    fontFamily: fonts.bold,
    color: '#0F766E',
  },
  perNight: {
    fontSize: 9.5,
    color: '#6B7280',
  },
  button: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  buttonSelected: {
    backgroundColor: '#0F766E',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  buttonTextSelected: {
    color: '#FFFFFF',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  planTripBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  planTripBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  detailsBtn: {
    backgroundColor: '#E6F7EE',
    borderWidth: 1,
    borderColor: '#DCECE5',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
  },
  detailsBtnText: {
    color: '#0F766E',
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#DCECE5',
    ...shadow,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#1F2937',
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#4B5563',
    textAlign: 'center',
  },
  exploreAllBtn: {
    marginTop: 8,
    backgroundColor: '#0F766E',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 16,
  },
  exploreAllBtnText: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 12.5,
  },
});
