import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
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
import { colors, fonts } from '../theme';
import AppIcon from '../components/AppIcon';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const tabIcons = {
  Home: ['compass-outline', 'compass'],
  Map: ['map-outline', 'map'],
  Hotels: ['bed-outline', 'bed'],
  Budget: ['wallet-outline', 'wallet'],
  Profile: ['person-circle-outline', 'person-circle'],
};

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.forest,
      tabBarInactiveTintColor: '#89968f',
      tabBarStyle: { height: 66, paddingTop: 6, paddingBottom: 8, borderTopColor: colors.line, backgroundColor: colors.paper },
      tabBarLabelStyle: { fontSize: 10, fontFamily: fonts.bold },
      tabBarIcon: ({ color, focused }) => <AppIcon name={tabIcons[route.name][focused ? 1 : 0]} color={color} size={21} />,
    })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Hotels" component={HotelScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  function releaseWebFocus() {
    if (Platform.OS === 'web' && typeof document !== 'undefined' && document.activeElement?.blur) {
      document.activeElement.blur();
    }
  }

  return (
    <NavigationContainer onStateChange={releaseWebFocus}>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="MainApp" component={MainTabs} />
        <Stack.Screen name="Itinerary" component={ItineraryScreen} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
