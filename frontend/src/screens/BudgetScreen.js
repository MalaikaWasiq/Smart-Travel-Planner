import React, { useMemo, useState } from 'react';
import {
  ImageBackground,
  Platform,
  Pressable as TouchableOpacity,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../components/ScreenHeader';
import AppIcon from '../components/AppIcon';
import { useApp } from '../context/AppContext';
import { colors, fonts, radius, shadow } from '../theme';
import Text from '../components/AppText';
import MarkdownText from '../components/MarkdownText';
import { navigateRoot } from '../navigation/navigationRef';

const natureBg = require('../../assets/splash_nature_bg.jpg');

// Regional presets across Pakistan with real-world cost multipliers
const PAKISTAN_REGIONS = [
  { id: 'hunza', name: 'Hunza Valley', category: 'Northern Areas', tag: 'Alpine & Lakes', multiplier: 1.15, icon: 'snow-outline' },
  { id: 'skardu', name: 'Skardu & Baltistan', category: 'Northern Areas', tag: 'High Altitude Desert', multiplier: 1.25, icon: 'trail-sign-outline' },
  { id: 'swat', name: 'Swat Valley & Kalam', category: 'Northern Areas', tag: 'Green Meadows & Valleys', multiplier: 0.92, icon: 'leaf-outline' },
  { id: 'naran', name: 'Naran & Kaghan', category: 'Adventure & Nature', tag: 'Babusar & Lakes', multiplier: 1.05, icon: 'water-outline' },
  { id: 'neelum', name: 'Neelum Valley, Kashmir', category: 'Northern Areas', tag: 'Lush Rivers & Pine Woods', multiplier: 0.90, icon: 'map-outline' },
  { id: 'lahore', name: 'Lahore & Punjab', category: 'Cultural & Historical', tag: 'Food & Historical Forts', multiplier: 0.85, icon: 'business-outline' },
  { id: 'gwadar', name: 'Gwadar & Makran Coast', category: 'Coastal Areas', tag: 'Beaches & Ocean Drive', multiplier: 1.10, icon: 'sunny-outline' },
];

const TRAVEL_TIERS = [
  {
    id: 'backpacker',
    title: ' Backpacker / Solo',
    badge: 'Budget Friendly',
    badgeColor: '#26845b',
    dailyPerPerson: 6500,
    breakdownPercents: { hotels: 32, transport: 30, food: 22, activities: 10, misc: 6 },
    hotelDesc: 'Clean guesthouses, standard room or hostel',
    transportDesc: 'Public coaster / Shared Hiace / Local transit',
    foodDesc: 'Local food streets, chai dhabas & biryani spots',
  },
  {
    id: 'comfort',
    title: ' Comfort / Family',
    badge: 'Most Popular',
    badgeColor: '#174f36',
    dailyPerPerson: 18500,
    breakdownPercents: { hotels: 38, transport: 28, food: 18, activities: 10, misc: 6 },
    hotelDesc: '3-Star standard hotel / Private family cottage',
    transportDesc: 'Private Toyota GLi / Honda BR-V with driver & fuel',
    foodDesc: 'Quality family restaurants, trout fish & barbecues',
  },
  {
    id: 'luxury',
    title: ' Luxury Mountain Resort',
    badge: 'Premium Experience',
    badgeColor: '#c87a24',
    dailyPerPerson: 45000,
    breakdownPercents: { hotels: 42, transport: 28, food: 15, activities: 10, misc: 5 },
    hotelDesc: '4-5 Star Serena / Pearl Continental / Shangrila Resort',
    transportDesc: 'Private 4x4 Prado / Land Cruiser / HiAce with guide',
    foodDesc: 'Fine dining resorts, buffets & continental meals',
  },
];

const DURATION_OPTIONS = [
  { days: 3, label: '3 Days', desc: 'Weekend Getaway' },
  { days: 5, label: '5 Days', desc: 'Standard Explorer' },
  { days: 7, label: '7 Days', desc: 'Full Week Tour' },
  { days: 10, label: '10 Days', desc: 'Deep Expedition' },
  { days: 14, label: '14 Days', desc: 'Grand Voyage' },
];

const TRAVELER_OPTIONS = [
  { count: 1, label: '1 Person', desc: 'Solo' },
  { count: 2, label: '2 Persons', desc: 'Couple' },
  { count: 4, label: '4 Persons', desc: 'Family' },
  { count: 6, label: '6 Persons', desc: 'Group' },
  { count: 8, label: '8 Persons', desc: 'Tour Party' },
];

function getBudgetCategories(trip, breakdown) {
  return [
    ['Hotels', 'hotels', colors.green, 'bed-outline'],
    ['Food', 'food', colors.amber, 'restaurant-outline'],
    ['Transport', 'transport', colors.blue, 'car-outline'],
    ['Activities', 'activities', '#76548b', 'compass-outline'],
    ['Contingency', 'misc', '#8b6b4d', 'shield-checkmark-outline'],
  ];
}

export default function BudgetScreen({ navigation }) {
  const { currentTrip, trips, openTrip } = useApp();
  const { width: windowWidth } = useWindowDimensions();
  const isWide = windowWidth >= 768;

  // View Mode: 'trip' (current active trip) or 'calculator' (Pakistan Budget Estimator)
  const [activeTab, setActiveTab] = useState(currentTrip ? 'trip' : 'calculator');

  // Calculator State
  const [selectedRegionId, setSelectedRegionId] = useState('hunza');
  const [selectedTierId, setSelectedTierId] = useState('comfort');
  const [selectedDays, setSelectedDays] = useState(5);
  const [travelersCount, setTravelersCount] = useState(2);

  // Selected region object
  const selectedRegion = useMemo(() => {
    return PAKISTAN_REGIONS.find((r) => r.id === selectedRegionId) || PAKISTAN_REGIONS[0];
  }, [selectedRegionId]);

  // Selected tier object
  const selectedTier = useMemo(() => {
    return TRAVEL_TIERS.find((t) => t.id === selectedTierId) || TRAVEL_TIERS[1];
  }, [selectedTierId]);

  // Computed dynamic budget calculation
  const computedBudget = useMemo(() => {
    // Economics of scale: vehicle & lodging sharing for groups reduces per-person base
    const groupEfficiency = travelersCount >= 6 ? 0.82 : travelersCount >= 4 ? 0.88 : travelersCount === 2 ? 0.94 : 1.0;
    const perPersonTotal = Math.round(selectedTier.dailyPerPerson * selectedDays * selectedRegion.multiplier * groupEfficiency);
    const grandTotal = perPersonTotal * travelersCount;

    const { hotels, transport, food, activities, misc } = selectedTier.breakdownPercents;
    return {
      grandTotal,
      perPersonTotal,
      hotelsAmount: Math.round((grandTotal * hotels) / 100),
      transportAmount: Math.round((grandTotal * transport) / 100),
      foodAmount: Math.round((grandTotal * food) / 100),
      activitiesAmount: Math.round((grandTotal * activities) / 100),
      miscAmount: Math.round((grandTotal * misc) / 100),
    };
  }, [selectedTier, selectedDays, selectedRegion, travelersCount]);

  function handleGoBack() {
    if (currentTrip) {
      openTrip(currentTrip);
      navigateRoot('Itinerary', { trip: currentTrip });
    } else {
      navigateRoot('MainApp', { screen: 'Home' });
    }
  }

  function handlePlanWithBudget() {
    navigateRoot('TripPlanning', {
      preselectedDestination: selectedRegion.name,
      preselectedCategory: selectedRegion.category,
      preselectedBudget: computedBudget.grandTotal,
      initialTripMode: selectedTierId === 'backpacker' ? 'customized' : 'company',
    });
  }

  // Active Trip Breakdown Data
  const breakdown = currentTrip?.budgetBreakdown || {};
  const used = Number(breakdown.totalEstimated || 0);
  const budget = Number(currentTrip?.budget || 0);
  const percentage = Math.max(0, Number(breakdown.percentUsed ?? (budget ? Math.round((used / budget) * 100) : 0)));

  return (
    <View style={styles.page}>
      <StatusBar style="light" />

      <ImageBackground
        source={natureBg}
        style={styles.pageBackground}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            'rgba(244, 250, 247, 0.20)',
            'rgba(244, 250, 247, 0.32)',
            'rgba(244, 250, 247, 0.45)',
          ]}
          style={styles.pageGradientOverlay}
        >
          {/* SCENIC TOP HEADER */}
          <View style={styles.scenicHeader}>
            <TouchableOpacity onPress={handleGoBack} style={styles.headerBackBtn} accessibilityRole="button">
              <AppIcon name="arrow-back" size={18} color="#1F2937" style={{ marginRight: 4 }} />
              <Text style={styles.headerBackText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {activeTab === 'trip' && currentTrip ? 'Trip Budget Estimate' : 'Pakistan Travel Budget'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {activeTab === 'trip' && currentTrip
                ? ` ${currentTrip.destination} · ${breakdown.currency || 'PKR'}`
                : ' Regional cost standards & interactive calculator'}
            </Text>
          </View>

      {/* TRIP / CALCULATOR MODE SWITCHER */}
      <View style={styles.tabBarStrip}>
        <View style={styles.tabPillContainer}>
          {currentTrip && (
            <TouchableOpacity
              style={[styles.tabPill, activeTab === 'trip' && styles.tabPillActive]}
              onPress={() => setActiveTab('trip')}
              activeOpacity={0.8}
            >
              <AppIcon
                name="wallet-outline"
                size={16}
                color={activeTab === 'trip' ? '#ffffff' : colors.forest}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabPillText, activeTab === 'trip' && styles.tabPillTextActive]}>
                 {currentTrip.destination} Trip
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'calculator' && styles.tabPillActive]}
            onPress={() => setActiveTab('calculator')}
            activeOpacity={0.8}
          >
            <AppIcon
              name="calculator-outline"
              size={16}
              color={activeTab === 'calculator' ? '#ffffff' : colors.forest}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabPillText, activeTab === 'calculator' && styles.tabPillTextActive]}>
               Pakistan Cost Calculator
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TOP NAVIGATION BAR: CLEAR "BACK TO ITINERARY" ACTION WHEN TRIP ACTIVE */}
      {activeTab === 'trip' && currentTrip && (
        <View style={styles.topBackStrip}>
          <TouchableOpacity
            style={styles.backToItineraryBigBtn}
            onPress={handleGoBack}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Return to ${currentTrip.destination} itinerary`}
          >
            <AppIcon name="arrow-back" size={17} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.backToItineraryBigText}>Back to {currentTrip.destination} Itinerary (Day Plan)</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={true}>
        {/* ========================================================================= */}
        {/* TAB 1: ACTIVE TRIP EXPENSE & BUDGET BREAKDOWN                             */}
        {/* ========================================================================= */}
        {activeTab === 'trip' && currentTrip ? (
          <View style={styles.tripSectionContainer}>
            {/* SAVED TRIPS SELECTOR BANNER */}
            {trips && trips.length > 1 && (
              <View style={styles.otherTripsBanner}>
                <Text style={styles.otherTripsTitle}>Your Saved Trips:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedTripsScroll}>
                  {trips.map((t) => {
                    const isSelected = String(t._id) === String(currentTrip._id);
                    return (
                      <TouchableOpacity
                        key={String(t._id)}
                        style={[styles.savedTripChip, isSelected && styles.savedTripChipActive]}
                        onPress={() => openTrip(t)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.savedTripText, isSelected && styles.savedTripTextActive]}>
                          {t.destination} ({t.days || 3}d)
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={styles.heroCard}>
              <Text style={styles.eyebrow}>PLANNED TOTAL</Text>
              <Text style={styles.total}>PKR {used.toLocaleString()}</Text>
              <Text style={[styles.remaining, breakdown.exceeded && styles.over]}>
                {breakdown.exceeded
                  ? `Over by PKR ${Number(breakdown.overBy || 0).toLocaleString()}`
                  : `PKR ${Number(breakdown.remaining || 0).toLocaleString()} remaining`}
              </Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${Math.min(percentage, 100)}%` },
                    percentage > 100 && styles.fillOver,
                  ]}
                />
              </View>
              <Text style={styles.percent}>{percentage}% of PKR {budget.toLocaleString()}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>Cost Breakdown</Text>
              {getBudgetCategories(currentTrip, breakdown).map(([label, key, color, iconName]) => {
                const value = Number(breakdown[key] || 0);
                const categoryPct = used ? Math.min(100, Math.round((value / used) * 100)) : 0;
                return (
                  <View key={key} style={styles.row}>
                    <View style={[styles.catIconWrap, { backgroundColor: `${color}18` }]}>
                      <AppIcon name={iconName} size={16} color={color} />
                    </View>
                    <View style={styles.catLabelCol}>
                      <Text style={styles.label}>{label}</Text>
                      <Text style={styles.subPercent}>{categoryPct}% of total</Text>
                    </View>
                    <View style={styles.miniTrack}>
                      <View style={[styles.miniFill, { backgroundColor: color, width: `${categoryPct}%` }]} />
                    </View>
                    <Text style={styles.value}>PKR {value.toLocaleString()}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.actualCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.actualTitle}>Actual Spending</Text>
                <Text style={styles.actual}>PKR {Number(breakdown.actualSpent || 0).toLocaleString()}</Text>
                <Text style={[styles.actualRemaining, breakdown.actualExceeded && styles.over]}>
                  {breakdown.actualExceeded
                    ? `Over by PKR ${Number(breakdown.actualOverBy || 0).toLocaleString()}`
                    : `PKR ${Number(breakdown.actualRemaining ?? budget).toLocaleString()} left`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.expenseButton}
                onPress={() => navigation.navigate('ExpenseHistory')}
                activeOpacity={0.8}
              >
                <Text style={styles.expenseText}>TRACK EXPENSES →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.note}>
              <MarkdownText compact variant="caption" color={colors.muted}>
                {breakdown.note || 'These figures are planning estimates and are not booking quotes.'}
              </MarkdownText>
            </View>
          </View>
        ) : (
          /* ========================================================================= */
          /* TAB 2: PAKISTAN BUDGET GUIDE & INTERACTIVE CALCULATOR                     */
          /* ========================================================================= */
          <View style={styles.calculatorContainer}>
            {/* SAVED TRIPS BANNER IF TRIPS EXIST */}
            {trips && trips.length > 0 && (
              <View style={styles.quickSavedBanner}>
                <View style={styles.quickSavedHeader}>
                  <AppIcon name="briefcase-outline" size={16} color={colors.forest} style={{ marginRight: 6 }} />
                  <Text style={styles.quickSavedTitle}>
                    You have {trips.length} saved trip{trips.length > 1 ? 's' : ''}!
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
                  {trips.map((t) => (
                    <TouchableOpacity
                      key={String(t._id)}
                      style={styles.tripPickChip}
                      onPress={() => {
                        openTrip(t);
                        setActiveTab('trip');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.tripPickText}> View {t.destination} Budget →</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 1. REGION SELECTOR */}
            <View style={styles.calcCard}>
              <View style={styles.sectionHeaderRow}>
                <AppIcon name="navigate-outline" size={18} color={colors.forest} style={{ marginRight: 8 }} />
                <Text style={styles.calcSectionTitle}>1. Select Destination / Region</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.regionScroll}>
                {PAKISTAN_REGIONS.map((region) => {
                  const isSelected = region.id === selectedRegionId;
                  return (
                    <TouchableOpacity
                      key={region.id}
                      style={[styles.regionChip, isSelected && styles.regionChipActive]}
                      onPress={() => setSelectedRegionId(region.id)}
                      activeOpacity={0.7}
                    >
                      <AppIcon
                        name={region.icon}
                        size={15}
                        color={isSelected ? '#ffffff' : colors.forest}
                        style={{ marginRight: 6 }}
                      />
                      <View>
                        <Text style={[styles.regionChipText, isSelected && styles.regionChipTextActive]}>
                          {region.name}
                        </Text>
                        <Text style={[styles.regionChipSub, isSelected && styles.regionChipSubActive]}>
                          {region.tag}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 2. DURATION & TRAVELERS */}
            <View style={[styles.calcCard, isWide && styles.wideRow]}>
              <View style={{ flex: 1, marginBottom: isWide ? 0 : 16 }}>
                <View style={styles.sectionHeaderRow}>
                  <AppIcon name="calendar-outline" size={18} color={colors.forest} style={{ marginRight: 8 }} />
                  <Text style={styles.calcSectionTitle}>2. Duration</Text>
                </View>
                <View style={styles.pillWrap}>
                  {DURATION_OPTIONS.map((opt) => {
                    const isSelected = selectedDays === opt.days;
                    return (
                      <TouchableOpacity
                        key={opt.days}
                        style={[styles.numPill, isSelected && styles.numPillActive]}
                        onPress={() => setSelectedDays(opt.days)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.numPillText, isSelected && styles.numPillTextActive]}>
                          {opt.label}
                        </Text>
                        <Text style={[styles.numPillSub, isSelected && styles.numPillSubActive]}>
                          {opt.desc}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.sectionHeaderRow}>
                  <AppIcon name="people-outline" size={18} color={colors.forest} style={{ marginRight: 8 }} />
                  <Text style={styles.calcSectionTitle}>3. Travelers</Text>
                </View>
                <View style={styles.pillWrap}>
                  {TRAVELER_OPTIONS.map((opt) => {
                    const isSelected = travelersCount === opt.count;
                    return (
                      <TouchableOpacity
                        key={opt.count}
                        style={[styles.numPill, isSelected && styles.numPillActive]}
                        onPress={() => setTravelersCount(opt.count)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.numPillText, isSelected && styles.numPillTextActive]}>
                          {opt.label}
                        </Text>
                        <Text style={[styles.numPillSub, isSelected && styles.numPillSubActive]}>
                          {opt.desc}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* 3. TRAVEL STYLE / COMFORT TIER */}
            <View style={styles.calcCard}>
              <View style={styles.sectionHeaderRow}>
                <AppIcon name="sparkles-outline" size={18} color={colors.forest} style={{ marginRight: 8 }} />
                <Text style={styles.calcSectionTitle}>4. Travel Style & Comfort</Text>
              </View>
              <View style={{ gap: 10, marginTop: 6 }}>
                {TRAVEL_TIERS.map((tier) => {
                  const isSelected = selectedTierId === tier.id;
                  return (
                    <TouchableOpacity
                      key={tier.id}
                      style={[styles.tierCard, isSelected && styles.tierCardActive]}
                      onPress={() => setSelectedTierId(tier.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.tierHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.tierTitle, isSelected && styles.tierTitleActive]}>
                            {tier.title}
                          </Text>
                          <Text style={styles.tierRate}>
                            ~PKR {tier.dailyPerPerson.toLocaleString()} / person / day
                          </Text>
                        </View>
                        <View style={[styles.tierBadge, { backgroundColor: tier.badgeColor }]}>
                          <Text style={styles.tierBadgeText}>{tier.badge}</Text>
                        </View>
                      </View>

                      <View style={styles.tierSpecs}>
                        <View style={styles.tierSpecRow}>
                          <AppIcon name="bed-outline" size={14} color={isSelected ? colors.forest : colors.muted} />
                          <Text style={styles.tierSpecText}>{tier.hotelDesc}</Text>
                        </View>
                        <View style={styles.tierSpecRow}>
                          <AppIcon name="car-outline" size={14} color={isSelected ? colors.forest : colors.muted} />
                          <Text style={styles.tierSpecText}>{tier.transportDesc}</Text>
                        </View>
                        <View style={styles.tierSpecRow}>
                          <AppIcon name="restaurant-outline" size={14} color={isSelected ? colors.forest : colors.muted} />
                          <Text style={styles.tierSpecText}>{tier.foodDesc}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. ESTIMATED LIVE BUDGET CARD */}
            <View style={styles.calcHeroCard}>
              <View style={styles.calcHeroTop}>
                <View>
                  <Text style={styles.calcHeroEyebrow}>ESTIMATED TRIP BUDGET</Text>
                  <Text style={styles.calcHeroTotal}>
                    PKR {computedBudget.grandTotal.toLocaleString()}
                  </Text>
                  <Text style={styles.calcHeroSub}>
                    PKR {computedBudget.perPersonTotal.toLocaleString()} per person · {selectedDays} Days · {travelersCount} Traveler{travelersCount > 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.calcHeroLocBadge}>
                  <Text style={styles.calcHeroLocText}>{selectedRegion.name}</Text>
                </View>
              </View>

              {/* SEGMENTED PROGRESS BAR */}
              <View style={styles.segTrack}>
                <View style={[styles.segFill, { flex: selectedTier.breakdownPercents.hotels, backgroundColor: colors.green }]} />
                <View style={[styles.segFill, { flex: selectedTier.breakdownPercents.transport, backgroundColor: colors.blue }]} />
                <View style={[styles.segFill, { flex: selectedTier.breakdownPercents.food, backgroundColor: colors.amber }]} />
                <View style={[styles.segFill, { flex: selectedTier.breakdownPercents.activities, backgroundColor: '#76548b' }]} />
                <View style={[styles.segFill, { flex: selectedTier.breakdownPercents.misc, backgroundColor: '#8b6b4d' }]} />
              </View>

              {/* DETAILED CATEGORY ESTIMATES */}
              <View style={styles.breakdownGrid}>
                <View style={styles.breakdownItem}>
                  <View style={[styles.catDot, { backgroundColor: colors.green }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.breakdownLabel}> Hotels & Lodging</Text>
                    <Text style={styles.breakdownAmount}>PKR {computedBudget.hotelsAmount.toLocaleString()}</Text>
                  </View>
                </View>
                <View style={styles.breakdownItem}>
                  <View style={[styles.catDot, { backgroundColor: colors.blue }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.breakdownLabel}> Transport & Fuel</Text>
                    <Text style={styles.breakdownAmount}>PKR {computedBudget.transportAmount.toLocaleString()}</Text>
                  </View>
                </View>
                <View style={styles.breakdownItem}>
                  <View style={[styles.catDot, { backgroundColor: colors.amber }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.breakdownLabel}> Food & Dining</Text>
                    <Text style={styles.breakdownAmount}>PKR {computedBudget.foodAmount.toLocaleString()}</Text>
                  </View>
                </View>
                <View style={styles.breakdownItem}>
                  <View style={[styles.catDot, { backgroundColor: '#76548b' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.breakdownLabel}> Activities & Safari</Text>
                    <Text style={styles.breakdownAmount}>PKR {computedBudget.activitiesAmount.toLocaleString()}</Text>
                  </View>
                </View>
                <View style={styles.breakdownItem}>
                  <View style={[styles.catDot, { backgroundColor: '#8b6b4d' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.breakdownLabel}> Emergency / Misc</Text>
                    <Text style={styles.breakdownAmount}>PKR {computedBudget.miscAmount.toLocaleString()}</Text>
                  </View>
                </View>
              </View>

              {/* ACTION: PLAN TRIP WITH THIS BUDGET */}
              <TouchableOpacity
                style={styles.planWithBudgetBtn}
                onPress={handlePlanWithBudget}
                activeOpacity={0.85}
              >
                <Text style={styles.planWithBudgetText}>
                  Plan Trip to {selectedRegion.name} with this Budget →
                </Text>
              </TouchableOpacity>
            </View>

            {/* 5. PAKISTAN REAL-WORLD PRICE BENCHMARKS TABLE */}
            <View style={styles.calcCard}>
              <View style={styles.sectionHeaderRow}>
                <AppIcon name="pricetags-outline" size={18} color={colors.forest} style={{ marginRight: 8 }} />
                <Text style={styles.calcSectionTitle}>Real-World Pakistan Travel Benchmarks</Text>
              </View>
              <Text style={styles.benchmarkIntro}>
                Actual current market rates across Pakistan northern areas and travel corridors:
              </Text>

              <View style={styles.benchmarkTable}>
                <View style={styles.benchRow}>
                  <Text style={styles.benchColKey}> Hotel Room / Night</Text>
                  <Text style={styles.benchColVal}>Economy PKR 3,500–6,000 | 3-Star PKR 10,000–18,000 | Luxury PKR 35,000–65,000</Text>
                </View>
                <View style={styles.benchRow}>
                  <Text style={styles.benchColKey}> Car Rental (Daily + Driver)</Text>
                  <Text style={styles.benchColVal}>Alto/Cultus PKR 4,500–6,000 | GLi Sedan PKR 7,500–9,500 | Prado 4x4 PKR 16,000–24,000</Text>
                </View>
                <View style={styles.benchRow}>
                  <Text style={styles.benchColKey}> Special 4x4 Mountain Jeeps</Text>
                  <Text style={styles.benchColVal}>Saif-ul-Malook PKR 5,000 | Deosai Safari PKR 18,000–22,000 | Fairy Meadows PKR 14,000</Text>
                </View>
                <View style={styles.benchRow}>
                  <Text style={styles.benchColKey}> Daily Food & Tea</Text>
                  <Text style={styles.benchColVal}>Local Dhabas PKR 1,200–1,800/person | Family Restaurants PKR 2,500–4,000/person</Text>
                </View>
                <View style={[styles.benchRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.benchColKey}> Fort & Park Entry Tickets</Text>
                  <Text style={styles.benchColVal}>National Parks PKR 200–400 | Baltit/Altit Forts PKR 600–1,200 (Pakistani/Foreigner)</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0a2318' },
  pageBackground: { flex: 1, width: '100%', height: '100%' },
  pageGradientOverlay: { flex: 1 },

  scenicHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  headerBackText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#374151',
    marginTop: 3,
  },

  tabBarStrip: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 6,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  tabPillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#DCECE5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tabPillActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  tabPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F766E',
  },
  tabPillTextActive: {
    color: '#ffffff',
  },
  topBackStrip: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    marginBottom: 6,
  },
  backToItineraryBigBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 3,
    shadowColor: '#072517',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backToItineraryBigText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  content: { padding: 16, paddingBottom: 60, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  tripSectionContainer: { gap: 14 },

  otherTripsBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DCECE5',
  },
  otherTripsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
    marginBottom: 6,
  },
  savedTripsScroll: { gap: 8 },
  savedTripChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E6F7EE',
    borderWidth: 1,
    borderColor: '#DCECE5',
  },
  savedTripChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  savedTripText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  savedTripTextActive: {
    color: '#ffffff',
  },

  heroCard: {
    backgroundColor: '#0F766E',
    borderRadius: 22,
    padding: 21,
    elevation: 4,
    shadowColor: '#072517',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  eyebrow: { color: '#aedaBD', fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  total: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 5 },
  remaining: { color: '#cce7d7', fontWeight: '800', marginTop: 4 },
  over: { color: '#ffd2cd' },
  track: { height: 9, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden', marginTop: 18 },
  fill: { height: '100%', backgroundColor: '#7fd3a3' },
  fillOver: { backgroundColor: '#ee8177' },
  percent: { color: '#dff3e8', fontSize: 11, marginTop: 7 },

  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCECE5',
    elevation: 3,
    shadowColor: '#072517',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(8px)' } : {}),
  },
  title: { color: colors.ink, fontSize: 18, fontWeight: '900', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderColor: colors.line },
  catIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  catLabelCol: { width: 85 },
  label: { color: colors.ink, fontWeight: '800', fontSize: 13 },
  subPercent: { color: colors.muted, fontSize: 10 },
  miniTrack: { flex: 1, height: 7, borderRadius: 4, overflow: 'hidden', backgroundColor: '#e9ece7', marginHorizontal: 8 },
  miniFill: { height: '100%', borderRadius: 4 },
  value: { width: 95, textAlign: 'right', color: colors.ink, fontSize: 13, fontWeight: '800' },

  actualCard: {
    backgroundColor: '#0F766E',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#072517',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  actualTitle: { color: '#e0eff9', fontSize: 13, fontWeight: '800', marginBottom: 4 },
  actual: { color: '#fff', fontSize: 26, fontWeight: '900' },
  actualRemaining: { color: '#cce7f7', fontWeight: '700', marginTop: 3, fontSize: 12 },
  expenseButton: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  expenseText: { color: '#0F766E', fontWeight: '900', fontSize: 11 },
  note: { paddingHorizontal: 6 },

  // CALCULATOR STYLES
  calculatorContainer: { gap: 14 },
  quickSavedBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCECE5',
    elevation: 2,
    shadowColor: '#072517',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  quickSavedHeader: { flexDirection: 'row', alignItems: 'center' },
  quickSavedTitle: { fontSize: 13, fontWeight: '800', color: '#0F766E' },
  tripPickChip: {
    backgroundColor: '#E6F7EE',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#DCECE5',
  },
  tripPickText: { fontSize: 12, fontWeight: '700', color: '#0F766E' },

  calcCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCECE5',
    elevation: 3,
    shadowColor: '#072517',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(8px)' } : {}),
  },
  wideRow: { flexDirection: 'row', gap: 16 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  calcSectionTitle: { fontSize: 15, fontWeight: '900', color: colors.ink },

  regionScroll: { gap: 8, paddingBottom: 4 },
  regionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f8f5',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d6e5da',
  },
  regionChipActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  regionChipText: { fontSize: 13, fontWeight: '800', color: colors.ink },
  regionChipTextActive: { color: '#ffffff' },
  regionChipSub: { fontSize: 10, color: colors.muted, marginTop: 1 },
  regionChipSubActive: { color: '#b8e4c9' },

  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  numPill: {
    flex: 1,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f8f5',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#d6e5da',
  },
  numPillActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  numPillText: { fontSize: 12, fontWeight: '800', color: colors.ink },
  numPillTextActive: { color: '#ffffff' },
  numPillSub: { fontSize: 9, color: colors.muted, marginTop: 2 },
  numPillSubActive: { color: '#b8e4c9' },

  tierCard: {
    backgroundColor: '#f9fbf9',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#dbe5de',
  },
  tierCardActive: {
    backgroundColor: '#f0f9f3',
    borderColor: colors.forest,
  },
  tierHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  tierTitle: { fontSize: 15, fontWeight: '900', color: colors.ink },
  tierTitleActive: { color: colors.forest },
  tierRate: { fontSize: 11, fontWeight: '700', color: colors.muted, marginTop: 2 },
  tierBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  tierBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  tierSpecs: { gap: 4, borderTopWidth: 1, borderColor: '#e8eee9', paddingTop: 8 },
  tierSpecRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tierSpecText: { fontSize: 12, color: colors.ink, fontWeight: '600' },

  calcHeroCard: {
    backgroundColor: colors.forest,
    borderRadius: 22,
    padding: 20,
    ...shadow,
  },
  calcHeroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  calcHeroEyebrow: { color: '#aedaBD', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  calcHeroTotal: { color: '#ffffff', fontSize: 32, fontWeight: '900', marginTop: 4 },
  calcHeroSub: { color: '#cce7d7', fontSize: 12, fontWeight: '700', marginTop: 4 },
  calcHeroLocBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  calcHeroLocText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },

  segTrack: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 18,
    marginBottom: 16,
  },
  segFill: { height: '100%' },

  breakdownGrid: { gap: 8 },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  catDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  breakdownLabel: { color: '#dff3e8', fontSize: 12, fontWeight: '700' },
  breakdownAmount: { color: '#ffffff', fontSize: 13, fontWeight: '900', marginTop: 1 },

  planWithBudgetBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    ...shadow,
  },
  planWithBudgetText: {
    color: colors.forest,
    fontSize: 14,
    fontWeight: '900',
  },

  benchmarkIntro: { fontSize: 12, color: colors.muted, marginBottom: 12 },
  benchmarkTable: { borderRadius: 12, backgroundColor: '#f9fbf9', borderWidth: 1, borderColor: '#e0ece3', overflow: 'hidden' },
  benchRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: '#e8efe9',
  },
  benchColKey: { fontSize: 12, fontWeight: '800', color: colors.forest, marginBottom: 2 },
  benchColVal: { fontSize: 11, color: colors.ink, fontWeight: '500', lineHeight: 16 },
});
