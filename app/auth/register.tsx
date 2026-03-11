import React, { useState, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useGame } from '@/context/GameContext';

// ─── Fortaleza de contraseña ──────────────────────────────────────────────────

type PasswordStrength = 'empty' | 'weak' | 'medium' | 'strong';

function getPasswordStrength(pwd: string): PasswordStrength {
  if (!pwd) return 'empty';
  const hasLength = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const score = [pwd.length >= 4, hasLength, hasUpper || hasNumber, hasSpecial].filter(Boolean).length;
  if (score <= 1) return 'weak';
  if (score === 2) return 'medium';
  return 'strong';
}

const STRENGTH_CONFIG: Record<PasswordStrength, { label: string; color: string; bars: number }> = {
  empty:  { label: '',        color: '#2A2A40', bars: 0 },
  weak:   { label: 'Débil',   color: '#EF4444', bars: 1 },
  medium: { label: 'Media',   color: '#F59E0B', bars: 2 },
  strong: { label: 'Fuerte',  color: '#10B981', bars: 3 },
};

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const config = STRENGTH_CONFIG[strength];
  if (!password) return null;
  return (
    <View style={sStyles.container}>
      <View style={sStyles.bars}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[sStyles.bar, { backgroundColor: i <= config.bars ? config.color : '#2A2A40' }]} />
        ))}
      </View>
      {config.label ? <Text style={[sStyles.label, { color: config.color }]}>{config.label}</Text> : null}
    </View>
  );
}

const sStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  bars: { flexDirection: 'row', gap: 4, flex: 1 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  label: { fontSize: 11, fontWeight: '700', width: 48, textAlign: 'right' },
});

// ─── Pantalla de Registro ─────────────────────────────────────────────────────

export default function RegisterScreen() {
  const { register } = useGame();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !password.trim() || !password2.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    setError('');
    const result = await register(username.trim(), password);
    setLoading(false);
    if (result.ok) {
      router.replace('/(tabs)');
    } else {
      setError(result.error || 'Error al registrarse');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1A0A3A', '#0A0A14']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        style={styles.topGradient}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>💎</Text>
            </View>
            <Text style={styles.logoText}>Gemlish</Text>
            <Text style={styles.logoSub}>Crea tu cuenta gratis</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Crear Cuenta</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre de usuario</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 3 caracteres"
                placeholderTextColor="#4B5563"
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
                  placeholder="Mínimo 4 caracteres"
                  placeholderTextColor="#4B5563"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)} activeOpacity={0.7}>
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              <PasswordStrengthBar password={password} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor="#4B5563"
                  value={password2}
                  onChangeText={setPassword2}
                  secureTextEntry={!showPassword2}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword2(v => !v)} activeOpacity={0.7}>
                  <Text style={styles.eyeIcon}>{showPassword2 ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {password2.length > 0 && (
                <Text style={[styles.matchText, { color: password === password2 ? '#10B981' : '#EF4444' }]}>
                  {password === password2 ? '✓ Las contraseñas coinciden' : '✗ No coinciden'}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, loading && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnPrimaryText}>Crear Cuenta</Text>
              }
            </TouchableOpacity>

            <Text style={styles.note}>Tu progreso se guarda localmente en este dispositivo.</Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.footerLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A14' },
  topGradient: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 280,
  },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 48, paddingBottom: 40 },

  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#7C3AED',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  logoEmoji: { fontSize: 34 },
  logoText: { fontSize: 34, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  logoSub: { fontSize: 13, color: '#6B7280', marginTop: 4, fontWeight: '500' },

  form: { width: '100%' },
  formTitle: {
    fontSize: 22, fontWeight: '800', color: '#FFFFFF',
    marginBottom: 24, textAlign: 'center',
  },

  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 12, padding: 12,
    marginBottom: 20,
    borderLeftWidth: 3, borderLeftColor: '#EF4444',
  },
  errorText: { color: '#FCA5A5', fontSize: 13, fontWeight: '600' },

  inputGroup: { marginBottom: 18 },
  label: { fontSize: 12, color: '#9CA3AF', marginBottom: 8, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#141420',
    borderWidth: 1,
    borderColor: '#2A2A40',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141420',
    borderWidth: 1,
    borderColor: '#2A2A40',
    borderRadius: 14,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  eyeBtn: { paddingHorizontal: 16, paddingVertical: 16 },
  eyeIcon: { fontSize: 18 },
  matchText: { fontSize: 12, fontWeight: '700', marginTop: 8 },

  btnPrimary: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },

  note: { color: '#4B5563', fontSize: 12, textAlign: 'center', marginTop: 20 },

  footer: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 32,
  },
  footerText: { color: '#6B7280', fontSize: 14 },
  footerLink: { color: '#A78BFA', fontSize: 14, fontWeight: '700' },
});
