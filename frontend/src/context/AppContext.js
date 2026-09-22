import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, tokenStorage } from '../api/client';
import { scheduleServerAlerts } from '../services/notificationService';

const AppContext = createContext(null);

function withInitials(user) {
  if (!user) return null;
  const parts = String(user.fullName || 'User').trim().split(/\s+/);
  const initials = `${parts[0]?.[0] || 'U'}${parts.length > 1 ? parts.at(-1)[0] : ''}`.toUpperCase();
  return { ...user, initials };
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [trips, setTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);

  function applyTripUpdate(trip, prepend = false) {
    setCurrentTrip(trip);
    setTrips((savedTrips) => {
      const remaining = savedTrips.filter((savedTrip) => savedTrip._id !== trip._id);
      if (prepend) return [trip, ...remaining];
      return savedTrips.some((savedTrip) => savedTrip._id === trip._id)
        ? savedTrips.map((savedTrip) => savedTrip._id === trip._id ? trip : savedTrip)
        : [trip, ...savedTrips];
    });
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const storedToken = await tokenStorage.get();
        if (!storedToken) return;
        const [data, tripData] = await Promise.all([
          apiRequest('/auth/me', { token: storedToken }),
          apiRequest('/trips', { token: storedToken }),
        ]);
        if (active) {
          const savedTrips = tripData.trips || [];
          setToken(storedToken);
          setUser(withInitials(data.user));
          setTrips(savedTrips);
          setCurrentTrip(savedTrips[0] || null);
        }
      } catch (_) {
        await tokenStorage.clear().catch(() => {});
      } finally {
        if (active) setAuthLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function login(email, password) {
    const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
    const tripData = await apiRequest('/trips', { token: data.token });
    const savedTrips = tripData.trips || [];
    await tokenStorage.set(data.token);
    setToken(data.token);
    setUser(withInitials(data.user));
    setTrips(savedTrips);
    setCurrentTrip(savedTrips[0] || null);
    return data.user;
  }

  async function signup(fullName, email, password) {
    return apiRequest('/auth/signup', { method: 'POST', body: { fullName, email, password } });
  }

  async function logout() {
    await tokenStorage.clear().catch(() => {});
    setToken(null);
    setUser(null);
    setCurrentTrip(null);
    setTrips([]);
  }

  async function generateTrip(input) {
    const data = await apiRequest('/trips/generate', { method: 'POST', token, body: input });
    applyTripUpdate(data.trip, true);
    refreshAlerts().catch(() => {});
    return data.trip;
  }

  async function selectHotel(hotelId) {
    if (!currentTrip?._id) throw new Error('Generate or open a trip first');
    const data = await apiRequest(`/trips/${currentTrip._id}/hotel`, {
      method: 'PATCH', token, body: { hotelId },
    });
    applyTripUpdate(data.trip);
    refreshAlerts().catch(() => {});
    track('select', { tripId: data.trip._id, itemType: 'hotel', itemId: hotelId });
    return data.trip;
  }

  async function updateTrip(input) {
    if (!currentTrip?._id) throw new Error('Generate or open a trip first');
    const data = await apiRequest(`/trips/${currentTrip._id}`, { method: 'PATCH', token, body: input });
    applyTripUpdate(data.trip);
    refreshAlerts().catch(() => {});
    return data.trip;
  }

  async function saveItinerary(itinerary) {
    if (!currentTrip?._id) throw new Error('Generate or open a trip first');
    const data = await apiRequest(`/trips/${currentTrip._id}/itinerary`, {
      method: 'PATCH', token, body: { itinerary },
    });
    applyTripUpdate(data.trip);
    refreshAlerts().catch(() => {});
    return data.trip;
  }

  async function addExpense(expense) {
    if (!currentTrip?._id) throw new Error('Generate or open a trip first');
    const data = await apiRequest(`/trips/${currentTrip._id}/expenses`, { method: 'POST', token, body: expense });
    applyTripUpdate(data.trip);
    refreshAlerts().catch(() => {});
    return data.expense;
  }

  async function updateExpense(expenseId, expense) {
    const data = await apiRequest(`/trips/${currentTrip._id}/expenses/${expenseId}`, { method: 'PATCH', token, body: expense });
    applyTripUpdate(data.trip);
    refreshAlerts().catch(() => {});
    return data.expense;
  }

  async function deleteExpense(expenseId) {
    const data = await apiRequest(`/trips/${currentTrip._id}/expenses/${expenseId}`, { method: 'DELETE', token });
    applyTripUpdate(data.trip);
    refreshAlerts().catch(() => {});
  }

  async function deleteTrip(tripId) {
    await apiRequest(`/trips/${tripId}`, { method: 'DELETE', token });
    setTrips((savedTrips) => {
      const remaining = savedTrips.filter((trip) => trip._id !== tripId);
      setCurrentTrip((activeTrip) => activeTrip?._id === tripId ? (remaining[0] || null) : activeTrip);
      return remaining;
    });
  }

  async function refreshTrips(authToken = token) {
    if (!authToken) {
      setTrips([]);
      setCurrentTrip(null);
      return [];
    }
    setTripsLoading(true);
    try {
      const data = await apiRequest('/trips', { token: authToken });
      const savedTrips = data.trips || [];
      setTrips(savedTrips);
      setCurrentTrip((activeTrip) => {
        if (!savedTrips.length) return null;
        return savedTrips.find((trip) => trip._id === activeTrip?._id) || savedTrips[0];
      });
      return savedTrips;
    } finally {
      setTripsLoading(false);
    }
  }

  async function refreshTripRoute() {
    if (!currentTrip?._id) throw new Error('Generate or open a trip first');
    const data = await apiRequest(`/trips/${currentTrip._id}/route`, { method: 'PATCH', token });
    applyTripUpdate(data.trip);
    return data.trip;
  }

  const listTrips = refreshTrips;

  async function updatePreferences(preferences) {
    const data = await apiRequest('/auth/me/preferences', {
      method: 'PATCH', token, body: preferences,
    });
    setUser(withInitials(data.user));
    return data.user;
  }

  async function updateProfile(fullName) {
    const data = await apiRequest('/auth/me', { method: 'PATCH', token, body: { fullName } });
    setUser(withInitials(data.user));
    return data.user;
  }

  async function exportMyData() { return apiRequest('/auth/me/export', { token }); }

  async function deleteAccount(password) {
    await apiRequest('/auth/me', { method: 'DELETE', token, body: { password } });
    await logout();
  }

  async function refreshAlerts() {
    if (!token) return [];
    const data = await apiRequest('/alerts', { token });
    await scheduleServerAlerts(data.alerts || []).catch(() => {});
    return data.alerts || [];
  }

  function openTrip(trip) {
    setCurrentTrip(trip);
    track('view', { tripId: trip?._id, itemType: 'trip', itemId: trip?._id });
  }

  function track(eventType, details = {}) {
    if (!token) return;
    apiRequest('/interactions', { method: 'POST', token, body: { eventType, ...details } }).catch(() => {});
  }

  return (
    <AppContext.Provider value={{
      user, token, authLoading, currentTrip, setCurrentTrip, trips, tripsLoading,
      login, signup, logout, generateTrip, updateTrip, saveItinerary, selectHotel,
      addExpense, updateExpense, deleteExpense, deleteTrip,
      listTrips, refreshTrips, refreshTripRoute, updatePreferences, updateProfile,
      exportMyData, deleteAccount, refreshAlerts, openTrip, track,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
