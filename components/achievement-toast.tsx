import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import type { Achievement } from '@/lib/achievements';

interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

/**
 * Toast emergente que aparece desde arriba cuando se desbloquea un logro.
 * Se auto-descarta después de 4 segundos.
 */
export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onDismiss());
  }, [translateY, opacity, onDismiss]);

  useEffect(() => {
    if (!achievement) return;

    // Entrar
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    // Auto-descartar después de 4s
    timerRef.current = setTimeout(dismiss, 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [achievement]);

  if (!achievement) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], opacity },
      ]}
    >
      <TouchableOpacity style={styles.inner} onPress={dismiss} activeOpacity={0.9}>
        {/* Icono de trofeo + emoji del logro */}
        <View style={styles.iconWrapper}>
          <View style={styles.iconBg}>
            <Text style={styles.iconEmoji}>{achievement.emoji}</Text>
          </View>
          <View style={styles.unlockBadge}>
            <Text style={styles.unlockBadgeText}>🏆</Text>
          </View>
        </View>

        {/* Texto */}
        <View style={styles.textWrapper}>
          <Text style={styles.label}>¡Logro desbloqueado!</Text>
          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={styles.description} numberOfLines={1}>{achievement.description}</Text>
        </View>

        {/* Botón cerrar */}
        <TouchableOpacity style={styles.closeBtn} onPress={dismiss}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Barra de progreso de auto-descarte */}
      <ProgressBar duration={4000} />
    </Animated.View>
  );
}

function ProgressBar({ duration }: { duration: number }) {
  const widthAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: 0,
      duration,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={styles.progressBarBg}>
      <Animated.View
        style={[
          styles.progressBarFill,
          {
            width: widthAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    zIndex: 9999,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1A1D27',
    borderWidth: 1.5,
    borderColor: '#FFD70060',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconWrapper: {
    position: 'relative',
    width: 52,
    height: 52,
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFD70020',
    borderWidth: 1.5,
    borderColor: '#FFD70050',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 26,
  },
  unlockBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1A1D27',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFD70060',
  },
  unlockBadgeText: {
    fontSize: 11,
  },
  textWrapper: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  description: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2D3148',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 3,
    backgroundColor: '#2D3148',
  },
  progressBarFill: {
    height: 3,
    backgroundColor: '#FFD700',
  },
});
