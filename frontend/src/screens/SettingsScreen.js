import React from 'react';
import { ScrollView, StyleSheet, Pressable as TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScreenHeader from '../components/ScreenHeader';
import AppText from '../components/AppText';
import AppIcon from '../components/AppIcon';
import { colors, radius, shadowSoft, spacing } from '../theme';

function SettingsRow({ icon, title, subtitle, onPress, status }) {
  const content = <><View style={styles.rowIcon}><AppIcon name={icon} color={colors.forest} size={19} /></View><View style={styles.rowCopy}><AppText variant="bodyStrong">{title}</AppText><AppText variant="caption" color={colors.muted} style={styles.rowSubtitle}>{subtitle}</AppText></View>{status ? <AppText variant="caption" color={colors.green}>{status}</AppText> : <AppIcon name="chevron-forward" color={colors.muted} size={18} />}</>;
  return onPress ? <TouchableOpacity accessibilityRole="button" style={styles.row} onPress={onPress}>{content}</TouchableOpacity> : <View style={styles.row}>{content}</View>;
}

export default function SettingsScreen({ navigation }) {
  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <ScreenHeader title="Settings" subtitle="Preferences, sources, and application details" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="label" color={colors.muted} style={styles.eyebrow}>PERSONALIZATION</AppText>
        <View style={styles.card}><SettingsRow icon="options-outline" title="Travel preferences" subtitle="Budget, interests, and preferred stay" onPress={() => navigation.navigate('TravelPreferences')} /><SettingsRow icon="notifications-outline" title="Notifications" subtitle="Local trip, weather, and budget reminders" onPress={() => navigation.navigate('NotificationSettings')} /></View>
        <View style={styles.card}><SettingsRow icon="warning-outline" title="Active alerts" subtitle="Weather, budget, and route warnings" onPress={() => navigation.navigate('Alerts')} /><SettingsRow icon="shield-checkmark-outline" title="Privacy and data" subtitle="Export or delete stored account information" onPress={() => navigation.navigate('PrivacyData')} /></View>

        <AppText variant="label" color={colors.muted} style={styles.eyebrow}>DEMO ENVIRONMENT</AppText>
        <View style={styles.card}>
          <SettingsRow icon="server-outline" title="Trip database" subtitle="Stored on this laptop through the Express backend" status="LOCAL" />
          <SettingsRow icon="sparkles-outline" title="Itinerary model" subtitle="Groq with validated rule-based fallback" status="ACTIVE" />
        </View>

        <AppText variant="label" color={colors.muted} style={styles.eyebrow}>DATA SOURCES</AppText>
        <View style={styles.card}>
          <SettingsRow icon="partly-sunny-outline" title="Weather" subtitle="OpenWeather with labeled fallback data" />
          <SettingsRow icon="book-outline" title="Attractions" subtitle="Wikipedia and MediaWiki" />
          <SettingsRow icon="navigate-outline" title="Routes" subtitle="OpenRouteService integration; estimate fallback without a key" />
          <SettingsRow icon="bed-outline" title="Hotels" subtitle="Curated local planning estimates, not booking quotes" />
        </View>

        <View style={styles.notice}><AppIcon name="information-circle-outline" color={colors.blue} size={21} /><AppText variant="caption" color={colors.muted} style={styles.noticeText}>This demonstration stores local application data on the laptop. External weather, Wikipedia, and Groq requests still require internet access.</AppText></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream }, content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  eyebrow: { marginTop: spacing.md, marginBottom: spacing.sm, marginLeft: spacing.xs, letterSpacing: 0.8 },
  card: { ...shadowSoft, backgroundColor: colors.paper, borderRadius: radius.xl, paddingHorizontal: spacing.lg, marginBottom: spacing.sm, overflow: 'hidden' },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: spacing.md },
  rowIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  rowCopy: { flex: 1, paddingRight: spacing.sm }, rowSubtitle: { marginTop: 2 },
  notice: { flexDirection: 'row', borderRadius: radius.lg, borderWidth: 1, borderColor: '#c9dce6', backgroundColor: '#eef6fa', padding: spacing.lg, marginTop: spacing.lg },
  noticeText: { flex: 1, marginLeft: spacing.sm },
});
