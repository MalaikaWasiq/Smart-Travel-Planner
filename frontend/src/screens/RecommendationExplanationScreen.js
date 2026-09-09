import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import AppText from '../components/AppText';
import MarkdownText from '../components/MarkdownText';
import AppIcon from '../components/AppIcon';
import { colors, radius, shadowSoft, spacing } from '../theme';

export default function RecommendationExplanationScreen({ navigation, route }) {
  const item = route.params?.attraction || {};

  return (
    <View style={styles.page}>
      <ScreenHeader title="Why this was suggested" subtitle={item.title || item.place || 'Attraction'} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.score}>
          <AppText variant="display">{Number(item.score || 0).toFixed(2)}</AppText>
          <AppText variant="caption" color={colors.muted}>RANKING SCORE</AppText>
        </View>
        <View style={styles.card}>
          <AppIcon name="sparkles-outline" color={colors.green} size={26} />
          <AppText variant="heading">Recommendation reason</AppText>
          <MarkdownText color={colors.muted}>{item.reason || 'This attraction matched destination context, interests, available coordinates, and expected conditions.'}</MarkdownText>
        </View>
        <View style={styles.card}>
          <AppText variant="heading">Model provenance</AppText>
          <AppText color={colors.muted}>Model: {item.modelVersion || 'saved itinerary selection'}</AppText>
          <AppText color={colors.muted}>Fallback: {item.fallbackSource || 'none recorded'}</AppText>
          <AppText variant="caption" color={colors.muted}>The Pakistan ranker is a content-based cold-start model. It does not claim booking availability or collaborative accuracy for a new user.</AppText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, gap: 12 },
  score: { ...shadowSoft, backgroundColor: colors.mint, borderRadius: radius.xl, padding: 24, alignItems: 'center' },
  card: { ...shadowSoft, backgroundColor: colors.paper, borderRadius: radius.xl, padding: 20, gap: 8 },
});
