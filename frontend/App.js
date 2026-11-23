import React, { Component, useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as NativeSplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox, Platform, StyleSheet, Text, View } from 'react-native';

LogBox.ignoreLogs([
  "Passing an object as the argument to 'navigate' is deprecated",
]);

if (Platform.OS === 'web' && typeof console !== 'undefined' && console.warn) {
  const _origWarn = console.warn;
  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes("Passing an object as the argument to 'navigate' is deprecated")) {
      return;
    }
    _origWarn.apply(console, args);
  };
}

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  try {
    const styleId = 'stp-custom-scrollbar';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `
        /* Always show clean emerald scrollbar on desktop & mobile web */
        ::-webkit-scrollbar {
          width: 10px !important;
          height: 10px !important;
          display: block !important;
        }
        ::-webkit-scrollbar-track {
          background: rgba(21, 94, 67, 0.08) !important;
          border-radius: 6px !important;
        }
        ::-webkit-scrollbar-thumb {
          background: #15803d !important;
          border-radius: 6px !important;
          border: 2px solid rgba(255, 255, 255, 0.85) !important;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #166534 !important;
        }
        * {
          scrollbar-width: thin !important;
          scrollbar-color: #15803d rgba(21, 94, 67, 0.08) !important;
        }
      `;
      document.head.appendChild(styleEl);
    }
  } catch (_) {}
}

import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { Manrope_400Regular } from '@expo-google-fonts/manrope/400Regular';
import { Manrope_500Medium } from '@expo-google-fonts/manrope/500Medium';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { Manrope_800ExtraBold } from '@expo-google-fonts/manrope/800ExtraBold';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import OfflineBanner from './src/components/OfflineBanner';
import { typography } from './src/theme';

// Error boundary to prevent white screen crashes
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Smart Travel Planner</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'Something went wrong while rendering.'}
          </Text>
          <Text style={styles.errorHelp}>
            Please refresh the page or restart the development server.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

NativeSplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    NativeSplashScreen.hideAsync().catch(() => {});
  }, [fontError, fontsLoaded]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    import('expo-notifications').then((Notifications) => {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
    }).catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider style={styles.backdrop}>
        <AppProvider>
          <View style={[styles.app, Platform.OS === 'web' && styles.webApp]}>
            <OfflineBanner />
            <AppNavigator />
          </View>
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: Platform.OS === 'web' ? '#dfe8e1' : '#f7f3e8' },
  app: { flex: 1, width: '100%' },
  webApp: {
    maxWidth: 1200,
    alignSelf: 'center',
    overflow: 'hidden',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#cad7ce',
    boxShadow: '0 0 45px rgba(20, 53, 40, 0.16)',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f7f3e8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#174f36',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#b43b36',
    textAlign: 'center',
    marginBottom: 14,
  },
  errorHelp: {
    fontSize: 12,
    color: '#697a73',
    textAlign: 'center',
  },
});
