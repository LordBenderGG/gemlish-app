/**
 * useThemeStyles — Colores dinámicos del tema para StyleSheet
 */
import { useMemo } from 'react';
import { useColors } from './use-colors';

export function useThemeStyles() {
  const colors = useColors();

  return useMemo(() => ({
    bg: colors.background,
    surface: colors.surface,
    border: colors.border,
    text: colors.foreground,
    muted: colors.muted,
    primary: colors.primary,
    error: colors.error,
    warning: colors.warning,
    success: colors.success,
    gem: (colors as any).gem ?? '#22D3EE',
    // Azul eléctrico reemplaza el morado
    purple: '#38BDF8',
    blue: '#38BDF8',
    gold: (colors as any).gold ?? '#FBBF24',
    pink: (colors as any).pink ?? '#F472B6',
    surfaceAlt: colors.surface,
    // Gradientes actualizados — sin morado
    gradientPrimary: ['#0F3460', '#38BDF8'] as string[],
    gradientGold: ['#92400E', '#FBBF24'] as string[],
    gradientGem: ['#0369A1', '#38BDF8'] as string[],
    gradientSuccess: ['#14532D', '#4ADE80'] as string[],
    gradientFire: ['#7F1D1D', '#F97316'] as string[],
    gradientNight: ['#0E1117', '#161B27'] as string[],
    gradientCard: ['#161B27', '#0E1117'] as string[],
  }), [colors]);
}
