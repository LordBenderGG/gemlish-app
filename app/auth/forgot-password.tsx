import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { router } from 'expo-router';

export default function ForgotPasswordScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Icono */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🔒</Text>
      </View>

      {/* Título */}
      <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
      <Text style={styles.subtitle}>
        Entendemos que puede pasar. Aquí te explicamos cómo funciona Gemlish.
      </Text>

      {/* Explicación */}
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📱</Text>
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Tu progreso es local</Text>
            <Text style={styles.infoDesc}>
              Gemlish guarda todo tu progreso directamente en este dispositivo, sin servidores externos. Esto significa que funciona 100% sin internet.
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🔑</Text>
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>No hay recuperación por email</Text>
            <Text style={styles.infoDesc}>
              Como no usamos servidores ni cuentas en la nube, no es posible recuperar tu contraseña por email o SMS.
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>💡</Text>
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>¿Qué puedes hacer?</Text>
            <Text style={styles.infoDesc}>
              Si recuerdas tu contraseña aproximada, prueba variaciones. Si definitivamente no la recuerdas, puedes crear una cuenta nueva. Tu progreso anterior no se puede recuperar, pero puedes empezar de cero.
            </Text>
          </View>
        </View>
      </View>

      {/* Botones */}
      <TouchableOpacity
        style={styles.btnPrimary}
        onPress={() => router.back()}
        activeOpacity={0.85}
      >
        <Text style={styles.btnPrimaryText}>← Intentar de nuevo</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnSecondary}
        onPress={() => router.push('/auth/register' as any)}
        activeOpacity={0.85}
      >
        <Text style={styles.btnSecondaryText}>Crear cuenta nueva</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  iconContainer: { alignItems: 'center', marginBottom: 20 },
  icon: { fontSize: 64 },
  title: {
    fontSize: 26, fontWeight: '800', color: '#FFFFFF',
    textAlign: 'center', marginBottom: 10,
  },
  subtitle: {
    fontSize: 14, color: '#8B9CC8', textAlign: 'center',
    lineHeight: 20, marginBottom: 28,
  },
  card: {
    backgroundColor: '#161B27', borderRadius: 20,
    padding: 20, borderWidth: 1, borderColor: '#2A3450',
    marginBottom: 24,
  },
  infoRow: { flexDirection: 'row', gap: 14, paddingVertical: 4 },
  infoIcon: { fontSize: 28, marginTop: 2 },
  infoText: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  infoDesc: { fontSize: 13, color: '#8B9CC8', lineHeight: 19 },
  divider: { height: 1, backgroundColor: '#2A3450', marginVertical: 16 },
  btnPrimary: {
    backgroundColor: '#4ADE80', borderRadius: 14,
    padding: 16, alignItems: 'center', marginBottom: 12,
  },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  btnSecondary: {
    backgroundColor: '#161B27', borderRadius: 14,
    padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#2A3450',
  },
  btnSecondaryText: { color: '#8B9CC8', fontSize: 15, fontWeight: '600' },
});
