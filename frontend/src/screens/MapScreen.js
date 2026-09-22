import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, ScrollView, StyleSheet, Pressable as TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScreenHeader from '../components/ScreenHeader';
import EmptyTrip from '../components/EmptyTrip';
import { useApp } from '../context/AppContext';
import { colors, shadow } from '../theme';
import OpenStreetMap from '../components/OpenStreetMap';
import Text from '../components/AppText';

function hasImplausibleCoordinates(routeDay) {
  return Number(routeDay?.distanceMeters || 0) > 600000 || (routeDay?.activities || []).some((activity) => (
    Number.isFinite(activity.latitude) && Number.isFinite(activity.longitude)
    && (activity.latitude < 23.4 || activity.latitude > 37.2 || activity.longitude < 60.8 || activity.longitude > 77.9)
  ));
}

export default function MapScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 950;
  const mapHeight = desktop ? 440 : 300;
  const { currentTrip, trips, tripsLoading, openTrip, refreshTrips, refreshTripRoute, track } = useApp();
  const routeDays = currentTrip?.route?.days || [];
  const routeNeedsRepair = routeDays.some(hasImplausibleCoordinates);
  const [day, setDay] = useState(routeDays[0]?.day || 1);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');

  useEffect(() => navigation.addListener('focus', () => {
    refreshTrips().catch(() => {});
  }), [navigation]);

  useEffect(() => {
    setDay(routeDays[0]?.day || 1);
    setRouteError('');
  }, [currentTrip?._id]);

  async function loadMissingRoute(force = false) {
    if (!currentTrip?._id || (routeDays.length && !force) || !currentTrip.itinerary?.length) return;
    setRouteLoading(true);
    setRouteError('');
    try {
      await refreshTripRoute();
    } catch (error) {
      setRouteError(error.message || 'Could not rebuild this saved route.');
    } finally {
      setRouteLoading(false);
    }
  }

  useEffect(() => { loadMissingRoute(routeNeedsRepair); }, [currentTrip?._id, routeDays.length, routeNeedsRepair]);

  if (!currentTrip) return (
    <View style={styles.page}>
      <ScreenHeader title="Route map" subtitle="Your saved itinerary routes" />
      {tripsLoading ? <ActivityIndicator color={colors.forest} style={styles.loader} /> : <EmptyTrip message="Create a trip first. Saved trips will automatically return here whenever you sign in." />}
    </View>
  );

  const selected = routeDays.find((item) => item.day === day) || routeDays[0];
  const coordinates = selected?.coordinates || [];
  const activityCoordinates = (selected?.activities || []).filter((activity) => Number.isFinite(activity.latitude) && Number.isFinite(activity.longitude));
  const allPoints = coordinates.length ? coordinates : activityCoordinates.map((activity) => [activity.longitude, activity.latitude]);
  const totalStops = selected?.activities?.length || 0;
  const mappedStops = activityCoordinates.length;
  const isLiveRoute = selected?.status === 'live';

  async function openDirections() {
    if (activityCoordinates.length < 1) return Alert.alert('Route unavailable', 'This itinerary does not yet have enough geocoded stops.');
    const points = activityCoordinates.slice(0, 8);
    const origin = `${points[0].latitude},${points[0].longitude}`;
    const destination = `${points.at(-1).latitude},${points.at(-1).longitude}`;
    const waypoints = points.slice(1, -1).map((item) => `${item.latitude},${item.longitude}`).join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ''}`;
    track('open_details', { tripId: currentTrip._id, itemType: 'route', itemId: String(day) });
    await Linking.openURL(url);
  }

  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <ScreenHeader title="Route map" subtitle={`${currentTrip.destination}, ${(Number(currentTrip.route?.totalDistanceMeters || 0) / 1000).toFixed(1)} km and ${Math.round(Number(currentTrip.route?.totalDurationSeconds || 0) / 60)} min total`} />
      <View style={styles.tripPicker}>
        <Text style={styles.pickerLabel}>SAVED TRIPS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {trips.map((trip) => (
            <TouchableOpacity key={trip._id} onPress={() => openTrip(trip)} style={[styles.tripChip, currentTrip._id === trip._id && styles.tripChipOn]}>
              <Text style={[styles.tripName, currentTrip._id === trip._id && styles.tripNameOn]}>{trip.destination}</Text>
              <Text style={[styles.tripDays, currentTrip._id === trip._id && styles.tripDaysOn]}>{trip.days} days</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={styles.tabs}><ScrollView horizontal showsHorizontalScrollIndicator={false}>{routeDays.map((item) => <TouchableOpacity key={item.day} onPress={() => setDay(item.day)} style={[styles.tab, day === item.day && styles.tabOn]}><Text style={[styles.tabText, day === item.day && styles.tabTextOn]}>Day {item.day}</Text></TouchableOpacity>)}</ScrollView></View>
      {routeLoading ? <View style={styles.routeLoader}><ActivityIndicator color={colors.forest} /><Text style={styles.loadingText}>Building the saved trip route...</Text></View> : !selected ? <View><EmptyTrip message={routeError || "No daily route data is available for this trip."} />{routeError ? <TouchableOpacity style={styles.retryButton} onPress={loadMissingRoute}><Text style={styles.retryText}>RETRY ROUTE</Text></TouchableOpacity> : null}</View> : (
        <ScrollView contentContainerStyle={[styles.content, desktop && styles.desktopContent]}>
          {allPoints.length ? (
            <View style={[styles.map, desktop && styles.desktopMap, { height: mapHeight }]}><OpenStreetMap routeDay={selected} height={mapHeight} /></View>
          ) : (
            <View style={[styles.noMap, desktop && styles.desktopMap]}><Text style={styles.noMapTitle}>Coordinates unavailable</Text><Text style={styles.noMapText}>Activity order is still available below. Add an OpenRouteService key to geocode places and draw a route.</Text></View>
          )}
          <View style={[styles.summary, desktop && styles.desktopSummary]}>
            <View style={styles.routeStatusRow}>
              <Text style={[styles.routeStatus, isLiveRoute ? styles.liveStatus : styles.estimatedStatus]}>{isLiveRoute ? 'LIVE ROAD ROUTE' : 'ESTIMATED ROUTE'}</Text>
              <Text style={styles.mappedStops}>{mappedStops} of {totalStops} stops mapped</Text>
            </View>
            <Text style={styles.title}>{selected.title || `Day ${day}`}</Text>
            <Text style={styles.meta}>{(selected.distanceMeters / 1000).toFixed(1)} km, {Math.round(selected.durationSeconds / 60)} min</Text>
            <Text style={styles.note}>{selected.note}</Text>
            {!isLiveRoute ? <Text style={styles.routeHelp}>The dashed line connects available coordinates directly. Configure OpenRouteService for road geometry and geocoding, or use Open Directions for a live Google Maps route.</Text> : null}
            {(selected.activities || []).map((activity, index) => <View key={`${activity.place}-${index}`} style={styles.stop}><Text style={styles.number}>{index + 1}</Text><View style={{ flex: 1 }}><Text style={styles.stopName}>{activity.place}</Text><Text style={styles.stopTime}>{activity.time}</Text></View></View>)}
            <TouchableOpacity style={styles.openButton} onPress={openDirections}><Text style={styles.openText}>OPEN DIRECTIONS</Text></TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream }, tabs: { backgroundColor: colors.paper, padding: 10 },
  loader: { marginTop: 50 }, routeLoader: { padding: 40, alignItems: 'center' }, loadingText: { color: colors.muted, marginTop: 12 },
  tripPicker: { backgroundColor: '#edf4ed', paddingHorizontal: 10, paddingTop: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.line }, pickerLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 7 },
  tripChip: { minWidth: 112, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 14, marginRight: 8, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line }, tripChipOn: { backgroundColor: colors.forest, borderColor: colors.forest }, tripName: { color: colors.ink, fontSize: 13, fontWeight: '900' }, tripNameOn: { color: colors.white }, tripDays: { color: colors.muted, fontSize: 9, fontWeight: '700', marginTop: 2 }, tripDaysOn: { color: colors.mint },
  retryButton: { alignSelf: 'center', backgroundColor: colors.forest, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 }, retryText: { color: colors.white, fontWeight: '900' },
  tab: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 18, marginRight: 7, backgroundColor: colors.cream }, tabOn: { backgroundColor: colors.forest }, tabText: { color: colors.muted, fontWeight: '800' }, tabTextOn: { color: '#fff' },
  content: { padding: 16, paddingBottom: 34 }, map: { ...shadow, height: 300, borderRadius: 22, overflow: 'hidden', backgroundColor: '#dce8dc', borderWidth: 1, borderColor: '#bfd0c1' },
  desktopContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingHorizontal: 20, paddingTop: 20 }, desktopMap: { flex: 1.25, minWidth: 0 }, desktopSummary: { flex: 0.9, minWidth: 0, marginTop: 0 },
  noMap: { ...shadow, backgroundColor: colors.paper, borderRadius: 20, padding: 22 }, noMapTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' }, noMapText: { color: colors.muted, lineHeight: 20, marginTop: 6 },
  compass: { position: 'absolute', right: 14, top: 12, color: colors.forest, fontWeight: '900' }, routeDot: { position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: colors.blue },
  pin: { position: 'absolute', width: 25, height: 25, marginLeft: -9, marginTop: -9, borderRadius: 13, backgroundColor: colors.forest, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }, pinText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  mapLabel: { position: 'absolute', left: 12, bottom: 10, color: colors.muted, fontSize: 10, fontWeight: '800' }, summary: { ...shadow, backgroundColor: colors.paper, borderRadius: 20, padding: 18, marginTop: 15 }, title: { color: colors.ink, fontSize: 20, fontWeight: '900' }, meta: { color: colors.green, fontWeight: '800', marginTop: 5 }, note: { color: colors.muted, fontSize: 12, marginVertical: 10 },
  routeStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, routeStatus: { borderRadius: 999, overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5, fontSize: 9, fontWeight: '900', letterSpacing: 0.6 }, liveStatus: { backgroundColor: colors.mint, color: colors.forest }, estimatedStatus: { backgroundColor: '#fff1d6', color: '#6f4815' }, mappedStops: { color: colors.muted, fontSize: 10, fontWeight: '700' }, routeHelp: { backgroundColor: '#fff8e8', borderRadius: 10, color: '#6f4815', fontSize: 11, lineHeight: 17, padding: 10, marginBottom: 8 },
  stop: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderTopWidth: 1, borderColor: colors.line }, number: { width: 26, height: 26, borderRadius: 13, textAlign: 'center', textAlignVertical: 'center', backgroundColor: colors.mint, color: colors.forest, fontWeight: '900', marginRight: 10 }, stopName: { color: colors.ink, fontWeight: '800' }, stopTime: { color: colors.muted, fontSize: 11, marginTop: 2 }, openButton: { backgroundColor: colors.forest, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 14 }, openText: { color: '#fff', fontWeight: '900' },
});
