/**
 * useThemeStyles — Colores dinámicos del tema para StyleSheet
 * Retorna los colores base que cambian entre modo oscuro y claro.
 * Usar en lugar de colores hardcodeados en StyleSheet.create()
 *
 * Uso:
 *   const t = useThemeStyles();
 *   <View style={{ backgroundColor: t.bg }} />
 */
import { useMemo } from 'react';
import { useColors } from './use-colors';

export function useThemeStyles() {
  const colors = useColors();

  return useMemo(() => ({
    // Fondos principales
    bg: colors.background,           // fondo de pantalla (#0F1117 dark / #FFFFFF light)
    surface: colors.surface,         // tarjetas/cards (#1A1D27 dark / #F7F7F7 light)
    border: colors.border,           // bordes (#2D3148 dark / #E5E7EB light)

    // Textos
    text: colors.foreground,         // texto principal (#FFFFFF dark / #1A1A1A light)
    muted: colors.muted,             // texto secundario (#9CA3AF dark / #6B7280 light)

    // Colores de acento (no cambian entre temas)
    primary: colors.primary,         // verde Gemlish #58CC02
    error: colors.error,             // rojo #FF4B4B
    warning: colors.warning,         // naranja #FF9600
    success: colors.success,         // verde #58CC02
    gem: (colors as any).gem ?? '#00D4FF',       // azul diamante
    purple: (colors as any).purple ?? '#8E5AF5', // morado
    blue: (colors as any).blue ?? '#1CB0F6',     // azul

    // Helpers de opacidad para backgrounds de estado
    surfaceAlt: colors.surface,      // alternativa de superficie
  }), [colors]);
}
