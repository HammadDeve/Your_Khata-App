import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ColorSchemeName } from 'react-native';

// Define our context type
type ThemeContextType = {
  colorScheme: ColorSchemeName;
  isDark: boolean;
  toggleTheme: () => void;
};

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  colorScheme: 'dark',
  isDark: true,
  toggleTheme: () => {},
});

// Export hooks for using the theme context
export const useTheme = () => useContext(ThemeContext);

// Override the useColorScheme function
import * as ColorSchemeModule from '@/hooks/useColorScheme';

// Create the ThemeProvider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use state to manage theme
  const [isDark, setIsDark] = useState(true);
  const theme: ColorSchemeName = isDark ? 'dark' : 'light';
  
  // Load saved theme preference on mount
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('darkMode');
        if (savedTheme !== null) {
          setIsDark(JSON.parse(savedTheme));
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    
    loadSavedTheme();
  }, []);
  
  // Toggle theme function
  const toggleTheme = () => {
    const newThemeValue = !isDark;
    setIsDark(newThemeValue);
    // Store theme preference in AsyncStorage
    AsyncStorage.setItem('darkMode', JSON.stringify(newThemeValue))
      .catch(error => console.error('Error saving theme preference:', error));
  };

  // Override the original useColorScheme
  Object.defineProperty(ColorSchemeModule, 'useColorScheme', {
    value: () => theme,
  });

  // Override the useIsDark hook
  Object.defineProperty(ColorSchemeModule, 'useIsDark', {
    value: () => isDark,
  });

  // Override the useSetColorScheme hook
  Object.defineProperty(ColorSchemeModule, 'useSetColorScheme', {
    value: () => () => toggleTheme(),
  });

  // Provide the theme context
  return (
    <ThemeContext.Provider
      value={{
        colorScheme: theme,
        isDark,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}; 