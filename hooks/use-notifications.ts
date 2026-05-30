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
          DATE: 'date',
          WEEKLY: 'weekly',
        },
      }
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      (require('expo-notifications') as typeof import('expo-notifications'));

const NOTIFICATION_HOUR_KEY = '@gemlish_notification_hour';
const NOTIFICATION_MINUTE_KEY = '@gemlish_notification_minute';
const NOTIFICATION_ENABLED_KEY = '@gemlish_notification_enabled';
const NOTIFICATION_ID_KEY = '@gemlish_notification_id';
const WEEKLY_NOTIFICATION_ID_KEY = '@gemlish_weekly_notification_id';

// Configurar cómo se muestran las notificaciones en foreground.
// El guard evita registrar el handler más de una vez si el módulo
// se re-evalúa durante hot-reload en desarrollo.
let _notificationHandlerInitialized = false;
if (!_notificationHandlerInitialized) {
  _notificationHandlerInitialized = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export interface NotificationSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    hour: 14,  // 2:00 PM
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

      // Fresh install: persist defaults para que rescheduleDaily funcione
      if (enabled === null) {
        await kvSet(NOTIFICATION_ENABLED_KEY, 'true');
        await kvSet(NOTIFICATION_HOUR_KEY, '14');
        await kvSet(NOTIFICATION_MINUTE_KEY, '0');
      }

      let parsedHour = hour ? parseInt(hour, 10) : 14;
      let parsedMinute = minute ? parseInt(minute, 10) : 0;
      // Migración: old default era 8:00 AM, nuevo default es 2:00 PM
      if (parsedHour === 8 && parsedMinute === 0 && hour !== null) {
        parsedHour = 14;
        parsedMinute = 0;
        await kvSet(NOTIFICATION_HOUR_KEY, '14');
        await kvSet(NOTIFICATION_MINUTE_KEY, '0');
      }

      setSettings({
        enabled: effectiveEnabled,
        hour: parsedHour,
        minute: parsedMinute,
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
        const permissionStatus = await Notifications.getPermissionsAsync();
        // Extraer status de forma segura
        let existingStatus = '';
        if (permissionStatus && typeof permissionStatus === 'object' && permissionStatus.status != null) {
          existingStatus = String(permissionStatus.status);
        }
        // Normalizar de forma segura
        existingStatus = existingStatus.trim().toLowerCase();

        // Si ya está concedido, retornar true directamente sin molestar al usuario
        if (existingStatus === 'granted') {
          setPermissionGranted(true);
          return true;
        }
        // 'undetermined' = nunca fue preguntado, 'denied' = denegado
        // En ambos casos solicitar permiso explícitamente
        const { status } = await Notifications.requestPermissionsAsync();
        // En Android 12 y anteriores los permisos de notificaciones siempre son granted
        // En Android 13+ (API 33+) se necesita solicitar POST_NOTIFICATIONS en runtime
        let requestStatus = '';
        if (status != null) {
          requestStatus = String(status);
        }
        requestStatus = requestStatus.trim().toLowerCase();
        const granted = requestStatus === 'granted';
        setPermissionGranted(granted);
        return granted;
      }

      // iOS: solicitar permiso explícito
      const permissionStatus = await Notifications.getPermissionsAsync();
      let existingStatus = '';
      if (permissionStatus && typeof permissionStatus === 'object' && permissionStatus.status != null) {
        existingStatus = String(permissionStatus.status);
      }
      existingStatus = existingStatus.trim().toLowerCase();
      
      if (existingStatus === 'granted') {
        setPermissionGranted(true);
        return true;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      let requestStatus = '';
      if (status != null) {
        requestStatus = String(status);
      }
      requestStatus = requestStatus.trim().toLowerCase();
      const granted = requestStatus === 'granted';
      setPermissionGranted(granted);
      return granted;
    } catch (err) {
      console.warn('[useNotifications] Error requesting permission:', err);
      // En caso de error, retornar false de forma segura (no asumir permiso concedido)
      return false;
    }
  }, []);

  const scheduleDaily = useCallback(async (nextLevelName?: string): Promise<boolean> => {
    try {
      // Cancelar notificación anterior si existe
      const prevId = await kvGet(NOTIFICATION_ID_KEY);
      if (prevId) {
        await Notifications.cancelScheduledNotificationAsync(prevId).catch(() => {});
      }

      // Crear canal en Android (obligatorio para que suene)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('gemlish-daily', {
          name: 'Recordatorio Diario',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#8E5AF5',
          sound: 'default',
        });
      }

      const messages = nextLevelName
        ? [
            { title: '🔥 ¡No rompas tu racha!', body: `Hoy aprende ${nextLevelName} en Gemlish. ¡Solo 20 ejercicios!` },
            { title: `🌟 ¡${nextLevelName} te espera!`, body: 'Completa tu tarea diaria y gana XP y gemas.' },
            { title: '🚀 ¡Sigue avanzando!', body: `Hoy toca ${nextLevelName}. ¡Puedes hacerlo!` },
          ]
        : [
            { title: '📚 Hora de estudiar', body: 'Completa tu tarea diaria de inglés en Gemlish.' },
            { title: '🔥 ¡No rompas tu racha!', body: '30 palabras nuevas te esperan hoy en Gemlish.' },
            { title: '💎 ¡Gana diamantes hoy!', body: 'Aprende 30 palabras nuevas y gana recompensas.' },
          ];
      const msg = messages[Math.floor(Math.random() * messages.length)];

      // ── CORRECCIÓN CRÍTICA ────────────────────────────────────────────────────
      // El trigger DAILY de expo-notifications falla en Android con:
      //   "Trigger of type: calendar is not supported on Android"
      // (GitHub issue #30577, afecta expo-notifications 0.32.x en Android)
      //
      // Solución: calcular la próxima ocurrencia de la hora configurada y usar
      // trigger DATE (funciona correctamente en Android). Como DATE es one-time,
      // la notificación se re-programa cada vez que el usuario abre la app
      // (ver AuthGuard en app/_layout.tsx → rescheduleDaily).
      const now = new Date();
      const target = new Date();
      target.setHours(settings.hour, settings.minute, 0, 0);
      if (target <= now) {
        // La hora de hoy ya pasó → programar para mañana a la misma hora
        target.setDate(target.getDate() + 1);
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
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          timestamp: target.getTime(),
        } as any,
      });

      await kvSet(NOTIFICATION_ID_KEY, id).catch(() => {});
      return true;
    } catch (err) {
      console.warn('[useNotifications] scheduleDaily error:', err);
      return false;
    }
  }, [settings.hour, settings.minute]);

  const enableNotifications = useCallback(async (nextLevelName?: string): Promise<'ok' | 'permission_denied' | 'schedule_failed'> => {
    const granted = await requestPermission();
    if (!granted) return 'permission_denied';

    const scheduled = await scheduleDaily(nextLevelName);
    if (!scheduled) return 'schedule_failed';

    // Preservar la hora/minuto ya configurados — no sobrescribir con valores fijos.
    // Si no hay valor guardado, scheduleDaily ya usó settings.hour/settings.minute.
    await Promise.all([
      kvSet(NOTIFICATION_ENABLED_KEY, 'true'),
      kvSet(NOTIFICATION_HOUR_KEY, String(settings.hour)),
      kvSet(NOTIFICATION_MINUTE_KEY, String(settings.minute)),
    ]).catch(() => {});

    setSettings(prev => ({ ...prev, enabled: true }));
    return 'ok';
  }, [requestPermission, scheduleDaily, settings.hour, settings.minute]);

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

  /**
   * Re-programa el recordatorio diario si las notificaciones están habilitadas.
   * Debe llamarse cada vez que el usuario abre la app porque el trigger DATE
   * es one-time: se consume al dispararse y no se repite automáticamente.
   * Sin esta llamada, el recordatorio solo sonaría el primer día tras activarlo.
   */
  const rescheduleDaily = useCallback(async (): Promise<void> => {
    try {
      const enabled = await kvGet(NOTIFICATION_ENABLED_KEY);
      // null = fresh install (default true), 'true' = activado
      if (enabled !== null && enabled !== 'true') return;
      await scheduleDaily();
    } catch (err) {
      console.warn('[useNotifications] rescheduleDaily error:', err);
    }
  }, [scheduleDaily]);

  // updateTime eliminado: la hora es fija (2:00 PM) y no configurable por el usuario

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
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          timestamp: target.getTime(),
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
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          timestamp: targetToday.getTime(),
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

      // ── CORRECCIÓN: WEEKLY trigger también falla en Android (mismo bug que DAILY)
      // Calculamos el próximo lunes a las 9:00 AM como timestamp y usamos DATE.
      const nowW = new Date();
      const targetW = new Date();
      targetW.setHours(9, 0, 0, 0);
      const dayOfWeek = nowW.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
      let daysUntilMonday = (1 - dayOfWeek + 7) % 7; // días hasta el próximo lunes
      if (daysUntilMonday === 0 && targetW <= nowW) {
        // Hoy es lunes pero ya pasaron las 9:00 → programar para el lunes siguiente
        daysUntilMonday = 7;
      }
      targetW.setDate(targetW.getDate() + daysUntilMonday);

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          data: { screen: 'stats' },
          ...(Platform.OS === 'android' && { channelId: 'gemlish-weekly' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          timestamp: targetW.getTime(),
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
    requestPermission,
    scheduleDaily,
    rescheduleDaily,
    scheduleWeeklySummary,
    scheduleStreakRiskReminder,
    scheduleDailyChallengeNotification,
  };
}
