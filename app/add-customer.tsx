import StorageUtils from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
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
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddCustomerScreen() {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isGave, setIsGave] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState({
    name: '',
    phoneNumber: '',
    amount: '',
  });

  const isFormValid = name.trim() !== '' && phoneNumber.trim() !== '' && amount.trim() !== '';

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const newErrors = {
      name: name.trim() === '' ? 'Name is required' : '',
      phoneNumber: phoneNumber.trim() === '' ? 'Phone number is required' : '',
      amount: amount.trim() === '' ? 'Amount is required' : '',
    };

    setErrors(newErrors);

    if (isFormValid) {
      try {
        setIsSubmitting(true);
        const amountNumber = parseInt(amount, 10);
        const toReceive = !isGave;

        const newCustomer = await StorageUtils.addCustomer({
          name,
          phoneNumber,
          amount: amountNumber,
          toReceive,
        });

        if (amountNumber > 0) {
          await StorageUtils.addTransaction(
            newCustomer.id,
            amountNumber,
            !toReceive,
            Date.now()
          );
        }

        router.back();
      } catch (error) {
        console.error('Error adding customer:', error);
        Alert.alert(
          'Error',
          'There was an error adding the customer. Please try again.'
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const formatAmount = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setAmount(numericValue);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Customer Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter customer name"
                placeholderTextColor="#777777"
                value={name}
                onChangeText={setName}
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter phone number"
                placeholderTextColor="#777777"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
              {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Initial Amount (Rs)</Text>
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

            <View style={styles.inputContainer}>
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
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!isFormValid || isSubmitting) && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid || isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'ADDING...' : 'ADD CUSTOMER'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
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
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactsButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  errorText: {
    color: '#E94057',
    fontSize: 12,
    marginTop: 4,
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
  buttonContainer: {
    padding: 16,
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  submitButton: {
    backgroundColor: '#E94057',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
