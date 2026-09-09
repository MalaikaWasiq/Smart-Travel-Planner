import React, { useState } from 'react';
import { Alert, Platform, ScrollView, Share, StyleSheet, Pressable as TouchableOpacity, View } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ScreenHeader from '../components/ScreenHeader';
import AppText from '../components/AppText';
import MarkdownText from '../components/MarkdownText';
import AppIcon from '../components/AppIcon';
import { useApp } from '../context/AppContext';
import { escapeHtml, markdownToHtml, markdownToPlainText } from '../utils/markdown';
import { colors, radius, shadowSoft, spacing } from '../theme';

function tripText(trip) {
  return [
    `${trip.destination} - ${trip.days} day itinerary`,
    `Budget: PKR ${Number(trip.budget).toLocaleString()}`,
    ...(trip.itinerary || []).flatMap((day) => [
      `\nDay ${day.day}: ${markdownToPlainText(day.title)}`,
      markdownToPlainText(day.weatherNote),
      ...(day.activities || []).flatMap((activity) => [
        `${activity.time} - ${activity.place} (PKR ${Number(activity.estimatedCost || 0).toLocaleString()})`,
        markdownToPlainText(activity.description),
      ]),
    ]),
  ].filter(Boolean).join('\n');
}

function tripHtml(trip) {
  const days = (trip.itinerary || []).map((day) => `
    <section>
      <h2>Day ${Number(day.day)}: ${escapeHtml(markdownToPlainText(day.title))}</h2>
      <div class="weather">${markdownToHtml(day.weatherNote)}</div>
      <ul>${(day.activities || []).map((activity) => `
        <li>
          <strong>${escapeHtml(activity.time)} - ${escapeHtml(activity.place)}</strong>
          <div>${markdownToHtml(activity.description)}</div>
          <span>Estimated PKR ${Number(activity.estimatedCost || 0).toLocaleString()}</span>
        </li>`).join('')}
      </ul>
    </section>`).join('');

  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #183029; padding: 32px; line-height: 1.45; }
          h1, h2, h3, h4 { color: #174f36; }
          h1 { border-bottom: 4px solid #26845b; padding-bottom: 12px; }
          section { page-break-inside: avoid; }
          li { margin: 12px 0; }
          p { margin: 4px 0; }
          blockquote { border-left: 3px solid #26845b; color: #697a73; margin-left: 0; padding-left: 12px; }
          code { background: #f7f3e8; padding: 1px 4px; }
          .weather, .note { color: #697a73; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(trip.destination)} Travel Plan</h1>
        <p>${Number(trip.days)} days | Budget PKR ${Number(trip.budget).toLocaleString()}</p>
        ${days}
        <p class="note">Generated recommendations and costs are estimates. Verify before booking.</p>
      </body>
    </html>`;
}

export default function ShareExportScreen({ navigation }) {
  const { currentTrip } = useApp();
  const [busy, setBusy] = useState(false);

  async function shareText() {
    try {
      await Share.share({ title: `${currentTrip.destination} itinerary`, message: tripText(currentTrip) });
    } catch (error) {
      Alert.alert('Share failed', error.message);
    }
  }

  async function exportPdf() {
    setBusy(true);
    try {
      const result = await Print.printToFileAsync({ html: tripHtml(currentTrip) });
      if (Platform.OS === 'web') {
        Alert.alert('PDF created', 'Use the browser print/download dialog to save it.');
        return;
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', dialogTitle: 'Share itinerary PDF' });
      } else {
        Alert.alert('PDF created', result.uri);
      }
    } catch (error) {
      Alert.alert('PDF export failed', error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.page}>
      <ScreenHeader title="Share and export" subtitle={currentTrip?.destination || 'Current trip'} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.preview}>
          <AppText variant="title">{currentTrip?.destination}</AppText>
          <AppText color={colors.muted}>{currentTrip?.days} days | {(currentTrip?.itinerary || []).reduce((count, day) => count + (day.activities?.length || 0), 0)} stops</AppText>
          {(currentTrip?.itinerary || []).map((day) => (
            <View key={day.day} style={styles.day}>
              <MarkdownText compact variant="bodyStrong">{`Day ${day.day}: ${day.title}`}</MarkdownText>
              <AppText variant="caption" color={colors.muted}>{(day.activities || []).map((activity) => activity.place).join(' | ')}</AppText>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.primary} onPress={shareText}>
          <AppIcon name="share-social" color={colors.white} />
          <AppText variant="label" color={colors.white}>SYSTEM SHARE</AppText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondary} onPress={exportPdf} disabled={busy}>
          <AppIcon name="document-text-outline" color={colors.forest} />
          <AppText variant="label" color={colors.forest}>{busy ? 'CREATING PDF...' : 'EXPORT PDF'}</AppText>
        </TouchableOpacity>
        <AppText variant="caption" color={colors.muted} style={styles.disclaimer}>Export includes itinerary details but does not represent confirmed bookings.</AppText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, gap: 10 },
  preview: { ...shadowSoft, backgroundColor: colors.paper, borderRadius: radius.xl, padding: 20, gap: 5, marginBottom: 7 },
  day: { borderTopWidth: 1, borderColor: colors.line, paddingTop: 11, marginTop: 7, gap: 3 },
  primary: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.forest, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondary: { minHeight: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.forest, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  disclaimer: { textAlign: 'center' },
});
