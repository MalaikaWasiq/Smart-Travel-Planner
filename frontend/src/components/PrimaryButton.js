import React from 'react';
import { ActivityIndicator, StyleSheet, Pressable as TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../theme';
import AppText from './AppText';

export default function PrimaryButton({ title, onPress, loading, disabled, compact }) {
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }} onPress={onPress} disabled={disabled || loading} style={[styles.wrap, compact && styles.compact, (disabled || loading) && styles.disabled]}>
      <LinearGradient colors={[colors.forest, colors.green]} style={[styles.button, compact && styles.compactButton]}>
        {loading ? <ActivityIndicator color="#fff" /> : <AppText variant="label" color={colors.white} style={styles.text}>{title}</AppText>}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 13, overflow: 'hidden', marginTop: 18 },
  button: { minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  text: { fontFamily: fonts.extraBold, letterSpacing: 0.7 },
  compact: { marginTop: 0, alignSelf: 'flex-start' },
  compactButton: { minHeight: 40 },
  disabled: { opacity: 0.55 },
});
