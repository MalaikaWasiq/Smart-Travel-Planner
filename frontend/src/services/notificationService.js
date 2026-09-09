import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'smartTravelPlanner.notificationSettings';
const DELIVERED_KEY = 'smartTravelPlanner.deliveredAlertKeys';

export async function scheduleServerAlerts(alerts = []) {
  if (Platform.OS === 'web' || !alerts.length) return;
  const Notifications = await import('expo-notifications');
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') return;
  const settings = JSON.parse(await AsyncStorage.getItem(SETTINGS_KEY) || '{"tripReminders":true,"weatherAlerts":true,"budgetAlerts":true}');
  const delivered = new Set(JSON.parse(await AsyncStorage.getItem(DELIVERED_KEY) || '[]'));
  for (const alert of alerts) {
    if (alert.read || delivered.has(alert._id)) continue;
    if (alert.type === 'weather' && !settings.weatherAlerts) continue;
    if (alert.type === 'budget' && !settings.budgetAlerts) continue;
    await Notifications.scheduleNotificationAsync({ content: { title: alert.title, body: alert.message, data: { alertId: alert._id, tripId: alert.tripId } }, trigger: null });
    delivered.add(alert._id);
  }
  await AsyncStorage.setItem(DELIVERED_KEY, JSON.stringify(Array.from(delivered).slice(-200)));
}
