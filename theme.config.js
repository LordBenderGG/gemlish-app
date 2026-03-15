/** @type {const} */
const themeColors = {
  // Fondos
  primary:    { light: '#4ADE80', dark: '#4ADE80' },   // Verde lima vibrante
  background: { light: '#0E1117', dark: '#0E1117' },   // Azul-gris oscuro suave
  surface:    { light: '#161B27', dark: '#161B27' },   // Cards y contenedores
  surface2:   { light: '#1E2535', dark: '#1E2535' },   // Inputs y secundarios
  foreground: { light: '#F0F4FF', dark: '#F0F4FF' },   // Texto principal
  muted:      { light: '#8B9CC8', dark: '#8B9CC8' },   // Texto secundario
  border:     { light: '#2A3450', dark: '#2A3450' },   // Bordes sutiles
  // Estados
  success:    { light: '#4ADE80', dark: '#4ADE80' },
  warning:    { light: '#FBBF24', dark: '#FBBF24' },
  error:      { light: '#F87171', dark: '#F87171' },
  // Acentos extra (usados como clases Tailwind)
  secondary:  { light: '#38BDF8', dark: '#38BDF8' },   // Azul cielo
  gold:       { light: '#FBBF24', dark: '#FBBF24' },   // Dorado gemas
  streak:     { light: '#A78BFA', dark: '#A78BFA' },   // Violeta racha
  danger:     { light: '#F87171', dark: '#F87171' },   // Coral vidas
};

module.exports = { themeColors };
