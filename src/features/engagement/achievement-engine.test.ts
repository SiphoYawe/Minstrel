import { describe, it, expect } from 'vitest';
import { evaluateAchievements, buildTriggerContext } from './achievement-engine';
import { achievementRegistry, ACHIEVEMENT_COUNT } from './achievement-definitions';
import type { TriggerContext } from './engagement-types';

/** Helper to build a minimal TriggerContext with overrides. */
function ctx(overrides: Partial<TriggerContext> = {}): TriggerContext {
  return buildTriggerContext(overrides);
}

describe('achievement-engine', () => {
  describe('evaluateAchievements', () => {
    it('returns empty array when no conditions met', () => {
      const result = evaluateAchievements(ctx(), [], 'user-1', 'session-1');
      expect(result).toEqual([]);
    });

    it('skips already-unlocked achievements', () => {
      const result = evaluateAchievements(
        ctx({ currentStreak: 7 }),
        ['consistency-first-week'],
        'user-1',
        'session-1'
      );
      const ids = result.map((a) => a.achievementId);
      expect(ids).not.toContain('consistency-first-week');
    });

    it('assigns correct userId and sessionId', () => {
      const result = evaluateAchievements(ctx({ currentStreak: 7 }), [], 'user-42', 'session-99');
      const firstWeek = result.find((a) => a.achievementId === 'consistency-first-week');
      expect(firstWeek).toBeDefined();
      expect(firstWeek!.userId).toBe('user-42');
      expect(firstWeek!.sessionId).toBe('session-99');
    });

    it('sets unlockedAt to an ISO timestamp', () => {
      const result = evaluateAchievements(ctx({ currentStreak: 7 }), [], 'user-1', null);
      const firstWeek = result.find((a) => a.achievementId === 'consistency-first-week');
      expect(firstWeek).toBeDefined();
      expect(new Date(firstWeek!.unlockedAt).toISOString()).toBe(firstWeek!.unlockedAt);
    });

    it('handles null sessionId', () => {
      const result = evaluateAchievements(ctx({ lifetimeXp: 1000 }), [], 'user-1', null);
      const thousandClub = result.find((a) => a.achievementId === 'consistency-thousand-xp');
      expect(thousandClub).toBeDefined();
      expect(thousandClub!.sessionId).toBeNull();
    });

    it('silently skips achievements whose trigger throws', () => {
      // Temporarily add a broken achievement
      achievementRegistry.set('broken-test', {
        achievementId: 'broken-test',
        name: 'Broken',
        description: 'Throws on eval',
        category: 'Test' as never,
        icon: 'x',
        triggerCondition: () => {
          throw new Error('deliberate');
        },
      });

      const result = evaluateAchievements(ctx(), [], 'user-1', 'session-1');
      const broken = result.find((a) => a.achievementId === 'broken-test');
      expect(broken).toBeUndefined();

      // Clean up
      achievementRegistry.delete('broken-test');
    });

    it('is idempotent — same input produces same output', () => {
      const context = ctx({ currentStreak: 30, lifetimeXp: 1000 });
      const r1 = evaluateAchievements(context, [], 'user-1', 'session-1');
      const r2 = evaluateAchievements(context, [], 'user-1', 'session-1');
      expect(r1.map((a) => a.achievementId).sort()).toEqual(r2.map((a) => a.achievementId).sort());
    });

    // --- Genre Achievements ---

    it('unlocks genre-first-jazz on dominant 7th chord', () => {
      const result = evaluateAchievements(
        ctx({ chordsDetected: ['Cmaj7', 'G7'] }),
        [],
        'user-1',
        'session-1'
      );
      const ids = result.map((a) => a.achievementId);
      expect(ids).toContain('genre-first-jazz');
    });

    it('unlocks genre-blues-explorer on blues genre detection', () => {
      const result = evaluateAchievements(
        ctx({ detectedGenres: ['Blues'] }),
        [],
        'user-1',
        'session-1'
      );
      expect(result.map((a) => a.achievementId)).toContain('genre-blues-explorer');
    });

    it('unlocks genre-pop-prodigy on pop detection', () => {
      const result = evaluateAchievements(
        ctx({ detectedGenres: ['Pop'] }),
        [],
        'user-1',
        'session-1'
      );
      expect(result.map((a) => a.achievementId)).toContain('genre-pop-prodigy');
    });

    it('unlocks genre-classical-touch on classical detection', () => {
      const result = evaluateAchievements(
        ctx({ detectedGenres: ['Classical'] }),
        [],
        'user-1',
        'session-1'
      );
      expect(result.map((a) => a.achievementId)).toContain('genre-classical-touch');
    });

    it('unlocks genre-rock-solid on rock detection', () => {
      const result = evaluateAchievements(
        ctx({ detectedGenres: ['Rock'] }),
        [],
        'user-1',
        'session-1'
      );
      expect(result.map((a) => a.achievementId)).toContain('genre-rock-solid');
    });

    // --- Technique Achievements ---

    it('unlocks technique-perfect-10 at exactly 10 consecutive perfect reps', () => {
      const result = evaluateAchievements(
        ctx({ consecutivePerfectReps: 10 }),
        [],
        'user-1',
        'session-1'
      );
      expect(result.map((a) => a.achievementId)).toContain('technique-perfect-10');
    });

    it('does not unlock technique-perfect-10 at 9 reps', () => {
      const result = evaluateAchievements(
        ctx({ consecutivePerfectReps: 9 }),
        [],
        'user-1',
        'session-1'
      );
      expect(result.map((a) => a.achievementId)).not.toContain('technique-perfect-10');
    });

    it('unlocks technique-smooth-operator for fast chord transition', () => {
      const result = evaluateAchievements(
        ctx({ fastestChordTransitionMs: 150 }),
        [],
        'user-1',
        'session-1'
      );
      expect(result.map((a) => a.achievementId)).toContain('technique-smooth-operator');
    });

    it('does not unlock technique-smooth-operator at exactly 200ms', () => {
      const result = evaluateAchievements(
        ctx({ fastestChordTransitionMs: 200 }),
        [],
        'user-1',
        'session-1'
      );
      expect(result.map((a) => a.achievementId)).not.toContain('technique-smooth-operator');
    });

    it('unlocks technique-accuracy-90 at exactly 0.9', () => {
      const result = evaluateAchievements(ctx({ timingAccuracy: 0.9 }), [], 'user-1', 'session-1');
      expect(result.map((a) => a.achievementId)).toContain('technique-accuracy-90');
    });

    it('does not unlock technique-accuracy-90 at 0.89', () => {
      const result = evaluateAchievements(ctx({ timingAccuracy: 0.89 }), [], 'user-1', 'session-1');
      expect(result.map((a) => a.achievementId)).not.toContain('technique-accuracy-90');
    });

    it('unlocks technique-note-500 at 500 notes', () => {
      const result = evaluateAchievements(
        ctx({ totalNotesPlayed: 500 }),
        [],
        'user-1',
        'session-1'
      );
      expect(result.map((a) => a.achievementId)).toContain('technique-note-500');
    });

    it('unlocks technique-drill-master at 5 drills passed', () => {
      const result = evaluateAchievements(ctx({ drillsPassed: 5 }), [], 'user-1', 'session-1');
      expect(result.map((a) => a.achievementId)).toContain('technique-drill-master');
    });

    // --- Consistency Achievements ---

    it('unlocks consistency-first-week at streak 7', () => {
      const result = evaluateAchievements(ctx({ currentStreak: 7 }), [], 'user-1', 'session-1');
      expect(result.map((a) => a.achievementId)).toContain('consistency-first-week');
    });

    it('unlocks consistency-first-week via bestStreak', () => {
      const result = evaluateAchievements(ctx({ bestStreak: 7 }), [], 'user-1', 'session-1');
      expect(result.map((a) => a.achievementId)).toContain('consistency-first-week');
    });

    it('unlocks consistency-month-strong at streak 30', () => {
      const result = evaluateAchievements(ctx({ currentStreak: 30 }), [], 'user-1', 'session-1');
      const ids = result.map((a) => a.achievementId);
      expect(ids).toContain('consistency-month-strong');
      // Also unlocks first-week
      expect(ids).toContain('consistency-first-week');
    });

    it('unlocks consistency-century at streak 100', () => {
      const result = evaluateAchievements(ctx({ currentStreak: 100 }), [], 'user-1', 'session-1');
      expect(result.map((a) => a.achievementId)).toContain('consistency-century');
    });

    it('unlocks consistency-yearly-devotion at streak 365', () => {
      const result = evaluateAchievements(ctx({ currentStreak: 365 }), [], 'user-1', 'session-1');
      expect(result.map((a) => a.achievementId)).toContain('consistency-yearly-devotion');
    });

    it('unlocks consistency-thousand-xp at exactly 1000', () => {
      const result = evaluateAchievements(ctx({ lifetimeXp: 1000 }), [], 'user-1', 'session-1');
      expect(result.map((a) => a.achievementId)).toContain('consistency-thousand-xp');
    });

    it('unlocks consistency-10-sessions at 10 lifetime sessions', () => {
      const result = evaluateAchievements(ctx({ lifetimeSessions: 10 }), [], 'user-1', 'session-1');
      expect(result.map((a) => a.achievementId)).toContain('consistency-10-sessions');
    });

    // --- Personal Record Achievements ---

    it('unlocks record-speed-demon on fastest_tempo record', () => {
      const result = evaluateAchievements(
        ctx({ newRecordTypes: ['fastest_tempo'] }),
        [],
        'user-1',
        'session-1'
      );
      expect(result.map((a) => a.achievementId)).toContain('record-speed-demon');
    });

    it('unlocks record-accuracy-king on best_accuracy record', () => {
      const result = evaluateAchievements(
        ctx({ newRecordTypes: ['best_accuracy'] }),
        [],
        'user-1',
        'session-1'
      );
      expect(result.map((a) => a.achievementId)).toContain('record-accuracy-king');
    });

    it('unlocks record-complexity-up on harmonic_complexity record', () => {
      const result = evaluateAchievements(
        ctx({ newRecordTypes: ['harmonic_complexity'] }),
        [],
        'user-1',
        'session-1'
      );
      expect(result.map((a) => a.achievementId)).toContain('record-complexity-up');
    });

    it('does not unlock personal records when newRecordTypes is undefined', () => {
      const result = evaluateAchievements(ctx(), [], 'user-1', 'session-1');
      const ids = result.map((a) => a.achievementId);
      expect(ids).not.toContain('record-speed-demon');
      expect(ids).not.toContain('record-accuracy-king');
      expect(ids).not.toContain('record-complexity-up');
    });

    // --- Multiple Unlocks ---

    it('unlocks multiple achievements in a single evaluation', () => {
      const result = evaluateAchievements(
        ctx({
          currentStreak: 7,
          lifetimeXp: 1000,
          timingAccuracy: 0.95,
          detectedGenres: ['Blues'],
        }),
        [],
        'user-1',
        'session-1'
      );
      const ids = result.map((a) => a.achievementId);
      expect(ids).toContain('consistency-first-week');
      expect(ids).toContain('consistency-thousand-xp');
      expect(ids).toContain('technique-accuracy-90');
      expect(ids).toContain('genre-blues-explorer');
    });
  });

  describe('buildTriggerContext', () => {
    it('fills all defaults for empty partial', () => {
      const result = buildTriggerContext({});
      expect(result.currentStreak).toBe(0);
      expect(result.bestStreak).toBe(0);
      expect(result.lifetimeXp).toBe(0);
      expect(result.sessionDurationMs).toBe(0);
      expect(result.totalNotesPlayed).toBe(0);
      expect(result.timingAccuracy).toBe(0);
      expect(result.drillsCompleted).toBe(0);
      expect(result.drillsPassed).toBe(0);
      expect(result.consecutivePerfectReps).toBe(0);
      expect(result.detectedGenres).toEqual([]);
      expect(result.chordsDetected).toEqual([]);
      expect(result.lifetimeSessions).toBe(0);
      expect(result.lifetimeNotesPlayed).toBe(0);
    });

    it('overrides specific fields', () => {
      const result = buildTriggerContext({ currentStreak: 42, lifetimeXp: 9999 });
      expect(result.currentStreak).toBe(42);
      expect(result.lifetimeXp).toBe(9999);
      // Others still default
      expect(result.bestStreak).toBe(0);
    });

    it('preserves optional fields when provided', () => {
      const result = buildTriggerContext({
        newRecordTypes: ['fastest_tempo'],
        fastestChordTransitionMs: 120,
      });
      expect(result.newRecordTypes).toEqual(['fastest_tempo']);
      expect(result.fastestChordTransitionMs).toBe(120);
    });
  });

  describe('achievementRegistry', () => {
    it('contains expected number of achievements', () => {
      expect(achievementRegistry.size).toBe(ACHIEVEMENT_COUNT);
      expect(achievementRegistry.size).toBe(19);
    });

    it('every definition has a valid trigger function', () => {
      for (const [id, def] of achievementRegistry) {
        expect(typeof def.triggerCondition).toBe('function');
        expect(def.achievementId).toBe(id);
        expect(def.name.length).toBeGreaterThan(0);
        expect(def.description.length).toBeGreaterThan(0);
      }
    });
  });
});
