import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, tokenStorage, userStorage } from '../api/client';
import { scheduleServerAlerts } from '../services/notificationService';

const AppContext = createContext(null);

const FAVORITES_STORAGE_KEY = 'stp_user_favorites';

function getInitialFavorites() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
  }
  return [];
}

export function deriveNameFromEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const username = email.split('@')[0] || '';
  if (!username) return '';
  const cleaned = username.replace(/[0-9]+/g, ' ').replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return username.charAt(0).toUpperCase() + username.slice(1);
  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function withInitials(user) {
  if (!user || typeof user !== 'object') return null;
  let fullName = String(user?.fullName || user?.name || '').trim();
  if ((!fullName || fullName.toLowerCase() === 'user' || fullName.toLowerCase() === 'traveler') && user?.email) {
    const derived = deriveNameFromEmail(user.email);
    if (derived) fullName = derived;
  }
  if (!fullName) fullName = 'Traveler';
  const parts = fullName.split(/\s+/);
  const initials = `${parts[0]?.[0] || 'T'}${parts.length > 1 ? parts.at(-1)[0] : ''}`.toUpperCase();
  return { ...user, fullName, initials };
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => withInitials(userStorage.getSync()));
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [trips, setTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [favorites, setFavorites] = useState(getInitialFavorites);
  const [favLoading, setFavLoading] = useState(false);

  function applyTripUpdate(trip, prepend = false) {
    if (!trip) return;
    setCurrentTrip(trip);
    setTrips((savedTrips) => {
      const tripId = String(trip._id);
      const remaining = savedTrips.filter((savedTrip) => String(savedTrip._id) !== tripId);
      if (prepend) return [trip, ...remaining];
      return savedTrips.some((savedTrip) => String(savedTrip._id) === tripId)
        ? savedTrips.map((savedTrip) => String(savedTrip._id) === tripId ? trip : savedTrip)
        : [trip, ...savedTrips];
    });
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const storedToken = await tokenStorage.get();
        let storedUser = await userStorage.get();
        if (!storedUser && typeof window !== 'undefined' && window.localStorage) {
          try {
            const raw = window.localStorage.getItem('smartTravelPlanner.currentUser') || window.localStorage.getItem('stp_last_user');
            if (raw) storedUser = JSON.parse(raw);
          } catch (_) {}
        }
        if (storedUser && active) {
          setUser(withInitials(storedUser));
        }
        if (!storedToken) return;
        const data = await apiRequest('/auth/me', { token: storedToken });
        if (data?.user && active) {
          let savedTrips = [];
          if (data.user.role !== 'admin') {
            try {
              const tripData = await apiRequest('/trips', { token: storedToken });
              savedTrips = tripData.trips || [];
            } catch (_) {}
          }
          setToken(storedToken);
          const safeUser = withInitials(data.user);
          setUser(safeUser);
          await userStorage.set(safeUser);
          if (typeof window !== 'undefined' && window.localStorage && safeUser) {
            window.localStorage.setItem('smartTravelPlanner.currentUser', JSON.stringify(safeUser));
            window.localStorage.setItem('stp_last_user', JSON.stringify(safeUser));
            window.localStorage.setItem('stp_user_fullname', safeUser?.fullName || '');
            window.localStorage.setItem('stp_user_email', safeUser?.email || '');
          }
          setTrips(savedTrips);
          setCurrentTrip(savedTrips[0] || null);
          refreshFavorites(storedToken).catch(() => {});
        }
      } catch (_) {
        // preserve stored user so user does not appear as empty on temporary network hiccup
      } finally {
        if (active) setAuthLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function login(email, password, role = 'user') {
    const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password, role } });
    let savedTrips = [];
    if (data.user?.role !== 'admin') {
      try {
        const tripData = await apiRequest('/trips', { token: data.token });
        savedTrips = tripData.trips || [];
      } catch (_) {}
    }
    await tokenStorage.set(data.token);
    const safeUser = withInitials(data.user);
    await userStorage.set(safeUser);
    if (typeof window !== 'undefined' && window.localStorage && safeUser) {
      window.localStorage.setItem('smartTravelPlanner.currentUser', JSON.stringify(safeUser));
      window.localStorage.setItem('stp_last_user', JSON.stringify(safeUser));
      window.localStorage.setItem('stp_user_fullname', safeUser?.fullName || '');
      window.localStorage.setItem('stp_user_email', safeUser?.email || '');
    }
    setToken(data.token);
    setUser(safeUser);
    setTrips(savedTrips);
    setCurrentTrip(savedTrips[0] || null);
    refreshFavorites(data.token).catch(() => {});
    return safeUser;
  }

  async function signup(fullName, email, password, role = 'user', adminCode = '') {
    const res = await apiRequest('/auth/signup', { method: 'POST', body: { fullName, email, password, role, adminCode } });
    if (typeof window !== 'undefined' && window.localStorage) {
      const userObj = res.user || { fullName, email, role };
      window.localStorage.setItem('smartTravelPlanner.currentUser', JSON.stringify(userObj));
      window.localStorage.setItem('stp_last_user', JSON.stringify(userObj));
      window.localStorage.setItem('stp_user_fullname', fullName);
      window.localStorage.setItem('stp_user_email', email);
    }
    return res;
  }

  async function socialLogin(provider, role = 'user') {
    const data = await apiRequest('/auth/social-login', { method: 'POST', body: { provider, role } });
    let savedTrips = [];
    if (data.user?.role !== 'admin') {
      try {
        const tripData = await apiRequest('/trips', { token: data.token });
        savedTrips = tripData.trips || [];
      } catch (_) {}
    }
    await tokenStorage.set(data.token);
    const safeUser = withInitials(data.user);
    await userStorage.set(safeUser);
    setToken(data.token);
    setUser(safeUser);
    setTrips(savedTrips);
    setCurrentTrip(savedTrips[0] || null);
    refreshFavorites(data.token).catch(() => {});
    return safeUser;
  }

  async function logout() {
    await tokenStorage.clear().catch(() => {});
    await userStorage.clear().catch(() => {});
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

  async function verifyTripCompletion(tripId, action) {
    const id = tripId || currentTrip?._id;
    if (!id) throw new Error('Trip ID is required');
    const data = await apiRequest(`/trips/${id}/verify-completion`, {
      method: 'POST', token, body: { action },
    });
    applyTripUpdate(data.trip);
    await refreshTrips().catch(() => {});
    return data;
  }

  async function submitTripReview(tripId, { rating, comment }) {
    const id = tripId || currentTrip?._id;
    if (!id) throw new Error('Trip ID is required');
    const data = await apiRequest(`/trips/${id}/review`, {
      method: 'POST', token, body: { rating, comment },
    });
    applyTripUpdate(data.trip);
    await refreshTrips().catch(() => {});
    return data;
  }

  async function deleteTrip(tripId) {
    const idStr = String(tripId);
    await apiRequest(`/trips/${idStr}`, { method: 'DELETE', token });
    setTrips((savedTrips) => {
      const remaining = savedTrips.filter((trip) => String(trip._id) !== idStr);
      setCurrentTrip((activeTrip) => String(activeTrip?._id) === idStr ? (remaining[0] || null) : activeTrip);
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
        if (activeTrip?._id) {
          const match = savedTrips.find((trip) => String(trip._id) === String(activeTrip._id));
          if (match) return match;
        }
        return savedTrips[0];
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
    const safeUser = withInitials(data.user);
    setUser(safeUser);
    await userStorage.set(safeUser);
    if (typeof window !== 'undefined' && window.localStorage && safeUser) {
      window.localStorage.setItem('smartTravelPlanner.currentUser', JSON.stringify(safeUser));
      window.localStorage.setItem('stp_last_user', JSON.stringify(safeUser));
    }
    return safeUser;
  }

  async function updateProfile(profileData) {
    const body = typeof profileData === 'string' ? { fullName: profileData } : profileData;
    let safeUser = null;
    try {
      const data = await apiRequest('/auth/me', { method: 'PATCH', token, body });
      if (data?.user) {
        safeUser = withInitials(data.user);
      }
    } catch (err) {
      console.warn('API profile update failed, using local fallback:', err.message);
    }
    if (!safeUser) {
      safeUser = withInitials({ ...(user || {}), ...body });
    }
    setUser(safeUser);
    await userStorage.set(safeUser);
    if (typeof window !== 'undefined' && window.localStorage && safeUser) {
      window.localStorage.setItem('smartTravelPlanner.currentUser', JSON.stringify(safeUser));
      window.localStorage.setItem('stp_last_user', JSON.stringify(safeUser));
      if (safeUser?.fullName) window.localStorage.setItem('stp_user_fullname', safeUser.fullName);
      if (safeUser?.email) window.localStorage.setItem('stp_user_email', safeUser.email);
    }
    return safeUser;
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

  function isFavorite(destOrId) {
    if (!destOrId) return false;
    const targetKey = (typeof destOrId === 'string'
      ? destOrId
      : (destOrId.destinationId || destOrId._id || destOrId.id || destOrId.name || '')
    ).toString().toLowerCase().trim();

    const targetName = (typeof destOrId === 'object' && destOrId.name ? destOrId.name : '').toString().toLowerCase().trim();

    return favorites.some((fav) => {
      const favKey = (fav.destinationId || fav._id || fav.id || fav.name || '').toString().toLowerCase().trim();
      const favName = (fav.name || '').toString().toLowerCase().trim();
      return (targetKey && favKey === targetKey) ||
             (targetName && favName === targetName) ||
             (targetKey && favName === targetKey) ||
             (targetName && favKey === targetName);
    });
  }

  async function toggleFavorite(dest) {
    if (!dest) return false;
    const destId = (dest.destinationId || dest._id || dest.id || dest.name || '').toString();
    const alreadyFav = isFavorite(dest);
    let updated = [];

    if (alreadyFav) {
      const targetKey = destId.toLowerCase().trim();
      const targetName = (dest.name || '').toLowerCase().trim();
      updated = favorites.filter((f) => {
        const fKey = (f.destinationId || f._id || f.id || f.name || '').toString().toLowerCase().trim();
        const fName = (f.name || '').toString().toLowerCase().trim();
        return !(fKey === targetKey || (targetName && fName === targetName) || fName === targetKey);
      });
    } else {
      const normalizedDest = {
        _id: dest._id || dest.id || destId,
        destinationId: dest.destinationId || destId,
        name: dest.name || destId,
        region: dest.region || dest.category || 'Pakistan',
        category: dest.category || 'Destinations',
        imageUrl: dest.imageUrl || dest.image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80',
        rating: dest.rating || 4.8,
        bestTimeToVisit: dest.bestTimeToVisit || 'April to October',
        description: dest.description || '',
        weatherCity: dest.weatherCity || dest.name,
      };
      const filtered = favorites.filter((f) => {
        const fKey = (f.destinationId || f._id || f.id || f.name || '').toString().toLowerCase().trim();
        const fName = (f.name || '').toString().toLowerCase().trim();
        const targetKey = destId.toLowerCase().trim();
        const targetName = (dest.name || '').toLowerCase().trim();
        return !(fKey === targetKey || (targetName && fName === targetName) || fName === targetKey);
      });
      updated = [normalizedDest, ...filtered];
    }

    setFavorites(updated);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
      } catch (_) {}
    }

    if (token && destId) {
      try {
        await apiRequest(`/destinations/${encodeURIComponent(destId)}/favorite`, { method: 'POST', token });
      } catch (err) {
        console.warn('Backend favorite sync warning:', err.message);
      }
    }

    return !alreadyFav;
  }

  async function refreshFavorites(authToken = token) {
    if (!authToken) return favorites;
    setFavLoading(true);
    try {
      const favRes = await apiRequest('/destinations/favorites', { token: authToken });
      if (Array.isArray(favRes?.favorites)) {
        setFavorites(favRes.favorites);
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favRes.favorites));
          } catch (_) {}
        }
        return favRes.favorites;
      }
    } catch (_) {
      // silent fallback
    } finally {
      setFavLoading(false);
    }
    return favorites;
  }

  return (
    <AppContext.Provider value={{
      user, token, authLoading, currentTrip, setCurrentTrip, trips, tripsLoading,
      favorites, favLoading, isFavorite, toggleFavorite, refreshFavorites,
      login, signup, socialLogin, logout, generateTrip, updateTrip, saveItinerary, selectHotel,
      addExpense, updateExpense, deleteExpense, deleteTrip,
      listTrips, refreshTrips, refreshTripRoute, updatePreferences, updateProfile,
      verifyTripCompletion, submitTripReview,
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
