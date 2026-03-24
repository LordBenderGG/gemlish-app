/**
 * useNotifications — Gestión de notificaciones diarias de Gemlish
 * Permite al usuario configurar un recordatorio diario a una hora específica
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { kvGet, kvSet, kvRemove } from '@/lib/local-kv';

const Notifications =
  Platform.OS === 'web'
    ? {
        setNotificationHandler: () => {},
        getPermissionsAsync: async () => ({ status: 'denied' as const }),
        requestPermissionsAsync: async () => ({ status: 'denied' as const }),
        setNotificationChannelAsync: async () => {},
        cancelScheduledNotificationAsync: async () => {},
        scheduleNotificationAsync: async () => '',
        AndroidImportance: {
          HIGH: 4,
          DEFAULT: 3,
        },
        SchedulableTriggerInputTypes: {
          DAILY: 'daily',
          CALENDAR: 'calendar',
        },
      }
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      (require('expo-notifications') as typeof import('expo-notifications'));

const NOTIFICATION_HOUR_KEY = '@gemlish_notification_hour';
const NOTIFICATION_MINUTE_KEY = '@gemlish_notification_minute';
const NOTIFICATION_ENABLED_KEY = '@gemlish_notification_enabled';
const NOTIFICATION_ID_KEY = '@gemlish_notification_id';
const WEEKLY_NOTIFICATION_ID_KEY = '@gemlish_weekly_notification_id';

// Configurar cómo se muestran las notificaciones en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    hour: 20,
    minute: 0,
  });
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar configuración guardada
  useEffect(() => {
    loadSettings();
  }, []);

  // Re-verificar permisos cuando el usuario vuelve a la app desde Configuración del sistema
  const appState = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        // La app volvió al primer plano — re-verificar permisos
        const { status } = await Notifications.getPermissionsAsync();
        const isGranted = status === 'granted';
        setPermissionGranted(isGranted);

        if (isGranted) {
          // Si el permiso fue concedido, actualizar el estado habilitado
          const savedEnabled = await kvGet(NOTIFICATION_ENABLED_KEY);
          if (savedEnabled === 'true') {
            setSettings(prev => ({ ...prev, enabled: true }));
          }
        } else {
          // Si el permiso fue revocado, deshabilitar
          setSettings(prev => ({ ...prev, enabled: false }));
          await kvSet(NOTIFICATION_ENABLED_KEY, 'false');
        }
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, []);

  const loadSettings = async () => {
    try {
      const [enabled, hour, minute] = await Promise.all([
        kvGet(NOTIFICATION_ENABLED_KEY),
        kvGet(NOTIFICATION_HOUR_KEY),
        kvGet(NOTIFICATION_MINUTE_KEY),
      ]);

      // Verificar permisos actuales del sistema (fuente de verdad)
      const { status } = await Notifications.getPermissionsAsync();
      const isGranted = status === 'granted';
      setPermissionGranted(isGranted);

      // Si el permiso fue revocado por el usuario, sincronizar enabled a false
      const wasEnabled = enabled === 'true';
      const effectiveEnabled = wasEnabled && isGranted;

      if (wasEnabled && !isGranted) {
        // El usuario revoció el permiso desde Configuración del sistema
        await kvSet(NOTIFICATION_ENABLED_KEY, 'false');
      }

      setSettings({
        enabled: effectiveEnabled,
        hour: hour ? parseInt(hour, 10) : 20,
        minute: minute ? parseInt(minute, 10) : 0,
      });
    } catch (err) {
      console.warn('[useNotifications] Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Android: crear canal SIEMPRE antes de verificar permisos
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('gemlish-daily', {
          name: 'Recordatorio Diario',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#8E5AF5',
          sound: 'default',
        });
        // Verificar si el permiso ya está concedido (evitar prompt innecesario)
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        if (existingStatus?.trim().toLowerCase() === 'granted') {
          setPermissionGranted(true);
          return true;
        }
        // Si no estamos seguros o está denegado, solicitar permiso
        const { status } = await Notifications.requestPermissionsAsync();
        // En Android 12 y anteriores los permisos siempre son granted
        // En Android 13+ se necesita POST_NOTIFICATIONS (ya en AndroidManifest)
        // Tratamos tanto 'granted' como 'undetermined' como éxito
        const granted = status === 'granted' || status === 'undetermined';
        setPermissionGranted(granted);
        return granted;
      }

      // iOS: solicitar permiso explícito
      const { status: existingStatus } = await Notifications.getNotificationsAsync();
      if (existingStatus === 'granted') {
        setPermissionGranted(true);
        return true;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);
      return granted;
    } catch (err) {
      console.warn('[useNotifications] Error requesting permission:', err);
      return false;
    }
  }, []);

  const scheduleDaily = useCallback(async (hour: number, minute: number, nextLevelName?: string): Promise<boolean> => {
    try {
      // Validar que hora y minuto sean números enteros válidos
      if (!Number.isInteger(hour) || hour < 0 || hour > 23 ||
          !Number.isInteger(minute) || minute < 0 || minute > 59) {
        console.warn('[useNotifications] Invalid time for scheduling:', { hour, minute });
        return false;
      }

      // Cancelar notificación anterior
      const prevId = await kvGet(NOTIFICATION_ID_KEY);
      if (prevId) {
        await Notifications.cancelScheduledNotificationAsync(prevId).catch(() => {});
      }

      // Asegurarnos de que el canal de notificaciones exista y esté configurado correctamente
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('gemlish-daily', {
          name: 'Recordatorio Diario',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#8E5AF5',
          sound: 'default',
        });
      }

      // Verificar que la hora de programación no haya pasado ya
      const now = new Date();
      const targetToday = new Date();
      targetToday.setHours(hour, minute, 0, 0);
      if (now >= targetToday) {
        // Ya pasó la hora de hoy, no programar (se programará para mañana automáticamente por la lógica de expo-notifications)
        // Pero para evitar confusiones, dejamos que expo-notifications maneje la programación para el próximo día
        // Sin embargo, registramos esto para depuración
        console.log('[useNotifications] Attempting to schedule for past time, will schedule for next day:', { hour, minute });
      }

      // Programar nueva notificación diaria personalizada
      let msg: { title: string; body: string };
      if (nextLevelName) {
        // Notificación personalizada con el nombre del siguiente nivel
        const personalizedMessages = [
          { title: '🔥 ¡No rompas tu racha!', body: `Hoy aprende ${nextLevelName} en Gemlish. ¡Sólo 20 ejercicios!` },
          { title: `🌟 ¡${nextLevelName} te espera!`, body: 'Completa tu tarea diaria y gana XP y gemas.' },
          { title: '🚀 ¡Sigue avanzando!', body: `Hoy toca ${nextLevelName}. ¡Puedes hacerlo!` },
          { title: '📅 Tarea Diaria lista', body: `Aprende ${nextLevelName} hoy y mantén tu racha.` },
        ];
        msg = personalizedMessages[Math.floor(Math.random() * personalizedMessages.length)];
      } else {
        const genericMessages = [
          { title: '🔥 ¡No rompas tu racha!', body: 'Completa tu tarea diaria de inglés en Gemlish.' },
          { title: '💎 ¡Gana diamantes hoy!', body: 'Aprende 30 palabras nuevas y gana recompensas.' },
          { title: '🚀 ¡Sigue avanzando!', body: 'Tu próximo nivel te espera en Gemlish.' },
          { title: '📅 Tarea Diaria lista', body: '30 palabras nuevas te esperan hoy en Gemlish.' },
        ];
        msg = genericMessages[Math.floor(Math.random() * genericMessages.length)];
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.title,
          body: msg.body,
          sound: 'default',
          data: { screen: 'daily' },
          ...(Platform.OS === 'android' && { channelId: 'gemlish-daily' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        } as any,
      });

      await kvSet(NOTIFICATION_ID_KEY, id);
      return true;
    } catch (err) {
      console.warn('[useNotifications] Error scheduling notification:', err);
      return false;
    }
  }, []);

  const enableNotifications = useCallback(async (hour: number, minute: number, nextLevelName?: string): Promise<boolean> => {
    const granted = await requestPermission();
    if (!granted) return false;

    const scheduled = await scheduleDaily(hour, minute, nextLevelName);
    if (!scheduled) return false;

    await Promise.all([
      kvSet(NOTIFICATION_ENABLED_KEY, 'true'),
      kvSet(NOTIFICATION_HOUR_KEY, String(hour)),
      kvSet(NOTIFICATION_MINUTE_KEY, String(minute)),
    ]);

    setSettings({ enabled: true, hour, minute });
    return true;
  }, [requestPermission, scheduleDaily]);

  const disableNotifications = useCallback(async () => {
    try {
      const prevId = await kvGet(NOTIFICATION_ID_KEY);
      if (prevId) {
        await Notifications.cancelScheduledNotificationAsync(prevId).catch(() => {});
        await kvRemove(NOTIFICATION_ID_KEY);
      }
      await kvSet(NOTIFICATION_ENABLED_KEY, 'false');
      setSettings(prev => ({ ...prev, enabled: false }));
    } catch (err) {
      console.warn('[useNotifications] Error disabling:', err);
    }
  }, []);

  const updateTime = useCallback(async (hour: number, minute: number) => {
    if (settings.enabled) {
      await enableNotifications(hour, minute);
    } else {
      await Promise.all([
        kvSet(NOTIFICATION_HOUR_KEY, String(hour)),
        kvSet(NOTIFICATION_MINUTE_KEY, String(minute)),
      ]);
      setSettings(prev => ({ ...prev, hour, minute }));
    }
  }, [settings.enabled, enableNotifications]);

  /**
   * Programa una notificación de resumen semanal los lunes a las 9:00 AM.
   * Incluye niveles completados la semana pasada, racha actual y palabras aprendidas.
   */
  /**
   * Programa la notificación diaria de Desafío del día a las 8:00 AM.
   * Informa el nivel del desafío, su tema y la recompensa doble.
   * Solo se programa una vez por día para evitar duplicados.
   *
   * @param levelId - ID del nivel del desafío del día
   * @param levelName - Nombre del tema del nivel
   * @param xpEarned - XP que se ganarán al completarlo (ya incluye x2)
   * @param gemsEarned - Diamantes que se ganarán al completarlo (ya incluye x2)
   */
  const scheduleDailyChallengeNotification = useCallback(async (params: {
    levelId: number;
    levelName: string;
    xpEarned: number;
    gemsEarned: number;
  }): Promise<void> => {
    const CHALLENGE_NOTIF_KEY = '@gemlish_challenge_notif_id';
    const CHALLENGE_NOTIF_DATE_KEY = '@gemlish_challenge_notif_date';
    const today = new Date().toISOString().split('T')[0];

    try {
      const granted = await requestPermission();
      if (!granted) return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('gemlish-daily-challenge', {
          name: 'Desafío del día',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 200, 250],
          lightColor: '#FFD700',
          sound: 'default',
        });
      }

      // Verificar si ya se programó hoy
      const prevDate = await kvGet(CHALLENGE_NOTIF_DATE_KEY);
      if (prevDate === today) return;

      // Cancelar notificación anterior si existe
      const prevId = await kvGet(CHALLENGE_NOTIF_KEY);
      if (prevId) {
        await Notifications.cancelScheduledNotificationAsync(prevId).catch(() => {});
        await kvRemove(CHALLENGE_NOTIF_KEY);
      }

      // Verificar que las 8:00 no hayan pasado ya
      const now = new Date();
      const target = new Date();
      target.setHours(8, 0, 0, 0);
      if (now >= target) return; // Ya pasaron las 8:00 AM, no programar

      const { levelId, levelName, xpEarned, gemsEarned } = params;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎯 ¡Desafío del día disponible!',
          body: `Nivel ${levelId}: ${levelName} — Gana ${xpEarned} XP y ${gemsEarned} 💎 con recompensa ×2`,
          sound: 'default',
          data: { screen: 'home' },
          ...(Platform.OS === 'android' && { channelId: 'gemlish-daily-challenge' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: 8,
          minute: 0,
          repeats: false,
        } as any,
      });

      await kvSet(CHALLENGE_NOTIF_KEY, id);
      await kvSet(CHALLENGE_NOTIF_DATE_KEY, today);
    } catch (err) {
      console.warn('[useNotifications] Error scheduling daily challenge notification:', err);
    }
  }, [requestPermission]);

  /**
   * Programa (o cancela) el recordatorio de racha en riesgo a las 20:00.
   * Se activa solo si el usuario tiene racha >= 3 y no ha completado ningún nivel hoy.
   * Debe llamarse cada vez que el usuario abre la app o completa un nivel.
   *
   * @param streak - Racha actual del usuario en días
   * @param completedTodayCount - Número de niveles completados hoy (0 = en riesgo)
   */
  const scheduleStreakRiskReminder = useCallback(async (params: {
    streak: number;
    completedTodayCount: number;
  }): Promise<void> => {
    const RISK_NOTIF_KEY = '@gemlish_streak_risk_id';
    const RISK_NOTIF_DATE_KEY = '@gemlish_streak_risk_date';
    const today = new Date().toISOString().split('T')[0];

    try {
      const granted = await requestPermission();
      if (!granted) return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('gemlish-streak-risk', {
          name: 'Racha en riesgo',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 300, 200, 300],
          lightColor: '#FF6B00',
          sound: 'default',
        });
      }

      // Cancelar recordatorio anterior del día si existe
      const prevId = await kvGet(RISK_NOTIF_KEY);
      const prevDate = await kvGet(RISK_NOTIF_DATE_KEY);
      if (prevId) {
        await Notifications.cancelScheduledNotificationAsync(prevId).catch(() => {});
        await kvRemove(RISK_NOTIF_KEY);
      }

      const { streak, completedTodayCount } = params;

      // Solo programar si: racha >= 3 y no ha completado ningún nivel hoy
      if (streak < 3 || completedTodayCount > 0) return;

      // Verificar si ya se programó hoy (evitar duplicados)
      if (prevDate === today) return;

      // Verificar que las 20:00 no hayan pasado ya
      const now = new Date();
      const targetToday = new Date();
      targetToday.setHours(20, 0, 0, 0);
      if (now >= targetToday) return; // Ya pasaron las 20:00, no programar

      const messages = [
        { title: `🔥 ¡Tu racha de ${streak} días está en riesgo!`, body: 'Completa un nivel hoy para mantenerla. ¡Solo te quedan unas horas!' },
        { title: `⚠️ ¡No pierdas tu racha de ${streak} días!`, body: 'Aún puedes salvarla. Entra a Gemlish y completa un nivel ahora.' },
        { title: `💔 ¡Racha de ${streak} días en peligro!`, body: 'Tienes hasta medianoche. ¡Entra y completa un nivel!' },
      ];
      const msg = messages[Math.floor(Math.random() * messages.length)];

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.title,
          body: msg.body,
          sound: 'default',
          data: { screen: 'home' },
          ...(Platform.OS === 'android' && { channelId: 'gemlish-streak-risk' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: 20,
          minute: 0,
          repeats: false, // Solo una vez, no repetir
        } as any,
      });

      await kvSet(RISK_NOTIF_KEY, id);
      await kvSet(RISK_NOTIF_DATE_KEY, today);
    } catch (err) {
      console.warn('[useNotifications] Error scheduling streak risk reminder:', err);
    }
  }, [requestPermission]);

  const scheduleWeeklySummary = useCallback(async (params: {
    levelsLastWeek: number;
    streak: number;
    wordsLearned: number;
  }): Promise<void> => {
    try {
      const granted = await requestPermission();
      if (!granted) return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('gemlish-weekly', {
          name: 'Resumen Semanal',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
        });
      }

      // Cancelar resumen semanal anterior
      const prevId = await kvGet(WEEKLY_NOTIFICATION_ID_KEY);
      if (prevId) {
        await Notifications.cancelScheduledNotificationAsync(prevId).catch(() => {});
      }

      const { levelsLastWeek, streak, wordsLearned } = params;
      const title = '📊 Tu resumen semanal de Gemlish';
      const body = [
        levelsLastWeek > 0 ? `🏆 ${levelsLastWeek} niveles completados esta semana` : '💪 ¡Empieza esta semana con fuerza!',
        streak > 0 ? `🔥 Racha actual: ${streak} días` : '',
        wordsLearned > 0 ? `📚 ${wordsLearned} palabras aprendidas en total` : '',
      ].filter(Boolean).join(' · ');

      // Programar para el próximo lunes a las 9:00 AM
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          data: { screen: 'stats' },
          ...(Platform.OS === 'android' && { channelId: 'gemlish-weekly' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          weekday: 2, // Lunes (1=Domingo, 2=Lunes)
          hour: 9,
          minute: 0,
          repeats: true,
        } as any,
      });

      await kvSet(WEEKLY_NOTIFICATION_ID_KEY, id);
    } catch (err) {
      console.warn('[useNotifications] Error scheduling weekly summary:', err);
    }
  }, [requestPermission]);

  return {
    settings,
    permissionGranted,
    loading,
    enableNotifications,
    disableNotifications,
    updateTime,
    requestPermission,
    scheduleWeeklySummary,
    scheduleStreakRiskReminder,
    scheduleDailyChallengeNotification,
  };
}
