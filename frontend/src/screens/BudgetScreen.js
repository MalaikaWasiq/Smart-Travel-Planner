import React from 'react';
import { ScrollView, StyleSheet, Pressable as TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScreenHeader from '../components/ScreenHeader';
import EmptyTrip from '../components/EmptyTrip';
import { useApp } from '../context/AppContext';
import { colors, shadow } from '../theme';
import Text from '../components/AppText';
import MarkdownText from '../components/MarkdownText';

const categories = [
  ['Hotels', 'hotels', colors.green], ['Food', 'food', colors.amber], ['Transport', 'transport', colors.blue],
  ['Activities', 'activities', '#76548b'], ['Contingency', 'misc', '#8b6b4d'],
];

export default function BudgetScreen({ navigation }) {
  const { currentTrip } = useApp();
  if (!currentTrip) return <View style={styles.page}><ScreenHeader title="Budget" subtitle="Trip cost estimate" /><EmptyTrip /></View>;
  const breakdown = currentTrip.budgetBreakdown || {};
  const used = Number(breakdown.totalEstimated || 0);
  const budget = Number(currentTrip.budget || 0);
  const percentage = Math.max(0, Number(breakdown.percentUsed ?? (budget ? Math.round((used / budget) * 100) : 0)));

  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <ScreenHeader title="Budget estimate" subtitle={`${currentTrip.destination}, ${breakdown.currency || 'PKR'}`} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>PLANNED TOTAL</Text><Text style={styles.total}>PKR {used.toLocaleString()}</Text>
          <Text style={[styles.remaining, breakdown.exceeded && styles.over]}>{breakdown.exceeded ? `Over by PKR ${Number(breakdown.overBy || 0).toLocaleString()}` : `PKR ${Number(breakdown.remaining || 0).toLocaleString()} remaining`}</Text>
          <View style={styles.track}><View style={[styles.fill, { width: `${Math.min(percentage, 100)}%` }, percentage > 100 && styles.fillOver]} /></View>
          <Text style={styles.percent}>{percentage}% of PKR {budget.toLocaleString()}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Cost breakdown</Text>
          {categories.map(([label, key, color]) => {
            const value = Number(breakdown[key] || 0);
            return <View key={key} style={styles.row}><View style={[styles.dot, { backgroundColor: color }]} /><Text style={styles.label}>{label}</Text><View style={styles.miniTrack}><View style={[styles.miniFill, { backgroundColor: color, width: `${used ? Math.min(100, Math.round((value / used) * 100)) : 0}%` }]} /></View><Text style={styles.value}>{value.toLocaleString()}</Text></View>;
          })}
        </View>
        <View style={styles.actualCard}><View><Text style={styles.title}>Actual spending</Text><Text style={styles.actual}>PKR {Number(breakdown.actualSpent || 0).toLocaleString()}</Text><Text style={[styles.remaining, breakdown.actualExceeded && styles.over]}>{breakdown.actualExceeded ? `Over by PKR ${Number(breakdown.actualOverBy || 0).toLocaleString()}` : `PKR ${Number(breakdown.actualRemaining ?? budget).toLocaleString()} left`}</Text></View><TouchableOpacity style={styles.expenseButton} onPress={() => navigation.navigate('ExpenseHistory')}><Text style={styles.expenseText}>TRACK EXPENSES</Text></TouchableOpacity></View>
        <View style={styles.note}><MarkdownText compact variant="caption" color={colors.muted}>{breakdown.note || 'These figures are planning estimates and are not booking quotes.'}</MarkdownText></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream }, content: { padding: 16, paddingBottom: 34 }, heroCard: { ...shadow, backgroundColor: colors.forest, borderRadius: 22, padding: 21 }, eyebrow: { color: '#aedaBD', fontSize: 10, fontWeight: '900', letterSpacing: 1.3 }, total: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 5 }, remaining: { color: '#cce7d7', fontWeight: '800', marginTop: 4 }, over: { color: '#ffd2cd' }, track: { height: 9, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden', marginTop: 18 }, fill: { height: '100%', backgroundColor: '#7fd3a3' }, fillOver: { backgroundColor: '#ee8177' }, percent: { color: '#dff3e8', fontSize: 11, marginTop: 7 }, card: { ...shadow, backgroundColor: colors.paper, borderRadius: 20, padding: 18, marginTop: 15 }, title: { color: colors.ink, fontSize: 20, fontWeight: '900', marginBottom: 8 }, row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderTopWidth: 1, borderColor: colors.line }, dot: { width: 9, height: 9, borderRadius: 5, marginRight: 8 }, label: { width: 75, color: colors.ink, fontWeight: '700', fontSize: 12 }, miniTrack: { flex: 1, height: 6, borderRadius: 4, overflow: 'hidden', backgroundColor: '#e9ece7', marginHorizontal: 8 }, miniFill: { height: '100%' }, value: { width: 68, textAlign: 'right', color: colors.ink, fontSize: 12, fontWeight: '800' }, note: { padding: 12 },
  actualCard: { ...shadow, backgroundColor: colors.blue, borderRadius: 20, padding: 18, marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, actual: { color: '#fff', fontSize: 25, fontWeight: '900' }, expenseButton: { backgroundColor: '#fff', borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11 }, expenseText: { color: colors.blue, fontWeight: '900', fontSize: 10 },
});
