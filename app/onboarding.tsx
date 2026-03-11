'use client';
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, Animated, StatusBar, FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { markOnboardingDone } from '@/lib/onboarding';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Datos de las slides ─────────────────────────────────────────────────────

interface Slide {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  bgColor: string;
  items: { icon: string; text: string }[];
}

const SLIDES: Slide[] = [
  {
    id: '1',
    emoji: '💎',
    title: 'Bienvenido a Gemlish',
    subtitle: 'Aprende inglés de forma divertida',
    description: 'Un juego completo para aprender inglés desde cero. Sin internet, sin suscripciones, sin límites.',
    color: '#8E5AF5',
    bgColor: '#8E5AF515',
    items: [
      { icon: '🏆', text: '500 niveles de ejercicios' },
      { icon: '📱', text: '100% offline, sin datos móviles' },
      { icon: '🎮', text: 'Aprende jugando todos los días' },
    ],
  },
  {
    id: '2',
    emoji: '❤️',
    title: 'Vidas y Diamantes',
    subtitle: 'Tu sistema de progreso',
    description: 'Gestiona tus recursos para avanzar más rápido y desbloquear pistas cuando las necesites.',
    color: '#FF4B4B',
    bgColor: '#FF4B4B15',
    items: [
      { icon: '❤️', text: '5 vidas — se recuperan con el tiempo' },
      { icon: '💎', text: 'Diamantes — gánalos completando niveles' },
      { icon: '💡', text: 'Usa 10 💎 para revelar una pista' },
    ],
  },
  {
    id: '3',
    emoji: '📅',
    title: 'Tarea Diaria',
    subtitle: 'Aprende 30 palabras cada día',
    description: 'Cada día tienes 30 palabras nuevas con pronunciación. Completa la tarea diaria para ganar bonificaciones.',
    color: '#58CC02',
    bgColor: '#58CC0215',
    items: [
      { icon: '🔊', text: 'Escucha la pronunciación real de cada palabra' },
      { icon: '🔥', text: 'Mantén tu racha estudiando todos los días' },
      { icon: '💎', text: '+10 💎 y +20 XP al completar la tarea' },
    ],
  },
  {
    id: '4',
    emoji: '🃏',
    title: 'Minijuego de Memoria',
    subtitle: 'Refuerza el vocabulario jugando',
    description: 'Empareja cartas de palabras en inglés con su traducción. ¡Cuanto más rápido, más diamantes ganas!',
    color: '#FF9600',
    bgColor: '#FF960015',
    items: [
      { icon: '🎯', text: '8 categorías de vocabulario para practicar' },
      { icon: '⏱️', text: 'Hasta 30 minutos de juego por día' },
      { icon: '💎', text: '+10 💎 por completar un tablero' },
    ],
  },
];

// ─── Componente de Slide ─────────────────────────────────────────────────────

function SlideView({ slide }: { slide: Slide }) {
  return (
    <View style={[styles.slide, { width: SCREEN_W }]}>
      <View style={[styles.emojiContainer, { backgroundColor: slide.bgColor }]}>
        <Text style={styles.slideEmoji}>{slide.emoji}</Text>
      </View>
      <Text style={[styles.slideTitle, { color: slide.color }]}>{slide.title}</Text>
      <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
      <Text style={styles.slideDescription}>{slide.description}</Text>

      <View style={styles.itemsContainer}>
        {slide.items.map((item, idx) => (
          <View key={idx} style={[styles.itemRow, { borderColor: slide.color + '30' }]}>
            <Text style={styles.itemIcon}>{item.icon}</Text>
            <Text style={styles.itemText}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Pantalla de Onboarding ──────────────────────────────────────────────────

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = useCallback(async () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      await markOnboardingDone();
      router.replace('/auth/login' as any);
    }
  }, [currentIndex]);

  const handleSkip = useCallback(async () => {
    await markOnboardingDone();
    router.replace('/auth/login' as any);
  }, []);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const idx = Math.round(event.nativeEvent.contentOffset.x / SCREEN_W);
        setCurrentIndex(idx);
      },
    }
  );

  const currentSlide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F1117" />

      {/* Botón Saltar */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Saltar</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SlideView slide={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.flatList}
      />

      {/* Indicadores de puntos */}
      <View style={styles.dotsContainer}>
        {SLIDES.map((_, idx) => {
          const inputRange = [(idx - 1) * SCREEN_W, idx * SCREEN_W, (idx + 1) * SCREEN_W];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={idx}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: currentSlide.color,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Botón de acción */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: currentSlide.color }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {isLast ? '¡Empezar a Aprender! 🚀' : 'Siguiente →'}
          </Text>
        </TouchableOpacity>

        {/* Contador de slide */}
        <Text style={styles.slideCounter}>
          {currentIndex + 1} / {SLIDES.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1117',
    alignItems: 'center',
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 4,
  },
  skipText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 10,
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 2,
    borderColor: '#FFFFFF10',
  },
  slideEmoji: {
    fontSize: 56,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 14,
  },
  slideDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  itemsContainer: {
    width: '100%',
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1D27',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    gap: 12,
  },
  itemIcon: {
    fontSize: 22,
    width: 30,
    textAlign: 'center',
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  bottomContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 8,
    gap: 12,
    alignItems: 'center',
  },
  nextBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  slideCounter: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
  },
});
