import StorageUtils from '@/utils/storage';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import AppLock from '@/components/AppLock';
import { ThemeProvider } from '@/context/ThemeProvider';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    // Initialize default profile when the app starts
    const initializeApp = async () => {
      try {
        await StorageUtils.initializeDefaultProfile();
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };
    
    initializeApp();
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider>
      <AppLock>
        <RootLayoutNav />
      </AppLock>
    </ThemeProvider>
  );
}
function RootLayoutNav() {
  const colorScheme = useColorScheme();
  
  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false, // Hide header for ALL screens by default
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="privacy-policy" options={{ presentation: 'modal' }} />
        {/* You can still override headerShown for individual screens if needed */}
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}
