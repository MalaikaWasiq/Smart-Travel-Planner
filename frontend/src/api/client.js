import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
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

export const tokenStorage = {
  get: () => AsyncStorage.getItem(AUTH_TOKEN_KEY),
  set: (token) => AsyncStorage.setItem(AUTH_TOKEN_KEY, token),
  clear: () => AsyncStorage.removeItem(AUTH_TOKEN_KEY),
};
