import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TextInput, Pressable as TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScreenHeader from '../components/ScreenHeader';
import PrimaryButton from '../components/PrimaryButton';
import AppText from '../components/AppText';
import AppIcon from '../components/AppIcon';
import { useApp } from '../context/AppContext';
import { colors, fonts, radius, shadowSoft, spacing } from '../theme';

const interestOptions = ['History', 'Food', 'Nature', 'Adventure', 'Shopping', 'Culture'];
const hotelOptions = ['Any', 'Budget', 'Mid-range', 'Luxury', 'Boutique'];

export default function TravelPreferencesScreen({ navigation }) {
  const { user, updatePreferences } = useApp();
  const saved = user?.preferences || {};
  const [budget, setBudget] = useState(saved.defaultBudget ? String(saved.defaultBudget) : '75000');
  const [interests, setInterests] = useState(saved.interests || []);
  const [hotelType, setHotelType] = useState(saved.preferredHotelType || 'Any');
  const [dataConsent, setDataConsent] = useState(saved.dataConsent !== false);
  const [reducedMotion, setReducedMotion] = useState(Boolean(saved.reducedMotion));
  const [largeText, setLargeText] = useState(Boolean(saved.largeText));
  const [saving, setSaving] = useState(false);

  function toggleInterest(value) {
    setInterests((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  async function save() {
    const defaultBudget = Number(budget);
    if (!Number.isFinite(defaultBudget) || defaultBudget < 0) return Alert.alert('Invalid budget', 'Enter a valid default budget in PKR.');
    setSaving(true);
    try {
      await updatePreferences({ defaultBudget, interests, preferredHotelType: hotelType, dataConsent, reducedMotion, largeText });
      Alert.alert('Preferences saved', 'New trip forms can now use these travel defaults.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) { Alert.alert('Could not save preferences', error.message); }
    finally { setSaving(false); }
  }

  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <ScreenHeader title="Travel preferences" subtitle="Personalize future trip planning" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.titleRow}><View style={styles.icon}><AppIcon name="wallet-outline" color={colors.forest} /></View><View><AppText variant="heading">Default budget</AppText><AppText variant="caption" color={colors.muted}>Used as a starting value for new trips</AppText></View></View>
          <AppText variant="label" style={styles.label}>BUDGET IN PKR</AppText>
          <TextInput value={budget} onChangeText={setBudget} keyboardType="numeric" placeholder="75000" placeholderTextColor="#96a29b" style={styles.input} />
        </View>
        <View style={styles.card}><AppText variant="heading">Privacy and accessibility</AppText>{[["Share recommendation interactions",dataConsent,setDataConsent,"Used only for pseudonymous recommendation research."],["Reduce motion",reducedMotion,setReducedMotion,"Avoid optional staged animations."],["Prefer larger text",largeText,setLargeText,"Records your accessibility preference for future scaling."]].map(([label,value,setter,help])=><View key={label} style={styles.switchRow}><View style={{flex:1}}><AppText variant="bodyStrong">{label}</AppText><AppText variant="caption" color={colors.muted}>{help}</AppText></View><Switch accessibilityLabel={label} value={value} onValueChange={setter} trackColor={{true:colors.green}} /></View>)}</View>

        <View style={styles.card}>
          <AppText variant="heading">What do you enjoy?</AppText>
          <AppText variant="caption" color={colors.muted} style={styles.help}>Choose any interests that should influence future plans.</AppText>
          <View style={styles.options}>{interestOptions.map((value) => { const selected = interests.includes(value); return <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: selected }} key={value} style={[styles.option, selected && styles.optionOn]} onPress={() => toggleInterest(value)}><AppText variant="label" color={selected ? colors.white : colors.ink}>{value}</AppText></TouchableOpacity>; })}</View>
        </View>

        <View style={styles.card}>
          <AppText variant="heading">Preferred stay</AppText>
          <View style={styles.options}>{hotelOptions.map((value) => { const selected = hotelType === value; return <TouchableOpacity accessibilityRole="radio" accessibilityState={{ selected }} key={value} style={[styles.option, selected && styles.optionOn]} onPress={() => setHotelType(value)}><AppText variant="label" color={selected ? colors.white : colors.ink}>{value}</AppText></TouchableOpacity>; })}</View>
        </View>
        <PrimaryButton title="SAVE PREFERENCES" onPress={save} loading={saving} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream }, content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: { ...shadowSoft, backgroundColor: colors.paper, borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center' }, icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  label: { marginTop: spacing.xl, marginBottom: spacing.sm },
  input: { minHeight: 50, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: '#f7f8f5', color: colors.ink, fontFamily: fonts.semibold, fontSize: 16, paddingHorizontal: spacing.md },
  help: { marginTop: 3 }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  option: { minHeight: 42, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: '#f7f8f5', paddingHorizontal: spacing.lg },
  optionOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  switchRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: spacing.sm },
});
