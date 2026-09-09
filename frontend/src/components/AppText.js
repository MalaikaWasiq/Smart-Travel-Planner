import React from 'react';
import { Text } from 'react-native';
import { colors, typography } from '../theme';

export default function AppText({ variant = 'body', color = colors.ink, style, children, ...props }) {
  return (
    <Text {...props} style={[typography[variant] || typography.body, { color }, style]}>
      {children}
    </Text>
  );
}
