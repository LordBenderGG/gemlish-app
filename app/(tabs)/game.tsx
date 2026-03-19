import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Alert,
  ScrollView, Animated, useWindowDimensions,
} from 'react-native';
import { useRewardedAd, AD_UNIT_IDS } from '@/hooks/useAdMob';
import { getVideoWatchStatus, recordVideoWatched } from '@/lib/storage';
import { AdBanner } from '@/components/AdBanner';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { useThemeStyles } from '@/hooks/use-theme-styles';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  GAME_CATEGORIES, getGameWordsByCategory, getRandomGameWords, GameWord,
} from '@/data/gameWords';

const MAX_DAILY_MS = 30 * 60 * 1000; // 30 minutos
const PAIRS_COUNT = 12; // 12 pares = 24 cartas = tablero 6×4
const GEMS_REWARD = 10; // Recompensa por ganar Memory Pairs
const VIDEO_GEMS = 50; // Gemas por ver video en Memory Pairs
const VIDEO_MAX_DAILY = 3; // Máximo 3 videos por día
const VIDEO_COOLDOWN_MS = 20 * 60 * 1000; // 20 minutos entre videos

// CARD_WIDTH se calcula dinámicamente en GameBoard con useWindowDimensions
// para que sea responsive en tablets y phones de distintos tamaños

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
  cardWidth: number;
  cardHeight: number;
}

