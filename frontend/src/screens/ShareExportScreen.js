import React, { useState } from 'react';
import { Alert, Linking, Platform, ScrollView, Share, StyleSheet, Pressable as TouchableOpacity, View } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ScreenHeader from '../components/ScreenHeader';
import AppText from '../components/AppText';
import MarkdownText from '../components/MarkdownText';
import AppIcon from '../components/AppIcon';
import { useApp } from '../context/AppContext';
import { escapeHtml, markdownToHtml, markdownToPlainText } from '../utils/markdown';
import { colors, radius, shadowSoft, spacing, fonts } from '../theme';

function formatWhatsAppText(trip) {
  const nights = Math.max(1, Number(trip?.days || 1) - 1);
  const vehicle = trip?.vehicleDetails || {};

  const lines = [
    ` *SMART TRAVEL PLANNER PAKISTAN* `,
    `----------------------------------------`,
    ` *Destination:* ${trip?.destination || 'Pakistan'}`,
    ` *Starting From:* ${trip?.startLocation || 'Islamabad / Rawalpindi'}`,
    ` *Duration:* ${trip?.days} Days (${nights} Nights)`,
    ` *Travelers:* ${trip?.numberOfPersons || 1} Persons`,
    ` *Total Estimated Package:* PKR ${Number(trip?.budgetBreakdown?.totalEstimated || trip?.budget || 0).toLocaleString()}`,
    ` *Per Person Cost:* PKR ${Number(trip?.budgetBreakdown?.packageDetails?.pricePerPerson || Math.round(Number(trip?.budget || 0) / Math.max(1, trip?.numberOfPersons || 1))).toLocaleString()}`,
    ``,
    ` *SERVICES BREAKDOWN:*`,
    `• Transport: ${vehicle.name || 'Dedicated Vehicle'} (${vehicle.capacity || 'Passengers'}, ${vehicle.driverIncluded ? 'With Mountain Driver' : 'Self-Drive'})`,
    `• Hotel: ${trip?.selectedHotel?.name || 'Verified Curated Hotel'} (${trip?.budgetBreakdown?.roomsQuantity || 1} Room(s))`,
    `• Food: ${trip?.foodPlan?.dinnerTotal > 0 ? 'Breakfast + Dinner Included' : 'Self-Arranged Meals'}`,
    `• Sights & Activities: ${trip?.budgetBreakdown?.activitiesPolicy?.policy || 'Standard Sightseeing & Viewpoints'}`,
    ``,
    ` *DAY-WISE ITINERARY:*`,
  ];

  (trip?.itinerary || []).forEach((day) => {
    lines.push(`\n *Day ${day.day}: ${markdownToPlainText(day.title)}*`);
    if (day.weatherNote) lines.push(` Weather: ${markdownToPlainText(day.weatherNote)}`);
    (day.activities || []).forEach((act) => {
      const block = act.timeBlock ? `[${act.timeBlock}] ` : '';
      lines.push(`  • ${block}${act.time} - ${act.place} (PKR ${Number(act.estimatedCost || 0).toLocaleString()})`);
      if (act.description) lines.push(`    _${markdownToPlainText(act.description)}_`);
    });
  });

  lines.push(`\n Generated via Smart Travel Planner Pakistan`);
  lines.push(` Need assistance? Bookings & emergency helpline available 24/7.`);
  return lines.join('\n');
}

