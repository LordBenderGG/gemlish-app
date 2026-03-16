/**
 * useAdMob - Hook centralizado para gestionar anuncios de AdMob en Gemlish.
 *
 * IDs de prueba oficiales de Google (funcionan sin cuenta AdMob real).
 * Cuando el usuario tenga su App ID de AdMob, solo hay que cambiar los IDs
 * en la sección AD_UNIT_IDS y en app.config.ts.
 *
 * Tipos de anuncios:
 * - Banner: se muestra en pantallas de navegación (Home, Stats)
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
  ADAPTIVE_BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
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
// Estos son los IDs de PRUEBA oficiales de Google.
// Reemplazar por los IDs reales cuando se tenga cuenta AdMob.
export const AD_UNIT_IDS = {
  // Banner
  BANNER_HOME: TestIds.ADAPTIVE_BANNER,
  BANNER_STATS: TestIds.ADAPTIVE_BANNER,

  // Interstitial
  INTERSTITIAL_LEVEL_COMPLETE: TestIds.INTERSTITIAL,
  INTERSTITIAL_PRACTICE_MODE: TestIds.INTERSTITIAL,

  // Rewarded
  REWARDED_CONTINUE: TestIds.REWARDED,
  REWARDED_DAILY_RETRY: TestIds.REWARDED,
  REWARDED_PRONUNCIATION: TestIds.REWARDED,
  REWARDED_HARD_MODE_HINT: TestIds.REWARDED,
};

// ─── Contador para mostrar interstitial cada N niveles ────────────────────────
let levelCompletedCount = 0;
const INTERSTITIAL_EVERY_N_LEVELS = 3;

// ─── Hook para Interstitial ───────────────────────────────────────────────────
export function useInterstitialAd(adUnitId: string) {
  const adRef = useRef<any | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadAd = useCallback(() => {
    if (Platform.OS === "web" || !InterstitialAd) return;
    const ad = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });
    adRef.current = ad;
    const unsubLoad = ad.addAdEventListener(AdEventType.LOADED, () => {
      setLoaded(true);
    });
    const unsubClose = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setLoaded(false);
      // Precargar el siguiente
      ad.load();
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

  const loadAd = useCallback(() => {
    if (Platform.OS === "web" || !RewardedAd) return;
    const ad = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });
    adRef.current = ad;
    const unsubLoad = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setLoaded(true);
    });
    const unsubEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        onRewardedRef.current();
      }
    );
    const unsubClose = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setLoaded(false);
      ad.load();
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
