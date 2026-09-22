import React from 'react';
import { Platform, StyleSheet, Pressable as TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';
import AppText from './AppText';
import AppIcon from './AppIcon';

export default function ScreenHeader({ title, subtitle, onBack, children }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={[colors.forest, colors.green]} style={[styles.header, { paddingTop: Math.max(20, insets.top + 14) }]}>
      {onBack ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.back}><AppIcon name="chevron-back" color={colors.mint} size={19} /><AppText variant="label" color={colors.mint}>Back</AppText></TouchableOpacity> : null}
      <View>
        <AppText variant="title" color={colors.white} style={styles.title}>{title}</AppText>
        {subtitle ? <AppText variant="caption" color={colors.mint} style={styles.subtitle}>{subtitle}</AppText> : null}
      </View>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 54, paddingBottom: Platform.OS === 'web' ? 18 : 22, paddingHorizontal: Platform.OS === 'web' ? 24 : 20, minHeight: Platform.OS === 'web' ? 108 : 128 },
  back: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 },
  title: { maxWidth: 620 },
  subtitle: { marginTop: 5, fontFamily: fonts.medium, maxWidth: 620 },
});
