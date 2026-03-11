import React, { useState, useMemo } from 'react';
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
  empty:  { label: '',        color: '#1E2A3A', bars: 0 },
  weak:   { label: 'Débil',   color: '#EF4444', bars: 1 },
  medium: { label: 'Media',   color: '#FBBF24', bars: 2 },
  strong: { label: 'Fuerte',  color: '#4ADE80', bars: 3 },
};

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const config = STRENGTH_CONFIG[strength];
  if (!password) return null;
  return (
    <View style={sStyles.container}>
      <View style={sStyles.bars}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[sStyles.bar, { backgroundColor: i <= config.bars ? config.color : '#1E2A3A' }]} />
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
      <StatusBar barStyle="light-content" backgroundColor="#0D0D18" />
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
                  placeholder="Mínimo 4 caracteres"
                  placeholderTextColor="#3D4A5C"
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
                  placeholderTextColor="#3D4A5C"
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
                <Text style={[styles.matchText, { color: password === password2 ? '#4ADE80' : '#EF4444' }]}>
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
                ? <ActivityIndicator color="#0D0D18" />
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
  container: { flex: 1, backgroundColor: '#0D0D18' },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 52, paddingBottom: 40 },

  logoContainer: { alignItems: 'center', marginBottom: 36 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: '#0F2A4A',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  logoEmoji: { fontSize: 36 },
  logoText: { fontSize: 34, fontWeight: '900', color: '#F1F5F9', letterSpacing: -0.5 },
  logoSub: { fontSize: 13, color: '#64748B', marginTop: 5, fontWeight: '500' },

  form: { width: '100%' },
  formTitle: {
    fontSize: 20, fontWeight: '800', color: '#CBD5E1',
    marginBottom: 22, textAlign: 'center', letterSpacing: -0.2,
  },

  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 12, padding: 12,
    marginBottom: 18,
    borderLeftWidth: 3, borderLeftColor: '#EF4444',
  },
  errorText: { color: '#FCA5A5', fontSize: 13, fontWeight: '600' },

  inputGroup: { marginBottom: 16 },
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
  matchText: { fontSize: 12, fontWeight: '700', marginTop: 8 },

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

  note: { color: '#374151', fontSize: 12, textAlign: 'center', marginTop: 18 },

  footer: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 28,
  },
  footerText: { color: '#475569', fontSize: 14 },
  footerLink: { color: '#38BDF8', fontSize: 14, fontWeight: '700' },
});
