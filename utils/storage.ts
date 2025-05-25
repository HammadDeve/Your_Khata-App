import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  CUSTOMERS: 'yourkhata_customers',
  TRANSACTIONS: 'yourkhata_transactions',
  USER_PROFILE: 'yourkhata_user_profile',
  BATWA_TRANSACTIONS: 'yourkhata_batwa_transactions',
  PROFILES: 'yourkhata_profiles',
  ACTIVE_PROFILE: 'yourkhata_active_profile',
};

// Customer type
export interface Customer {
  id: string;
  name: string;
  initials: string;
  phoneNumber: string;
  amount: number;
  toReceive: boolean;
  createdAt: number;
  profileId: string; // Associate customer with a profile
}

// Transaction type
export interface Transaction {
  id: string;
  customerId: string;
  amount: number;
  isReceived: boolean; // true if customer gave money (Maine Liye), false if we gave money (Maine Diye)
  date: number;
  notes?: string;
  balance: number;
  profileId: string; // Associate transaction with a profile
}

// Batwa Transaction type
export interface BatwaTransaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  timestamp: number;
  notes: string;
  profileId: string; // Associate batwa transaction with a profile
}

// User profile type
export interface UserProfile {
  id: string;
  name: string;
  phoneNumber?: string;
  profilePicture?: string;
}

// Profile type
export interface Profile {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
}

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Get initials from name
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

