import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Pressable as TouchableOpacity, View } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import AppText from '../components/AppText';
import MarkdownText from '../components/MarkdownText';
import AppIcon from '../components/AppIcon';
import { apiRequest } from '../api/client';
import { useApp } from '../context/AppContext';
import { colors, radius, shadowSoft, spacing } from '../theme';

export default function ActivitySearchScreen({ navigation, route }) {
  const { token, currentTrip } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest('/recommendations', {
          method: 'POST',
          token,
          body: {
            city: currentTrip.destination,
            interests: currentTrip.interests,
            budget: currentTrip.budget,
            weather: currentTrip.weather,
            candidates: currentTrip.attractions,
            topK: 20,
          },
        });
        setItems(data.recommendations || []);
      } catch (error) {
        Alert.alert('Recommendations unavailable', error.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function choose(item) {
    navigation.navigate('ProposedChange', {
      day: route.params.day,
      activityIndex: route.params.activityIndex,
      replacement: {
        place: item.title,
        type: item.category || 'culture',
        description: item.summary || `Visit ${item.title}.`,
        estimatedCost: 0,
        latitude: item.latitude,
        longitude: item.longitude,
      },
      attraction: item,
    });
  }

  return (
    <View style={styles.page}>
      <ScreenHeader title="Replace activity" subtitle="Ranked candidates for your preferences" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? <ActivityIndicator color={colors.forest} /> : items.map((item, index) => (
          <TouchableOpacity key={item.id || item.title} style={styles.card} onPress={() => choose(item)}>
            {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} /> : <View style={styles.placeholder}><AppIcon name="location-outline" color={colors.green} /></View>}
            <View style={styles.copy}>
              <AppText variant="caption" color={colors.green}>#{index + 1} | {item.category?.toUpperCase()}</AppText>
              <AppText variant="bodyStrong">{item.title}</AppText>
              <MarkdownText compact variant="caption" color={colors.muted} numberOfLines={2}>{item.reason}</MarkdownText>
            </View>
            <AppIcon name="chevron-forward" color={colors.muted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, gap: 9 },
  card: { ...shadowSoft, backgroundColor: colors.paper, borderRadius: radius.lg, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 11 },
  image: { width: 62, height: 62, borderRadius: radius.md },
  placeholder: { width: 62, height: 62, borderRadius: radius.md, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
});
