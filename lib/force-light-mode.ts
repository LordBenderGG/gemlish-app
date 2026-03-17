/**
 * force-light-mode.ts
 *
 * Fuerza el modo claro en NativeWind inmediatamente al importarse.
 * Se importa como primera línea en app/_layout.tsx.
 *
 * La manipulación del DOM se hace en el script inline de +html.tsx.
 * Aquí solo manejamos Appearance (React Native nativo).
 */

import { Appearance } from "react-native";

// Forzar React Native Appearance a modo claro
// Esto afecta al runtime nativo (Android/iOS)
try {
  Appearance.setColorScheme?.("light");
} catch {
  // Ignorar si no está disponible (SSR)
}
