import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = (() => {
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname, port, origin } = window.location;
    // When running in development on any frontend dev server (8081, 8082, 19006, etc.)
    if (port && port !== '5000') {
      return `${protocol}//${hostname}:5000/api`;
    }
    if (origin && origin !== 'null') {
      return `${origin}/api`;
    }
  }
  return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
})();
export const AUTH_TOKEN_KEY = 'smartTravelPlanner.authToken';

export async function apiRequest(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

export const USER_DATA_KEY = 'smartTravelPlanner.currentUser';

export const tokenStorage = {
  get: async () => {
    try {
      const val = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (val) return val;
    } catch (_) {}
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(AUTH_TOKEN_KEY);
      } catch (_) {}
    }
    return null;
  },
  set: async (token) => {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (_) {}
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      } catch (_) {}
    }
  },
  clear: async () => {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (_) {}
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
      } catch (_) {}
    }
  },
};

export const userStorage = {
  get: async () => {
    try {
      const val = await AsyncStorage.getItem(USER_DATA_KEY);
      if (val) return JSON.parse(val);
    } catch (_) {}
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const val = window.localStorage.getItem(USER_DATA_KEY);
        if (val) return JSON.parse(val);
      } catch (_) {}
    }
    return null;
  },
  getSync: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const val = window.localStorage.getItem(USER_DATA_KEY);
        if (val) return JSON.parse(val);
      } catch (_) {}
    }
    return null;
  },
  set: async (user) => {
    if (!user) return;
    const str = JSON.stringify(user);
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, str);
    } catch (_) {}
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(USER_DATA_KEY, str);
      } catch (_) {}
    }
  },
  clear: async () => {
    try {
      await AsyncStorage.removeItem(USER_DATA_KEY);
    } catch (_) {}
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(USER_DATA_KEY);
      } catch (_) {}
    }
  },
};