function tripHtml(trip) {
  const nights = Math.max(1, Number(trip?.days || 1) - 1);
  const totalCost = Number(trip?.budgetBreakdown?.totalEstimated || trip?.budget || 0);
  const perPerson = Math.round(totalCost / Math.max(1, Number(trip?.numberOfPersons || 1)));

  const days = (trip?.itinerary || []).map((day) => `
    <section class="day-section">
      <div class="day-header">
        <h2>Day ${Number(day.day)}: ${escapeHtml(markdownToPlainText(day.title))}</h2>
        ${day.weatherNote ? `<div class="weather"> ${markdownToHtml(day.weatherNote)}</div>` : ''}
      </div>
      <div class="activities">
        ${(day.activities || []).map((activity) => `
          <div class="activity-item">
            <div class="activity-top">
              <strong>${activity.timeBlock ? `<span class="time-block">${escapeHtml(activity.timeBlock)}</span> ` : ''}${escapeHtml(activity.time)} — ${escapeHtml(activity.place)}</strong>
              <span class="cost">PKR ${Number(activity.estimatedCost || 0).toLocaleString()}</span>
            </div>
            <div class="desc">${markdownToHtml(activity.description || '')}</div>
          </div>
        `).join('')}
      </div>
    </section>`).join('');

  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(trip?.destination || 'Trip')} Itinerary</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; padding: 36px; line-height: 1.5; background: #fff; }
          .header { border-bottom: 3px solid #15803d; padding-bottom: 16px; margin-bottom: 24px; }
          h1 { color: #166534; margin: 0 0 6px 0; font-size: 26px; }
          .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
          .meta-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
          .meta-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; }
          .meta-val { font-size: 16px; color: #0f172a; font-weight: bold; margin-top: 2px; }
          .day-section { page-break-inside: avoid; border: 1px solid #cbd5e1; border-radius: 10px; margin-bottom: 18px; padding: 16px; }
          .day-header { border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; }
          .day-header h2 { margin: 0; color: #15803d; font-size: 18px; }
          .weather { color: #0369a1; font-size: 12px; margin-top: 4px; }
          .activity-item { padding: 8px 0; border-bottom: 1px dashed #e2e8f0; }
          .activity-item:last-child { border-bottom: none; }
          .activity-top { display: flex; justify-content: space-between; align-items: center; }
          .time-block { background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; }
          .cost { font-weight: bold; color: #15803d; font-size: 13px; }
          .desc { font-size: 12px; color: #475569; margin-top: 3px; }
          .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1> ${escapeHtml(trip?.destination || 'Pakistan')} — Complete Travel Plan</h1>
          <p style="margin: 0; color: #475569; font-size: 13px;">Journey Origin: <strong>${escapeHtml(trip?.startLocation || 'Islamabad')}</strong> • Mode: <strong>${escapeHtml(trip?.tripMode === 'company' ? 'Company Tour Package' : 'Customized Trip')}</strong></p>
        </div>

        <div class="meta-grid">
          <div class="meta-card">
            <div class="meta-label">Duration</div>
            <div class="meta-val">${Number(trip?.days || 1)} Days (${nights} Nights)</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Travelers</div>
            <div class="meta-val">${Number(trip?.numberOfPersons || 1)} Persons</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Total Cost</div>
            <div class="meta-val">PKR ${totalCost.toLocaleString()}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Per Person</div>
            <div class="meta-val">PKR ${perPerson.toLocaleString()}</div>
          </div>
        </div>

        ${days}

        <div class="footer">
          Generated with Smart Travel Planner Pakistan. Verified local rates in PKR.
        </div>
      </body>
    </html>`;
}

export default function ShareExportScreen({ navigation }) {
  const { currentTrip } = useApp();
  const [busy, setBusy] = useState(false);

  async function shareWhatsApp() {
    try {
      const text = formatWhatsAppText(currentTrip);
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('WhatsApp Share Failed', error.message);
    }
  }

  async function shareText() {
    try {
      await Share.share({
        title: `${currentTrip?.destination} Travel Plan`,
        message: formatWhatsAppText(currentTrip),
      });
    } catch (error) {
      Alert.alert('Share failed', error.message);
    }
  }

  async function exportPdf() {
    setBusy(true);
    try {
      if (Platform.OS === 'web') {
        // Direct native browser Print / Save-as-PDF dialog
        await Print.printAsync({ html: tripHtml(currentTrip) });
        return;
      }
      const result = await Print.printToFileAsync({ html: tripHtml(currentTrip) });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', dialogTitle: 'Share Itinerary PDF' });
      } else {
        Alert.alert('PDF Created', `Saved to ${result.uri}`);
      }
    } catch (error) {
      Alert.alert('PDF Export Failed', error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.page}>
      <ScreenHeader
        title="Share & Export Trip"
        subtitle={currentTrip?.destination || 'Your Pakistan Journey'}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.preview}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <AppText variant="title">{currentTrip?.destination}</AppText>
              <AppText color={colors.muted}>
                {currentTrip?.days} days ({Math.max(1, (currentTrip?.days || 1) - 1)} nights) • {currentTrip?.numberOfPersons || 1} travelers
              </AppText>
            </View>
            <View style={styles.badgeCost}>
              <AppText style={styles.badgeCostText}>
                PKR {Number(currentTrip?.budgetBreakdown?.totalEstimated || currentTrip?.budget || 0).toLocaleString()}
              </AppText>
            </View>
          </View>

          <View style={styles.divider} />

          {(currentTrip?.itinerary || []).map((day) => (
            <View key={day.day} style={styles.day}>
              <MarkdownText compact variant="bodyStrong">{`Day ${day.day}: ${day.title}`}</MarkdownText>
              <AppText variant="caption" color={colors.muted}>
                {(day.activities || []).map((act) => `${act.timeBlock ? `[${act.timeBlock}] ` : ''}${act.place}`).join(' • ')}
              </AppText>
            </View>
          ))}
        </View>

        {/* 1. SHARE ON WHATSAPP BUTTON (PROMINENT ACTION) */}
        <TouchableOpacity style={styles.whatsappBtn} onPress={shareWhatsApp} activeOpacity={0.85}>
          <AppIcon name="logo-whatsapp" size={22} color="#ffffff" />
          <AppText style={styles.whatsappBtnText}>SHARE ON WHATSAPP</AppText>
        </TouchableOpacity>

        {/* 2. EXPORT PDF BUTTON */}
        <TouchableOpacity style={styles.pdfBtn} onPress={exportPdf} disabled={busy} activeOpacity={0.85}>
          <AppIcon name="document-text-outline" size={20} color="#ffffff" />
          <AppText style={styles.pdfBtnText}>{busy ? 'GENERATING PDF...' : 'DOWNLOAD / PRINT PDF'}</AppText>
        </TouchableOpacity>

        {/* 3. SYSTEM SHARE */}
        <TouchableOpacity style={styles.systemBtn} onPress={shareText} activeOpacity={0.85}>
          <AppIcon name="share-social-outline" size={18} color={colors.forest} />
          <AppText style={styles.systemBtnText}>OTHER SHARE OPTIONS</AppText>
        </TouchableOpacity>

        <AppText variant="caption" color={colors.muted} style={styles.disclaimer}>
          PDF export and WhatsApp summary include full service breakdown, vehicle details & daily schedule.
        </AppText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, gap: 12 },
  preview: {
    ...shadowSoft,
    backgroundColor: colors.paper,
    borderRadius: radius.xl,
    padding: 18,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeCost: {
    backgroundColor: '#dcfce7',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeCostText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  day: {
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    paddingTop: 8,
    marginTop: 4,
    gap: 2,
  },
  whatsappBtn: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...shadowSoft,
  },
  whatsappBtnText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  pdfBtn: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.forest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...shadowSoft,
  },
  pdfBtnText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  systemBtn: {
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.forest,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  systemBtnText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.forest,
    letterSpacing: 0.5,
  },
  disclaimer: { textAlign: 'center', marginTop: 4 },
});
