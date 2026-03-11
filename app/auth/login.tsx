import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useGame } from '@/context/GameContext';

export default function LoginScreen() {
  const { login } = useGame();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }
    setLoading(true);
    setError('');
    const result = await login(username.trim(), password);
    setLoading(false);
    if (result.ok) {
      router.replace('/(tabs)');
    } else {
      setError(result.error || 'Error al iniciar sesión');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D18" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>💎</Text>
            </View>
            <Text style={styles.logoText}>Gemlish</Text>
            <Text style={styles.logoSub}>Aprende Inglés Jugando</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Iniciar Sesión</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Usuario</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu nombre de usuario"
                placeholderTextColor="#3D4A5C"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Tu contraseña"
                  placeholderTextColor="#3D4A5C"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(v => !v)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, loading && { opacity: 0.6 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#0D0D18" />
                : <Text style={styles.btnPrimaryText}>Entrar</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => router.push('/auth/forgot-password' as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register' as any)}>
              <Text style={styles.footerLink}>Regístrate</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D18' },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 64, paddingBottom: 40 },

  logoContainer: { alignItems: 'center', marginBottom: 48 },
  logoCircle: {
    width: 88, height: 88, borderRadius: 24,
    backgroundColor: '#0F2A4A',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  logoEmoji: { fontSize: 40 },
  logoText: {
    fontSize: 38, fontWeight: '900', color: '#F1F5F9',
    letterSpacing: -0.5,
  },
  logoSub: { fontSize: 14, color: '#64748B', marginTop: 6, fontWeight: '500' },

  form: { width: '100%' },
  formTitle: {
    fontSize: 20, fontWeight: '800', color: '#CBD5E1',
    marginBottom: 24, textAlign: 'center', letterSpacing: -0.2,
  },

  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 12, padding: 12,
    marginBottom: 20,
    borderLeftWidth: 3, borderLeftColor: '#EF4444',
  },
  errorText: { color: '#FCA5A5', fontSize: 13, fontWeight: '600' },

  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 11, color: '#64748B', marginBottom: 8,
    fontWeight: '700', letterSpacing: 1.0, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#111122',
    borderWidth: 1,
    borderColor: '#1E2A3A',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: '#F1F5F9',
    fontSize: 16,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111122',
    borderWidth: 1,
    borderColor: '#1E2A3A',
    borderRadius: 14,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: '#F1F5F9',
    fontSize: 16,
  },
  eyeBtn: { paddingHorizontal: 16, paddingVertical: 16 },
  eyeIcon: { fontSize: 18 },

  btnPrimary: {
    backgroundColor: '#A3E635',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#A3E635',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  btnPrimaryText: { color: '#0D0D18', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },

  forgotBtn: { marginTop: 16, alignItems: 'center', paddingVertical: 4 },
  forgotText: { color: '#475569', fontSize: 13 },

  footer: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 40,
  },
  footerText: { color: '#475569', fontSize: 14 },
  footerLink: { color: '#38BDF8', fontSize: 14, fontWeight: '700' },
});
