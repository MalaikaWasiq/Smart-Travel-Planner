import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useApp } from '../context/AppContext';
import { colors } from '../theme';
import Text from '../components/AppText';

export default function SplashScreen({ navigation }) {
  const { user, authLoading } = useApp();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: false }).start();
  }, [opacity]);

  useEffect(() => {
    if (authLoading) return undefined;
    const timer = setTimeout(() => navigation.replace(user ? 'MainApp' : 'Login'), 900);
    return () => clearTimeout(timer);
  }, [authLoading, navigation, user]);

  return (
    <LinearGradient colors={[colors.forest, '#1f6849', colors.green]} style={styles.page}>
      <StatusBar style="light" />
      <Animated.View style={{ opacity, alignItems: 'center' }}>
        <View style={styles.mark}><Text style={styles.markText}>STP</Text></View>
        <Text style={styles.title}>Smart Travel</Text>
        <Text style={styles.light}>Planner</Text>
        <Text style={styles.tagline}>PAKISTAN, PLANNED AROUND YOU</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mark: { width: 92, height: 92, borderRadius: 46, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  markText: { color: '#fff', fontWeight: '900', fontSize: 24 },
  title: { color: '#fff', fontSize: 39, fontWeight: '900' },
  light: { color: '#dff3e8', fontSize: 39, fontWeight: '300', marginTop: -6 },
  tagline: { color: '#bfe2cf', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginTop: 14 },
});
