import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, Pressable as TouchableOpacity, View } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import AppText from '../components/AppText';
import MarkdownText from '../components/MarkdownText';
import AppIcon from '../components/AppIcon';
import { colors, radius, shadowSoft, spacing } from '../theme';

export default function AttractionDetailScreen({ navigation, route }) {
  const item = route.params?.attraction || {};

  return (
    <View style={styles.page}>
      <ScreenHeader title={item.title || item.place || 'Attraction'} subtitle="Live tourism context" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} accessibilityLabel={`Photo of ${item.title}`} /> : null}
        <View style={styles.card}>
          <AppText variant="heading">About this stop</AppText>
          <MarkdownText color={colors.muted}>{item.summary || item.description || 'No Wikipedia summary is available for this saved activity.'}</MarkdownText>
          {Number.isFinite(item.latitude) ? <AppText variant="caption" color={colors.muted}>{item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}</AppText> : null}
          {item.wikipediaUrl ? (
            <TouchableOpacity style={styles.button} onPress={() => Linking.openURL(item.wikipediaUrl)}>
              <AppIcon name="open-outline" color={colors.white} />
              <AppText variant="label" color={colors.white}>OPEN WIKIPEDIA SOURCE</AppText>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.explain} onPress={() => navigation.navigate('RecommendationExplanation', { attraction: item })}>
            <AppIcon name="sparkles-outline" color={colors.forest} />
            <AppText variant="label" color={colors.forest}>WHY THIS WAS SUGGESTED</AppText>
          </TouchableOpacity>
        </View>
        <AppText variant="caption" color={colors.muted}>Attraction summaries and images are sourced from Wikipedia/MediaWiki. Verify opening hours and entry prices directly.</AppText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, gap: 12 },
  image: { width: '100%', height: 230, borderRadius: radius.xl, backgroundColor: colors.line },
  card: { ...shadowSoft, backgroundColor: colors.paper, borderRadius: radius.xl, padding: 20, gap: 10 },
  button: { minHeight: 50, borderRadius: radius.md, backgroundColor: colors.forest, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 5 },
  explain: { minHeight: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.forest, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
