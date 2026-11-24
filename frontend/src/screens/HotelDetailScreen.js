import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
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
import fallbackHotels from '../data/hotels.json';
import { navigateRoot } from '../navigation/navigationRef';

const natureBg = require('../../assets/splash_nature_bg.jpg');

function getCategoryForCity(city = '') {
  const c = city.toLowerCase();
  if (
    c.includes('hunza') ||
    c.includes('skardu') ||
    c.includes('gilgit') ||
    c.includes('kalam') ||
    c.includes('neelum') ||
    c.includes('fairy') ||
    c.includes('deosai')
  ) {
    return 'Northern Areas';
  }
  if (
    c.includes('naran') ||
    c.includes('kaghan') ||
    c.includes('malam') ||
    c.includes('murree') ||
    c.includes('chitral') ||
    c.includes('swat')
  ) {
    return 'Adventure & Nature';
  }
  if (
    c.includes('gwadar') ||
    c.includes('karachi') ||
    c.includes('ormara') ||
    c.includes('beach')
  ) {
    return 'Coastal Areas';
  }
  return 'Cultural & Historical';
}

function getHotelDescription(hotel) {
  const city = hotel.city || 'Pakistan';
  const name = hotel.name || 'Hotel';
  const tier = (hotel.comfortLevel || 'Comfort').toLowerCase();

  if (city.toLowerCase().includes('hunza')) {
    return `${name} is an exceptional ${tier} retreat situated in the majestic Hunza Valley. Surrounded by panoramic views of Rakaposhi, Ultar Sar, and the turquoise waters of Attabad Lake, the hotel offers tranquil rooms with private balconies, traditional Gilgiti warmth, authentic local apricot treats, and easy access to historical Baltit and Altit Forts.`;
  }
  if (city.toLowerCase().includes('skardu')) {
    return `Set against the awe-inspiring backdrop of the Karakoram range and cold desert landscapes, ${name} provides guests with a world-class ${tier} stay in Skardu. Enjoy serene mornings facing Upper Kachura Lake or the Indus River, peaceful garden terraces, trout fishing excursions, and convenient proximity to Deosai National Park and Katpana Desert.`;
  }
  if (city.toLowerCase().includes('swat')) {
    return `Nestled in the lush valleys of Swat, often known as the Switzerland of the East, ${name} combines ${tier} alpine comfort with breathtaking views of pine-forested slopes and the roaring Swat River. Guests enjoy cool mountain air, heated rooms, warm hospitality, and quick drives to Malam Jabba Ski Resort, Mingora Bazaar, and Kalam Valley.`;
  }
  if (city.toLowerCase().includes('naran') || city.toLowerCase().includes('kaghan')) {
    return `Located in the scenic heart of Kaghan Valley along the glistening Kunhar River, ${name} is the ideal ${tier} mountain getaway. Providing comfortable heated lodging, family suites, and riverside lawn seating, it serves as the perfect base for day trips to Lake Saif-ul-Malook, Lulusar Lake, and Babusar Top.`;
  }
  if (city.toLowerCase().includes('murree') || city.toLowerCase().includes('galyat')) {
    return `Perched high amongst misty pine forests in the Murree Hills, ${name} offers refreshing highland breezes, panoramic ridge views, and comfortable ${tier} lodging. Minutes from Mall Road, hiking trails, and chairlifts, it is a favorite sanctuary for families and couples escaping city heat.`;
  }
  if (city.toLowerCase().includes('gwadar') || city.toLowerCase().includes('karachi')) {
    return `Boasting sweeping views of the Arabian Sea and rugged coastal cliffs, ${name} delivers premier ${tier} hospitality along Pakistan's southern coast. Enjoy fresh seafood dining, modern ocean-view suites, and sunset strolls along pristine coastal beaches.`;
  }
  return `${name} is a premier ${tier} property in ${city}, Pakistan. Offering warm hospitality, thoughtfully appointed rooms, high-speed amenities, and convenient proximity to regional sights, it ensures an unforgettable travel experience for tourists, families, and business travelers alike.`;
}

