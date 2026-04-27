import { kvGet, kvSet } from './local-kv';

const ONBOARDING_KEY = '@gemlish_onboarding_done';

export async function hasSeenOnboarding(): Promise<boolean> {
  const val = await kvGet(ONBOARDING_KEY);
  return val === 'true';
}

export async function markOnboardingDone(): Promise<void> {
  await kvSet(ONBOARDING_KEY, 'true');
}
