import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const ThemeContext = createContext();

const COLOR_SCHEMES = {
  blue: {
    primary: '#3d5afe',
    primaryLight: '#536dfe',
    primaryDark: '#304ffe',
  },
  purple: {
    primary: '#8b5cf6',
    primaryLight: '#a78bfa',
    primaryDark: '#7c3aed',
  },
  green: {
    primary: '#22c55e',
    primaryLight: '#4ade80',
    primaryDark: '#16a34a',
  },
  orange: {
    primary: '#f97316',
    primaryLight: '#fb923c',
    primaryDark: '#ea580c',
  },
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme_mode');
    return saved ? saved === 'dark' : true;
  });

  const [colorScheme, setColorScheme] = useState(() => {
    return localStorage.getItem('theme_color') || 'blue';
  });

  useEffect(() => {
    localStorage.setItem('theme_mode', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('theme_color', colorScheme);
    const colors = COLOR_SCHEMES[colorScheme];
    document.documentElement.style.setProperty('--primary', colors.primary);
    document.documentElement.style.setProperty('--primary-light', colors.primaryLight);
    document.documentElement.style.setProperty('--primary-dark', colors.primaryDark);
  }, [colorScheme]);

  const value = useMemo(() => ({
    isDark,
    setIsDark,
    colorScheme,
    setColorScheme,
    toggleTheme: () => setIsDark(p => !p),
    colorSchemes: COLOR_SCHEMES,
  }), [isDark, colorScheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);