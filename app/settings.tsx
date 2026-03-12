'use client';
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, Modal, FlatList, Alert, StatusBar, Linking, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '@/lib/theme-provider';
import { useNotifications } from '@/hooks/use-notifications';
import * as Notifications from 'expo-notifications';
import { useSoundSettings } from '@/lib/sound-settings';
import { useThemeStyles } from '@/hooks/use-theme-styles';
import { useGame } from '@/context/GameContext';
import { AdBanner } from '@/components/AdBanner';

// ─── Selector de Hora ─────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

function TimePickerModal({
  visible,
  hour,
  minute,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  hour: number;
  minute: number;
  onConfirm: (h: number, m: number) => void;
  onClose: () => void;
}) {
  const [selHour, setSelHour] = useState(hour);
  const [selMin, setSelMin] = useState(minute);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>⏰ Hora del Recordatorio</Text>
          <Text style={styles.modalSubtitle}>Recibirás una notificación diaria a esta hora</Text>

          <View style={styles.pickerRow}>
            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>Hora</Text>
              <FlatList
                data={HOURS}
                keyExtractor={String}
                style={styles.pickerList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.pickerItem, selHour === item && styles.pickerItemSelected]}
                    onPress={() => setSelHour(item)}
                  >
                    <Text style={[styles.pickerItemText, selHour === item && styles.pickerItemTextSelected]}>
                      {String(item).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>

            <Text style={styles.pickerColon}>:</Text>

            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>Min</Text>
              <FlatList
                data={MINUTES}
                keyExtractor={String}
                style={styles.pickerList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.pickerItem, selMin === item && styles.pickerItemSelected]}
                    onPress={() => setSelMin(item)}
                  >
                    <Text style={[styles.pickerItemText, selMin === item && styles.pickerItemTextSelected]}>
                      {String(item).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>

          <View style={styles.timePreview}>
            <Text style={styles.timePreviewText}>
              {String(selHour).padStart(2, '0')}:{String(selMin).padStart(2, '0')} hrs
            </Text>
          </View>

          <View style={styles.modalBtns}>
            <TouchableOpacity style={styles.modalBtnCancel} onPress={onClose}>
              <Text style={styles.modalBtnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalBtnConfirm} onPress={() => onConfirm(selHour, selMin)}>
              <Text style={styles.modalBtnConfirmText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Pantalla de Configuración ────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const t = useThemeStyles();
  const { settings, loading, permissionGranted, enableNotifications, disableNotifications, updateTime } = useNotifications();
  const { soundEnabled, setSoundEnabled } = useSoundSettings();
  const isDark = true; // Modo oscuro permanente

  const openSystemSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }, []);

  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const formatTime = (h: number, m: number) =>
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} hrs`;

  const handleNotifToggle = useCallback(async (value: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      if (value) {
        const ok = await enableNotifications(settings.hour, settings.minute);
        if (!ok) {
          Alert.alert(
            '🔔 Permisos necesarios',
            'Para recibir recordatorios, activa las notificaciones en la Configuración del sistema.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: '⚙️ Abrir Configuración', onPress: openSystemSettings },
            ]
          );
        }
      } else {
        await disableNotifications();
      }
    } catch (err) {
      console.warn('[Settings] toggle error:', err);
    } finally {
      setSaving(false);
    }
  }, [saving, settings.hour, settings.minute, enableNotifications, disableNotifications, openSystemSettings]);

  const handleTimeConfirm = useCallback(async (h: number, m: number) => {
    setShowPicker(false);
    setSaving(true);
    await updateTime(h, m);
    setSaving(false);
  }, [updateTime]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: '#0D0D18' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

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
              trackColor={{ false: '#2D3148', true: '#58CC0240' }}
              thumbColor={soundEnabled ? '#58CC02' : '#6B7280'}
            />
          </View>
        </View>

        {/* ── Notificaciones ─────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>🔔 Recordatorio de Racha</Text>

        {/* Banner informativo */}
        <View style={[styles.notifBanner, settings.enabled && styles.notifBannerActive]}>
          <Text style={styles.notifBannerEmoji}>{settings.enabled ? '🔥' : '💤'}</Text>
          <View style={styles.notifBannerText}>
            <Text style={[styles.notifBannerTitle, settings.enabled && { color: '#FF9600' }]}>
              {settings.enabled
                ? `Recordatorio activo a las ${formatTime(settings.hour, settings.minute)}`
                : 'Protégete de perder tu racha'}
            </Text>
            <Text style={styles.notifBannerSub}>
              {settings.enabled
                ? 'Te avisaremos si no has completado tu tarea diaria'
                : 'Activa el recordatorio y elige a qué hora quieres que te avisemos'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          {/* Toggle principal */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Activar recordatorio diario</Text>
              <Text style={styles.settingSub}>
                {settings.enabled
                  ? `Aviso a las ${formatTime(settings.hour, settings.minute)}`
                  : 'Sin recordatorio configurado'}
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleNotifToggle}
              trackColor={{ false: '#2D3148', true: '#FF960040' }}
              thumbColor={settings.enabled ? '#FF9600' : '#6B7280'}
              disabled={saving || loading}
            />
          </View>

          {/* Selector de hora — siempre visible */}
          <TouchableOpacity
            style={[styles.timeRow, !settings.enabled && styles.timeRowDisabled]}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.8}
          >
            <View style={styles.timeRowLeft}>
              <Text style={styles.settingEmoji}>⏰</Text>
              <View>
                <Text style={styles.settingTitle}>Hora del recordatorio</Text>
                <Text style={[styles.timeValue, settings.enabled && { color: '#FF9600' }]}>
                  {formatTime(settings.hour, settings.minute)}
                </Text>
              </View>
            </View>
            <Text style={styles.timeArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Banner AdMob — debajo del selector de hora */}
        <AdBanner style={{ marginTop: 8 }} />

        <View style={{ height: 40 }} />
      </ScrollView>

      <TimePickerModal
        visible={showPicker}
        hour={settings.hour}
        minute={settings.minute}
        onConfirm={handleTimeConfirm}
        onClose={() => setShowPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1E2A3A',
  },
  backBtn: {
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#111122', borderRadius: 12,
    borderWidth: 1, borderColor: '#1E2A3A',
  },
  backBtnText: { fontSize: 28, color: '#FFFFFF', lineHeight: 34, marginTop: -2 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  headerSpacer: { width: 40 },
  scroll: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 },
  card: {
    backgroundColor: '#111122', borderRadius: 16,
    borderWidth: 1, borderColor: '#1E2A3A', overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16,
  },
  settingEmoji: { fontSize: 24, width: 32, textAlign: 'center' },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  settingSub: { fontSize: 12, color: '#9CA3AF' },
  resetBtn: {
    borderTopWidth: 1, borderTopColor: '#2D3148',
    paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center',
  },
  resetBtnText: { fontSize: 13, color: '#38BDF8', fontWeight: '600' },
  // Notificaciones
  notifBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#111122', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#1E2A3A',
  },
  notifBannerActive: { borderColor: '#FF960040', backgroundColor: '#FF960010' },
  notifBannerEmoji: { fontSize: 28 },
  notifBannerText: { flex: 1 },
  notifBannerTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 3 },
  notifBannerSub: { fontSize: 12, color: '#9CA3AF', lineHeight: 17 },
  timeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: '#2D3148',
  },
  timeRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeRowDisabled: { opacity: 0.5 },
  timeValue: { fontSize: 18, fontWeight: '800', color: '#38BDF8', marginTop: 2 },
  timeArrow: { fontSize: 24, color: '#6B7280' },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#111122', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderTopColor: '#1E2A3A',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 20 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  pickerCol: { alignItems: 'center', width: 80 },
  pickerLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  pickerList: { height: 180 },
  pickerItem: {
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10,
    alignItems: 'center', marginVertical: 2,
  },
  pickerItemSelected: { backgroundColor: '#38BDF820', borderWidth: 1.5, borderColor: '#38BDF8' },
  pickerItemText: { fontSize: 20, fontWeight: '600', color: '#9CA3AF' },
  pickerItemTextSelected: { color: '#38BDF8', fontWeight: '800' },
  pickerColon: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginTop: 20 },
  timePreview: {
    alignItems: 'center', backgroundColor: '#0F1117',
    borderRadius: 12, padding: 12, marginBottom: 20,
    borderWidth: 1, borderColor: '#2D3148',
  },
  timePreviewText: { fontSize: 32, fontWeight: '900', color: '#38BDF8' },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalBtnCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', backgroundColor: '#2D3148',
  },
  modalBtnCancelText: { color: '#9CA3AF', fontSize: 15, fontWeight: '700' },
  modalBtnConfirm: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', backgroundColor: '#38BDF8',
  },
  modalBtnConfirmText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
