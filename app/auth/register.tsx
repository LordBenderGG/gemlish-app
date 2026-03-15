import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useGame } from '@/context/GameContext';

const C = {
  bg: '#0E1117',
  surface: '#161B27',
  surface2: '#1E2535',
  text: '#F0F4FF',
  muted: '#8B9CC8',
  mutedLight: '#C4CEEA',
  border: '#2A3450',
  green: '#4ADE80',
  blue: '#38BDF8',
  error: '#F87171',
  gold: '#FBBF24',
};

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
  empty:  { label: '',        color: C.border, bars: 0 },
  weak:   { label: 'Débil',   color: C.error,  bars: 1 },
  medium: { label: 'Media',   color: C.gold,   bars: 2 },
  strong: { label: 'Fuerte',  color: C.green,  bars: 3 },
};

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const config = STRENGTH_CONFIG[strength];
  if (!password) return null;
  return (
    <View style={sStyles.container}>
      <View style={sStyles.bars}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[sStyles.bar, { backgroundColor: i <= config.bars ? config.color : C.surface2 }]} />
        ))}
      </View>
      {config.label ? <Text style={[sStyles.label, { color: config.color }]}>{config.label}</Text> : null}
    </View>
  );
}

const sStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  bars: { flexDirection: 'row', gap: 4, flex: 1 },
  bar: { flex: 1, height: 5, borderRadius: 3 },
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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#A78BFA', '#38BDF8']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.logoCircle}
            >
              <Text style={styles.logoEmoji}>💎</Text>
            </LinearGradient>
            <Text style={styles.logoText}>Gemlish</Text>
            <Text style={styles.logoSub}>Crea tu cuenta gratis</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Crear Cuenta</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre de usuario</Text>
              <TextInput
                style={[styles.input, focusedField === 'user' && styles.inputFocused]}
                placeholder="Mínimo 3 caracteres"
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
                  placeholder="Mínimo 4 caracteres"
                  placeholderTextColor={C.border}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  onFocus={() => setFocusedField('pass')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)} activeOpacity={0.7}>
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              <PasswordStrengthBar password={password} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <View style={[styles.passwordRow, focusedField === 'pass2' && styles.inputFocused]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor={C.border}
                  value={password2}
                  onChangeText={setPassword2}
                  secureTextEntry={!showPassword2}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  onFocus={() => setFocusedField('pass2')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword2(v => !v)} activeOpacity={0.7}>
                  <Text style={styles.eyeIcon}>{showPassword2 ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {password2.length > 0 && (
                <Text style={[styles.matchText, { color: password === password2 ? C.green : C.error }]}>
                  {password === password2 ? '✓ Las contraseñas coinciden' : '✗ No coinciden'}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.btnWrap, loading && { opacity: 0.65 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#A78BFA', '#38BDF8']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.btnPrimary}
              >
                {loading
                  ? <ActivityIndicator color="#0E1117" />
                  : <Text style={styles.btnPrimaryText}>Crear Cuenta</Text>
                }
              </LinearGradient>
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
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 52, paddingBottom: 40 },

  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  logoEmoji: { fontSize: 36 },
  logoText: { fontSize: 34, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  logoSub: { fontSize: 13, color: C.muted, marginTop: 5, fontWeight: '500' },

  form: { width: '100%' },
  formTitle: {
    fontSize: 20, fontWeight: '800', color: C.mutedLight,
    marginBottom: 22, textAlign: 'center', letterSpacing: -0.2,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderRadius: 14, padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
    gap: 10,
  },
  errorIcon: { fontSize: 16 },
  errorText: { flex: 1, color: C.error, fontSize: 13, fontWeight: '600' },

  inputGroup: { marginBottom: 16 },
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
  inputFocused: { borderColor: C.blue },
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
  matchText: { fontSize: 12, fontWeight: '700', marginTop: 8 },

  btnWrap: { marginTop: 8 },
  btnPrimary: {
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#0E1117', fontSize: 17, fontWeight: '900', letterSpacing: 0.2 },

  note: { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 18, opacity: 0.7 },

  footer: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 28,
  },
  footerText: { color: C.muted, fontSize: 14 },
  footerLink: { color: C.blue, fontSize: 14, fontWeight: '700' },
});
