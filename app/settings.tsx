import React, { useCallback, useRef, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, Alert, StatusBar, Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '@/hooks/use-notifications';
import { useSoundSettings } from '@/lib/sound-settings';
import { useThemeStyles } from '@/hooks/use-theme-styles';
import { useGame } from '@/context/GameContext';
import { AdBanner } from '@/components/AdBanner';

// ─── Pantalla de Configuración ────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const t = useThemeStyles();
  const { settings, loading, enableNotifications, disableNotifications } = useNotifications();
  const { soundEnabled, setSoundEnabled } = useSoundSettings();
  const openSystemSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const timeStr = useMemo(() => {
    const h = settings.hour % 12 || 12;
    const ampm = settings.hour >= 12 ? 'PM' : 'AM';
    return `${h}:${String(settings.minute).padStart(2, '0')} ${ampm}`;
  }, [settings.hour, settings.minute]);

  // useRef en lugar de useState para que el guard sea síncrono.
  // Con useState, el check `if (saving) return` y el set ocurren en distintos
  // ciclos de render, dejando una ventana donde un segundo tap pasa el guard.
  const savingRef = useRef(false);
  const [saving, setSaving] = React.useState(false);

  const handleNotifToggle = useCallback(async (value: boolean) => {
    if (savingRef.current) return;  // guard síncrono
    savingRef.current = true;
    setSaving(true);
    try {
      if (value) {
        const result = await enableNotifications();
        if (result === 'permission_denied') {
          Alert.alert(
            'Permiso de notificaciones',
            'Para activar el recordatorio, habilita las notificaciones de Gemlish en los Ajustes del sistema.',
            [
              { text: 'Abrir Ajustes', onPress: openSystemSettings },
              { text: 'Cancelar', style: 'cancel' },
            ]
          );
        } else if (result === 'schedule_failed') {
          Alert.alert(
            'No se pudo activar',
            'Ocurrió un error al programar el recordatorio. Intenta desinstalar y reinstalar la app.',
            [{ text: 'OK' }]
          );
        }
      } else {
        await disableNotifications();
      }
    } catch (err) {
      console.warn('[Settings] toggle error:', err);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [enableNotifications, disableNotifications, openSystemSettings]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: t.bg }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚙️ Configuración</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>🔊 Sonidos</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <Text style={styles.settingEmoji}>{soundEnabled ? '🔊' : '🔇'}</Text>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Efectos de sonido</Text>
              <Text style={styles.settingSub}>
                {soundEnabled
                  ? 'Sonidos al responder y completar niveles'
                  : 'Sin efectos de sonido'}
              </Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: '#E2E8F0', true: '#58CC0240' }}
              thumbColor={soundEnabled ? '#4ADE80' : '#64748B'}
            />
          </View>
        </View>

        {/* Banner AdMob */}
        <AdBanner style={{ marginVertical: 4 }} />

        {/* ── Notificaciones ──────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>🔔 Recordatorio Diario</Text>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <Text style={styles.settingEmoji}>{settings.enabled ? '🔥' : '🔔'}</Text>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Recordatorio de las {timeStr}</Text>
              <Text style={styles.settingSub}>
                {settings.enabled
                  ? `Notificación diaria activa a las ${timeStr}`
                  : 'Recibe un aviso cada mañana para estudiar'}
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleNotifToggle}
              trackColor={{ false: '#E2E8F0', true: '#FF960040' }}
              thumbColor={settings.enabled ? '#FBBF24' : '#64748B'}
              disabled={saving}
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  backBtnText: { fontSize: 28, color: '#1E293B', lineHeight: 34, marginTop: -2 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#1E293B', textAlign: 'center' },
  headerSpacer: { width: 40 },
  scroll: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#64748B', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16,
  },
  settingEmoji: { fontSize: 24, width: 32, textAlign: 'center' },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  settingSub: { fontSize: 12, color: '#64748B' },
});
