import React, { useState, useEffect } from 'react';
import { Platform, View, StyleSheet, Pressable as TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './navigationRef';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import DestinationDetailScreen from '../screens/DestinationDetailScreen';
import CategoryCitiesScreen from '../screens/CategoryCitiesScreen';
import TripPlanningScreen from '../screens/TripPlanningScreen';
import ItineraryScreen from '../screens/ItineraryScreen';
import MapScreen from '../screens/MapScreen';
import HotelScreen from '../screens/HotelScreen';
import BudgetScreen from '../screens/BudgetScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TripSummaryScreen from '../screens/TripSummaryScreen';
import TravelPreferencesScreen from '../screens/TravelPreferencesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditTripScreen from '../screens/EditTripScreen';
import EditItineraryScreen from '../screens/EditItineraryScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import ExpenseHistoryScreen from '../screens/ExpenseHistoryScreen';
import ChatScreen from '../screens/ChatScreen';
import ChatHistoryScreen from '../screens/ChatHistoryScreen';
import ShareExportScreen from '../screens/ShareExportScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import AttractionDetailScreen from '../screens/AttractionDetailScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PrivacyDataScreen from '../screens/PrivacyDataScreen';
import AlertsScreen from '../screens/AlertsScreen';
import RecommendationExplanationScreen from '../screens/RecommendationExplanationScreen';
import ActivitySearchScreen from '../screens/ActivitySearchScreen';
import ProposedChangeScreen from '../screens/ProposedChangeScreen';
import HotelDetailScreen from '../screens/HotelDetailScreen';
import WeatherDetailScreen from '../screens/WeatherDetailScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import { colors, fonts } from '../theme';
import AppIcon from '../components/AppIcon';
import AppText from '../components/AppText';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TABS = [
  { id: 'Home', label: 'Home', icons: ['home-outline', 'home'], target: 'Home' },
  { id: 'Map', label: 'Map', icons: ['map-outline', 'map'], target: 'Map' },
  { id: 'Hotels', label: 'Hotels', icons: ['bed-outline', 'bed'], target: 'Hotels' },
  { id: 'Budget', label: 'Budget', icons: ['wallet-outline', 'wallet'], target: 'Budget' },
  { id: 'Profile', label: 'Profile', icons: ['person-outline', 'person'], target: 'Profile' },
];

const HIDE_BAR_ROUTES = ['Splash', 'AdminDashboard', 'Welcome', 'Login', 'Signup'];

function getActiveTab(routeName) {
  if (!routeName) return 'Home';
  if (routeName === 'Map' || routeName === 'RouteMap') return 'Map';
  if (routeName === 'Hotels' || routeName === 'HotelDetail') return 'Hotels';
  if (routeName === 'Budget' || routeName === 'AddExpense' || routeName === 'ExpenseHistory') return 'Budget';
  if (['Profile', 'EditProfile', 'Settings', 'TravelPreferences', 'PrivacyData', 'NotificationSettings', 'Login', 'Signup', 'Welcome'].includes(routeName)) {
    return 'Profile';
  }
  return 'Home';
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Handled globally by GlobalBottomBar across ALL screens
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Hotels" component={HotelScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [currentRoute, setCurrentRoute] = useState('Splash');

  function releaseWebFocus() {
    if (Platform.OS === 'web' && typeof document !== 'undefined' && document.activeElement?.blur) {
      document.activeElement.blur();
    }
  }

  function updateRoute() {
    if (navigationRef.isReady()) {
      const route = navigationRef.getCurrentRoute();
      if (route?.name && route.name !== currentRoute) {
        setCurrentRoute(route.name);
      }
    }
  }

  useEffect(() => {
    if (!navigationRef.isReady()) return;
    const unsubscribe = navigationRef.addListener('state', updateRoute);
    return unsubscribe;
  }, [navigationRef]);

  function handleTabPress(tab) {
    if (!navigationRef.isReady()) return;
    navigationRef.navigate('MainApp', { screen: tab.target });
  }

  const showBottomBar = !HIDE_BAR_ROUTES.includes(currentRoute);
  const activeTab = getActiveTab(currentRoute);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={updateRoute}
      onStateChange={() => {
        releaseWebFocus();
        updateRoute();
      }}
    >
      <View style={styles.rootContainer}>
        <View style={styles.screenContainer}>
          <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="DestinationDetail" component={DestinationDetailScreen} />
            <Stack.Screen name="CategoryCities" component={CategoryCitiesScreen} />
            <Stack.Screen name="TripPlanning" component={TripPlanningScreen} />
            <Stack.Screen name="MainApp" component={MainTabs} />
            <Stack.Screen name="Itinerary" component={ItineraryScreen} />
            <Stack.Screen name="RouteMap" component={MapScreen} />
            <Stack.Screen name="TripSummary" component={TripSummaryScreen} />
            <Stack.Screen name="TravelPreferences" component={TravelPreferencesScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="EditTrip" component={EditTripScreen} />
            <Stack.Screen name="EditItinerary" component={EditItineraryScreen} />
            <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
            <Stack.Screen name="ExpenseHistory" component={ExpenseHistoryScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="ChatHistory" component={ChatHistoryScreen} />
            <Stack.Screen name="ShareExport" component={ShareExportScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
            <Stack.Screen name="AttractionDetail" component={AttractionDetailScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="PrivacyData" component={PrivacyDataScreen} />
            <Stack.Screen name="Alerts" component={AlertsScreen} />
            <Stack.Screen name="RecommendationExplanation" component={RecommendationExplanationScreen} />
            <Stack.Screen name="ActivitySearch" component={ActivitySearchScreen} />
            <Stack.Screen name="ProposedChange" component={ProposedChangeScreen} />
            <Stack.Screen name="HotelDetail" component={HotelDetailScreen} />
            <Stack.Screen name="WeatherDetail" component={WeatherDetailScreen} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
          </Stack.Navigator>
        </View>

        {showBottomBar && (
          <View style={styles.bottomBar}>
            {TABS.map((tab) => {
              const isFocused = activeTab === tab.id;
              const iconName = tab.icons[isFocused ? 1 : 0];
              const iconColor = isFocused ? '#0F766E' : '#64748b';
              const labelColor = isFocused ? '#0F766E' : '#64748b';
              return (
                <TouchableOpacity
                  key={tab.id}
                  accessibilityRole="button"
                  accessibilityLabel={tab.label}
                  style={styles.tabItem}
                  onPress={() => handleTabPress(tab)}
                >
                  <AppIcon name={iconName} color={iconColor} size={22} />
                  <AppText
                    style={[
                      styles.tabLabel,
                      {
                        color: labelColor,
                        fontFamily: isFocused ? fonts.bold : fonts.medium,
                      },
                    ]}
                  >
                    {tab.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0a2318',
  },
  screenContainer: {
    flex: 1,
  },
  bottomBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(220, 236, 229, 0.85)',
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 14 : 10,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 8 : 6,
    elevation: 8,
    shadowColor: '#072517',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)' } : {}),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 3,
  },
});
