'use client';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Alert, Switch, Modal, FlatList, Platform, Share, TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeStyles } from '@/hooks/use-theme-styles';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { useNotifications } from '@/hooks/use-notifications';
import { useThemeContext } from '@/lib/theme-provider';
import { LESSONS } from '@/data/lessons';
import { ACHIEVEMENTS } from '@/lib/achievements';
import type { Achievement, AchievementStats } from '@/lib/achievements';
import {
  getPracticeHistory, formatDuration, formatSessionDate,
  type PracticeSession,
} from '@/lib/practice-history';

// ─── Tipos locales ────────────────────────────────────────────────────────────

// UserStats es un alias de AchievementStats para compatibilidad local
type UserStats = AchievementStats;

// ─── Componente de Logro ──────────────────────────────────────────────────────

function AchievementCard({ achievement, unlocked, username }: { achievement: Achievement; unlocked: boolean; username: string }) {
  const handleShare = useCallback(async () => {
    try {
      const msg = `🏆 Desbloquee el logro "${achievement.title}" en Gemlish!\n${achievement.emoji} ${achievement.description}\n\n📱 Aprende inglés jugando con Gemlish`;
      await Share.share({ message: msg, title: `Logro desbloqueado: ${achievement.title}` });
    } catch {
      // usuario canceló
    }
  }, [achievement]);

  return (
    <View style={[styles.achieveCard, !unlocked && styles.achieveCardLocked]}>
      <Text style={[styles.achieveEmoji, !unlocked && styles.achieveEmojiLocked]}>
        {unlocked ? achievement.emoji : '🔒'}
      </Text>
      <View style={styles.achieveInfo}>
        <Text style={[styles.achieveTitle, !unlocked && styles.achieveTitleLocked]}>
          {achievement.title}
        </Text>
        <Text style={[styles.achieveDesc, !unlocked && styles.achieveDescLocked]}>
          {achievement.description}
        </Text>
      </View>
      {unlocked ? (
        <TouchableOpacity style={styles.achieveShareBtn} onPress={handleShare} activeOpacity={0.7}>
          <Text style={styles.achieveShareIcon}>📤</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.achieveCheck}>🔒</Text>
      )}
    </View>
  );
}

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
            {/* Horas */}
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

            {/* Minutos */}
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

          {/* Preview */}
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

// ─── Sección de Notificaciones ────────────────────────────────────────────────

