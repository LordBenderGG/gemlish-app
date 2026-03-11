import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Alert,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { getAllWords } from '@/data/lessons';

const MAX_DAILY_MS = 10 * 60 * 1000; // 10 minutos
const PAIRS_COUNT = 6;
const GEMS_REWARD = 10;

interface CardData {
  id: string;
  text: string;
  pairId: number;
  isEnglish: boolean;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateCards(): CardData[] {
  const allWords = getAllWords();
  const shuffled = shuffleArray(allWords).slice(0, PAIRS_COUNT);
  const cards: CardData[] = [];
  shuffled.forEach((word, idx) => {
    cards.push({ id: `en-${idx}`, text: word.word, pairId: idx, isEnglish: true });
    cards.push({ id: `es-${idx}`, text: word.translation, pairId: idx, isEnglish: false });
  });
  return shuffleArray(cards);
}

interface MemoryCardProps {
  card: CardData;
  isFlipped: boolean;
  isMatched: boolean;
  onPress: () => void;
}

function MemoryCard({ card, isFlipped, isMatched, onPress }: MemoryCardProps) {
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(flipAnim, {
      toValue: isFlipped || isMatched ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isFlipped, isMatched]);

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <TouchableOpacity
      style={styles.cardWrapper}
      onPress={onPress}
      disabled={isFlipped || isMatched}
      activeOpacity={0.8}
    >
      {/* Cara trasera (oculta) */}
      <Animated.View
        style={[
          styles.card,
          styles.cardBack,
          { transform: [{ rotateY: frontRotate }] },
          isMatched && styles.cardMatchedBack,
        ]}
      >
        <Text style={styles.cardBackText}>💎</Text>
      </Animated.View>
      {/* Cara frontal (texto) */}
      <Animated.View
        style={[
          styles.card,
          styles.cardFront,
          { transform: [{ rotateY: backRotate }] },
          isMatched && styles.cardMatchedFront,
          card.isEnglish ? styles.cardEnglish : styles.cardSpanish,
        ]}
      >
        <Text style={styles.cardLang}>{card.isEnglish ? '🇺🇸' : '🇪🇸'}</Text>
        <Text style={styles.cardText} numberOfLines={2}>{card.text}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const { game, miniGame, addMiniGameTime, winMiniGame } = useGame();

  const [cards, setCards] = useState<CardData[]>(() => generateCards());
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const remainingMs = MAX_DAILY_MS - miniGame.playedMs;
  const timeUp = remainingMs <= 0;

  // Timer
  useEffect(() => {
    if (gameWon || timeUp) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      if (startTime !== null) {
        setElapsedMs(Date.now() - startTime);
      }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameWon, timeUp, startTime]);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  const handleCardPress = useCallback(async (cardId: string) => {
    if (timeUp) {
      Alert.alert('⏰ Tiempo agotado', 'Has alcanzado el límite de 10 minutos diarios. Vuelve mañana.');
      return;
    }
    if (flipped.length >= 2) return;
    if (flipped.includes(cardId)) return;

    if (startTime === null) setStartTime(Date.now());

    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [id1, id2] = newFlipped;
      const card1 = cards.find(c => c.id === id1)!;
      const card2 = cards.find(c => c.id === id2)!;

      if (card1.pairId === card2.pairId && card1.isEnglish !== card2.isEnglish) {
        // Par correcto
        const newMatched = [...matched, id1, id2];
        setTimeout(() => {
          setMatched(newMatched);
          setFlipped([]);
          if (newMatched.length === cards.length) {
            setGameWon(true);
            const playedMs = startTime ? Date.now() - startTime : 0;
            addMiniGameTime(playedMs);
          }
        }, 500);
      } else {
        // Par incorrecto
        setTimeout(() => setFlipped([]), 900);
      }
    }
  }, [flipped, matched, cards, timeUp, startTime, addMiniGameTime]);

  const handleClaimReward = useCallback(async () => {
    if (rewardClaimed) return;
    setRewardClaimed(true);
    await winMiniGame();
    Alert.alert('🎉 ¡Recompensa!', `¡Ganaste +${GEMS_REWARD} 💎!\nTotal: ${game.gems + GEMS_REWARD} 💎`);
  }, [rewardClaimed, winMiniGame, game.gems]);

  const handleNewGame = useCallback(() => {
    setCards(generateCards());
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameWon(false);
    setRewardClaimed(false);
    setStartTime(null);
    setElapsedMs(0);
  }, []);

