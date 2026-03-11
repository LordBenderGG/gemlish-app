import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, Easing,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const COLORS = ['#FFD700', '#FF4B4B', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#00BCD4', '#E91E63'];
const SHAPES = ['●', '■', '▲', '★', '◆'];
const PARTICLE_COUNT = 40;

interface Particle {
  id: number;
  x: number;
  color: string;
  shape: string;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
  drift: number;
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_W,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    size: 8 + Math.random() * 10,
    delay: Math.random() * 600,
    duration: 1200 + Math.random() * 800,
    rotation: Math.random() * 720 - 360,
    drift: (Math.random() - 0.5) * 80,
  }));
}

function ConfettiParticle({ particle }: { particle: Particle }) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(particle.delay, withTiming(1, { duration: 100 }));
    translateY.value = withDelay(
      particle.delay,
      withTiming(SCREEN_H + 40, { duration: particle.duration, easing: Easing.in(Easing.quad) })
    );
    translateX.value = withDelay(
      particle.delay,
      withTiming(particle.drift, { duration: particle.duration, easing: Easing.inOut(Easing.sin) })
    );
    rotate.value = withDelay(
      particle.delay,
      withTiming(particle.rotation, { duration: particle.duration })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      style={[
        {
          position: 'absolute',
          left: particle.x,
          top: 0,
          fontSize: particle.size,
          color: particle.color,
        },
        style,
      ]}
    >
      {particle.shape}
    </Animated.Text>
  );
}

interface ConfettiOverlayProps {
  visible: boolean;
}

export function ConfettiOverlay({ visible }: ConfettiOverlayProps) {
  const particles = useRef(generateParticles()).current;

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map(p => (
        <ConfettiParticle key={p.id} particle={p} />
      ))}
    </View>
  );
}
