import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import AppText from './AppText';
import AppIcon from './AppIcon';

export default function EmptyTrip({ message = 'Generate or open a trip to see this section.' }) {
  return (
    <View style={styles.empty}>
      <View style={styles.icon}><AppIcon name="map-outline" color={colors.forest} size={24} /></View>
      <AppText variant="heading" style={styles.title}>No active trip</AppText>
      <AppText color={colors.muted} style={styles.text}>{message}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { margin: 24, padding: 28, borderRadius: 20, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  icon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { marginBottom: 6 },
  text: { maxWidth: 420 },
});
