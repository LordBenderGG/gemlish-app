'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, Animated, StatusBar, FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { markOnboardingDone } from '@/lib/onboarding';
import { hasExistingUsers } from '@/lib/storage';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Paleta v2.0 ─────────────────────────────────────────────────────────────
const C = {
  bg: '#0E1117',
  surface: '#161B27',
  surface2: '#1E2535',
  text: '#F0F4FF',
  muted: '#8B9CC8',
  border: '#2A3450',
  green: '#4ADE80',
  blue: '#38BDF8',
  violet: '#A78BFA',
  gold: '#FBBF24',
  coral: '#F87171',
};

// ─── Datos de las slides ─────────────────────────────────────────────────────

interface Slide {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  gradientColors: [string, string];
  items: { icon: string; text: string }[];
}

const SLIDES: Slide[] = [
  {
    id: '1',
    emoji: '💎',
    title: 'Bienvenido a Gemlish',
    subtitle: 'Aprende inglés de forma divertida',
    description: 'Un juego completo para aprender inglés desde cero. Sin internet, sin suscripciones, sin límites.',
    color: C.blue,
    gradientColors: ['#38BDF8', '#818CF8'],
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
    color: C.coral,
    gradientColors: ['#F87171', '#FB923C'],
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
    color: C.green,
    gradientColors: ['#4ADE80', '#22D3EE'],
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
    color: C.gold,
    gradientColors: ['#FBBF24', '#F97316'],
    items: [
      { icon: '🎯', text: '8 categorías de vocabulario para practicar' },
      { icon: '⏱️', text: 'Hasta 30 minutos de juego por día' },
      { icon: '💎', text: '+10 💎 por completar un tablero' },
    ],
  },
];

// ─── Pantalla de Bienvenida de Vuelta ────────────────────────────────────────

function WelcomeBackScreen({ onContinue }: { onContinue: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.welcomeBackContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.welcomeBackEmojiWrap}>
        <Text style={styles.welcomeBackEmoji}>👋</Text>
      </View>
      <Text style={styles.welcomeBackTitle}>¡Bienvenido de vuelta!</Text>
      <Text style={styles.welcomeBackSubtitle}>
        Vemos que ya tienes datos guardados.{'\n'}¡Tu progreso te espera!
      </Text>

      <View style={styles.welcomeBackCards}>
        {[
          { icon: '💎', text: 'Tus gemas y XP están guardados' },
          { icon: '🏆', text: 'Tus niveles completados te esperan' },
          { icon: '🔥', text: 'Recupera tu racha de estudio' },
        ].map((item, i) => (
          <View key={i} style={styles.welcomeBackCard}>
            <Text style={styles.welcomeBackCardEmoji}>{item.icon}</Text>
            <Text style={styles.welcomeBackCardText}>{item.text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.welcomeBackBtn} onPress={onContinue} activeOpacity={0.85}>
        <LinearGradient
          colors={['#4ADE80', '#22D3EE']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.welcomeBackBtnGrad}
        >
          <Text style={styles.welcomeBackBtnText}>Iniciar sesión →</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Componente de Slide ─────────────────────────────────────────────────────

function SlideView({ slide, isActive }: { slide: Slide; isActive: boolean }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    if (isActive) {
      fadeAnim.setValue(0);
      slideAnim.setValue(24);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]).start();
    }
  }, [isActive]);

  return (
    <View style={[styles.slide, { width: SCREEN_W }]}>
      {/* Emoji hero con gradiente */}
      <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient
          colors={slide.gradientColors}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.emojiContainer}
        >
          <Text style={styles.slideEmoji}>{slide.emoji}</Text>
        </LinearGradient>
      </Animated.View>

      <Animated.Text style={[styles.slideTitle, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {slide.title}
      </Animated.Text>

      <Animated.Text style={[styles.slideSubtitle, { opacity: fadeAnim }]}>
        {slide.subtitle}
      </Animated.Text>

      <Animated.Text style={[styles.slideDescription, { opacity: fadeAnim }]}>
        {slide.description}
      </Animated.Text>

      <Animated.View style={[styles.itemsContainer, { opacity: fadeAnim }]}>
        {slide.items.map((item, idx) => (
          <View key={idx} style={[styles.itemRow, { borderColor: slide.color + '40' }]}>
            <View style={[styles.itemIconWrap, { backgroundColor: slide.color + '18' }]}>
              <Text style={styles.itemIcon}>{item.icon}</Text>
            </View>
            <Text style={styles.itemText}>{item.text}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

// ─── Pantalla de Onboarding ──────────────────────────────────────────────────

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWelcomeBack, setShowWelcomeBack] = useState<boolean | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    hasExistingUsers().then(hasUsers => {
      setShowWelcomeBack(hasUsers);
    });
  }, []);

  const handleWelcomeBackContinue = useCallback(async () => {
    await markOnboardingDone();
    router.replace('/auth/login' as any);
  }, []);

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

  if (showWelcomeBack === null) {
    return <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]} />;
  }

  if (showWelcomeBack) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <View style={styles.welcomeBackWrapper}>
          <WelcomeBackScreen onContinue={handleWelcomeBackContinue} />
        </View>
      </View>
    );
  }

  const currentSlide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

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
        renderItem={({ item, index }) => (
          <SlideView slide={item} isActive={index === currentIndex} />
        )}
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
            outputRange: [8, 28, 8],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.35, 1, 0.35],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={idx}
              style={[styles.dot, { width: dotWidth, opacity, backgroundColor: currentSlide.color }]}
            />
          );
        })}
      </View>

      {/* Botón de acción */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.nextBtnWrap} onPress={handleNext} activeOpacity={0.85}>
          <LinearGradient
            colors={currentSlide.gradientColors}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.nextBtn}
          >
            <Text style={styles.nextBtnText}>
              {isLast ? '¡Empezar a Aprender! 🚀' : 'Siguiente →'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.slideCounter}>{currentIndex + 1} / {SLIDES.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: C.bg,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 4,
  },
  skipText: {
    color: C.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  flatList: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 8,
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  slideEmoji: { fontSize: 56 },
  slideTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    fontSize: 15,
    color: C.muted,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 12,
  },
  slideDescription: {
    fontSize: 14,
    color: '#C4CEEA',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  itemsContainer: { width: '100%', gap: 10 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    gap: 12,
  },
  itemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemIcon: { fontSize: 20 },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    fontWeight: '600',
    lineHeight: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 14,
  },
  dot: { height: 8, borderRadius: 4 },
  bottomContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 8,
    gap: 10,
    alignItems: 'center',
  },
  nextBtnWrap: { width: '100%' },
  nextBtn: {
    width: '100%',
    paddingVertical: 17,
    borderRadius: 18,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#0E1117',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  slideCounter: {
    color: C.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  // Welcome back
  welcomeBackWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  welcomeBackContainer: {
    alignItems: 'center',
    gap: 18,
  },
  welcomeBackEmojiWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeBackEmoji: { fontSize: 52 },
  welcomeBackTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  welcomeBackSubtitle: {
    fontSize: 15,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
  welcomeBackCards: { width: '100%', gap: 10, marginTop: 4 },
  welcomeBackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  welcomeBackCardEmoji: { fontSize: 24, width: 32, textAlign: 'center' },
  welcomeBackCardText: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    fontWeight: '600',
    lineHeight: 20,
  },
  welcomeBackBtn: { width: '100%', marginTop: 8 },
  welcomeBackBtnGrad: {
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
  },
  welcomeBackBtnText: {
    color: '#0E1117',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
