import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeType } from '@/styles/theme';

interface ThemeContextType {
  currentTheme: ThemeType;
  theme: ReturnType<typeof createTheme>;
  changeTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('theme') as ThemeType;
    return saved || 'default';
  });
  
  const [theme, setTheme] = useState(() => createTheme(currentTheme));

  const changeTheme = (newTheme: ThemeType) => {
    setCurrentTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    setTheme(createTheme(currentTheme));
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 