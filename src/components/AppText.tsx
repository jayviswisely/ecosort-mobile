import { StyleSheet, Text as NativeText, type TextProps } from 'react-native';

import { fonts } from '@/theme';

export function AppText({ style, ...props }: TextProps) {
  const flattened = StyleSheet.flatten(style);
  const rawWeight = flattened?.fontWeight;
  const numericWeight = rawWeight === 'bold'
    ? 700
    : typeof rawWeight === 'string'
      ? Number.parseInt(rawWeight, 10) || 400
      : rawWeight ?? 400;

  const fontFamily = numericWeight >= 800
    ? fonts.extraBold
    : numericWeight >= 700
      ? fonts.bold
      : numericWeight >= 600
        ? fonts.semibold
        : numericWeight >= 500
          ? fonts.medium
          : fonts.regular;

  return <NativeText {...props} style={[{ fontFamily }, style]} />;
}
