import StorageUtils from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Button,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddTransactionScreen({ }) {
  const { customerId, customerName, isGave: isGaveParam } = useLocalSearchParams();
  const name = Array.isArray(customerName) ? customerName[0] : customerName || '';
  const id = Array.isArray(customerId) ? customerId[0] : customerId || '';

  const [amount, setAmount] = useState('');
  const [isGave, setIsGave] = useState(isGaveParam === 'true');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({ amount: '' });

  useEffect(() => {
    if (isGaveParam !== undefined) {
      setIsGave(isGaveParam === 'true');
    }
  }, [isGaveParam]);

  const formatAmount = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setAmount(numericValue);
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-IN', options);
  };

  const isFormValid = amount.trim() !== '';

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const newErrors = {
      amount: amount.trim() === '' ? 'Amount is required' : '',
    };

    setErrors(newErrors);

    if (isFormValid) {
      try {
        setIsSubmitting(true);

        const amountNumber = parseInt(amount, 10);

        const transaction = await StorageUtils.addTransaction(
          id,
          amountNumber,
          !isGave,
          date.getTime(),
          notes || undefined
        );

        if (!transaction) {
          throw new Error('Failed to add transaction');
        }

        router.back();
      } catch (error) {
        console.error('Error adding transaction:', error);
        Alert.alert('Error', 'There was an error adding the transaction. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Transaction</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Customer Name */}
          <View style={styles.customerContainer}>
            <Text style={styles.customerLabel}>Customer:</Text>
            <Text style={styles.customerName}>{name}</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Amount Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount (Rs)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter amount"
                placeholderTextColor="#777777"
                keyboardType="numeric"
                value={amount}
                onChangeText={formatAmount}
              />
              {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
            </View>

            {/* Transaction Type */}
            <View style={styles.transactionTypeContainer}>
              <Text style={styles.inputLabel}>Transaction Type</Text>
              <View style={styles.switchContainer}>
                <Text style={[styles.switchLabel, !isGave && styles.activeType]}>
                  Maine Liye (I Received)
                </Text>
                <Switch
                  value={isGave}
                  onValueChange={setIsGave}
                  trackColor={{ false: '#E94057', true: '#4CAF50' }}
                  thumbColor="#FFFFFF"
                />
                <Text style={[styles.switchLabel, isGave && styles.activeType]}>
                  Maine Diye (I Gave)
                </Text>
              </View>
            </View>

            {/* Date Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Date</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>{formatDate(date)}</Text>
                <Ionicons name="calendar" size={20} color="#AAAAAA" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}
            </View>

            {/* Notes Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                placeholder="Add notes about this transaction"
                placeholderTextColor="#777777"
                multiline
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isFormValid || isSubmitting) && styles.disabledButton,
              isGave ? styles.gaveButton : styles.receivedButton,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting
                ? 'SAVING...'
                : isGave
                ? 'MAINE DIYE (I GAVE)'
                : 'MAINE LIYE (I RECEIVED)'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Disable Expo Router Header
export const screenOptions = {
  headerShown: false,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 32,
  },
  customerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E1E1E',
    marginBottom: 16,
  },
  customerLabel: {
    color: '#AAAAAA',
    fontSize: 16,
    marginRight: 8,
  },
  customerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  formContainer: {
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#E94057',
    fontSize: 12,
    marginTop: 4,
  },
  transactionTypeContainer: {
    marginBottom: 24,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
  },
  switchLabel: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  activeType: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  datePickerButton: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaveButton: {
    backgroundColor: '#4CAF50',
  },
  receivedButton: {
    backgroundColor: '#E94057',
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
