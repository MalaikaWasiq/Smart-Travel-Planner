import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable as TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../components/ScreenHeader';
import EmptyTrip from '../components/EmptyTrip';
import { useApp } from '../context/AppContext';
import { colors, fonts, radius, shadow } from '../theme';
import OpenStreetMap from '../components/OpenStreetMap';
import JourneyRouteMap from '../components/JourneyRouteMap';
import Text from '../components/AppText';
import AppIcon from '../components/AppIcon';
import { navigateRoot } from '../navigation/navigationRef';

const natureBg = require('../../assets/splash_nature_bg.jpg');
import {
  getPakistanCoords,
  getHighwayRouteDetails,
  getJourneyStages,
  getScenicStopsForDestination,
  CATEGORIZED_DESTINATIONS,
  POPULAR_MAP_DESTINATIONS,
  POPULAR_MAP_ORIGINS,
  ALL_PAKISTAN_CITIES,
} from '../data/pakistanLocations';

function hasImplausibleCoordinates(routeDay) {
  return Number(routeDay?.distanceMeters || 0) > 1500000 || (routeDay?.activities || []).some((activity) => (
    Number.isFinite(activity.latitude) && Number.isFinite(activity.longitude)
    && (activity.latitude < 23.4 || activity.latitude > 37.2 || activity.longitude < 60.8 || activity.longitude > 77.9)
  ));
}

