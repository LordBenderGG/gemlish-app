import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  StatusBar, FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { useSpeech } from '@/hooks/use-speech';
import { LESSONS } from '@/data/lessons';
import { useThemeStyles } from '@/hooks/use-theme-styles';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Buscar datos de una palabra en las lecciones
function findWordData(wordEn: string) {
  for (const lesson of LESSONS) {
    const word = lesson.words.find(w => w.word.toLowerCase() === wordEn.toLowerCase());
    if (word) return { word, lesson };
  }
  return null;
}

// ─── Tarjeta de Palabra ──────────────────────────────────────────────────────

function WordReviewCard({ wordEn, onMastered }: { wordEn: string; onMastered: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const [mastered, setMastered] = useState(false);
  const { speaking, toggle } = useSpeech();
  const data = useMemo(() => findWordData(wordEn), [wordEn]);

  const handleMastered = () => {
    setMastered(true);
    setTimeout(onMastered, 300);
  };

  if (!data) return null;
  const { word } = data;

  return (
    <View style={[styles.card, mastered && styles.cardMastered]}>
      {/* Frente: inglés */}
      <View style={styles.cardFront}>
        <View style={styles.cardWordRow}>
          <Text style={styles.cardWordEn}>{word.word}</Text>
          <TouchableOpacity
            style={[styles.speakBtn, speaking && styles.speakBtnActive]}
            onPress={() => toggle(word.word)}
          >
            <Text style={styles.speakBtnText}>{speaking ? '⏹' : '🔊'}</Text>
          </TouchableOpacity>
        </View>
        {word.pronunciation && (
          <Text style={styles.cardPhonetic}>{word.pronunciation}</Text>
        )}
        <Text style={styles.cardWordEs}>{word.translation}</Text>
      </View>

      {/* Ejemplo */}
      <TouchableOpacity style={styles.exampleToggle} onPress={() => setFlipped(f => !f)}>
        <Text style={styles.exampleToggleText}>
          {flipped ? '▲ Ocultar ejemplo' : '▼ Ver ejemplo de uso'}
        </Text>
      </TouchableOpacity>

      {flipped && word.example && (
        <View style={styles.exampleBox}>
          <Text style={styles.exampleEn}>"{word.example}"</Text>
          <Text style={styles.exampleEs}>{word.exampleEs}</Text>
        </View>
      )}

      {/* Acciones */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnGreen]}
          onPress={handleMastered}
          disabled={mastered}
        >
          <Text style={styles.actionBtnText}>✓ Ya lo sé</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnOrange]}
          onPress={() => toggle(word.word)}
        >
          <Text style={styles.actionBtnText}>🔊 Escuchar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Pantalla Principal ───────────────────────────────────────────────────────

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const t = useThemeStyles();
  const scheme = useColorScheme();
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const { game } = useGame();
  const levelNum = parseInt(levelId || '1', 10);

  const errorWords = useMemo(() => {
    return game.levelErrors?.[levelNum] || [];
  }, [game.levelErrors, levelNum]);

  const [masteredWords, setMasteredWords] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);

  const handleMastered = useCallback((word: string) => {
    setMasteredWords(prev => {
      const next = new Set(prev);
      next.add(word);
      if (next.size >= errorWords.length) {
        setTimeout(() => setFinished(true), 400);
      }
      return next;
    });
  }, [errorWords.length]);

  const remaining = errorWords.filter(w => !masteredWords.has(w));

  if (errorWords.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: '#0E1117' }]}>
        <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>¡Sin errores!</Text>
          <Text style={styles.emptySubtitle}>Completaste el nivel {levelNum} sin cometer errores. ¡Excelente!</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (finished) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: '#0E1117' }]}>
        <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🏆</Text>
          <Text style={styles.emptyTitle}>¡Repaso completado!</Text>
          <Text style={styles.emptySubtitle}>
            Repasaste {errorWords.length} palabra{errorWords.length > 1 ? 's' : ''} del nivel {levelNum}.
            {'\n'}¡Sigue practicando para dominarlas!
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Volver al mapa</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: '#0E1117' }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Text style={styles.headerBackText}>← Salir</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🔄 Repaso de Errores</Text>
          <Text style={styles.headerSubtitle}>Nivel {levelNum}</Text>
        </View>
        <View style={styles.headerCounter}>
          <Text style={styles.headerCounterText}>{masteredWords.size}/{errorWords.length}</Text>
        </View>
      </View>

      {/* Barra de progreso */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, {
          width: `${errorWords.length > 0 ? (masteredWords.size / errorWords.length) * 100 : 0}%`
        }]} />
      </View>

      <FlatList
        data={remaining}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <WordReviewCard
            wordEn={item}
            onMastered={() => handleMastered(item)}
          />
        )}
        ListHeaderComponent={
          <Text style={styles.listHeader}>
            Palabras que necesitas repasar — toca "Ya lo sé" cuando las domines
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>✅</Text>
            <Text style={styles.emptyTitle}>¡Todas dominadas!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2235',
  },
  headerBack: {
    paddingRight: 12,
  },
  headerBackText: {
    color: '#38BDF8',
    fontSize: 15,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#9BA1A6',
    fontSize: 12,
    marginTop: 2,
  },
  headerCounter: {
    backgroundColor: '#38BDF8',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerCounterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#1E2235',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#FF9500',
    borderRadius: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  listHeader: {
    color: '#9BA1A6',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#161B27',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3450',
  },
  cardMastered: {
    borderColor: '#4ADE80',
    opacity: 0.6,
  },
  cardFront: {
    marginBottom: 12,
  },
  cardWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardWordEn: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  cardPhonetic: {
    color: '#38BDF8',
    fontSize: 14,
    marginBottom: 6,
  },
  cardWordEs: {
    color: '#1CB0F6',
    fontSize: 18,
    fontWeight: '600',
  },
  speakBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1CB0F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakBtnActive: {
    backgroundColor: '#FF4B4B',
  },
  speakBtnText: {
    fontSize: 20,
  },
  exampleToggle: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#2A3450',
  },
  exampleToggleText: {
    color: '#9BA1A6',
    fontSize: 13,
    textAlign: 'center',
  },
  exampleBox: {
    backgroundColor: '#0F1117',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
  },
  exampleEn: {
    color: '#ECEDEE',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  exampleEs: {
    color: '#9BA1A6',
    fontSize: 13,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnGreen: {
    backgroundColor: '#1A3A1A',
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  actionBtnOrange: {
    backgroundColor: '#1A2A3A',
    borderWidth: 1,
    borderColor: '#1CB0F6',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#9BA1A6',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  backBtn: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