function MemCard({ card, isFlipped, isMatched, onPress, cardWidth, cardHeight }: MemCardProps) {
  const anim = useRef(new Animated.Value(isFlipped || isMatched ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isFlipped || isMatched ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isFlipped, isMatched]);

  const frontRot = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRot = anim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <TouchableOpacity
      style={[styles.cardWrapper, { width: cardWidth, height: cardHeight }]}
      onPress={onPress}
      disabled={isFlipped || isMatched}
      activeOpacity={0.85}
    >
      <Animated.View style={[
        styles.card, styles.cardBack,
        { transform: [{ rotateY: frontRot }] },
        isMatched && styles.cardMatchedBack,
      ]}>
        <Text style={{ fontSize: cardWidth * 0.35 }}>💎</Text>
      </Animated.View>
      <Animated.View style={[
        styles.card,
        { transform: [{ rotateY: backRot }] },
        card.isEnglish ? styles.cardEn : styles.cardEs,
        isMatched && styles.cardMatchedFront,
      ]}>
        <Text style={styles.cardLangFlag}>{card.isEnglish ? '🇺🇸' : '🇪🇸'}</Text>
        <Text style={[styles.cardWord, { fontSize: cardWidth > 55 ? 11 : 9 }]} numberOfLines={2}>
          {card.text}
        </Text>
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
  const { width: screenW } = useWindowDimensions();
  // 6 columnas con padding 10 a cada lado y gap 6 entre cartas — responsive
  const cardWidth = Math.floor((screenW - 20 - 5 * 6) / 6);
  const cardHeight = Math.floor(cardWidth * 1.25);

  const words = useMemo(() => {
    if (categoryKey === 'random') return getRandomGameWords(PAIRS_COUNT);
    // Si la categoría tiene menos de 12 palabras, completar con aleatorias de otras
    const catWords = getGameWordsByCategory(categoryKey, PAIRS_COUNT);
    if (catWords.length < PAIRS_COUNT) {
      const extra = getRandomGameWords(PAIRS_COUNT - catWords.length);
      const combined = [...catWords, ...extra.filter(w => w.category !== categoryKey)];
      return combined.slice(0, PAIRS_COUNT);
    }
    return catWords;
  }, [categoryKey]);

  const [cards, setCards] = useState<CardData[]>(() => buildCards(words));
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [startMs, setStartMs] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (startMs !== null) setElapsed(Date.now() - startMs);
    }, 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startMs]);

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
        }, 350);
      } else {
        setTimeout(() => {
          setFlipped([]);
          isProcessing.current = false;
        }, 800);
      }
    }
  }, [flipped, matched, cards, startMs, elapsed, moves, onWin]);

  const pairsFound = matched.length / 2;

  return (
    <View style={styles.boardContainer}>
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
          <Text style={[styles.boardStatValue, remainingMs < 60000 && { color: '#EF4444' }]}>
            {formatTime(remainingMs)}
          </Text>
        </View>
      </View>

      {/* Tablero 6 columnas × 4 filas */}
      <View style={styles.board}>
        {cards.map(card => (
          <MemCard
            key={card.id}
            card={card}
            isFlipped={flipped.includes(card.id)}
            isMatched={matched.includes(card.id)}
            onPress={() => handleCardPress(card.id)}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Pantalla Principal de Juegos ─────────────────────────────────────────────

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const t = useThemeStyles();
  const scheme = useColorScheme();
  const { game, username, updateGame, addGems, miniGame, addMiniGameTime, winMiniGame } = useGame();

  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [wonStats, setWonStats] = useState({ moves: 0, ms: 0 });
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('random');

  // ─── Estado del botón Ver Video ─────────────────────────────────────────
  const [videoStatus, setVideoStatus] = useState<{
    canWatch: boolean;
    reason?: string;
    msUntilAvailable?: number;
    usesToday?: number;
  }>({ canWatch: true });
  const [videoCountdown, setVideoCountdown] = useState('');
  const videoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshVideoStatus = useCallback(async () => {
    if (!username) return;
    const status = await getVideoWatchStatus(username);
    setVideoStatus(status);
  }, [username]);

  useEffect(() => {
    refreshVideoStatus();
  }, [refreshVideoStatus]);

  // Actualizar countdown cada segundo cuando hay cooldown
  useEffect(() => {
    if (videoTimerRef.current) clearInterval(videoTimerRef.current);
    if (videoStatus.canWatch || !videoStatus.msUntilAvailable) {
      setVideoCountdown('');
      return;
    }
    const updateCountdown = () => {
      const ms = videoStatus.msUntilAvailable! - (Date.now() - (Date.now() - videoStatus.msUntilAvailable!));
      // Recalcular desde el estado actual
      refreshVideoStatus();
    };
    videoTimerRef.current = setInterval(refreshVideoStatus, 10000); // refresh cada 10s
    return () => { if (videoTimerRef.current) clearInterval(videoTimerRef.current); };
  }, [videoStatus.canWatch, videoStatus.msUntilAvailable, refreshVideoStatus]);

  const formatCooldown = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handleVideoRewarded = useCallback(async () => {
    if (!username) return;
    await recordVideoWatched(username);
    await addGems(VIDEO_GEMS);
    await refreshVideoStatus();
    Alert.alert('🎉 ¡Recompensa!', `+${VIDEO_GEMS} 💎 añadidas a tu cuenta.`);
  }, [username, addGems, refreshVideoStatus]);

  const { loaded: videoAdLoaded, showAd: showVideoAd } = useRewardedAd(
    AD_UNIT_IDS.REWARDED_CONTINUE,
    handleVideoRewarded
  );

  const handleWatchVideo = useCallback(async () => {
    if (!videoStatus.canWatch) return;
    const shown = showVideoAd();
    if (!shown) {
      Alert.alert('Sin anuncios', 'No hay anuncios disponibles ahora. Intenta en unos minutos.');
    }
  }, [videoStatus.canWatch, showVideoAd]);

  const remainingMs = Math.max(0, MAX_DAILY_MS - miniGame.playedMs);

  const handleStartGame = useCallback((categoryKey: string) => {
    if (remainingMs <= 0) {
      Alert.alert('⏰ Tiempo agotado', 'Has usado tus 30 minutos diarios de juego. Vuelve mañana.');
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

  // ─── Victoria ───────────────────────────────────────────────────────────

  if (activeGame && gameWon) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: t.bg }]}>
        <StatusBar barStyle="dark-content" />
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

  // ─── Tiempo Agotado ─────────────────────────────────────────────────────

  if (activeGame && timeUp) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: t.bg }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.wonScreen}>
          <Text style={styles.wonEmoji}>⏰</Text>
          <Text style={[styles.wonTitle, { color: '#EF4444' }]}>Tiempo Agotado</Text>
          <Text style={styles.wonSub}>Has usado tus 30 minutos diarios.</Text>
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
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: t.bg }]}>
        <StatusBar barStyle="dark-content" />
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
        {/* Banner AdMob dentro del tablero de juego */}
        <AdBanner style={{ marginHorizontal: 0 }} />
        <View style={styles.rewardHint}>
          <Text style={styles.rewardHintText}>
            💡 Completa el juego para ganar <Text style={{ color: '#4F46E5', fontWeight: '700' }}>+{GEMS_REWARD} 💎</Text>
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
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: t.bg }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🎮 Juegos</Text>
          <Text style={styles.headerSub}>Gana 💎 jugando y aprendiendo</Text>
        </View>
        <View style={styles.gemsBadge}>
          <Text style={styles.gemsText}>💎 {game.gems}</Text>
        </View>
      </View>

      <View style={styles.timeBar}>
        <Text style={styles.timeBarLabel}>⏱ Tiempo diario (30 min):</Text>
        <Text style={[styles.timeBarValue, remainingMs < 60000 && { color: '#EF4444' }]}>
          {remainingMs <= 0 ? 'Agotado (vuelve mañana)' : formatTime(remainingMs)}
        </Text>
      </View>

      {/* Banner AdMob — inicio del Minijuego */}
      <AdBanner style={{ marginBottom: 4 }} />

      <ScrollView contentContainerStyle={styles.gameList} showsVerticalScrollIndicator={false}>
        <View style={styles.gameCard}>
          <View style={styles.gameCardHeader}>
            <Text style={styles.gameCardBigEmoji}>🃏</Text>
            <View style={styles.gameCardInfo}>
              <Text style={styles.gameCardTitle}>Memory Pairs</Text>
              <Text style={styles.gameCardDescEn}>Match 12 English words with their Spanish translations before time runs out!</Text>
              <Text style={styles.gameCardDescEs}>¡Empareja 12 palabras en inglés con sus traducciones antes de que se acabe el tiempo!</Text>
            </View>
          </View>
          <View style={styles.gameCardReward}>
            <Text style={styles.gameCardRewardText}>🏆 Recompensa: +{GEMS_REWARD} 💎 por partida ganada · 30 min diarios</Text>
          </View>

          {/* Botón Ver Video */}
          <View style={styles.videoRewardSection}>
            <View style={styles.videoRewardInfo}>
              <Text style={styles.videoRewardTitle}>🎬 Ver video · +{VIDEO_GEMS} 💎</Text>
              <Text style={styles.videoRewardSub}>
                {videoStatus.canWatch
                  ? `Disponible · ${VIDEO_MAX_DAILY - (videoStatus.usesToday ?? 0)} de ${VIDEO_MAX_DAILY} usos restantes hoy`
                  : videoStatus.reason === 'blocked_24h'
                    ? `🔒 Bloqueado · disponible en ${formatCooldown(videoStatus.msUntilAvailable ?? 0)}`
                    : `⏳ Cooldown · disponible en ${formatCooldown(videoStatus.msUntilAvailable ?? 0)}`
                }
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.videoBtn,
                (!videoStatus.canWatch || !videoAdLoaded) && styles.videoBtnDisabled,
              ]}
              onPress={handleWatchVideo}
              disabled={!videoStatus.canWatch || !videoAdLoaded}
              activeOpacity={0.8}
            >
              <Text style={styles.videoBtnText}>
                {!videoStatus.canWatch ? '🔒' : !videoAdLoaded ? '⏳' : '▶ Ver'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  headerSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  gemsBadge: {
    backgroundColor: '#EFF6FF', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1.5, borderColor: '#C7D2FE',
  },
  gemsText: { color: '#4F46E5', fontSize: 15, fontWeight: '800' },
  timeBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  timeBarLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  timeBarValue: { fontSize: 13, color: '#4ADE80', fontWeight: '700' },
  gameList: { padding: 16, paddingBottom: 32, gap: 16 },
  gameCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: '#38BDF840',
  },
  gameCardHeader: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  gameCardBigEmoji: { fontSize: 52, lineHeight: 60 },
  gameCardInfo: { flex: 1 },
  gameCardTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  gameCardDescEn: { fontSize: 13, color: '#64748B', lineHeight: 18, marginBottom: 4, fontStyle: 'italic' },
  gameCardDescEs: { fontSize: 12, color: '#64748B', lineHeight: 17 },
  gameCardReward: {
    backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  gameCardRewardText: { color: '#F59E0B', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#64748B', marginBottom: 4 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: {
    width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 12, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center',
  },
  catCardDisabled: { opacity: 0.5 },
  catEmoji: { fontSize: 32, marginBottom: 6 },
  catLabel: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  catDescEn: { fontSize: 11, color: '#64748B', textAlign: 'center', lineHeight: 15, fontStyle: 'italic', marginBottom: 2 },
  catDescEs: { fontSize: 11, color: '#64748B', textAlign: 'center', lineHeight: 15, marginBottom: 10 },
  catPlayBtn: {
    backgroundColor: '#38BDF8', borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 6,
  },
  catPlayBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  gameHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  gameBackBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  gameBackBtnText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  gameHeaderTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  gemsSmall: {
    backgroundColor: '#EFF6FF', borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#C7D2FE',
  },
  gemsSmallText: { color: '#4F46E5', fontSize: 13, fontWeight: '700' },
  boardContainer: { flex: 1 },
  boardStats: {
    flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 4,
  },
  boardStat: { flex: 1, alignItems: 'center' },
  boardStatLabel: { fontSize: 9, color: '#64748B', fontWeight: '600', textTransform: 'uppercase' },
  boardStatValue: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginTop: 1 },
  board: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 6,
    justifyContent: 'center',
    alignContent: 'center',
  },
  cardWrapper: {
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
    padding: 4,
  },
  cardBack: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  cardMatchedBack: { borderColor: '#4ADE80' },
  cardMatchedFront: { borderColor: '#4ADE80', backgroundColor: '#F0FDF4' },
  cardEn: { backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: '#4F46E5' },
  cardEs: { backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: '#38BDF8' },
  cardLangFlag: { fontSize: 10, marginBottom: 2 },
  cardWord: { fontWeight: '700', color: '#1E293B', textAlign: 'center', lineHeight: 14 },
  rewardHint: {
    marginHorizontal: 14, marginBottom: 10,
    backgroundColor: '#EFF6FF', borderRadius: 10, padding: 8,
    borderWidth: 1, borderColor: '#DBEAFE', alignItems: 'center',
  },
  rewardHintText: { color: '#64748B', fontSize: 12 },
  wonScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  wonEmoji: { fontSize: 80, marginBottom: 16 },
  wonTitle: { fontSize: 34, fontWeight: '800', color: '#F59E0B', marginBottom: 8 },
  wonSub: { fontSize: 15, color: '#64748B', textAlign: 'center' },
  claimBtn: {
    backgroundColor: '#4F46E5', borderRadius: 16,
    paddingHorizontal: 32, paddingVertical: 16, marginTop: 28, marginBottom: 12,
  },
  claimBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  claimedBox: { alignItems: 'center', marginTop: 24, marginBottom: 12 },
  claimedText: { color: '#4ADE80', fontSize: 16, fontWeight: '700' },
  claimedSub: { color: '#64748B', fontSize: 14, marginTop: 4 },
  backMenuBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    paddingHorizontal: 28, paddingVertical: 14, marginTop: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  backMenuBtnText: { color: '#64748B', fontSize: 15, fontWeight: '600' },
  videoRewardSection: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 14, marginTop: 10, marginBottom: 4,
    backgroundColor: '#F5F3FF', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#DDD6FE',
  },
  videoRewardInfo: { flex: 1 },
  videoRewardTitle: { fontSize: 14, fontWeight: '700', color: '#4F46E5' },
  videoRewardSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  videoBtn: {
    backgroundColor: '#4F46E5', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, marginLeft: 10,
  },
  videoBtnDisabled: { backgroundColor: '#C4B5FD' },
  videoBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
