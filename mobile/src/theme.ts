import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

/**
 * Apple-like (iOS) surfaces:
 * - light background: #F2F2F7 (iOS grouped background)
 * - separators: #E5E5EA
 */
export const iosColors = {
  primary: '#3B82F6',
  secondary: '#22C55E',
  tertiary: '#10B981',
  error: '#EF4444',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceVariant: '#F9FAFB',
  text: '#111827',
  mutedText: '#6B7280',
  separator: '#E5E5EA',
} as const;

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: iosColors.primary,
    secondary: iosColors.secondary,
    tertiary: iosColors.tertiary,
    error: iosColors.error,
    background: iosColors.background,
    surface: iosColors.surface,
    surfaceVariant: iosColors.surfaceVariant,
    onSurface: iosColors.text,
    onSurfaceVariant: iosColors.mutedText,
    outline: iosColors.separator,
    text: iosColors.text,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: iosColors.primary,
    secondary: iosColors.secondary,
    tertiary: iosColors.tertiary,
    error: iosColors.error,
    background: '#0B0B0F',
    surface: '#111827',
    surfaceVariant: '#1F2937',
    onSurface: '#F9FAFB',
    onSurfaceVariant: '#D1D5DB',
    outline: '#2C2C2E',
    text: '#F9FAFB',
  },
};
