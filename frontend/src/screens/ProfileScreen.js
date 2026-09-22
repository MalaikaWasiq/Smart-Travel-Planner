import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Pressable as TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScreenHeader from '../components/ScreenHeader';
import AppIcon from '../components/AppIcon';
import AppText from '../components/AppText';
import { useApp } from '../context/AppContext';
import { colors, shadow } from '../theme';

const Text = AppText;

export default function ProfileScreen({ navigation }) {
  const { user, logout, trips, tripsLoading, refreshTrips, openTrip, deleteTrip } = useApp();
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try { await refreshTrips(); }
    catch (requestError) { setError(requestError.message); }
  }

  useEffect(() => {
    load();
    return navigation.addListener('focus', load);
  }, [navigation]);

  function chooseTrip(trip) { openTrip(trip); navigation.navigate('Itinerary', { trip }); }
  function confirmDelete(trip) { Alert.alert('Delete saved trip?', `${trip.destination} and its expenses will be removed.`, [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteTrip(trip._id); } catch (requestError) { Alert.alert('Delete failed', requestError.message); } } }]); }
  function confirmLogout() { Alert.alert('Sign out', 'End this session?', [{ text: 'Cancel' }, { text: 'Sign out', style: 'destructive', onPress: async () => { await logout(); navigation.replace('Login'); } }]); }

  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <ScreenHeader title={user?.fullName || 'Traveler'} subtitle={user?.email || ''}><View style={styles.avatar}><Text style={styles.avatarText}>{user?.initials || 'U'}</Text></View></ScreenHeader>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.stats}><View><Text style={styles.statValue}>{trips.length}</Text><Text style={styles.statLabel}>TRIPS</Text></View><View><Text style={styles.statValue}>{trips.reduce((sum, trip) => sum + Number(trip.days || 0), 0)}</Text><Text style={styles.statLabel}>DAYS</Text></View><View><Text style={styles.statValue}>{new Set(trips.map((trip) => trip.destination)).size}</Text><Text style={styles.statLabel}>CITIES</Text></View></View>
        <View style={styles.menuCard}>
          <TouchableOpacity accessibilityRole="button" style={styles.menuRow} onPress={() => navigation.navigate('EditProfile')}><View style={styles.menuIcon}><AppIcon name="create-outline" color={colors.forest} size={19} /></View><View style={styles.menuCopy}><AppText variant="bodyStrong">Edit profile</AppText><AppText variant="caption" color={colors.muted}>Update your traveler name</AppText></View><AppIcon name="chevron-forward" color={colors.muted} size={18} /></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.menuRow} onPress={() => navigation.navigate('TravelPreferences')}>
            <View style={styles.menuIcon}><AppIcon name="options-outline" color={colors.forest} size={19} /></View><View style={styles.menuCopy}><AppText variant="bodyStrong">Travel preferences</AppText><AppText variant="caption" color={colors.muted}>Budget, interests, and hotel style</AppText></View><AppIcon name="chevron-forward" color={colors.muted} size={18} />
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.menuRow} onPress={() => navigation.navigate('Settings')}>
            <View style={styles.menuIcon}><AppIcon name="settings-outline" color={colors.forest} size={19} /></View><View style={styles.menuCopy}><AppText variant="bodyStrong">Settings and sources</AppText><AppText variant="caption" color={colors.muted}>Demo storage and data providers</AppText></View><AppIcon name="chevron-forward" color={colors.muted} size={18} />
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.menuRow} onPress={() => navigation.navigate('ChatHistory')}><View style={styles.menuIcon}><AppIcon name="chatbubbles-outline" color={colors.forest} size={19} /></View><View style={styles.menuCopy}><AppText variant="bodyStrong">Travel assistant</AppText><AppText variant="caption" color={colors.muted}>Contextual Groq chat and saved conversations</AppText></View><AppIcon name="chevron-forward" color={colors.muted} size={18} /></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.menuRow} onPress={() => navigation.navigate('NotificationSettings')}><View style={styles.menuIcon}><AppIcon name="notifications-outline" color={colors.forest} size={19} /></View><View style={styles.menuCopy}><AppText variant="bodyStrong">Notifications</AppText><AppText variant="caption" color={colors.muted}>Trip, weather, and budget reminders</AppText></View><AppIcon name="chevron-forward" color={colors.muted} size={18} /></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.menuRow} onPress={() => navigation.navigate('Alerts')}><View style={styles.menuIcon}><AppIcon name="warning-outline" color={colors.forest} size={19} /></View><View style={styles.menuCopy}><AppText variant="bodyStrong">Travel alerts</AppText><AppText variant="caption" color={colors.muted}>Weather, budget, and route warnings</AppText></View><AppIcon name="chevron-forward" color={colors.muted} size={18} /></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.menuRow} onPress={() => navigation.navigate('PrivacyData')}><View style={styles.menuIcon}><AppIcon name="shield-checkmark-outline" color={colors.forest} size={19} /></View><View style={styles.menuCopy}><AppText variant="bodyStrong">Privacy and data</AppText><AppText variant="caption" color={colors.muted}>Export or permanently delete your data</AppText></View><AppIcon name="chevron-forward" color={colors.muted} size={18} /></TouchableOpacity>
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Saved trips</Text>
          {tripsLoading ? <ActivityIndicator color={colors.forest} style={{ margin: 20 }} /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!tripsLoading && !error && trips.length === 0 ? <Text style={styles.empty}>No saved trips yet.</Text> : null}
          {trips.map((trip) => <View key={trip._id} style={styles.trip}><TouchableOpacity style={{ flex: 1 }} onPress={() => chooseTrip(trip)}><Text style={styles.tripTitle}>{trip.destination}</Text><Text style={styles.tripMeta}>{trip.days} days, PKR {Number(trip.budget).toLocaleString()}</Text></TouchableOpacity><TouchableOpacity accessibilityLabel={`Delete ${trip.destination} trip`} style={styles.deleteTrip} onPress={() => confirmDelete(trip)}><AppIcon name="trash-outline" color={colors.red} size={19} /></TouchableOpacity><TouchableOpacity onPress={() => chooseTrip(trip)}><Text style={styles.open}>Open</Text></TouchableOpacity></View>)}
        </View>
        <TouchableOpacity style={styles.logout} onPress={confirmLogout}><Text style={styles.logoutText}>SIGN OUT</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream }, avatar: { position: 'absolute', right: 20, bottom: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.forest, fontWeight: '900', fontSize: 18 }, content: { padding: 16, paddingBottom: 34 }, stats: { ...shadow, backgroundColor: colors.paper, borderRadius: 20, padding: 18, flexDirection: 'row', justifyContent: 'space-around' }, statValue: { textAlign: 'center', color: colors.forest, fontWeight: '900', fontSize: 23 }, statLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 2 }, menuCard: { ...shadow, backgroundColor: colors.paper, borderRadius: 20, paddingHorizontal: 16, marginTop: 15, overflow: 'hidden' }, menuRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line }, menuIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, menuCopy: { flex: 1 }, card: { ...shadow, backgroundColor: colors.paper, borderRadius: 20, padding: 18, marginTop: 15 }, title: { color: colors.ink, fontWeight: '900', fontSize: 20, marginBottom: 8 }, trip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderColor: colors.line, paddingVertical: 10 }, deleteTrip: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }, tripTitle: { color: colors.ink, fontWeight: '900' }, tripMeta: { color: colors.muted, fontSize: 11, marginTop: 3 }, open: { color: colors.green, fontWeight: '900' }, empty: { color: colors.muted, paddingVertical: 18 }, error: { color: colors.red, paddingVertical: 14 }, logout: { borderWidth: 1, borderColor: colors.red, borderRadius: 13, padding: 14, alignItems: 'center', marginTop: 18 }, logoutText: { color: colors.red, fontWeight: '900' },
});
