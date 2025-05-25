import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ColorSchemeName, useColorScheme as _useColorScheme } from 'react-native';

type ColorSchemeContextType = {
  colorScheme: ColorSchemeName;
  isDark: boolean;
  setColorScheme: (scheme: 'light' | 'dark') => void;
};

const ColorSchemeContext = createContext<ColorSchemeContextType>({
  colorScheme: 'light',
  isDark: false,
  setColorScheme: () => {},
});

export function useColorScheme(): ColorSchemeName {
  return useContext(ColorSchemeContext).colorScheme;
}

export function useIsDark(): boolean {
  return useContext(ColorSchemeContext).isDark;
}

export function useSetColorScheme(): (scheme: 'light' | 'dark') => void {
  return useContext(ColorSchemeContext).setColorScheme;
}

export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const deviceColorScheme = _useColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(deviceColorScheme);
  
  // Load saved preference on mount
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('darkMode');
        if (savedTheme !== null) {
          const isDarkMode = JSON.parse(savedTheme);
          setColorScheme(isDarkMode ? 'dark' : 'light');
        } else {
          setColorScheme(deviceColorScheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        setColorScheme(deviceColorScheme);
      }
    };
    
    loadSavedTheme();
  }, [deviceColorScheme]);
  
  const isDark = colorScheme === 'dark';
  
  const setTheme = (scheme: 'light' | 'dark') => {
    setColorScheme(scheme);
    AsyncStorage.setItem('darkMode', JSON.stringify(scheme === 'dark'));
  };
  
  return (
    <ColorSchemeContext.Provider 
      value={{ 
        colorScheme, 
        isDark, 
        setColorScheme: setTheme 
      }}
    >
      {children}
    </ColorSchemeContext.Provider>
  );
} 