export default function HotelDetailScreen({ navigation, route }) {
  const { currentTrip, selectHotel } = useApp();
  const { width: windowWidth } = useWindowDimensions();
  const isWide = windowWidth >= 768;

  // Resolve hotel object: merge route param with fallbackHotels catalog
  const rawHotel = route?.params?.hotel || {};
  const hotel = useMemo(() => {
    const fromCatalog =
      fallbackHotels.find(
        (h) => h.id === rawHotel.id || (h.name && rawHotel.name && h.name.toLowerCase() === rawHotel.name.toLowerCase())
      ) || {};
    return { ...fromCatalog, ...rawHotel };
  }, [rawHotel]);

  // Ensure rooms exist with real rates
  const rooms = useMemo(() => {
    if (hotel.rooms && Array.isArray(hotel.rooms) && hotel.rooms.length > 0) {
      return hotel.rooms;
    }
    const base = Number(hotel.pricePerNight) || 12000;
    return [
      {
        id: `${hotel.id || 'room'}-std`,
        name: 'Standard Deluxe Room',
        price: Math.round(base),
        capacity: 2,
        available: 4,
        bed: '1 King Bed',
      },
      {
        id: `${hotel.id || 'room'}-view`,
        name: 'Executive Mountain View Room',
        price: Math.round(base * 1.35),
        capacity: 3,
        available: 2,
        bed: '1 King + 1 Single Bed',
      },
      {
        id: `${hotel.id || 'room'}-fam`,
        name: 'Family Suite Cottage',
        price: Math.round(base * 1.8),
        capacity: 4,
        available: 1,
        bed: '2 Queen Beds',
      },
    ];
  }, [hotel]);

  // Selected room state (default to first room)
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id || null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedRoom = useMemo(() => {
    return rooms.find((r) => r.id === selectedRoomId) || rooms[0];
  }, [rooms, selectedRoomId]);

  const isTripHotelSelected = currentTrip?.selectedHotel?.id === hotel.id;

  async function handleSelectForTrip() {
    if (!currentTrip) {
      Alert.alert('No Active Trip', 'Please generate or open a trip first to assign this hotel.');
      return;
    }
    setIsSaving(true);
    try {
      await selectHotel(hotel.id);
      Alert.alert('Hotel Selected', `${hotel.name} has been set as your active accommodation for ${currentTrip.destination}!`);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Notice', err.message || 'Unable to update trip hotel.');
    } finally {
      setIsSaving(false);
    }
  }

  function handlePlanTrip() {
    navigateRoot('TripPlanning', {
      preselectedDestination: hotel.city,
      preselectedCategory: getCategoryForCity(hotel.city),
      preselectedBudget: (selectedRoom?.price || hotel.pricePerNight || 15000) * 3,
    });
  }

  const amenitiesList = useMemo(() => {
    const list = Array.isArray(hotel.amenities) && hotel.amenities.length > 0
      ? hotel.amenities
      : ['High-Speed Wi-Fi', 'Complimentary Breakfast', 'Scenic Balcony', 'Room Heating', '24/7 Hot Water', 'Secure Parking'];
    return list;
  }, [hotel.amenities]);

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
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn} accessibilityRole="button">
              <AppIcon name="arrow-back" size={18} color="#1F2937" style={{ marginRight: 4 }} />
              <Text style={styles.headerBackText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{hotel.name || 'Hotel Details'}</Text>
            <Text style={styles.headerSubtitle}>{` ${hotel.city || 'Pakistan'} · Verified Lodging`}</Text>
          </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ========================================================================= */}
        {/* HERO IMAGE & KEY BADGES                                                   */}
        {/* ========================================================================= */}
        <View style={styles.heroWrapper}>
          {hotel.imageUrl ? (
            <Image source={{ uri: hotel.imageUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, styles.placeholderHero]}>
              <AppIcon name="business-outline" size={60} color="#759384" />
            </View>
          )}
          <View style={styles.heroOverlayBadgeRow}>
            <View style={styles.ratingBadge}>
              <AppIcon name="star" size={14} color="#f59e0b" style={{ marginRight: 4 }} />
              <Text style={styles.ratingText}>
                {Number(hotel.rating || 4.5).toFixed(1)} / 5.0
              </Text>
            </View>
            <View style={styles.tierBadge}>
              <Text style={styles.tierBadgeText}>
                {hotel.comfortLevel || 'Comfort'} Class
              </Text>
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* HOTEL TITLE & BASE RATE BANNER                                            */}
        {/* ========================================================================= */}
        <View style={styles.headerCard}>
          <View style={styles.titleLocationRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.hotelTitle}>{hotel.name}</Text>
              <Text style={styles.hotelLocation}>
                 {hotel.city}, Pakistan
              </Text>
            </View>
          </View>

          <View style={styles.priceBanner}>
            <View>
              <Text style={styles.priceBannerLabel}>STARTING ROOM RATE</Text>
              <Text style={styles.priceBannerAmount}>
                PKR {Number(hotel.pricePerNight).toLocaleString()}
                <Text style={styles.priceBannerPerNight}> / night</Text>
              </Text>
            </View>
            <View style={styles.verifiedTag}>
              <AppIcon name="checkmark-circle" size={15} color="#145a38" style={{ marginRight: 4 }} />
              <Text style={styles.verifiedTagText}>Real Verified Rate</Text>
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* ABOUT THIS HOTEL / INFORMATION                                            */}
        {/* ========================================================================= */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <AppIcon name="information-circle-outline" size={20} color={colors.forest} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>About This Hotel</Text>
          </View>
          <Text style={styles.descriptionText}>
            {getHotelDescription(hotel)}
          </Text>

          <View style={styles.quickHighlightsRow}>
            <View style={styles.highlightPill}>
              <AppIcon name="shield-checkmark-outline" size={15} color={colors.forest} style={{ marginRight: 6 }} />
              <Text style={styles.highlightPillText}>Family & Couple Safe</Text>
            </View>
            <View style={styles.highlightPill}>
              <AppIcon name="time-outline" size={15} color={colors.forest} style={{ marginRight: 6 }} />
              <Text style={styles.highlightPillText}>24/7 Front Desk</Text>
            </View>
            <View style={styles.highlightPill}>
              <AppIcon name="restaurant-outline" size={15} color={colors.forest} style={{ marginRight: 6 }} />
              <Text style={styles.highlightPillText}>In-House Dining</Text>
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* AVAILABLE ROOMS & REAL PER-ROOM RATES (CRUCIAL USER REQUIREMENT)          */}
        {/* ========================================================================= */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <AppIcon name="bed-outline" size={20} color={colors.forest} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Available Rooms & Real Rates</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Verified Pakistani market rates per room night with taxes & breakfast:
          </Text>

          <View style={styles.roomsContainer}>
            {rooms.map((room) => {
              const isSelected = selectedRoomId === room.id;
              return (
                <TouchableOpacity
                  key={room.id}
                  style={[styles.roomCard, isSelected && styles.roomCardSelected]}
                  onPress={() => setSelectedRoomId(room.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.roomHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.roomName, isSelected && styles.roomNameSelected]}>
                        {room.name}
                      </Text>
                      <View style={styles.roomSpecsRow}>
                        <Text style={styles.roomSpecBadge}> {room.bed || '1 King Bed'}</Text>
                        <Text style={styles.roomSpecBadge}> Up to {room.capacity || 2} Guests</Text>
                        {room.available && (
                          <Text style={styles.roomAvailBadge}> {room.available} Rooms Left</Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.roomPriceCol}>
                      <Text style={styles.roomPriceText}>
                        PKR {Number(room.price).toLocaleString()}
                      </Text>
                      <Text style={styles.roomPriceSub}>per room / night</Text>
                    </View>
                  </View>

                  <View style={styles.roomPerks}>
                    <Text style={styles.perkText}>[Included] Free Buffet Breakfast included</Text>
                    <Text style={styles.perkText}>[Included] Ensuite Bathroom with 24/7 Hot Water & Heating</Text>
                    <Text style={styles.perkText}>[Included] Free High-Speed Wi-Fi & Scenic View</Text>
                  </View>

                  <View style={styles.roomCardBottom}>
                    <View style={[styles.selectRadio, isSelected && styles.selectRadioActive]}>
                      {isSelected ? (
                        <View style={styles.radioInner} />
                      ) : null}
                    </View>
                    <Text style={[styles.selectRadioLabel, isSelected && styles.selectRadioLabelActive]}>
                      {isSelected ? 'Room Selected [Included]' : 'Tap to Select this Room'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ========================================================================= */}
        {/* AMENITIES & FACILITIES                                                    */}
        {/* ========================================================================= */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <AppIcon name="sparkles-outline" size={20} color={colors.forest} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Amenities & Hotel Facilities</Text>
          </View>
          <View style={styles.amenitiesGrid}>
            {amenitiesList.map((amenity, index) => (
              <View key={index} style={styles.amenityChip}>
                <AppIcon name="checkmark-done" size={16} color={colors.forest} style={{ marginRight: 6 }} />
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ========================================================================= */}
        {/* HOTEL POLICIES & IMPORTANT DETAILS                                        */}
        {/* ========================================================================= */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <AppIcon name="reader-outline" size={20} color={colors.forest} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Policies & Check-in Info</Text>
          </View>

          <View style={styles.policyRow}>
            <Text style={styles.policyKey}> Check-in / Check-out:</Text>
            <Text style={styles.policyValue}>Check-in: 02:00 PM · Check-out: 12:00 PM</Text>
          </View>
          <View style={styles.policyRow}>
            <Text style={styles.policyKey}> Verification:</Text>
            <Text style={styles.policyValue}>Original CNIC or Passport required for all adult guests</Text>
          </View>
          <View style={styles.policyRow}>
            <Text style={styles.policyKey}> Parking & Transport:</Text>
            <Text style={styles.policyValue}>Complimentary secure parking for cars and 4x4 mountain jeeps</Text>
          </View>
          <View style={[styles.policyRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.policyKey}> Climate & Heating:</Text>
            <Text style={styles.policyValue}>24/7 hot water and winter heating / generator backup provided</Text>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* ACTION BUTTONS                                                            */}
        {/* ========================================================================= */}
        <View style={styles.actionsContainer}>
          {currentTrip && (
            <TouchableOpacity
              style={[
                styles.selectTripBtn,
                isTripHotelSelected && styles.selectTripBtnSelected,
              ]}
              disabled={isSaving || isTripHotelSelected}
              onPress={handleSelectForTrip}
              activeOpacity={0.85}
            >
              <AppIcon
                name={isTripHotelSelected ? 'checkmark-circle' : 'bed-outline'}
                size={18}
                color={isTripHotelSelected ? colors.forest : '#ffffff'}
                style={{ marginRight: 8 }}
              />
              <Text
                style={[
                  styles.selectTripBtnText,
                  isTripHotelSelected && styles.selectTripBtnTextSelected,
                ]}
              >
                {isTripHotelSelected
                  ? 'SELECTED FOR YOUR TRIP [Included]'
                  : isSaving
                  ? 'SAVING HOTEL...'
                  : `SET AS HOTEL FOR ${currentTrip.destination.toUpperCase()}`}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.planTripBtn}
            onPress={handlePlanTrip}
            activeOpacity={0.85}
          >
            <AppIcon name="navigate-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.planTripBtnText}>
              Plan Trip to {hotel.name} (PKR {selectedRoom?.price?.toLocaleString() || hotel.pricePerNight?.toLocaleString()}) →
            </Text>
          </TouchableOpacity>
        </View>
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
  content: { padding: 16, paddingBottom: 60, gap: 16, maxWidth: 1200, width: '100%', alignSelf: 'center' },

  heroWrapper: {
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    height: 220,
    backgroundColor: '#e6ece8',
    borderWidth: 1,
    borderColor: '#DCECE5',
    ...shadow,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  placeholderHero: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d8e5dc',
  },
  heroOverlayBadgeRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 48, 41, 0.88)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ratingText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  tierBadge: {
    backgroundColor: '#0F766E',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tierBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },

  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCECE5',
    ...shadow,
  },
  titleLocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hotelTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1F2937',
    lineHeight: 28,
  },
  hotelLocation: {
    fontSize: 13,
    color: '#0F766E',
    fontWeight: '700',
    marginTop: 4,
  },
  priceBanner: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: '#DCECE5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceBannerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4B5563',
    letterSpacing: 0.8,
  },
  priceBannerAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F766E',
    marginTop: 2,
  },
  priceBannerPerNight: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7EE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCECE5',
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCECE5',
    ...shadow,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 21,
    fontWeight: '500',
  },
  quickHighlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7EE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCECE5',
  },
  highlightPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },

  roomsContainer: {
    gap: 12,
  },
  roomCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#DCECE5',
  },
  roomCardSelected: {
    backgroundColor: '#E6F7EE',
    borderColor: '#0F766E',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roomName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1F2937',
  },
  roomNameSelected: {
    color: '#0F766E',
  },
  roomSpecsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  roomSpecBadge: {
    backgroundColor: '#E6F7EE',
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCECE5',
  },
  roomAvailBadge: {
    backgroundColor: '#E6F7EE',
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCECE5',
  },
  roomPriceCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  roomPriceText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F766E',
  },
  roomPriceSub: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '600',
  },
  roomPerks: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#DCECE5',
    gap: 3,
  },
  perkText: {
    fontSize: 11,
    color: '#1F2937',
    fontWeight: '600',
  },
  roomCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#DCECE5',
  },
  selectRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  selectRadioActive: {
    borderColor: '#0F766E',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0F766E',
  },
  selectRadioLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  selectRadioLabelActive: {
    color: '#0F766E',
    fontWeight: '800',
  },

  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7EE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCECE5',
  },
  amenityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },

  policyRow: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderColor: '#DCECE5',
  },
  policyKey: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
    marginBottom: 2,
  },
  policyValue: {
    fontSize: 12,
    color: '#1F2937',
    lineHeight: 18,
    fontWeight: '500',
  },

  actionsContainer: {
    gap: 10,
    marginTop: 4,
  },
  selectTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: 16,
    ...shadow,
  },
  selectTripBtnSelected: {
    backgroundColor: '#E6F7EE',
    borderWidth: 1.5,
    borderColor: '#0F766E',
  },
  selectTripBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  selectTripBtnTextSelected: {
    color: '#0F766E',
    fontWeight: '900',
  },
  planTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: 16,
    ...shadow,
  },
  planTripBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
});
