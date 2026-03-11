import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>💎</Text>
          <Text style={styles.logoText}>Gemlish</Text>
          <Text style={styles.logoSub}>Aprende Inglés Jugando</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Iniciar Sesión</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Usuario</Text>
            <TextInput
              style={styles.input}
              placeholder="Tu nombre de usuario"
              placeholderTextColor="#9CA3AF"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Tu contraseña"
                placeholderTextColor="#9CA3AF"
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
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnPrimaryText}>Entrar</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => router.push('/auth/register' as any)}
          >
            <Text style={styles.btnSecondaryText}>¿No tienes cuenta? <Text style={styles.link}>Regístrate</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoEmoji: { fontSize: 64, marginBottom: 8 },
  logoText: { fontSize: 36, fontWeight: '800', color: '#58CC02', letterSpacing: 1 },
  logoSub: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  card: {
    backgroundColor: '#1A1D27',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2D3148',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 20, textAlign: 'center' },
  errorText: {
    backgroundColor: '#FF4B4B20',
    color: '#FF4B4B',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 13,
    textAlign: 'center',
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, color: '#9CA3AF', marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: '#0F1117',
    borderWidth: 1,
    borderColor: '#2D3148',
    borderRadius: 12,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 15,
  },
  // Campo de contraseña con botón ojo
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1117',
    borderWidth: 1,
    borderColor: '#2D3148',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 15,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: { fontSize: 18 },
  btnPrimary: {
    backgroundColor: '#58CC02',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  btnSecondary: { marginTop: 16, alignItems: 'center' },
  btnSecondaryText: { color: '#9CA3AF', fontSize: 14 },
  link: { color: '#58CC02', fontWeight: '700' },
});
