import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Pressable as TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScreenHeader from '../components/ScreenHeader';
import EmptyTrip from '../components/EmptyTrip';
import AppIcon from '../components/AppIcon';
import { useApp } from '../context/AppContext';
import { colors, fonts, shadow } from '../theme';
import Text from '../components/AppText';
import MarkdownText from '../components/MarkdownText';
import FloatingChatButton from '../components/FloatingChatButton';

const typeColors = {
  historic: '#2f7653',
  history: '#2f7653',
  food: '#c87a24',
  nature: '#2f6f91',
  adventure: '#9b4f31',
  shopping: '#a34d61',
  culture: '#70518a',
};

export default function ItineraryScreen({ navigation, route }) {
  const { currentTrip, openTrip } = useApp();
  const routeTrip = route?.params?.trip;
  const trip = routeTrip || currentTrip;
  const [dayNumber, setDayNumber] = useState(1);

  useEffect(() => {
    if (routeTrip?._id && String(routeTrip._id) !== String(currentTrip?._id)) openTrip(routeTrip);
  }, [currentTrip?._id, routeTrip?._id]);

  function handleBack() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainApp', { screen: 'Home' });
    }
  }

  if (!trip) {
    return (
      <View style={styles.page}>
        <ScreenHeader title="Itinerary" onBack={handleBack} />
        <EmptyTrip />
      </View>
    );
  }

  const itinerary = trip.itinerary || [];
  const currentDay = itinerary.find((day) => day.day === dayNumber) || itinerary[0];
  const activityCount = itinerary.reduce((sum, day) => sum + (day.activities?.length || 0), 0);
  const advisory = trip.safetyAdvisory;
  const pkg = trip.packageDetails || {};
  const alloc = trip.budgetAllocation || {
    transport: Math.round(Number(trip.budget || 0) * 0.35),
    hotels: Math.round(Number(trip.budget || 0) * 0.35),
    food: Math.round(Number(trip.budget || 0) * 0.15),
    activities: Math.round(Number(trip.budget || 0) * 0.10),
    safetyMargin: Math.round(Number(trip.budget || 0) * 0.05),
    total: Number(trip.budget || 0),
  };
  const numPersons = trip.numberOfPersons || pkg.numberOfPersons || 1;
  const totalPackageCost = pkg.totalPackageCost || trip.budget;
  const pricePerPerson = pkg.pricePerPerson || trip.budgetPerPerson || Math.round(Number(totalPackageCost) / numPersons);
  const nights = Math.max(1, (trip.days || 1) - 1);

  function getTimeBlockInfo(activity, index) {
    const rawBlock = activity.timeBlock;
    if (rawBlock === 'Morning') return { icon: '🌅', label: 'Morning Block (Sightseeing)', color: '#b45309', bg: '#fef3c7' };
    if (rawBlock === 'Afternoon') return { icon: '🥪', label: 'Afternoon Block (Lunch)', color: '#0369a1', bg: '#e0f2fe' };
    if (rawBlock === 'Evening') return { icon: '📸', label: 'Evening Block (Sunset & Photo)', color: '#c2410c', bg: '#ffedd5' };
    if (rawBlock === 'Night') return { icon: '🌙', label: 'Night Block (Dinner & Stay)', color: '#4338ca', bg: '#e0e7ff' };

    const t = String(activity.time || '').toLowerCase();
    if (t.includes('8:') || t.includes('9:') || t.includes('10:') || index === 0) {
      return { icon: '🌅', label: 'Morning Block (Sightseeing)', color: '#b45309', bg: '#fef3c7' };
    }
    if (t.includes('12:') || t.includes('1:') || t.includes('2:') || index === 1) {
      return { icon: '🥪', label: 'Afternoon Block (Lunch)', color: '#0369a1', bg: '#e0f2fe' };
    }
    if (t.includes('4:') || t.includes('5:') || t.includes('6:') || index === 2) {
      return { icon: '📸', label: 'Evening Block (Sunset & Photo)', color: '#c2410c', bg: '#ffedd5' };
    }
    return { icon: '🌙', label: 'Night Block (Dinner & Stay)', color: '#4338ca', bg: '#e0e7ff' };
  }

  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <ScreenHeader
        title={`${trip.destination} itinerary`}
        subtitle={`${trip.days} Days (${nights} Nights) • ${numPersons} ${numPersons === 1 ? 'Person' : 'Persons'} • ${activityCount} planned stops`}
        onBack={handleBack}
      >
        <Text style={styles.budget}>PKR {Number(totalPackageCost).toLocaleString()}</Text>
      </ScreenHeader>

      <View style={styles.actions}>
        {[
          { label: 'Summary', screen: 'TripSummary' },
          { label: 'Edit', screen: 'EditItinerary' },
          { label: 'Share', screen: 'ShareExport' },
          { label: 'Map', screen: 'RouteMap' },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.action}
            onPress={() => {
              if (trip) openTrip(trip);
              navigation.navigate(item.screen, {
                trip,
                destination: trip?.destination,
                startLocation: trip?.startLocation,
              });
            }}
          >
            <Text style={styles.actionText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.dayTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {itinerary.map((day) => (
            <TouchableOpacity
              key={day.day}
              style={[styles.dayTab, dayNumber === day.day && styles.dayTabOn]}
              onPress={() => setDayNumber(day.day)}
            >
              <Text style={[styles.dayTabText, dayNumber === day.day && styles.dayTabTextOn]}>Day {day.day}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Spec badges */}
        {/* Spec badges */}
        <View style={styles.specChips}>
          {trip.tripMode ? (
            <View style={[styles.specChip, { backgroundColor: trip.tripMode === 'company' ? '#0369a1' : colors.forest }]}>
              <Text style={[styles.specChipText, { color: '#ffffff', fontWeight: 'bold' }]}>
                {trip.tripMode === 'company' ? '🏢 Company Services' : '🛠️ Customized Plan'}
              </Text>
            </View>
          ) : null}
          {trip.transportChoice === 'own' ? (
            <View style={[styles.specChip, { backgroundColor: '#15803d' }]}>
              <Text style={[styles.specChipText, { color: '#ffffff', fontWeight: 'bold' }]}>🚗 Own Car (Rs. 0 rent)</Text>
            </View>
          ) : trip.transportation ? (
            <View style={styles.specChip}><Text style={styles.specChipText}>🚗 {trip.transportation}</Text></View>
          ) : null}
          {trip.travelType ? (
            <View style={styles.specChip}><Text style={styles.specChipText}>👥 {trip.travelType}</Text></View>
          ) : null}
          {trip.comfortLevel ? (
            <View style={styles.specChip}><Text style={styles.specChipText}>⭐ {trip.comfortLevel}</Text></View>
          ) : null}
        </View>

        {/* Route Origin, Dates & Category Banner */}
        <View style={styles.routeHeaderCard}>
          <View style={styles.routeHeaderRow}>
            <AppIcon name="navigate-outline" size={16} color={colors.forest} />
            <Text style={styles.routeHeaderText}>
              From <Text style={{ fontWeight: '900', color: colors.forest }}>{trip.startLocation || 'Islamabad'}</Text> ➔ <Text style={{ fontWeight: '900', color: colors.forest }}>{trip.destination}</Text>
            </Text>
          </View>
          {trip.preferredRoute ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <AppIcon name="trail-sign-outline" size={14} color={colors.forest} />
              <Text style={{ fontSize: 12, color: colors.forest, fontWeight: '700' }}>
                Highway Route: {trip.preferredRoute}
              </Text>
            </View>
          ) : null}
          {trip.startDate ? (
            <View style={styles.routeDateRow}>
              <AppIcon name="calendar-outline" size={14} color={colors.muted} />
              <Text style={styles.routeDateText}>
                {trip.startDate} {trip.endDate ? `➔ ${trip.endDate}` : ''} ({trip.days} Days / {Math.max(1, trip.days - 1)} Nights)
              </Text>
            </View>
          ) : null}
          {trip.category ? (
            <View style={styles.catBadge}>
              <Text style={styles.catBadgeText}>🏷️ Category: {trip.category}</Text>
            </View>
          ) : null}
        </View>

        {/* VERIFIED TOUR PACKAGE CARD */}
        <View style={styles.tourPackageCard}>
          <View style={styles.tourPackageHeader}>
            <View style={[styles.tourPackageBadge, trip.tripMode === 'customized' && { backgroundColor: colors.forest }]}>
              <AppIcon name="shield-checkmark" size={13} color="#ffffff" />
              <Text style={styles.tourPackageBadgeText}>
                {trip.tripMode === 'company' ? 'VERIFIED TOUR PACKAGE' : 'CUSTOMIZED TRIP CONTROLLER'}
              </Text>
            </View>
            <Text style={styles.tourPackageTitle}>
              {trip.tripMode === 'company' ? 'Verified Commercial Tour Package' : 'Customized Itinerary & Expense Summary'}
            </Text>
          </View>

          {/* Pricing Banner */}
          <View style={styles.tourPackagePricingBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tourPackageTotalLabel}>TOTAL PACKAGE PRICE</Text>
              <Text style={styles.tourPackageTotalPrice}>PKR {Number(totalPackageCost).toLocaleString()}/-</Text>
            </View>
            <View style={styles.tourPackagePerPersonBox}>
              <Text style={styles.tourPackagePerPersonPrice}>PKR {Number(pricePerPerson).toLocaleString()} / person</Text>
              <Text style={styles.tourPackagePerPersonSub}>
                {trip.days} Days ({nights} Nights) • {numPersons} {numPersons === 1 ? 'Person' : 'Persons'}
              </Text>
            </View>
          </View>

          {/* 3-PILLAR INCLUSIONS GRID (ROOM, VEHICLE, FOOD) */}
          <View style={styles.threePillarsGrid}>
            {/* 1. ROOM PILLAR */}
            <View style={styles.pillarCard}>
              <View style={styles.pillarHeader}>
                <AppIcon name="bed" size={15} color={colors.forest} />
                <Text style={styles.pillarHeaderTitle}>1. ROOM</Text>
              </View>
              <Text style={styles.pillarMainText} numberOfLines={1}>
                {trip.hotelRequired === false ? 'No Hotel Required' : (pkg.roomType || (trip.hotel?.comfortLevel === 'Luxury' ? 'VIP Luxury Suite' : 'Deluxe Room'))}
              </Text>
              <Text style={styles.pillarSubText} numberOfLines={1}>
                🏨 {trip.hotelRequired === false ? 'Arranged Personally (Rs. 0)' : (trip.hotel?.name || pkg.hotelName || 'Curated Hotel')}
              </Text>
              <Text style={styles.pillarDetailText}>📍 {trip.destination}</Text>
              <View style={[styles.pillarInclusionTag, trip.hotelRequired === false && { backgroundColor: '#dcfce7' }]}>
                <Text style={[styles.pillarInclusionTagText, trip.hotelRequired === false && { color: '#15803d' }]}>
                  {trip.hotelRequired === false ? '✓ Lodging Rs. 0' : '✓ Breakfast Included'}
                </Text>
              </View>
            </View>

            {/* 2. VEHICLE PILLAR */}
            <View style={styles.pillarCard}>
              <View style={styles.pillarHeader}>
                <AppIcon name="car" size={15} color="#0284c7" />
                <Text style={[styles.pillarHeaderTitle, { color: '#0284c7' }]}>2. VEHICLE</Text>
              </View>
              <Text style={styles.pillarMainText} numberOfLines={1}>
                {trip.transportChoice === 'own' ? 'Own Vehicle (Personal)' : (trip.vehicleDetails?.name || pkg.vehicleName || trip.transportation || 'Dedicated Tour Car')}
              </Text>
              <Text style={styles.pillarSubText} numberOfLines={1}>
                🚗 {trip.transportChoice === 'own' ? 'Rent Rs. 0 (Not cut)' : (pkg.fuelStatus || 'AC + Fuel + Tolls')}
              </Text>
              <Text style={styles.pillarDetailText} numberOfLines={1}>
                👤 {trip.vehicleDetails?.driverIncluded !== false ? 'Driver Included' : 'Self-Drive (Rs. 0)'}
              </Text>
              <View style={[styles.pillarInclusionTag, { backgroundColor: '#e0f2fe' }]}>
                <Text style={[styles.pillarInclusionTagText, { color: '#0369a1' }]}>
                  {trip.transportChoice === 'own' ? '✓ Own Vehicle' : '✓ Private Rental'}
                </Text>
              </View>
            </View>

            {/* 3. FOOD PILLAR */}
            <View style={styles.pillarCard}>
              <View style={styles.pillarHeader}>
                <AppIcon name="restaurant" size={15} color="#d97706" />
                <Text style={[styles.pillarHeaderTitle, { color: '#d97706' }]}>3. FOOD</Text>
              </View>
              <Text style={styles.pillarMainText}>
                {trip.foodPlan?.foodChoice === 'self' ? 'Self-Arranged' : 'Breakfast + Dinner'}
              </Text>
              <Text style={styles.pillarSubText}>
                🍳 Breakfast: {trip.foodPlan?.foodChoice === 'self' ? 'Self-paid (Rs. 0)' : 'Hotel Room'}
              </Text>
              <Text style={styles.pillarSubText}>
                🍽️ Dinner: {trip.foodPlan?.foodChoice === 'self' ? 'Self-paid (Rs. 0)' : 'In Package'}
              </Text>
              <View style={[styles.pillarInclusionTag, { backgroundColor: '#fef3c7' }]}>
                <Text style={[styles.pillarInclusionTagText, { color: '#b45309' }]}>
                  {trip.foodPlan?.foodChoice === 'self' ? '🥡 Self-Paid (Rs. 0)' : '🥪 Lunch Self-Paid'}
                </Text>
              </View>
            </View>
          </View>

          {/* 4. CONNECTIVITY / SIM CARD (SUPERVISOR SPEC: Tel. 300, Call 100, Int 30GB) */}
          <View style={styles.connectivityBanner}>
            <View style={styles.connectivityHeader}>
              <View style={styles.connectivityBadge}>
                <AppIcon name="cellular-outline" size={13} color="#ffffff" />
                <Text style={styles.connectivityBadgeText}>4. CONNECTIVITY</Text>
              </View>
              <Text style={styles.connectivityTitle}>
                {trip.tripMode === 'company' ? 'Telenor 300 Tourist SIM Included' : 'Tourist SIM & Data Specs'}
              </Text>
            </View>
            <View style={styles.connectivityDetailsRow}>
              <View style={styles.connectivitySpecChip}>
                <Text style={styles.connectivitySpecLabel}>📶 4G DATA</Text>
                <Text style={styles.connectivitySpecValue}>30 GB High-Speed</Text>
              </View>
              <View style={styles.connectivitySpecChip}>
                <Text style={styles.connectivitySpecLabel}>📞 CALLS</Text>
                <Text style={styles.connectivitySpecValue}>100 All-Net Mins</Text>
              </View>
              <View style={styles.connectivitySpecChip}>
                <Text style={styles.connectivitySpecLabel}>🏷️ SIM PACK</Text>
                <Text style={styles.connectivitySpecValue}>Telenor 300</Text>
              </View>
            </View>
          </View>

          {/* BUDGET BREAKDOWN BAR & LABELS (User Personal Expense Breakdown for Customized Trips) */}
          {trip.tripMode !== 'company' && (
            <View style={styles.allocationSection}>
              <Text style={styles.allocationSectionTitle}>
                BUDGET BREAKDOWN
              </Text>
              <View style={styles.allocationBar}>
                <View style={[styles.allocSegment, { flex: 35, backgroundColor: '#2563eb' }]} />
                <View style={[styles.allocSegment, { flex: 35, backgroundColor: '#059669' }]} />
                <View style={[styles.allocSegment, { flex: 15, backgroundColor: '#d97706' }]} />
                <View style={[styles.allocSegment, { flex: 15, backgroundColor: '#7c3aed' }]} />
              </View>
              <View style={styles.allocLegendRow}>
                <Text style={styles.allocLegendText}>🚗 Transport: <Text style={{ fontWeight: 'bold' }}>PKR {(alloc.transport || 0).toLocaleString()}</Text></Text>
                <Text style={styles.allocLegendText}>🏨 Hotel: <Text style={{ fontWeight: 'bold' }}>PKR {(alloc.hotels || 0).toLocaleString()}</Text></Text>
                <Text style={styles.allocLegendText}>🍽️ Food: <Text style={{ fontWeight: 'bold' }}>PKR {(alloc.food || 0).toLocaleString()}</Text></Text>
                <Text style={styles.allocLegendText}>🎯 Sights: <Text style={{ fontWeight: 'bold' }}>PKR {(alloc.activities || 0).toLocaleString()}</Text></Text>
              </View>
            </View>
          )}

          {/* TOUR INCLUSIONS CHECKLIST */}
          <View style={styles.inclusionsBox}>
            <Text style={styles.inclusionsTitle}>PACKAGE INCLUSIONS & SERVICES:</Text>
            <View style={styles.inclusionsGrid}>
              {(pkg.inclusions && pkg.inclusions.length > 0 ? pkg.inclusions : [
                trip.isOwnCar ? 'Self-Drive / Personal Transportation' : 'Dedicated AC Vehicle with fuel, tolls & road permits',
                ...(trip.isOwnCar ? [] : ['Licensed mountain driver with daily allowance']),
                ...(trip.hotelRequired !== false && trip.hotel ? [`${nights} Nights Hotel Stay in ${trip.destination}`] : []),
                ...(trip.foodPlan?.foodChoice !== 'self' ? ['Daily regional meals plan included'] : []),
                ...(trip.optionalExperiences && trip.optionalExperiences.length > 0
                  ? trip.optionalExperiences.map((e) => `✨ ${e.name || e.title || 'Special Experience'}`)
                  : []),
                '24/7 Tour coordination & helpline support',
              ]).map((inc, i) => (
                <Text key={i} style={styles.inclusionItem}>✓ {inc}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Prominent Travel Safety Advisory & Hazard Detection Banner */}
        <View style={[
          styles.safetyBox,
          advisory?.severity === 'high' ? styles.safetyBoxHigh : (advisory?.hasAlerts ? styles.safetyBoxMod : styles.safetyBoxNormal),
        ]}>
          <View style={styles.safetyHeader}>
            <AppIcon
              name={advisory?.severity === 'high' ? 'alert-circle' : (advisory?.hasAlerts ? 'warning' : 'shield-checkmark')}
              size={22}
              color={advisory?.severity === 'high' ? colors.red : (advisory?.hasAlerts ? '#d97706' : colors.forest)}
            />
            <Text style={[
              styles.safetyTitle,
              { color: advisory?.severity === 'high' ? colors.red : (advisory?.hasAlerts ? '#b45309' : colors.forest) },
            ]}>
              {advisory?.severity === 'high' ? 'CRITICAL HAZARDS DETECTED' : (advisory?.hasAlerts ? 'TRAVEL SAFETY & ROAD HAZARDS' : 'SAFE TRAVEL CONDITIONS')}
            </Text>
          </View>

          {/* Live Weather Overview Pill */}
          <View style={styles.weatherTripPill}>
            <AppIcon name="partly-sunny" size={16} color="#0369a1" />
            <Text style={styles.weatherTripText}>
              {trip.destination} Weather: <Text style={{ fontWeight: '900', color: '#0369a1' }}>{trip.weather?.temp !== undefined ? `${trip.weather.temp}°C` : '18°C'}</Text> • {trip.weather?.description || trip.weather?.main || 'Clear skies'} (Wind: {trip.weather?.wind || 3.2} m/s)
            </Text>
          </View>

          <Text style={styles.safetySummary}>{advisory?.summary || 'Normal travel conditions reported for this route.'}</Text>

          {advisory?.alerts && advisory.alerts.length > 0 ? (
            <View style={styles.hazardTagsRow}>
              {advisory.alerts.map((alt, idx) => (
                <View key={idx} style={[styles.hazardBadge, alt.severity === 'danger' && styles.hazardBadgeDanger]}>
                  <Text style={[styles.hazardBadgeText, alt.severity === 'danger' && styles.hazardBadgeTextDanger]}>
                    ⚠️ {String(alt.hazard || 'ALERT').toUpperCase()}: {alt.title}
                  </Text>
                  {alt.message ? <Text style={styles.hazardDetailMsg}>{alt.message}</Text> : null}
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.recommendationBox}>
            <Text style={styles.recommendationLabel}>SMART RECOMMENDATION:</Text>
            <Text style={styles.recommendationText}>
              {advisory?.recommendation || 'Drive safely during daylight hours and adhere to motorway regulations.'}
            </Text>
          </View>

          {/* Emergency Helplines Strip */}
          <View style={styles.emergencyStrip}>
            <Text style={styles.emergencyStripLabel}>EMERGENCY HELPLINES:</Text>
            <Text style={styles.emergencyStripNumbers}>
              Motorway Police: <Text style={{ fontWeight: '900' }}>130</Text> • Rescue: <Text style={{ fontWeight: '900' }}>1122</Text> • Tourism Police: <Text style={{ fontWeight: '900' }}>1422</Text>
            </Text>
          </View>
        </View>

        {/* Financial & Budget Breakdown */}
        {trip.budgetSummary ? (
          <View style={styles.budgetCard}>
            <View style={styles.budgetCardHeader}>
              <Text style={styles.budgetCardTitle}>Financial Overview</Text>
              <Text style={[
                styles.budgetStatus,
                trip.budgetSummary.remainingBudget >= 0 ? styles.budgetOk : styles.budgetExceeded,
              ]}>
                {trip.budgetSummary.remainingBudget >= 0 ? 'Within Budget' : 'Over Budget'}
              </Text>
            </View>
            <View style={styles.budgetRow}>
              <View style={styles.budgetItem}>
                <Text style={styles.budgetVal}>PKR {Number(trip.budgetSummary.totalBudget).toLocaleString()}</Text>
                <Text style={styles.budgetLbl}>TOTAL BUDGET</Text>
              </View>
              <View style={styles.budgetItem}>
                <Text style={styles.budgetVal}>PKR {Number(trip.budgetSummary.estimatedTripCost).toLocaleString()}</Text>
                <Text style={styles.budgetLbl}>EST. COST</Text>
              </View>
              <View style={styles.budgetItem}>
                <Text style={[styles.budgetVal, { color: trip.budgetSummary.remainingBudget >= 0 ? colors.green : colors.red }]}>
                  PKR {Number(trip.budgetSummary.remainingBudget).toLocaleString()}
                </Text>
                <Text style={styles.budgetLbl}>REMAINING</Text>
              </View>
            </View>
            {trip.hotelRequired && trip.hotel ? (
              <View style={styles.hotelStayInfo}>
                <AppIcon name="bed-outline" size={16} color={colors.forest} />
                <Text style={styles.hotelStayText}>
                  Hotel: <Text style={{ fontWeight: '900', color: colors.forest }}>{trip.hotel.name}</Text>
                  {trip.hotel.selectedRoom ? ` (${trip.hotel.selectedRoom.type})` : ''} • PKR {Number(trip.budgetSummary.hotelCost || 0).toLocaleString()}
                </Text>
              </View>
            ) : (
              <View style={styles.hotelStayInfo}>
                <AppIcon name="bed-outline" size={16} color={colors.muted} />
                <Text style={styles.hotelStayText}>
                  Hotel: <Text style={{ fontWeight: '700', color: colors.muted }}>Skipped / Self-Arranged (PKR 0)</Text>
                </Text>
              </View>
            )}
            {trip.optionalExperiences && trip.optionalExperiences.length > 0 ? (
              <View style={[styles.hotelStayInfo, { paddingTop: 4 }]}>
                <AppIcon name="sparkles" size={16} color="#b45309" />
                <Text style={styles.hotelStayText}>
                  Special Extras: <Text style={{ fontWeight: '700', color: '#92400e' }}>
                    {trip.optionalExperiences.map((e) => e.name || e.title).join(', ')}
                  </Text>
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Day Activities */}
        <Text style={styles.dayTitle}>{currentDay?.title}</Text>
        {currentDay?.weatherNote ? (
          <View style={styles.weather}>
            <MarkdownText compact color={colors.muted}>{currentDay.weatherNote}</MarkdownText>
          </View>
        ) : null}

        {(currentDay?.activities || []).map((activity, index) => {
          const blockInfo = getTimeBlockInfo(activity, index);
          return (
            <View key={`${activity.time}-${activity.place}-${index}`} style={styles.activityRow}>
              <View style={styles.timeline}>
                <View style={styles.dot} />
                {index < currentDay.activities.length - 1 ? <View style={styles.line} /> : null}
              </View>
              <TouchableOpacity
                style={styles.card}
                onPress={() => {
                  const attraction = (trip.attractions || []).find((item) =>
                    String(item.title).toLowerCase().includes(String(activity.place).toLowerCase()) ||
                    String(activity.place).toLowerCase().includes(String(item.title).toLowerCase())
                  );
                  navigation.navigate('AttractionDetail', {
                    attraction: { ...activity, ...attraction, title: attraction?.title || activity.place },
                  });
                }}
              >
                <View style={styles.cardTop}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1, marginRight: 6 }}>
                    <Text style={styles.time}>{activity.time}</Text>
                    {blockInfo ? (
                      <View style={[styles.timeBlockBadge, { backgroundColor: blockInfo.bg }]}>
                        <Text style={[styles.timeBlockBadgeText, { color: blockInfo.color }]}>
                          {blockInfo.icon} {blockInfo.label}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={[styles.badge, { backgroundColor: typeColors[activity.type] || colors.muted }]}>
                    <Text style={styles.badgeText}>{activity.type}</Text>
                  </View>
                </View>

                {activity.mealPolicy ? (
                  <View style={styles.mealPolicyPill}>
                    <Text style={styles.mealPolicyPillText}>🍽️ {activity.mealPolicy}</Text>
                  </View>
                ) : null}

                <Text style={styles.place}>{activity.place}</Text>
                <MarkdownText compact color={colors.muted} style={styles.description}>
                  {activity.description}
                </MarkdownText>
                <Text style={styles.cost}>Estimated PKR {Number(activity.estimatedCost || 0).toLocaleString()}</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={styles.cardAction}
                  onPress={(event) => {
                    event.stopPropagation?.();
                    navigation.navigate('ActivitySearch', { day: currentDay.day, activityIndex: index });
                  }}
                >
                  <Text style={styles.cardActionText}>REPLACE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={styles.cardAction}
                  onPress={(event) => {
                    event.stopPropagation?.();
                    const match = (trip.attractions || []).find((item) =>
                      String(item.title).toLowerCase().includes(String(activity.place).toLowerCase()) ||
                      String(activity.place).toLowerCase().includes(String(item.title).toLowerCase())
                    );
                    navigation.navigate('RecommendationExplanation', {
                      attraction: { ...activity, ...match, title: match?.title || activity.place },
                    });
                  }}
                >
                  <Text style={styles.cardActionText}>WHY THIS?</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        );
      })}
      </ScrollView>

      {/* FLOATING CHATBOT BUTTON ON SIDE OF SCREEN */}
      <FloatingChatButton navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream, position: 'relative' },
  routeHeaderCard: {
    backgroundColor: '#edf6f1',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#c6e8d5',
    gap: 6,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeHeaderText: {
    fontSize: 13,
    color: colors.ink,
    fontFamily: fonts.medium,
  },
  routeDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeDateText: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: fonts.medium,
  },
  catBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  catBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  budget: {
    alignSelf: 'flex-start',
    color: '#fff',
    fontWeight: '800',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 9,
  },
  actions: { flexDirection: 'row', padding: 10, backgroundColor: colors.paper, borderBottomWidth: 1, borderColor: colors.line },
  action: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRightWidth: 1, borderColor: colors.line },
  actionText: { color: colors.forest, fontWeight: '900' },
  dayTabs: { backgroundColor: colors.paper, paddingVertical: 10, paddingHorizontal: 12 },
  dayTab: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 18, marginRight: 7, backgroundColor: colors.cream },
  dayTabOn: { backgroundColor: colors.forest },
  dayTabText: { color: colors.muted, fontWeight: '800' },
  dayTabTextOn: { color: '#fff' },
  content: { padding: 16, paddingBottom: 36 },
  specChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  specChip: { backgroundColor: '#e2ece4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  specChipText: { color: colors.forest, fontWeight: '800', fontSize: 11 },
  safetyBox: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  safetyBoxHigh: { backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
  safetyBoxMod: { backgroundColor: '#fffbeb', borderColor: '#fcd34d' },
  safetyBoxNormal: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  safetyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  safetyTitle: { fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  weatherTripPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderColor: '#bae6fd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 8,
  },
  weatherTripText: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: '700',
  },
  safetySummary: { color: colors.ink, fontSize: 12, lineHeight: 18, marginBottom: 8 },
  hazardTagsRow: { flexDirection: 'column', gap: 6, marginBottom: 8 },
  hazardBadge: { backgroundColor: '#fffbeb', borderColor: '#fde68a', borderWidth: 1, borderRadius: 8, padding: 8 },
  hazardBadgeDanger: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  hazardBadgeText: { color: '#b45309', fontSize: 11, fontWeight: '900' },
  hazardBadgeTextDanger: { color: colors.red },
  hazardDetailMsg: { fontSize: 11, color: '#475569', marginTop: 2, lineHeight: 15 },
  recommendationBox: { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 10, padding: 10, marginTop: 4 },
  recommendationLabel: { fontSize: 10, fontWeight: '900', color: colors.forest, letterSpacing: 0.5 },
  recommendationText: { fontSize: 12, color: colors.ink, fontWeight: '700', marginTop: 2, lineHeight: 17 },
  emergencyStrip: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    gap: 3,
  },
  emergencyStripLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#065f46',
    letterSpacing: 0.5,
  },
  emergencyStripNumbers: {
    fontSize: 11,
    color: '#047857',
  },
  budgetCard: { ...shadow, backgroundColor: colors.paper, borderRadius: 16, padding: 14, marginBottom: 16 },
  budgetCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  budgetCardTitle: { fontWeight: '900', fontSize: 14, color: colors.ink },
  budgetStatus: { fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  budgetOk: { backgroundColor: colors.mint, color: colors.forest },
  budgetExceeded: { backgroundColor: '#fee2e2', color: colors.red },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: colors.line, paddingBottom: 10 },
  budgetItem: { alignItems: 'center' },
  budgetVal: { fontWeight: '900', fontSize: 13, color: colors.ink },
  budgetLbl: { fontSize: 9, fontWeight: '800', color: colors.muted, marginTop: 2 },
  hotelStayInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 9 },
  hotelStayText: { fontSize: 11, color: colors.muted },
  dayTitle: { color: colors.ink, fontSize: 23, fontWeight: '900' },
  weather: { backgroundColor: colors.mint, padding: 12, borderRadius: 12, marginTop: 9, marginBottom: 15 },
  activityRow: { flexDirection: 'row' },
  timeline: { width: 27, alignItems: 'center' },
  dot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.green, marginTop: 18 },
  line: { flex: 1, width: 2, backgroundColor: '#b8d9c5' },
  card: { ...shadow, flex: 1, backgroundColor: colors.paper, borderRadius: 16, padding: 15, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { color: colors.green, fontWeight: '900', fontSize: 12 },
  badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  place: { color: colors.ink, fontSize: 17, fontWeight: '900', marginTop: 8 },
  description: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  cost: { color: colors.amber, fontWeight: '800', fontSize: 12, marginTop: 9 },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 9,
    borderTopWidth: 1,
    borderColor: colors.line,
  },
  cardAction: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 9, backgroundColor: colors.mint },
  cardActionText: { color: colors.forest, fontWeight: '900', fontSize: 10 },
  tourPackageCard: {
    ...shadow,
    backgroundColor: colors.paper,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#c6e8d5',
    gap: 12,
  },
  tourPackageHeader: {
    flexDirection: 'column',
    gap: 4,
  },
  tourPackageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.forest,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tourPackageBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tourPackageTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.ink,
    marginTop: 2,
  },
  tourPackagePricingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    gap: 8,
  },
  tourPackageTotalLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.forest,
    letterSpacing: 0.5,
  },
  tourPackageTotalPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.forest,
    marginTop: 1,
  },
  tourPackagePerPersonBox: {
    alignItems: 'flex-end',
  },
  tourPackagePerPersonPrice: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  tourPackagePerPersonSub: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '600',
    marginTop: 1,
  },
  threePillarsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  pillarCard: {
    flex: 1,
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 4,
  },
  pillarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  pillarHeaderTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.forest,
    letterSpacing: 0.5,
  },
  pillarMainText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.ink,
  },
  pillarSubText: {
    fontSize: 9,
    color: colors.muted,
    lineHeight: 13,
  },
  pillarDetailText: {
    fontSize: 9,
    color: colors.ink,
    fontWeight: '600',
  },
  pillarInclusionTag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  pillarInclusionTagText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#15803d',
  },
  allocationSection: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 6,
  },
  allocationSectionTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.muted,
    letterSpacing: 0.5,
  },
  allocationBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#e2ece4',
  },
  allocSegment: {
    height: '100%',
  },
  allocLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  allocLegendText: {
    fontSize: 9,
    color: colors.ink,
  },
  inclusionsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  inclusionsTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 0.5,
  },
  inclusionsGrid: {
    gap: 3,
  },
  inclusionItem: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 14,
  },
  timeBlockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timeBlockBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  mealPolicyPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 2,
    borderWidth: 0.5,
    borderColor: '#fde68a',
  },
  mealPolicyPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400e',
  },
  connectivityBanner: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 8,
  },
  connectivityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectivityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#15803d',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  connectivityBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  connectivityTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  connectivityDetailsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  connectivitySpecChip: {
    flex: 1,
    minWidth: 85,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  connectivitySpecLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.muted,
  },
  connectivitySpecValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
    marginTop: 2,
  },
});
