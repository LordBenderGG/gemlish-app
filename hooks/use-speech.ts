/**
 * useSpeech — Hook centralizado para Text-to-Speech con expo-speech
 * Maneja correctamente el ciclo de vida en Android (stop es async, necesita delay)
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const isMountedRef = useRef(true);
  const currentWordRef = useRef<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Stop any ongoing speech on unmount
      Speech.stop().catch(() => {});
    };
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text) return;

    try {
      // Stop any current speech first (await is important on Android)
      await Speech.stop();

      // Small delay to ensure Android TTS engine is ready (reducido: 50ms suficiente)
      await new Promise(resolve => setTimeout(resolve, 50));

      if (!isMountedRef.current) return;

      currentWordRef.current = text;

      if (isMountedRef.current) setSpeaking(true);

      Speech.speak(text, {
        language: 'en-US',
        rate: Platform.OS === 'android' ? 0.9 : 0.85,
        pitch: 1.0,
        volume: 1.0,
        onStart: () => {
          if (isMountedRef.current) setSpeaking(true);
        },
        onDone: () => {
          if (isMountedRef.current) setSpeaking(false);
          currentWordRef.current = null;
        },
        onStopped: () => {
          if (isMountedRef.current) setSpeaking(false);
          currentWordRef.current = null;
        },
        onError: (error) => {
          console.warn('[useSpeech] Error:', error);
          if (isMountedRef.current) setSpeaking(false);
          currentWordRef.current = null;
        },
      });
    } catch (err) {
      console.warn('[useSpeech] Exception:', err);
      if (isMountedRef.current) setSpeaking(false);
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      await Speech.stop();
    } catch (err) {
      // ignore
    }
    if (isMountedRef.current) setSpeaking(false);
    currentWordRef.current = null;
  }, []);

  const toggle = useCallback(async (text: string) => {
    if (speaking && currentWordRef.current === text) {
      await stop();
    } else {
      await speak(text);
    }
  }, [speaking, speak, stop]);

  return { speaking, speak, stop, toggle, currentWord: currentWordRef.current };
}
