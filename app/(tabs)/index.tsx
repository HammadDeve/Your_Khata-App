import { useIsDark } from '@/hooks/useColorScheme';
import StorageUtils, { Customer, Profile } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Format currency values
const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toLocaleString()}`;
};

export default function HomeScreen() {
  const isDark = useIsDark();
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('YOUR KHATA');
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDescription, setNewProfileDescription] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [requireAuth, setRequireAuth] = useState(false);
  
  const nameInputRef = useRef<TextInput>(null);
  
  // Load customers and user data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
      checkAuthStatus();
    }, [])
  );
  
  // Check auth settings
  const checkAuthStatus = async () => {
    try {
      const authRequired = await AsyncStorage.getItem('requireAuthentication');
      setRequireAuth(authRequired === 'true');
      
      if (authRequired === 'true') {
        setIsLocked(true);
        authenticateUser();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  };
  
  // Authenticate user with biometrics
  const authenticateUser = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      
      if (!hasHardware) {
        Alert.alert('Authentication', 'Your device does not support biometric authentication.');
        setIsLocked(false);
        return;
      }
      
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!isEnrolled) {
        Alert.alert('Authentication', 'No biometrics found. Please set up fingerprint or face recognition on your device.');
        setIsLocked(false);
        return;
      }
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your data',
        fallbackLabel: 'Enter passcode',
      });
      
      if (result.success) {
        setIsLocked(false);
      }
    } catch (error) {
      console.error('Error during authentication:', error);
      Alert.alert('Authentication Error', 'There was an error during authentication. Please try again.');
    }
  };
  
  // Toggle authentication requirement
  const toggleAuthRequirement = async () => {
    try {
      const newValue = !requireAuth;
      await AsyncStorage.setItem('requireAuthentication', newValue.toString());
      setRequireAuth(newValue);
      
      Alert.alert(
        'Authentication Setting',
        newValue 
          ? 'Authentication will be required when you open the app.' 
          : 'Authentication requirement has been disabled.'
      );
    } catch (error) {
      console.error('Error toggling auth requirement:', error);
    }
  };
  
  // Load all required data
  const loadData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else if (!refreshing) {
        setLoading(true);
      }
      
      // Initialize default profile if none exists
      await StorageUtils.initializeDefaultProfile();
      
      // Load all profiles
      const allProfiles = await StorageUtils.getProfiles();
      setProfiles(allProfiles);
      
      // Get active profile
      const profile = await StorageUtils.getActiveProfile();
      setActiveProfile(profile);
      
      // Load customers only from active profile
      if (profile) {
        const profileCustomers = await StorageUtils.getProfileCustomers(profile.id);
        setCustomers(profileCustomers);
      } else {
        setCustomers([]);
      }
      
      // Load user data
      await loadUserData();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Load user data from storage
  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      
      if (userData) {
        const parsedData = JSON.parse(userData);
        setUserName(parsedData.name || 'YOUR KHATA');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };
  
  // Handle pull to refresh
  const onRefresh = () => {
    loadData(true);
  };
  
  // Toggle profile dropdown visibility
  const toggleDropdown = () => {
    if (isLocked) {
      authenticateUser();
      return;
    }
    setIsDropdownVisible(!isDropdownVisible);
  };
  
  // Set a profile as active
  const handleSetActiveProfile = async (profile: Profile) => {
    try {
      await StorageUtils.setActiveProfile(profile);
      setActiveProfile(profile);
      setIsDropdownVisible(false);
      await loadData();
    } catch (error) {
      console.error('Error setting active profile:', error);
      Alert.alert('Error', 'Failed to activate profile. Please try again.');
    }
  };
  
  // Add a new profile
  const handleAddProfile = async () => {
    if (!newProfileName.trim()) {
      Alert.alert('Error', 'Please enter a profile name.');
      return;
    }

    try {
      const newProfile = await StorageUtils.addProfile({
        name: newProfileName.trim(),
        description: newProfileDescription.trim() || undefined,
      });

      // If this is the first profile, set it as active
      if (profiles.length === 0) {
        await StorageUtils.setActiveProfile(newProfile);
        setActiveProfile(newProfile);
      }

      // Refresh data
      await loadData();
      
      // Reset form and close modal
      setNewProfileName('');
      setNewProfileDescription('');
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error adding profile:', error);
      Alert.alert('Error', 'Failed to add profile. Please try again.');
    }
  };
  
  // Delete a profile
  const handleDeleteProfile = (profile: Profile) => {
    // Don't allow deleting the active profile
    if (activeProfile && profile.id === activeProfile.id) {
      Alert.alert(
        'Cannot Delete',
        'You cannot delete the active profile. Please activate another profile first.'
      );
      return;
    }

    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete "${profile.name}"? This will delete all customers and transactions associated with this profile.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageUtils.deleteProfile(profile.id);
              await loadData();
            } catch (error) {
              console.error('Error deleting profile:', error);
              Alert.alert('Error', 'Failed to delete profile. Please try again.');
            }
          },
        },
      ]
    );
  };
  
  // Calculate totals
  const totalToReceive = customers
    .filter(customer => customer.toReceive)
    .reduce((total, customer) => total + customer.amount, 0);
    
  const totalToGive = customers
    .filter(customer => !customer.toReceive)
    .reduce((total, customer) => total + customer.amount, 0);
  
  // Filter customers based on search query
  const filteredCustomers = searchQuery 
    ? customers.filter(customer => 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phoneNumber.includes(searchQuery)
      )
    : customers;

  const handleCustomerPress = (customerId: string) => {
    router.push({
      pathname: "/customer/[id]",
      params: { id: customerId }
    });
  };

  const handleAddCustomer = () => {
    router.push('/add-customer');
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity 
      style={styles.customerItem}
      onPress={() => handleCustomerPress(item.id)}
    >
      <View style={styles.customerLeft}>
        <View style={styles.customerInitials}>
          <Text style={styles.initialsText}>{item.initials}</Text>
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          <Text style={styles.customerPhone}>{item.phoneNumber}</Text>
        </View>
      </View>
      <Text style={[
        styles.customerAmount,
        item.toReceive ? styles.amountReceive : styles.amountGive
      ]}>
        {formatCurrency(item.amount)}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyList = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#AAAAAA" />
          <Text style={styles.emptyText}>Loading customers...</Text>
        </View>
      );
    }
    
    if (searchQuery) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color="#AAAAAA" />
          <Text style={styles.emptyText}>No matching customers found</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={48} color="#AAAAAA" />
        <Text style={styles.emptyText}>No customers yet</Text>
        <Text style={styles.emptySubtext}>
          Add your first customer by tapping the button below
        </Text>
      </View>
    );
  };

  if (isLocked) {
    return (
      <SafeAreaView style={[styles.container, isDark ? styles.darkContainer : styles.lightContainer]}>
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={64} color={isDark ? '#FFFFFF' : '#333333'} />
          <Text style={[styles.lockedText, isDark ? styles.darkText : styles.lightText]}>
            App is locked
          </Text>
          <TouchableOpacity 
            style={styles.unlockButton}
            onPress={authenticateUser}
          >
            <Text style={styles.unlockButtonText}>Unlock</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark ? styles.darkContainer : styles.lightContainer]}>
      <View style={[styles.header, isDark ? styles.darkHeader : styles.lightHeader]}>
        <TouchableOpacity style={styles.headerLeft} onPress={toggleDropdown}>
          <Text style={[styles.headerTitle, isDark ? styles.darkText : styles.lightText]}>
            {activeProfile ? activeProfile.name : 'Select Profile'}
          </Text>
          <Ionicons 
            name={isDropdownVisible ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={isDark ? '#FFFFFF' : '#333333'} 
          />
        </TouchableOpacity>
      </View>

      {/* Profile Dropdown */}
      {isDropdownVisible && (
        <View style={[styles.dropdown, isDark ? styles.darkCard : styles.lightCard]}>
          <FlatList
            data={profiles}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isActive = activeProfile && item.id === activeProfile.id;
              return (
                <TouchableOpacity
                  style={[styles.dropdownItem, isActive && styles.activeDropdownItem]}
                  onPress={() => handleSetActiveProfile(item)}
                >
                  <View style={styles.profileInfo}>
                    <Text style={[styles.profileName, isDark ? styles.darkText : styles.lightText]}>
                      {item.name}
                    </Text>
                    {item.description && (
                      <Text style={[styles.profileDescription, isDark ? styles.darkSubtext : styles.lightSubtext]}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                  <View style={styles.profileActions}>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={styles.activeIcon} />
                    )}
                    {!isActive && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteProfile(item)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#E94057" />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.addProfileButton}
                onPress={() => {
                  setIsModalVisible(true);
                  setIsDropdownVisible(false);
                  setTimeout(() => nameInputRef.current?.focus(), 100);
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color={isDark ? '#FFFFFF' : '#333333'} />
                <Text style={[styles.addProfileText, isDark ? styles.darkText : styles.lightText]}>
                  Add New Profile
                </Text>
              </TouchableOpacity>
            }
          />
        </View>
      )}

      {/* Summary Card */}
      <View style={[styles.summaryCard, isDark ? styles.darkCard : styles.lightCard]}>
        <View style={styles.summaryItem}>
          <Ionicons name="arrow-down-circle" size={24} color="#E94057" style={styles.summaryIcon} />
          <View>
            <Text style={[styles.summaryAmount, styles.amountReceive]}>{formatCurrency(totalToReceive)}</Text>
            <Text style={[styles.summaryLabel, isDark ? styles.darkSubtext : styles.lightSubtext]}>Maine lene hain</Text>
          </View>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="arrow-up-circle" size={24} color="#4CAF50" style={styles.summaryIcon} />
          <View>
            <Text style={[styles.summaryAmount, styles.amountGive]}>{formatCurrency(totalToGive)}</Text>
            <Text style={[styles.summaryLabel, isDark ? styles.darkSubtext : styles.lightSubtext]}>Maine dene hain</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, isDark ? styles.darkCard : styles.lightCard]}>
        <Ionicons name="search" size={20} color={isDark ? '#AAAAAA' : '#777777'} />
        <TextInput
          style={[styles.searchInput, isDark ? styles.darkText : styles.lightText]}
          placeholder="Search Customer"
          placeholderTextColor={isDark ? '#AAAAAA' : '#999999'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Customer List */}
      <TouchableWithoutFeedback onPress={() => setIsDropdownVisible(false)}>
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomerItem}
          keyExtractor={item => item.id}
          style={styles.customerList}
          contentContainerStyle={filteredCustomers.length === 0 ? styles.fullHeight : undefined}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[isDark ? '#AAAAAA' : '#666666']}
              tintColor={isDark ? '#AAAAAA' : '#666666'}
            />
          }
        />
      </TouchableWithoutFeedback>

      {/* Add Customer Button */}
      <TouchableOpacity 
        style={[styles.addButton, !activeProfile && styles.disabledButton]}
        onPress={activeProfile ? handleAddCustomer : toggleDropdown}
        disabled={!activeProfile}
      >
        <Ionicons name={activeProfile ? "add" : "person"} size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDark ? styles.darkCard : styles.lightCard]}>
            <Text style={[styles.modalTitle, isDark ? styles.darkText : styles.lightText]}>
              Create New Profile
            </Text>

            <Text style={[styles.inputLabel, isDark ? styles.darkSubtext : styles.lightSubtext]}>
              Profile Name
            </Text>
            <TextInput
              ref={nameInputRef}
              style={[
                styles.input, 
                isDark ? styles.darkInput : styles.lightInput,
                isDark ? styles.darkText : styles.lightText
              ]}
              value={newProfileName}
              onChangeText={setNewProfileName}
              placeholder="Enter profile name"
              placeholderTextColor={isDark ? '#999999' : '#AAAAAA'}
            />

            <Text style={[styles.inputLabel, isDark ? styles.darkSubtext : styles.lightSubtext]}>
              Description (Optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.multilineInput,
                isDark ? styles.darkInput : styles.lightInput,
                isDark ? styles.darkText : styles.lightText
              ]}
              value={newProfileDescription}
              onChangeText={setNewProfileDescription}
              placeholder="Enter description"
              placeholderTextColor={isDark ? '#999999' : '#AAAAAA'}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNewProfileName('');
                  setNewProfileDescription('');
                  setIsModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleAddProfile}
              >
                <Text style={styles.createButtonText}>Create</Text>
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
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  lightContainer: {
    backgroundColor: '#F5F5F5',
  },
  darkText: {
    color: '#FFFFFF',
  },
  lightText: {
    color: '#121212',
  },
  darkSubtext: {
    color: '#AAAAAA',
  },
  lightSubtext: {
    color: '#777777',
  },
  darkCard: {
    backgroundColor: '#1E1E1E',
  },
  lightCard: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkHeader: {
    borderBottomColor: '#2A2A2A',
  },
  lightHeader: {
    borderBottomColor: '#EEEEEE',
  },
  darkButton: {
    backgroundColor: '#000000',
  },
  lightButton: {
    backgroundColor: '#333333',
  },
  darkInput: {
    backgroundColor: '#333333',
  },
  lightInput: {
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  dropdown: {
    position: 'absolute',
    top: 55,
    left: 16,
    right: 16,
    zIndex: 20,
    borderRadius: 8,
    overflow: 'hidden',
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  activeDropdownItem: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  addProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  addProfileText: {
    marginLeft: 8,
    fontSize: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    marginRight: 8,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E94057',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    marginLeft: 8,
    paddingVertical: 8,
    fontSize: 16,
  },
  customerList: {
    flex: 1,
  },
  fullHeight: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#AAAAAA',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  customerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  customerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerInfo: {
    flex: 1,
  },
  customerInitials: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  initialsText: {
    color: '#AAAAAA',
    fontWeight: 'bold',
    fontSize: 14,
  },
  customerName: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  customerPhone: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 2,
  },
  customerAmount: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  amountReceive: {
    color: '#E94057',
  },
  amountGive: {
    color: '#4CAF50',
  },
  addButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#E94057',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disabledButton: {
    backgroundColor: '#999999',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '85%',
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#333333',
    marginRight: 8,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockedText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  unlockButton: {
    marginTop: 24,
    backgroundColor: '#E94057',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeIcon: {
    marginLeft: 8,
  },
  deleteButton: {
    padding: 4,
  },
});
