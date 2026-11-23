import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable as TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../api/client';
import Text from '../../components/AppText';
import AppIcon from '../../components/AppIcon';
import { colors, fonts, radius, shadow } from '../../theme';

const MENU_ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'grid-outline' },
  { id: 'budget', label: 'Budget Allocation', icon: 'pie-chart-outline' },
  { id: 'trips', label: 'Trips', icon: 'map-outline' },
  { id: 'customers', label: 'Customers', icon: 'people-outline' },
  { id: 'destinations', label: 'Destinations', icon: 'location-outline' },
  { id: 'transport', label: 'Transport', icon: 'car-sport-outline' },
  { id: 'hotels', label: 'Hotels', icon: 'bed-outline' },
  { id: 'food', label: 'Food & Menus', icon: 'restaurant-outline' },
  { id: 'activities', label: 'Activities', icon: 'sparkles-outline' },
  { id: 'bookings', label: 'Bookings & Reservations', icon: 'calendar-outline' },
  { id: 'financials', label: 'Revenue & Expenses', icon: 'wallet-outline' },
  { id: 'reports', label: 'Reports', icon: 'bar-chart-outline' },
  { id: 'profile', label: 'Admin Profile', icon: 'person-circle-outline' },
];

export default function AdminDashboardScreen({ navigation }) {
  const { user, token, logout } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Overview data
  const [overview, setOverview] = useState(null);

  // Tab specific data
  const [budgetData, setBudgetData] = useState(null);
  const [tripsData, setTripsData] = useState([]);
  const [tripFilter, setTripFilter] = useState('All');
  const [tripSearch, setTripSearch] = useState('');
  const [customersData, setCustomersData] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [destinationsData, setDestinationsData] = useState([]);
  const [vehiclesData, setVehiclesData] = useState([]);
  const [hotelsData, setHotelsData] = useState([]);
  const [selectedCityHotel, setSelectedCityHotel] = useState('All');
  const [menusData, setMenusData] = useState([]);
  const [selectedCityMenu, setSelectedCityMenu] = useState('All');
  const [activitiesData, setActivitiesData] = useState([]);
  const [bookingsData, setBookingsData] = useState([]);
  const [financialsData, setFinancialsData] = useState(null);
  const [reportsData, setReportsData] = useState(null);
  const [budgetSimulatorAmount, setBudgetSimulatorAmount] = useState('100000');

  // Modals
  const [modalType, setModalType] = useState(null); // 'vehicle', 'hotel', 'menu', 'activity', 'expense', 'status'
  const [modalForm, setModalForm] = useState({});
  const [submittingModal, setSubmittingModal] = useState(false);
  const [selectedTripForStatus, setSelectedTripForStatus] = useState(null);

  // Load Overview Data
  const loadOverview = useCallback(async () => {
    try {
      const data = await apiRequest('/admin/dashboard', { token });
      setOverview(data);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load dashboard statistics');
    }
  }, [token]);

  // Load Active Tab Data
  const loadTabData = useCallback(async (tab) => {
    try {
      if (tab === 'overview') {
        await loadOverview();
      } else if (tab === 'budget') {
        const data = await apiRequest('/admin/budget-allocation', { token });
        setBudgetData(data);
      } else if (tab === 'trips') {
        const data = await apiRequest(`/admin/trips?status=${tripFilter}&search=${encodeURIComponent(tripSearch)}`, { token });
        setTripsData(data.trips || []);
      } else if (tab === 'customers') {
        const data = await apiRequest(`/admin/customers?search=${encodeURIComponent(customerSearch)}`, { token });
        setCustomersData(data.customers || []);
      } else if (tab === 'destinations') {
        const data = await apiRequest('/admin/destinations', { token });
        setDestinationsData(data.destinations || []);
      } else if (tab === 'transport') {
        const data = await apiRequest('/admin/vehicles', { token });
        setVehiclesData(data.vehicles || []);
      } else if (tab === 'hotels') {
        const data = await apiRequest(`/admin/hotels?city=${selectedCityHotel}`, { token });
        setHotelsData(data.hotels || []);
      } else if (tab === 'food') {
        const data = await apiRequest(`/admin/menu-items?city=${selectedCityMenu}`, { token });
        setMenusData(data.menuItems || []);
      } else if (tab === 'activities') {
        const data = await apiRequest('/admin/activities', { token });
        setActivitiesData(data.activities || []);
      } else if (tab === 'bookings') {
        const data = await apiRequest('/admin/bookings', { token });
        setBookingsData(data.bookings || []);
      } else if (tab === 'financials') {
        const data = await apiRequest('/admin/revenue-expenses', { token });
        setFinancialsData(data);
      } else if (tab === 'reports') {
        const data = await apiRequest('/admin/reports', { token });
        setReportsData(data);
      }
    } catch (err) {
      setErrorMsg(err.message || `Failed to load ${tab} data`);
    }
  }, [token, loadOverview, tripFilter, tripSearch, customerSearch, selectedCityHotel, selectedCityMenu]);

  // Client-side role authorization guard
  useEffect(() => {
    if (!token) {
      navigation.replace('Login');
      return;
    }
    if (user && user.role !== 'admin') {
      navigation.replace('MainApp');
      return;
    }
  }, [user, token, navigation]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (user && user.role !== 'admin') return;
      setLoading(true);
      setErrorMsg('');
      await loadTabData(activeTab);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [activeTab, loadTabData, user]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadTabData(activeTab);
    setRefreshing(false);
  }

  function handleLogout() {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out of the Admin Console?')) {
        logout();
        navigation.replace('Login');
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => { logout(); navigation.replace('Login'); } },
      ]);
    }
  }

  // Generic Submit Modal
  async function handleModalSubmit() {
    setSubmittingModal(true);
    try {
      if (modalType === 'vehicle') {
        await apiRequest('/admin/vehicles', { method: 'POST', token, body: modalForm });
        await loadTabData('transport');
      } else if (modalType === 'hotel') {
        await apiRequest('/admin/hotels', { method: 'POST', token, body: modalForm });
        await loadTabData('hotels');
      } else if (modalType === 'menu') {
        await apiRequest('/admin/menu-items', { method: 'POST', token, body: modalForm });
        await loadTabData('food');
      } else if (modalType === 'activity') {
        await apiRequest('/admin/activities', { method: 'POST', token, body: modalForm });
        await loadTabData('activities');
      } else if (modalType === 'expense') {
        await apiRequest('/admin/expenses', { method: 'POST', token, body: modalForm });
        await loadTabData('financials');
      } else if (modalType === 'status' && selectedTripForStatus) {
        await apiRequest(`/admin/trips/${selectedTripForStatus.id}/status`, {
          method: 'PATCH',
          token,
          body: {
            status: modalForm.status,
            paymentStatus: modalForm.paymentStatus,
            amountPaid: modalForm.amountPaid,
          },
        });
        await loadTabData('trips');
      }
      setModalType(null);
      setModalForm({});
    } catch (err) {
      alert(err.message || 'Operation failed');
    } finally {
      setSubmittingModal(false);
    }
  }

  // Delete Handlers
  async function handleDeleteVehicle(id) {
    if (Platform.OS === 'web' && !window.confirm('Delete this vehicle from fleet?')) return;
    try {
      await apiRequest(`/admin/vehicles/${id}`, { method: 'DELETE', token });
      loadTabData('transport');
    } catch (err) { alert(err.message); }
  }

  async function handleDeleteHotel(id) {
    if (Platform.OS === 'web' && !window.confirm('Delete this hotel?')) return;
    try {
      await apiRequest(`/admin/hotels/${id}`, { method: 'DELETE', token });
      loadTabData('hotels');
    } catch (err) { alert(err.message); }
  }

  async function handleDeleteMenuItem(id) {
    if (Platform.OS === 'web' && !window.confirm('Delete this menu item?')) return;
    try {
      await apiRequest(`/admin/menu-items/${id}`, { method: 'DELETE', token });
      loadTabData('food');
    } catch (err) { alert(err.message); }
  }

  async function handleDeleteActivity(id) {
    if (Platform.OS === 'web' && !window.confirm('Delete this activity?')) return;
    try {
      await apiRequest(`/admin/activities/${id}`, { method: 'DELETE', token });
      loadTabData('activities');
    } catch (err) { alert(err.message); }
  }

  async function downloadCSV() {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(`${apiRequest.API_BASE_URL || 'http://localhost:5000/api'}/admin/reports?format=csv&token=${token}`, '_blank');
      } else {
        Alert.alert('CSV Export', 'CSV report has been generated on the server.');
      }
    } catch (e) {
      alert('Could not export CSV');
    }
  }

  // Render Overview Section (Exact design from user mockup media_1795188057102_3221e070.jpg)
  function renderOverview() {
    if (!overview) return null;
    const { kpis, monthlyPerformance = [], budgetAllocation } = overview;

    // Find max for bar scaling
    const maxVal = Math.max(1, ...monthlyPerformance.map((m) => Math.max(m.revenue, m.expenses)));

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Dashboard Overview</Text>
          <View style={styles.liveBadge}>
            <View style={styles.greenPulseDot} />
            <Text style={styles.liveBadgeText}>Live Database Connected</Text>
          </View>
        </View>

        {/* 4 PRIMARY KPI CARDS (Matching uploaded mockup image) */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Total Trips */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiCardTop}>
              <AppIcon name="map-outline" size={20} color="#15803d" />
              <Text style={styles.kpiLabel}>Total Trips</Text>
            </View>
            <Text style={styles.kpiValue}>{kpis.totalTrips}</Text>
            <Text style={styles.kpiSub}>Active recorded itineraries</Text>
          </View>

          {/* Card 2: Customers */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiCardTop}>
              <AppIcon name="people-outline" size={20} color="#0ea5e9" />
              <Text style={styles.kpiLabel}>Customers</Text>
            </View>
            <Text style={styles.kpiValue}>{kpis.totalCustomers}</Text>
            <Text style={styles.kpiSub}>{kpis.customersWithTrips} booked active trips</Text>
          </View>

          {/* Card 3: Revenue */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiCardTop}>
              <AppIcon name="wallet-outline" size={20} color="#d97706" />
              <Text style={styles.kpiLabel}>Revenue</Text>
            </View>
            <Text style={styles.kpiValue}>PKR {Number(kpis.totalRevenue).toLocaleString()}</Text>
            <Text style={styles.kpiSub}>Total customer package value</Text>
          </View>

          {/* Card 4: Company Profit */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiCardTop}>
              <AppIcon name="trending-up-outline" size={20} color="#15803d" />
              <Text style={styles.kpiLabel}>Company Profit</Text>
            </View>
            <Text style={[styles.kpiValue, { color: '#15803d' }]}>
              PKR {Number(kpis.companyProfit).toLocaleString()}
            </Text>
            <Text style={styles.kpiSub}>{kpis.profitMargin}% gross margin</Text>
          </View>
        </View>

        {/* MONTHLY BUSINESS PERFORMANCE (Grouped Bar Chart matching mockup) */}
        <View style={styles.chartCard}>
          <View style={styles.chartCardHeader}>
            <View>
              <Text style={styles.chartTitle}>Monthly Business Performance</Text>
              <Text style={styles.chartSubtitle}>Revenue vs Expenses</Text>
            </View>
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>Bar chart</Text>
            </View>
          </View>

          {/* Grouped Bar Chart */}
          <View style={styles.chartArea}>
            <View style={styles.chartBarsContainer}>
              {monthlyPerformance.map((item, idx) => {
                const revHeight = Math.max(8, Math.round((item.revenue / maxVal) * 140));
                const expHeight = Math.max(8, Math.round((item.expenses / maxVal) * 140));
                return (
                  <View key={idx} style={styles.barGroup}>
                    <View style={styles.barsPair}>
                      {/* Revenue Bar */}
                      <View style={[styles.singleBar, { height: revHeight, backgroundColor: '#15803d' }]} />
                      {/* Expenses Bar */}
                      <View style={[styles.singleBar, { height: expHeight, backgroundColor: '#f97316' }]} />
                    </View>
                    <Text style={styles.monthLabel}>{item.month[0]}</Text>
                  </View>
                );
              })}
            </View>

            {/* Legend for Chart */}
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: '#15803d' }]} />
                <Text style={styles.legendText}>Revenue</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: '#f97316' }]} />
                <Text style={styles.legendText}>Expenses</Text>
              </View>
            </View>
          </View>
        </View>

        {/* BUDGET ALLOCATION SECTION (Matching uploaded mockup) */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Budget Allocation</Text>
          <Text style={styles.chartSubtitle}>Target Company Cost Distribution</Text>

          {/* Color Dots Legend matching mockup */}
          <View style={styles.allocationLegendList}>
            <View style={styles.allocRow}>
              <View style={styles.allocLeft}>
                <View style={[styles.dot, { backgroundColor: '#15803d' }]} />
                <Text style={styles.allocName}>Transport</Text>
              </View>
              <Text style={styles.allocPct}>35%</Text>
            </View>
            <View style={styles.allocRow}>
              <View style={styles.allocLeft}>
                <View style={[styles.dot, { backgroundColor: '#0ea5e9' }]} />
                <Text style={styles.allocName}>Food</Text>
              </View>
              <Text style={styles.allocPct}>35%</Text>
            </View>
            <View style={styles.allocRow}>
              <View style={styles.allocLeft}>
                <View style={[styles.dot, { backgroundColor: '#d97706' }]} />
                <Text style={styles.allocName}>Hotel</Text>
              </View>
              <Text style={styles.allocPct}>15%</Text>
            </View>
            <View style={styles.allocRow}>
              <View style={styles.allocLeft}>
                <View style={[styles.dot, { backgroundColor: '#8b5cf6' }]} />
                <Text style={styles.allocName}>Activities</Text>
              </View>
              <Text style={styles.allocPct}>10%</Text>
            </View>
            <View style={styles.allocRow}>
              <View style={styles.allocLeft}>
                <View style={[styles.dot, { backgroundColor: '#64748b' }]} />
                <Text style={styles.allocName}>Reserve</Text>
              </View>
              <Text style={styles.allocPct}>5%</Text>
            </View>
          </View>

          {/* Stacked Percentage Bar */}
          <View style={styles.stackedBarContainer}>
            <View style={[styles.stackedSegment, { flex: 35, backgroundColor: '#15803d' }]} />
            <View style={[styles.stackedSegment, { flex: 35, backgroundColor: '#0ea5e9' }]} />
            <View style={[styles.stackedSegment, { flex: 15, backgroundColor: '#d97706' }]} />
            <View style={[styles.stackedSegment, { flex: 10, backgroundColor: '#8b5cf6' }]} />
            <View style={[styles.stackedSegment, { flex: 5, backgroundColor: '#64748b' }]} />
          </View>
        </View>

        {/* POPULAR DESTINATIONS & STATUS BREAKDOWN */}
        <View style={styles.twoColumnRow}>
          <View style={[styles.chartCard, { flex: 1, minWidth: 280 }]}>
            <Text style={styles.chartTitle}>Popular Destinations</Text>
            {(overview.popularDestinations || []).map((d, i) => (
              <View key={i} style={styles.popularRow}>
                <Text style={styles.popularName}>{d.destination}</Text>
                <View style={styles.popularBarTrack}>
                  <View
                    style={[
                      styles.popularBarFill,
                      { width: `${Math.min(100, (d.count / Math.max(1, kpis.totalTrips)) * 100 * 2.5)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.popularCount}>{d.count} trips</Text>
              </View>
            ))}
          </View>

          <View style={[styles.chartCard, { flex: 1, minWidth: 280 }]}>
            <Text style={styles.chartTitle}>Booking Status Distribution</Text>
            {Object.entries(overview.statusDistribution || {}).map(([st, cnt], i) => (
              <View key={i} style={styles.statusRow}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{st}</Text>
                </View>
                <Text style={styles.statusCount}>{cnt} bookings</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // Render Smart Budget Allocation Section
  function renderBudgetAllocation() {
    if (!budgetData) return <ActivityIndicator size="large" color="#15803d" style={{ marginTop: 40 }} />;
    const { targets, overall, tripsBudgetList = [] } = budgetData;

    const simAmount = Number(budgetSimulatorAmount) || 0;
    const allocTransport = Math.round(simAmount * 0.35);
    const allocHotel = Math.round(simAmount * 0.35);
    const allocFood = Math.round(simAmount * 0.15);
    const allocActivities = Math.round(simAmount * 0.10);
    const allocReserve = Math.round(simAmount * 0.05);

    return (
      <View style={styles.sectionContainer}>
        {/* SUPERVISOR'S SMART BUDGET ALLOCATION FORMULA CARD (Hidden from public travelers) */}
        <View style={styles.supervisorFormulaCard}>
          <View style={styles.formulaHeaderRow}>
            <View style={styles.formulaTitleLeft}>
              <AppIcon name="pie-chart-outline" size={24} color="#15803d" />
              <View>
                <Text style={styles.formulaCardTitle}>Supervisor's Smart Budget Allocation (100%)</Text>
                <Text style={styles.formulaBadge}>🔒 Internal Admin & Supervisor Formula • Protected from Public Travelers</Text>
              </View>
            </View>
          </View>

          <Text style={styles.formulaSubtitle}>
            {simAmount > 0
              ? `Verified distribution based on supervisor's budget formula for PKR ${simAmount.toLocaleString()}:`
              : "Verified distribution based on supervisor's budget formula (enter budget below to view live distribution):"}
          </Text>

          {/* Quick interactive test calculator */}
          <View style={styles.simulatorRow}>
            <Text style={styles.simulatorLabel}>Test Budget Simulator:</Text>
            <View style={styles.simulatorInputWrap}>
              <Text style={styles.currencyPrefix}>PKR</Text>
              <TextInput
                style={styles.simulatorInput}
                keyboardType="numeric"
                value={budgetSimulatorAmount}
                onChangeText={(val) => setBudgetSimulatorAmount(val.replace(/[^0-9]/g, ''))}
                placeholder="100000"
              />
            </View>
            <View style={styles.quickPresetRow}>
              {['50000', '100000', '250000', '500000'].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetBtn,
                    budgetSimulatorAmount === preset && styles.presetBtnActive,
                  ]}
                  onPress={() => setBudgetSimulatorAmount(preset)}
                >
                  <Text
                    style={[
                      styles.presetBtnText,
                      budgetSimulatorAmount === preset && styles.presetBtnTextActive,
                    ]}
                  >
                    PKR {Number(preset) >= 1000 ? `${Number(preset) / 1000}k` : preset}
                  </Text>
                </TouchableOpacity>
              ))}
              {overall?.totalRevenue ? (
                <TouchableOpacity
                  style={[
                    styles.presetBtn,
                    budgetSimulatorAmount === String(overall.totalRevenue) && styles.presetBtnActive,
                  ]}
                  onPress={() => setBudgetSimulatorAmount(String(overall.totalRevenue))}
                >
                  <Text
                    style={[
                      styles.presetBtnText,
                      budgetSimulatorAmount === String(overall.totalRevenue) && styles.presetBtnTextActive,
                    ]}
                  >
                    Managed Total (PKR {Number(overall.totalRevenue).toLocaleString()})
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Multi-slice Progress Bar */}
          <View style={styles.formulaBarContainer}>
            <View style={[styles.formulaSegment, { flex: 35, backgroundColor: '#2563eb' }]} />
            <View style={[styles.formulaSegment, { flex: 35, backgroundColor: '#059669' }]} />
            <View style={[styles.formulaSegment, { flex: 15, backgroundColor: '#d97706' }]} />
            <View style={[styles.formulaSegment, { flex: 10, backgroundColor: '#7c3aed' }]} />
            <View style={[styles.formulaSegment, { flex: 5, backgroundColor: '#0284c7' }]} />
          </View>

          {/* 5 Allocation Cards Grid */}
          <View style={styles.formulaGrid}>
            <View style={styles.formulaAllocCard}>
              <View style={[styles.formulaDot, { backgroundColor: '#2563eb' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.formulaCardHeader}>🚗 Transport (35%)</Text>
                <Text style={styles.formulaCardValue}>PKR {allocTransport.toLocaleString()}</Text>
                <Text style={styles.formulaCardNote}>Rent, fuel & driver</Text>
              </View>
            </View>

            <View style={styles.formulaAllocCard}>
              <View style={[styles.formulaDot, { backgroundColor: '#059669' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.formulaCardHeader}>🏨 Hotel / Stay (35%)</Text>
                <Text style={styles.formulaCardValue}>PKR {allocHotel.toLocaleString()}</Text>
                <Text style={styles.formulaCardNote}>PKR {Math.round(allocHotel / 3).toLocaleString()} / night (3 nights)</Text>
              </View>
            </View>

            <View style={styles.formulaAllocCard}>
              <View style={[styles.formulaDot, { backgroundColor: '#d97706' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.formulaCardHeader}>🍽️ Food (15%)</Text>
                <Text style={styles.formulaCardValue}>PKR {allocFood.toLocaleString()}</Text>
                <Text style={styles.formulaCardNote}>Dinner & refreshments</Text>
              </View>
            </View>

            <View style={styles.formulaAllocCard}>
              <View style={[styles.formulaDot, { backgroundColor: '#7c3aed' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.formulaCardHeader}>🎯 Activities (10%)</Text>
                <Text style={styles.formulaCardValue}>PKR {allocActivities.toLocaleString()}</Text>
                <Text style={styles.formulaCardNote}>Sights & entry points</Text>
              </View>
            </View>

            <View style={styles.formulaAllocCard}>
              <View style={[styles.formulaDot, { backgroundColor: '#0284c7' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.formulaCardHeader}>🛡️ Reserve & Buffer (5%)</Text>
                <Text style={styles.formulaCardValue}>PKR {allocReserve.toLocaleString()}</Text>
                <Text style={styles.formulaCardNote}>Contingency & profit margin</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Existing Performance KPIs */}
        <Text style={styles.sectionTitle}>Budget Performance & Cost Realization</Text>
        <Text style={styles.sectionSubtitle}>
          Live comparison of total actual expenses across all customer itineraries against supervisor targets:
        </Text>

        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Managed Budget</Text>
            <Text style={styles.kpiValue}>PKR {Number(overall.totalRevenue).toLocaleString()}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Actual Transport Cost</Text>
            <Text style={styles.kpiValue}>PKR {Number(overall.transportActual).toLocaleString()}</Text>
            <Text style={styles.kpiSub}>Target: 35%</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Actual Hotel Cost</Text>
            <Text style={styles.kpiValue}>PKR {Number(overall.hotelActual).toLocaleString()}</Text>
            <Text style={styles.kpiSub}>Target: 35%</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Actual Food Cost</Text>
            <Text style={styles.kpiValue}>PKR {Number(overall.foodActual).toLocaleString()}</Text>
            <Text style={styles.kpiSub}>Target: 15%</Text>
          </View>
        </View>

        {/* Trips Table */}
        <View style={styles.tableCard}>
          <Text style={styles.tableTitle}>Trip-by-Trip Budget Allocations</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { width: 140 }]}>Destination</Text>
                <Text style={[styles.th, { width: 110 }]}>Total Budget</Text>
                <Text style={[styles.th, { width: 100 }]}>Transport</Text>
                <Text style={[styles.th, { width: 100 }]}>Hotel</Text>
                <Text style={[styles.th, { width: 100 }]}>Food</Text>
                <Text style={[styles.th, { width: 100 }]}>Activities</Text>
                <Text style={[styles.th, { width: 100 }]}>Reserve (5%)</Text>
                <Text style={[styles.th, { width: 90 }]}>Status</Text>
              </View>
              {tripsBudgetList.map((t, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.td, { width: 140, fontWeight: 'bold' }]}>{t.destination}</Text>
                  <Text style={[styles.td, { width: 110 }]}>PKR {Number(t.totalBudget).toLocaleString()}</Text>
                  <Text style={[styles.td, { width: 100 }]}>PKR {Number(t.breakdown.transport).toLocaleString()}</Text>
                  <Text style={[styles.td, { width: 100 }]}>PKR {Number(t.breakdown.hotel || t.breakdown.food).toLocaleString()}</Text>
                  <Text style={[styles.td, { width: 100 }]}>PKR {Number(t.breakdown.food || t.breakdown.hotel).toLocaleString()}</Text>
                  <Text style={[styles.td, { width: 100 }]}>PKR {Number(t.breakdown.activities).toLocaleString()}</Text>
                  <Text style={[styles.td, { width: 100, color: '#64748b' }]}>PKR {Number(t.breakdown.reserve).toLocaleString()}</Text>
                  <View style={[styles.statusBadge, { width: 85 }]}>
                    <Text style={styles.statusBadgeText}>{t.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // Render Trips Management
  function renderTrips() {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Trips Management ({tripsData.length})</Text>
        </View>

        {/* Filter and Search */}
        <View style={styles.filterBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search destination, customer, title..."
            value={tripSearch}
            onChangeText={setTripSearch}
            onSubmitEditing={() => loadTabData('trips')}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPills}>
            {['All', 'Confirmed', 'Upcoming', 'In Progress', 'Completed', 'Cancelled'].map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.filterPill, tripFilter === st && styles.filterPillActive]}
                onPress={() => setTripFilter(st)}
              >
                <Text style={[styles.filterPillText, tripFilter === st && styles.filterPillTextActive]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Trips Table */}
        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { width: 140 }]}>Destination</Text>
                <Text style={[styles.th, { width: 130 }]}>Customer</Text>
                <Text style={[styles.th, { width: 90 }]}>Days / Pax</Text>
                <Text style={[styles.th, { width: 110 }]}>Total Cost</Text>
                <Text style={[styles.th, { width: 100 }]}>Trip Status</Text>
                <Text style={[styles.th, { width: 100 }]}>Payment</Text>
                <Text style={[styles.th, { width: 100 }]}>Actions</Text>
              </View>
              {tripsData.map((trip) => (
                <View key={trip.id} style={styles.tableRow}>
                  <View style={{ width: 140 }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: '#1e293b' }}>{trip.destination}</Text>
                    <Text style={{ fontSize: 11, color: '#64748b' }}>From {trip.departureLocation}</Text>
                  </View>
                  <View style={{ width: 130 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600' }}>{trip.customerName}</Text>
                    <Text style={{ fontSize: 10, color: '#64748b' }}>{trip.customerEmail}</Text>
                  </View>
                  <Text style={[styles.td, { width: 90 }]}>{trip.durationDays}d / {trip.passengers}p</Text>
                  <Text style={[styles.td, { width: 110, fontWeight: 'bold' }]}>PKR {Number(trip.totalCost).toLocaleString()}</Text>
                  <View style={[styles.statusBadge, { width: 95 }]}>
                    <Text style={styles.statusBadgeText}>{trip.status}</Text>
                  </View>
                  <Text style={[styles.td, { width: 100, color: trip.paymentStatus === 'Paid' ? '#15803d' : '#d97706' }]}>
                    {trip.paymentStatus}
                  </Text>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                      setSelectedTripForStatus(trip);
                      setModalForm({
                        status: trip.status,
                        paymentStatus: trip.paymentStatus,
                        amountPaid: String(trip.amountPaid || 0),
                      });
                      setModalType('status');
                    }}
                  >
                    <Text style={styles.actionBtnText}>Edit Status</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // Render Customers Section
  function renderCustomers() {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Customers Management ({customersData.length})</Text>
        <TextInput
          style={[styles.searchInput, { marginVertical: 12 }]}
          placeholder="Search by name or email..."
          value={customerSearch}
          onChangeText={setCustomerSearch}
          onSubmitEditing={() => loadTabData('customers')}
        />

        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { width: 150 }]}>Name</Text>
                <Text style={[styles.th, { width: 180 }]}>Email</Text>
                <Text style={[styles.th, { width: 90 }]}>Trips</Text>
                <Text style={[styles.th, { width: 120 }]}>Total Spend</Text>
                <Text style={[styles.th, { width: 110 }]}>Joined Date</Text>
                <Text style={[styles.th, { width: 100 }]}>Actions</Text>
              </View>
              {customersData.map((c) => (
                <View key={c.id} style={styles.tableRow}>
                  <Text style={[styles.td, { width: 150, fontWeight: 'bold' }]}>{c?.fullName || 'Customer'}</Text>
                  <Text style={[styles.td, { width: 180, color: '#64748b' }]}>{c?.email || ''}</Text>
                  <Text style={[styles.td, { width: 90 }]}>{c?.tripsCount || 0}</Text>
                  <Text style={[styles.td, { width: 120, fontWeight: 'bold' }]}>PKR {Number(c?.totalSpend || 0).toLocaleString()}</Text>
                  <Text style={[styles.td, { width: 110 }]}>{new Date(c?.joinedAt || Date.now()).toLocaleDateString()}</Text>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={async () => {
                      const det = await apiRequest(`/admin/customers/${c.id}`, { token });
                      setSelectedCustomer(det);
                    }}
                  >
                    <Text style={styles.actionBtnText}>View Ledger</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Customer Ledger Modal */}
        {selectedCustomer && (
          <Modal visible transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalBox, { maxWidth: 600 }]}>
                <Text style={styles.modalTitle}>{selectedCustomer?.customer?.fullName || selectedCustomer?.fullName || 'Customer'}'s Booking History</Text>
                <Text style={styles.sectionSubtitle}>{selectedCustomer?.customer?.email || selectedCustomer?.email || ''}</Text>
                <Text style={{ fontWeight: 'bold', marginVertical: 8, color: '#15803d' }}>
                  Total Spend: PKR {Number(selectedCustomer?.stats?.totalSpend || 0).toLocaleString()} ({selectedCustomer?.stats?.tripsCount || 0} trips)
                </Text>

                <ScrollView style={{ maxHeight: 300, marginVertical: 10 }}>
                  {(selectedCustomer.trips || []).map((t, idx) => (
                    <View key={idx} style={styles.ledgerRow}>
                      <View>
                        <Text style={{ fontWeight: 'bold' }}>{t.destination}</Text>
                        <Text style={{ fontSize: 11, color: '#64748b' }}>{new Date(t.createdAt).toLocaleDateString()}</Text>
                      </View>
                      <Text style={{ fontWeight: 'bold', color: '#15803d' }}>
                        PKR {Number(t.budget?.estimatedTotal || t.budget?.totalCost || 0).toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </ScrollView>

                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedCustomer(null)}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  }

  // Render Transportation Management
  function renderTransport() {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Transport & Fleet Management</Text>
          <TouchableOpacity
            style={styles.primaryAddBtn}
            onPress={() => {
              setModalForm({
                type: 'Toyota Corolla / Sedan',
                name: 'Toyota Corolla GLi',
                category: 'Standard',
                capacity: '4',
                luggageCapacity: '2',
                fuelType: 'Petrol',
                pricePerDay: '6500',
                driverChargePerDay: '1500',
              });
              setModalType('vehicle');
            }}
          >
            <AppIcon name="add-outline" size={18} color="#fff" />
            <Text style={styles.primaryAddBtnText}>Add Vehicle</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { width: 140 }]}>Vehicle</Text>
                <Text style={[styles.th, { width: 100 }]}>Category</Text>
                <Text style={[styles.th, { width: 80 }]}>Seats</Text>
                <Text style={[styles.th, { width: 110 }]}>Daily Rent</Text>
                <Text style={[styles.th, { width: 110 }]}>Driver Charge</Text>
                <Text style={[styles.th, { width: 90 }]}>Status</Text>
                <Text style={[styles.th, { width: 80 }]}>Action</Text>
              </View>
              {vehiclesData.map((v) => (
                <View key={v._id} style={styles.tableRow}>
                  <View style={{ width: 140 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 13 }}>{v.name}</Text>
                    <Text style={{ fontSize: 11, color: '#64748b' }}>{v.fuelType}</Text>
                  </View>
                  <Text style={[styles.td, { width: 100 }]}>{v.category}</Text>
                  <Text style={[styles.td, { width: 80 }]}>{v.capacity} pax</Text>
                  <Text style={[styles.td, { width: 110, fontWeight: 'bold' }]}>PKR {Number(v.pricePerDay).toLocaleString()}</Text>
                  <Text style={[styles.td, { width: 110 }]}>PKR {Number(v.driverChargePerDay).toLocaleString()}</Text>
                  <Text style={[styles.td, { width: 90, color: v.isAvailable ? '#15803d' : '#dc2626' }]}>
                    {v.isAvailable ? 'Available' : 'Assigned'}
                  </Text>
                  <TouchableOpacity style={styles.delBtn} onPress={() => handleDeleteVehicle(v._id)}>
                    <AppIcon name="trash-outline" size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // Render Hotels Management
  function renderHotels() {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Hotels Management</Text>
          <TouchableOpacity
            style={styles.primaryAddBtn}
            onPress={() => {
              setModalForm({
                name: 'Serena Luxury Resort',
                city: 'Islamabad',
                category: 'Luxury',
                starRating: '5',
                pricePerNight: '28000',
              });
              setModalType('hotel');
            }}
          >
            <AppIcon name="add-outline" size={18} color="#fff" />
            <Text style={styles.primaryAddBtnText}>Add Hotel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { width: 180 }]}>Hotel Name</Text>
                <Text style={[styles.th, { width: 120 }]}>City</Text>
                <Text style={[styles.th, { width: 100 }]}>Category</Text>
                <Text style={[styles.th, { width: 80 }]}>Rating</Text>
                <Text style={[styles.th, { width: 110 }]}>Rate / Night</Text>
                <Text style={[styles.th, { width: 80 }]}>Action</Text>
              </View>
              {hotelsData.map((h) => (
                <View key={h._id} style={styles.tableRow}>
                  <Text style={[styles.td, { width: 180, fontWeight: 'bold' }]}>{h.name}</Text>
                  <Text style={[styles.td, { width: 120 }]}>{h.city}</Text>
                  <Text style={[styles.td, { width: 100 }]}>{h.category}</Text>
                  <Text style={[styles.td, { width: 80 }]}>⭐ {h.starRating}</Text>
                  <Text style={[styles.td, { width: 110, fontWeight: 'bold' }]}>PKR {Number(h.pricePerNight).toLocaleString()}</Text>
                  <TouchableOpacity style={styles.delBtn} onPress={() => handleDeleteHotel(h._id)}>
                    <AppIcon name="trash-outline" size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // Render Food & Menus
  function renderFood() {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Food & Menu Management</Text>
          <TouchableOpacity
            style={styles.primaryAddBtn}
            onPress={() => {
              setModalForm({
                name: 'Hunza Traditional Chapshuro',
                city: 'Hunza Valley',
                mealType: 'Dinner',
                price: '950',
                cuisine: 'Traditional Gilgit',
                isSpecialty: true,
              });
              setModalType('menu');
            }}
          >
            <AppIcon name="add-outline" size={18} color="#fff" />
            <Text style={styles.primaryAddBtnText}>Add Menu Item</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { width: 180 }]}>Dish Name</Text>
                <Text style={[styles.th, { width: 130 }]}>City</Text>
                <Text style={[styles.th, { width: 100 }]}>Meal Type</Text>
                <Text style={[styles.th, { width: 110 }]}>Price</Text>
                <Text style={[styles.th, { width: 100 }]}>Specialty</Text>
                <Text style={[styles.th, { width: 80 }]}>Action</Text>
              </View>
              {menusData.map((m) => (
                <View key={m._id} style={styles.tableRow}>
                  <Text style={[styles.td, { width: 180, fontWeight: 'bold' }]}>{m.name}</Text>
                  <Text style={[styles.td, { width: 130 }]}>{m.city}</Text>
                  <Text style={[styles.td, { width: 100 }]}>{m.mealType}</Text>
                  <Text style={[styles.td, { width: 110, fontWeight: 'bold' }]}>PKR {Number(m.price).toLocaleString()}</Text>
                  <Text style={[styles.td, { width: 100, color: m.isSpecialty ? '#15803d' : '#64748b' }]}>
                    {m.isSpecialty ? 'Specialty' : 'Standard'}
                  </Text>
                  <TouchableOpacity style={styles.delBtn} onPress={() => handleDeleteMenuItem(m._id)}>
                    <AppIcon name="trash-outline" size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // Render Activities
  function renderActivities() {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Activities & Sightseeing Management</Text>
          <TouchableOpacity
            style={styles.primaryAddBtn}
            onPress={() => {
              setModalForm({
                name: 'Attabad Lake Boating & Jet Ski',
                destination: 'Hunza Valley',
                category: 'Water Sports',
                pricePerPerson: '2500',
                durationHours: '2',
                difficulty: 'Easy',
              });
              setModalType('activity');
            }}
          >
            <AppIcon name="add-outline" size={18} color="#fff" />
            <Text style={styles.primaryAddBtnText}>Add Activity</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { width: 180 }]}>Activity Name</Text>
                <Text style={[styles.th, { width: 130 }]}>Destination</Text>
                <Text style={[styles.th, { width: 110 }]}>Category</Text>
                <Text style={[styles.th, { width: 110 }]}>Rate / Person</Text>
                <Text style={[styles.th, { width: 90 }]}>Duration</Text>
                <Text style={[styles.th, { width: 80 }]}>Action</Text>
              </View>
              {activitiesData.map((a) => (
                <View key={a._id} style={styles.tableRow}>
                  <Text style={[styles.td, { width: 180, fontWeight: 'bold' }]}>{a.name}</Text>
                  <Text style={[styles.td, { width: 130 }]}>{a.destination}</Text>
                  <Text style={[styles.td, { width: 110 }]}>{a.category}</Text>
                  <Text style={[styles.td, { width: 110, fontWeight: 'bold' }]}>PKR {Number(a.pricePerPerson).toLocaleString()}</Text>
                  <Text style={[styles.td, { width: 90 }]}>{a.durationHours} hrs</Text>
                  <TouchableOpacity style={styles.delBtn} onPress={() => handleDeleteActivity(a._id)}>
                    <AppIcon name="trash-outline" size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // Render Bookings & Reservations
  function renderBookings() {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Bookings & Reservations ({bookingsData.length})</Text>

        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { width: 100 }]}>Ref ID</Text>
                <Text style={[styles.th, { width: 130 }]}>Customer</Text>
                <Text style={[styles.th, { width: 130 }]}>Destination</Text>
                <Text style={[styles.th, { width: 110 }]}>Total Cost</Text>
                <Text style={[styles.th, { width: 100 }]}>Paid</Text>
                <Text style={[styles.th, { width: 100 }]}>Balance</Text>
                <Text style={[styles.th, { width: 95 }]}>Status</Text>
              </View>
              {bookingsData.map((b) => (
                <View key={b.id} style={styles.tableRow}>
                  <Text style={[styles.td, { width: 100, fontWeight: 'bold', color: '#15803d' }]}>{b.bookingRef}</Text>
                  <Text style={[styles.td, { width: 130 }]}>{b.customerName}</Text>
                  <Text style={[styles.td, { width: 130, fontWeight: 'bold' }]}>{b.destination}</Text>
                  <Text style={[styles.td, { width: 110 }]}>PKR {Number(b.totalAmount).toLocaleString()}</Text>
                  <Text style={[styles.td, { width: 100, color: '#15803d' }]}>PKR {Number(b.amountPaid).toLocaleString()}</Text>
                  <Text style={[styles.td, { width: 100, color: b.remainingBalance > 0 ? '#dc2626' : '#15803d' }]}>
                    PKR {Number(b.remainingBalance).toLocaleString()}
                  </Text>
                  <View style={[styles.statusBadge, { width: 90 }]}>
                    <Text style={styles.statusBadgeText}>{b.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // Render Revenue & Expenses
  function renderFinancials() {
    if (!financialsData) return <ActivityIndicator size="large" color="#15803d" style={{ marginTop: 40 }} />;
    const { summary, categoryTotals, expenses = [] } = financialsData;

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Revenue & Company Expenses</Text>
          <TouchableOpacity
            style={styles.primaryAddBtn}
            onPress={() => {
              setModalForm({
                title: 'Fuel & Highway Tolls Reimbursement',
                category: 'Transport',
                amount: '12000',
                description: 'Operational fuel voucher for northern route',
              });
              setModalType('expense');
            }}
          >
            <AppIcon name="add-outline" size={18} color="#fff" />
            <Text style={styles.primaryAddBtnText}>Record Expense</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Revenue</Text>
            <Text style={styles.kpiValue}>PKR {Number(summary.totalRevenue).toLocaleString()}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Company Expenses</Text>
            <Text style={[styles.kpiValue, { color: '#f97316' }]}>PKR {Number(summary.totalExpenses).toLocaleString()}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Net Profit</Text>
            <Text style={[styles.kpiValue, { color: '#15803d' }]}>PKR {Number(summary.netProfit).toLocaleString()}</Text>
            <Text style={styles.kpiSub}>Margin: {summary.profitMargin}%</Text>
          </View>
        </View>

        {/* Expenses List */}
        <View style={styles.tableCard}>
          <Text style={styles.tableTitle}>Company Operational Expense Ledger</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { width: 200 }]}>Expense Title</Text>
                <Text style={[styles.th, { width: 120 }]}>Category</Text>
                <Text style={[styles.th, { width: 110 }]}>Amount</Text>
                <Text style={[styles.th, { width: 110 }]}>Date</Text>
                <Text style={[styles.th, { width: 200 }]}>Description</Text>
              </View>
              {expenses.map((e) => (
                <View key={e._id} style={styles.tableRow}>
                  <Text style={[styles.td, { width: 200, fontWeight: 'bold' }]}>{e.title}</Text>
                  <Text style={[styles.td, { width: 120 }]}>{e.category}</Text>
                  <Text style={[styles.td, { width: 110, color: '#f97316', fontWeight: 'bold' }]}>
                    PKR {Number(e.amount).toLocaleString()}
                  </Text>
                  <Text style={[styles.td, { width: 110 }]}>{new Date(e.date).toLocaleDateString()}</Text>
                  <Text style={[styles.td, { width: 200, color: '#64748b' }]}>{e.description || 'N/A'}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // Render Reports & Analytics
  function renderReports() {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Reports & Business Analytics</Text>
          <TouchableOpacity style={styles.exportBtn} onPress={downloadCSV}>
            <AppIcon name="download-outline" size={18} color="#fff" />
            <Text style={styles.exportBtnText}>Export CSV Report</Text>
          </TouchableOpacity>
        </View>

        {reportsData && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Business Performance Summary</Text>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Total Completed Trips</Text>
                <Text style={styles.kpiValue}>{reportsData.summary.totalTrips}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Customer Base</Text>
                <Text style={styles.kpiValue}>{reportsData.summary.totalCustomers}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Total Revenue</Text>
                <Text style={styles.kpiValue}>PKR {Number(reportsData.summary.totalRevenue).toLocaleString()}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Gross Margin</Text>
                <Text style={[styles.kpiValue, { color: '#15803d' }]}>{reportsData.summary.profitMargin}%</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }

  // Render Admin Profile
  function renderProfile() {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Admin Profile & Credentials</Text>
        <View style={[styles.chartCard, { maxWidth: 500 }]}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{user?.initials || 'AD'}</Text>
            </View>
            <View style={{ marginLeft: 16 }}>
              <Text style={{ fontSize: 18, fontFamily: fonts.bold }}>{user?.fullName || 'Administrator'}</Text>
              <Text style={{ fontSize: 13, color: '#64748b' }}>{user?.email}</Text>
              <View style={[styles.statusBadge, { marginTop: 6, alignSelf: 'flex-start' }]}>
                <Text style={styles.statusBadgeText}>ROLE: {user?.role?.toUpperCase() || 'ADMIN'}</Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 12, color: '#64748b' }}>System Authorization</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#15803d', marginTop: 4 }}>
              Active SuperAdmin Privileges
            </Text>
            <Text style={{ fontSize: 12, color: '#64748b', marginTop: 12 }}>Invite Verification Code</Text>
            <Text style={{ fontSize: 14, fontFamily: fonts.mono || fonts.medium, marginTop: 4 }}>
              SMART_ADMIN_2026
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Main Render
  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* TOP HEADER BAR (Dark green `#0a2818` matching mockup) */}
      <View style={styles.topHeader}>
        <View style={styles.brandGroup}>
          <AppIcon name="paper-plane" size={20} color="#34d399" />
          <Text style={styles.brandTitle}>Smart Travel Planner</Text>
        </View>

        <View style={styles.headerRightGroup}>
          <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
            {refreshing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <AppIcon name="refresh-outline" size={18} color="#fff" />
            )}
          </TouchableOpacity>

          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>

          <TouchableOpacity style={styles.logoutHeaderBtn} onPress={handleLogout}>
            <AppIcon name="log-out-outline" size={18} color="#fca5a5" />
          </TouchableOpacity>
        </View>
      </View>

      {/* MAIN CONTAINER: SIDEBAR + CONTENT */}
      <View style={styles.bodyWrapper}>
        {/* SIDEBAR NAVIGATION (Matching uploaded mockup) */}
        <View style={styles.sidebar}>
          <Text style={styles.sidebarMenuTitle}>ADMIN MENU</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {MENU_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}
                  onPress={() => setActiveTab(item.id)}
                >
                  <AppIcon
                    name={item.icon}
                    size={18}
                    color={isActive ? '#15803d' : '#4b5563'}
                  />
                  <Text style={[styles.sidebarItemText, isActive && styles.sidebarItemTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={[styles.sidebarItem, { marginTop: 20 }]} onPress={handleLogout}>
              <AppIcon name="log-out-outline" size={18} color="#dc2626" />
              <Text style={[styles.sidebarItemText, { color: '#dc2626' }]}>Log Out</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* CONTENT AREA */}
        <ScrollView style={styles.contentArea} contentContainerStyle={{ paddingBottom: 60 }}>
          {loading ? (
            <ActivityIndicator size="large" color="#15803d" style={{ marginTop: 60 }} />
          ) : (
            <>
              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'budget' && renderBudgetAllocation()}
              {activeTab === 'trips' && renderTrips()}
              {activeTab === 'customers' && renderCustomers()}
              {activeTab === 'destinations' && renderOverview()}
              {activeTab === 'transport' && renderTransport()}
              {activeTab === 'hotels' && renderHotels()}
              {activeTab === 'food' && renderFood()}
              {activeTab === 'activities' && renderActivities()}
              {activeTab === 'bookings' && renderBookings()}
              {activeTab === 'financials' && renderFinancials()}
              {activeTab === 'reports' && renderReports()}
              {activeTab === 'profile' && renderProfile()}
            </>
          )}
        </ScrollView>
      </View>

      {/* CREATE / EDIT MODALS */}
      {modalType && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>
                {modalType === 'status' ? 'Update Trip Status' : `Add New ${modalType.toUpperCase()}`}
              </Text>

              {modalType === 'status' && (
                <View style={{ marginVertical: 12 }}>
                  <Text style={styles.inputLabel}>Trip Status</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 6 }}>
                    {['Confirmed', 'Upcoming', 'In Progress', 'Completed', 'Cancelled'].map((st) => (
                      <TouchableOpacity
                        key={st}
                        style={[styles.choicePill, modalForm.status === st && styles.choicePillActive]}
                        onPress={() => setModalForm((prev) => ({ ...prev, status: st }))}
                      >
                        <Text style={[styles.choicePillText, modalForm.status === st && styles.choicePillTextActive]}>{st}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Payment Status</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 6 }}>
                    {['Pending', 'Paid', 'Partial', 'Refunded'].map((pst) => (
                      <TouchableOpacity
                        key={pst}
                        style={[styles.choicePill, modalForm.paymentStatus === pst && styles.choicePillActive]}
                        onPress={() => setModalForm((prev) => ({ ...prev, paymentStatus: pst }))}
                      >
                        <Text style={[styles.choicePillText, modalForm.paymentStatus === pst && styles.choicePillTextActive]}>{pst}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {modalType === 'vehicle' && (
                <View style={{ marginVertical: 12 }}>
                  <Text style={styles.inputLabel}>Vehicle Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={modalForm.name}
                    onChangeText={(t) => setModalForm((prev) => ({ ...prev, name: t }))}
                  />
                  <Text style={styles.inputLabel}>Vehicle Category / Model</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={modalForm.type}
                    onChangeText={(t) => setModalForm((prev) => ({ ...prev, type: t }))}
                  />
                  <Text style={styles.inputLabel}>Daily Rent (PKR)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={modalForm.pricePerDay}
                    keyboardType="numeric"
                    onChangeText={(t) => setModalForm((prev) => ({ ...prev, pricePerDay: t }))}
                  />
                </View>
              )}

              {modalType === 'hotel' && (
                <View style={{ marginVertical: 12 }}>
                  <Text style={styles.inputLabel}>Hotel Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={modalForm.name}
                    onChangeText={(t) => setModalForm((prev) => ({ ...prev, name: t }))}
                  />
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={modalForm.city}
                    onChangeText={(t) => setModalForm((prev) => ({ ...prev, city: t }))}
                  />
                  <Text style={styles.inputLabel}>Rate / Night (PKR)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={modalForm.pricePerNight}
                    keyboardType="numeric"
                    onChangeText={(t) => setModalForm((prev) => ({ ...prev, pricePerNight: t }))}
                  />
                </View>
              )}

              {modalType === 'menu' && (
                <View style={{ marginVertical: 12 }}>
                  <Text style={styles.inputLabel}>Dish Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={modalForm.name}
                    onChangeText={(t) => setModalForm((prev) => ({ ...prev, name: t }))}
                  />
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={modalForm.city}
                    onChangeText={(t) => setModalForm((prev) => ({ ...prev, city: t }))}
                  />
                  <Text style={styles.inputLabel}>Price (PKR)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={modalForm.price}
                    keyboardType="numeric"
                    onChangeText={(t) => setModalForm((prev) => ({ ...prev, price: t }))}
                  />
                </View>
              )}

              {modalType === 'activity' && (
                <View style={{ marginVertical: 12 }}>
                  <Text style={styles.inputLabel}>Activity Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={modalForm.name}
                    onChangeText={(t) => setModalForm((prev) => ({ ...prev, name: t }))}
                  />
                  <Text style={styles.inputLabel}>Destination</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={modalForm.destination}
                    onChangeText={(t) => setModalForm((prev) => ({ ...prev, destination: t }))}
                  />
                  <Text style={styles.inputLabel}>Price / Person (PKR)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={modalForm.pricePerPerson}
                    keyboardType="numeric"
                    onChangeText={(t) => setModalForm((prev) => ({ ...prev, pricePerPerson: t }))}
                  />
                </View>
              )}

              {modalType === 'expense' && (
                <View style={{ marginVertical: 12 }}>
                  <Text style={styles.inputLabel}>Expense Title</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={modalForm.title}
                    onChangeText={(t) => setModalForm((prev) => ({ ...prev, title: t }))}
                  />
                  <Text style={styles.inputLabel}>Category (Transport / Food / Hotel / Operations)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={modalForm.category}
                    onChangeText={(t) => setModalForm((prev) => ({ ...prev, category: t }))}
                  />
                  <Text style={styles.inputLabel}>Amount (PKR)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={modalForm.amount}
                    keyboardType="numeric"
                    onChangeText={(t) => setModalForm((prev) => ({ ...prev, amount: t }))}
                  />
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalType(null)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={handleModalSubmit} disabled={submittingModal}>
                  {submittingModal ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalSaveText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topHeader: {
    height: 58,
    backgroundColor: '#0a2818',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#134e2b',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: fonts.bold,
    letterSpacing: 0.3,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshBtn: {
    padding: 6,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  adminBadge: {
    backgroundColor: '#15803d',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  adminBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  logoutHeaderBtn: {
    padding: 6,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
  },
  bodyWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 220,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  sidebarMenuTitle: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#94a3b8',
    marginBottom: 12,
    marginLeft: 10,
    letterSpacing: 0.8,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 12,
    marginBottom: 4,
  },
  sidebarItemActive: {
    backgroundColor: '#f0fdf4',
  },
  sidebarItemText: {
    fontSize: 13,
    color: '#475569',
    fontFamily: fonts.medium,
  },
  sidebarItemTextActive: {
    color: '#15803d',
    fontFamily: fonts.bold,
  },
  contentArea: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  sectionContainer: {
    flex: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 16,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  greenPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#15803d',
  },
  liveBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#15803d',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadow.sm,
  },
  kpiCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: fonts.medium,
  },
  kpiValue: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: '#0f172a',
  },
  kpiSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    ...shadow.sm,
  },
  chartCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#0f172a',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  pillBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillBadgeText: {
    fontSize: 11,
    color: '#475569',
    fontFamily: fonts.medium,
  },
  chartArea: {
    marginTop: 10,
  },
  chartBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 4,
  },
  barGroup: {
    alignItems: 'center',
    gap: 6,
  },
  barsPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  singleBar: {
    width: 14,
    borderRadius: 3,
  },
  monthLabel: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: fonts.medium,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: '#475569',
  },
  allocationLegendList: {
    marginTop: 14,
    gap: 10,
  },
  allocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  allocLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  allocName: {
    fontSize: 13,
    color: '#334155',
    fontFamily: fonts.medium,
  },
  allocPct: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#0f172a',
  },
  stackedBarContainer: {
    height: 14,
    flexDirection: 'row',
    borderRadius: 7,
    overflow: 'hidden',
    marginTop: 16,
  },
  stackedSegment: {
    height: '100%',
  },
  twoColumnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  popularRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    gap: 12,
  },
  popularName: {
    width: 110,
    fontSize: 12,
    color: '#334155',
    fontFamily: fonts.medium,
  },
  popularBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  popularBarFill: {
    height: '100%',
    backgroundColor: '#15803d',
    borderRadius: 4,
  },
  popularCount: {
    fontSize: 11,
    color: '#64748b',
    width: 50,
    textAlign: 'right',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  statusBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#1d4ed8',
  },
  statusCount: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#334155',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    minWidth: 260,
  },
  filterPills: {
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 6,
  },
  filterPillActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
  },
  filterPillText: {
    fontSize: 12,
    color: '#475569',
    fontFamily: fonts.medium,
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontFamily: fonts.bold,
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    ...shadow.sm,
  },
  tableTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    marginBottom: 12,
    color: '#0f172a',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  th: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  td: {
    fontSize: 12,
    color: '#334155',
  },
  actionBtn: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  actionBtnText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#15803d',
  },
  delBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  primaryAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#15803d',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryAddBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: fonts.bold,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    ...shadow.md,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#0f172a',
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#475569',
    marginTop: 8,
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  choicePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  choicePillActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
  },
  choicePillText: {
    fontSize: 11,
    color: '#475569',
  },
  choicePillTextActive: {
    color: '#ffffff',
    fontFamily: fonts.bold,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  modalCancelText: {
    fontSize: 13,
    color: '#64748b',
  },
  modalSaveBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSaveText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  closeBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  closeBtnText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#475569',
  },
  // Supervisor Formula Section Styles
  supervisorFormulaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  formulaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  formulaTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  formulaCardTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#0f172a',
  },
  formulaBadge: {
    fontSize: 11,
    color: '#15803d',
    fontFamily: fonts.medium,
    marginTop: 2,
  },
  formulaSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 14,
  },
  simulatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  simulatorLabel: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#334155',
  },
  simulatorInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
  },
  currencyPrefix: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#64748b',
    marginRight: 6,
  },
  simulatorInput: {
    width: 110,
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#0f172a',
    paddingVertical: 0,
    outlineStyle: 'none',
  },
  quickPresetRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  presetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  presetBtnActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
  },
  presetBtnText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#475569',
  },
  presetBtnTextActive: {
    color: '#ffffff',
    fontFamily: fonts.bold,
  },
  formulaBarContainer: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    marginBottom: 16,
  },
  formulaSegment: {
    height: '100%',
  },
  formulaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  formulaAllocCard: {
    flex: 1,
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formulaDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  formulaCardHeader: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#1e293b',
  },
  formulaCardValue: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#15803d',
    marginTop: 2,
  },
  formulaCardNote: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
});
