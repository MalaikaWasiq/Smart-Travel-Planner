import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, fonts, radius } from '../theme';
import AppText from './AppText';
import AppIcon from './AppIcon';
import { navigationRef } from '../navigation/navigationRef';

const natureBg = require('../../assets/splash_nature_bg.jpg');
const mountainLogo = require('../../assets/stp_mountain_logo_clean.png');
const leafFlourish = require('../../assets/auth_leaf_flourish_clean.png');
const bottomMountains = require('../../assets/auth_bottom_mountains_clean.png');

export function AuthLayout({ title, subtitle, serverError, onBack, children }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  function handleBack() {
    if (onBack) {
      onBack();
    } else if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    } else if (navigationRef.isReady()) {
      navigationRef.navigate('Welcome');
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Full Scenic Pakistan Mountain Background */}
      <ImageBackground
        source={natureBg}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Subtle overlay: on desktop keeps scenic view crisp, on mobile ensures readability */}
        <View style={[styles.bgOverlay, isDesktop ? styles.desktopOverlay : styles.mobileOverlay]}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              isDesktop ? styles.desktopScrollContent : styles.mobileScrollContent,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Centered Authentication Card matching reference mockup */}
            <View style={[styles.card, isDesktop ? styles.desktopCard : styles.mobileCard]}>
              {/* Top Leaf Flourish in corner */}
              <View style={styles.leafWrapper} pointerEvents="none">
                <Image source={leafFlourish} style={styles.leafImage} resizeMode="contain" />
              </View>

              {/* Top Navigation Row with Back Arrow */}
              <View style={styles.topNav}>
                <Pressable
                  hitSlop={14}
                  onPress={handleBack}
                  style={styles.backBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <AppIcon name="arrow-back" size={20} color="#1b4d36" />
                </Pressable>
              </View>

              {/* Brand Center: Mountain Sun Logo, Title & Subtitle */}
              <View style={styles.headerSection}>
                <Image source={mountainLogo} style={styles.logoImage} resizeMode="contain" />
                <AppText style={styles.title}>{title}</AppText>
                <AppText style={styles.subtitle}>{subtitle}</AppText>
                <View style={styles.heartRow}>
                  <View style={styles.heartLine} />
                  <AppText style={styles.heartEmoji}>💚</AppText>
                  <View style={styles.heartLine} />
                </View>
              </View>

              {/* Error Banner if any */}
              {serverError ? (
                <View style={authStyles.errorBanner}>
                  <AppIcon name="alert-circle" size={18} color={colors.red} />
                  <AppText style={authStyles.errorBannerText}>{serverError}</AppText>
                </View>
              ) : null}

              {/* Main Content / Form */}
              <View style={styles.body}>{children}</View>

              {/* Bottom Mountain Outline Illustration */}
              <View style={styles.bottomIllustrationWrapper} pointerEvents="none">
                <Image source={bottomMountains} style={styles.bottomIllustration} resizeMode="contain" />
              </View>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </View>
  );
}

export function FormField({
  label,
  iconName,
  error,
  isPassword,
  secureTextEntry,
  rightAction,
  ...inputProps
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isSecure = isPassword ? !showPassword : secureTextEntry;

  return (
    <View style={styles.fieldWrap}>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        {iconName ? (
          <AppIcon
            name={iconName}
            size={18}
            color={isFocused ? '#155d3b' : '#8a9b91'}
            style={styles.fieldLeftIcon}
          />
        ) : null}
        <TextInput
          id={inputProps.id || (label ? `auth-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)}
          nativeID={inputProps.nativeID || (label ? `auth-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)}
          name={inputProps.name || (label ? label.toLowerCase().replace(/\s+/g, '') : undefined)}
          accessibilityLabel={inputProps.accessibilityLabel || label}
          placeholderTextColor="#9caaa2"
          {...inputProps}
          secureTextEntry={isSecure}
          onFocus={(e) => {
            setIsFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            inputProps.onBlur?.(e);
          }}
          style={styles.input}
        />
        {isPassword ? (
          <Pressable
            hitSlop={10}
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeBtn}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <AppIcon
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color="#8a9b91"
            />
          </Pressable>
        ) : null}
        {rightAction}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <AppIcon name="alert-circle-outline" size={13} color={colors.red} />
          <AppText variant="caption" color={colors.red} style={styles.errorText}>
            {error}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

export const authStyles = StyleSheet.create({
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    zIndex: 10,
  },
  switchText: {
    color: '#6c7d74',
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  switchLink: {
    color: '#155d3b',
    fontWeight: '700',
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  banner: {
    backgroundColor: '#eaf6ef',
    borderColor: '#b2ddc5',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  bannerTitle: { color: '#155d3b', fontWeight: '700', fontSize: 14 },
  bannerText: { color: '#2b3b33', marginTop: 3, lineHeight: 19, fontSize: 13 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: { color: '#b91c1c', flex: 1, fontSize: 13, lineHeight: 18 },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a2318',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bgOverlay: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  desktopOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  mobileOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopScrollContent: {
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  mobileScrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  desktopCard: {
    maxWidth: 440,
    borderRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 22,
    shadowColor: '#072517',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 36,
    elevation: 16,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 20px 50px rgba(7, 37, 23, 0.28), 0 4px 12px rgba(0, 0, 0, 0.08)',
        }
      : {}),
  },
  mobileCard: {
    maxWidth: 430,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  leafWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 88,
    height: 92,
    zIndex: 1,
    opacity: 0.95,
  },
  leafImage: {
    width: '100%',
    height: '100%',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 10,
  },
  backBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(237, 243, 239, 0.85)',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 5,
  },
  logoImage: {
    width: 76,
    height: 66,
    marginBottom: 8,
  },
  title: {
    fontSize: 25,
    fontFamily: fonts.bold,
    color: '#134932',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#65776d',
    fontFamily: fonts.regular,
    marginTop: 4,
    textAlign: 'center',
  },
  heartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  heartLine: {
    width: 22,
    height: 1,
    backgroundColor: '#cbd9d0',
  },
  heartEmoji: {
    fontSize: 10,
  },
  body: {
    width: '100%',
    zIndex: 5,
  },
  fieldWrap: {
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f6f3',
    borderColor: '#e2eae4',
    borderWidth: 1.2,
    borderRadius: 24,
    minHeight: 48,
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderColor: '#155d3b',
    backgroundColor: '#ffffff',
    shadowColor: '#155d3b',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  inputError: {
    borderColor: colors.red,
    backgroundColor: '#fff9f9',
  },
  fieldLeftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#1a3026',
    fontFamily: fonts.medium,
    fontSize: 14,
    paddingVertical: 10,
  },
  eyeBtn: {
    padding: 6,
    marginLeft: 6,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 12,
  },
  errorText: {
    fontSize: 12,
  },
  bottomIllustrationWrapper: {
    width: '100%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    opacity: 0.85,
  },
  bottomIllustration: {
    width: 240,
    height: '100%',
  },
});
