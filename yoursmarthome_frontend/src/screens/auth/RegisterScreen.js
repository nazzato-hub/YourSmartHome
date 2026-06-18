import React, { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, StatusBar, Switch, ActivityIndicator, Alert, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
const { api, setToken, setGruppo } = require('../../services/api');

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Errore', 'Compila tutti i campi obbligatori.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Errore', 'Le password non coincidono.');
      return;
    }
    setLoading(true);
    try {
      const result = await api.register({
        email: email.trim(),
        password: password,
        nome: email.trim().split('@')[0], // Nome di default derivato dall'email
      });
      setToken(result.token);
      setGruppo(result.idGruppo);
      Alert.alert('Successo', 'Account creato con successo!');
      navigation.replace('Main');
    } catch (e) {
      Alert.alert('Errore di registrazione', e.message);
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.logoRow}>
            <MaterialCommunityIcons name="home-variant" size={48} color={Colors.accent} />
            <Text style={styles.brandName}>YourSmartHome</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Crea account</Text>
          <Text style={styles.formSubtitle}>Inizia a controllare la tua casa</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
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

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              style={[styles.input, focusedField === 'password' && styles.inputFocused]}
              placeholder="Min. 8 caratteri"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Conferma Password</Text>
            <TextInput
              style={[styles.input, focusedField === 'confirm' && styles.inputFocused]}
              placeholder="Ripeti la password"
              placeholderTextColor={Colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* Ricorda i miei dati */}
          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
              {rememberMe && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.rememberText}>Ricorda i miei dati</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.registerButton, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={styles.registerButtonText}>Registrati</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.loginLinkText}>
              Hai già un account?{' '}
              <Text style={styles.loginLinkAccent}>Accedi</Text>
            </Text>
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

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, marginRight: Spacing.md,
  },
  backIcon: { fontSize: 18, color: Colors.textPrimary },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  logoIcon: { fontSize: 22 },
  brandName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },

  formCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, ...Shadow.card,
  },
  formTitle: { ...Typography.heading2, marginBottom: 4 },
  formSubtitle: { ...Typography.body, color: Colors.textMuted, marginBottom: Spacing.lg },

  fieldGroup: { marginBottom: Spacing.md },
  fieldLabel: { ...Typography.label, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingVertical: 14, paddingHorizontal: Spacing.md,
    color: Colors.textPrimary, fontSize: 15,
    borderWidth: 1, borderColor: Colors.border,
  },
  inputFocused: { borderColor: Colors.accent, backgroundColor: Colors.accentSoft },

  rememberRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: Spacing.lg, gap: Spacing.sm,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 1.5, borderColor: Colors.borderLight,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkmark: { fontSize: 12, color: Colors.background, fontWeight: '700' },
  rememberText: { ...Typography.body, color: Colors.textSecondary },

  registerButton: {
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    paddingVertical: 16, alignItems: 'center', ...Shadow.accent,
    marginBottom: Spacing.md,
  },
  registerButtonText: { fontSize: 16, fontWeight: '700', color: Colors.background },

  loginLink: { alignItems: 'center', paddingVertical: Spacing.sm },
  loginLinkText: { ...Typography.body, color: Colors.textMuted },
  loginLinkAccent: { color: Colors.accent, fontWeight: '600' },
});
