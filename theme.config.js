/** @type {const} */
const themeColors = {
  // Azul eléctrico como color primario (reemplaza el morado)
  primary: { light: '#0284C7', dark: '#38BDF8' },
  // Fondo oscuro profundo
  background: { light: '#F8FAFC', dark: '#0D0D18' },
  // Superficie de tarjetas
  surface: { light: '#F1F5F9', dark: '#111122' },
  // Texto principal
  foreground: { light: '#0F172A', dark: '#F1F5F9' },
  // Texto secundario
  muted: { light: '#64748B', dark: '#64748B' },
  // Bordes
  border: { light: '#E2E8F0', dark: '#1E2A3A' },
  // Verde lima para éxito/XP
  success: { light: '#65A30D', dark: '#A3E635' },
  // Ámbar para advertencias
  warning: { light: '#D97706', dark: '#FBBF24' },
  // Rojo para errores
  error: { light: '#DC2626', dark: '#F87171' },
  // Tint (color de acento para tabs)
  tint: { light: '#0284C7', dark: '#38BDF8' },
};

module.exports = { themeColors };