  const pairsFound = matched.length / 2;
  const totalPairs = PAIRS_COUNT;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🃏 Memoria de Pares</Text>
          <Text style={styles.headerSub}>Empareja inglés con español</Text>
        </View>
        <View style={styles.gemsBadge}>
          <Text style={styles.gemsText}>💎 {game.gems}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Pares</Text>
          <Text style={styles.statValue}>{pairsFound}/{totalPairs}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Movimientos</Text>
          <Text style={styles.statValue}>{moves}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Tiempo</Text>
          <Text style={styles.statValue}>{formatTime(elapsedMs)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Disponible</Text>
          <Text style={[styles.statValue, timeUp && { color: '#FF4B4B' }]}>
            {timeUp ? 'Agotado' : formatTime(remainingMs)}
          </Text>
        </View>
      </View>

      {/* Tablero */}
      {timeUp && !gameWon ? (
        <View style={styles.timeUpContainer}>
          <Text style={styles.timeUpEmoji}>⏰</Text>
          <Text style={styles.timeUpTitle}>Tiempo Agotado</Text>
          <Text style={styles.timeUpSub}>Has usado tus 10 minutos diarios de juego.</Text>
          <Text style={styles.timeUpSub}>Vuelve mañana para seguir jugando.</Text>
        </View>
      ) : gameWon ? (
        <View style={styles.wonContainer}>
          <Text style={styles.wonEmoji}>🏆</Text>
          <Text style={styles.wonTitle}>¡Ganaste!</Text>
          <Text style={styles.wonSub}>{moves} movimientos · {formatTime(elapsedMs)}</Text>
          {!rewardClaimed ? (
            <TouchableOpacity style={styles.claimBtn} onPress={handleClaimReward}>
              <Text style={styles.claimBtnText}>🎁 Reclamar +{GEMS_REWARD} 💎</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.claimedText}>✅ Recompensa reclamada</Text>
          )}
          <TouchableOpacity style={styles.newGameBtn} onPress={handleNewGame}>
            <Text style={styles.newGameBtnText}>Nueva Partida</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.board}>
          {cards.map((card) => (
            <MemoryCard
              key={card.id}
              card={card}
              isFlipped={flipped.includes(card.id)}
              isMatched={matched.includes(card.id)}
              onPress={() => handleCardPress(card.id)}
            />
          ))}
        </View>
      )}

      {/* Info */}
      {!gameWon && !timeUp && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Completa el juego para ganar <Text style={{ color: '#00D4FF', fontWeight: '700' }}>+{GEMS_REWARD} 💎</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3148',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  gemsBadge: {
    backgroundColor: '#00D4FF20',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#00D4FF40',
  },
  gemsText: { color: '#00D4FF', fontSize: 15, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3148',
    gap: 8,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginTop: 2 },
  board: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
    justifyContent: 'center',
    alignContent: 'center',
  },
  cardWrapper: {
    width: '30%',
    aspectRatio: 0.75,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
    padding: 6,
  },
  cardBack: {
    backgroundColor: '#1A1D27',
    borderWidth: 1.5,
    borderColor: '#2D3148',
  },
  cardMatchedBack: { borderColor: '#58CC02' },
  cardFront: {
    borderWidth: 1.5,
  },
  cardMatchedFront: { borderColor: '#58CC02', backgroundColor: '#1A3A1A' },
  cardEnglish: { backgroundColor: '#1A2A3A', borderColor: '#1CB0F6' },
  cardSpanish: { backgroundColor: '#2A1A3A', borderColor: '#8E5AF5' },
  cardBackText: { fontSize: 28 },
  cardLang: { fontSize: 14, marginBottom: 4 },
  cardText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', lineHeight: 18 },
  timeUpContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  timeUpEmoji: { fontSize: 64, marginBottom: 16 },
  timeUpTitle: { fontSize: 28, fontWeight: '800', color: '#FF4B4B', marginBottom: 12 },
  timeUpSub: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
  wonContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  wonEmoji: { fontSize: 72, marginBottom: 16 },
  wonTitle: { fontSize: 32, fontWeight: '800', color: '#FFD700', marginBottom: 8 },
  wonSub: { fontSize: 15, color: '#9CA3AF', marginBottom: 28 },
  claimBtn: {
    backgroundColor: '#00D4FF',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 16,
    marginBottom: 12,
  },
  claimBtnText: { color: '#0F1117', fontSize: 16, fontWeight: '800' },
  claimedText: { color: '#58CC02', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  newGameBtn: {
    backgroundColor: '#1A1D27',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#2D3148',
  },
  newGameBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  infoBox: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#00D4FF10',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#00D4FF20',
    alignItems: 'center',
  },
  infoText: { color: '#9CA3AF', fontSize: 13 },
});
