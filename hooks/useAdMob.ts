/**
 * useAdMob - Hook centralizado para gestionar anuncios de AdMob en Gemlish (Android).
 *
 * Tipos de anuncios:
 * - Banner: se muestra en pantallas de navegación
 * - Interstitial: pantalla completa al completar nivel o abrir práctica
 * - Rewarded: el usuario elige verlo a cambio de una recompensa
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Platform } from "react-native";

// On web, react-native-google-mobile-ads is excluded from the bundle.
// We provide safe fallback values to prevent runtime errors.
let InterstitialAd: any = null;
let RewardedAd: any = null;
let AdEventType: any = {};
let RewardedAdEventType: any = {};
let TestIds: any = {
  ADAPTIVE_BANNER: 'ca-app-pub-6926294559691397/1826698506',
  INTERSTITIAL: 'ca-app-pub-6926294559691397/5438640450',
  REWARDED: 'ca-app-pub-6926294559691397/1126340448',
};

if (Platform.OS !== 'web') {
  try {
    const ads = require('react-native-google-mobile-ads');
    InterstitialAd = ads.InterstitialAd;
    RewardedAd = ads.RewardedAd;
    AdEventType = ads.AdEventType;
    RewardedAdEventType = ads.RewardedAdEventType;
    TestIds = ads.TestIds;
  } catch (e) {
    // Module not available
  }
}

// ─── IDs de anuncios ──────────────────────────────────────────────────────────
// AdMob exige IDs distintos por FORMATO (banner / interstitial / rewarded).
// Dentro del mismo formato, el mismo ID puede reutilizarse en múltiples
// pantallas o placements sin violar ninguna política.
//
// Unidades creadas en AdMob (ca-app-pub-6926294559691397):
//   Banner      → 8657131164
//   Interstitial → 2084951559
//   Rewarded    → 8161108035
//
export const AD_UNIT_IDS = {
  // ── Banners ────────────────────────────────────────────────────────────────
  // Un único ID de banner reutilizable en todas las pantallas (política AdMob permite esto)
  BANNER_HOME:  'ca-app-pub-6926294559691397/1826698506',

  // ── Interstitials ──────────────────────────────────────────────────────────
  INTERSTITIAL_LEVEL_COMPLETE: 'ca-app-pub-6926294559691397/5438640450',
  INTERSTITIAL_PRACTICE_MODE:  'ca-app-pub-6926294559691397/5438640450',

  // ── Rewarded ───────────────────────────────────────────────────────────────
  REWARDED_CONTINUE:        'ca-app-pub-6926294559691397/1126340448',
  REWARDED_DAILY_RETRY:     'ca-app-pub-6926294559691397/1126340448',
  REWARDED_PRONUNCIATION:   'ca-app-pub-6926294559691397/1126340448',
  REWARDED_HARD_MODE_HINT:  'ca-app-pub-6926294559691397/1126340448',
};

// ─── Contador para mostrar interstitial cada N niveles ────────────────────────
let levelCompletedCount = 0;
const INTERSTITIAL_EVERY_N_LEVELS = 3;

// ─── Hook para Interstitial ───────────────────────────────────────────────────
export function useInterstitialAd(adUnitId: string) {
  const adRef = useRef<any | null>(null);
  const [loaded, setLoaded] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const loadAd = useCallback(() => {
    if (Platform.OS === "web" || !InterstitialAd) return;
    const ad = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });
    adRef.current = ad;
    const unsubLoad = ad.addAdEventListener(AdEventType.LOADED, () => {
      if (isMountedRef.current) setLoaded(true);
    });
    const unsubClose = ad.addAdEventListener(AdEventType.CLOSED, () => {
      if (isMountedRef.current) setLoaded(false);
      // Solo precargar el siguiente si el componente sigue montado
      if (isMountedRef.current) ad.load();
    });
    ad.load();
    return () => {
      unsubLoad();
      unsubClose();
    };
  }, [adUnitId]);

  useEffect(() => {
    const cleanup = loadAd();
    return cleanup;
  }, [loadAd]);

  const showAd = useCallback(() => {
    if (Platform.OS === "web") return false;
    if (loaded && adRef.current) {
      adRef.current.show();
      return true;
    }
    return false;
  }, [loaded]);

  return { loaded, showAd };
}

// ─── Hook para Interstitial al completar nivel (cada N niveles) ───────────────
export function useLevelCompleteAd() {
  const { loaded, showAd } = useInterstitialAd(
    AD_UNIT_IDS.INTERSTITIAL_LEVEL_COMPLETE
  );

  const showIfNeeded = useCallback(() => {
    levelCompletedCount += 1;
    if (levelCompletedCount % INTERSTITIAL_EVERY_N_LEVELS === 0) {
      return showAd();
    }
    return false;
  }, [showAd]);

  return { showIfNeeded };
}

// ─── Hook para Rewarded ───────────────────────────────────────────────────────
export function useRewardedAd(
  adUnitId: string,
  onRewarded: () => void
) {
  const adRef = useRef<any | null>(null);
  const [loaded, setLoaded] = useState(false);
  const onRewardedRef = useRef(onRewarded);
  onRewardedRef.current = onRewarded;
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const loadAd = useCallback(() => {
    if (Platform.OS === "web" || !RewardedAd) return;
    const ad = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });
    adRef.current = ad;
    const unsubLoad = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      if (isMountedRef.current) setLoaded(true);
    });
    const unsubEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        // Invocar siempre: la recompensa es válida aunque el modal cambie de estado
        onRewardedRef.current();
      }
    );
    const unsubClose = ad.addAdEventListener(AdEventType.CLOSED, () => {
      if (isMountedRef.current) setLoaded(false);
      // Solo recargar si el componente sigue vivo para evitar crash en Android
      if (isMountedRef.current) ad.load();
    });
    ad.load();
    return () => {
      unsubLoad();
      unsubEarned();
      unsubClose();
    };
  }, [adUnitId]);

  useEffect(() => {
    const cleanup = loadAd();
    return cleanup;
  }, [loadAd]);

  const showAd = useCallback(() => {
    if (Platform.OS === "web") return false;
    if (loaded && adRef.current) {
      adRef.current.show();
      return true;
    }
    return false;
  }, [loaded]);

  return { loaded, showAd };
}
