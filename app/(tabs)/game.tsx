import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Alert,
  ScrollView, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import {
  GAME_CATEGORIES, getGameWordsByCategory, getRandomGameWords, GameWord,
} from '@/data/gameWords';

const MAX_DAILY_MS = 10 * 60 * 1000;
const PAIRS_COUNT = 6;
const GEMS_REWARD = 10;

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CardData {
  id: string;
  text: string;
  pairId: number;
  isEnglish: boolean;
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCards(words: GameWord[]): CardData[] {
  const cards: CardData[] = [];
  words.forEach((w, idx) => {
    cards.push({ id: `en-${idx}`, text: w.word, pairId: idx, isEnglish: true });
    cards.push({ id: `es-${idx}`, text: w.translation, pairId: idx, isEnglish: false });
  });
  return shuffle(cards);
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ─── Carta de Memoria ─────────────────────────────────────────────────────────

interface MemCardProps {
  card: CardData;
  isFlipped: boolean;
  isMatched: boolean;
  onPress: () => void;
}

function MemCard({ card, isFlipped, isMatched, onPress }: MemCardProps) {
  const anim = useRef(new Animated.Value(isFlipped || isMatched ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isFlipped || isMatched ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isFlipped, isMatched]);

  const frontRot = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRot = anim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <TouchableOpacity
      style={styles.cardWrapper}
      onPress={onPress}
      disabled={isFlipped || isMatched}
      activeOpacity={0.85}
    >
      {/* Cara trasera */}
      <Animated.View style={[styles.card, styles.cardBack, { transform: [{ rotateY: frontRot }] }, isMatched && styles.cardMatchedBack]}>
        <Text style={styles.cardGem}>💎</Text>
      </Animated.View>
      {/* Cara frontal */}
      <Animated.View style={[
        styles.card, styles.cardFront,
        { transform: [{ rotateY: backRot }] },
        card.isEnglish ? styles.cardEn : styles.cardEs,
        isMatched && styles.cardMatchedFront,
      ]}>
        <Text style={styles.cardLangFlag}>{card.isEnglish ? '🇺🇸' : '🇪🇸'}</Text>
        <Text style={styles.cardWord} numberOfLines={2}>{card.text}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Tablero de Juego ─────────────────────────────────────────────────────────

interface GameBoardProps {
  categoryKey: string;
  onWin: (moves: number, ms: number) => void;
  onTimeUp: () => void;
  remainingMs: number;
}

function GameBoard({ categoryKey, onWin, onTimeUp, remainingMs }: GameBoardProps) {
  const words = useMemo(() => {
    if (categoryKey === 'random') return getRandomGameWords(PAIRS_COUNT);
    return getGameWordsByCategory(categoryKey, PAIRS_COUNT);
  }, [categoryKey]);

  const [cards, setCards] = useState<CardData[]>(() => buildCards(words));
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [startMs, setStartMs] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProcessing = useRef(false);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (startMs !== null) setElapsed(Date.now() - startMs);
    }, 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startMs]);

  // Detectar tiempo agotado
  useEffect(() => {
    if (remainingMs <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      onTimeUp();
    }
  }, [remainingMs]);

  const handleCardPress = useCallback((cardId: string) => {
    if (isProcessing.current) return;
    if (flipped.length >= 2) return;
    if (flipped.includes(cardId) || matched.includes(cardId)) return;

    if (startMs === null) setStartMs(Date.now());

    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      isProcessing.current = true;
      setMoves(m => m + 1);
      const [id1, id2] = newFlipped;
      const c1 = cards.find(c => c.id === id1)!;
      const c2 = cards.find(c => c.id === id2)!;

      if (c1.pairId === c2.pairId && c1.isEnglish !== c2.isEnglish) {
        // Par correcto
        const newMatched = [...matched, id1, id2];
        setTimeout(() => {
          setMatched(newMatched);
          setFlipped([]);
          isProcessing.current = false;
          if (newMatched.length === cards.length) {
            if (timerRef.current) clearInterval(timerRef.current);
            const totalMs = startMs ? Date.now() - startMs : elapsed;
            onWin(moves + 1, totalMs);
          }
        }, 400);
      } else {
        // Par incorrecto
        setTimeout(() => {
          setFlipped([]);
          isProcessing.current = false;
        }, 900);
      }
    }
  }, [flipped, matched, cards, startMs, elapsed, moves, onWin]);

  const pairsFound = matched.length / 2;

  return (
    <View style={styles.boardContainer}>
      {/* Stats del juego */}
      <View style={styles.boardStats}>
        <View style={styles.boardStat}>
          <Text style={styles.boardStatLabel}>Pares</Text>
          <Text style={styles.boardStatValue}>{pairsFound}/{PAIRS_COUNT}</Text>
        </View>
        <View style={styles.boardStat}>
          <Text style={styles.boardStatLabel}>Movimientos</Text>
          <Text style={styles.boardStatValue}>{moves}</Text>
        </View>
        <View style={styles.boardStat}>
          <Text style={styles.boardStatLabel}>Tiempo</Text>
          <Text style={styles.boardStatValue}>{formatTime(elapsed)}</Text>
        </View>
        <View style={styles.boardStat}>
          <Text style={styles.boardStatLabel}>Disponible</Text>
          <Text style={[styles.boardStatValue, remainingMs < 60000 && { color: '#FF4B4B' }]}>
            {formatTime(remainingMs)}
          </Text>
        </View>
      </View>

      {/* Tablero 4×3 */}
      <View style={styles.board}>
        {cards.map(card => (
          <MemCard
            key={card.id}
            card={card}
            isFlipped={flipped.includes(card.id)}
            isMatched={matched.includes(card.id)}
            onPress={() => handleCardPress(card.id)}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Pantalla Principal de Juegos ─────────────────────────────────────────────

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const { game, miniGame, addMiniGameTime, winMiniGame } = useGame();

  // null = selector, string = jugando, 'won' = ganó
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [wonStats, setWonStats] = useState({ moves: 0, ms: 0 });
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('random');

  const remainingMs = Math.max(0, MAX_DAILY_MS - miniGame.playedMs);

  const handleStartGame = useCallback((categoryKey: string) => {
    if (remainingMs <= 0) {
      Alert.alert('⏰ Tiempo agotado', 'Has usado tus 10 minutos diarios de juego. Vuelve mañana.');
      return;
    }
    setSelectedCategory(categoryKey);
    setActiveGame('memory');
    setGameWon(false);
    setRewardClaimed(false);
    setTimeUp(false);
  }, [remainingMs]);

  const handleWin = useCallback(async (moves: number, ms: number) => {
    setWonStats({ moves, ms });
    setGameWon(true);
    await addMiniGameTime(ms);
  }, [addMiniGameTime]);

  const handleTimeUp = useCallback(async () => {
    setTimeUp(true);
    await addMiniGameTime(remainingMs);
  }, [remainingMs, addMiniGameTime]);

  const handleClaimReward = useCallback(async () => {
    if (rewardClaimed) return;
    setRewardClaimed(true);
    await winMiniGame();
  }, [rewardClaimed, winMiniGame]);

  const handleBackToMenu = useCallback(() => {
    setActiveGame(null);
    setGameWon(false);
    setTimeUp(false);
    setRewardClaimed(false);
  }, []);

  // ─── Pantalla de Victoria ───────────────────────────────────────────────

  if (activeGame && gameWon) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.wonScreen}>
          <Text style={styles.wonEmoji}>🏆</Text>
          <Text style={styles.wonTitle}>¡Ganaste!</Text>
          <Text style={styles.wonSub}>{wonStats.moves} movimientos · {formatTime(wonStats.ms)}</Text>
          {!rewardClaimed ? (
            <TouchableOpacity style={styles.claimBtn} onPress={handleClaimReward}>
              <Text style={styles.claimBtnText}>🎁 Reclamar +{GEMS_REWARD} 💎</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.claimedBox}>
              <Text style={styles.claimedText}>✅ +{GEMS_REWARD} 💎 reclamados</Text>
              <Text style={styles.claimedSub}>Total: {game.gems} 💎</Text>
            </View>
          )}
          <TouchableOpacity style={styles.backMenuBtn} onPress={handleBackToMenu}>
            <Text style={styles.backMenuBtnText}>← Volver a Juegos</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Pantalla de Tiempo Agotado ─────────────────────────────────────────

  if (activeGame && timeUp) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.wonScreen}>
          <Text style={styles.wonEmoji}>⏰</Text>
          <Text style={[styles.wonTitle, { color: '#FF4B4B' }]}>Tiempo Agotado</Text>
          <Text style={styles.wonSub}>Has usado tus 10 minutos diarios.</Text>
          <Text style={[styles.wonSub, { marginTop: 4 }]}>Vuelve mañana para seguir jugando.</Text>
          <TouchableOpacity style={styles.backMenuBtn} onPress={handleBackToMenu}>
            <Text style={styles.backMenuBtnText}>← Volver a Juegos</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Tablero Activo ─────────────────────────────────────────────────────

  if (activeGame === 'memory') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.gameHeader}>
          <TouchableOpacity onPress={handleBackToMenu} style={styles.gameBackBtn}>
            <Text style={styles.gameBackBtnText}>← Salir</Text>
          </TouchableOpacity>
          <Text style={styles.gameHeaderTitle}>
            {GAME_CATEGORIES[selectedCategory]?.emoji || '🃏'} Memoria de Pares
          </Text>
          <View style={styles.gemsSmall}>
            <Text style={styles.gemsSmallText}>💎 {game.gems}</Text>
          </View>
        </View>
        <GameBoard
          categoryKey={selectedCategory}
          onWin={handleWin}
          onTimeUp={handleTimeUp}
          remainingMs={remainingMs}
        />
        <View style={styles.rewardHint}>
          <Text style={styles.rewardHintText}>
            💡 Completa el juego para ganar <Text style={{ color: '#00D4FF', fontWeight: '700' }}>+{GEMS_REWARD} 💎</Text>
          </Text>
        </View>
      </View>
    );
  }

  // ─── Selector de Juegos ─────────────────────────────────────────────────

  const categories = [
    { key: 'random', label: 'Aleatorio', emoji: '🎲', descEn: 'Random mix of all categories', descEs: 'Mezcla aleatoria de todas las categorías' },
    { key: 'colors', label: GAME_CATEGORIES.colors.label, emoji: GAME_CATEGORIES.colors.emoji, descEn: 'Match colors in English and Spanish', descEs: 'Empareja colores en inglés y español' },
    { key: 'numbers', label: GAME_CATEGORIES.numbers.label, emoji: GAME_CATEGORIES.numbers.emoji, descEn: 'Match numbers from 1 to 10', descEs: 'Empareja números del 1 al 10' },
    { key: 'animals', label: GAME_CATEGORIES.animals.label, emoji: GAME_CATEGORIES.animals.emoji, descEn: 'Match animal names in both languages', descEs: 'Empareja nombres de animales en ambos idiomas' },
    { key: 'greetings', label: GAME_CATEGORIES.greetings.label, emoji: GAME_CATEGORIES.greetings.emoji, descEn: 'Match greetings and basic phrases', descEs: 'Empareja saludos y frases básicas' },
    { key: 'house', label: GAME_CATEGORIES.house.label, emoji: GAME_CATEGORIES.house.emoji, descEn: 'Match parts of the house', descEs: 'Empareja partes de la casa' },
    { key: 'kitchen', label: GAME_CATEGORIES.kitchen.label, emoji: GAME_CATEGORIES.kitchen.emoji, descEn: 'Match kitchen objects and utensils', descEs: 'Empareja objetos y utensilios de cocina' },
    { key: 'school', label: GAME_CATEGORIES.school.label, emoji: GAME_CATEGORIES.school.emoji, descEn: 'Match school supplies and study items', descEs: 'Empareja útiles escolares y de estudio' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🎮 Juegos</Text>
          <Text style={styles.headerSub}>Gana 💎 jugando y aprendiendo</Text>
        </View>
        <View style={styles.gemsBadge}>
          <Text style={styles.gemsText}>💎 {game.gems}</Text>
        </View>
      </View>

      {/* Tiempo disponible */}
      <View style={styles.timeBar}>
        <Text style={styles.timeBarLabel}>⏱ Tiempo diario disponible:</Text>
        <Text style={[styles.timeBarValue, remainingMs < 60000 && { color: '#FF4B4B' }]}>
          {remainingMs <= 0 ? 'Agotado (vuelve mañana)' : formatTime(remainingMs)}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.gameList} showsVerticalScrollIndicator={false}>

        {/* Tarjeta principal del juego */}
        <View style={styles.gameCard}>
          <View style={styles.gameCardHeader}>
            <Text style={styles.gameCardBigEmoji}>🃏</Text>
            <View style={styles.gameCardInfo}>
              <Text style={styles.gameCardTitle}>Memory Pairs</Text>
              <Text style={styles.gameCardDescEn}>Match English words with their Spanish translations before time runs out!</Text>
              <Text style={styles.gameCardDescEs}>¡Empareja palabras en inglés con sus traducciones antes de que se acabe el tiempo!</Text>
            </View>
          </View>
          <View style={styles.gameCardReward}>
            <Text style={styles.gameCardRewardText}>🏆 Recompensa: +{GEMS_REWARD} 💎 por partida ganada</Text>
          </View>
        </View>

        {/* Selector de categoría */}
        <Text style={styles.sectionTitle}>Elige una categoría:</Text>
        <View style={styles.categoryGrid}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.catCard, remainingMs <= 0 && styles.catCardDisabled]}
              onPress={() => handleStartGame(cat.key)}
              activeOpacity={0.75}
            >
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={styles.catLabel}>{cat.label}</Text>
              <Text style={styles.catDescEn} numberOfLines={2}>{cat.descEn}</Text>
              <Text style={styles.catDescEs} numberOfLines={2}>{cat.descEs}</Text>
              <View style={styles.catPlayBtn}>
                <Text style={styles.catPlayBtnText}>{remainingMs <= 0 ? '🔒' : '▶ Jugar'}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const CARD_SIZE = 90;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },

  // Header selector
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#2D3148',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  gemsBadge: {
    backgroundColor: '#00D4FF18', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1.5, borderColor: '#00D4FF40',
  },
  gemsText: { color: '#00D4FF', fontSize: 15, fontWeight: '800' },

  // Barra de tiempo
  timeBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#1A1D27', borderBottomWidth: 1, borderBottomColor: '#2D3148',
  },
  timeBarLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  timeBarValue: { fontSize: 13, color: '#58CC02', fontWeight: '700' },

  // Lista de juegos
  gameList: { padding: 16, paddingBottom: 32, gap: 16 },

  // Tarjeta principal del juego
  gameCard: {
    backgroundColor: '#1A1D27', borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: '#8E5AF540',
  },
  gameCardHeader: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  gameCardBigEmoji: { fontSize: 52, lineHeight: 60 },
  gameCardInfo: { flex: 1 },
  gameCardTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  gameCardDescEn: { fontSize: 13, color: '#9CA3AF', lineHeight: 18, marginBottom: 4, fontStyle: 'italic' },
  gameCardDescEs: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  gameCardReward: {
    backgroundColor: '#FFD70015', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#FFD70030',
  },
  gameCardRewardText: { color: '#FFD700', fontSize: 13, fontWeight: '700', textAlign: 'center' },

  // Selector de categorías
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#9CA3AF', marginBottom: 4 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: {
    width: '47%', backgroundColor: '#1A1D27', borderRadius: 14,
    padding: 12, borderWidth: 1.5, borderColor: '#2D3148',
    alignItems: 'center',
  },
  catCardDisabled: { opacity: 0.5 },
  catEmoji: { fontSize: 32, marginBottom: 6 },
  catLabel: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  catDescEn: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 15, fontStyle: 'italic', marginBottom: 2 },
  catDescEs: { fontSize: 11, color: '#6B7280', textAlign: 'center', lineHeight: 15, marginBottom: 10 },
  catPlayBtn: {
    backgroundColor: '#8E5AF5', borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 6,
  },
  catPlayBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  // Header del juego activo
  gameHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#2D3148',
  },
  gameBackBtn: {
    backgroundColor: '#1A1D27', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#2D3148',
  },
  gameBackBtnText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  gameHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  gemsSmall: {
    backgroundColor: '#00D4FF18', borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#00D4FF30',
  },
  gemsSmallText: { color: '#00D4FF', fontSize: 13, fontWeight: '700' },

  // Tablero
  boardContainer: { flex: 1 },
  boardStats: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#2D3148', gap: 6,
  },
  boardStat: { flex: 1, alignItems: 'center' },
  boardStatLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' },
  boardStatValue: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginTop: 2 },
  board: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 8,
    justifyContent: 'center',
    alignContent: 'center',
  },
  cardWrapper: {
    width: CARD_SIZE,
    height: CARD_SIZE * 1.3,
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
    borderWidth: 2,
    borderColor: '#2D3148',
  },
  cardMatchedBack: { borderColor: '#58CC02' },
  cardFront: { borderWidth: 2 },
  cardMatchedFront: { borderColor: '#58CC02', backgroundColor: '#0D2010' },
  cardEn: { backgroundColor: '#0D1F2D', borderColor: '#1CB0F6' },
  cardEs: { backgroundColor: '#1A0D2D', borderColor: '#8E5AF5' },
  cardGem: { fontSize: 32 },
  cardLangFlag: { fontSize: 16, marginBottom: 4 },
  cardWord: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', lineHeight: 17 },

  // Pista de recompensa
  rewardHint: {
    marginHorizontal: 14, marginBottom: 14,
    backgroundColor: '#00D4FF10', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#00D4FF20', alignItems: 'center',
  },
  rewardHintText: { color: '#9CA3AF', fontSize: 13 },

  // Pantalla de victoria
  wonScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  wonEmoji: { fontSize: 80, marginBottom: 16 },
  wonTitle: { fontSize: 34, fontWeight: '800', color: '#FFD700', marginBottom: 8 },
  wonSub: { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
  claimBtn: {
    backgroundColor: '#00D4FF', borderRadius: 16,
    paddingHorizontal: 32, paddingVertical: 16, marginTop: 28, marginBottom: 12,
  },
  claimBtnText: { color: '#0F1117', fontSize: 17, fontWeight: '800' },
  claimedBox: { alignItems: 'center', marginTop: 24, marginBottom: 12 },
  claimedText: { color: '#58CC02', fontSize: 16, fontWeight: '700' },
  claimedSub: { color: '#9CA3AF', fontSize: 14, marginTop: 4 },
  backMenuBtn: {
    backgroundColor: '#1A1D27', borderRadius: 14,
    paddingHorizontal: 28, paddingVertical: 14, marginTop: 12,
    borderWidth: 1, borderColor: '#2D3148',
  },
  backMenuBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
