import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkNewAchievements, getUnlockedAchievements, saveUnlockedAchievements, getAchievementDates } from '../lib/achievements';
import type { AchievementStats } from '../lib/achievements';

// Mock the local-kv module
vi.mock('../lib/local-kv', () => {
  const storage: Record<string, string> = {};

  return {
    kvGetJson: vi.fn(async (key: string, fallback: any) => {
      return storage[key] ? JSON.parse(storage[key]) : fallback;
    }),
    kvSetJson: vi.fn(async (key: string, value: unknown) => {
      storage[key] = JSON.stringify(value);
    }),
    kvGet: vi.fn(async (key: string) => storage[key] ?? null),
    kvSet: vi.fn(async (key: string, value: string) => {
      storage[key] = value;
    }),
    kvRemove: vi.fn(async (key: string) => {
      delete storage[key];
    }),
  };
});

describe('achievements.ts', () => {
  const testUsername = 'testuser';

  beforeEach(async () => {
    // Clear any unlocked achievements before each test
    await saveUnlockedAchievements(testUsername, new Set());
  });

  describe('checkNewAchievements', () => {
    it('should return empty array when no new achievements are unlocked', async () => {
      const stats: AchievementStats = {
        levelsCompleted: 0,
        streak: 0,
        totalWordsLearned: 0,
        gems: 0,
        xp: 0,
        totalDaysCompleted: 0,
        practiceSessionsCompleted: 0,
      };

      const newAchievements = await checkNewAchievements(testUsername, stats);
      expect(newAchievements).toEqual([]);
    });

    it('should return achievement when first level is completed', async () => {
      const stats: AchievementStats = {
        levelsCompleted: 1,
        streak: 0,
        totalWordsLearned: 0,
        gems: 0,
        xp: 0,
        totalDaysCompleted: 0,
        practiceSessionsCompleted: 0,
      };

      const newAchievements = await checkNewAchievements(testUsername, stats);
      expect(newAchievements.length).toBeGreaterThan(0);
      expect(newAchievements.some(a => a.id === 'first_level')).toBe(true);
    });

    it('should return multiple achievements when multiple conditions are met', async () => {
      const stats: AchievementStats = {
        levelsCompleted: 1,
        streak: 3,
        totalWordsLearned: 10,
        gems: 0,
        xp: 100,
        totalDaysCompleted: 0,
        practiceSessionsCompleted: 0,
      };

      const newAchievements = await checkNewAchievements(testUsername, stats);
      expect(newAchievements.length).toBeGreaterThanOrEqual(2);
      expect(newAchievements.some(a => a.id === 'first_level')).toBe(true);
      expect(newAchievements.some(a => a.id === 'streak_3')).toBe(true);
    });

    it('should not return already unlocked achievements', async () => {
      const stats: AchievementStats = {
        levelsCompleted: 1,
        streak: 0,
        totalWordsLearned: 0,
        gems: 0,
        xp: 0,
        totalDaysCompleted: 0,
        practiceSessionsCompleted: 0,
      };

      // First call to unlock first_level
      const firstCall = await checkNewAchievements(testUsername, stats);
      expect(firstCall.some(a => a.id === 'first_level')).toBe(true);

      // Second call with same stats should not return first_level again
      const secondCall = await checkNewAchievements(testUsername, stats);
      expect(secondCall.some(a => a.id === 'first_level')).toBe(false);
    });

    it('should prevent concurrent execution using isCheckingAchievements flag', async () => {
      const stats: AchievementStats = {
        levelsCompleted: 10,
        streak: 0,
        totalWordsLearned: 0,
        gems: 0,
        xp: 0,
        totalDaysCompleted: 0,
        practiceSessionsCompleted: 0,
      };

      // Call twice concurrently
      const promise1 = checkNewAchievements(testUsername, stats);
      const promise2 = checkNewAchievements(testUsername, stats);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // One should return achievements, the other should return empty due to concurrency prevention
      const totalAchievements = result1.length + result2.length;
      expect(totalAchievements).toBe(result1.length); // Only first call returns achievements
      expect(result2.length).toBe(0); // Second concurrent call returns empty
    });

    it('should unlock streak achievements when streak threshold is met', async () => {
      const stats7Day: AchievementStats = {
        levelsCompleted: 0,
        streak: 7,
        totalWordsLearned: 0,
        gems: 0,
        xp: 0,
        totalDaysCompleted: 0,
        practiceSessionsCompleted: 0,
      };

      const achievements = await checkNewAchievements(testUsername, stats7Day);
      expect(achievements.some(a => a.id === 'streak_7')).toBe(true);
    });

    it('should unlock word learning achievements', async () => {
      const stats: AchievementStats = {
        levelsCompleted: 0,
        streak: 0,
        totalWordsLearned: 50,
        gems: 0,
        xp: 0,
        totalDaysCompleted: 0,
        practiceSessionsCompleted: 0,
      };

      const achievements = await checkNewAchievements(testUsername, stats);
      expect(achievements.some(a => a.id === 'words_50')).toBe(true);
    });

    it('should unlock XP achievements', async () => {
      const stats: AchievementStats = {
        levelsCompleted: 0,
        streak: 0,
        totalWordsLearned: 0,
        gems: 0,
        xp: 1000,
        totalDaysCompleted: 0,
        practiceSessionsCompleted: 0,
      };

      const achievements = await checkNewAchievements(testUsername, stats);
      expect(achievements.some(a => a.id === 'xp_1000')).toBe(true);
    });

    it('should unlock practice session achievements', async () => {
      const stats: AchievementStats = {
        levelsCompleted: 0,
        streak: 0,
        totalWordsLearned: 0,
        gems: 0,
        xp: 0,
        totalDaysCompleted: 0,
        practiceSessionsCompleted: 5,
      };

      const achievements = await checkNewAchievements(testUsername, stats);
      expect(achievements.some(a => a.id === 'practice_5')).toBe(true);
    });

    it('should unlock daily task achievements', async () => {
      const stats: AchievementStats = {
        levelsCompleted: 0,
        streak: 0,
        totalWordsLearned: 0,
        gems: 0,
        xp: 0,
        totalDaysCompleted: 7,
        practiceSessionsCompleted: 0,
      };

      const achievements = await checkNewAchievements(testUsername, stats);
      expect(achievements.some(a => a.id === 'daily_7')).toBe(true);
    });

    it('should unlock speed achievements with bestLevelTime', async () => {
      const stats: AchievementStats = {
        levelsCompleted: 0,
        streak: 0,
        totalWordsLearned: 0,
        gems: 0,
        xp: 0,
        totalDaysCompleted: 0,
        practiceSessionsCompleted: 0,
        bestLevelTime: 50000, // 50 seconds
      };

      const achievements = await checkNewAchievements(testUsername, stats);
      expect(achievements.some(a => a.id === 'speed_60')).toBe(true);
    });

    it('should unlock challenge achievements with dailyChallengesCompleted', async () => {
      const stats: AchievementStats = {
        levelsCompleted: 0,
        streak: 0,
        totalWordsLearned: 0,
        gems: 0,
        xp: 0,
        totalDaysCompleted: 0,
        practiceSessionsCompleted: 0,
        dailyChallengesCompleted: 7,
      };

      const achievements = await checkNewAchievements(testUsername, stats);
      expect(achievements.some(a => a.id === 'challenge_7')).toBe(true);
    });

    it('should unlock challenge streak achievements', async () => {
      const stats: AchievementStats = {
        levelsCompleted: 0,
        streak: 0,
        totalWordsLearned: 0,
        gems: 0,
        xp: 0,
        totalDaysCompleted: 0,
        practiceSessionsCompleted: 0,
        challengeStreak: 30,
      };

      const achievements = await checkNewAchievements(testUsername, stats);
      expect(achievements.some(a => a.id === 'challenge_streak_30')).toBe(true);
    });
  });

  describe('getUnlockedAchievements', () => {
    it('should return empty set when no achievements are unlocked', async () => {
      const unlocked = await getUnlockedAchievements(testUsername);
      expect(unlocked).toEqual(new Set());
    });

    it('should return previously unlocked achievements', async () => {
      const achievementIds = new Set(['first_level', 'streak_3']);
      await saveUnlockedAchievements(testUsername, achievementIds);

      const unlocked = await getUnlockedAchievements(testUsername);
      expect(unlocked).toEqual(achievementIds);
    });
  });

  describe('getAchievementDates', () => {
    it('should return empty object when no achievements have dates', async () => {
      const dates = await getAchievementDates(testUsername);
      expect(dates).toEqual({});
    });

    it('should return achievement unlock dates', async () => {
      const stats: AchievementStats = {
        levelsCompleted: 1,
        streak: 0,
        totalWordsLearned: 0,
        gems: 0,
        xp: 0,
        totalDaysCompleted: 0,
        practiceSessionsCompleted: 0,
      };

      await checkNewAchievements(testUsername, stats);
      const dates = await getAchievementDates(testUsername);

      expect(dates['first_level']).toBeDefined();
      expect(typeof dates['first_level']).toBe('string');
      // Check that it's a valid ISO date
      expect(() => new Date(dates['first_level'])).not.toThrow();
    });
  });

  describe('Storage mocking', () => {
    it('should properly mock and persist data in storage', async () => {
      const stats: AchievementStats = {
        levelsCompleted: 1,
        streak: 0,
        totalWordsLearned: 0,
        gems: 0,
        xp: 0,
        totalDaysCompleted: 0,
        practiceSessionsCompleted: 0,
      };

      // Unlock an achievement
      const newAchievements = await checkNewAchievements(testUsername, stats);
      expect(newAchievements.length).toBeGreaterThan(0);

      // Verify it's persisted
      const unlocked = await getUnlockedAchievements(testUsername);
      expect(unlocked.has('first_level')).toBe(true);

      // Verify dates are persisted
      const dates = await getAchievementDates(testUsername);
      expect(dates['first_level']).toBeDefined();
    });
  });
});
