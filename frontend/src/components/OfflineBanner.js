import React from 'react';
import { StyleSheet, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AppIcon from './AppIcon';
import AppText from './AppText';
import { spacing, states } from '../theme';

export default function OfflineBanner() {
  const [offline, setOffline] = React.useState(false);
  React.useEffect(() => NetInfo.addEventListener((state) => setOffline(state.isConnected === false)), []);
  if (!offline) return null;
  return <View accessibilityRole="alert" style={styles.banner}><AppIcon name="cloud-offline-outline" color={states.offline.foreground} size={18} /><AppText variant="caption" color={states.offline.foreground}>Offline. Saved trips remain visible; live APIs and AI need a connection.</AppText></View>;
}

const styles = StyleSheet.create({ banner: { minHeight: 38, backgroundColor: states.offline.background, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm } });
