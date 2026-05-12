import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.10)',
  },
  backBtnText: { color: '#1E293B', fontSize: 16, fontWeight: '700' },
  progressBarBg: { flex: 1, height: 10, backgroundColor: '#E2E8F0', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: 10, borderRadius: 5 },
  heartsRow: { flexDirection: 'row', gap: 2 },
  heartIcon: { fontSize: 14 },
  heartEmpty: { opacity: 0.4 },
  exerciseSubHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  exerciseCount: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  hintBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#E2E8F0',
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintBtnText: { fontSize: 12, color: '#F59E0B', fontWeight: '600' },
  exerciseContainer: { padding: 20, flex: 1 },
  questionLabel: {
    fontSize: 12, color: '#64748B', fontWeight: '700',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  questionText: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 16, lineHeight: 28 },
  optionsGrid: { gap: 10 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 2, padding: 16, gap: 14,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  optionLetter: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },
  optionLetterText: { fontSize: 15, fontWeight: '800' },
  optionText: { fontSize: 16, fontWeight: '600', flex: 1, lineHeight: 22 },
  hintBox: {
    backgroundColor: '#FFD70020', borderRadius: 10, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: '#FFD70040',
  },
  hintText: { color: '#F59E0B', fontSize: 14 },
  hintAnswer: { fontWeight: '700' },
  translateInput: {
    backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E2E8F0',
    borderRadius: 12, padding: 16, color: '#1E293B', fontSize: 16, marginBottom: 16,
  },
  inputCorrect: { borderColor: '#4ADE80', backgroundColor: '#F0FDF4' },
  inputWrong: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  feedbackText: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  submitBtn: { backgroundColor: '#F59E0B', borderRadius: 12, padding: 16, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#E2E8F0' },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  // Match pairs
  matchHint: { fontSize: 12, color: '#64748B', marginBottom: 16, fontStyle: 'italic' },
  matchGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  matchColumn: { flex: 1, gap: 8 },
  matchColHeader: { fontSize: 12, color: '#64748B', fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  matchCard: {
    backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 2,
    borderColor: '#E2E8F0', padding: 12, alignItems: 'center',
    minHeight: 52, justifyContent: 'center', flexDirection: 'row', gap: 4,
  },
  matchCardSelected: { borderColor: '#4F46E5', backgroundColor: '#EFF6FF' },
  matchCardConnected: { borderColor: '#4ADE80', backgroundColor: '#F0FDF4' },
  matchCardWrong: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  matchCardText: { color: '#1E293B', fontSize: 13, fontWeight: '600', textAlign: 'center', flex: 1 },
  matchCheck: { fontSize: 14, color: '#4ADE80' },
  matchProgress: { fontSize: 13, color: '#64748B', textAlign: 'center', fontWeight: '600' },
  // Listen & Write
  listenBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: '#F59E0B20', borderRadius: 16, padding: 20, marginBottom: 24,
    borderWidth: 2, borderColor: '#F59E0B40',
  },
  listenBtnActive: { backgroundColor: '#F59E0B40', borderColor: '#F59E0B' },
  listenBtnEmoji: { fontSize: 32 },
  listenBtnText: { fontSize: 16, fontWeight: '700', color: '#F59E0B' },
  // Pronunciación
  pronunciationWord: {
    fontSize: 36, fontWeight: '800', color: '#FFFFFF',
    textAlign: 'center', marginBottom: 8,
  },
  pronunciationPhonetic: {
    fontSize: 18, color: '#4F46E5', textAlign: 'center',
    marginBottom: 6, fontStyle: 'italic',
  },
  pronunciationTranslation: {
    fontSize: 16, color: '#64748B', textAlign: 'center',
    marginBottom: 20,
  },
  pronunciationExampleBox: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
    marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0',
  },
  pronunciationExampleEn: {
    fontSize: 15, color: '#FFFFFF', fontWeight: '600',
    marginBottom: 6, lineHeight: 22,
  },
  pronunciationExampleEs: {
    fontSize: 13, color: '#64748B', fontStyle: 'italic', lineHeight: 20,
  },
  recordBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: '#FEE2E2', borderRadius: 16, padding: 20, marginBottom: 12,
    borderWidth: 2, borderColor: '#FF4B4B60',
  },
  recordBtnActive: {
    backgroundColor: '#FECACA', borderColor: '#EF4444',
  },
  recordBtnDone: {
    backgroundColor: '#58CC0220', borderColor: '#58CC0260',
  },
  recordBtnEmoji: { fontSize: 28 },
  recordBtnText: { fontSize: 15, fontWeight: '700', color: '#FF6B6B' },
  playbackBtn: {
    backgroundColor: '#38BDF820', borderRadius: 12, padding: 14,
    alignItems: 'center', marginBottom: 12,
    borderWidth: 2, borderColor: '#38BDF860',
  },
  playbackBtnActive: { backgroundColor: '#38BDF840', borderColor: '#38BDF8' },
  playbackBtnText: { fontSize: 15, fontWeight: '600', color: '#38BDF8' },
  noMicBox: {
    backgroundColor: '#FF9500' + '20', borderRadius: 12, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#FF9500' + '40',
    alignItems: 'center',
  },
  noMicText: { fontSize: 15, fontWeight: '700', color: '#FF9500', marginBottom: 4 },
  noMicSubtext: { fontSize: 13, color: '#64748B' },
  pronunciationDone: {
    backgroundColor: '#58CC0220', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 16,
  },
  pronunciationDoneText: { fontSize: 18, fontWeight: '700', color: '#4ADE80' },
  // Ordenar oración
  sentenceBuilderArea: {
    minHeight: 80, backgroundColor: '#FFFFFF', borderRadius: 12,
    borderWidth: 3, borderColor: '#E2E8F0', padding: 12,
    marginBottom: 16, justifyContent: 'center',
  },
  sentencePlaceholder: {
    color: '#64748B', fontSize: 14, textAlign: 'center', fontStyle: 'italic',
  },
  sentenceWordRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12,
  },
  sentenceChip: {
    backgroundColor: '#F0F4F8', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, borderWidth: 2, borderColor: '#D0D8E8',
  },
  sentenceChipSelected: {
    backgroundColor: '#FEF3C7', borderColor: '#F59E0B',
  },
  sentenceChipCorrect: {
    backgroundColor: '#F0FDF4', borderColor: '#22C55E',
  },
  sentenceChipWrong: {
    backgroundColor: '#FEF2F2', borderColor: '#EF4444',
  },
  sentenceChipText: { color: '#1E293B', fontSize: 15, fontWeight: '600' },
  sentenceDivider: {
    height: 1, backgroundColor: '#E2E8F0', marginVertical: 8,
  },
  sentenceButtonRow: {
    flexDirection: 'row', gap: 12, marginTop: 16,
  },
  resetBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 20,
  },
  resetBtnText: { color: '#64748B', fontSize: 15, fontWeight: '600' },
  // Completar la oración
  fillSentenceBox: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
    marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0',
  },
  fillSentenceText: {
    fontSize: 18, color: '#1E293B', lineHeight: 28, fontWeight: '500',
  },
  fillBlank: {
    color: '#F59E0B', fontWeight: '800', textDecorationLine: 'underline',
  },
  fillSentenceTranslation: {
    fontSize: 13, color: '#64748B', marginTop: 10,
    fontStyle: 'italic', lineHeight: 18,
  },
  sentenceTranslationBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
  },
  sentenceTranslationText: {
    fontSize: 13, color: '#64748B', fontStyle: 'italic', lineHeight: 18,
  },
  timerText: {
    fontSize: 12, color: '#64748B', fontVariant: ['tabular-nums'],
  },
  streakToast: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: '#FF9600',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    zIndex: 100,
    shadowColor: '#FF9600',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  streakToastText: {
    color: '#FFFFFF', fontSize: 15, fontWeight: '700',
  },
  floatingXP: {
    position: 'absolute',
    top: 120,
    right: 24,
    zIndex: 99,
  },
  floatingXPText: {
    color: '#4ADE80', fontSize: 18, fontWeight: '800',
    textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  breakdownContainer: {
    width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 16, marginVertical: 16, borderWidth: 1, borderColor: '#E2E8F0',
  },
  breakdownTitle: {
    fontSize: 14, color: '#64748B', fontWeight: '700', marginBottom: 12, textTransform: 'uppercase',
  },
  breakdownRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8,
  },
  breakdownLabel: {
    fontSize: 12, color: '#1E293B', width: 100,
  },
  breakdownBarBg: {
    flex: 1, height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden',
  },
  breakdownBarFill: {
    height: 8, borderRadius: 4,
  },
  breakdownPct: {
    fontSize: 12, color: '#64748B', width: 30, textAlign: 'right',
  },
  fillOptionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  fillOptionBtn: {
    borderRadius: 12, borderWidth: 2, padding: 14,
    minWidth: '45%', alignItems: 'center', flex: 1,
  },
  fillOptionText: { fontSize: 16, fontWeight: '600' },
  // Resultado
  resultContainer: { justifyContent: 'center', alignItems: 'center', padding: 32 },
  resultEmoji: { fontSize: 90, marginBottom: 16 },
  resultTitle: {
    fontSize: 34, fontWeight: '900', color: '#1E293B', marginBottom: 8,
  },
  resultSubtitle: { fontSize: 16, color: '#4F46E5', marginBottom: 32, fontWeight: '600' },
  rewardsRow: { flexDirection: 'row', gap: 10, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' },
  rewardBadge: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0', minWidth: 80,
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  rewardEmoji: { fontSize: 30, marginBottom: 6 },
  rewardValue: { color: '#1E293B', fontSize: 14, fontWeight: '800' },
  continueBtn: {
    backgroundColor: '#F59E0B', borderRadius: 18, paddingHorizontal: 48, paddingVertical: 18,
    shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 8,
  },
  continueBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
  // Pulso del botón de grabar
  recordPulseWrapper: {
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  pulseRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 2,
  },
  pulseRing1: {
    borderColor: '#EF4444',
    backgroundColor: 'transparent',
  },
  pulseRing2: {
    borderColor: '#EF4444',
    backgroundColor: 'transparent',
  },
  // Ícono de tipo en sub-header
  exerciseTypeTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  exerciseTypeEmoji: { fontSize: 14 },
  exerciseTypeName: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  subHeaderRight: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  streakBadge: {
    backgroundColor: '#FEE2E2', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#FF4B4B60',
  },
  streakBadgeText: { fontSize: 12, color: '#FF6B6B', fontWeight: '700' },
  challengeBonusBanner: {
    backgroundColor: '#FFD70015', borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1.5, borderColor: '#FFD70060',
    alignItems: 'center',
  },
  challengeBonusTitle: { fontSize: 16, fontWeight: '800', color: '#F59E0B', marginBottom: 4 },
  challengeBonusText: { fontSize: 13, color: '#FFD700AA', marginBottom: 10 },
  challengeBonusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  challengeBonusBadge: {
    backgroundColor: '#FFD70022', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: '#F59E0B',
  },
  challengeBonusBadgeText: { fontSize: 13, color: '#F59E0B', fontWeight: '700' },
});

export const perfectStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  trophyWrapper: {
    marginBottom: 24,
    alignItems: 'center',
  },
  trophyGlow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFD70020',
    borderWidth: 2,
    borderColor: '#FFD70050',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  trophyEmoji: {
    fontSize: 72,
  },
  perfectTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#F59E0B',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 6,
  },
  perfectSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 4,
  },
  perfectTagline: {
    fontSize: 13,
    color: '#4ADE80',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
    marginBottom: 32,
  },
  statCard: {
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    minWidth: 100,
    flex: 1,
    borderWidth: 1,
  },
  statCardWide: {
    minWidth: '100%',
    flex: 0,
  },
  statCardGold: {
    backgroundColor: '#FFD70015',
    borderColor: '#FFD70040',
  },
  statCardBlue: {
    backgroundColor: '#1CB0F615',
    borderColor: '#1CB0F640',
  },
  statCardGreen: {
    backgroundColor: '#4ADE8015',
    borderColor: '#4ADE8040',
  },
  statCardRed: {
    backgroundColor: '#FF4B4B15',
    borderColor: '#FECACA',
  },
  statCardPurple: {
    backgroundColor: '#CE82FF15',
    borderColor: '#CE82FF40',
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonsContainer: {
    width: '100%',
    gap: 10,
  },
  continueBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  repeatBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  repeatBtnText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
});
