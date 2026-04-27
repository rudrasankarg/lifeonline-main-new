import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance } from 'react-native';

export const lightColors = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryLight: '#2DD4BF',
  accent: '#1D4ED8',
  accentLight: '#3B82F6',
  accentSurface: '#EFF6FF',
  danger: '#DC2626',
  dangerDark: '#B91C1C',
  dangerLight: '#FCA5A5',
  severityLow: '#16A34A',
  severityMedium: '#D97706',
  severityHigh: '#DC2626',
  background: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceLight: '#E2E8F0',
  border: '#CBD5E1',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  info: '#1D4ED8',
};

export const darkColors = {
  primary: '#2DD4BF',
  primaryDark: '#14B8A6',
  primaryLight: '#5EEAD4',
  accent: '#60A5FA',
  accentLight: '#93C5FD',
  accentSurface: '#1E3A8A',
  danger: '#F87171',
  dangerDark: '#991B1B',
  dangerLight: '#FECACA',
  severityLow: '#4ADE80',
  severityMedium: '#FBBF24',
  severityHigh: '#F87171',
  background: '#0F172A',
  surface: '#1E293B',
  surfaceLight: '#273449',
  border: '#334155',
  textPrimary: '#E2E8F0',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
};

export const ThemeContext = createContext({
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
  setTheme: (dark) => {},
});

export const ThemeProvider = ({ children }) => {
  // Always follow system theme as a baseline
  const [isDark, setIsDark] = useState(Appearance.getColorScheme() === 'dark');

  useEffect(() => {
    // Listen for system theme changes (e.g. sunset/sunrise or manual toggle in phone settings)
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  const setTheme = (dark) => {
    setIsDark(dark);
    // Note: Persistent saving is disabled to prevent crashes on this specific device environment.
  };

  const toggleTheme = () => setTheme(!isDark);
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
