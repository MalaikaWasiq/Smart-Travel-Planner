import React from 'react';
import { ImageBackground, StyleSheet, Pressable as TouchableOpacity, View, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { colors, fonts, radius } from '../theme';
import AppText from '../components/AppText';
import AppIcon from '../components/AppIcon';

const natureBg = require('../../assets/splash_nature_bg.jpg');

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={natureBg}
        style={styles.backgroundImage}
        imageStyle={styles.bgImageStyle}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(6, 35, 22, 0.4)', 'rgba(6, 35, 22, 0.85)', '#062316']}
          locations={[0, 0.55, 1]}
          style={styles.gradient}
        >
          {/* Centered content wrapper for web */}
          <View style={styles.contentWrapper}>
            {/* Top Brand Emblem */}
            <View style={styles.topSection}>
              <View style={styles.emblemBadge}>
                <View style={styles.emblemInner}>
                  <AppIcon name="compass" size={24} color={colors.mint} />
                  <AppText style={styles.emblemText}>STP</AppText>
                </View>
              </View>
              <View style={styles.taglinePill}>
                <AppIcon name="sparkles" size={13} color={colors.mint} />
                <AppText style={styles.pillText}>ALL-IN-ONE TRAVEL PLATFORM</AppText>
              </View>
            </View>

            {/* Bottom Content & Actions */}
            <View style={styles.bottomSection}>
              <AppText style={styles.titlePrimary}>Smart Travel</AppText>
              <AppText style={styles.titleSecondary}>Planner</AppText>

              <AppText style={styles.motto}>
                Plan smarter. Travel better. Explore Pakistan.
              </AppText>

              <AppText style={styles.description}>
                Discover breathtaking destinations, generate personalized itineraries, book curated hotels, and track real-time weather & road safety advisories across Pakistan.
              </AppText>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => navigation.navigate('Signup')}
                  accessibilityRole="button"
                  accessibilityLabel="Create Account"
                >
                  <AppText style={styles.primaryButtonText}>CREATE ACCOUNT (SIGN UP)</AppText>
                  <AppIcon name="person-add-outline" size={18} color="#062316" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => navigation.navigate('Login')}
                  accessibilityRole="button"
                  accessibilityLabel="Sign In with existing account"
                >
                  <AppText style={styles.secondaryButtonText}>LOG IN (SIGN IN)</AppText>
                </TouchableOpacity>
              </View>

              <AppText style={styles.footerNote}>
                Hunza • Skardu • Swat • Lahore • Gwadar • Fairy Meadows
              </AppText>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#062316',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bgImageStyle: {
    width: '100%',
    height: '100%',
    ...(Platform.OS === 'web' ? {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      objectFit: 'cover',
    } : {}),
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 26,
    paddingTop: 60,
    paddingBottom: 40,
  },
  topSection: {
    alignItems: 'center',
    gap: 12,
  },
  emblemBadge: {
    padding: 3,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  emblemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(223, 243, 232, 0.8)',
    borderRadius: 32,
    paddingHorizontal: 18,
    paddingVertical: 9,
    backgroundColor: 'rgba(15, 51, 35, 0.65)',
  },
  emblemText: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 15,
    letterSpacing: 2,
  },
  taglinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(223, 243, 232, 0.3)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  pillText: {
    color: '#dff3e8',
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 1.2,
  },
  bottomSection: {
    gap: 8,
    alignItems: 'center',
  },
  titlePrimary: {
    color: '#ffffff',
    fontSize: 40,
    lineHeight: 46,
    fontFamily: fonts.displayBold,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  titleSecondary: {
    color: '#dff3e8',
    fontSize: 40,
    lineHeight: 46,
    fontFamily: fonts.display,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  motto: {
    color: colors.mint,
    fontSize: 16,
    fontFamily: fonts.bold,
    marginTop: 4,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  description: {
    color: '#c2dfce',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.body,
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
  },
  actionButtons: {
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#062316',
    fontFamily: fonts.bold,
    fontSize: 14,
    letterSpacing: 1.2,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(223, 243, 232, 0.4)',
    borderWidth: 1.2,
    borderRadius: radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1,
  },
  footerNote: {
    color: 'rgba(223, 243, 232, 0.5)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: 0.8,
  },
});
