import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    tertiary: '#10B981',
    error: '#EF4444',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    tertiary: '#10B981',
    error: '#EF4444',
    background: '#111827',
    surface: '#1F2937',
    text: '#F9FAFB',
  },
};
