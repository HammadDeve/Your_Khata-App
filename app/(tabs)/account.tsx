import { useTheme } from '@/context/ThemeProvider';
import StorageUtils, { UserProfile } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Keyboard,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type RootStackParamList = {
  'privacy-policy': undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// PIN Input Component props interface
interface PinInputModalProps {
  visible: boolean;
  onCancel: () => void;
  onComplete: (pin: string) => void;
  isConfirmation?: boolean;
  confirmValue?: string;
  title?: string;
}

// PIN Input Component
const PinInputModal = ({ visible, onCancel, onComplete, isConfirmation = false, confirmValue = '', title = "Enter PIN" }: PinInputModalProps) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { isDark } = useTheme();
  const inputRef = React.useRef<TextInput>(null);
  
  // Focus input when modal becomes visible
  useEffect(() => {
    if (visible) {
      setPin('');
      setError('');
      
      // Add a small delay to ensure modal is fully visible before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [visible]);
  
  const handlePinChange = (value: string) => {
    if (value.length <= 4) {
      setPin(value);
      setError('');
      
      // If user has entered 4 digits
      if (value.length === 4) {
        if (isConfirmation) {
          if (value !== confirmValue) {
            setError('PINs do not match. Try again.');
            setTimeout(() => {
              setPin('');
              inputRef.current?.focus();
            }, 200);
          } else {
            onComplete(value);
          }
        } else {
          onComplete(value);
        }
      }
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onShow={() => {
        // Focus input when modal is shown
        setTimeout(() => inputRef.current?.focus(), 300);
      }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <View style={[styles.pinModalContainer, isDark ? styles.cardDark : styles.cardLight]}>
            <Text style={[styles.pinModalTitle, isDark ? styles.textDark : styles.textLight]}>
              {title}
            </Text>
            
            {error ? <Text style={styles.pinErrorText}>{error}</Text> : null}
            
            <TextInput
              ref={inputRef}
              style={[styles.visiblePinInput, isDark ? styles.visiblePinInputDark : styles.visiblePinInputLight]}
              value={pin}
              onChangeText={handlePinChange}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              autoFocus={true}
              placeholder="Enter 4-digit PIN"
              placeholderTextColor={isDark ? '#888888' : '#AAAAAA'}
            />
            
            <View style={styles.pinDotsContainer}>
              {[...Array(4)].map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.pinDot, 
                    index < pin.length ? styles.pinDotFilled : null,
                    isDark ? styles.pinDotDark : styles.pinDotLight
                  ]} 
                />
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.cancelPinButton} 
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default function AccountScreen() {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const { isDark, toggleTheme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [editingProfile, setEditingProfile] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [hasBiometricHardware, setHasBiometricHardware] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  const [autoLockTimeout, setAutoLockTimeout] = useState(0); // 0 means disabled
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalMode, setPinModalMode] = useState('set'); // 'set', 'verify', 'change'
  const [tempPin, setTempPin] = useState('');
  const [timeoutModalVisible, setTimeoutModalVisible] = useState(false);
  const [resetConfirmVisible, setResetConfirmVisible] = useState(false);
  
  const timeoutOptions = [
    { label: 'Disabled', value: 0 },
    { label: 'Immediately', value: 1 },
    { label: 'After 1 minute', value: 60 },
    { label: 'After 5 minutes', value: 300 },
    { label: 'After 15 minutes', value: 900 },
    { label: 'After 30 minutes', value: 1800 },
    { label: 'After 1 hour', value: 3600 },
  ];

  // Load user data when component mounts
  useEffect(() => {
    loadUserData();
    checkSecuritySettings();
    checkBiometricSupport();
  }, []);

  // Check if biometric authentication is supported
  const checkBiometricSupport = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      setHasBiometricHardware(hasHardware);
      
      if (hasHardware) {
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricEnrolled(isEnrolled);
      }
    } catch (error) {
      console.error('Error checking biometric support:', error);
    }
  };
  
  // Load security settings
  const checkSecuritySettings = async () => {
    try {
      const pinStatus = await AsyncStorage.getItem('pin_enabled');
      setPinEnabled(pinStatus === 'true');
      
      const bioStatus = await AsyncStorage.getItem('biometric_enabled');
      setBiometricEnabled(bioStatus === 'true');
      
      const timeout = await AsyncStorage.getItem('auto_lock_timeout');
      setAutoLockTimeout(timeout ? parseInt(timeout) : 0);
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  };

  // Load user data from AsyncStorage
  const loadUserData = async () => {
    try {
      const userProfile = await StorageUtils.getUserProfile();
      
      if (userProfile) {
        setName(userProfile.name || '');
        setPhoneNumber(userProfile.phoneNumber || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Save user data to AsyncStorage
  const saveUserData = async () => {
    try {
      // Validate phone number
      if (phoneNumber && (phoneNumber.length < 10 || !/^\d+$/.test(phoneNumber))) {
        Alert.alert('Invalid Phone Number', 'Please enter a valid phone number.');
        return;
      }

      const userProfile: UserProfile = {
        id: 'user_profile',
        name,
        phoneNumber,
      };

      await StorageUtils.saveUserProfile(userProfile);
      
      // Also save to userData for the home screen
      await AsyncStorage.setItem('userData', JSON.stringify({
        name,
        phoneNumber,
      }));
      
      setEditingProfile(false);
      Alert.alert('Success', 'Profile information saved successfully.');
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Failed to save profile information.');
    }
  };
  
  // Toggle PIN security
  const handleTogglePin = () => {
    if (pinEnabled) {
      // Verify PIN before disabling
      setPinModalMode('verify');
      setShowPinModal(true);
    } else {
      // Set a new PIN
      setPinModalMode('set');
      setShowPinModal(true);
    }
  };
  
  // Toggle biometric authentication
  const handleToggleBiometric = async () => {
    if (!hasBiometricHardware) {
      Alert.alert('Not Supported', 'Your device does not support biometric authentication.');
      return;
    }
    
    if (!biometricEnrolled) {
      Alert.alert('Not Set Up', 'Please set up fingerprint or face recognition in your device settings first.');
      return;
    }
    
    if (!pinEnabled) {
      Alert.alert(
        'PIN Required', 
        'You must set up a PIN before enabling biometric authentication.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Set PIN Now', 
            onPress: () => {
              // Start PIN setup flow
              setPinModalMode('set');
              setShowPinModal(true);
            }
          }
        ]
      );
      return;
    }
    
    try {
      // If enabling biometrics, test authentication first
      if (!biometricEnabled) {
        try {
          // Directly trigger the fingerprint scanner
          const auth = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Verify your fingerprint',
            fallbackLabel: 'Use PIN instead',
            disableDeviceFallback: false,
            cancelLabel: 'Cancel',
          });
          
          if (!auth.success) {
            if (auth.error === 'user_cancel') {
              Alert.alert('Cancelled', 'Biometric authentication was cancelled.');
            } else {
              Alert.alert('Authentication Failed', 'Could not verify biometrics. Please try again.');
            }
            return;
          }
          
          // If authentication succeeds, show success message
          Alert.alert('Success', 'Fingerprint verified successfully!');
        } catch (error) {
          console.error('Error testing biometric:', error);
          Alert.alert('Error', 'Could not verify biometrics. Please try again.');
          return;
        }
      }
      
      // Update biometric setting
      const newStatus = !biometricEnabled;
      await AsyncStorage.setItem('biometric_enabled', newStatus.toString());
      setBiometricEnabled(newStatus);
      
      Alert.alert(
        'Success', 
        newStatus 
          ? 'Biometric authentication has been enabled.' 
          : 'Biometric authentication has been disabled.'
      );
    } catch (error) {
      console.error('Error toggling biometric:', error);
      Alert.alert('Error', 'Failed to update biometric settings.');
    }
  };
  
  // Handle PIN operations
  const handlePinComplete = async (pin: string) => {
    try {
      if (pinModalMode === 'set') {
        // Store temp PIN and ask for confirmation
        setTempPin(pin);
        setPinModalMode('confirm');
        setShowPinModal(false);
        setTimeout(() => setShowPinModal(true), 300);
      } else if (pinModalMode === 'confirm') {
        // Save the confirmed PIN
        await AsyncStorage.setItem('app_pin', pin);
        await AsyncStorage.setItem('pin_enabled', 'true');
        setPinEnabled(true);
        setShowPinModal(false);
        Alert.alert('Success', 'PIN has been set successfully.');
      } else if (pinModalMode === 'verify') {
        // Verify PIN matches the stored one
        const storedPin = await AsyncStorage.getItem('app_pin');
        if (pin === storedPin) {
          // If verifying to disable PIN
          await AsyncStorage.setItem('pin_enabled', 'false');
          setPinEnabled(false);
          setShowPinModal(false);
          
          // Also disable biometric if it was enabled
          if (biometricEnabled) {
            await AsyncStorage.setItem('biometric_enabled', 'false');
            setBiometricEnabled(false);
          }
          
          Alert.alert('Success', 'PIN protection has been disabled.');
        } else {
          Alert.alert('Incorrect PIN', 'The PIN you entered is incorrect. Please try again.');
          // Reset pin input and let them try again
          setShowPinModal(false);
          setTimeout(() => {
            setPinModalMode('verify');
            setShowPinModal(true);
          }, 500);
        }
      } else if (pinModalMode === 'change') {
        // Verify current PIN before changing
        const storedPin = await AsyncStorage.getItem('app_pin');
        if (pin === storedPin) {
          // Move to setting a new PIN
          setTempPin('');
          setPinModalMode('set');
          setShowPinModal(false);
          setTimeout(() => setShowPinModal(true), 300);
        } else {
          Alert.alert('Incorrect PIN', 'The PIN you entered is incorrect. Please try again.');
          // Reset pin input and let them try again
          setShowPinModal(false);
          setTimeout(() => {
            setPinModalMode('change');
            setShowPinModal(true);
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error handling PIN operation:', error);
      Alert.alert('Error', 'Failed to complete PIN operation.');
    }
  };
  
  // Reset PIN (for when user forgets PIN)
  const handleResetPin = async () => {
    try {
      // Remove PIN and settings
      await AsyncStorage.removeItem('app_pin');
      await AsyncStorage.setItem('pin_enabled', 'false');
      setPinEnabled(false);
      
      // Disable biometric if it was enabled
      if (biometricEnabled) {
        await AsyncStorage.setItem('biometric_enabled', 'false');
        setBiometricEnabled(false);
      }
      
      setResetConfirmVisible(false);
      Alert.alert('PIN Reset', 'Your PIN has been reset. You can now set a new PIN.');
    } catch (error) {
      console.error('Error resetting PIN:', error);
      Alert.alert('Error', 'Failed to reset PIN.');
    }
  };
  
  // Change PIN
  const handleChangePin = () => {
    if (!pinEnabled) {
      Alert.alert('No PIN Set', 'You need to enable PIN protection first.');
      return;
    }
    
    setPinModalMode('change');
    setShowPinModal(true);
  };
  
  // Set auto-lock timeout
  const handleSetTimeout = (value: number) => {
    setAutoLockTimeout(value);
    setTimeoutModalVisible(false);
    
    // Save the timeout setting
    AsyncStorage.setItem('auto_lock_timeout', value.toString())
      .catch(error => console.error('Error saving timeout setting:', error));
  };

  return (
    <SafeAreaView style={[styles.container, isDark ? styles.darkContainer : styles.lightContainer]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, isDark ? styles.textDark : styles.textLight]}>Settings</Text>
        </View>

        {/* Profile Information */}
        <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
          <View style={styles.profileSection}>
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={40} color={isDark ? '#FFFFFF' : '#121212'} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileLabel, isDark ? styles.textDark : styles.textLight]}>Profile Information</Text>
              {!editingProfile && (
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={() => setEditingProfile(true)}
                >
                  <Ionicons name="pencil" size={16} color={isDark ? '#FFFFFF' : '#121212'} />
                  <Text style={[styles.editButtonText, isDark ? styles.textDark : styles.textLight]}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {!editingProfile ? (
            // Display Mode
            <View style={styles.profileDisplayContainer}>
              <View style={styles.profileDataRow}>
                <Text style={[styles.profileDataLabel, isDark ? styles.textSubtitleDark : styles.textSubtitleLight]}>Name:</Text>
                <Text style={[styles.profileDataValue, isDark ? styles.textDark : styles.textLight]}>
                  {name || 'Not set'}
                </Text>
              </View>
              <View style={styles.profileDataRow}>
                <Text style={[styles.profileDataLabel, isDark ? styles.textSubtitleDark : styles.textSubtitleLight]}>Phone:</Text>
                <Text style={[styles.profileDataValue, isDark ? styles.textDark : styles.textLight]}>
                  {phoneNumber || 'Not set'}
                </Text>
              </View>
            </View>
          ) : (
            // Edit Mode
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDark ? styles.textDark : styles.textLight]}>Name</Text>
                <TextInput
                  style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                  placeholder="Enter your name"
                  placeholderTextColor={isDark ? '#888888' : '#AAAAAA'}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDark ? styles.textDark : styles.textLight]}>Phone Number</Text>
                <TextInput
                  style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                  placeholder="Enter your phone number"
                  placeholderTextColor={isDark ? '#888888' : '#AAAAAA'}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={styles.cancelProfileButton} 
                  onPress={() => {
                    setEditingProfile(false);
                    loadUserData(); // Reload original data
                  }}
                >
                  <Text style={styles.cancelProfileButtonText}>CANCEL</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={saveUserData}
                >
                  <Text style={styles.saveButtonText}>SAVE</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Security Settings */}
        <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
          <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight]}>Security</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, isDark ? styles.textDark : styles.textLight]}>
                PIN Protection
              </Text>
              <Text style={[styles.settingDescription, isDark ? styles.textSubtitleDark : styles.textSubtitleLight]}>
                {pinEnabled ? 'PIN is enabled' : 'Require PIN to access the app'}
              </Text>
            </View>
            <Switch
              value={pinEnabled}
              onValueChange={handleTogglePin}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={'#f4f3f4'}
            />
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.settingButton, !pinEnabled && styles.disabledButton]} 
              onPress={handleChangePin}
              disabled={!pinEnabled}
            >
              <Ionicons name="keypad" size={18} color={!pinEnabled ? "#CCC" : "#FFFFFF"} style={{ marginRight: 8 }} />
              <Text style={[styles.settingButtonText, !pinEnabled && styles.disabledButtonText]}>
                Change PIN
              </Text>
            </TouchableOpacity>
          </View>
          
          {pinEnabled && (
            <TouchableOpacity 
              style={styles.forgotPinButton} 
              onPress={() => setResetConfirmVisible(true)}
            >
              <Text style={styles.forgotPinText}>Forgot PIN?</Text>
            </TouchableOpacity>
          )}
          
          <View style={[styles.settingItem, { marginTop: 16 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, isDark ? styles.textDark : styles.textLight]}>
                Fingerprint Authentication
              </Text>
              <Text style={[styles.settingDescription, isDark ? styles.textSubtitleDark : styles.textSubtitleLight]}>
                {hasBiometricHardware 
                  ? biometricEnrolled 
                    ? biometricEnabled 
                      ? 'Fingerprint is enabled' 
                      : 'Use fingerprint to unlock app'
                    : 'Set up fingerprint in device settings first' 
                  : 'Not supported on this device'}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometric}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={'#f4f3f4'}
              disabled={!hasBiometricHardware || !biometricEnrolled || !pinEnabled}
            />
          </View>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => setTimeoutModalVisible(true)}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, isDark ? styles.textDark : styles.textLight]}>
                Auto-Lock
              </Text>
              <Text style={[styles.settingDescription, isDark ? styles.textSubtitleDark : styles.textSubtitleLight]}>
                {autoLockTimeout === 0 
                  ? 'Disabled' 
                  : autoLockTimeout === 1 
                    ? 'Immediately when closed' 
                    : `After ${autoLockTimeout >= 3600 
                        ? `${autoLockTimeout / 3600} hour` 
                        : `${autoLockTimeout / 60} minutes`}`}
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={isDark ? '#FFFFFF' : '#121212'} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Appearance Settings */}
        <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
          <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight]}>Appearance</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, isDark ? styles.textDark : styles.textLight]}>
                Dark Mode
              </Text>
              <Text style={[styles.settingDescription, isDark ? styles.textSubtitleDark : styles.textSubtitleLight]}>
                Toggle between light and dark theme
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={'#f4f3f4'}
            />
          </View>
        </View>
        
        {/* About */}
        <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
          <View style={styles.aboutSection}>
            <Text style={[styles.aboutTitle, isDark ? styles.textDark : styles.textLight]}>About</Text>
            <Text style={[styles.aboutText, isDark ? styles.textSubtitleDark : styles.textSubtitleLight]}>
              Your Khata App v1.0.0
            </Text>
            <Text style={[styles.aboutText, isDark ? styles.textSubtitleDark : styles.textSubtitleLight]}>
              A simple app to track money borrowed and lent
            </Text>
            
            <TouchableOpacity 
              style={styles.privacyButton}
              onPress={() => navigation.navigate('privacy-policy')}
            >
              <Ionicons 
                name="shield-checkmark-outline" 
                size={20} 
                color="#4CAF50" 
                style={styles.privacyButtonIcon}
              />
              <Text style={styles.privacyButtonText}>Privacy Policy</Text>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={isDark ? '#FFFFFF' : '#121212'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      {/* PIN Modal */}
      <PinInputModal
        visible={showPinModal}
        onCancel={() => setShowPinModal(false)}
        onComplete={handlePinComplete}
        isConfirmation={pinModalMode === 'confirm'}
        confirmValue={tempPin}
        title={
          pinModalMode === 'set' 
            ? 'Set PIN' 
            : pinModalMode === 'confirm'
            ? 'Confirm PIN'
            : pinModalMode === 'change'
            ? 'Enter Current PIN'
            : 'Enter PIN'
        }
      />
      
      {/* Timeout Selection Modal */}
      <Modal
        visible={timeoutModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTimeoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.timeoutModalContainer, isDark ? styles.cardDark : styles.cardLight]}>
            <Text style={[styles.timeoutModalTitle, isDark ? styles.textDark : styles.textLight]}>
              Select Auto-Lock Timeout
            </Text>
            
            <FlatList
              data={timeoutOptions}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.timeoutOption, 
                    autoLockTimeout === item.value && styles.selectedTimeoutOption
                  ]}
                  onPress={() => handleSetTimeout(item.value)}
                >
                  <Text style={[
                    styles.timeoutOptionText, 
                    isDark ? styles.textDark : styles.textLight,
                    autoLockTimeout === item.value && styles.selectedTimeoutText
                  ]}>
                    {item.label}
                  </Text>
                  {autoLockTimeout === item.value && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              )}
            />
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setTimeoutModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Reset PIN Confirmation Modal */}
      <Modal
        visible={resetConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setResetConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmModalContainer, isDark ? styles.cardDark : styles.cardLight]}>
            <Text style={[styles.confirmModalTitle, isDark ? styles.textDark : styles.textLight]}>
              Reset PIN?
            </Text>
            
            <Text style={[styles.confirmModalText, isDark ? styles.textSubtitleDark : styles.textSubtitleLight]}>
              This will remove your current PIN and disable PIN protection. You'll need to set up a new PIN afterwards.
            </Text>
            
            <View style={styles.confirmButtonRow}>
              <TouchableOpacity 
                style={styles.cancelConfirmButton} 
                onPress={() => setResetConfirmVisible(false)}
              >
                <Text style={styles.cancelConfirmButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={handleResetPin}
              >
                <Text style={styles.confirmButtonText}>Reset PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  lightContainer: {
    backgroundColor: '#F5F5F5',
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  textDark: {
    color: '#FFFFFF',
  },
  textLight: {
    color: '#121212',
  },
  textSubtitleDark: {
    color: '#AAAAAA',
  },
  textSubtitleLight: {
    color: '#777777',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardDark: {
    backgroundColor: '#1E1E1E',
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  editButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  profileDisplayContainer: {
    marginBottom: 8,
  },
  profileDataRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  profileDataLabel: {
    width: 80,
    fontSize: 15,
    fontWeight: '500',
  },
  profileDataValue: {
    flex: 1,
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  cancelProfileButton: {
    flex: 1,
    backgroundColor: '#666',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  inputDark: {
    backgroundColor: '#2A2A2A',
    color: '#FFFFFF',
    borderColor: '#3A3A3A',
    borderWidth: 1,
  },
  inputLight: {
    backgroundColor: '#F5F5F5',
    color: '#121212',
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  settingButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  settingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#555',
    opacity: 0.5,
  },
  disabledButtonText: {
    color: '#CCC',
  },
  dangerButton: {
    backgroundColor: '#E53935',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  aboutSection: {
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinModalContainer: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  pinModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  pinInput: {
    position: 'absolute',
    width: '100%',
    height: 50,
    opacity: 0,
    zIndex: 10,
  },
  pinInputContainer: {
    width: '80%',
    marginVertical: 10,
  },
  visiblePinInput: {
    height: 50,
    borderRadius: 8,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 8,
    paddingHorizontal: 12,
    width: '80%',
    alignSelf: 'center',
    marginVertical: 15,
  },
  visiblePinInputDark: {
    backgroundColor: '#2A2A2A',
    color: '#FFFFFF',
    borderColor: '#3A3A3A',
    borderWidth: 1,
  },
  visiblePinInputLight: {
    backgroundColor: '#F5F5F5',
    color: '#121212',
    borderColor: '#E0E0E0',
    borderWidth: 1,
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
  pinErrorText: {
    color: '#E53935',
    marginVertical: 8,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
  },
  cancelButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelPinButton: {
    marginTop: 16,
    backgroundColor: '#666',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  timeoutModalContainer: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    maxHeight: '70%',
  },
  timeoutModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  timeoutOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  selectedTimeoutOption: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  timeoutOptionText: {
    fontSize: 16,
  },
  selectedTimeoutText: {
    fontWeight: 'bold',
  },
  keyboardButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
  },
  keyboardButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  fingerprintTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
  },
  fingerprintTestText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
  },
  numericKeypad: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  keypadButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  keypadButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  forgotPinButton: {
    alignSelf: 'center',
    marginTop: 8,
    padding: 8,
  },
  forgotPinText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  confirmModalContainer: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmModalText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelConfirmButton: {
    flex: 1,
    backgroundColor: '#666',
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelConfirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#E53935',
    borderRadius: 8,
    paddingVertical: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
  },
  privacyButtonIcon: {
    marginRight: 12,
  },
  privacyButtonText: {
    flex: 1,
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
  },
}); 