// Storage utilities
export const StorageUtils = {
  // ----- Profiles -----
  
  // Save all profiles
  saveProfiles: async (profiles: Profile[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    } catch (error) {
      console.error('Error saving profiles:', error);
    }
  },
  
  // Get all profiles
  getProfiles: async (): Promise<Profile[]> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PROFILES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting profiles:', error);
      return [];
    }
  },
  
  // Add a new profile
  addProfile: async (profile: Omit<Profile, 'id' | 'createdAt'>): Promise<Profile> => {
    try {
      const profiles = await StorageUtils.getProfiles();
      
      const newProfile: Profile = {
        ...profile,
        id: generateId(),
        createdAt: Date.now(),
      };
      
      const updatedProfiles = [...profiles, newProfile];
      await StorageUtils.saveProfiles(updatedProfiles);
      
      return newProfile;
    } catch (error) {
      console.error('Error adding profile:', error);
      throw error;
    }
  },
  
  // Update a profile
  updateProfile: async (profileId: string, updates: Partial<Profile>): Promise<Profile | null> => {
    try {
      const profiles = await StorageUtils.getProfiles();
      const profileIndex = profiles.findIndex(p => p.id === profileId);
      
      if (profileIndex === -1) {
        return null;
      }
      
      // Update the profile
      const updatedProfile = {
        ...profiles[profileIndex],
        ...updates,
      };
      
      profiles[profileIndex] = updatedProfile;
      await StorageUtils.saveProfiles(profiles);
      
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },
  
  // Delete a profile
  deleteProfile: async (profileId: string): Promise<boolean> => {
    try {
      const profiles = await StorageUtils.getProfiles();
      const updatedProfiles = profiles.filter(p => p.id !== profileId);
      
      if (updatedProfiles.length === profiles.length) {
        return false; // Profile not found
      }
      
      await StorageUtils.saveProfiles(updatedProfiles);
      
      // Also delete all customers, transactions, and batwa transactions for this profile
      const customers = await StorageUtils.getCustomers();
      const updatedCustomers = customers.filter(c => c.profileId !== profileId);
      await StorageUtils.saveCustomers(updatedCustomers);
      
      const transactions = await StorageUtils.getTransactions();
      const updatedTransactions = transactions.filter(t => t.profileId !== profileId);
      await StorageUtils.saveTransactions(updatedTransactions);
      
      const batwaTransactions = await StorageUtils.getBatwaTransactions();
      const updatedBatwaTransactions = batwaTransactions.filter(bt => bt.profileId !== profileId);
      await StorageUtils.saveBatwaTransactions(updatedBatwaTransactions);
      
      // If the active profile is the one being deleted, set active profile to null
      const activeProfile = await StorageUtils.getActiveProfile();
      if (activeProfile && activeProfile.id === profileId) {
        await StorageUtils.setActiveProfile(null);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  },
  
  // Get active profile
  getActiveProfile: async (): Promise<Profile | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting active profile:', error);
      return null;
    }
  },
  
  // Set active profile
  setActiveProfile: async (profile: Profile | null): Promise<void> => {
    try {
      if (profile) {
        await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, JSON.stringify(profile));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_PROFILE);
      }
    } catch (error) {
      console.error('Error setting active profile:', error);
    }
  },
  
  // ----- Customers -----
  
  // Save all customers
  saveCustomers: async (customers: Customer[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch (error) {
      console.error('Error saving customers:', error);
    }
  },
  
  // Get all customers
  getCustomers: async (): Promise<Customer[]> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting customers:', error);
      return [];
    }
  },
  
  // Get customers for the active profile
  getProfileCustomers: async (profileId?: string): Promise<Customer[]> => {
    try {
      const activeProfileId = profileId || (await StorageUtils.getActiveProfile())?.id;
      if (!activeProfileId) return [];
      
      const customers = await StorageUtils.getCustomers();
      return customers.filter(c => c.profileId === activeProfileId);
    } catch (error) {
      console.error('Error getting profile customers:', error);
      return [];
    }
  },
  
  // Add a new customer
  addCustomer: async (customer: Omit<Customer, 'id' | 'initials' | 'createdAt' | 'profileId'>): Promise<Customer> => {
    try {
      const customers = await StorageUtils.getCustomers();
      const activeProfile = await StorageUtils.getActiveProfile();
      
      if (!activeProfile) {
        throw new Error('No active profile found. Please create a profile first.');
      }
      
      const newCustomer: Customer = {
        ...customer,
        id: generateId(),
        initials: getInitials(customer.name),
        createdAt: Date.now(),
        profileId: activeProfile.id,
      };
      
      const updatedCustomers = [...customers, newCustomer];
      await StorageUtils.saveCustomers(updatedCustomers);
      
      return newCustomer;
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  },
  
  // Update a customer
  updateCustomer: async (customerId: string, updates: Partial<Customer>): Promise<Customer | null> => {
    try {
      const customers = await StorageUtils.getCustomers();
      const customerIndex = customers.findIndex(c => c.id === customerId);
      
      if (customerIndex === -1) {
        return null;
      }
      
      // Update the customer
      const updatedCustomer = {
        ...customers[customerIndex],
        ...updates,
        // Update initials if name is changed
        initials: updates.name ? getInitials(updates.name) : customers[customerIndex].initials,
      };
      
      customers[customerIndex] = updatedCustomer;
      await StorageUtils.saveCustomers(customers);
      
      return updatedCustomer;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },
  
  // Delete a customer
  deleteCustomer: async (customerId: string): Promise<boolean> => {
    try {
      const customers = await StorageUtils.getCustomers();
      const updatedCustomers = customers.filter(c => c.id !== customerId);
      
      if (updatedCustomers.length === customers.length) {
        return false; // Customer not found
      }
      
      await StorageUtils.saveCustomers(updatedCustomers);
      
      // Also delete all transactions for this customer
      const transactions = await StorageUtils.getTransactions();
      const updatedTransactions = transactions.filter(t => t.customerId !== customerId);
      await StorageUtils.saveTransactions(updatedTransactions);
      
      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },
  
  // ----- Transactions -----
  
  // Save all transactions
  saveTransactions: async (transactions: Transaction[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  },
  
  // Get all transactions
  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  },
  
  // Get transactions for a specific customer
  getCustomerTransactions: async (customerId: string): Promise<Transaction[]> => {
    try {
      const transactions = await StorageUtils.getTransactions();
      return transactions.filter(t => t.customerId === customerId);
    } catch (error) {
      console.error('Error getting customer transactions:', error);
      return [];
    }
  },
  
  // Get transactions for the active profile
  getProfileTransactions: async (profileId?: string): Promise<Transaction[]> => {
    try {
      const activeProfileId = profileId || (await StorageUtils.getActiveProfile())?.id;
      if (!activeProfileId) return [];
      
      const transactions = await StorageUtils.getTransactions();
      return transactions.filter(t => t.profileId === activeProfileId);
    } catch (error) {
      console.error('Error getting profile transactions:', error);
      return [];
    }
  },
  
  // Add a new transaction
  addTransaction: async (
    customerId: string,
    amount: number,
    isReceived: boolean,
    date: number = Date.now(),
    notes?: string
  ): Promise<Transaction | null> => {
    try {
      const transactions = await StorageUtils.getTransactions();
      const customerTransactions = transactions.filter(t => t.customerId === customerId);
      const activeProfile = await StorageUtils.getActiveProfile();
      
      if (!activeProfile) {
        throw new Error('No active profile found. Please create a profile first.');
      }
      
      // Get current balance from the latest transaction or start from 0
      let currentBalance = 0;
      if (customerTransactions.length > 0) {
        // Sort by date (newest first) and get the latest balance
        const sortedTransactions = [...customerTransactions].sort((a, b) => b.date - a.date);
        currentBalance = sortedTransactions[0].balance;
      }
      
      // Calculate new balance
      // If isReceived (Maine Liye): Customer gave money, so balance decreases
      // If !isReceived (Maine Diye): I gave money, so balance increases
      const newBalance = isReceived
        ? currentBalance - amount
        : currentBalance + amount;
      
      // Create new transaction
      const newTransaction: Transaction = {
        id: generateId(),
        customerId,
        amount,
        isReceived,
        date,
        notes,
        balance: newBalance,
        profileId: activeProfile.id,
      };
      
      // Add to transactions
      const updatedTransactions = [...transactions, newTransaction];
      await StorageUtils.saveTransactions(updatedTransactions);
      
      // Update customer balance
      const customers = await StorageUtils.getCustomers();
      const customerIndex = customers.findIndex(c => c.id === customerId);
      
      if (customerIndex !== -1) {
        customers[customerIndex].amount = Math.abs(newBalance);
        customers[customerIndex].toReceive = newBalance > 0;
        await StorageUtils.saveCustomers(customers);
      }
      
      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return null;
    }
  },
  
  // Delete a transaction
  deleteTransaction: async (transactionId: string): Promise<boolean> => {
    try {
      const transactions = await StorageUtils.getTransactions();
      const transactionIndex = transactions.findIndex(t => t.id === transactionId);
      
      if (transactionIndex === -1) {
        return false; // Transaction not found
      }
      
      const deletedTransaction = transactions[transactionIndex];
      const updatedTransactions = transactions.filter(t => t.id !== transactionId);
      
      // Recalculate balances for all transactions after the deleted one
      const customerTransactions = updatedTransactions
        .filter(t => t.customerId === deletedTransaction.customerId)
        .sort((a, b) => a.date - b.date); // Sort by date (oldest first)
      
      let currentBalance = 0;
      for (let i = 0; i < customerTransactions.length; i++) {
        const transaction = customerTransactions[i];
        currentBalance = transaction.isReceived
          ? currentBalance - transaction.amount
          : currentBalance + transaction.amount;
        transaction.balance = currentBalance;
      }
      
      await StorageUtils.saveTransactions(updatedTransactions);
      
      // Update customer balance
      const customers = await StorageUtils.getCustomers();
      const customerIndex = customers.findIndex(c => c.id === deletedTransaction.customerId);
      
      if (customerIndex !== -1) {
        customers[customerIndex].amount = Math.abs(currentBalance);
        customers[customerIndex].toReceive = currentBalance > 0;
        await StorageUtils.saveCustomers(customers);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  },
  
  // ----- User Profile -----
  
  // Save user profile
  saveUserProfile: async (profile: UserProfile): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  },
  
  // Get user profile
  getUserProfile: async (): Promise<UserProfile | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },
  
  // ----- Batwa Transactions -----
  
  // Save all batwa transactions
  saveBatwaTransactions: async (transactions: BatwaTransaction[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BATWA_TRANSACTIONS, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving batwa transactions:', error);
    }
  },
  
  // Get all batwa transactions
  getBatwaTransactions: async (): Promise<BatwaTransaction[]> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BATWA_TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting batwa transactions:', error);
      return [];
    }
  },
  
  // Get batwa transactions for the active profile
  getProfileBatwaTransactions: async (profileId?: string): Promise<BatwaTransaction[]> => {
    try {
      const activeProfileId = profileId || (await StorageUtils.getActiveProfile())?.id;
      if (!activeProfileId) return [];
      
      const transactions = await StorageUtils.getBatwaTransactions();
      return transactions.filter(t => t.profileId === activeProfileId);
    } catch (error) {
      console.error('Error getting profile batwa transactions:', error);
      return [];
    }
  },
  
  // Add a new batwa transaction
  addBatwaTransaction: async (transaction: Omit<BatwaTransaction, 'id' | 'profileId'>): Promise<BatwaTransaction | null> => {
    try {
      const transactions = await StorageUtils.getBatwaTransactions();
      const activeProfile = await StorageUtils.getActiveProfile();
      
      if (!activeProfile) {
        throw new Error('No active profile found. Please create a profile first.');
      }
      
      const newTransaction: BatwaTransaction = {
        ...transaction,
        id: generateId(),
        profileId: activeProfile.id,
      };
      
      const updatedTransactions = [...transactions, newTransaction];
      await StorageUtils.saveBatwaTransactions(updatedTransactions);
      
      return newTransaction;
    } catch (error) {
      console.error('Error adding batwa transaction:', error);
      return null;
    }
  },
  
  // Delete a batwa transaction
  deleteBatwaTransaction: async (transactionId: string): Promise<boolean> => {
    try {
      const transactions = await StorageUtils.getBatwaTransactions();
      const updatedTransactions = transactions.filter(t => t.id !== transactionId);
      
      if (updatedTransactions.length === transactions.length) {
        return false; // Transaction not found
      }
      
      await StorageUtils.saveBatwaTransactions(updatedTransactions);
      return true;
    } catch (error) {
      console.error('Error deleting batwa transaction:', error);
      throw error;
    }
  },
  
  // ----- General -----
  
  // Clear all data (for testing/debug)
  clearAllData: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.CUSTOMERS,
        STORAGE_KEYS.TRANSACTIONS,
        STORAGE_KEYS.USER_PROFILE,
        STORAGE_KEYS.BATWA_TRANSACTIONS,
        STORAGE_KEYS.PROFILES,
        STORAGE_KEYS.ACTIVE_PROFILE,
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  },
  
  // Initialize default profile if none exists
  initializeDefaultProfile: async (): Promise<Profile | null> => {
    try {
      const profiles = await StorageUtils.getProfiles();
      
      // If no profiles exist, create a default one
      if (profiles.length === 0) {
        const defaultProfile: Profile = {
          id: generateId(),
          name: 'Default Profile',
          description: 'Default khata profile',
          createdAt: Date.now(),
        };
        
        await StorageUtils.saveProfiles([defaultProfile]);
        await StorageUtils.setActiveProfile(defaultProfile);
        
        return defaultProfile;
      }
      
      // If profiles exist but no active profile is set, set the first one as active
      const activeProfile = await StorageUtils.getActiveProfile();
      if (!activeProfile && profiles.length > 0) {
        await StorageUtils.setActiveProfile(profiles[0]);
        return profiles[0];
      }
      
      return activeProfile;
    } catch (error) {
      console.error('Error initializing default profile:', error);
      return null;
    }
  },
};

export default StorageUtils; 