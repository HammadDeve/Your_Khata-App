import StorageUtils, { Customer, Transaction } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Format currency values
const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toLocaleString()}`;
};

// Format date
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

type CustomerWithTransactions = {
  customerId: string;
  customerName: string;
  transactions: Transaction[];
}

export default function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 days ago
  const [endDate, setEndDate] = useState(new Date());
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerTransactions, setCustomerTransactions] = useState<CustomerWithTransactions[]>([]);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );
  
  // Load initial data
  const loadData = async () => {
    setLoading(true);
    try {
      // Load all customers
      const allCustomers = await StorageUtils.getCustomers();
      setCustomers(allCustomers);
      
      // Load all transactions
      const allTransactions = await StorageUtils.getTransactions();
      
      // Group transactions by customer
      const transactionsByCustomer: { [key: string]: Transaction[] } = {};
      
      // Filter transactions by date range
      const filteredTransactions = allTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
      
      // Group transactions by customer
      filteredTransactions.forEach(transaction => {
        if (!transactionsByCustomer[transaction.customerId]) {
          transactionsByCustomer[transaction.customerId] = [];
        }
        transactionsByCustomer[transaction.customerId].push(transaction);
      });
      
      // Create customerWithTransactions array
      const customersWithTransactions: CustomerWithTransactions[] = [];
      
      for (const customerId in transactionsByCustomer) {
        const customer = allCustomers.find(c => c.id === customerId);
        if (customer) {
          customersWithTransactions.push({
            customerId,
            customerName: customer.name,
            transactions: transactionsByCustomer[customerId],
          });
        }
      }
      
      setCustomerTransactions(customersWithTransactions);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate summary
  const calculateSummary = () => {
    let totalTransactions = 0;
    let totalReceived = 0;
    let totalGiven = 0;
    
    // Filter by selected customer if needed
    const filteredCustomerTransactions = selectedCustomerId 
      ? customerTransactions.filter(ct => ct.customerId === selectedCustomerId)
      : customerTransactions;
    
    filteredCustomerTransactions.forEach(customerData => {
      customerData.transactions.forEach(transaction => {
        totalTransactions++;
        if (transaction.isReceived) {
          totalReceived += transaction.amount;
        } else {
          totalGiven += transaction.amount;
        }
      });
    });
    
    return {
      totalTransactions,
      totalReceived,
      totalGiven,
      netBalance: totalGiven - totalReceived,
    };
  };
  
  const summary = calculateSummary();
  
  // Apply filters
  const applyFilters = () => {
    loadData();
  };
  
  // Render the selected customer's name or "All Customers"
  const selectedCustomerName = selectedCustomerId
    ? customers.find(c => c.id === selectedCustomerId)?.name || 'Unknown'
    : 'All Customers';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
      </View>
      
      {/* Filter Section */}
      <View style={styles.filterCard}>
        <Text style={styles.filterTitle}>Filter Transactions</Text>
        
        {/* Date Range */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Date Range:</Text>
          <View style={styles.dateRangeContainer}>
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={styles.textDark}>
                {formatDate(startDate.getTime())}
              </Text>
            </TouchableOpacity>
            <Text style={styles.toText}>to</Text>
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={styles.textDark}>
                {formatDate(endDate.getTime())}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Customer Selection */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Customer:</Text>
          <TouchableOpacity 
            style={styles.customerButton} 
            onPress={() => setShowCustomerModal(true)}
          >
            <Text style={styles.textDark}>
              {selectedCustomerName}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {/* Apply Button */}
        <TouchableOpacity 
          style={styles.applyButton} 
          onPress={applyFilters}
        >
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
      
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Total Transactions:
          </Text>
          <Text style={styles.summaryValue}>
            {summary.totalTransactions}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Total Received:
          </Text>
          <Text style={[styles.summaryValue, styles.receivedText]}>
            {formatCurrency(summary.totalReceived)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Total Given:
          </Text>
          <Text style={[styles.summaryValue, styles.givenText]}>
            {formatCurrency(summary.totalGiven)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Net Balance:
          </Text>
          <Text style={[
            styles.summaryValue, 
            summary.netBalance > 0 ? styles.positiveBalance : styles.negativeBalance
          ]}>
            {formatCurrency(Math.abs(summary.netBalance))}
            {summary.netBalance > 0 ? ' (To Receive)' : ' (To Give)'}
          </Text>
        </View>
      </View>
      
      {/* Transaction List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#AAAAAA" />
          <Text style={styles.loadingText}>
            Loading transactions...
          </Text>
        </View>
      ) : (
        <FlatList
          data={selectedCustomerId 
            ? customerTransactions.filter(ct => ct.customerId === selectedCustomerId)
            : customerTransactions
          }
          keyExtractor={(item) => item.customerId}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="document-text-outline" 
                size={48} 
                color="#AAAAAA" 
              />
              <Text style={styles.emptyText}>
                No transactions found for the selected filter criteria
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.customerSection}>
              <Text style={styles.customerName}>
                {item.customerName}
              </Text>
              
              {item.transactions.map(transaction => (
                <View key={transaction.id} style={styles.transaction}>
                  <View style={styles.transactionLeft}>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.date)}
                    </Text>
                    {transaction.notes && (
                      <Text style={styles.transactionNotes}>
                        {transaction.notes}
                      </Text>
                    )}
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    transaction.isReceived ? styles.receivedText : styles.givenText
                  ]}>
                    {transaction.isReceived ? '- ' : '+ '}
                    {formatCurrency(transaction.amount)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        />
      )}
      
      {/* Start Date Picker Modal */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}
      
      {/* End Date Picker Modal */}
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )}
      
      {/* Customer Selection Modal */}
      <Modal
        visible={showCustomerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCustomerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select Customer
              </Text>
              <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.customerList}>
              {/* All Customers Option */}
              <TouchableOpacity
                style={[
                  styles.customerItem,
                  selectedCustomerId === null && styles.selectedCustomer
                ]}
                onPress={() => {
                  setSelectedCustomerId(null);
                  setShowCustomerModal(false);
                }}
              >
                <Text style={[
                  styles.customerItemText,
                  selectedCustomerId === null && styles.selectedCustomerText
                ]}>
                  All Customers
                </Text>
              </TouchableOpacity>
              
              {/* Customer List */}
              {customers.map(customer => (
                <TouchableOpacity
                  key={customer.id}
                  style={[
                    styles.customerItem,
                    selectedCustomerId === customer.id && styles.selectedCustomer
                  ]}
                  onPress={() => {
                    setSelectedCustomerId(customer.id);
                    setShowCustomerModal(false);
                  }}
                >
                  <Text style={[
                    styles.customerItemText,
                    selectedCustomerId === customer.id && styles.selectedCustomerText
                  ]}>
                    {customer.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  textDark: {
    color: '#FFFFFF',
  },
  textSubtitleDark: {
    color: '#AAAAAA',
  },
  filterCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1E1E1E',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 16,
    flex: 1,
    color: '#FFFFFF',
  },
  dateRangeContainer: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
  },
  toText: {
    marginHorizontal: 8,
    color: '#FFFFFF',
  },
  customerButton: {
    flex: 2,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    backgroundColor: '#2A2A2A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  applyButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  summaryCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1E1E1E',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  receivedText: {
    color: '#E94057',
  },
  givenText: {
    color: '#4CAF50',
  },
  positiveBalance: {
    color: '#E94057',
  },
  negativeBalance: {
    color: '#4CAF50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 30,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    color: '#FFFFFF',
  },
  customerSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1E1E1E',
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#FFFFFF',
  },
  transaction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  transactionLeft: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  transactionNotes: {
    fontSize: 12,
    marginTop: 4,
    color: '#AAAAAA',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '70%',
    backgroundColor: '#121212',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  customerList: {
    marginBottom: 16,
  },
  customerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  customerItemText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  selectedCustomer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  selectedCustomerText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
}); 