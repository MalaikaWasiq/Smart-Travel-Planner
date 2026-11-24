import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Pressable as TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../components/ScreenHeader';
import AppText from '../components/AppText';
import AppIcon from '../components/AppIcon';
import PrimaryButton from '../components/PrimaryButton';
import { apiRequest } from '../api/client';
import { useApp } from '../context/AppContext';
import { colors, fonts, radius, shadowSoft, spacing } from '../theme';
import FloatingChatButton from '../components/FloatingChatButton';

const natureBg = require('../../assets/splash_nature_bg.jpg');

export default function DestinationDetailScreen({ navigation, route }) {
  const { destination: initialDest } = route.params || {};
  const [destination, setDestination] = useState(initialDest || {});
  const [isFavorite, setIsFavorite] = useState(Boolean(initialDest?.isFavorite));
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [favLoading, setFavLoading] = useState(false);
  const { token, isFavorite: appIsFavorite, toggleFavorite } = useApp();

  useEffect(() => {
    if (destination?.name && appIsFavorite) {
      setIsFavorite(appIsFavorite(destination));
    }
  }, [destination, appIsFavorite]);

  useEffect(() => {
    if (initialDest) {
      setDestination(initialDest);
      setIsFavorite(Boolean(initialDest?.isFavorite));
    }
  }, [initialDest]);

  const cityQuery = destination.weatherCity || destination.name || 'Lahore';

  useEffect(() => {
    let active = true;
    async function loadData() {
      if (!destination.name) return;
      setWeatherLoading(true);
      setWeatherError('');

      try {
        const [weatherRes, destRes] = await Promise.all([
          apiRequest(`/weather?city=${encodeURIComponent(cityQuery)}&days=4`).catch((e) => ({ error: e.message })),
          destination.destinationId || destination.id
            ? apiRequest(`/destinations/${destination.destinationId || destination.id}`, { token }).catch(() => null)
            : Promise.resolve(null),
        ]);

        if (active) {
          if (weatherRes && !weatherRes.error) {
            setWeather(weatherRes.weather || null);
            setForecast(weatherRes.forecast || []);
          } else {
            setWeatherError(weatherRes?.error || 'Weather is temporarily unavailable');
          }

          if (destRes?.destination) {
            setDestination((prev) => ({ ...prev, ...destRes.destination }));
            setIsFavorite(Boolean(destRes.destination.isFavorite));
          }
        }
      } finally {
        if (active) setWeatherLoading(false);
      }
    }

    loadData();
    return () => { active = false; };
  }, [cityQuery, destination.destinationId, destination.id, destination.name, token]);

  async function handleToggleFavorite() {
    setFavLoading(true);
    try {
      if (toggleFavorite) {
        const nextState = await toggleFavorite(destination);
        setIsFavorite(nextState);
      } else if (token) {
        const destId = destination.destinationId || destination.id;
        const res = await apiRequest(`/destinations/${destId}/favorite`, { method: 'POST', token });
        setIsFavorite(res.isFavorite);
      }
    } catch (_) {
      // Ignored
    } finally {
      setFavLoading(false);
    }
  }

  function handlePlanTrip(mode = 'company') {
    navigation.navigate('TripPlanning', {
      preselectedDestination: destination.name,
      preselectedCategory: destination.category,
      coordinates: destination.coordinates,
      region: destination.region,
      initialTripMode: mode,
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
              <View style={styles.scenicHeaderTopRow}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.headerBackBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <AppIcon name="arrow-back" size={18} color="#ffffff" style={{ marginRight: 4 }} />
                  <AppText style={styles.headerBackText}>Back</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.heartBtn}
                  onPress={handleToggleFavorite}
                  disabled={favLoading}
                  accessibilityRole="button"
                  accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {favLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <AppIcon
                      name={isFavorite ? 'heart' : 'heart-outline'}
                      size={22}
                      color={isFavorite ? '#ff4d4d' : '#ffffff'}
                    />
                  )}
                </TouchableOpacity>
              </View>
              <AppText style={styles.headerTitle}>{destination.name || 'Destination'}</AppText>
              <AppText style={styles.headerSubtitle}>{destination.region || destination.category || 'Pakistan'}</AppText>
            </View>
          </LinearGradient>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={true}>
            <View style={styles.contentContainer}>
              {/* Destination Image Hero */}
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: destination.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80' }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
                <View style={styles.categoryPill}>
                  <AppIcon name="bookmark" size={13} color={colors.white} />
                  <AppText style={styles.categoryPillText}>{destination.category || 'Explore Pakistan'}</AppText>
                </View>
              </View>

              {/* Title & Difficulty Summary */}
              <View style={styles.card}>
                <View style={styles.titleRow}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="title" style={styles.destName}>{destination.name}</AppText>
                    <View style={styles.locationRow}>
                      <AppIcon name="location-outline" size={16} color={colors.forest} />
                      <AppText color={colors.muted} style={styles.regionText}>{destination.region}, Pakistan</AppText>
                    </View>
                  </View>
                  <View style={styles.ratingBadge}>
                    <AppIcon name="star" size={15} color="#e5a93b" />
                    <AppText style={styles.ratingText}>{destination.rating || 4.8}</AppText>
                  </View>
                </View>

                {/* Category Relationship Notice */}
                <View style={styles.categoryInfoBox}>
                  <AppIcon name="information-circle" size={18} color={colors.forest} />
                  <View style={{ flex: 1 }}>
                    <AppText style={styles.categoryInfoTitle}>Category Classification</AppText>
                    <AppText style={styles.categoryInfoBody}>
                       <AppText style={{ fontWeight: 'bold' }}>{destination.name}</AppText> lies in the <AppText style={{ fontWeight: 'bold', color: colors.forest }}>{destination.category || 'Featured'}</AppText> category of Pakistan.
                    </AppText>
                  </View>
                </View>

                <AppText style={styles.description}>
                  {destination.description || `Explore ${destination.name}, located in ${destination.region || 'Pakistan'}. Plan your personalized itinerary, hotels, vehicles, and budget with Smart Travel Planner.`}
                </AppText>

                {/* Quick Travel Badges */}
                <View style={styles.badgeRow}>
                  <View style={styles.infoBadge}>
                    <AppIcon name="calendar-outline" size={15} color={colors.forest} />
                    <View>
                      <AppText variant="caption" color={colors.muted}>Best Time</AppText>
                      <AppText style={styles.infoBadgeValue}>{destination.bestTimeToVisit || 'May to Oct'}</AppText>
                    </View>
                  </View>

                  <View style={styles.infoBadge}>
                    <AppIcon name="speedometer-outline" size={15} color={colors.forest} />
                    <View>
                      <AppText variant="caption" color={colors.muted}>Difficulty</AppText>
                      <AppText style={styles.infoBadgeValue}>{destination.travelDifficulty || 'Moderate'}</AppText>
                    </View>
                  </View>
                </View>
              </View>

              {/* Popular Activities */}
              {destination.popularActivities?.length ? (
                <View style={styles.card}>
                  <AppText variant="heading" style={styles.sectionHeader}>Popular Activities</AppText>
                  <View style={styles.activitiesWrap}>
                    {destination.popularActivities.map((act, index) => (
                      <View key={index} style={styles.activityPill}>
                        <AppIcon name="checkmark-circle" size={14} color={colors.green} />
                        <AppText style={styles.activityText}>{act}</AppText>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* Destination-Specific Weather Widget */}
              <View style={styles.card}>
                <View style={styles.sectionHeaderRow}>
                  <AppText variant="heading">Live Weather & Forecast</AppText>
                  <AppText variant="caption" color={colors.muted}>{cityQuery}</AppText>
                </View>

                {weatherLoading ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator color={colors.forest} />
                    <AppText style={styles.loadingText}>Fetching real-time weather...</AppText>
                  </View>
                ) : weather ? (
                  <View>
                    <View style={styles.currentWeatherRow}>
                      <View style={styles.tempGroup}>
                        <AppText style={styles.currentTemp}>{weather.temp}°C</AppText>
                        <AppText style={styles.weatherCondition}>{weather.description || weather.main}</AppText>
                      </View>
                      <View style={styles.weatherDetailsCol}>
                        <AppText style={styles.weatherSubDetail}>Humidity: {weather.humidity}%</AppText>
                        <AppText style={styles.weatherSubDetail}>Wind: {weather.wind} m/s</AppText>
                        <AppText style={styles.weatherSubDetail}>Feels like: {weather.feelsLike}°C</AppText>
                      </View>
                    </View>

                    {forecast.length ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
                        {forecast.map((day, idx) => (
                          <View key={idx} style={styles.miniForecastCard}>
                            <AppText style={styles.forecastDayLabel}>{day.label || `Day ${day.dayNumber}`}</AppText>
                            <AppText style={styles.forecastTempText}>{day.temp}°C</AppText>
                            <AppText style={styles.forecastDescText}>{day.main}</AppText>
                          </View>
                        ))}
                      </ScrollView>
                    ) : null}
                  </View>
                ) : (
                  <AppText color={colors.muted} style={styles.weatherFallbackText}>
                    {weatherError || 'Weather data unavailable — verify conditions before travel.'}
                  </AppText>
                )}
              </View>

              {/* Travel Safety & Hazard Information */}
              <View style={styles.card}>
                <View style={styles.safetyHeaderRow}>
                  <AppIcon name="shield-checkmark" size={18} color={colors.green} />
                  <AppText variant="heading" style={styles.safetyTitle}>Travel Safety & Route Status</AppText>
                </View>

                <View style={styles.safetyStatusBox}>
                  <AppIcon name="information-circle-outline" size={16} color={colors.forest} />
                  <AppText style={styles.safetyStatusText}>
                    {destination.travelDifficulty === 'Challenging 4x4'
                      ? 'High-altitude mountain terrain. 4x4 high-clearance jeeps recommended. Check road pass status before traveling.'
                      : 'National Highway route accessible. Standard passenger vehicles and rental cars suitable in normal conditions.'}
                  </AppText>
                </View>

                <AppText variant="caption" color={colors.muted} style={styles.disclaimerText}>
                  Safety advisory: Verify Karakoram Highway & Motorway conditions via National Highway & Motorway Police helpline (130).
                </AppText>
              </View>

              {/* Bottom CTA: Plan Trip - 2 Clear Mode Options */}
              <View style={styles.bottomCtaCard}>
                <View style={styles.ctaTextCol}>
                  <AppText style={styles.ctaTitle}>Choose Your Planning Mode for {destination.name}</AppText>
                  <AppText variant="caption" color={colors.muted}>
                    Select whether you want an all-inclusive company package or full customizable control:
                  </AppText>
                </View>

                <View style={styles.modeButtonsContainer}>
                  {/* OPTION 1: COMPANY TOUR OR FULL PACKAGE */}
                  <TouchableOpacity
                    style={styles.companyModeBtn}
                    onPress={() => handlePlanTrip('company')}
                    activeOpacity={0.88}
                    accessibilityRole="button"
                    accessibilityLabel="Company Tour or Full Company Package"
                  >
                    <View style={styles.modeBtnHeader}>
                      <View style={[styles.modeIconCircle, { backgroundColor: '#14532d' }]}>
                        <AppIcon name="business" size={22} color={colors.white} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText style={styles.companyModeTitle}>Company Tour or Full Package</AppText>
                        <View style={styles.badgeRowInner}>
                          <AppText style={styles.modeBadgeCompany}>[Included] Complete All-Inclusive Package</AppText>
                        </View>
                      </View>
                      <AppIcon name="chevron-forward" size={20} color={colors.white} />
                    </View>
                    <AppText style={styles.companyModeDesc}>
                      Company arranges complete tour: dedicated vehicle with driver, hotel stay according to budget tier, breakfast & dinner, sightseeing, fuel & motorway tolls.
                    </AppText>
                  </TouchableOpacity>

                  {/* OPTION 2: CUSTOMIZE MY TRIP */}
                  <TouchableOpacity
                    style={styles.customModeBtn}
                    onPress={() => handlePlanTrip('customized')}
                    activeOpacity={0.88}
                    accessibilityRole="button"
                    accessibilityLabel="Customize My Trip"
                  >
                    <View style={styles.modeBtnHeader}>
                      <View style={[styles.modeIconCircle, { backgroundColor: '#0284c7' }]}>
                        <AppIcon name="construct" size={22} color={colors.white} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText style={styles.customModeTitle}>Customize My Trip</AppText>
                        <View style={styles.badgeRowInner}>
                          <AppText style={styles.modeBadgeCustom}> Flexible • Pick Your Services</AppText>
                        </View>
                      </View>
                      <AppIcon name="chevron-forward" size={20} color="#0284c7" />
                    </View>
                    <AppText style={styles.customModeDesc}>
                      Pick required services (Transport, Hotel, Food, Activities) freely. Any unselected service is completely hidden and company cost is PKR 0.
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* FLOATING CHATBOT BUTTON ON SIDE OF SCREEN */}
          <FloatingChatButton navigation={navigation} />
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0a2318', position: 'relative' },
  pageBackground: { flex: 1, width: '100%', height: '100%' },
  pageGradientOverlay: { flex: 1 },

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
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  scenicHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D1FAE5',
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 50,
  },
  contentContainer: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    gap: 14,
  },
  categoryInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E6F7EE',
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DCECE5',
  },
  categoryInfoTitle: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.forest,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryInfoBody: {
    fontSize: 12,
    color: colors.ink,
    fontFamily: fonts.medium,
    marginTop: 1,
    lineHeight: 16,
  },
  heartBtn: { padding: 6 },
  imageContainer: {
    width: '100%',
    height: 240,
    borderRadius: radius.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.line,
    borderWidth: 1,
    borderColor: '#DCECE5',
  },
  heroImage: { width: '100%', height: '100%' },
  categoryPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(6, 35, 22, 0.75)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  categoryPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  card: {
    ...shadowSoft,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: radius.xl,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#DCECE5',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  destName: {
    fontSize: 24,
    fontFamily: fonts.displayBold,
    color: colors.ink,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  regionText: { fontSize: 13, fontFamily: fonts.medium },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff8ea',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#f2dc9b',
  },
  ratingText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#8c5e0e',
  },
  description: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: fonts.body,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  infoBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f4faf7',
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#DCECE5',
  },
  infoBadgeValue: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: fonts.displayBold,
    color: colors.ink,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6F7EE',
    borderColor: '#DCECE5',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activityText: {
    color: colors.forest,
    fontSize: 12,
    fontFamily: fonts.semibold,
  },
  loadingBox: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 12,
  },
  currentWeatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E6F7EE',
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#DCECE5',
  },
  tempGroup: { gap: 2 },
  currentTemp: {
    fontSize: 32,
    fontFamily: fonts.displayBold,
    color: colors.forest,
  },
  weatherCondition: {
    fontSize: 13,
    color: colors.muted,
    textTransform: 'capitalize',
    fontFamily: fonts.medium,
  },
  weatherDetailsCol: { gap: 3 },
  weatherSubDetail: {
    fontSize: 12,
    color: colors.ink,
    fontFamily: fonts.body,
  },
  forecastScroll: {
    marginTop: 10,
  },
  miniForecastCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#DCECE5',
    padding: 10,
    alignItems: 'center',
    marginRight: 8,
    minWidth: 74,
    gap: 3,
  },
  forecastDayLabel: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: fonts.bold,
  },
  forecastTempText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  forecastDescText: {
    fontSize: 10,
    color: colors.muted,
  },
  weatherFallbackText: {
    fontSize: 13,
    lineHeight: 18,
  },
  safetyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  safetyTitle: {
    fontSize: 16,
    fontFamily: fonts.displayBold,
  },
  safetyStatusBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#E6F7EE',
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#DCECE5',
  },
  safetyStatusText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.forest,
    fontFamily: fonts.body,
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  bottomCtaCard: {
    ...shadowSoft,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: radius.xl,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#DCECE5',
  },
  ctaTextCol: { gap: 2 },
  ctaTitle: {
    fontSize: 16,
    fontFamily: fonts.displayBold,
    color: colors.ink,
  },
  modeButtonsContainer: {
    gap: 12,
    marginTop: 4,
  },
  companyModeBtn: {
    backgroundColor: '#1b5e20',
    borderRadius: radius.lg,
    padding: 16,
    gap: 8,
    ...shadowSoft,
  },
  customModeBtn: {
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    padding: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: '#0284c7',
    ...shadowSoft,
  },
  modeBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyModeTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#ffffff',
  },
  customModeTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#0f172a',
  },
  badgeRowInner: {
    flexDirection: 'row',
    marginTop: 2,
  },
  modeBadgeCompany: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#dcfce7',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  modeBadgeCustom: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#0369a1',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  companyModeDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    color: '#e2e8f0',
    fontFamily: fonts.body,
  },
  customModeDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    color: '#475569',
    fontFamily: fonts.body,
  },
  planBtn: { marginTop: 4 },
});
