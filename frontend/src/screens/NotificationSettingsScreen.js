import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Pressable as TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenHeader from '../components/ScreenHeader';
import AppText from '../components/AppText';
import AppIcon from '../components/AppIcon';
import { useApp } from '../context/AppContext';
import { colors, radius, spacing, states } from '../theme';

const KEY = 'smartTravelPlanner.notificationSettings';

export default function NotificationSettingsScreen({ navigation }) {
  const { currentTrip, refreshAlerts } = useApp();
  const [settings, setSettings] = useState({ tripReminders: true, weatherAlerts: true, budgetAlerts: true });
  const [permission, setPermission] = useState(Platform.OS === 'web' ? 'web-unavailable' : 'undetermined');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((value) => value && setSettings(JSON.parse(value))).catch(() => {});
    if (Platform.OS !== 'web') {
      import('expo-notifications').then((Notifications) => Notifications.getPermissionsAsync()).then((result) => setPermission(result.status)).catch(() => {});
    }
  }, []);

  async function toggle(key) {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  }

  async function enable() {
    if (Platform.OS === 'web') return Alert.alert('Native feature', 'Notification delivery is available in the Android/iOS application. Preferences are still saved on web.');
    const Notifications = await import('expo-notifications');
    const result = await Notifications.requestPermissionsAsync();
    setPermission(result.status);
    if (result.status !== 'granted') return Alert.alert('Permission denied', 'Enable notifications in device settings to receive local alerts.');
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('travel-reminders', { name: 'Travel reminders', importance: Notifications.AndroidImportance.DEFAULT });
    await refreshAlerts();
    Alert.alert('Notifications enabled', 'Unread server weather and budget alerts can now appear as local notifications.');
  }

  async function schedule() {
    if (permission !== 'granted') return enable();
    const Notifications = await import('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: { title: `${currentTrip?.destination || 'Trip'} reminder`, body: 'Review weather, route, bookings, and your packing list before departure.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 10, channelId: 'travel-reminders' },
    });
    Alert.alert('Reminder scheduled', 'A local demo reminder will appear in about 10 seconds.');
  }

  return <View style={styles.page}><ScreenHeader title="Notifications" subtitle="Automatic local travel alerts" onBack={() => navigation.goBack()} /><ScrollView contentContainerStyle={styles.content}>
    <View accessibilityRole="status" style={[styles.permission, permission !== 'granted' && styles.permissionDenied]}><AppIcon name={permission === 'granted' ? 'checkmark-circle' : 'information-circle'} color={permission === 'granted' ? colors.forest : states.permissionDenied.foreground} /><View style={{ flex: 1 }}><AppText variant="bodyStrong">Permission: {permission}</AppText><AppText variant="caption" color={colors.muted}>{Platform.OS === 'web' ? 'Use Android/iOS to test notification delivery.' : 'Alerts are scheduled locally; no cloud push service is required.'}</AppText></View></View>
    {[["tripReminders", "calendar-outline", "Trip reminders"], ["weatherAlerts", "thunderstorm-outline", "Weather alerts"], ["budgetAlerts", "wallet-outline", "Budget alerts"]].map(([key, icon, label]) => <View key={key} style={styles.row}><View style={styles.icon}><AppIcon name={icon} color={colors.forest} /></View><View style={{ flex: 1 }}><AppText variant="bodyStrong">{label}</AppText><AppText variant="caption" color={colors.muted}>{key === 'tripReminders' ? 'Pre-trip review reminders' : key === 'weatherAlerts' ? 'Automatic warnings from the saved forecast' : 'Automatic warning when actual spend exceeds budget'}</AppText></View><Switch accessibilityLabel={label} value={settings[key]} onValueChange={() => toggle(key)} trackColor={{ true: colors.green }} /></View>)}
    {permission !== 'granted' ? <TouchableOpacity style={styles.button} onPress={enable}><AppIcon name="notifications" color={colors.white} /><AppText variant="label" color={colors.white}>ENABLE NOTIFICATIONS</AppText></TouchableOpacity> : null}
    <TouchableOpacity style={styles.secondary} onPress={schedule}><AppIcon name="alarm-outline" color={colors.forest} /><AppText variant="label" color={colors.forest}>SCHEDULE TEST REMINDER</AppText></TouchableOpacity>
  </ScrollView></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream }, content: { padding: spacing.lg, gap: 9 },
  permission: { backgroundColor: states.success.background, borderRadius: radius.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, permissionDenied: { backgroundColor: states.permissionDenied.background },
  row: { backgroundColor: colors.paper, borderRadius: radius.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  button: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.forest, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }, secondary: { minHeight: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.forest, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
