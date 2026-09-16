import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const PAST_TRIPS = [
  { id: 1, destination: 'Lahore',    date: 'Oct 26–28', days: 3, status: 'Completed' },
  { id: 2, destination: 'Hunza',     date: 'Nov 10–15', days: 5, status: 'Upcoming'  },
  { id: 3, destination: 'Islamabad', date: 'Sep 5–7',   days: 3, status: 'Completed' },
];

const MENU_ITEMS = [
  { icon: '✈', label: 'My Trips'       },
  { icon: '💰', label: 'Budget History' },
  { icon: '🔔', label: 'Notifications'  },
  { icon: '⚙',  label: 'Settings'       },
  { icon: '❓', label: 'Help & Support' },
];

export default function ProfileScreen({ navigation }) {
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => navigation.replace('Login') },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient colors={['#0d5c2e', '#25a865']} style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>MW</Text>
        </View>
        <Text style={styles.profileName}>Malaika Wasiq</Text>
        <Text style={styles.profileEmail}>malaika@example.com</Text>
        <View style={styles.profileBadge}>
          <Text style={styles.profileBadgeText}>COMSATS Attock  •  BSE 2023</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>11</Text>
            <Text style={styles.statLabel}>Days Traveled</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Cities</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Trips</Text>
          {PAST_TRIPS.map(trip => (
            <View key={trip.id} style={styles.tripRow}>
              <View style={styles.tripIconWrap}>
                <Text style={styles.tripIcon}>✈</Text>
              </View>
              <View style={styles.tripInfo}>
                <Text style={styles.tripDest}>{trip.destination}</Text>
                <Text style={styles.tripDate}>{trip.date}  •  {trip.days} days</Text>
              </View>
              <View style={[styles.tripStatus, { backgroundColor: trip.status === 'Completed' ? '#e8f5e9' : '#fff3e0' }]}>
                <Text style={[styles.tripStatusText, { color: trip.status === 'Completed' ? '#1a7a4a' : '#e65100' }]}>
                  {trip.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          {MENU_ITEMS.map((item, idx) => (
            <TouchableOpacity key={idx} style={styles.menuRow}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f5f5f5' },
  header:          { paddingTop: 56, paddingBottom: 28, alignItems: 'center' },
  avatar:          { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff', marginBottom: 12 },
  avatarText:      { fontSize: 28, color: '#fff', fontWeight: '800' },
  profileName:     { fontSize: 22, color: '#fff', fontWeight: '800' },
  profileEmail:    { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  profileBadge:    { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4 },
  profileBadgeText:{ color: '#fff', fontSize: 12 },
  scroll:          { flex: 1 },
  statsRow:        { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  statItem:        { flex: 1, alignItems: 'center' },
  statValue:       { fontSize: 22, fontWeight: '800', color: '#1a7a4a' },
  statLabel:       { fontSize: 12, color: '#888', marginTop: 2 },
  statDivider:     { width: 1, backgroundColor: '#eee' },
  section:         { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle:    { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 12 },
  tripRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#f5f5f5' },
  tripIconWrap:    { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  tripIcon:        { fontSize: 16 },
  tripInfo:        { flex: 1 },
  tripDest:        { fontSize: 14, fontWeight: '700', color: '#222' },
  tripDate:        { fontSize: 12, color: '#888', marginTop: 1 },
  tripStatus:      { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  tripStatusText:  { fontSize: 11, fontWeight: '600' },
  menuRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#f5f5f5' },
  menuIcon:        { fontSize: 18, marginRight: 14, width: 24, textAlign: 'center' },
  menuLabel:       { flex: 1, fontSize: 15, color: '#333' },
  menuArrow:       { fontSize: 20, color: '#ccc' },
  logoutBtn:       { marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#ffcdd2' },
  logoutText:      { fontSize: 15, fontWeight: '700', color: '#e53935' },
});