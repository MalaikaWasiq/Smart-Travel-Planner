import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const CATEGORIES = [
  { name: 'Hotels',     color: '#1a7a4a', spent: 13000 },
  { name: 'Food',       color: '#f57c00', spent: 8000  },
  { name: 'Transport',  color: '#1565c0', spent: 4000  },
  { name: 'Activities', color: '#6a1b9a', spent: 5000  },
];

const DAILY = [
  { day: 'Day 1', date: 'Oct 26', total: 7000 },
  { day: 'Day 2', date: 'Oct 27', total: 5000 },
  { day: 'Day 3', date: 'Oct 28', total: 5000 },
];

export default function BudgetScreen() {
  const totalBudget  = 50000;
  const totalSpent   = CATEGORIES.reduce((s, c) => s + c.spent, 0);
  const remaining    = totalBudget - totalSpent;
  const spentPercent = Math.round((totalSpent / totalBudget) * 100);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient colors={['#0d5c2e', '#25a865']} style={styles.header}>
        <Text style={styles.headerTitle}>Budget Tracker</Text>
        <Text style={styles.headerSub}>Stay within your limits</Text>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, { backgroundColor: '#e8f5e9' }]}>
            <Text style={styles.summaryLabel}>Total Budget</Text>
            <Text style={[styles.summaryValue, { color: '#1a7a4a' }]}>PKR {totalBudget.toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#fff3e0' }]}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={[styles.summaryValue, { color: '#e65100' }]}>PKR {totalSpent.toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#e3f2fd' }]}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text style={[styles.summaryValue, { color: '#1565c0' }]}>PKR {remaining.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.progressTop}>
            <Text style={styles.progressLabel}>Spent {spentPercent}% of budget</Text>
            <Text style={styles.progressPercent}>{spentPercent}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: spentPercent + '%', backgroundColor: spentPercent > 80 ? '#e53935' : '#1a7a4a' }]} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          {CATEGORIES.map(cat => (
            <View key={cat.name} style={styles.catRow}>
              <View style={[styles.catDot, { backgroundColor: cat.color }]} />
              <Text style={styles.catName}>{cat.name}</Text>
              <View style={styles.catBarWrap}>
                <View style={[styles.catBar, { width: Math.round((cat.spent / totalSpent) * 100) + '%', backgroundColor: cat.color }]} />
              </View>
              <Text style={styles.catAmount}>PKR {cat.spent.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Spending</Text>
          {DAILY.map((d, idx) => (
            <View key={idx} style={styles.dailyRow}>
              <View>
                <Text style={styles.dailyDay}>{d.day}</Text>
                <Text style={styles.dailyDate}>{d.date}</Text>
              </View>
              <Text style={styles.dailyTotal}>PKR {d.total.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f5f5f5' },
  header:         { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle:    { fontSize: 24, color: '#fff', fontWeight: '800' },
  headerSub:      { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  scroll:         { flex: 1, padding: 14 },
  summaryCards:   { flexDirection: 'row', gap: 8, marginBottom: 12 },
  summaryCard:    { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  summaryLabel:   { fontSize: 11, color: '#666', marginBottom: 4 },
  summaryValue:   { fontSize: 13, fontWeight: '800' },
  section:        { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  progressTop:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel:  { fontSize: 13, color: '#555' },
  progressPercent:{ fontSize: 13, fontWeight: '700', color: '#1a7a4a' },
  progressBar:    { height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, overflow: 'hidden' },
  progressFill:   { height: '100%', borderRadius: 5 },
  sectionTitle:   { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 14 },
  catRow:         { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  catDot:         { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  catName:        { width: 80, fontSize: 13, color: '#555' },
  catBarWrap:     { flex: 1, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden', marginHorizontal: 8 },
  catBar:         { height: '100%', borderRadius: 4 },
  catAmount:      { fontSize: 12, fontWeight: '600', color: '#333', width: 80, textAlign: 'right' },
  dailyRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  dailyDay:       { fontSize: 14, fontWeight: '700', color: '#222' },
  dailyDate:      { fontSize: 12, color: '#888' },
  dailyTotal:     { fontSize: 14, fontWeight: '700', color: '#1a7a4a' },
});