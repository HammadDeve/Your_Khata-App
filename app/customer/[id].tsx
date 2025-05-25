import React from 'react';
import StorageUtils, { Customer, Transaction } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import * as Contacts from 'expo-contacts';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Format currency values
const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toLocaleString()}`;
};

// Format date for display
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleDateString('en-IN', options); 
};

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams();
  const customerId = Array.isArray(id) ? id[0] : id;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Load customer and transactions when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadCustomerData();
    }, [customerId])
  );
  
  // Load customer and transactions from storage
  const loadCustomerData = async (isRefreshing = false) => {
    if (!customerId) {
      setLoading(false);
      return;
    }
    
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else if (!refreshing) {
        setLoading(true);
      }
      
      // Get all customers
      const allCustomers = await StorageUtils.getCustomers();
      const foundCustomer = allCustomers.find(c => c.id === customerId);
      
      if (foundCustomer) {
        setCustomer(foundCustomer);
        
        // Get transactions for this customer
        const customerTransactions = await StorageUtils.getCustomerTransactions(customerId);
        
        // Sort transactions by date (newest first)
        const sortedTransactions = customerTransactions.sort((a, b) => b.date - a.date);
        setTransactions(sortedTransactions);
      } else {
        setCustomer(null);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle pull to refresh
  const onRefresh = () => {
    loadCustomerData(true);
  };
  
  // Handle transaction deletion
  const handleDeleteTransaction = async (transactionId: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await StorageUtils.deleteTransaction(transactionId);
              await loadCustomerData();
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert('Error', 'Failed to delete transaction. Please try again.');
            }
          },
        },
      ]
    );
  };
  
  // Handle SMS
  const handleSendSMS = async () => {
    if (!customer) return;
    
    try {
      const message = `Hi ${customer.name}, this is regarding your balance of ${formatCurrency(customer.amount)} that you ${customer.toReceive ? 'need to pay' : 'will receive'}.`;
      const url = `sms:${customer.phoneNumber}?body=${encodeURIComponent(message)}`;
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Error',
          'SMS is not supported on this device'
        );
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      Alert.alert(
        'Error',
        'Failed to open SMS. Please try again.'
      );
    }
  };

  // Handle WhatsApp
  const handleWhatsApp = async () => {
    if (!customer) return;
    
    try {
      const message = `Hi ${customer.name}, this is regarding your balance of ${formatCurrency(customer.amount)} that you ${customer.toReceive ? 'need to pay' : 'will receive'}.`;
      // Format phone number for WhatsApp (remove spaces, +, etc)
      const formattedPhone = customer.phoneNumber.replace(/[\s+\-()]/g, '');
      const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Error',
          'WhatsApp is not installed on this device'
        );
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      Alert.alert(
        'Error',
        'Failed to open WhatsApp. Please make sure WhatsApp is installed.'
      );
    }
  };

  // Handle Reports Share
  const handleShareReport = async () => {
    if (!customer) return;
    
    try {
      const message = `Transaction Report for ${customer.name}\n\n` +
        `Current Balance: ${formatCurrency(customer.amount)}\n` +
        `Status: ${customer.toReceive ? 'To Receive' : 'To Give'}\n\n` +
        'Recent Transactions:\n' +
        transactions.slice(0, 5).map(t => 
          `${formatDate(t.date)}: ${formatCurrency(t.amount)} (${t.isReceived ? 'Received' : 'Given'})`
        ).join('\n');

      await Share.share({
        message,
        title: `Transaction Report - ${customer.name}`,
      });
    } catch (error) {
      console.error('Error sharing report:', error);
      Alert.alert(
        'Error',
        'Failed to share report. Please try again.'
      );
    }
  };
  
  if (loading && !customer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.customerNameText}>Loading...</Text>
          </View>
          <View style={styles.headerActions} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#AAAAAA" />
          <Text style={styles.loadingText}>Loading customer data...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!customer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.customerNameText}>Not Found</Text>
          </View>
          <View style={styles.headerActions} />
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.notFoundText}>Customer not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity 
      style={styles.transactionItem}
      onLongPress={() => handleDeleteTransaction(item.id)}
    >
      <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
      <View style={styles.amountRow}>
        {item.isReceived ? (
          <Text style={[styles.transactionAmount, styles.amountReceive]}>
            {formatCurrency(item.amount)}
          </Text>
        ) : (
          <Text style={[styles.transactionAmount, styles.amountGive]}>
            {formatCurrency(item.amount)}
          </Text>
        )}
      </View>
      <Text style={styles.balanceText}>Bal. {formatCurrency(Math.abs(item.balance))}</Text>
      {item.notes && <Text style={styles.notesText}>{item.notes}</Text>}
    </TouchableOpacity>
  );
  
  const handleAddTransaction = (isGave: boolean) => {
    router.push({
      pathname: "/transaction/add",
      params: { 
        customerId: customer.id, 
        customerName: customer.name,
        isGave: isGave ? 'true' : 'false'
      }
    });
  };
  
  const handleViewReports = () => {
    router.push({
      pathname: "/customer/reports",
      params: { 
        customerId: customer.id
      }
    });
  };
  
  const renderEmptyList = () => {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="list-outline" size={48} color="#AAAAAA" />
        <Text style={styles.emptyText}>No transactions yet</Text>
        <Text style={styles.emptySubtext}>
          Record your first transaction using the buttons below
        </Text>
      </View>
    );
  };
  
  return (
    <>
      <Stack.Screen options={{ 
        headerShown: false
      }} />
      <SafeAreaView style={styles.container}>
        {/* Header with customer name */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.customerNameText}>{customer.name}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleViewReports}>
              <Ionicons name="bar-chart-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceInfo}>
            <View style={[
              styles.directionIcon, 
              customer.toReceive ? styles.receiveIcon : styles.giveIcon
            ]}>
              <Ionicons 
                name={customer.toReceive ? "arrow-down" : "arrow-up"} 
                size={18} 
                color="#FFFFFF" 
              />
            </View>
            <View>
              <Text style={[
                styles.balanceAmount,
                customer.toReceive ? styles.amountReceive : styles.amountGive
              ]}>
                {formatCurrency(customer.amount)}
              </Text>
              <Text style={styles.balanceLabel}>
                {customer.toReceive ? "Maine lene hain" : "Maine dene hain"}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.wasooliButton}>
            <Text style={styles.wasooliText}>Wasooli</Text>
          </TouchableOpacity>
        </View>
        
        {/* Communication Options */}
        <View style={styles.communicationOptions}>
          <TouchableOpacity style={styles.commOption} onPress={handleSendSMS}>
            <View style={styles.commIconContainer}>
              <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.commLabel}>SMS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.commOption} onPress={handleWhatsApp}>
            <View style={styles.commIconContainer}>
              <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.commLabel}>WhatsApp</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.commOption} onPress={handleShareReport}>
            <View style={styles.commIconContainer}>
              <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.commLabel}>Reports</Text>
          </TouchableOpacity>
        </View>
        
        {/* Transaction List Header */}
        <View style={styles.transactionListHeader}>
          <Text style={styles.headerColumnText}>Date</Text>
          <Text style={styles.headerColumnText}>Maine diye</Text>
          <Text style={styles.headerColumnText}>Maine Liye</Text>
        </View>
        
        {/* Transaction List */}
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={item => item.id}
          style={styles.transactionList}
          contentContainerStyle={transactions.length === 0 ? styles.fullHeight : undefined}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#AAAAAA"]}
              tintColor="#AAAAAA"
            />
          }
        />
        
        {/* Transaction Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.diyeButton]}
            onPress={() => handleAddTransaction(true)}
          >
            <Ionicons name="arrow-up" size={18} color="#FFFFFF" style={styles.actionIcon} />
            <Text style={styles.actionText}>MAINE DIYE</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.liyeButton]}
            onPress={() => handleAddTransaction(false)}
          >
            <Ionicons name="arrow-down" size={18} color="#FFFFFF" style={styles.actionIcon} />
            <Text style={styles.actionText}>MAINE LIYE</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1A1A1A',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  customerNameText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  customerInfoCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    marginBottom: 8,
  },
  customerNameTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  customerPhoneText: {
    color: '#AAAAAA',
    fontSize: 14,
    marginTop: 4,
  },
  initialsText: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 4,
  },
  balanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  directionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  receiveIcon: {
    backgroundColor: '#E94057',
  },
  giveIcon: {
    backgroundColor: '#4CAF50',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  amountReceive: {
    color: '#E94057',
  },
  amountGive: {
    color: '#4CAF50',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  wasooliButton: {
    borderColor: '#2A2A2A',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  wasooliText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  communicationOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  commOption: {
    alignItems: 'center',
  },
  commIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  commLabel: {
    color: '#AAAAAA',
    fontSize: 12,
  },
  transactionListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  headerColumnText: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  transactionList: {
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
  transactionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  transactionDate: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  balanceText: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 4,
  },
  notesText: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 'auto',
    height: 56,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  diyeButton: {
    backgroundColor: '#E94057',
  },
  liyeButton: {
    backgroundColor: '#4CAF50',
  },
  actionIcon: {
    marginRight: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
}); 