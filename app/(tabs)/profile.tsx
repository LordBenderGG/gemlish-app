'use client';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Alert, Switch, Modal, FlatList, Platform, Share,
} from 'react-native';
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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { username, game, daily, logout } = useGame();
  const { colorScheme, setColorScheme, isManual, resetToSystem } = useThemeContext();
  const isDark = colorScheme === 'dark';
  const [practiceHistory, setPracticeHistory] = useState<PracticeSession[]>([]);

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>👤 Perfil</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Tarjeta de usuario */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {username ? username.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={styles.userName}>{username}</Text>
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
        </View>

        {/* Apariencia */}
        <Text style={styles.sectionTitle}>🎨 Apariencia</Text>
        <View style={styles.appearanceCard}>
          <View style={styles.themeRow}>
            <Text style={styles.themeEmoji}>{isDark ? '🌙' : '☀️'}</Text>
            <View style={styles.themeInfo}>
              <Text style={styles.themeTitle}>{isDark ? 'Modo Oscuro' : 'Modo Claro'}</Text>
              <Text style={styles.themeSub}>
                {isManual ? 'Configurado manualmente' : 'Siguiendo el sistema'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={val => setColorScheme(val ? 'dark' : 'light')}
              trackColor={{ false: '#FFD70040', true: '#8E5AF540' }}
              thumbColor={isDark ? '#8E5AF5' : '#FFD700'}
            />
          </View>
          {isManual && (
            <TouchableOpacity style={styles.resetThemeBtn} onPress={resetToSystem} activeOpacity={0.8}>
              <Text style={styles.resetThemeBtnText}>↩ Usar tema del sistema</Text>
            </TouchableOpacity>
          )}
        </View>

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
          ].map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statEmoji}>{stat.emoji}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Notificaciones */}
        <NotificationsSection />

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

        {/* Logros */}
        <View style={styles.achieveHeader}>
          <Text style={styles.sectionTitle}>🏆 Logros</Text>
          <Text style={styles.achieveCount}>
            {unlockedAchievements.length}/{ACHIEVEMENTS.length}
          </Text>
        </View>

        <View style={styles.achieveProgressBar}>
          <View style={[
            styles.achieveProgressFill,
            { width: `${Math.round((unlockedAchievements.length / ACHIEVEMENTS.length) * 100)}%` as any },
          ]} />
        </View>

        <View style={styles.achieveList}>
          {ACHIEVEMENTS.map(achievement => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              unlocked={achievement.check(stats)}
              username={username ?? ''}
            />
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#2D3148',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  logoutBtn: {
    backgroundColor: '#FF4B4B20', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: '#FF4B4B40',
  },
  logoutBtnText: { color: '#FF4B4B', fontSize: 13, fontWeight: '700' },
  scroll: { padding: 16, gap: 16 },
  userCard: {
    backgroundColor: '#1A1D27', borderRadius: 20, padding: 20,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#2D3148',
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#8E5AF5', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, borderWidth: 3, borderColor: '#8E5AF540',
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
});
