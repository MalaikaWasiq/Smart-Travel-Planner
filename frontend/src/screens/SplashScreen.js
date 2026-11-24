import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useApp } from '../context/AppContext';
import { colors, fonts } from '../theme';
import AppText from '../components/AppText';
import AppIcon from '../components/AppIcon';

const natureBg = require('../../assets/splash_nature_bg.jpg');
const origamiPlane = require('../../assets/origami_plane.png');

export default function SplashScreen({ navigation }) {
  const { user, authLoading } = useApp();
  const [navigated, setNavigated] = useState(false);
  const navigatedRef = useRef(false);

  // Animations
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(24)).current;
  const planeEntrance = useRef(new Animated.Value(0)).current;
  const planeFloat = useRef(new Animated.Value(0)).current;
  const planeLaunch = useRef(new Animated.Value(0)).current;
  const chevronPulse = useRef(new Animated.Value(0)).current;
  const goButtonSlide = useRef(new Animated.Value(0)).current;
  const goButtonPress = useRef(new Animated.Value(1)).current;
  const screenFadeOut = useRef(new Animated.Value(1)).current;

  const useNative = Platform.OS !== 'web';

  // Proceed to destination
  const handleProceed = () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    setNavigated(true);

    // Launch animations: "Go" button slides up, plane swooshes into sky, screen fades
    Animated.parallel([
      Animated.timing(goButtonSlide, {
        toValue: -70,
        duration: 450,
        useNativeDriver: useNative,
        easing: Easing.bezier(0.2, 0.9, 0.3, 1),
      }),
      Animated.timing(planeLaunch, {
        toValue: 1,
        duration: 650,
        useNativeDriver: useNative,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(screenFadeOut, {
        toValue: 0,
        duration: 500,
        delay: 200,
        useNativeDriver: useNative,
      }),
    ]).start(() => {
      navigation.replace(user ? (user.role === 'admin' ? 'AdminDashboard' : 'MainApp') : 'Welcome');
    });
  };

  useEffect(() => {
    // 1. Entrance animation for typography and UI
    Animated.parallel([
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 800,
        useNativeDriver: useNative,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(contentSlide, {
        toValue: 0,
        duration: 800,
        useNativeDriver: useNative,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(planeEntrance, {
        toValue: 1,
        duration: 900,
        useNativeDriver: useNative,
        easing: Easing.out(Easing.back(1.5)),
      }),
    ]).start();

    // 2. Continuous gentle floating animation for the origami plane
    Animated.loop(
      Animated.sequence([
        Animated.timing(planeFloat, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: useNative,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(planeFloat, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: useNative,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    // 3. Continuous upward wave animation for the 3 chevron arrows
    Animated.loop(
      Animated.sequence([
        Animated.timing(chevronPulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: useNative,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(chevronPulse, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: useNative,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();
  }, [chevronPulse, contentFade, contentSlide, planeEntrance, planeFloat, useNative]);

  // Automatic timer if user does not press "Go"
  useEffect(() => {
    if (authLoading) return undefined;
    const timer = setTimeout(() => {
      if (!navigatedRef.current) {
        handleProceed();
      }
    }, 4200);

    return () => clearTimeout(timer);
  }, [authLoading, user]);

  // Plane floating interpolations
  const planeTranslateY = Animated.add(
    planeFloat.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -8],
    }),
    planeLaunch.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -220],
    })
  );

  const planeTranslateX = planeLaunch.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180],
  });

  const planeRotate = Animated.add(
    planeFloat.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 3],
    }),
    planeLaunch.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -8],
    })
  ).interpolate({
    inputRange: [-10, 10],
    outputRange: ['-10deg', '10deg'],
  });

  const planeScale = planeLaunch.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  // Chevron wave opacities
  const ch1Opacity = chevronPulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.35, 1, 0.35],
  });
  const ch2Opacity = chevronPulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.35, 1],
  });
  const ch3Opacity = chevronPulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.4, 0.7],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 3D Nature Alpine Landscape Background */}
      <ImageBackground
        source={natureBg}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Soft top gradient to keep text crystal-clear and scenic image vivid */}
        <LinearGradient
          colors={[
            'rgba(10, 38, 24, 0.82)',
            'rgba(11, 42, 27, 0.45)',
            'rgba(14, 48, 32, 0.05)',
            'rgba(14, 48, 32, 0.15)',
            'rgba(8, 30, 18, 0.85)',
          ]}
          locations={[0, 0.24, 0.48, 0.72, 1]}
          style={styles.gradientOverlay}
        >
          <Animated.View style={[styles.mainWrapper, { opacity: screenFadeOut }]}>
            {/* Top Bar / Header Area */}
            <Animated.View
              style={[
                styles.topHeader,
                {
                  opacity: contentFade,
                  transform: [{ translateY: contentSlide }],
                },
              ]}
            >
              {/* App Brand Tag */}
              <View style={styles.brandBadge}>
                <AppIcon name="sparkles" size={13} color={colors.mint} />
                <AppText style={styles.brandBadgeText}>SMART TRAVEL PLANNER • PAKISTAN</AppText>
              </View>

              {/* Origami Paper Airplane with wind trails */}
              <View style={styles.planeContainer}>
                {/* Wind trails */}
                <Animated.View
                  style={[
                    styles.windTrailWrapper,
                    {
                      opacity: planeEntrance,
                      transform: [
                        { translateY: planeTranslateY },
                        { translateX: planeTranslateX },
                      ],
                    },
                  ]}
                >
                  <View style={styles.windTrail1} />
                  <View style={styles.windTrail2} />
                  <View style={styles.windTrail3} />
                </Animated.View>

                {/* Origami Airplane Image */}
                <Animated.View
                  style={[
                    styles.planeWrapper,
                    {
                      opacity: planeEntrance,
                      transform: [
                        { translateY: planeTranslateY },
                        { translateX: planeTranslateX },
                        { rotate: planeRotate },
                        { scale: planeScale },
                      ],
                    },
                  ]}
                >
                  <Image
                    source={origamiPlane}
                    style={styles.planeImage}
                    resizeMode="contain"
                  />
                </Animated.View>
              </View>
            </Animated.View>

            {/* Hero Typography: "Create your favorite journey" */}
            <Animated.View
              style={[
                styles.typographyContainer,
                {
                  opacity: contentFade,
                  transform: [{ translateY: contentSlide }],
                },
              ]}
            >
              <AppText style={styles.headline}>Create your</AppText>
              <AppText style={styles.headlineSecond}>favorite journey</AppText>
              <AppText style={styles.subtitle}>Discover, plan & explore hidden gems</AppText>
            </Animated.View>

            {/* Spacer to let the 3D landscape shine */}
            <View style={styles.scenerySpacer} />

            {/* Center Frosted Glass Capsule "Go" Slider */}
            <Animated.View
              style={[
                styles.capsuleContainer,
                {
                  opacity: contentFade,
                },
              ]}
            >
              <View style={styles.capsuleTrack}>
                {/* Upward Chevrons */}
                <View style={styles.chevronsContainer}>
                  <Animated.View style={[styles.chevronItem, { opacity: ch3Opacity }]}>
                    <AppIcon name="chevron-up" size={16} color="rgba(255, 255, 255, 0.9)" />
                  </Animated.View>
                  <Animated.View style={[styles.chevronItem, { opacity: ch2Opacity }]}>
                    <AppIcon name="chevron-up" size={16} color="rgba(255, 255, 255, 0.75)" />
                  </Animated.View>
                  <Animated.View style={[styles.chevronItem, { opacity: ch1Opacity }]}>
                    <AppIcon name="chevron-up" size={16} color="rgba(255, 255, 255, 0.6)" />
                  </Animated.View>
                </View>

                {/* Interactive "Go" Circular Button */}
                <Animated.View
                  style={[
                    styles.goButtonWrapper,
                    {
                      transform: [
                        { translateY: goButtonSlide },
                        { scale: goButtonPress },
                      ],
                    },
                  ]}
                >
                  <Pressable
                    style={styles.goButton}
                    onPressIn={() => {
                      Animated.spring(goButtonPress, {
                        toValue: 0.92,
                        useNativeDriver: useNative,
                      }).start();
                    }}
                    onPressOut={() => {
                      Animated.spring(goButtonPress, {
                        toValue: 1,
                        useNativeDriver: useNative,
                      }).start();
                    }}
                    onPress={handleProceed}
                    accessibilityRole="button"
                    accessibilityLabel="Go - Start planning your journey"
                  >
                    <LinearGradient
                      colors={['#ffffff', '#e3f3eb', '#cde8da']}
                      style={styles.goButtonGradient}
                    >
                      <AppText style={styles.goButtonText}>Go</AppText>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              </View>

              <AppText style={styles.hintText}>Tap Go to begin</AppText>
            </Animated.View>
          </Animated.View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a2618',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  mainWrapper: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 56 : 46,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(223, 243, 232, 0.3)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backdropFilter: 'blur(10px)',
  },
  brandBadgeText: {
    color: '#dff3e8',
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 1.2,
  },
  planeContainer: {
    position: 'relative',
    width: 95,
    height: 75,
    marginRight: 4,
  },
  windTrailWrapper: {
    position: 'absolute',
    left: -20,
    bottom: 12,
    gap: 5,
  },
  windTrail1: {
    width: 22,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(223, 243, 232, 0.55)',
    transform: [{ rotate: '25deg' }],
  },
  windTrail2: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(223, 243, 232, 0.4)',
    transform: [{ rotate: '25deg' }],
  },
  windTrail3: {
    width: 10,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: 'rgba(223, 243, 232, 0.25)',
    transform: [{ rotate: '25deg' }],
  },
  planeWrapper: {
    width: 95,
    height: 75,
  },
  planeImage: {
    width: '100%',
    height: '100%',
  },
  typographyContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  headline: {
    color: '#ffffff',
    fontSize: 35,
    lineHeight: 42,
    fontFamily: fonts.displayBold,
    textAlign: 'center',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  headlineSecond: {
    color: '#f0fbf4',
    fontSize: 35,
    lineHeight: 42,
    fontFamily: fonts.displayBold,
    textAlign: 'center',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    color: '#c0dfcd',
    fontSize: 14,
    fontFamily: fonts.medium,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  scenerySpacer: {
    flex: 1,
    minHeight: 80,
  },
  capsuleContainer: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    zIndex: 20,
  },
  capsuleTrack: {
    width: 72,
    height: 154,
    borderRadius: 36,
    backgroundColor: 'rgba(220, 244, 230, 0.26)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    padding: 6,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  chevronsContainer: {
    alignItems: 'center',
    paddingTop: 12,
    gap: 2,
  },
  chevronItem: {
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goButtonWrapper: {
    width: 58,
    height: 58,
    borderRadius: 29,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  goButton: {
    width: '100%',
    height: '100%',
    borderRadius: 29,
    overflow: 'hidden',
  },
  goButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
  },
  goButtonText: {
    color: '#0d3824',
    fontFamily: fonts.extraBold,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  hintText: {
    color: 'rgba(235, 248, 240, 0.85)',
    fontSize: 11,
    fontFamily: fonts.semibold,
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
