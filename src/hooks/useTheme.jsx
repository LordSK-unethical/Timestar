import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const ThemeContext = createContext();

const COLOR_SCHEMES = {
  blue: {
    id: 'blue',
    name: 'Blue',
    primary: '#3d5afe',
    primaryLight: '#536dfe',
    primaryDark: '#304ffe',
  },
  purple: {
    id: 'purple',
    name: 'Purple',
    primary: '#8b5cf6',
    primaryLight: '#a78bfa',
    primaryDark: '#7c3aed',
  },
  green: {
    id: 'green',
    name: 'Green',
    primary: '#22c55e',
    primaryLight: '#4ade80',
    primaryDark: '#16a34a',
  },
  orange: {
    id: 'orange',
    name: 'Orange',
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

  const [colorSchemeId, setColorSchemeId] = useState(() => {
    return localStorage.getItem('theme_color') || 'blue';
  });

  const colorScheme = COLOR_SCHEMES[colorSchemeId] || COLOR_SCHEMES.blue;

  useEffect(() => {
    localStorage.setItem('theme_mode', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
    document.body.classList.toggle('light', !isDark);
    
    const bgColor = isDark ? '#121212' : '#f5f5f5';
    const surfaceColor = isDark ? '#1e1e1e' : '#ffffff';
    const cardColor = isDark ? '#252525' : '#f0f0f0';
    const textPrimary = isDark ? '#e2e2e2' : '#1a1a1a';
    const textSecondary = isDark ? '#8a8a8a' : '#666666';
    const borderColor = isDark ? '#2c2c2c' : '#e0e0e0';
    
    document.documentElement.style.setProperty('--bg-primary', bgColor);
    document.documentElement.style.setProperty('--bg-surface', surfaceColor);
    document.documentElement.style.setProperty('--bg-card', cardColor);
    document.documentElement.style.setProperty('--text-primary', textPrimary);
    document.documentElement.style.setProperty('--text-secondary', textSecondary);
    document.documentElement.style.setProperty('--border-color', borderColor);
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('theme_color', colorSchemeId);
    document.documentElement.style.setProperty('--primary', colorScheme.primary);
    document.documentElement.style.setProperty('--primary-light', colorScheme.primaryLight);
    document.documentElement.style.setProperty('--primary-dark', colorScheme.primaryDark);
  }, [colorSchemeId, colorScheme]);

  const setColorScheme = (scheme) => {
    if (typeof scheme === 'string') {
      setColorSchemeId(scheme);
    } else if (scheme && scheme.id) {
      setColorSchemeId(scheme.id);
    }
  };

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
