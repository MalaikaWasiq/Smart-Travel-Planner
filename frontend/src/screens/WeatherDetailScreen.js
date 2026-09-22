import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import AppText from '../components/AppText';
import MarkdownText from '../components/MarkdownText';
import AppIcon from '../components/AppIcon';
import { useApp } from '../context/AppContext';
import { colors, radius, shadowSoft, spacing } from '../theme';

export default function WeatherDetailScreen({ navigation, route }) {
  const { currentTrip } = useApp();
  const weather = route.params?.weather || currentTrip?.weather;
  const forecast = route.params?.forecast || currentTrip?.forecast || [];
  const packingGuidance = [
    forecast.some((day) => day.isRainy) ? 'Pack a compact rain layer and protect electronics.' : '',
    forecast.some((day) => day.isCold || day.isSnowy) ? 'Carry warm layers and verify mountain-road conditions.' : '',
    forecast.some((day) => day.isHot) ? 'Carry water, sun protection, and plan shade breaks.' : '',
    'Always refresh the forecast shortly before departure.',
  ].filter(Boolean).join(' ');

  return (
    <View style={styles.page}>
      <ScreenHeader title="Weather and packing" subtitle={currentTrip?.destination || route.params?.city || 'Selected destination'} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <AppIcon name="partly-sunny" color={colors.white} size={40} />
          <AppText variant="display" color={colors.white}>{weather?.temp ?? '--'} C</AppText>
          <MarkdownText compact color={colors.mint}>{`${weather?.description || 'Unavailable'} | ${weather?.source || 'saved source'}`}</MarkdownText>
        </View>
        {forecast.map((day, index) => (
          <View key={`${day.label}-${index}`} style={styles.day}>
            <View style={styles.dayCopy}>
              <AppText variant="bodyStrong">{day.label || `Day ${index + 1}`}</AppText>
              <MarkdownText compact variant="caption" color={colors.muted}>{day.advisory || day.description || day.main}</MarkdownText>
            </View>
            <AppText variant="heading">{day.temp ?? '--'} C</AppText>
          </View>
        ))}
        <View style={styles.card}>
          <AppText variant="heading">Packing guidance</AppText>
          <MarkdownText color={colors.muted}>{packingGuidance}</MarkdownText>
          <AppText variant="caption" color={colors.muted}>Weather is live when OpenWeather is available and otherwise clearly labeled fallback planning data.</AppText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, gap: 10 },
  hero: { ...shadowSoft, backgroundColor: colors.blue, borderRadius: radius.xl, padding: 24, alignItems: 'center', gap: 4 },
  day: { ...shadowSoft, backgroundColor: colors.paper, borderRadius: radius.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dayCopy: { flex: 1 },
  card: { ...shadowSoft, backgroundColor: colors.paper, borderRadius: radius.xl, padding: 20, gap: 8 },
});
