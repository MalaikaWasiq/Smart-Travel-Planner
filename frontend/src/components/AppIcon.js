import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../theme';

export default function AppIcon({ name, size = 20, color = colors.ink, ...props }) {
  return <Ionicons name={name} size={size} color={color} accessibilityElementsHidden {...props} />;
}
