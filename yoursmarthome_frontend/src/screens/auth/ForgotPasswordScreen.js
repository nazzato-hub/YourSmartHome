import React, { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, StatusBar, ActivityIndicator, Keyboard, TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { api } from '../../services/api';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [step, setStep] = useState(1); // 1 = Richiesta codice, 2 = Reset password
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!email) { Alert.alert('Errore', 'Inserisci il tuo indirizzo email'); return; }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Errore', 'Formato email non valido');
      return;
    }

    setLoading(true);
    try {
      const result = await api.forgotPassword(email);
      // Mostriamo un alert con il codice per facilitare il test locale
      Alert.alert(
        'Codice Inviato',
        `Un codice di verifica a 6 cifre è stato inviato alla tua email.\n\n[TEST INFO] Il codice generato è: ${result.code}`,
        [{ text: 'OK', onPress: () => setStep(2) }]
      );
    } catch (e) {
      Alert.alert('Errore', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code || !newPassword || !confirmPassword) {
      Alert.alert('Errore', 'Tutti i campi sono obbligatori');
      return;
    }

    if (code.length !== 6) {
      Alert.alert('Errore', 'Il codice di verifica deve essere di 6 cifre');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Errore', 'Le password non coincidono');
      return;
    }

    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!pwdRegex.test(newPassword)) {
      Alert.alert(
        'Password debole',
        'La password deve avere almeno 8 caratteri, una maiuscola, una minuscola e un carattere speciale.'
      );
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(email, code, newPassword);
      Alert.alert(
        'Successo',
        'La tua password è stata reimpostata correttamente. Ora puoi effettuare l\'accesso.',
        [{ text: 'Accedi', onPress: () => navigation.navigate('Login') }]
      );
    } catch (e) {
      Alert.alert('Errore', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inner}
        >
          {/* Brand/Header */}
          <View style={styles.brandSection}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="lock-reset" size={48} color={Colors.accent} />
            </View>
            <Text style={styles.brandName}>Recupero Password</Text>
            <Text style={styles.brandTagline}>
              {step === 1 
                ? 'Inserisci la tua email per ricevere il codice di ripristino'
                : 'Inserisci il codice ricevuto e la nuova password'
              }
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            {step === 1 ? (
              // Step 1: Richiesta Codice
              <View>
                <Text style={styles.formTitle}>Richiedi Codice</Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email registrata</Text>
                  <TextInput
                    style={[styles.input, focusedField === 'email' && styles.inputFocused]}
                    placeholder="nome@esempio.com"
                    placeholderTextColor={Colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.actionButton, loading && styles.actionButtonDisabled]}
                  onPress={handleRequestCode}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color={Colors.background} />
                    : <Text style={styles.actionButtonText}>Invia Codice</Text>
                  }
                </TouchableOpacity>
              </View>
            ) : (
              // Step 2: Reset Password
              <View>
                <Text style={styles.formTitle}>Reimposta Password</Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Codice di verifica (6 cifre)</Text>
                  <TextInput
                    style={[styles.input, focusedField === 'code' && styles.inputFocused]}
                    placeholder="123456"
                    placeholderTextColor={Colors.textMuted}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    onFocus={() => setFocusedField('code')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Nuova Password</Text>
                  <TextInput
                    style={[styles.input, focusedField === 'newPassword' && styles.inputFocused]}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.textMuted}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    onFocus={() => setFocusedField('newPassword')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Conferma Nuova Password</Text>
                  <TextInput
                    style={[styles.input, focusedField === 'confirmPassword' && styles.inputFocused]}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.actionButton, loading && styles.actionButtonDisabled]}
                  onPress={handleResetPassword}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color={Colors.background} />
                    : <Text style={styles.actionButtonText}>Ripristina Password</Text>
                  }
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backStepButton}
                  onPress={() => setStep(1)}
                  disabled={loading}
                >
                  <Text style={styles.backStepButtonText}>Torna allo step precedente</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Annulla e torna al Login</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg },

  brandSection: { alignItems: 'center', marginBottom: Spacing.xl },
  logoCircle: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: Colors.accentSoft,
    borderWidth: 2, borderColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md, ...Shadow.accent,
  },
  logoIcon: { fontSize: 34 },
  brandName: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  brandTagline: { ...Typography.body, marginTop: 4, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.md },

  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.card,
  },
  formTitle: { ...Typography.heading2, marginBottom: Spacing.lg },

  fieldGroup: { marginBottom: Spacing.md },
  fieldLabel: { ...Typography.label, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputFocused: { borderColor: Colors.accent, backgroundColor: Colors.accentSoft },

  actionButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadow.accent,
  },
  actionButtonDisabled: { opacity: 0.6 },
  actionButtonText: { fontSize: 16, fontWeight: '700', color: Colors.background },

  backStepButton: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  backStepButtonText: { fontSize: 14, fontWeight: '600', color: Colors.accent },

  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },

  cancelButton: {
    borderRadius: Radius.full, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.borderLight,
  },
  cancelButtonText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
});
