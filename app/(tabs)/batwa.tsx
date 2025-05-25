import { useIsDark } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define the transaction interface
interface BatwaTransaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  timestamp: number;
  notes: string;
}

// Format currency values
const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toLocaleString()}`;
};

// Get date in readable format
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
};

export default function BatwaScreen() {
  const isDark = useIsDark();
  const [transactions, setTransactions] = useState<BatwaTransaction[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Load transactions when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  // Load transactions from AsyncStorage
  const loadTransactions = async () => {
    try {
      const storedTransactions = await AsyncStorage.getItem('batwaTransactions');
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  // Save a new transaction
  const saveTransaction = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    if (!category) {
      Alert.alert('Missing Category', 'Please select a category.');
      return;
    }

    const newTransaction: BatwaTransaction = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      type,
      category,
      timestamp: Date.now(),
      notes,
    };

    try {
      const updatedTransactions = [...transactions, newTransaction];
      await AsyncStorage.setItem('batwaTransactions', JSON.stringify(updatedTransactions));
      setTransactions(updatedTransactions);
      resetForm();
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert('Error', 'Failed to save transaction.');
    }
  };

  // Reset form fields
  const resetForm = () => {
    setAmount('');
    setType('expense');
    setCategory('');
    setNotes('');
  };

  // Calculate total income and expenses
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpense;

  // Filter transactions
  const filteredTransactions = transactions
    .filter(t => filter === 'all' || t.type === filter)
    .sort((a, b) => b.timestamp - a.timestamp);

  // Available categories
  const expenseCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];
  const incomeCategories = ['Salary', 'Bonus', 'Gift', 'Interest', 'Other'];

  // Render transaction item
  const renderTransaction = ({ item }: { item: BatwaTransaction }) => (
    <View style={[styles.transactionItem, isDark ? styles.darkItem : styles.lightItem]}>
      <View style={styles.transactionLeft}>
        <View style={[
          styles.categoryIcon, 
          item.type === 'income' ? styles.incomeIcon : styles.expenseIcon
        ]}>
          <Ionicons 
            name={item.type === 'income' ? 'arrow-down' : 'arrow-up'} 
            size={16} 
            color="#FFFFFF" 
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={[styles.categoryText, isDark ? styles.darkText : styles.lightText]}>{item.category}</Text>
          <Text style={styles.timestampText}>{formatDate(item.timestamp)}</Text>
          {item.notes ? <Text style={styles.notesText}>{item.notes}</Text> : null}
        </View>
      </View>
      <Text style={[
        styles.amountText,
        item.type === 'income' ? styles.incomeText : styles.expenseText
      ]}>
        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, isDark ? styles.darkContainer : styles.lightContainer]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isDark ? styles.darkText : styles.lightText]}>Batwa</Text>
      </View>

      {/* Summary Card */}
      <View style={[styles.summaryCard, isDark ? styles.darkCard : styles.lightCard]}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={[
            styles.balanceAmount,
            balance >= 0 ? styles.positiveBalance : styles.negativeBalance
          ]}>
            {formatCurrency(balance)}
          </Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={styles.statIconIncome}>
              <Ionicons name="arrow-down" size={16} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[styles.statLabel, isDark ? styles.darkSubtext : styles.lightSubtext]}>Income</Text>
              <Text style={[styles.statAmount, isDark ? styles.darkText : styles.lightText]}>{formatCurrency(totalIncome)}</Text>
            </View>
          </View>
          
          <View style={styles.statItem}>
            <View style={styles.statIconExpense}>
              <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[styles.statLabel, isDark ? styles.darkSubtext : styles.lightSubtext]}>Expense</Text>
              <Text style={[styles.statAmount, isDark ? styles.darkText : styles.lightText]}>{formatCurrency(totalExpense)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Filter Options */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'income' && styles.filterButtonActive]}
          onPress={() => setFilter('income')}
        >
          <Text style={[styles.filterText, filter === 'income' && styles.filterTextActive]}>Income</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'expense' && styles.filterButtonActive]}
          onPress={() => setFilter('expense')}
        >
          <Text style={[styles.filterText, filter === 'expense' && styles.filterTextActive]}>Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={item => item.id}
        style={styles.transactionList}
        contentContainerStyle={filteredTransactions.length === 0 ? styles.emptyListContent : null}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={48} color="#AAAAAA" />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first transaction by tapping the button below
            </Text>
          </View>
        )}
      />

      {/* Add Transaction Button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.addButtonText}>ADD TRANSACTION</Text>
      </TouchableOpacity>

      {/* Add Transaction Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDark ? styles.darkModal : styles.lightModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Transaction</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                placeholderTextColor="#888888"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeButton, type === 'income' && styles.typeButtonActive]}
                onPress={() => setType('income')}
              >
                <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>
                  Income
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
                onPress={() => setType('expense')}
              >
                <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>
                  Expense
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryContainer}>
                {(type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryButton, category === cat && styles.categoryButtonActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[
                      styles.categoryButtonText, 
                      category === cat && styles.categoryButtonTextActive
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add notes"
                placeholderTextColor="#888888"
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            <TouchableOpacity 
              style={styles.saveButton}
              onPress={saveTransaction}
            >
              <Text style={styles.saveButtonText}>SAVE</Text>
            </TouchableOpacity>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
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
  summaryCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
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
  darkItem: {
    backgroundColor: '#1E1E1E',
  },
  lightItem: {
    backgroundColor: '#FFFFFF',
  },
  darkModal: {
    backgroundColor: '#121212',
  },
  lightModal: {
    backgroundColor: '#FFFFFF',
  },
  balanceContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  positiveBalance: {
    color: '#4CAF50',
  },
  negativeBalance: {
    color: '#E94057',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconIncome: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statIconExpense: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E94057',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  statAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#2A2A2A',
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterText: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  transactionList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  incomeIcon: {
    backgroundColor: '#4CAF50',
  },
  expenseIcon: {
    backgroundColor: '#E94057',
  },
  transactionInfo: {
    flex: 1,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  timestampText: {
    fontSize: 12,
    color: '#AAAAAA',
    marginBottom: 2,
  },
  notesText: {
    fontSize: 12,
    color: '#888888',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '500',
  },
  incomeText: {
    color: '#4CAF50',
  },
  expenseText: {
    color: '#E94057',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '90%',
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
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  typeButtonActive: {
    backgroundColor: '#1E1E1E',
    borderColor: '#4CAF50',
  },
  typeText: {
    color: '#AAAAAA',
    fontSize: 15,
  },
  typeTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  categoryButtonActive: {
    backgroundColor: '#4CAF50',
  },
  categoryButtonText: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 