import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Pressable as TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScreenHeader from '../components/ScreenHeader';
import EmptyTrip from '../components/EmptyTrip';
import { useApp } from '../context/AppContext';
import { colors, shadow } from '../theme';
import Text from '../components/AppText';
import MarkdownText from '../components/MarkdownText';

const typeColors = { historic: '#2f7653', history: '#2f7653', food: '#c87a24', nature: '#2f6f91', adventure: '#9b4f31', shopping: '#a34d61', culture: '#70518a' };

export default function ItineraryScreen({ navigation, route }) {
  const { currentTrip, openTrip } = useApp();
  const routeTrip = route?.params?.trip;
  const trip = routeTrip || currentTrip;
  const [dayNumber, setDayNumber] = useState(1);

  useEffect(() => { if (routeTrip?._id && routeTrip._id !== currentTrip?._id) openTrip(routeTrip); }, [currentTrip?._id, routeTrip?._id]);
  if (!trip) return <View style={styles.page}><ScreenHeader title="Itinerary" onBack={() => navigation.goBack()} /><EmptyTrip /></View>;

  const itinerary = trip.itinerary || [];
  const currentDay = itinerary.find((day) => day.day === dayNumber) || itinerary[0];
  const activityCount = itinerary.reduce((sum, day) => sum + (day.activities?.length || 0), 0);

  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <ScreenHeader title={`${trip.destination} itinerary`} subtitle={`${trip.days} days, ${activityCount} planned stops`} onBack={() => navigation.goBack()}>
        <Text style={styles.budget}>PKR {Number(trip.budget).toLocaleString()}</Text>
      </ScreenHeader>
      <View style={styles.actions}>
        {[{ label: 'Summary', screen: 'TripSummary' }, { label: 'Edit', screen: 'EditItinerary' }, { label: 'Share', screen: 'ShareExport' }, { label: 'Map', tab: 'Map' }].map((item) => (
          <TouchableOpacity key={item.label} style={styles.action} onPress={() => item.screen ? navigation.navigate(item.screen) : navigation.navigate('MainApp', { screen: item.tab })}>
            <Text style={styles.actionText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.dayTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {itinerary.map((day) => (
            <TouchableOpacity key={day.day} style={[styles.dayTab, dayNumber === day.day && styles.dayTabOn]} onPress={() => setDayNumber(day.day)}>
              <Text style={[styles.dayTabText, dayNumber === day.day && styles.dayTabTextOn]}>Day {day.day}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.dayTitle}>{currentDay?.title}</Text>
        {currentDay?.weatherNote ? <View style={styles.weather}><MarkdownText compact color={colors.muted}>{currentDay.weatherNote}</MarkdownText></View> : null}
        {(currentDay?.activities || []).map((activity, index) => (
          <View key={`${activity.time}-${activity.place}-${index}`} style={styles.activityRow}>
            <View style={styles.timeline}><View style={styles.dot} />{index < currentDay.activities.length - 1 ? <View style={styles.line} /> : null}</View>
            <TouchableOpacity style={styles.card} onPress={() => {
              const attraction = (trip.attractions || []).find((item) => String(item.title).toLowerCase().includes(String(activity.place).toLowerCase()) || String(activity.place).toLowerCase().includes(String(item.title).toLowerCase()));
              navigation.navigate('AttractionDetail', { attraction: { ...activity, ...attraction, title: attraction?.title || activity.place } });
            }}>
              <View style={styles.cardTop}>
                <Text style={styles.time}>{activity.time}</Text>
                <View style={[styles.badge, { backgroundColor: typeColors[activity.type] || colors.muted }]}><Text style={styles.badgeText}>{activity.type}</Text></View>
              </View>
              <Text style={styles.place}>{activity.place}</Text>
              <MarkdownText compact color={colors.muted} style={styles.description}>{activity.description}</MarkdownText>
              <Text style={styles.cost}>Estimated PKR {Number(activity.estimatedCost || 0).toLocaleString()}</Text>
              <View style={styles.cardActions}><TouchableOpacity accessibilityRole="button" style={styles.cardAction} onPress={(event) => { event.stopPropagation?.(); navigation.navigate('ActivitySearch', { day: currentDay.day, activityIndex: index }); }}><Text style={styles.cardActionText}>REPLACE</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" style={styles.cardAction} onPress={(event) => { event.stopPropagation?.(); const match=(trip.attractions||[]).find(item=>String(item.title).toLowerCase().includes(String(activity.place).toLowerCase())||String(activity.place).toLowerCase().includes(String(item.title).toLowerCase())); navigation.navigate('RecommendationExplanation',{attraction:{...activity,...match,title:match?.title||activity.place}}); }}><Text style={styles.cardActionText}>WHY THIS?</Text></TouchableOpacity></View>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream },
  budget: { alignSelf: 'flex-start', color: '#fff', fontWeight: '800', backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, marginTop: 9 },
  actions: { flexDirection: 'row', padding: 10, backgroundColor: colors.paper, borderBottomWidth: 1, borderColor: colors.line },
  action: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRightWidth: 1, borderColor: colors.line },
  actionText: { color: colors.forest, fontWeight: '900' },
  dayTabs: { backgroundColor: colors.paper, paddingVertical: 10, paddingHorizontal: 12 },
  dayTab: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 18, marginRight: 7, backgroundColor: colors.cream },
  dayTabOn: { backgroundColor: colors.forest },
  dayTabText: { color: colors.muted, fontWeight: '800' },
  dayTabTextOn: { color: '#fff' },
  content: { padding: 16, paddingBottom: 36 },
  dayTitle: { color: colors.ink, fontSize: 23, fontWeight: '900' },
  weather: { backgroundColor: colors.mint, padding: 12, borderRadius: 12, marginTop: 9, marginBottom: 15 },
  activityRow: { flexDirection: 'row' },
  timeline: { width: 27, alignItems: 'center' },
  dot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.green, marginTop: 18 },
  line: { flex: 1, width: 2, backgroundColor: '#b8d9c5' },
  card: { ...shadow, flex: 1, backgroundColor: colors.paper, borderRadius: 16, padding: 15, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { color: colors.green, fontWeight: '900', fontSize: 12 },
  badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  place: { color: colors.ink, fontSize: 17, fontWeight: '900', marginTop: 8 },
  description: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  cost: { color: colors.amber, fontWeight: '800', fontSize: 12, marginTop: 9 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 9, borderTopWidth: 1, borderColor: colors.line }, cardAction: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 9, backgroundColor: colors.mint }, cardActionText: { color: colors.forest, fontWeight: '900', fontSize: 10 },
});
