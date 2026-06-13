import React, { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, StatusBar, ActivityIndicator, Keyboard, TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { api, setToken, setGruppo } from '../../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { alert('Inserisci email e password'); return; }
    setLoading(true);
    try {
      const result = await api.login({ email, password });
      setToken(result.token);
      setGruppo(result.user.gruppi[0].id_gruppo);
      navigation.replace('Main');
    } catch (e) {
      alert(e.message);
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
        {/* Header / Brand */}
        <View style={styles.brandSection}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="home-variant" size={48} color={Colors.accent} />
          </View>
          <Text style={styles.brandName}>YourSmartHome</Text>
          <Text style={styles.brandTagline}>Controlla la tua casa ovunque</Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Accedi</Text>

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
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotPassword}>Password dimenticata?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.background} />
              : <Text style={styles.loginButtonText}>Accedi</Text>
            }
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>oppure</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={styles.registerButtonText}>Crea un account</Text>
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
  brandTagline: { ...Typography.body, marginTop: 4, color: Colors.textMuted },

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

  forgotPassword: {
    ...Typography.label,
    color: Colors.accent,
    textAlign: 'right',
    marginBottom: Spacing.lg,
  },

  loginButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.accent,
  },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { fontSize: 16, fontWeight: '700', color: Colors.background },

  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { ...Typography.caption, marginHorizontal: Spacing.sm },

  registerButton: {
    borderRadius: Radius.full, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.borderLight,
  },
  registerButtonText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
});