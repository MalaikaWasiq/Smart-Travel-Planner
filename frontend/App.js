import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as NativeSplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, StyleSheet, Text, View } from 'react-native';
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

NativeSplashScreen.preventAutoHideAsync().catch(() => {});
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = [typography.body, Text.defaultProps.style];

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
    if (fontsLoaded || fontError) NativeSplashScreen.hideAsync().catch(() => {});
  }, [fontError, fontsLoaded]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    import('expo-notifications').then((Notifications) => {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
      });
    }).catch(() => {});
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider style={styles.backdrop}>
      <AppProvider>
        <View style={[styles.app, Platform.OS === 'web' && styles.webApp]}><OfflineBanner /><AppNavigator /></View>
      </AppProvider>
    </SafeAreaProvider>
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
});
