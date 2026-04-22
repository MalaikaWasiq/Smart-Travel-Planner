import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen({ navigation }) {
  const logoScale   = new Animated.Value(0);
  const logoOpacity = new Animated.Value(0);
  const textOpacity = new Animated.Value(0);
  const subOpacity  = new Animated.Value(0);
  const tagOpacity  = new Animated.Value(0);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(subOpacity,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(tagOpacity,  { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => navigation.replace('Login'), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient colors={['#0d5c2e', '#1a7a4a', '#25a865']} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <StatusBar style="light" />

      <View style={styles.topDots}>
        {[...Array(6)].map((_, i) => <View key={i} style={styles.decorDot} />)}
      </View>

      <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <View style={styles.globeOuter}>
          <View style={styles.globeHLineTop} />
          <View style={styles.globeHLineMid} />
          <View style={styles.globeHLineBottom} />
          <View style={styles.globeVLine} />
          <View style={styles.globeCurveLeft} />
          <View style={styles.globeCurveRight} />
          <View style={styles.planeIconWrap}>
            <Text style={styles.planeIcon}>✈</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.nameWrap, { opacity: textOpacity }]}>
        <Text style={styles.pakText}>Smart Travel</Text>
        <Text style={styles.explorerText}>Planner</Text>
      </Animated.View>

      <Animated.View style={{ opacity: subOpacity }}>
        <Text style={styles.subtitle}>AI-POWERED TRAVEL PLANNER</Text>
      </Animated.View>

      <Animated.View style={[styles.divider, { opacity: subOpacity }]} />

      <Animated.View style={{ opacity: tagOpacity }}>
        <Text style={styles.tagline}>Explore Pakistan. Smarter.</Text>
      </Animated.View>

      <View style={styles.bottomWrap}>
        <View style={styles.dotRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.universityText}>COMSATS University Islamabad</Text>
        <Text style={styles.campusText}>Attock Campus  •  BSE 2023–2026</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topDots:         { position: 'absolute', top: 60, flexDirection: 'row', gap: 10, opacity: 0.3 },
  decorDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ffffff' },
  logoContainer:   { marginBottom: 28 },
  globeOuter:      { width: 130, height: 130, borderRadius: 65, borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  globeHLineTop:   { position: 'absolute', width: '100%', height: 1.5, backgroundColor: 'rgba(255,255,255,0.45)', top: '28%' },
  globeHLineMid:   { position: 'absolute', width: '100%', height: 1.5, backgroundColor: 'rgba(255,255,255,0.45)', top: '50%' },
  globeHLineBottom:{ position: 'absolute', width: '100%', height: 1.5, backgroundColor: 'rgba(255,255,255,0.45)', top: '72%' },
  globeVLine:      { position: 'absolute', width: 1.5, height: '100%', backgroundColor: 'rgba(255,255,255,0.45)', left: '50%' },
  globeCurveLeft:  { position: 'absolute', width: 44, height: 126, borderRadius: 44, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.45)', left: 20, backgroundColor: 'transparent' },
  globeCurveRight: { position: 'absolute', width: 44, height: 126, borderRadius: 44, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.45)', right: 20, backgroundColor: 'transparent' },
  planeIconWrap:   { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 22, padding: 5 },
  planeIcon:       { fontSize: 30, color: '#ffffff' },
  nameWrap:        { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  pakText:         { fontSize: 48, color: '#ffffff', fontWeight: '800', letterSpacing: 1 },
  explorerText:    { fontSize: 48, color: 'rgba(255,255,255,0.75)', fontWeight: '300', letterSpacing: 1 },
  subtitle:        { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', letterSpacing: 2, fontWeight: '400' },
  divider:         { width: 50, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1, marginVertical: 16 },
  tagline:         { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center', fontWeight: '300', fontStyle: 'italic', letterSpacing: 0.5 },
  bottomWrap:      { position: 'absolute', bottom: 48, alignItems: 'center' },
  dotRow:          { flexDirection: 'row', gap: 6, marginBottom: 14 },
  dot:             { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive:       { backgroundColor: '#ffffff', width: 24 },
  universityText:  { fontSize: 12, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5, marginBottom: 3 },
  campusText:      { fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.3 },
});
