import React from 'react';
import { StyleSheet, Pressable as TouchableOpacity, View } from 'react-native';
import AppIcon from './AppIcon';
import AppText from './AppText';
import { colors, fonts, shadow } from '../theme';

export default function FloatingChatButton({ navigation, style }) {
  if (!navigation) return null;

  return (
    <TouchableOpacity
      style={[styles.floatingButton, style]}
      onPress={() => navigation.navigate('Chat')}
      accessibilityRole="button"
      accessibilityLabel="Open SafarSaathi AI Travel Assistant"
    >
      <View style={styles.iconCircle}>
        <AppIcon name="chatbubbles" size={20} color={colors.white} />
        {/* Glowing online indicator */}
        <View style={styles.onlineDot} />
      </View>
      <View style={styles.textWrap}>
        <AppText style={styles.titleText}>SafarSaathi AI</AppText>
        <AppText style={styles.subtitleText}>AI Travel Guide</AppText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: 12,
    bottom: 16,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c3d26',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#34d399',
    ...shadow,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#165338',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#22c55e',
    borderWidth: 1.5,
    borderColor: '#0c3d26',
  },
  textWrap: {
    justifyContent: 'center',
  },
  titleText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 15,
  },
  subtitleText: {
    color: '#86efac',
    fontSize: 9,
    fontFamily: fonts.medium,
    lineHeight: 11,
    letterSpacing: 0.4,
  },
});
