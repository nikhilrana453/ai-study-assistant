import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const theme = {
    bg:        dark ? '#0f172a' : '#f8fafc',
    bgCard:    dark ? '#1e293b' : '#ffffff',
    bgNav:     dark ? '#1e293b' : '#ffffff',
    border:    dark ? '#334155' : '#e2e8f0',
    text:      dark ? '#f1f5f9' : '#0f172a',
    textMuted: dark ? '#94a3b8' : '#64748b',
    dark,
  };

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(v => !v), theme }}>
      {children}
    </ThemeContext.Provider>
  );
}