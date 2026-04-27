/**
 * useFeedbackSounds — Efectos de sonido de feedback para ejercicios
 * Reproduce sonidos de correcto, incorrecto y nivel completado
 * Respeta la preferencia del usuario (toggle en Configuración)
 */
import { useCallback, useEffect, useRef } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Platform } from 'react-native';
import { isSoundEnabled } from '@/lib/sound-settings';

// Configurar modo de audio al iniciar.
// playsInSilentMode: true es un comportamiento de iOS — en Android no tiene efecto
// pero tampoco causa error, por lo que se incluye para compatibilidad futura.
let audioModeConfigured = false;
async function ensureAudioMode() {
  if (audioModeConfigured) return;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
    audioModeConfigured = true;
  } catch {
    // Ignorar errores en web
  }
}

export function useFeedbackSounds() {
  const correctPlayer = useAudioPlayer(require('@/assets/sounds/correct.mp3'));
  const wrongPlayer = useAudioPlayer(require('@/assets/sounds/wrong.mp3'));
  const levelCompletePlayer = useAudioPlayer(require('@/assets/sounds/level_complete.mp3'));
  const streakPlayer = useAudioPlayer(require('@/assets/sounds/streak.mp3'));
  const unlockPlayer = useAudioPlayer(require('@/assets/sounds/unlock.mp3'));

  useEffect(() => {
    if (Platform.OS !== 'web') {
      ensureAudioMode();
    }
  }, []);

  const playCorrect = useCallback(() => {
    if (!isSoundEnabled()) return;
    try {
      if (correctPlayer?.isLoaded) {
        correctPlayer.seekTo(0);
        correctPlayer.play();
      }
    } catch {
      // Ignorar errores de reproducción
    }
  }, [correctPlayer]);

  const playWrong = useCallback(() => {
    if (!isSoundEnabled()) return;
    try {
      if (wrongPlayer?.isLoaded) {
        wrongPlayer.seekTo(0);
        wrongPlayer.play();
      }
    } catch {
      // Ignorar errores de reproducción
    }
  }, [wrongPlayer]);

  const playLevelComplete = useCallback(() => {
    if (!isSoundEnabled()) return;
    try {
      if (levelCompletePlayer?.isLoaded) {
        levelCompletePlayer.seekTo(0);
        levelCompletePlayer.play();
      }
    } catch {
      // Ignorar errores de reproducción
    }
  }, [levelCompletePlayer]);

  const playStreak = useCallback(() => {
    if (!isSoundEnabled()) return;
    try {
      if (streakPlayer?.isLoaded) {
        streakPlayer.seekTo(0);
        streakPlayer.play();
      }
    } catch {
      // Ignorar errores de reproducción
    }
  }, [streakPlayer]);

  const playUnlock = useCallback(() => {
    if (!isSoundEnabled()) return;
    try {
      if (unlockPlayer?.isLoaded) {
        unlockPlayer.seekTo(0);
        unlockPlayer.play();
      }
    } catch {
      // Ignorar errores de reproducción
    }
  }, [unlockPlayer]);

  return { playCorrect, playWrong, playLevelComplete, playStreak, playUnlock };
}
