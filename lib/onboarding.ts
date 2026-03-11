import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'gemlish_onboarding_done';

export async function hasSeenOnboarding(): Promise<boolean> {
  const val = await AsyncStorage.getItem(ONBOARDING_KEY);
  return val === 'true';
}

export async function markOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}
