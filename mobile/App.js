import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Alert, ScrollView, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, Image } from 'react-native';
import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import Constants from 'expo-constants';

import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import MovementsModal from './components/MovementsModal';

const BACKEND_URL = 'http://192.168.1.33:8080';
const PUBLIC_KEY = Constants.expoConfig.extra.publicKey;
console.log("DEBUG: Using Public Key:", PUBLIC_KEY);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Main Application Component
 * Manages authentication state, payment flow, and user interface.
 */
export default function App() {
  const [token, setToken] = useState(null);

  React.useEffect(() => {
    console.log("DEBUG: App.js mounted. Public Key:", PUBLIC_KEY);
    // Alert.alert("Debug Config", `Key: ${PUBLIC_KEY?.substring(0, 10)}...`);
  }, []);

  const [authMode, setAuthMode] = useState('login');

  const [method, setMethod] = useState('yape');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('3.00'); // Fixed price for the service
  const [phone, setPhone] = useState('111111111');
  const [otp, setOtp] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [qrImage, setQrImage] = useState(null);
  const [balance, setBalance] = useState(0);
  const [showMovements, setShowMovements] = useState(false);
  const [movements, setMovements] = useState([]);

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [docNumber, setDocNumber] = useState('');

  const onLogin = (userToken, userEmail) => {
    setToken(userToken);
    setEmail(userEmail);
    fetchBalance(userToken);
  };

  const onLogout = () => {
    setToken(null);
    setEmail('');
    setBalance(0);
    setAuthMode('login');
  };

  /**
   * Fetches transaction history from the backend.
   */
  const fetchMovements = async () => {
    try {
      if (!token) return;
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/get_transactions`, {
        headers: { 'x-auth-token': token }
      });
      setMovements(response.data.transactions);
      setShowMovements(true);
    } catch (error) {
      console.error("Error fetching movements:", error);
      Alert.alert("Error", "Could not fetch movements");
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async (userToken) => {
    try {
      const authToken = userToken || token;
      if (!authToken) return;

      const response = await axios.get(`${BACKEND_URL}/get_balance`, {
        headers: {
          'x-auth-token': authToken
        }
      });
      setBalance(response.data.balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const handlePayment = async () => {
    if (method === 'yape') {
      await handleYapePayment();
    } else {
      await handleCardPayment();
    }
  };

  /**
   * Handles payment via Yape.
   * 1. Validates inputs (Phone, OTP).
   * 2. Calls Mercado Pago SDK to generate a token.
   * 3. Sends token to backend to process payment.
   */
  const handleYapePayment = async () => {
    if (!email || !phone || !otp) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);
    setQrImage(null);
    try {
      console.log("Generating Yape Token...");
      const tokenResponse = await axios.post(
        `https://api.mercadopago.com/platforms/pci/yape/v1/payment?public_key=${PUBLIC_KEY}`,
        {
          phoneNumber: phone,
          otp: otp,
          requestId: Math.random().toString(36).substring(7),
        }
      );

      const yapeToken = tokenResponse.data.id;
      await processBackendPayment({
        paymentMethodId: 'yape',
        token: yapeToken,
        description: 'Mobile Yape Payment',
        installments: 1
      });

    } catch (error) {
      handlePaymentError(error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles payment via Credit/Debit Card.
   * 1. Validates card inputs.
   * 2. Calls Mercado Pago SDK (v1/card_tokens) to generate a secure token.
   * 3. Sends token + payer info to backend.
   */
  const handleCardPayment = async () => {
    if (!cardNumber || !cardHolder || !expiryMonth || !expiryYear || !cvv || !docNumber) {
      Alert.alert("Error", "Please fill all card fields");
      return;
    }

    setLoading(true);
    try {
      console.log("Generating Card Token...");
      const cardTokenResponse = await axios.post(
        `https://api.mercadopago.com/v1/card_tokens?public_key=${PUBLIC_KEY}`,
        {
          card_number: cardNumber,
          expiration_month: parseInt(expiryMonth),
          expiration_year: (parseInt(expiryYear) < 100) ? 2000 + parseInt(expiryYear) : parseInt(expiryYear),
          security_code: cvv,
          cardholder: {
            name: cardHolder,
            identification: {
              type: 'DNI',
              number: docNumber
            }
          }
        }
      );

      const cardToken = cardTokenResponse.data.id;
      console.log("Card Token:", cardToken);

      const paymentMethodId = Number(cardNumber.charAt(0)) === 4 ? 'visa' : 'master';

      await processBackendPayment({
        paymentMethodId: paymentMethodId,
        token: cardToken,
        description: 'Mobile Card Payment',
        installments: 1,
        issuerId: null,
        payer: {
          email: email,
          identification: {
            docType: 'DNI',
            docNumber: docNumber
          }
        }
      });

    } catch (error) {
      handlePaymentError(error);
    } finally {
      setLoading(false);
    }
  };

  const processBackendPayment = async (data) => {
    console.log("Processing Payment on Backend...", data);
    const payload = {
      ...data,
      transactionAmount: Number(amount),
      payer: {
        email: email,
        ...data.payer
      }
    };

    const paymentResponse = await axios.post(`${BACKEND_URL}/process_payment`, payload);

    console.log("Payment Result Data keys:", Object.keys(paymentResponse.data));
    if (paymentResponse.data.qr_code_base64) {
      setQrImage(paymentResponse.data.qr_code_base64);
    }

    if (paymentResponse.data.status === 'approved') {
      fetchBalance();
    }

    Alert.alert("Success", `Status: ${paymentResponse.data.status}\nDetail: ${paymentResponse.data.detail}`);
  };

  const handlePaymentError = (error) => {
    console.error("Payment Error:", error.response?.data || error.message);
    const msg = error.response?.data?.error_message || error.message || "Unknown Error";
    Alert.alert("Error", "Payment Failed: " + msg);
  };

  if (!token) {
    if (authMode === 'login') {
      return <LoginScreen onLogin={onLogin} onSwitchToSignup={() => setAuthMode('signup')} />;
    } else {
      return <SignupScreen onLogin={onLogin} onSwitchToLogin={() => setAuthMode('login')} />;
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.outerContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Ultra Compact Header */}
        <View style={styles.header}>
          <View style={styles.logoSmall}>
            <Text style={styles.logoTextSmall}>MP</Text>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.titleCompact}>Motomuv</Text>
            <Text style={styles.balanceText}>S/ {balance}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={fetchMovements} style={styles.iconButton}>
              {/* History Button */}
              <Text style={styles.iconButtonText}>📊</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onLogout} style={styles.iconButton}>
              <Text style={styles.iconButtonText}>🚪</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ultra Compact Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Service Fee (Ambassador Day)</Text>
          <View style={styles.amountRow}>
            <View style={styles.amountInputWrapper}>
              <Text style={styles.currencySymbol}>S/</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                // onChangeText={setAmount} // Fixed Amount
                editable={false} // Read-only
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Payment Method Tabs */}
        <View style={styles.methodTabs}>
          <TouchableOpacity
            style={[styles.methodTab, method === 'yape' && styles.methodTabActive]}
            onPress={() => setMethod('yape')}
            activeOpacity={0.7}
          >
            <Image source={require('./assets/yape.png')} style={styles.methodTabIconImage} />
            <Text style={[styles.methodTabText, method === 'yape' && styles.methodTabTextActive]}>Yape</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodTab, method === 'card' && styles.methodTabActive]}
            onPress={() => setMethod('card')}
            activeOpacity={0.7}
          >
            <Text style={styles.methodTabIcon}>💳</Text>
            <Text style={[styles.methodTabText, method === 'card' && styles.methodTabTextActive]}>Card</Text>
          </TouchableOpacity>
        </View>

        {/* Form Section - Ultra Compact */}
        {method === 'yape' && (
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <View style={[styles.inputContainer, focusedInput === 'phone' && styles.inputContainerFocused]}>
                <Text style={styles.inputIcon}>📱</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="111111111"
                  placeholderTextColor="#999"
                  onFocus={() => setFocusedInput('phone')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>OTP Code</Text>
              <View style={[styles.inputContainer, focusedInput === 'otp' && styles.inputContainerFocused]}>
                <Text style={styles.inputIcon}>🔐</Text>
                <TextInput
                  style={styles.input}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  placeholder="123456"
                  placeholderTextColor="#999"
                  maxLength={6}
                  onFocus={() => setFocusedInput('otp')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>
          </View>
        )}

        {method === 'card' && (
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Card Number</Text>
              <View style={[styles.inputContainer, focusedInput === 'cardNumber' && styles.inputContainerFocused]}>
                <Text style={styles.inputIcon}>💳</Text>
                <TextInput
                  style={styles.input}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  keyboardType="numeric"
                  placeholder="0000 0000 0000 0000"
                  onFocus={() => setFocusedInput('cardNumber')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Card Holder</Text>
              <View style={[styles.inputContainer, focusedInput === 'cardHolder' && styles.inputContainerFocused]}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  value={cardHolder}
                  onChangeText={setCardHolder}
                  placeholder="YOUR NAME"
                  autoCapitalize="characters"
                  onFocus={() => setFocusedInput('cardHolder')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={styles.inputGroupSmall}>
                <Text style={styles.label}>MM</Text>
                <View style={[styles.inputContainer, focusedInput === 'expiryMonth' && styles.inputContainerFocused]}>
                  <TextInput
                    style={styles.input}
                    value={expiryMonth}
                    onChangeText={setExpiryMonth}
                    keyboardType="numeric"
                    placeholder="MM"
                    maxLength={2}
                    onFocus={() => setFocusedInput('expiryMonth')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>
              <View style={styles.inputGroupSmall}>
                <Text style={styles.label}>YY</Text>
                <View style={[styles.inputContainer, focusedInput === 'expiryYear' && styles.inputContainerFocused]}>
                  <TextInput
                    style={styles.input}
                    value={expiryYear}
                    onChangeText={setExpiryYear}
                    keyboardType="numeric"
                    placeholder="YY"
                    maxLength={2}
                    onFocus={() => setFocusedInput('expiryYear')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>
              <View style={styles.inputGroupSmall}>
                <Text style={styles.label}>CVV</Text>
                <View style={[styles.inputContainer, focusedInput === 'cvv' && styles.inputContainerFocused]}>
                  <TextInput
                    style={styles.input}
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="numeric"
                    placeholder="123"
                    maxLength={4}
                    secureTextEntry
                    onFocus={() => setFocusedInput('cvv')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>DNI</Text>
              <View style={[styles.inputContainer, focusedInput === 'docNumber' && styles.inputContainerFocused]}>
                <Text style={styles.inputIcon}>🆔</Text>
                <TextInput
                  style={styles.input}
                  value={docNumber}
                  onChangeText={setDocNumber}
                  keyboardType="numeric"
                  placeholder="12345678"
                  onFocus={() => setFocusedInput('docNumber')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>
          </View>
        )}

        {/* Payment Button */}
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Pay S/ {amount}</Text>
          )}
        </TouchableOpacity>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>Secure Payment via Mercado Pago</Text>
        </View>
      </ScrollView>

      <MovementsModal
        visible={showMovements}
        onClose={() => setShowMovements(false)}
        movements={movements}
        loading={loading}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingTop: 45,
    paddingBottom: 16,
  },
  // Ultra Compact Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  logoSmall: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#009EE3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoTextSmall: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 10,
  },
  titleCompact: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  balanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#009EE3',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconButtonText: {
    fontSize: 16,
  },
  // Ultra Compact Amount Card
  amountCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: '#009EE3',
    marginRight: 6,
  },
  amountInput: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    flex: 1,
    padding: 0,
  },
  qrButton: {
    backgroundColor: '#009EE3',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  qrButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  // Payment Method Tabs
  methodTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  methodTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  methodTabActive: {
    backgroundColor: '#009EE3',
  },
  methodTabIcon: {
    fontSize: 16,
  },
  methodTabIconImage: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  methodTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  methodTabTextActive: {
    color: '#fff',
  },
  // Form Card
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputGroupSmall: {
    flex: 1,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    paddingHorizontal: 11,
    height: 44,
  },
  inputContainerFocused: {
    borderColor: '#009EE3',
    backgroundColor: '#fff',
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  // Payment Button
  payButton: {
    backgroundColor: '#009EE3',
    borderRadius: 11,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#009EE3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Security Notice
  securityNotice: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 5,
  },
  securityIcon: {
    fontSize: 12,
  },
  securityText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
});