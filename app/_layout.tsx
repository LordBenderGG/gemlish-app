import "@/global.css";
import "@/lib/force-light-mode";
import { initDatabase } from "@/lib/database";
import { migrateFromAsyncStorageIfNeeded } from "@/lib/migrate-from-asyncstorage";

// Inicializar base de datos SQLite al arrancar (síncrono, antes de cualquier render)
if (typeof window === 'undefined' || typeof (globalThis as any).ExpoDomWebView !== 'undefined' || require('react-native').Platform.OS !== 'web') {
  try { initDatabase(); } catch {}
}
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useSegments, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GameProvider, useGame } from '@/context/GameContext';
import { AchievementsProvider } from '@/context/AchievementsContext';
import { hasSeenOnboarding } from '@/lib/onboarding';
import { usePendingAchievements } from '@/hooks/use-pending-achievements';
import { useNotifications } from '@/hooks/use-notifications';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { username, isLoading, game } = useGame();
  const segments = useSegments();
  // Verificar logros pendientes al abrir la app (logros desbloqueados mientras estaba cerrada)
  usePendingAchievements();

  // Programar notificaciones al abrir la app
  const { scheduleStreakRiskReminder, scheduleDailyChallengeNotification, scheduleWeeklySummary } = useNotifications();
  useEffect(() => {
    if (!username || isLoading) return;
    const today = new Date().toISOString().split('T')[0];
    const completedTodayCount = game.levelCompletedDates?.[today] ?? 0;

    // Recordatorio de racha en riesgo a las 20:00
    scheduleStreakRiskReminder({
      streak: game.streak,
      completedTodayCount,
    });

    // Notificación del desafío del día a las 8:00 AM
    import('@/lib/daily-challenge').then(({ getOrCreateDailyChallenge }) => {
      import('@/data/lessons').then(({ getLevelData }) => {
        const maxLevel = game.maxUnlockedLevel > 0 ? game.maxUnlockedLevel : 1;
        const levelData = getLevelData(maxLevel);
        getOrCreateDailyChallenge(username!, maxLevel, levelData.xp, 5).then(challenge => {
          scheduleDailyChallengeNotification({
            levelId: challenge.levelId,
            levelName: getLevelData(challenge.levelId).name,
            xpEarned: challenge.xpEarned,
            gemsEarned: challenge.gemsEarned,
          });
        }).catch(() => {});
      });
    });

    // Resumen semanal los lunes a las 9:00 AM
    const levelsLastWeek = Object.entries(game.levelCompletedDates ?? {}).reduce((acc, [date, count]) => {
      const d = new Date(date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo ? acc + count : acc;
    }, 0);
    import('@/lib/storage').then(({ getDailyState }) => {
      getDailyState(username!).then(d => {
        scheduleWeeklySummary({
          levelsLastWeek,
          streak: game.streak,
          wordsLearned: Object.values(d.learnedWords).filter(Boolean).length,
        });
      }).catch(() => {});
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = (segments[0] as string) === 'auth';
    const inOnboarding = (segments[0] as string) === 'onboarding';

    if (!username && !inAuthGroup && !inOnboarding) {
      // Verificar si ya vio el onboarding
      hasSeenOnboarding().then((seen) => {
        if (!seen) {
          router.replace('/onboarding' as any);
        } else {
          router.replace('/auth/login' as any);
        }
      });
    } else if (username && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [username, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
    // Migrar datos de AsyncStorage a SQLite (solo se ejecuta una vez, en la primera actualización)
    migrateFromAsyncStorageIfNeeded().catch(() => {});
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus for mobile
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GameProvider>
      <AchievementsProvider>
      <AuthGuard>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {/* Default to hiding native headers so raw route segments don't appear (e.g. "(tabs)", "products/[id]"). */}
          {/* If a screen needs the native header, explicitly enable it and set a human title via Stack.Screen options. */}
          {/* in order for ios apps tab switching to work properly, use presentation: "fullScreenModal" for login page, whenever you decide to use presentation: "modal*/}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="exercise" />
            <Stack.Screen name="level" />
            <Stack.Screen name="review" />
            <Stack.Screen name="practice" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="stats" />
            <Stack.Screen name="achievements" />
            <Stack.Screen name="oauth/callback" />
          </Stack>
          <StatusBar style="dark" />
        </QueryClientProvider>
      </trpc.Provider>
      </AuthGuard>
      </AchievementsProvider>
      </GameProvider>
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}
