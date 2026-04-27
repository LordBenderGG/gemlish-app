/**
 * Centralized UI strings used across the app
 * These are the most commonly repeated strings to reduce duplication
 */

export const STRINGS = {
  // Navigation buttons
  CONTINUAR: 'Continuar →',
  CANCELAR: 'Cancelar',
  VOLVER: '← Volver',
  VOLVER_A_JUEGOS: '← Volver a Juegos',
  VOLVER_AL_INICIO: 'Volver al inicio',
  VOLVER_AL_MAPA: '✓ Volver al mapa',

  // Exercise feedback
  CORRECTO: '¡Correcto! ✅',
  CASI: '¡Casi! Revisa la ortografía ✨',
  RESPUESTA_CORRECTA: 'Respuesta correcta:',
  LA_PALABRA_ERA: 'La palabra era:',
  ORACION_CORRECTA: 'Oración correcta:',

  // Error messages
  ERROR_AL_GUARDAR: 'Error al guardar',
  ERROR_AL_INICIAR_SESION: 'Error inesperado al iniciar sesión',
  ERROR_AL_REGISTRARSE: 'Error inesperado al registrarse',
  ERROR_PROCESAR_RECOMPENSA: 'No se pudo procesar la recompensa. Intenta de nuevo.',
  ERROR_AUTENTICACION: 'No se pudo completar la autenticación. Intenta de nuevo.',
  NO_SE_PUDO_ACTIVAR: 'No se pudo activar',

  // Validation messages
  CAMPO_REQUERIDO: 'Por favor completa todos los campos',
  EMAIL_INVALIDO: 'Por favor ingresa un email válido',
  USERNAME_CORTO: 'El nombre de usuario debe tener al menos 3 caracteres',
  PASSWORD_CORTA_6: 'La contraseña debe tener al menos 6 caracteres',
  PASSWORD_CORTA_8: 'La contraseña debe tener al menos 8 caracteres',
  PASSWORD_NO_COINCIDE: 'Las contraseñas no coinciden',

  // Alert titles
  ERROR: 'Error',
} as const;