export default function MapScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 950;
  const mapHeight = desktop ? 480 : 360;

  const {
    currentTrip: contextTrip,
    trips = [],
    tripsLoading,
    openTrip,
    refreshTripRoute,
    deleteTrip,
    track,
  } = useApp();

  const routeTrip = route?.params?.trip;
  const latestTrip = routeTrip || contextTrip || (trips && trips.length > 0 ? trips[0] : null);
  const currentTrip = latestTrip;

  // Active destination is taken with proper priority:
  // 1. Explicit route params (from TripPlanning, DestinationDetail, etc.)
  // 2. Active planning destination (user selected Babusar Top, etc.)
  // 3. Last planned trip from localStorage
  // 4. Current context trip
  // 5. Fallback to 'Babusar Top'
  const [selectedDestination, setSelectedDestination] = useState(() => {
    if (route?.params?.destination) return route.params.destination;
    if (routeTrip?.destination) return routeTrip.destination;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const activeDest = window.localStorage.getItem('stp_active_destination');
        if (activeDest && activeDest.trim()) return activeDest.trim();
        const raw = window.localStorage.getItem('stp_last_planned_trip');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.destination) return parsed.destination;
        }
      } catch (_) {}
    }

    if (contextTrip?.destination) return contextTrip.destination;
    return '';
  });

  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedOrigin, setSelectedOrigin] = useState(() => {
    if (route?.params?.startLocation) return route.params.startLocation;
    if (routeTrip?.startLocation) return routeTrip.startLocation;
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('stp_user_start_location');
      if (saved) return saved;
      try {
        const raw = window.localStorage.getItem('stp_last_planned_trip');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.startLocation) return parsed.startLocation;
        }
      } catch (_) {}
    }
    if (contextTrip?.startLocation) return contextTrip.startLocation;
    return 'Live GPS Location';
  });

  const [originCoords, setOriginCoords] = useState(() => {
    if (route?.params?.originCoords && Array.isArray(route?.params?.originCoords)) {
      return route.params.originCoords;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem('stp_user_origin_coords');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === 2) return parsed;
        }
        const raw = window.localStorage.getItem('stp_last_planned_trip');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed?.originCoords) && parsed.originCoords.length === 2) return parsed.originCoords;
        }
      } catch (_) {}
    }
    return [33.7781, 72.3641];
  });

  const [destCoords, setDestCoords] = useState(() => {
    if (route?.params?.destCoords && Array.isArray(route?.params?.destCoords)) {
      return route.params.destCoords;
    }
    if (route?.params?.destination) {
      return getPakistanCoords(route.params.destination, [35.1524, 74.0477]);
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const activeDest = window.localStorage.getItem('stp_active_destination');
        if (activeDest) {
          return getPakistanCoords(activeDest, [35.1524, 74.0477]);
        }
        const raw = window.localStorage.getItem('stp_last_planned_trip');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed?.destCoords) && parsed.destCoords.length === 2) return parsed.destCoords;
          if (parsed?.destination) return getPakistanCoords(parsed.destination, [35.1524, 74.0477]);
        }
      } catch (_) {}
    }
    return null;
  });

  const hasRoute = Boolean(selectedDestination && selectedDestination.trim().length > 0);

  // Check if an actual saved itinerary exists for this destination
  const matchedTrip = useMemo(() => {
    if (!selectedDestination) return null;
    const destLower = selectedDestination.toLowerCase().trim();
    if (routeTrip && routeTrip.destination?.toLowerCase().trim() === destLower) {
      return routeTrip;
    }
    if (contextTrip && contextTrip.destination?.toLowerCase().trim() === destLower) {
      return contextTrip;
    }
    return trips.find((t) => t.destination?.toLowerCase().trim() === destLower) || null;
  }, [selectedDestination, routeTrip, contextTrip, trips]);

  const hasItinerary = Boolean(matchedTrip);

  // Synchronize when screen gains focus or route params change
  useFocusEffect(
    useCallback(() => {
      // 1. Explicit destination from route params
      let destToUse = route?.params?.destination || routeTrip?.destination;

      // 2. Active planning destination from localStorage (e.g. Babusar Top chosen in TripPlanning)
      if (!destToUse && typeof window !== 'undefined' && window.localStorage) {
        try {
          const activeDest = window.localStorage.getItem('stp_active_destination');
          if (activeDest && activeDest.trim()) {
            destToUse = activeDest.trim();
          } else {
            const raw = window.localStorage.getItem('stp_last_planned_trip');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed?.destination) destToUse = parsed.destination;
            }
          }
        } catch (_) {}
      }

      if (!destToUse && contextTrip?.destination) {
        destToUse = contextTrip.destination;
      }

      if (destToUse && destToUse.toLowerCase().trim() !== selectedDestination.toLowerCase().trim()) {
        setSelectedDestination(destToUse);
        const coords = route?.params?.destCoords || getPakistanCoords(destToUse, [35.1524, 74.0477]);
        if (coords) setDestCoords(coords);
      }

      // Check origin
      let originToUse = route?.params?.startLocation || routeTrip?.startLocation;
      if (!originToUse && typeof window !== 'undefined' && window.localStorage) {
        const savedOrigin = window.localStorage.getItem('stp_user_start_location');
        if (savedOrigin) originToUse = savedOrigin;
      }
      if (originToUse && originToUse.toLowerCase().trim() !== selectedOrigin.toLowerCase().trim()) {
        setSelectedOrigin(originToUse);
      }

      // Check origin coordinates
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const savedCoords = window.localStorage.getItem('stp_user_origin_coords');
          if (savedCoords) {
            const parsed = JSON.parse(savedCoords);
            if (Array.isArray(parsed) && parsed.length === 2) setOriginCoords(parsed);
          }
        } catch (_) {}
      }

      // Always auto-detect live GPS location on localhost
      handleDetectGPS();
    }, [
      route?.params?.destination,
      route?.params?.startLocation,
      route?.params?.destCoords,
      route?.params?.originCoords,
      routeTrip?.destination,
      contextTrip?.destination,
    ])
  );

  // Listen to Leaflet Map iframe postMessages (when user drags green pin or taps anywhere on map)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleMapMessage = (event) => {
      if (event.data && event.data.type === 'UPDATE_START_LOCATION') {
        if (event.data.name) {
          setSelectedOrigin(event.data.name);
          if (window.localStorage) {
            window.localStorage.setItem('stp_user_start_location', event.data.name);
          }
        }
        if (event.data.lat && event.data.lon) {
          const lat = Number(event.data.lat);
          const lon = Number(event.data.lon);
          setOriginCoords([lat, lon]);
          if (window.localStorage) {
            window.localStorage.setItem('stp_user_origin_coords', JSON.stringify([lat, lon]));
          }
        }
      }
    };
    window.addEventListener('message', handleMapMessage);
    return () => window.removeEventListener('message', handleMapMessage);
  }, []);

  // Route type: 'motorway' (Shortest/Fastest) vs 'gt_road' (Alternative)
  const [routeType, setRouteType] = useState('motorway');

  // Live GPS detection state
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState(
    ' Detecting real live GPS location...'
  );

  // Custom search text
  const [customDestinationInput, setCustomDestinationInput] = useState('');
  const [departureSearchText, setDepartureSearchText] = useState('');

  // Filtered Pakistan departure cities matching search in real-time
  const filteredDepartureCities = useMemo(() => {
    if (!departureSearchText.trim()) return [];
    const q = departureSearchText.trim().toLowerCase();
    return ALL_PAKISTAN_CITIES.filter((city) => city.toLowerCase().includes(q));
  }, [departureSearchText]);

  // Filtered Pakistan destination cities matching customDestinationInput
  const filteredDestinationCities = useMemo(() => {
    if (!customDestinationInput.trim()) return [];
    const q = customDestinationInput.trim().toLowerCase();
    return ALL_PAKISTAN_CITIES.filter((city) => city.toLowerCase().includes(q));
  }, [customDestinationInput]);

  const CATEGORY_TABS = [
    'All',
    'Northern Areas',
    'Adventure & Nature',
    'Coastal Areas',
    'Cultural & Historical',
  ];

  const availableDestinations = useMemo(() => {
    if (activeCategory === 'All') return POPULAR_MAP_DESTINATIONS;
    return CATEGORIZED_DESTINATIONS[activeCategory] || POPULAR_MAP_DESTINATIONS;
  }, [activeCategory]);

  // Authentic scenic stops for the current destination
  const destinationScenicStops = useMemo(() => {
    if (!selectedDestination || !destCoords) return [];
    return getScenicStopsForDestination(selectedDestination, destCoords);
  }, [selectedDestination, destCoords]);

  // Sync coords when destination changes
  useEffect(() => {
    if (selectedDestination) {
      setDestCoords(getPakistanCoords(selectedDestination, [34.7994, 72.5725]));
    } else {
      setDestCoords(null);
    }
  }, [selectedDestination]);

  // Helper to select an origin and update coordinates
  const handleSelectOrigin = async (orig) => {
    setSelectedOrigin(orig);
    const coords = getPakistanCoords(orig, null);
    if (coords) {
      setOriginCoords(coords);
      setGpsStatusMessage(` Departure: ${orig} (${coords[0].toFixed(4)}° N, ${coords[1].toFixed(4)}° E)`);
    } else {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(orig)}&countrycodes=pk&limit=1`
        );
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          const foundLat = parseFloat(geoData[0].lat);
          const foundLon = parseFloat(geoData[0].lon);
          setOriginCoords([foundLat, foundLon]);
          setGpsStatusMessage(` Departure: ${orig} (${foundLat.toFixed(4)}° N, ${foundLon.toFixed(4)}° E)`);
          return;
        }
      } catch (_) {}
      setGpsStatusMessage(` Departure: ${orig}`);
    }
  };

  const handleOriginSearchSubmit = () => {
    if (!departureSearchText.trim()) return;
    handleSelectOrigin(departureSearchText.trim());
    setDepartureSearchText('');
  };

  // Highway Route Details & Road Block Advisory (Always guaranteed non-null fallback)
  const highwayDetails = useMemo(() => {
    return getHighwayRouteDetails(
      selectedOrigin || 'Current Location',
      selectedDestination || 'Destination',
      originCoords,
      destCoords
    );
  }, [selectedOrigin, selectedDestination, originCoords, destCoords]);

  const selectedRouteObj =
    routeType === 'motorway'
      ? (highwayDetails?.motorwayRoute || null)
      : (highwayDetails?.gtRoadRoute || null);

  // Live Journey Progression & Tracking Simulation
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isSimulatingDrive, setIsSimulatingDrive] = useState(false);

  // Dynamic stages along the route (Origin -> Highway -> Transit -> Final Destination)
  const journeyStages = useMemo(() => {
    if (!selectedDestination || !destCoords) return [];
    return getJourneyStages(selectedOrigin, selectedDestination, originCoords, destCoords);
  }, [selectedOrigin, selectedDestination, originCoords, destCoords]);

  const currentStage = (journeyStages && journeyStages.length > 0)
    ? (journeyStages[currentStageIndex] || journeyStages[0])
    : { locationName: selectedOrigin, coords: originCoords, isArrived: false, speed: '0 km/h', statusText: 'Live GPS location active' };

  // Reset stage when origin or destination changes
  useEffect(() => {
    setCurrentStageIndex(0);
    setIsSimulatingDrive(false);
  }, [selectedOrigin, selectedDestination]);

  // Live Drive Simulation Timer (advances along route checkpoints)
  useEffect(() => {
    let timer = null;
    if (isSimulatingDrive) {
      timer = setInterval(() => {
        setCurrentStageIndex((prev) => {
          if (prev < journeyStages.length - 1) {
            return prev + 1;
          } else {
            setIsSimulatingDrive(false);
            return prev;
          }
        });
      }, 4500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSimulatingDrive, journeyStages.length]);

  // Live GPS Location Detection with Nominatim reverse geocode & IP fallback
  const handleDetectGPS = () => {
    setIsDetectingGPS(true);
    setGpsStatusMessage('Detecting your live GPS position...');

    const applyCoords = async (lat, lon, fallbackCity = '') => {
      setOriginCoords([lat, lon]);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=en`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const json = await res.json();
        const addr = json.address || {};
        const specific =
          addr.neighbourhood ||
          addr.suburb ||
          addr.residential ||
          addr.hamlet ||
          addr.village ||
          addr.town ||
          addr.road ||
          addr.city_district;
        const city = addr.city || addr.town || addr.county || addr.state_district || '';
        let detected = '';
        if (specific && city && !specific.toLowerCase().includes(city.toLowerCase())) {
          detected = `${specific}, ${city}`;
        } else if (specific) {
          detected = specific;
        } else if (city) {
          detected = city;
        } else {
          detected = fallbackCity || `Current Location (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)`;
        }

        setSelectedOrigin(detected);
        setGpsStatusMessage(` Live GPS Detected: ${detected} (${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E)`);
        setIsDetectingGPS(false);
      } catch (e) {
        const fallbackName = fallbackCity || `Current Location (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)`;
        setSelectedOrigin(fallbackName);
        setGpsStatusMessage(` Live GPS Detected: ${fallbackName} (${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E)`);
        setIsDetectingGPS(false);
      }
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          applyCoords(pos.coords.latitude, pos.coords.longitude);
        },
        async (err) => {
          console.warn('GPS browser error, trying IP geolocation fallback:', err);
          try {
            const ipRes = await fetch('https://ipwho.is/');
            const ipData = await ipRes.json();
            if (ipData.success && ipData.latitude && ipData.longitude) {
              await applyCoords(ipData.latitude, ipData.longitude, ipData.city);
              return;
            }
          } catch (_) {}

          try {
            const ipRes2 = await fetch('https://get.geojs.io/v1/ip/geo.json');
            const ipData2 = await ipRes2.json();
            if (ipData2.latitude && ipData2.longitude) {
              await applyCoords(parseFloat(ipData2.latitude), parseFloat(ipData2.longitude), ipData2.city);
              return;
            }
          } catch (_) {}

          setSelectedOrigin('Current Location');
          setOriginCoords([33.7667, 72.3667]);
          setGpsStatusMessage(' GPS unavailable. Select your departure city below.');
          setIsDetectingGPS(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      (async () => {
        try {
          const ipRes = await fetch('https://ipwho.is/');
          const ipData = await ipRes.json();
          if (ipData.success && ipData.latitude && ipData.longitude) {
            await applyCoords(ipData.latitude, ipData.longitude, ipData.city);
            return;
          }
        } catch (_) {}

        setSelectedOrigin('Current Location');
        setOriginCoords([33.7667, 72.3667]);
        setGpsStatusMessage(' Select your departure city below.');
        setIsDetectingGPS(false);
      })();
    }
  };

  // Auto-detect live GPS location on component mount
  useEffect(() => {
    handleDetectGPS();
  }, []);

  const handleSelectDestination = (dest) => {
    setSelectedDestination(dest);
    setDestCoords(getPakistanCoords(dest, [34.7994, 72.5725]));
    setCustomDestinationInput('');

    // Check if any saved trip matches this destination
    const matchedTrip = trips.find(
      (t) => t.destination.toLowerCase() === dest.toLowerCase()
    );
    if (matchedTrip) {
      openTrip(matchedTrip);
    }
  };

  const handleCustomDestinationSubmit = () => {
    if (!customDestinationInput.trim()) return;
    const dest = customDestinationInput.trim();
    setSelectedDestination(dest);
    setDestCoords(getPakistanCoords(dest, [34.7994, 72.5725]));
  };

  function handleGoBack() {
    if (matchedTrip) {
      openTrip(matchedTrip);
      navigateRoot('Itinerary', { trip: matchedTrip });
    } else {
      navigation.navigate('TripPlanning', { preselectedDestination: selectedDestination });
    }
  }

  async function openGoogleMapsDirections() {
    const origin = `${originCoords[0]},${originCoords[1]}`;
    const destination = `${destCoords[0]},${destCoords[1]}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    track('open_details', { tripId: currentTrip?._id, itemType: 'route', itemId: String(selectedDestination || 'destination') });
    await Linking.openURL(url);
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
            <Text style={styles.headerTitle}>Live GPS & Route Map</Text>
            <Text style={styles.headerSubtitle}>
              {hasRoute
                ? ` ${selectedOrigin} -> ${selectedDestination} | Real-Time Highway Navigation`
                : ` ${selectedOrigin}, Live GPS Location & Street View`}
            </Text>
          </View>

          {/* TOP NAVIGATION / SHORTCUT STRIP */}
          <View style={styles.topBackStrip}>
            {hasItinerary ? (
              <TouchableOpacity
                style={styles.backToItineraryBigBtn}
                onPress={handleGoBack}
                activeOpacity={0.8}
              >
                <AppIcon name="arrow-back" size={17} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.backToItineraryBigText}>
                  Back to {selectedDestination} Itinerary (Day Plan)
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.backToItineraryBigBtn, { backgroundColor: '#0F766E' }]}
                onPress={() => navigation.navigate('TripPlanning', { preselectedDestination: selectedDestination || undefined })}
                activeOpacity={0.8}
              >
                <AppIcon name="arrow-back" size={17} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.backToItineraryBigText}>
                  {selectedDestination ? `Back to ${selectedDestination} Trip Plan` : 'Plan a Custom Trip'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.detectGpsBtn}
              onPress={handleDetectGPS}
              disabled={isDetectingGPS}
            >
              {isDetectingGPS ? (
                <ActivityIndicator size="small" color="#0F766E" />
              ) : (
                <AppIcon name="locate" size={16} color="#0F766E" />
              )}
              <Text style={styles.detectGpsBtnText}>
                {isDetectingGPS ? 'Detecting...' : ' My Live GPS'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* GPS LIVE STATUS BADGE */}
          {gpsStatusMessage ? (
            <View style={styles.gpsStatusBar}>
              <AppIcon name="navigate-circle" size={16} color="#0F766E" />
              <Text style={styles.gpsStatusBarText}>{gpsStatusMessage}</Text>
            </View>
          ) : null}

          <ScrollView contentContainerStyle={styles.mainScroll} showsVerticalScrollIndicator={true}>
        {/* 1. DESTINATION SELECTOR & CATEGORY TABS (Any Destination across Pakistan) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <AppIcon name="map-outline" size={18} color={colors.forest} />
            <Text style={styles.sectionTitle}>Select Any Destination in Pakistan</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Choose by category or search any city to view live highway route & GPS navigation:
          </Text>

          {/* Destination Category Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {CATEGORY_TABS.map((cat) => {
              const active = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={[styles.catTab, active && styles.catTabActive]}
                >
                  <Text style={[styles.catTabText, active && styles.catTabTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Quick Destination Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {availableDestinations.map((dest) => {
              const active = Boolean(selectedDestination && selectedDestination.toLowerCase() === dest.toLowerCase());
              return (
                <TouchableOpacity
                  key={dest}
                  onPress={() => handleSelectDestination(dest)}
                  style={[styles.destChip, active && styles.destChipActive]}
                >
                  <Text style={[styles.destChipText, active && styles.destChipTextActive]}>
                    {dest}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Custom Search Input */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search destination city in Pakistan (e.g. Lahore, Malam Jabba, Skardu, Karachi)..."
              placeholderTextColor="#94a3b8"
              value={customDestinationInput}
              onChangeText={setCustomDestinationInput}
              onSubmitEditing={handleCustomDestinationSubmit}
            />
            {customDestinationInput.trim().length > 0 ? (
              <TouchableOpacity onPress={() => setCustomDestinationInput('')} style={{ padding: 6, marginRight: 6 }}>
                <AppIcon name="close-circle" size={17} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={handleCustomDestinationSubmit}
            >
              <Text style={styles.searchBtnText}>Show Route</Text>
            </TouchableOpacity>
          </View>

          {/* Live Matching Destination Suggestions Chips */}
          {customDestinationInput.trim().length > 0 && (
            <View style={styles.originSuggestionsBox}>
              <Text style={styles.originSuggestionsLabel}>
                Matching Destination Cities ({filteredDestinationCities.length}):
              </Text>
              {filteredDestinationCities.length > 0 ? (
                <View style={styles.originSuggestionsGrid}>
                  {filteredDestinationCities.slice(0, 16).map((city) => {
                    const active = Boolean(selectedDestination && selectedDestination.toLowerCase() === city.toLowerCase());
                    return (
                      <TouchableOpacity
                        key={city}
                        onPress={() => {
                          handleSelectDestination(city);
                          setCustomDestinationInput('');
                        }}
                        style={[styles.originSuggestChip, active && styles.originSuggestChipActive]}
                      >
                        <AppIcon
                          name="location-sharp"
                          size={12}
                          color={active ? '#ffffff' : '#15803d'}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.originSuggestText, active && styles.originSuggestTextActive]}>
                          {city}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.useCustomOriginBtn}
                  onPress={handleCustomDestinationSubmit}
                >
                  <Text style={styles.useCustomOriginBtnText}>
                     Route to "{customDestinationInput.trim()}" ->
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Clear Route Button: Allows returning to live GPS view without route */}
          {hasRoute && (
            <TouchableOpacity
              style={styles.clearRouteBtn}
              onPress={() => {
                setSelectedDestination('');
                setDestCoords(null);
                setCustomDestinationInput('');
              }}
            >
              <AppIcon name="close-circle-outline" size={15} color="#dc2626" style={{ marginRight: 4 }} />
              <Text style={styles.clearRouteBtnText}>Clear Route (View My Location Only)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 2. STARTING LOCATION & TRANSIT CORRIDOR (Where You Start & Route to Take) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <AppIcon name="navigate-outline" size={18} color={colors.forest} />
            <Text style={styles.sectionTitle}>Starting Location & Highway Transit Route</Text>
          </View>

          {/* Route Corridor Visual Banner (Shown only when destination is active) */}
          {hasRoute && selectedRouteObj ? (
            <>
              <View style={styles.journeyCorridorBanner}>
                <View style={styles.corridorStep}>
                  <Text style={styles.corridorStepLabel}> STARTING FROM</Text>
                  <Text style={styles.corridorStepValue}>{selectedOrigin}</Text>
                </View>
                <View style={styles.corridorArrow}>
                  <AppIcon name="arrow-forward" size={16} color="#15803d" />
                </View>
                <View style={styles.corridorStep}>
                  <Text style={styles.corridorStepLabel}> ROUTE TO TAKE</Text>
                  <Text style={styles.corridorStepHighway}>
                    {selectedRouteObj.badge}
                  </Text>
                </View>
                <View style={styles.corridorArrow}>
                  <AppIcon name="arrow-forward" size={16} color="#15803d" />
                </View>
                <View style={styles.corridorStep}>
                  <Text style={styles.corridorStepLabel}> DESTINATION</Text>
                  <Text style={styles.corridorStepDest}>{selectedDestination}</Text>
                </View>
              </View>

              {/* Direct Natural Urdu/English Journey Statement */}
              <View style={styles.routeCorridorDetailedBox}>
                <AppIcon name="information-circle" size={16} color="#15803d" style={{ marginTop: 1 }} />
                <Text style={styles.routeCorridorDetailedText}>
                  Hum <Text style={{ fontWeight: 'bold' }}>{selectedOrigin}</Text> se safar shuru kar rahe hain, aur <Text style={{ fontWeight: 'bold' }}>{selectedRouteObj.highways?.join(' -> ') || selectedRouteObj.badge}</Text> ke raste se hote hue <Text style={{ fontWeight: 'bold', color: '#15803d' }}>{selectedDestination}</Text> pohnchain ge.
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.liveLocationOnlyBanner}>
              <AppIcon name="navigate-circle" size={18} color="#15803d" style={{ marginRight: 6 }} />
              <Text style={styles.liveLocationOnlyText}>
                 Real-time departure origin: <Text style={{ fontWeight: 'bold' }}>{selectedOrigin}</Text>. Upar search bar ya chips se destination select karein taake highway route aur road blockage alerts show hon.
              </Text>
            </View>
          )}

          {/* SEARCH FOR ANY DEPARTURE CITY IN PAKISTAN */}
          <Text style={[styles.pickerSubLabel, { marginTop: 12 }]}>Search or change departure city in Pakistan:</Text>
          <View style={styles.originSearchWrap}>
            <View style={styles.originSearchRow}>
              <AppIcon name="search-outline" size={17} color="#64748b" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.originSearchTextInput}
                placeholder="Search departure city/town anywhere in Pakistan (e.g. Faisalabad, Gujrat, Abbottabad)..."
                placeholderTextColor="#94a3b8"
                value={departureSearchText}
                onChangeText={setDepartureSearchText}
                onSubmitEditing={handleOriginSearchSubmit}
              />
              {departureSearchText.trim().length > 0 ? (
                <TouchableOpacity onPress={() => setDepartureSearchText('')} style={{ padding: 4 }}>
                  <AppIcon name="close-circle" size={17} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.originSearchGoBtn}
                onPress={handleOriginSearchSubmit}
              >
                <Text style={styles.originSearchGoBtnText}>Select</Text>
              </TouchableOpacity>
            </View>

            {/* Live Filtered Suggestions Dropdown Grid */}
            {departureSearchText.trim().length > 0 && (
              <View style={styles.originSuggestionsBox}>
                <Text style={styles.originSuggestionsLabel}>
                  Matching Cities ({filteredDepartureCities.length}):
                </Text>
                {filteredDepartureCities.length > 0 ? (
                  <View style={styles.originSuggestionsGrid}>
                    {filteredDepartureCities.slice(0, 16).map((city) => {
                      const active = selectedOrigin.toLowerCase().includes(city.toLowerCase());
                      return (
                        <TouchableOpacity
                          key={city}
                          onPress={() => {
                            handleSelectOrigin(city);
                            setDepartureSearchText('');
                          }}
                          style={[styles.originSuggestChip, active && styles.originSuggestChipActive]}
                        >
                          <AppIcon
                            name="location-sharp"
                            size={12}
                            color={active ? '#ffffff' : '#15803d'}
                            style={{ marginRight: 4 }}
                          />
                          <Text style={[styles.originSuggestText, active && styles.originSuggestTextActive]}>
                            {city}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.useCustomOriginBtn}
                    onPress={handleOriginSearchSubmit}
                  >
                    <Text style={styles.useCustomOriginBtnText}>
                       Use "{departureSearchText.trim()}" as departure location ->
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Quick Popular Origin selector chips */}
          <Text style={[styles.pickerSubLabel, { marginTop: 8 }]}>Popular departure cities:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
            {POPULAR_MAP_ORIGINS.map((orig) => {
              const active = selectedOrigin.toLowerCase().includes(orig.toLowerCase());
              return (
                <TouchableOpacity
                  key={orig}
                  onPress={() => handleSelectOrigin(orig)}
                  style={[styles.origChip, active && styles.origChipActive]}
                >
                  <Text style={[styles.origChipText, active && styles.origChipTextActive]}>
                    {orig}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. ROUTE COMPARISON SELECTOR: SHORTEST MOTORWAY VS GT ROAD (Only when destination is active) */}
        {hasRoute && (
          <View style={styles.routeSelectorRow}>
            <TouchableOpacity
              style={[styles.routeTypeCard, routeType === 'motorway' && styles.routeTypeCardActiveMotorway]}
              onPress={() => setRouteType('motorway')}
            >
              <View style={styles.routeTypeHeader}>
                <Text style={[styles.routeTypeBadge, routeType === 'motorway' && styles.routeTypeBadgeActive]}>
                  SHORTEST ROUTE 
                </Text>
                <AppIcon
                  name="speedometer"
                  size={18}
                  color={routeType === 'motorway' ? '#15803d' : '#64748b'}
                />
              </View>
              <Text style={styles.routeTypeTitle}>{highwayDetails?.motorwayRoute?.name || 'Shortest Motorway Route'}</Text>
              <Text style={styles.routeTypeHighway}>{highwayDetails?.motorwayRoute?.badge || 'Motorway Express'}</Text>
              <Text style={styles.routeTypeDesc}>{highwayDetails?.motorwayRoute?.desc || ''}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.routeTypeCard, routeType === 'gt_road' && styles.routeTypeCardActiveGt]}
              onPress={() => setRouteType('gt_road')}
            >
              <View style={styles.routeTypeHeader}>
                <Text style={[styles.routeTypeBadgeGt, routeType === 'gt_road' && styles.routeTypeBadgeGtActive]}>
                  HISTORIC GT ROAD 
                </Text>
                <AppIcon
                  name="car"
                  size={18}
                  color={routeType === 'gt_road' ? '#2563eb' : '#64748b'}
                />
              </View>
              <Text style={styles.routeTypeTitle}>{highwayDetails?.gtRoadRoute?.name || 'Alternative Highway Route'}</Text>
              <Text style={styles.routeTypeHighwayGt}>{highwayDetails?.gtRoadRoute?.badge || 'GT Road / National Highway'}</Text>
              <Text style={styles.routeTypeDesc}>{highwayDetails?.gtRoadRoute?.desc || ''}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* LIVE ROAD BLOCK / HAZARD WARNING CARD (Only when destination is active and route has hazard) */}
        {hasRoute && highwayDetails?.roadBlock?.hasBlock && (
          <View style={styles.roadBlockAlertCard}>
            <View style={styles.roadBlockHeader}>
              <View style={styles.redSignBadge}>
                <Text style={styles.redSignText}>  SPEED SLOW KAREIN — ROAD BLOCK & HAZARD</Text>
              </View>
              <View style={styles.delayBadge}>
                <AppIcon name="time" size={13} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.delayText}>+{highwayDetails?.roadBlock?.delayMins || 15} min delay</Text>
              </View>
            </View>

            <Text style={styles.roadBlockLocation}>
               Location: {highwayDetails?.roadBlock?.locationName || 'Approaching Highway Corridor'}
            </Text>

            {/* Speed Slow Warning */}
            <View style={styles.speedWarningBox}>
              <AppIcon name="speedometer" size={16} color="#b91c1c" />
              <Text style={styles.speedWarningText}>
                <Text style={{ fontWeight: 'bold' }}>Caution: </Text>
                {highwayDetails?.roadBlock?.speedWarning || 'Speed slow karein! Aagay road block aur high traffic jam hai (Speed limit 35 km/h).'}
              </Text>
            </View>

            {/* Road Construction Work / One-Way Notice */}
            <View style={styles.constructionNoticeBox}>
              <AppIcon name="construct" size={16} color="#b45309" />
              <Text style={styles.constructionNoticeText}>
                <Text style={{ fontWeight: 'bold' }}>Road Construction Work: </Text>
                {highwayDetails?.roadBlock?.constructionNotice || 'Sadak ki construction / repair chal rahi hai: Two-way road ab single one-way lane mein convert ho gayi hai aur gariyan aik hi lane se aa jaa rahi hain.'}
              </Text>
            </View>

            {highwayDetails?.roadBlock?.detourAdvice && (
              <View style={styles.detourBox}>
                <AppIcon name="checkmark-circle" size={14} color="#15803d" />
                <Text style={styles.detourText}>
                  <Text style={{ fontWeight: 'bold' }}>Recommended Detour: </Text>
                  {highwayDetails.roadBlock.detourAdvice}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* LIVE JOURNEY TRACKING & PROGRESSION CHECKPOINTS (Only when destination is active) */}
        {hasRoute && journeyStages.length > 0 && (
          <View style={styles.journeyTrackerCard}>
            <View style={styles.journeyTrackerHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <AppIcon name="navigate" size={16} color={colors.forest} />
                <Text style={styles.journeyTrackerTitle}>Live Journey Progress & Checkpoints</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[
                    styles.driveSimulateBtn,
                    isSimulatingDrive && styles.driveSimulateBtnActive,
                  ]}
                  onPress={() => setIsSimulatingDrive(!isSimulatingDrive)}
                >
                  <AppIcon
                    name={isSimulatingDrive ? 'pause' : 'play'}
                    size={14}
                    color="#ffffff"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.driveSimulateBtnText}>
                    {isSimulatingDrive ? 'Pause Drive' : 'Drive Mode'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resetJourneyBtn}
                  onPress={() => {
                    setIsSimulatingDrive(false);
                    setCurrentStageIndex(0);
                  }}
                >
                  <AppIcon name="refresh" size={13} color="#475569" />
                  <Text style={styles.resetJourneyBtnText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 4 Interactive Checkpoint Stage Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {journeyStages.map((stg, sIdx) => {
                const isActive = currentStageIndex === sIdx;
                const isPast = currentStageIndex > sIdx;
                return (
                  <TouchableOpacity
                    key={stg.index}
                    onPress={() => {
                      setIsSimulatingDrive(false);
                      setCurrentStageIndex(sIdx);
                    }}
                    style={[
                      styles.stageTab,
                      isActive && styles.stageTabActive,
                      isPast && styles.stageTabPast,
                      stg.isArrived && isActive && styles.stageTabArrived,
                    ]}
                  >
                    <AppIcon
                      name={stg.icon}
                      size={14}
                      color={isActive ? '#ffffff' : isPast ? '#15803d' : '#64748b'}
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      style={[
                        styles.stageTabText,
                        isActive && styles.stageTabTextActive,
                        isPast && styles.stageTabTextPast,
                      ]}
                    >
                      {stg.title}
                    </Text>
                    {isPast && <Text style={{ color: '#15803d', marginLeft: 4, fontWeight: 'bold' }}>[Included]</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Active Situation / Arrival Banner */}
            {currentStage.isArrived ? (
              <View style={styles.arrivalCelebrationBox}>
                <View style={styles.arrivalHeaderRow}>
                  <Text style={styles.arrivalTitle}> YOU HAVE REACHED THE FINAL DESTINATION!</Text>
                  <View style={styles.arrivalPill}>
                    <Text style={styles.arrivalPillText}>ARRIVED 100%</Text>
                  </View>
                </View>
                <Text style={styles.arrivalSubtitle}>
                  You have arrived safely at <Text style={{ fontWeight: 'bold' }}>{selectedDestination}</Text>! Total journey from <Text style={{ fontWeight: 'bold' }}>{selectedOrigin}</Text> is complete.
                </Text>
              </View>
            ) : (
              <View style={styles.activeSituationBox}>
                <View style={styles.situationHeaderRow}>
                  <View style={styles.vehicleLivePill}>
                    <Text style={styles.vehicleLivePillText}> VEHICLE TRACKING</Text>
                  </View>
                  <Text style={styles.situationSpeedText}> Speed: {currentStage.speed}</Text>
                </View>
                <Text style={styles.situationLocation}>
                  Current Situation: <Text style={{ fontWeight: 'bold', color: colors.forest }}>{currentStage.locationName}</Text>
                </Text>
                <Text style={styles.situationStatus}>
                  {currentStage.statusText}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ITINERARY ROUTE BANNER WITH ONE-CLICK ACCESS TO FULL ITINERARY */}
        <View style={styles.itineraryRedirectBanner}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={styles.livePulseDotGreen} />
              <Text style={styles.itineraryRedirectTag}>ACTIVE GENERATED ITINERARY ROUTE</Text>
            </View>
            <Text style={styles.itineraryRedirectTitle}>
              {selectedOrigin} -> {selectedDestination}
            </Text>
            <Text style={styles.itineraryRedirectSub}>
              Live GPS driving route and turn-by-turn navigation to {selectedDestination}.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewItineraryBtn}
            onPress={() => {
              const tripToOpen = matchedTrip || currentTrip || (trips && trips.length > 0 ? trips[0] : null);
              if (tripToOpen) {
                if (openTrip) openTrip(tripToOpen);
                navigation.navigate('Itinerary', { trip: tripToOpen });
              } else {
                navigation.navigate('TripPlanning');
              }
            }}
          >
            <AppIcon name="calendar" size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.viewItineraryBtnText}>View Itinerary -></Text>
          </TouchableOpacity>
        </View>

        {/* INTERACTIVE MAP CONTAINER */}
        <View style={[styles.mapWrapper, desktop && styles.desktopLayout]}>
          <View style={[styles.mapContainer, { height: mapHeight }, desktop && styles.desktopMapContainer]}>
            <JourneyRouteMap
              originName={selectedOrigin || 'My Location'}
              originCoords={originCoords}
              destinationName={selectedDestination || 'Destination'}
              destCoords={destCoords || [34.7994, 72.5725]}
              height={mapHeight}
            />
          </View>

          {/* GPS NAVIGATION SIDEBAR / SUMMARY */}
          <View style={[styles.navigationSidebar, desktop && styles.desktopSidebar]}>
            <View style={styles.sidebarHeader}>
              <AppIcon name="compass" size={20} color={colors.forest} />
              <Text style={styles.sidebarTitle}>GPS Highway Navigation Details</Text>
            </View>

            {hasRoute ? (
              <>
                {/* Highway badges */}
                <View style={styles.highwayBadgesRow}>
                  <View style={styles.motorwayPill}>
                    <Text style={styles.motorwayPillText}>
                       Motorway: {highwayDetails?.motorwayRoute?.badge || 'Motorway Express (120 km/h)'}
                    </Text>
                  </View>
                  <View style={styles.gtRoadPill}>
                    <Text style={styles.gtRoadPillText}>
                       GT Road: {highwayDetails?.gtRoadRoute?.badge || 'National Highway (GT Road)'}
                    </Text>
                  </View>
                </View>

                {/* Step-by-Step GPS Directions */}
                <Text style={styles.stepsTitle}>Turn-by-Turn GPS Highway Steps:</Text>
                <View style={styles.stepsList}>
                  {(highwayDetails?.turnByTurn || []).map((s, idx) => (
                    <View key={idx} style={[styles.stepItem, s.isDelay && styles.stepItemDelay]}>
                      <View style={[styles.stepDot, s.isDelay && styles.stepDotDelay]}>
                        <Text style={[styles.stepDotNum, s.isDelay && styles.stepDotNumDelay]}>
                          {s.isDelay ? '!' : s.step}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.stepText, s.isDelay && styles.stepTextDelay]}>
                          {s.text}
                        </Text>
                        {s.highway && (
                          <Text style={styles.stepHighwayTag}>Highway: {s.highway}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>

                {/* Authentic Scenic Stops for the Selected Destination */}
                {destinationScenicStops && destinationScenicStops.length > 0 && (
                  <View style={{ marginTop: 14 }}>
                    <Text style={styles.stepsTitle}>
                      Key Landmarks & Scenic Stops in {selectedDestination} ({destinationScenicStops.length}):
                    </Text>
                    {destinationScenicStops.map((stop, index) => (
                      <View key={`${stop.place}-${index}`} style={styles.activityStopRow}>
                        <Text style={styles.activityStopNum}>{index + 1}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.activityStopPlace}>{stop.place}</Text>
                          <Text style={styles.activityStopTime}>{stop.time}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={styles.openDirectionsBtn}
                    onPress={openGoogleMapsDirections}
                  >
                    <AppIcon name="navigate" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.openDirectionsText}>OPEN IN GOOGLE MAPS</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.sidebarEmptyBox}>
                <AppIcon name="compass-outline" size={38} color="#15803d" style={{ marginBottom: 8 }} />
                <Text style={styles.sidebarEmptyTitle}>GPS Highway Navigation Details</Text>
                <Text style={styles.sidebarEmptyDesc}>
                  Aap ki live GPS location map par load hai. Upar search bar ya chips se koi bhi city select karein:
                </Text>
                <View style={styles.sidebarEmptyPoints}>
                  <Text style={styles.sidebarEmptyPoint}> Shortest Motorway & GT Road routes show hon ge</Text>
                  <Text style={styles.sidebarEmptyPoint}> Road construction, blockages aur one-way diversions show hon gi</Text>
                  <Text style={styles.sidebarEmptyPoint}> Turn-by-turn driving steps aur key landmarks show hon ge</Text>
                </View>
                <TouchableOpacity
                  style={styles.sidebarPlanTripBtn}
                  onPress={() => navigation.navigate('TripPlanning')}
                >
                  <AppIcon name="paper-plane" size={15} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.sidebarPlanTripBtnText}>Plan a Trip with Full Itinerary -></Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
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
  mainScroll: { padding: 14, paddingBottom: 60, maxWidth: 1200, width: '100%', alignSelf: 'center' },

  scenicHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
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

  topBackStrip: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    marginBottom: 6,
  },
  itineraryRedirectBanner: {
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#86efac',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  livePulseDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  itineraryRedirectTag: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#15803d',
    letterSpacing: 0.5,
  },
  itineraryRedirectTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#0f172a',
    marginTop: 2,
  },
  itineraryRedirectSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  viewItineraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.forest,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  viewItineraryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: fonts.bold,
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
    elevation: 3,
    shadowColor: '#072517',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backToItineraryBigText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  detectGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#DCECE5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  detectGpsBtnText: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: '800',
  },

  gpsStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E6F7EE',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCECE5',
    maxWidth: 1168,
    width: '92%',
    alignSelf: 'center',
  },
  gpsStatusBarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },

  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DCECE5',
    shadowColor: '#072517',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(8px)' } : {}),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontSize: 11.5,
    color: '#4B5563',
    marginTop: 2,
  },

  catTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCECE5',
    marginRight: 6,
  },
  catTabActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  catTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
  },
  catTabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },

  journeyCorridorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E6F7EE',
    borderWidth: 1,
    borderColor: '#DCECE5',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  corridorStep: {
    flex: 1,
    alignItems: 'center',
  },
  corridorStepLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0F766E',
    letterSpacing: 0.5,
  },
  corridorStepValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 2,
    textAlign: 'center',
  },
  corridorStepHighway: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
    marginTop: 2,
    textAlign: 'center',
  },
  corridorStepDest: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
    marginTop: 2,
    textAlign: 'center',
  },
  corridorArrow: {
    paddingHorizontal: 4,
  },
  routeCorridorDetailedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#E6F7EE',
    borderWidth: 1,
    borderColor: '#DCECE5',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  routeCorridorDetailedText: {
    fontSize: 11,
    color: '#1F2937',
    lineHeight: 16,
    flex: 1,
  },

  destChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCECE5',
    marginRight: 8,
  },
  destChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  destChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
  },
  destChipTextActive: {
    color: '#ffffff',
  },

  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCECE5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#1F2937',
  },
  searchBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 10,
  },
  searchBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },

  originSearchWrap: {
    marginTop: 6,
    marginBottom: 8,
  },
  originSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCECE5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  originSearchTextInput: {
    flex: 1,
    fontSize: 12,
    color: '#1F2937',
    paddingVertical: 5,
  },
  originSearchGoBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    marginLeft: 6,
  },
  originSearchGoBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  originSuggestionsBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCECE5',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  originSuggestionsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  originSuggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  originSuggestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7EE',
    borderWidth: 1,
    borderColor: '#DCECE5',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  originSuggestChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  originSuggestText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  originSuggestTextActive: {
    color: '#ffffff',
  },
  useCustomOriginBtn: {
    backgroundColor: '#E6F7EE',
    borderWidth: 1,
    borderColor: '#DCECE5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  useCustomOriginBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },

  origChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCECE5',
    marginRight: 6,
  },
  origChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  origChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
  },
  origChipTextActive: {
    color: '#ffffff',
  },

  savedTripsBar: {
    backgroundColor: '#E6F7EE',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DCECE5',
  },
  savedTripsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  savedTripsLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  savedTripsSubLabel: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  tripChip: {
    minWidth: 120,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  tripChipOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  tripName: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  tripNameOn: { color: '#ffffff' },
  activeDotBadge: { backgroundColor: '#22c55e', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 },
  activeDotText: { color: '#ffffff', fontSize: 8, fontWeight: '900' },
  deleteChipBtn: { padding: 2 },
  tripDays: { color: colors.muted, fontSize: 10, fontWeight: '600', marginTop: 3 },
  tripDaysOn: { color: '#bbf7d0' },

  routeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  routeTypeCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    ...shadow,
  },
  routeTypeCardActiveMotorway: {
    borderColor: '#15803d',
    backgroundColor: '#f0fdf4',
  },
  routeTypeCardActiveGt: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  routeTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  routeTypeBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: '#15803d',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  routeTypeBadgeActive: {
    backgroundColor: '#15803d',
    color: '#ffffff',
  },
  routeTypeBadgeGt: {
    fontSize: 9,
    fontWeight: '900',
    color: '#2563eb',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  routeTypeBadgeGtActive: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
  },
  routeTypeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 2,
  },
  routeTypeHighway: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
    marginTop: 2,
  },
  routeTypeHighwayGt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
    marginTop: 2,
  },
  routeTypeDesc: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 4,
    lineHeight: 14,
  },

  roadBlockAlertCard: {
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    ...shadow,
  },
  roadBlockHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 6,
  },
  redSignBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 1,
  },
  redSignText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  delayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#991b1b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  delayText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 10,
  },
  roadBlockLocation: {
    fontSize: 12,
    fontWeight: '800',
    color: '#991b1b',
    marginBottom: 2,
  },
  roadBlockReason: {
    fontSize: 11,
    color: '#7f1d1d',
    lineHeight: 15,
  },
  speedWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    borderLeftWidth: 3,
    borderLeftColor: '#dc2626',
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  speedWarningText: {
    fontSize: 11,
    color: '#991b1b',
    fontWeight: '700',
    flex: 1,
    lineHeight: 15,
  },
  constructionNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    borderLeftWidth: 3,
    borderLeftColor: '#d97706',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  constructionNoticeText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },
  detourBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  detourText: {
    fontSize: 11,
    color: '#166534',
    flex: 1,
  },

  journeyTrackerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadow,
  },
  journeyTrackerHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  journeyTrackerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
    flexShrink: 1,
  },
  driveSimulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803d',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  driveSimulateBtnActive: {
    backgroundColor: '#d97706',
  },
  driveSimulateBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
  },
  resetJourneyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  resetJourneyBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 11,
  },
  stageTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 6,
  },
  stageTabActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  stageTabPast: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  stageTabArrived: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
  },
  stageTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  stageTabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  stageTabTextPast: {
    color: '#15803d',
    fontWeight: '700',
  },
  arrivalCelebrationBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  arrivalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  arrivalTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#15803d',
    flex: 1,
  },
  arrivalPill: {
    backgroundColor: '#15803d',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  arrivalPillText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 9,
  },
  arrivalSubtitle: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 16,
  },
  activeSituationBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  situationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  vehicleLivePill: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  vehicleLivePillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  situationSpeedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369a1',
  },
  situationLocation: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 2,
  },
  situationStatus: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    lineHeight: 15,
  },

  mapWrapper: {
    gap: 12,
  },
  desktopLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mapContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCECE5',
    ...shadow,
  },
  desktopMapContainer: {
    flex: 1.35,
  },
  navigationSidebar: {
    flex: 0.9,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCECE5',
    ...shadow,
  },
  desktopSidebar: {
    minWidth: 320,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sidebarTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },

  highwayBadgesRow: {
    flexDirection: 'column',
    gap: 6,
    marginBottom: 12,
  },
  motorwayPill: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  motorwayPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  gtRoadPill: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  gtRoadPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },

  stepsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 6,
  },
  stepsList: {
    gap: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  stepItemDelay: {
    backgroundColor: '#fef2f2',
    padding: 6,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDelay: {
    backgroundColor: '#dc2626',
    borderColor: '#b91c1c',
  },
  stepDotNum: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  stepDotNumDelay: {
    color: '#ffffff',
  },
  stepText: {
    fontSize: 11,
    color: colors.ink,
    fontWeight: '600',
    lineHeight: 15,
  },
  stepTextDelay: {
    color: '#991b1b',
    fontWeight: '800',
  },
  stepHighwayTag: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '600',
    marginTop: 2,
  },

  activityStopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  activityStopNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.mint,
    color: colors.forest,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
  },
  activityStopPlace: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
  },
  activityStopTime: {
    fontSize: 10,
    color: colors.muted,
  },

  actionButtonsRow: {
    marginTop: 14,
  },
  openDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    paddingVertical: 12,
    borderRadius: 12,
  },
  openDirectionsText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
  },

  clearRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 10,
  },
  clearRouteBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#b91c1c',
  },
  liveLocationOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7EE',
    borderWidth: 1,
    borderColor: '#DCECE5',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  liveLocationOnlyText: {
    fontSize: 11.5,
    color: '#1F2937',
    lineHeight: 16,
    flex: 1,
  },
  sidebarEmptyBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    textAlign: 'center',
  },
  sidebarEmptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  sidebarEmptyDesc: {
    fontSize: 11.5,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 10,
  },
  sidebarEmptyPoints: {
    width: '100%',
    backgroundColor: '#E6F7EE',
    borderWidth: 1,
    borderColor: '#DCECE5',
    borderRadius: 8,
    padding: 10,
    gap: 6,
    marginBottom: 12,
  },
  sidebarEmptyPoint: {
    fontSize: 11,
    color: '#1F2937',
    lineHeight: 15,
  },
  sidebarPlanTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    width: '100%',
  },
  sidebarPlanTripBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11.5,
  },
});
