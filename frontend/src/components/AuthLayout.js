import React from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { colors, fonts } from '../theme';
import AppText from './AppText';

export function AuthLayout({ title, subtitle, children }) {
  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <StatusBar style="light" />
      <LinearGradient colors={[colors.forest, colors.green]} style={styles.hero}>
        <AppText variant="label" color={colors.white} style={styles.mark}>STP</AppText>
        <AppText variant="title" color={colors.white} style={styles.heroTitle}>Smart Travel Planner</AppText>
        <AppText color={colors.mint} style={styles.heroSubtitle}>{subtitle}</AppText>
      </LinearGradient>
      <View style={styles.card}>
        <AppText variant="title" style={styles.title}>{title}</AppText>
        {children}
      </View>
    </ScrollView>
  );
}

export function FormField({ label, error, ...inputProps }) {
  return (
    <View style={styles.fieldWrap}>
      <AppText variant="label" style={styles.label}>{label}</AppText>
      <TextInput {...inputProps} placeholderTextColor="#9aa69f" style={[styles.input, error && styles.inputError]} />
      {error ? <AppText variant="caption" color={colors.red} style={styles.error}>{error}</AppText> : null}
    </View>
  );
}

export const authStyles = StyleSheet.create({
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  switchText: { color: colors.muted },
  switchLink: { color: colors.forest, fontWeight: '900' },
  banner: { backgroundColor: colors.mint, borderColor: '#afd6c0', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  bannerTitle: { color: colors.forest, fontWeight: '900' },
  bannerText: { color: colors.ink, marginTop: 3, lineHeight: 19 },
});

const styles = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: colors.cream },
  hero: { paddingTop: 64, paddingBottom: 42, alignItems: 'center' },
  mark: { borderWidth: 2, borderColor: '#fff', borderRadius: 28, paddingHorizontal: 14, paddingVertical: 10 },
  heroTitle: { marginTop: 14 },
  heroSubtitle: { marginTop: 5 },
  card: { flex: 1, backgroundColor: colors.paper, marginTop: -18, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 26 },
  title: { marginBottom: 10 },
  fieldWrap: { marginTop: 12 },
  label: { marginBottom: 6 },
  input: { backgroundColor: '#f7f8f5', borderColor: colors.line, borderWidth: 1, borderRadius: 12, minHeight: 50, paddingHorizontal: 14, color: colors.ink, fontFamily: fonts.body, fontSize: 14 },
  inputError: { borderColor: colors.red, backgroundColor: '#fff8f7' },
  error: { marginTop: 5 },
});
