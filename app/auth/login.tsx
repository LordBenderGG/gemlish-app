import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useGame } from '@/context/GameContext';
import { getLastUsername } from '@/lib/storage';

const C = {
  bg: '#F8FAFF',
  surface: '#FFFFFF',
  surface2: '#EFF6FF',
  text: '#1E293B',
  muted: '#64748B',
  mutedLight: '#475569',
  border: '#E2E8F0',
  green: '#4F46E5',
  blue: '#4F46E5',
  error: '#EF4444',
};

export default function LoginScreen() {
  const { login } = useGame();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Pre-llenar el campo de usuario con el último username usado
  useEffect(() => {
    getLastUsername().then(last => {
      if (last) setUsername(last);
    });
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    // Validate empty fields
    if (!trimmedUsername || !trimmedPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    // Validate email format if username contains @ symbol (optional email login)
    if (trimmedUsername.includes('@') && !validateEmail(trimmedUsername)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    // Validate password minimum length
    if (trimmedPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await login(trimmedUsername, trimmedPassword);
      if (result.ok) {
        router.replace('/(tabs)');
      } else {
        setError(result.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.warn('[Login] error:', err);
      setError('Error inesperado al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#4F46E5', '#8B5CF6']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.logoCircle}
            >
              <Text style={styles.logoEmoji}>💎</Text>
            </LinearGradient>
            <Text style={styles.logoText}>Gemlish</Text>
            <Text style={styles.logoSub}>Aprende Inglés Jugando</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Iniciar Sesión</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Usuario</Text>
              <TextInput
                style={[styles.input, focusedField === 'user' && styles.inputFocused]}
                placeholder="Tu nombre de usuario"
                placeholderTextColor={C.border}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onFocus={() => setFocusedField('user')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={[styles.passwordRow, focusedField === 'pass' && styles.inputFocused]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Tu contraseña"
                  placeholderTextColor={C.border}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  onFocus={() => setFocusedField('pass')}
                  onBlur={() => setFocusedField(null)}
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
              style={[styles.btnWrap, loading && { opacity: 0.65 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.btnPrimary}
              >
                {loading
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.btnPrimaryText}>Entrar</Text>
                }
              </LinearGradient>
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
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 64, paddingBottom: 40 },

  logoContainer: { alignItems: 'center', marginBottom: 44 },
  logoCircle: {
    width: 88, height: 88, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  logoEmoji: { fontSize: 42 },
  logoText: {
    fontSize: 36, fontWeight: '900', color: C.text,
    letterSpacing: -0.5,
  },
  logoSub: { fontSize: 14, color: C.muted, marginTop: 6, fontWeight: '500' },

  form: { width: '100%' },
  formTitle: {
    fontSize: 20, fontWeight: '800', color: C.mutedLight,
    marginBottom: 24, textAlign: 'center', letterSpacing: -0.2,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderRadius: 14, padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
    gap: 10,
  },
  errorIcon: { fontSize: 16 },
  errorText: { flex: 1, color: C.error, fontSize: 13, fontWeight: '600' },

  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 11, color: C.muted, marginBottom: 8,
    fontWeight: '700', letterSpacing: 1.0, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: C.text,
    fontSize: 16,
  },
  inputFocused: {
    borderColor: C.green,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 16,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: C.text,
    fontSize: 16,
  },
  eyeBtn: { paddingHorizontal: 16, paddingVertical: 16 },
  eyeIcon: { fontSize: 18 },

  btnWrap: { marginTop: 8 },
  btnPrimary: {
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', letterSpacing: 0.2 },

  forgotBtn: { marginTop: 16, alignItems: 'center', paddingVertical: 4 },
  forgotText: { color: C.muted, fontSize: 13 },

  footer: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 40,
  },
  footerText: { color: C.muted, fontSize: 14 },
  footerLink: { color: C.blue, fontSize: 14, fontWeight: '700' },
});
