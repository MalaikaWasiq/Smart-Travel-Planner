import React from 'react';
import { ScrollView, StyleSheet, Pressable as TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScreenHeader from '../components/ScreenHeader';
import EmptyTrip from '../components/EmptyTrip';
import AppText from '../components/AppText';
import AppIcon from '../components/AppIcon';
import { useApp } from '../context/AppContext';
import { colors, radius, shadowSoft, spacing } from '../theme';

function Metric({ icon, label, value }) {
  return (
    <View style={styles.metric}>
      <AppIcon name={icon} color={colors.green} size={20} />
      <AppText variant="heading" style={styles.metricValue}>{value}</AppText>
      <AppText variant="caption" color={colors.muted}>{label}</AppText>
    </View>
  );
}

function DetailRow({ icon, label, value, tone = colors.ink }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}><AppIcon name={icon} color={colors.forest} size={18} /></View>
      <View style={styles.detailCopy}>
        <AppText variant="caption" color={colors.muted}>{label}</AppText>
        <AppText variant="bodyStrong" color={tone} style={styles.detailValue}>{value}</AppText>
      </View>
    </View>
  );
}

export default function TripSummaryScreen({ navigation }) {
  const { currentTrip } = useApp();
  if (!currentTrip) return <View style={styles.page}><ScreenHeader title="Trip summary" onBack={() => navigation.goBack()} /><EmptyTrip /></View>;

  const routeKm = Number(currentTrip.route?.totalDistanceMeters || 0) / 1000;
  const routeMinutes = Math.round(Number(currentTrip.route?.totalDurationSeconds || 0) / 60);
  const budget = currentTrip.budgetBreakdown || {};
  const activityCount = (currentTrip.itinerary || []).reduce((total, day) => total + (day.activities?.length || 0), 0);
  const selectedHotel = currentTrip.selectedHotel;

  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <ScreenHeader title={currentTrip.destination} subtitle="Your complete trip at a glance" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.metrics}>
          <Metric icon="calendar-outline" label="DAYS" value={currentTrip.days} />
          <Metric icon="location-outline" label="STOPS" value={activityCount} />
          <Metric icon="navigate-outline" label="ROUTE KM" value={routeKm.toFixed(1)} />
        </View>

        <View style={styles.card}>
          <View style={styles.sectionTitle}><AppText variant="heading">Plan snapshot</AppText><AppText variant="caption" color={colors.green}>SAVED TRIP</AppText></View>
          <DetailRow icon="partly-sunny-outline" label="Weather" value={`${currentTrip.weather?.temp ?? '--'} C, ${currentTrip.weather?.description || 'Unavailable'}`} />
          <DetailRow icon="bed-outline" label="Stay" value={selectedHotel ? `${selectedHotel.name}, PKR ${Number(selectedHotel.totalStayCost || 0).toLocaleString()}` : 'No hotel selected'} />
          <DetailRow icon="car-outline" label="Daily travel estimate" value={`${routeKm.toFixed(1)} km, about ${routeMinutes} minutes total`} />
          <DetailRow icon="wallet-outline" label="Estimated spend" value={`PKR ${Number(budget.totalEstimated || 0).toLocaleString()} of PKR ${Number(currentTrip.budget || 0).toLocaleString()}`} tone={budget.exceeded ? colors.red : colors.ink} />
        </View>

        <View style={styles.card}>
          <AppText variant="heading">Interests</AppText>
          <View style={styles.chips}>
            {(currentTrip.interests?.length ? currentTrip.interests : ['General travel']).map((interest) => <View key={interest} style={styles.chip}><AppText variant="caption" color={colors.forest}>{interest}</AppText></View>)}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity accessibilityRole="button" style={styles.primaryAction} onPress={() => navigation.navigate('Itinerary')}>
            <AppIcon name="list-outline" color={colors.white} size={19} /><AppText variant="label" color={colors.white}>VIEW ITINERARY</AppText>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.secondaryAction} onPress={() => navigation.navigate('MainApp', { screen: 'Budget' })}>
            <AppIcon name="pie-chart-outline" color={colors.forest} size={19} /><AppText variant="label" color={colors.forest}>OPEN BUDGET</AppText>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.secondaryAction} onPress={() => navigation.navigate('EditTrip')}><AppIcon name="create-outline" color={colors.forest} size={19} /><AppText variant="label" color={colors.forest}>EDIT TRIP</AppText></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.secondaryAction} onPress={() => navigation.navigate('ShareExport')}><AppIcon name="share-social-outline" color={colors.forest} size={19} /><AppText variant="label" color={colors.forest}>SHARE OR EXPORT</AppText></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.secondaryAction} onPress={() => navigation.navigate('Chat')}><AppIcon name="chatbubble-ellipses-outline" color={colors.forest} size={19} /><AppText variant="label" color={colors.forest}>ASK TRAVEL ASSISTANT</AppText></TouchableOpacity>
        </View>
        <AppText variant="caption" color={colors.muted} style={styles.disclaimer}>Weather, route, hotel, and cost values are planning data. Verify live conditions and rates before travel.</AppText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  metrics: { flexDirection: 'row', gap: spacing.sm },
  metric: { ...shadowSoft, flex: 1, minHeight: 112, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, borderRadius: radius.lg, padding: spacing.sm },
  metricValue: { marginTop: 7, marginBottom: 1 },
  card: { ...shadowSoft, backgroundColor: colors.paper, borderRadius: radius.xl, padding: spacing.xl, marginTop: spacing.lg },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: spacing.md },
  detailIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  detailCopy: { flex: 1 }, detailValue: { marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  chip: { backgroundColor: colors.mint, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 7 },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  primaryAction: { minHeight: 50, borderRadius: radius.md, backgroundColor: colors.forest, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  secondaryAction: { minHeight: 50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.forest, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  disclaimer: { textAlign: 'center', marginTop: spacing.lg, paddingHorizontal: spacing.md },
});