function NotificationsSection() {
  const { settings, loading, enableNotifications, disableNotifications, updateTime } = useNotifications();
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const formatTime = (h: number, m: number) =>
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} hrs`;

  const handleToggle = useCallback(async (value: boolean) => {
    if (saving) return;
    setSaving(true);
    if (value) {
      const ok = await enableNotifications(settings.hour, settings.minute);
      if (!ok) {
        Alert.alert(
          '🔔 Permisos necesarios',
          'Para recibir recordatorios de racha, activa las notificaciones en Configuración del sistema.',
          [{ text: 'Entendido' }]
        );
      }
    } else {
      await disableNotifications();
    }
    setSaving(false);
  }, [saving, settings, enableNotifications, disableNotifications]);

  const handleTimeConfirm = useCallback(async (h: number, m: number) => {
    setShowPicker(false);
    setSaving(true);
    await updateTime(h, m);
    setSaving(false);
  }, [updateTime]);

  if (loading) return null;

  return (
    <View style={styles.notifSection}>
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

      <View style={styles.notifCard}>
        {/* Toggle principal */}
        <View style={styles.notifRow}>
          <View style={styles.notifRowLeft}>
            <Text style={styles.notifRowTitle}>Activar recordatorio diario</Text>
            <Text style={styles.notifRowSub}>
              {settings.enabled
                ? `Aviso a las ${formatTime(settings.hour, settings.minute)}`
                : 'Sin recordatorio configurado'}
            </Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={handleToggle}
            trackColor={{ false: '#2D3148', true: '#FF960040' }}
            thumbColor={settings.enabled ? '#FF9600' : '#6B7280'}
            disabled={saving}
          />
        </View>

        {/* Selector de hora — siempre visible */}
        <TouchableOpacity
          style={[styles.timeRow, !settings.enabled && styles.timeRowDisabled]}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.8}
        >
          <View style={styles.timeRowLeft}>
            <Text style={styles.timeRowEmoji}>⏰</Text>
            <View>
              <Text style={styles.timeRowTitle}>Hora del recordatorio</Text>
              <Text style={[styles.timeRowValue, settings.enabled && { color: '#FF9600' }]}>
                {formatTime(settings.hour, settings.minute)}
              </Text>
            </View>
          </View>
          <Text style={styles.timeRowArrow}>›</Text>
        </TouchableOpacity>
      </View>

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

// ─── Ranking de Palabras Difíciles ───────────────────────────────────────────

interface HardWord {
  word: string;
  translation: string;
  pronunciation: string;
  failCount: number;
}

function findWordTranslation(wordEn: string): { translation: string; pronunciation: string } {
  for (const lesson of LESSONS) {
    const found = lesson.words.find(w => w.word.toLowerCase() === wordEn.toLowerCase());
    if (found) return { translation: found.translation, pronunciation: found.pronunciation };
  }
  return { translation: '—', pronunciation: '' };
}

function HardWordsSection({ levelErrors }: { levelErrors: Record<number, string[]> }) {
  const hardWords = useMemo((): HardWord[] => {
    // Contar cuántas veces falla cada palabra en todos los niveles
    const counts: Record<string, number> = {};
    Object.values(levelErrors).forEach(words => {
      words.forEach(word => {
        const key = word.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    // Ordenar por frecuencia y tomar top 5
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word, failCount]) => {
        const { translation, pronunciation } = findWordTranslation(word);
        return {
          word: word.charAt(0).toUpperCase() + word.slice(1),
          translation,
          pronunciation,
          failCount,
        };
      });
  }, [levelErrors]);

  const handlePractice = useCallback(() => {
    router.push('/practice/hard-words' as any);
  }, []);

  if (hardWords.length === 0) {
    return (
      <View style={styles.hardWordsSection}>
        <Text style={styles.sectionTitle}>🎯 Palabras Difíciles</Text>
        <View style={styles.hardWordsEmpty}>
          <Text style={styles.hardWordsEmptyEmoji}>🌟</Text>
          <Text style={styles.hardWordsEmptyText}>¡Sin errores registrados!</Text>
          <Text style={styles.hardWordsEmptySubtext}>Completa niveles para ver las palabras que más te cuestan.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.hardWordsSection}>
      <View style={styles.hardWordsHeader}>
        <Text style={styles.sectionTitle}>🎯 Palabras Difíciles</Text>
        <Text style={styles.hardWordsSubtitle}>Top 5 más falladas</Text>
      </View>

      <View style={styles.hardWordsList}>
        {hardWords.map((item, idx) => (
          <View key={item.word} style={styles.hardWordRow}>
            <View style={[
              styles.hardWordRank,
              idx === 0 && styles.hardWordRank1,
              idx === 1 && styles.hardWordRank2,
              idx === 2 && styles.hardWordRank3,
            ]}>
              <Text style={styles.hardWordRankText}>{idx + 1}</Text>
            </View>
            <View style={styles.hardWordInfo}>
              <View style={styles.hardWordNameRow}>
                <Text style={styles.hardWordEn}>{item.word}</Text>
                {item.pronunciation ? (
                  <Text style={styles.hardWordPhonetic}>{item.pronunciation}</Text>
                ) : null}
              </View>
              <Text style={styles.hardWordEs}>{item.translation}</Text>
            </View>
            <View style={styles.hardWordFails}>
              <Text style={styles.hardWordFailCount}>{item.failCount}</Text>
              <Text style={styles.hardWordFailLabel}>{item.failCount === 1 ? 'error' : 'errores'}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.practiceBtn} onPress={handlePractice} activeOpacity={0.8}>
        <Text style={styles.practiceBtnText}>📚 Practicar palabras difíciles</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Pantalla de Perfil ───────────────────────────────────────────────────────

const AVATAR_EMOJIS = [
  '🦊', '🐻', '🐸', '🦁', '🐼', '🐯', '🦋', '🐮',
  '🐶', '🐱', '🐧', '🐷', '🐺', '🦍', '🐢', '🦉',
  '🐬', '🦈', '🐙', '🐮‍💨', '🦖', '🦒', '🦓', '🦚',
];
const AVATAR_KEY = '@gemlish_avatar';

// ─── Tabla de Clasificación Local ──────────────────────────────────────────────

const LEADERBOARD_KEY = '@gemlish_all_users';

function LeaderboardSection() {
  const { game, username } = useGame();
  const t = useThemeStyles();
  const isDark = t.bg === '#151718';
  const [entries, setEntries] = React.useState<Array<{ username: string; xp: number; streak: number; levelsCompleted: number }>>([]);

  React.useEffect(() => {
    AsyncStorage.getItem(LEADERBOARD_KEY).then(raw => {
      if (!raw) {
        // Si no hay datos, mostrar solo el usuario actual
        const levelsCompleted = Object.values(game.levelProgress).filter(p => p.completed).length;
        setEntries([{ username: username ?? 'Tú', xp: game.xp, streak: game.streak, levelsCompleted }]);
        return;
      }
      try {
        const all = JSON.parse(raw) as Array<{ username: string; xp: number; streak: number; levelsCompleted: number }>;
        // Actualizar el usuario actual
        const levelsCompleted = Object.values(game.levelProgress).filter(p => p.completed).length;
        const updated = all.map(u => u.username === username ? { ...u, xp: game.xp, streak: game.streak, levelsCompleted } : u);
        if (!updated.find(u => u.username === username)) {
          updated.push({ username: username ?? 'Tú', xp: game.xp, streak: game.streak, levelsCompleted });
        }
        AsyncStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
        setEntries(updated.sort((a, b) => b.xp - a.xp).slice(0, 10));
      } catch {
        const levelsCompleted = Object.values(game.levelProgress).filter(p => p.completed).length;
        setEntries([{ username: username ?? 'Tú', xp: game.xp, streak: game.streak, levelsCompleted }]);
      }
    });
  }, [game, username]);

  if (entries.length < 2) return null; // Solo mostrar si hay más de 1 usuario

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>🏅 Clasificación Local</Text>
      {entries.map((entry, i) => {
        const isMe = entry.username === username;
        return (
          <View key={entry.username} style={[
            { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, marginBottom: 6, gap: 10 },
            { backgroundColor: isMe ? (isDark ? '#1a2a1a' : '#e8f5e9') : (isDark ? '#1E2022' : '#F5F5F5') },
            isMe && { borderWidth: 1.5, borderColor: '#58CC02' },
          ]}>
            <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{medals[i] ?? `${i + 1}`}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: isMe ? '#58CC02' : (isDark ? '#ECEDEE' : '#11181C'), fontWeight: isMe ? '800' : '600', fontSize: 14 }}>
                {isMe ? `${entry.username} (Tú)` : entry.username}
              </Text>
              <Text style={{ color: '#9BA1A6', fontSize: 11, marginTop: 2 }}>{entry.levelsCompleted} niveles · 🔥 {entry.streak} días</Text>
            </View>
            <Text style={{ color: '#8E5AF5', fontWeight: '800', fontSize: 14 }}>{entry.xp.toLocaleString()} XP</Text>
          </View>
        );
      })}
    </View>
  );
}

function AvatarPickerModal({
  visible, current, onSelect, onClose,
}: { visible: boolean; current: string; onSelect: (e: string) => void; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.avatarModalOverlay}>
        <View style={styles.avatarModalBox}>
          <Text style={styles.avatarModalTitle}>🎨 Elige tu avatar</Text>
          <Text style={styles.avatarModalSub}>Toca un emoji para usarlo como tu avatar</Text>
          <View style={styles.avatarGrid}>
            {AVATAR_EMOJIS.map(emoji => (
              <TouchableOpacity
                key={emoji}
                style={[styles.avatarOption, current === emoji && styles.avatarOptionSelected]}
                onPress={() => onSelect(emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.avatarOptionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.avatarModalClose} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.avatarModalCloseText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const t = useThemeStyles();
  const { username, game, daily, logout, renameUsername } = useGame();
  const { colorScheme, setColorScheme, isManual, resetToSystem } = useThemeContext();
  const isDark = colorScheme === 'dark';
  const [practiceHistory, setPracticeHistory] = useState<PracticeSession[]>([]);
  const [avatar, setAvatar] = useState('🦊');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');
  const [nameSaving, setNameSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(AVATAR_KEY).then(v => { if (v) setAvatar(v); });
  }, []);

  const handleSelectAvatar = useCallback(async (emoji: string) => {
    setAvatar(emoji);
    await AsyncStorage.setItem(AVATAR_KEY, emoji);
    setShowAvatarPicker(false);
  }, []);

  const handleStartEditName = useCallback(() => {
    setNewName(username || '');
    setNameError('');
    setEditingName(true);
  }, [username]);

  const handleSaveName = useCallback(async () => {
    if (nameSaving) return;
    setNameSaving(true);
    setNameError('');
    const result = await renameUsername(newName);
    if (result.ok) {
      setEditingName(false);
    } else {
      setNameError(result.error || 'Error al guardar');
    }
    setNameSaving(false);
  }, [nameSaving, newName, renameUsername]);

  useEffect(() => {
    if (username) {
      getPracticeHistory(username).then(setPracticeHistory);
    }
  }, [username]);

  const stats: UserStats = useMemo(() => {
    const levelsCompleted = Object.values(game.levelProgress).filter(p => p.completed).length;
    const totalWordsLearned = Object.values(daily.learnedWords).filter(Boolean).length;
    return {
      levelsCompleted,
      streak: game.streak,
      totalWordsLearned,
      gems: game.gems,
      xp: game.xp,
      totalDaysCompleted: daily.totalDaysCompleted,
      practiceSessionsCompleted: 0,
    };
  }, [game, daily]);

  const unlockedAchievements = useMemo(
    () => ACHIEVEMENTS.filter(a => a.check(stats)),
    [stats],
  );

  const levelTitle = useMemo(() => {
    if (stats.levelsCompleted >= 500) return { title: '👑 Maestro', color: '#FFD700' };
    if (stats.levelsCompleted >= 250) return { title: '💎 Experto', color: '#00D4FF' };
    if (stats.levelsCompleted >= 100) return { title: '🥇 Avanzado', color: '#8E5AF5' };
    if (stats.levelsCompleted >= 50) return { title: '🌟 Intermedio', color: '#58CC02' };
    if (stats.levelsCompleted >= 10) return { title: '📖 Aprendiz', color: '#1CB0F6' };
    return { title: '🌱 Principiante', color: '#9CA3AF' };
  }, [stats.levelsCompleted]);

  const progressPct = Math.min(100, Math.round((stats.levelsCompleted / 500) * 100));

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro? Tu progreso está guardado en este dispositivo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: logout },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: '#0D0D18' }]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#0C1A2E', '#0D0D18']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>👤 Perfil</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/stats' as any)} activeOpacity={0.7}>
            <Text style={styles.settingsBtnText}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings' as any)} activeOpacity={0.7}>
            <Text style={styles.settingsBtnText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Selector de avatar */}
        <AvatarPickerModal
          visible={showAvatarPicker}
          current={avatar}
          onSelect={handleSelectAvatar}
          onClose={() => setShowAvatarPicker(false)}
        />

        {/* Tarjeta de usuario — Hero con gradiente */}
        <LinearGradient
          colors={['#0C1A2E', '#0D0D18', '#0D0D18']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.userCard}
        >
          <TouchableOpacity
            style={{ position: 'relative' }}
            onPress={() => setShowAvatarPicker(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#38BDF8', '#38BDF8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarCircle}
            >
              <Text style={{ fontSize: 42 }}>{avatar}</Text>
            </LinearGradient>
            <View style={styles.avatarEditBtn}>
              <Text style={styles.avatarEditIcon}>✏️</Text>
            </View>
          </TouchableOpacity>
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameEditInput}
                value={newName}
                onChangeText={setNewName}
                autoFocus
                maxLength={20}
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
                placeholder="Nuevo nombre"
                placeholderTextColor="#6B7280"
              />
              <TouchableOpacity style={styles.nameEditSave} onPress={handleSaveName} disabled={nameSaving} activeOpacity={0.8}>
                <Text style={styles.nameEditSaveText}>{nameSaving ? '...' : '✓'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nameEditCancel} onPress={() => setEditingName(false)} activeOpacity={0.8}>
                <Text style={styles.nameEditCancelText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{username}</Text>
              <TouchableOpacity style={styles.nameEditBtn} onPress={handleStartEditName} activeOpacity={0.7}>
                <Text style={styles.nameEditBtnIcon}>✏️</Text>
              </TouchableOpacity>
            </View>
          )}
          {nameError ? <Text style={styles.nameError}>{nameError}</Text> : null}
          <View style={[styles.levelBadge, { borderColor: levelTitle.color }]}>
            <Text style={[styles.levelBadgeText, { color: levelTitle.color }]}>{levelTitle.title}</Text>
          </View>

          <View style={styles.courseProgress}>
            <View style={styles.courseProgressRow}>
              <Text style={styles.courseProgressLabel}>Progreso del Curso</Text>
              <Text style={styles.courseProgressPct}>{progressPct}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPct}%` as any }]} />
            </View>
            <Text style={styles.courseProgressSub}>{stats.levelsCompleted} / 500 niveles completados</Text>
          </View>
        </LinearGradient>

        {/* Estadísticas */}
        <Text style={styles.sectionTitle}>📊 Estadísticas</Text>
        <View style={styles.statsGrid}>
          {[
            { label: 'Niveles', value: stats.levelsCompleted, emoji: '🎯', color: '#1CB0F6' },
            { label: 'Racha', value: `${stats.streak} días`, emoji: '🔥', color: '#FF9600' },
            { label: 'Palabras', value: stats.totalWordsLearned, emoji: '📖', color: '#58CC02' },
            { label: 'Diamantes', value: stats.gems, emoji: '💎', color: '#00D4FF' },
            { label: 'XP Total', value: stats.xp.toLocaleString(), emoji: '⭐', color: '#8E5AF5' },
            { label: 'Días Tarea', value: stats.totalDaysCompleted, emoji: '📅', color: '#FF4B4B' },
            { label: 'Desafíos', value: game.dailyChallengesCompleted ?? 0, emoji: '🏆', color: '#FFD700' },
          ].map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statEmoji}>{stat.emoji}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Nivel de inglés estimado A1-B2 */}
        <View style={styles.englishLevelCard}>
          <Text style={styles.englishLevelTitle}>Nivel de Inglés Estimado</Text>
          {(() => {
            const lvls = stats.levelsCompleted;
            let cefr = 'A1', cefrColor = '#9CA3AF', cefrDesc = 'Principiante absoluto', cefrPct = 0;
            if (lvls >= 400) { cefr = 'B2'; cefrColor = '#8E5AF5'; cefrDesc = 'Independiente avanzado'; cefrPct = 95; }
            else if (lvls >= 250) { cefr = 'B1'; cefrColor = '#1CB0F6'; cefrDesc = 'Independiente intermedio'; cefrPct = 70; }
            else if (lvls >= 100) { cefr = 'A2'; cefrColor = '#58CC02'; cefrDesc = 'Usuario básico'; cefrPct = 40; }
            else if (lvls >= 10) { cefr = 'A1+'; cefrColor = '#FF9500'; cefrDesc = 'Principiante avanzado'; cefrPct = 15; }
            else { cefrPct = Math.round((lvls / 10) * 15); }
            return (
              <View>
                <View style={styles.englishLevelRow}>
                  <View style={[styles.englishLevelBadge, { backgroundColor: cefrColor + '22', borderColor: cefrColor }]}>
                    <Text style={[styles.englishLevelBadgeText, { color: cefrColor }]}>{cefr}</Text>
                  </View>
                  <View style={styles.englishLevelInfo}>
                    <Text style={styles.englishLevelName}>{cefrDesc}</Text>
                    <Text style={styles.englishLevelSub}>{lvls} niveles completados</Text>
                  </View>
                </View>
                <View style={styles.englishLevelBarBg}>
                  <View style={[styles.englishLevelBarFill, { width: `${cefrPct}%` as any, backgroundColor: cefrColor }]} />
                </View>
                <View style={styles.englishLevelScale}>
                  {['A1', 'A2', 'B1', 'B2'].map(l => (
                    <Text key={l} style={[styles.englishLevelScaleLabel, l === cefr.replace('+','') && { color: cefrColor, fontWeight: '700' }]}>{l}</Text>
                  ))}
                </View>
              </View>
            );
          })()}
        </View>

        {/* Mapa de calor de actividad */}
        {(() => {
          const today = new Date();
          const days: { date: string; active: boolean }[] = [];
          // Usamos lastDailyDate y totalDaysCompleted para estimar actividad
          // Marcamos como activo el día actual si dailyCompleted, y los últimos N días según streak
          const activeStreak = game.streak;
          for (let i = 89; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            // Activo si está dentro de la racha actual (desde hoy hacia atrás)
            const isInStreak = i < activeStreak;
            const isToday = i === 0 && daily.dailyCompleted;
            days.push({ date: key, active: isInStreak || isToday });
          }
          const weeks: typeof days[] = [];
          for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
          return (
            <View style={styles.heatmapContainer}>
              <Text style={styles.sectionTitle}>🗓 Actividad (90 días)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.heatmapGrid}>
                  {weeks.map((week, wi) => (
                    <View key={wi} style={styles.heatmapWeek}>
                      {week.map((day, di) => (
                        <View
                          key={di}
                          style={[styles.heatmapCell, day.active && styles.heatmapCellActive]}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
              <Text style={styles.heatmapLegend}>
                {days.filter(d => d.active).length} días activos de los últimos 90
              </Text>
            </View>
          );
        })()}

        {/* Acceso rápido a Configuración */}
        <TouchableOpacity style={styles.settingsLink} onPress={() => router.push('/settings' as any)} activeOpacity={0.8}>
          <Text style={styles.settingsLinkEmoji}>⚙️</Text>
          <View style={styles.settingsLinkInfo}>
            <Text style={styles.settingsLinkTitle}>Configuración</Text>
            <Text style={styles.settingsLinkSub}>Apariencia, sonidos y notificaciones</Text>
          </View>
          <Text style={styles.settingsLinkArrow}>›</Text>
        </TouchableOpacity>

        {/* Palabras Difíciles */}
        <HardWordsSection levelErrors={game.levelErrors} />

        {/* Historial de Sesiones de Práctica */}
        {practiceHistory.length > 0 && (
          <View style={styles.practiceHistorySection}>
            <Text style={styles.sectionTitle}>📊 Últimas Sesiones de Práctica</Text>
            {practiceHistory.slice(0, 5).map(session => {
              const accuracy = Math.round((session.correct / session.total) * 100);
              const accuracyColor = accuracy >= 80 ? '#58CC02' : accuracy >= 60 ? '#FF9600' : '#FF4B4B';
              return (
                <View key={session.id} style={styles.practiceHistoryCard}>
                  <View style={styles.practiceHistoryLeft}>
                    <Text style={styles.practiceHistoryDate}>{formatSessionDate(session.date)}</Text>
                    <Text style={styles.practiceHistoryWords}>{session.wordsCount} palabras · {formatDuration(session.durationMs)}</Text>
                  </View>
                  <View style={[styles.practiceHistoryAccuracy, { borderColor: accuracyColor + '40' }]}>
                    <Text style={[styles.practiceHistoryAccuracyNum, { color: accuracyColor }]}>{accuracy}%</Text>
                    <Text style={styles.practiceHistoryAccuracyLabel}>acierto</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Historial de desafíos del día */}
        {(game.challengeHistory ?? []).length > 0 && (
          <View style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={styles.sectionTitle}>🏆 Últimos Desafíos</Text>
              {(game.challengeStreak ?? 0) > 0 && (
                <View style={{ backgroundColor: '#FFD70020', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: '#FFD700' }}>
                  <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: '700' }}>🔥 Racha: {game.challengeStreak}</Text>
                </View>
              )}
            </View>
            {(game.challengeHistory ?? []).map((entry, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1E2022' : '#F5F5F5', borderRadius: 12, padding: 12, marginBottom: 6, gap: 10 }}>
                <Text style={{ fontSize: 22 }}>🏆</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: isDark ? '#ECEDEE' : '#11181C', fontWeight: '700', fontSize: 13 }}>Nivel {entry.levelId}: {entry.levelName}</Text>
                  <Text style={{ color: '#9BA1A6', fontSize: 11, marginTop: 2 }}>{entry.date}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: '700' }}>+{entry.xpEarned} XP</Text>
                  <Text style={{ color: '#00D4FF', fontSize: 12 }}>+{entry.gemsEarned} 💎</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tabla de clasificación local */}
        <LeaderboardSection />

        {/* Logros */}
               <View style={styles.achieveHeader}>
          <Text style={styles.sectionTitle}>🏆 Logros</Text>
          <Text style={styles.achieveCount}>
            {unlockedAchievements.length}/{ACHIEVEMENTS.length}
          </Text>
        </View>

        <View style={styles.achieveProgressBar}>
          <View style={[styles.achieveProgressFill,
            { width: `${Math.round((unlockedAchievements.length / ACHIEVEMENTS.length) * 100)}%` as any },
          ]} />
        </View>

        {/* Preview: primeros 3 logros desbloqueados */}
        <View style={styles.achieveList}>
          {unlockedAchievements.slice(0, 3).map(achievement => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              unlocked={true}
              username={username ?? ''}
            />
          ))}
          {unlockedAchievements.length === 0 && (
            <Text style={{ color: '#9BA1A6', fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>
              Completa niveles para desbloquear logros 🌟
            </Text>
          )}
        </View>

        {/* Botón Ver todos */}
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => router.push('/achievements' as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.viewAllText}>🏆 Ver todos los logros ({ACHIEVEMENTS.length})</Text>
          <Text style={styles.viewAllArrow}>›</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#2D3148',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingsBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#1A1D27', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#2D3148',
  },
  settingsBtnText: { fontSize: 18 },
  logoutBtn: {
    backgroundColor: '#FF4B4B20', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: '#FF4B4B40',
  },
  logoutBtnText: { color: '#FF4B4B', fontSize: 13, fontWeight: '700' },
  settingsLink: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1A1D27', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#2D3148',
  },
  settingsLinkEmoji: { fontSize: 22 },
  settingsLinkInfo: { flex: 1 },
  settingsLinkTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  settingsLinkSub: { fontSize: 12, color: '#9CA3AF' },
  settingsLinkArrow: { fontSize: 22, color: '#6B7280' },
  scroll: { padding: 16, gap: 16 },
  userCard: {
    borderRadius: 24, padding: 24,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#2D1B5E',
    overflow: 'hidden',
  },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#FFFFFF' },
  userName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  levelBadge: {
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
    borderWidth: 2, marginBottom: 16,
  },
  levelBadgeText: { fontSize: 14, fontWeight: '700' },
  courseProgress: { width: '100%' },
  courseProgressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  courseProgressLabel: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  courseProgressPct: { fontSize: 13, color: '#58CC02', fontWeight: '700' },
  progressBarBg: { height: 10, backgroundColor: '#2D3148', borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: 10, backgroundColor: '#58CC02', borderRadius: 5 },
  courseProgressSub: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '30%', flex: 1, minWidth: 90,
    backgroundColor: '#1A1D27', borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#2D3148',
  },
  statEmoji: { fontSize: 24, marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textAlign: 'center' },
  // Notificaciones
  notifSection: { gap: 10 },
  notifBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1A1D27', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#2D3148',
  },
  notifBannerActive: { borderColor: '#FF960040', backgroundColor: '#FF960010' },
  notifBannerEmoji: { fontSize: 28 },
  notifBannerText: { flex: 1 },
  notifBannerTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 3 },
  notifBannerSub: { fontSize: 12, color: '#9CA3AF', lineHeight: 17 },
  notifCard: {
    backgroundColor: '#1A1D27', borderRadius: 16,
    borderWidth: 1, borderColor: '#2D3148', overflow: 'hidden',
  },
  notifRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16,
  },
  notifRowLeft: { flex: 1, marginRight: 12 },
  notifRowTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 3 },
  notifRowSub: { fontSize: 12, color: '#9CA3AF' },
  timeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: '#2D3148',
  },
  timeRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeRowEmoji: { fontSize: 22 },
  timeRowTitle: { fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginBottom: 2 },
  timeRowValue: { fontSize: 18, fontWeight: '800', color: '#8E5AF5' },
  timeRowArrow: { fontSize: 24, color: '#6B7280', fontWeight: '300' },
  timeRowDisabled: { opacity: 0.5 },
  // Modal picker
  modalOverlay: {
    flex: 1, backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#1A1D27', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 20 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pickerCol: { alignItems: 'center', width: 80 },
  pickerLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginBottom: 8 },
  pickerList: { height: 180, width: 80 },
  pickerItem: {
    height: 44, justifyContent: 'center', alignItems: 'center',
    borderRadius: 10, marginVertical: 2,
  },
  pickerItemSelected: { backgroundColor: '#8E5AF520', borderWidth: 1.5, borderColor: '#8E5AF5' },
  pickerItemText: { fontSize: 20, fontWeight: '600', color: '#6B7280' },
  pickerItemTextSelected: { color: '#8E5AF5', fontWeight: '800' },
  pickerColon: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginTop: 20 },
  timePreview: {
    alignItems: 'center', marginVertical: 16,
    backgroundColor: '#0F1117', borderRadius: 14, paddingVertical: 12,
  },
  timePreviewText: { fontSize: 32, fontWeight: '800', color: '#8E5AF5', letterSpacing: 2 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtnCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#2D3148', alignItems: 'center',
  },
  modalBtnCancelText: { color: '#9CA3AF', fontWeight: '700', fontSize: 15 },
  modalBtnConfirm: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#8E5AF5', alignItems: 'center',
  },
  modalBtnConfirmText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  // Logros
  achieveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  achieveCount: { fontSize: 14, color: '#FFD700', fontWeight: '700' },
  achieveProgressBar: {
    height: 6, backgroundColor: '#2D3148', borderRadius: 3, overflow: 'hidden',
    marginTop: -8,
  },
  achieveProgressFill: { height: 6, backgroundColor: '#FFD700', borderRadius: 3 },
  achieveList: { gap: 8 },
  achieveCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1A1D27', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#FFD70030',
  },
  achieveCardLocked: { borderColor: '#2D3148', opacity: 0.6 },
  achieveEmoji: { fontSize: 28, width: 36, textAlign: 'center' },
  achieveEmojiLocked: { opacity: 0.5 },
  achieveInfo: { flex: 1 },
  achieveTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  achieveTitleLocked: { color: '#6B7280' },
  achieveDesc: { fontSize: 12, color: '#9CA3AF', lineHeight: 16 },
  achieveDescLocked: { color: '#4B5563' },
  achieveCheck: { fontSize: 18 },
  achieveShareBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#8E5AF520', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#8E5AF540',
  },
  achieveShareIcon: { fontSize: 16 },
  // Apariencia / Tema
  appearanceCard: {
    backgroundColor: '#1A1D27', borderRadius: 16,
    borderWidth: 1, borderColor: '#2D3148', overflow: 'hidden',
  },
  themeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
  },
  themeEmoji: { fontSize: 26, width: 32, textAlign: 'center' },
  themeInfo: { flex: 1 },
  themeTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  themeSub: { fontSize: 12, color: '#9CA3AF' },
  resetThemeBtn: {
    borderTopWidth: 1, borderTopColor: '#2D3148',
    paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center',
  },
  resetThemeBtnText: { fontSize: 13, color: '#8E5AF5', fontWeight: '600' },
  // Palabras Difíciles
  hardWordsSection: { gap: 10 },
  hardWordsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hardWordsSubtitle: { fontSize: 12, color: '#FF4B4B', fontWeight: '700' },
  hardWordsList: { gap: 8 },
  hardWordRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1A1D27', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: '#FF4B4B20',
  },
  hardWordRank: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#2D3148', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#4B5563',
  },
  hardWordRank1: { backgroundColor: '#FFD70020', borderColor: '#FFD700' },
  hardWordRank2: { backgroundColor: '#C0C0C020', borderColor: '#C0C0C0' },
  hardWordRank3: { backgroundColor: '#CD7F3220', borderColor: '#CD7F32' },
  hardWordRankText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  hardWordInfo: { flex: 1 },
  hardWordNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  hardWordEn: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  hardWordPhonetic: { fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' },
  hardWordEs: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  hardWordFails: { alignItems: 'center' },
  hardWordFailCount: { fontSize: 20, fontWeight: '800', color: '#FF4B4B' },
  hardWordFailLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  hardWordsEmpty: {
    backgroundColor: '#1A1D27', borderRadius: 14, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#2D3148',
  },
  hardWordsEmptyEmoji: { fontSize: 36, marginBottom: 8 },
  hardWordsEmptyText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  hardWordsEmptySubtext: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },
  practiceBtn: {
    backgroundColor: '#FF4B4B20', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#FF4B4B60',
  },
  practiceBtnText: { color: '#FF4B4B', fontSize: 14, fontWeight: '800' },
  // Historial de sesiones de práctica
  practiceHistorySection: { gap: 8 },
  practiceHistoryCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1A1D27', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#2D3148',
  },
  practiceHistoryLeft: { flex: 1, gap: 3 },
  practiceHistoryDate: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  practiceHistoryWords: { fontSize: 12, color: '#9CA3AF' },
  practiceHistoryAccuracy: {
    alignItems: 'center', backgroundColor: '#0F1117',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1.5, minWidth: 64,
  },
  practiceHistoryAccuracyNum: { fontSize: 18, fontWeight: '800' },
  practiceHistoryAccuracyLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  // Avatar picker
  avatarModalOverlay: {
    flex: 1, backgroundColor: '#00000088',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  avatarModalBox: {
    backgroundColor: '#1A1D27', borderRadius: 24, padding: 24,
    width: '100%', maxWidth: 360,
    borderWidth: 1, borderColor: '#2D3148',
  },
  avatarModalTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginBottom: 4 },
  avatarModalSub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 20 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 20 },
  avatarOption: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#0F1117', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#2D3148',
  },
  avatarOptionSelected: { borderColor: '#8E5AF5', backgroundColor: '#8E5AF520' },
  avatarOptionEmoji: { fontSize: 26 },
  avatarModalClose: {
    backgroundColor: '#2D3148', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  avatarModalCloseText: { color: '#9CA3AF', fontWeight: '700', fontSize: 15 },
  // Avatar edit button
  avatarEditBtn: {
    position: 'absolute', bottom: -4, right: -4,
    backgroundColor: '#8E5AF5', borderRadius: 12,
    width: 24, height: 24, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#1A1D27',
  },
  avatarEditIcon: { fontSize: 12 },
  // Edición de nombre
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  nameEditBtn: {
    backgroundColor: '#2D3148', borderRadius: 12,
    width: 26, height: 26, justifyContent: 'center', alignItems: 'center',
  },
  nameEditBtnIcon: { fontSize: 12 },
  nameEditRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4,
    paddingHorizontal: 8,
  },
  nameEditInput: {
    flex: 1, backgroundColor: '#0F1117', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 15, fontWeight: '700', color: '#FFFFFF',
    borderWidth: 1.5, borderColor: '#8E5AF5',
    textAlign: 'center',
  },
  nameEditSave: {
    backgroundColor: '#8E5AF5', borderRadius: 10,
    width: 34, height: 34, justifyContent: 'center', alignItems: 'center',
  },
  nameEditSaveText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  nameEditCancel: {
    backgroundColor: '#2D3148', borderRadius: 10,
    width: 34, height: 34, justifyContent: 'center', alignItems: 'center',
  },
  nameEditCancelText: { color: '#9CA3AF', fontSize: 16, fontWeight: '700' },
  nameError: { fontSize: 12, color: '#FF4B4B', marginTop: 4, textAlign: 'center' },
  // Nivel de inglés A1-B2
  englishLevelCard: {
    backgroundColor: '#1A1D27', borderRadius: 16, padding: 16,
    marginVertical: 8, borderWidth: 1, borderColor: '#2D3148',
  },
  englishLevelTitle: { fontSize: 13, color: '#9CA3AF', fontWeight: '700', marginBottom: 12, textTransform: 'uppercase' },
  englishLevelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  englishLevelBadge: {
    width: 56, height: 56, borderRadius: 12, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  englishLevelBadgeText: { fontSize: 20, fontWeight: '900' },
  englishLevelInfo: { flex: 1 },
  englishLevelName: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  englishLevelSub: { fontSize: 12, color: '#9CA3AF' },
  englishLevelBarBg: { height: 8, backgroundColor: '#2D3148', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  englishLevelBarFill: { height: 8, borderRadius: 4 },
  englishLevelScale: { flexDirection: 'row', justifyContent: 'space-between' },
  englishLevelScaleLabel: { fontSize: 11, color: '#4B5563', fontWeight: '600' },
  // Mapa de calor
  heatmapContainer: { marginVertical: 8 },
  heatmapGrid: { flexDirection: 'row', gap: 3 },
  heatmapWeek: { flexDirection: 'column', gap: 3 },
  heatmapCell: {
    width: 12, height: 12, borderRadius: 2,
    backgroundColor: '#2D3148',
  },
  heatmapCellActive: { backgroundColor: '#58CC02' },
  heatmapLegend: { fontSize: 11, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },
  viewAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1E2022', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    marginHorizontal: 16, marginTop: 10, borderWidth: 1, borderColor: '#2A2D2E',
  },
  viewAllText: { fontSize: 14, fontWeight: '600', color: '#ECEDEE' },
  viewAllArrow: { fontSize: 20, color: '#38BDF8', fontWeight: '700' },
});
