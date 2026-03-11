import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AchievementToast } from '@/components/achievement-toast';
import { checkNewAchievements, type Achievement, type AchievementStats } from '@/lib/achievements';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface AchievementsContextValue {
  /**
   * Verifica si hay nuevos logros desbloqueados y los encola para mostrar.
   * Llamar después de cualquier acción que pueda desbloquear un logro.
   */
  checkAchievements: (username: string, stats: AchievementStats) => Promise<void>;
}

// ─── Contexto ────────────────────────────────────────────────────────────────

const AchievementsContext = createContext<AchievementsContextValue | null>(null);

export function useAchievements(): AchievementsContextValue {
  const ctx = useContext(AchievementsContext);
  if (!ctx) throw new Error('useAchievements must be used within AchievementsProvider');
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AchievementsProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [currentToast, setCurrentToast] = useState<Achievement | null>(null);
  const queueRef = useRef<Achievement[]>([]);
  const isShowingRef = useRef(false);

  const showNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      isShowingRef.current = false;
      return;
    }
    const next = queueRef.current.shift()!;
    isShowingRef.current = true;
    setCurrentToast(next);
  }, []);

  const handleDismiss = useCallback(() => {
    setCurrentToast(null);
    // Pequeño delay entre toasts para que no se solapen
    setTimeout(showNext, 400);
  }, [showNext]);

  const checkAchievements = useCallback(async (username: string, stats: AchievementStats) => {
    const newOnes = await checkNewAchievements(username, stats);
    if (newOnes.length === 0) return;

    // Encolar todos los nuevos logros
    queueRef.current.push(...newOnes);

    // Si no hay toast mostrándose, mostrar el primero
    if (!isShowingRef.current) {
      showNext();
    }
  }, [showNext]);

  return (
    <AchievementsContext.Provider value={{ checkAchievements }}>
      {children}
      {/* Toast overlay — posicionado sobre todo el contenido */}
      <View
        style={[styles.toastContainer, { top: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <AchievementToast
          achievement={currentToast}
          onDismiss={handleDismiss}
        />
      </View>
    </AchievementsContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
  },
});
