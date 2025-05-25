import { useTheme } from '@/context/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    AppState,
    AppStateStatus,
    BackHandler,
    Keyboard,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

interface AppLockProps {
  children: React.ReactNode;
}

export default function AppLock({ children }: AppLockProps) {
  const [isLocked, setIsLocked] = useState(true);
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [storedPin, setStoredPin] = useState('');
  const [lockTime, setLockTime] = useState<number | null>(null);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const { isDark } = useTheme();
  const appState = useRef(AppState.currentState);
  const inputRef = useRef<TextInput>(null);
  const keyboardVisible = useRef(false);

  // Check biometric capabilities on mount
  useEffect(() => {
    const checkBiometricSupport = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricSupported(hasHardware && isEnrolled);
      } catch (error) {
        console.error('Error checking biometric support:', error);
        setBiometricSupported(false);
      }
    };
    
    checkBiometricSupport();
  }, []);

  // Setup keyboard listeners
  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => {
      keyboardVisible.current = true;
    });
    
    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      keyboardVisible.current = false;
      // Re-focus the input when keyboard hides to make it easy to try again
      if (isLocked && isPinEnabled) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    });
    
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [isLocked, isPinEnabled]);

  // Check security settings on mount
  useEffect(() => {
    const checkSettings = async () => {
      const hasSecurity = await checkSecuritySettings();
      
      // Always lock the app if security is enabled
      if (hasSecurity) {
        setIsLocked(true);
        
        // Try biometric authentication if enabled
        if (isBiometricEnabled && biometricSupported) {
          setTimeout(() => {
            authenticateWithBiometrics();
          }, 500);
        }
      } else {
        setIsLocked(false);
      }
    };
    
    checkSettings();
  }, []);
  
  // Focus input when modal is visible
  useEffect(() => {
    if (isLocked && isPinEnabled) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isLocked, isPinEnabled]);

  // Track app state for auto-lock
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        // App is going to background
        setLockTime(Date.now());
      } else if (nextAppState === 'active' && lockTime) {
        // App is coming to foreground
        try {
          const pinEnabled = await AsyncStorage.getItem('pin_enabled');
          
          // Always lock the app if PIN is enabled
          if (pinEnabled === 'true') {
            setIsLocked(true);
            // Try biometric if enabled
            const bioEnabled = await AsyncStorage.getItem('biometric_enabled');
            if (bioEnabled === 'true') {
              // Add delay to ensure UI is ready
              setTimeout(() => {
                authenticateWithBiometrics();
              }, 500);
            }
          }
        } catch (error) {
          console.error('Error handling app state:', error);
        }
      }
      
      appState.current = nextAppState;
    };

    // Set up app state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [lockTime]);

  // Load security settings from AsyncStorage
  const checkSecuritySettings = async () => {
    try {
      const pinEnabled = await AsyncStorage.getItem('pin_enabled');
      const bioEnabled = await AsyncStorage.getItem('biometric_enabled');
      const pin = await AsyncStorage.getItem('app_pin');
      
      setIsPinEnabled(pinEnabled === 'true');
      setIsBiometricEnabled(bioEnabled === 'true');
      if (pin) {
        setStoredPin(pin);
      }
      
      // If no security is enabled, unlock the app
      if (pinEnabled !== 'true') {
        setIsLocked(false);
      } else if (bioEnabled === 'true' && biometricSupported) {
        // If biometrics are enabled and supported, try authentication after a short delay
        setTimeout(() => {
          authenticateWithBiometrics();
        }, 500);
      }

      return pinEnabled === 'true';
    } catch (error) {
      console.error('Error loading security settings:', error);
      setIsLocked(false); // Fallback to unlocked state on error
      return false;
    }
  };

  // Authenticate with biometrics
  const authenticateWithBiometrics = async () => {
    try {
      // Don't try if the app is already unlocked
      if (!isLocked) return;
      
      // Check if device supports biometrics
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        console.log('Biometrics not supported or not enrolled');
        return;
      }
      
      // Perform authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Your Khata',
        fallbackLabel: 'Use PIN instead',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });
      
      if (result.success) {
        setIsLocked(false);
        setPinInput(''); // Clear PIN input
      } else if (result.error === 'user_cancel') {
        // User canceled, do nothing
        console.log('User canceled biometric authentication');
        // Focus on PIN input after cancellation
        setTimeout(() => inputRef.current?.focus(), 100);
      } else {
        console.log('Biometric authentication failed:', result.error);
        // Focus on PIN input after failure
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch (error) {
      console.error('Error authenticating with biometrics:', error);
      // Focus on PIN input after error
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Handle PIN input
  const handlePinInput = (pin: string) => {
    setPinInput(pin);
    
    if (pin.length === 4) {
      if (pin === storedPin) {
        setIsLocked(false);
        setPinInput('');
      } else {
        Alert.alert('Incorrect PIN', 'The PIN you entered is incorrect. Please try again.');
        setPinInput('');
        // Re-focus the input after error
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  };

  // Retry biometric authentication
  const retryBiometric = () => {
    if (isBiometricEnabled && biometricSupported) {
      authenticateWithBiometrics();
    } else {
      Alert.alert(
        'Biometric Authentication',
        biometricSupported 
          ? 'Biometric authentication is not enabled in settings.' 
          : 'Biometric authentication is not available on this device.'
      );
    }
  };

  // Prevent back button on lock screen
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (isLocked) {
          return true; // Prevent default behavior when locked
        }
        return false; // Let default behavior happen when unlocked
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [isLocked])
  );

  if (!isLocked || !isPinEnabled) {
    return <>{children}</>;
  }

  return (
    <Modal
      visible={isLocked}
      animationType="fade"
      statusBarTranslucent
      onShow={() => {
        // Focus input when modal is shown
        setTimeout(() => inputRef.current?.focus(), 300);
      }}
    >
      <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
        <View style={[styles.container, isDark ? styles.darkContainer : styles.lightContainer]}>
          <View style={styles.lockContent}>
            <Text style={[styles.headerText, isDark ? styles.textDark : styles.textLight]}>
              Your Khata
            </Text>
            
            <View style={[styles.pinContainer, isDark ? styles.pinContainerDark : styles.pinContainerLight]}>
              <Text style={[styles.pinTitle, isDark ? styles.textDark : styles.textLight]}>
                Enter PIN
              </Text>
              
              <TextInput
                ref={inputRef}
                style={styles.hiddenInput}
                value={pinInput}
                onChangeText={handlePinInput}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                autoFocus={true}
                showSoftInputOnFocus={true}
              />
              
              <View style={styles.pinDotsContainer}>
                {[...Array(4)].map((_, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.pinDot, 
                      index < pinInput.length ? styles.pinDotFilled : null,
                      isDark ? styles.pinDotDark : styles.pinDotLight
                    ]} 
                  />
                ))}
              </View>
              
              <TouchableOpacity 
                style={styles.keyboardButton} 
                onPress={() => inputRef.current?.focus()}
              >
                <Text style={[styles.keyboardButtonText, isDark ? styles.textDark : styles.textLight]}>
                  {keyboardVisible.current ? 'Keyboard visible' : 'Tap to show keyboard'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {isBiometricEnabled && biometricSupported && (
              <TouchableOpacity 
                style={styles.biometricButton} 
                onPress={retryBiometric}
              >
                <Ionicons 
                  name="finger-print" 
                  size={28} 
                  color="#4CAF50" 
                  style={styles.biometricIcon} 
                />
                <Text style={styles.biometricButtonText}>
                  Use Fingerprint
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  lightContainer: {
    backgroundColor: '#F5F5F5',
  },
  textDark: {
    color: '#FFFFFF',
  },
  textLight: {
    color: '#121212',
  },
  lockContent: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 48,
    textAlign: 'center',
  },
  pinContainer: {
    width: '100%',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  pinContainerDark: {
    backgroundColor: '#1E1E1E',
  },
  pinContainerLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  pinTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
  },
  hiddenInput: {
    height: 50,
    width: '100%',
    opacity: 0,
    position: 'absolute',
    zIndex: 1,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 10,
    borderWidth: 1,
  },
  pinDotDark: {
    borderColor: '#FFFFFF',
  },
  pinDotLight: {
    borderColor: '#121212',
  },
  pinDotFilled: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  keyboardButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
  },
  keyboardButtonText: {
    fontSize: 14,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
  },
  biometricIcon: {
    marginRight: 8,
  },
  biometricButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
  },
}); 