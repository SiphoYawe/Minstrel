// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { SessionContext } from './schemas';
import {
  buildChatSystemPrompt,
  buildDrillSystemPrompt,
  buildAnalysisSystemPrompt,
  STUDIO_ENGINEER_BASE,
} from './prompts';

function createMockSessionContext(overrides: Partial<SessionContext> = {}): SessionContext {
  return {
    key: 'C major',
    chords: ['Cmaj', 'Fmaj', 'G7'],
    timingAccuracy: 0.82,
    tempo: 120,
    recentSnapshots: [
      {
        keyInsight: 'Beat 3 timing drifts 40ms late on F chord',
        insightCategory: 'TIMING',
        timestamp: 1700000000,
      },
      {
        keyInsight: 'Strong voice leading between Cmaj and Fmaj',
        insightCategory: 'HARMONIC',
        timestamp: 1700000100,
      },
    ],
    tendencies: {
      avoidedKeys: ['F# major', 'Eb minor'],
      avoidedChordTypes: ['diminished', 'augmented'],
      commonIntervals: [3, 5, 7],
    },
    genre: 'Blues',
    ...overrides,
  };
}

function createMinimalSessionContext(): SessionContext {
  return {
    key: null,
    chords: [],
    timingAccuracy: 0,
    tempo: null,
    recentSnapshots: [],
    tendencies: null,
    genre: null,
  };
}

describe('prompts', () => {
  describe('STUDIO_ENGINEER_BASE', () => {
    it('is a non-empty string', () => {
      expect(typeof STUDIO_ENGINEER_BASE).toBe('string');
      expect(STUDIO_ENGINEER_BASE.length).toBeGreaterThan(0);
    });

    it('includes growth mindset language "not yet"', () => {
      expect(STUDIO_ENGINEER_BASE).toContain('not yet');
    });

    it('includes the Studio Engineer persona', () => {
      expect(STUDIO_ENGINEER_BASE).toContain('Studio Engineer');
    });
  });

  describe('buildChatSystemPrompt', () => {
    it('includes the Studio Engineer base text', () => {
      const context = createMockSessionContext();
      const prompt = buildChatSystemPrompt(context);

      expect(prompt).toContain(STUDIO_ENGINEER_BASE);
    });

    it('includes the session key', () => {
      const context = createMockSessionContext({ key: 'G minor' });
      const prompt = buildChatSystemPrompt(context);

      expect(prompt).toContain('Key: G minor');
    });

    it('includes chords', () => {
      const context = createMockSessionContext({ chords: ['Am', 'Dm', 'E7'] });
      const prompt = buildChatSystemPrompt(context);

      expect(prompt).toContain('Chords: Am, Dm, E7');
    });

    it('includes timing accuracy as a percentage', () => {
      const context = createMockSessionContext({ timingAccuracy: 0.82 });
      const prompt = buildChatSystemPrompt(context);

      expect(prompt).toContain('Timing accuracy: 82%');
    });

    it('includes tempo in BPM', () => {
      const context = createMockSessionContext({ tempo: 140 });
      const prompt = buildChatSystemPrompt(context);

      expect(prompt).toContain('Tempo: 140 BPM');
    });

    it('includes genre context when provided', () => {
      const context = createMockSessionContext({ genre: 'Jazz' });
      const prompt = buildChatSystemPrompt(context);

      expect(prompt).toContain('Genre: Jazz');
    });

    it('includes tendencies — avoided keys', () => {
      const context = createMockSessionContext({
        tendencies: {
          avoidedKeys: ['Bb major'],
          avoidedChordTypes: [],
          commonIntervals: [],
        },
      });
      const prompt = buildChatSystemPrompt(context);

      expect(prompt).toContain('Avoided keys: Bb major');
    });

    it('includes tendencies — avoided chord types', () => {
      const context = createMockSessionContext({
        tendencies: {
          avoidedKeys: [],
          avoidedChordTypes: ['diminished', 'augmented'],
          commonIntervals: [],
        },
      });
      const prompt = buildChatSystemPrompt(context);

      expect(prompt).toContain('Avoided chord types: diminished, augmented');
    });

    it('includes recent snapshots with category and insight', () => {
      const context = createMockSessionContext({
        recentSnapshots: [
          {
            keyInsight: 'Consistent downbeat timing',
            insightCategory: 'TIMING',
            timestamp: 1700000000,
          },
        ],
      });
      const prompt = buildChatSystemPrompt(context);

      expect(prompt).toContain('[TIMING] Consistent downbeat timing');
      expect(prompt).toContain('Recent insights (1):');
    });

    it('shows truncation indicator when more than 3 snapshots exist', () => {
      const context = createMockSessionContext({
        recentSnapshots: Array.from({ length: 5 }, (_, i) => ({
          keyInsight: `Insight ${i}`,
          insightCategory: 'GENERAL' as const,
          timestamp: 1700000000 + i,
        })),
      });
      const prompt = buildChatSystemPrompt(context);

      expect(prompt).toContain('Recent insights (latest 3 of 5):');
      expect(prompt).toContain('Insight 2');
      expect(prompt).toContain('Insight 4');
      expect(prompt).not.toContain('Insight 0');
    });

    it('includes chat-specific instructions', () => {
      const context = createMockSessionContext();
      const prompt = buildChatSystemPrompt(context);

      expect(prompt).toContain('CHAT INSTRUCTIONS:');
    });

    it('handles null key gracefully', () => {
      const context = createMockSessionContext({ key: null });
      const prompt = buildChatSystemPrompt(context);

      expect(prompt).not.toContain('Key:');
    });

    it('handles null tempo gracefully', () => {
      const context = createMockSessionContext({ tempo: null });
      const prompt = buildChatSystemPrompt(context);

      expect(prompt).not.toContain('Tempo:');
    });

    it('handles null genre gracefully', () => {
      const context = createMockSessionContext({ genre: null });
      const prompt = buildChatSystemPrompt(context);

      expect(prompt).not.toContain('Genre:');
    });

    it('handles null tendencies gracefully', () => {
      const context = createMockSessionContext({ tendencies: null });
      const prompt = buildChatSystemPrompt(context);

      expect(prompt).not.toContain('Avoided keys:');
      expect(prompt).not.toContain('Avoided chord types:');
    });

    it('handles empty chords array gracefully', () => {
      const context = createMockSessionContext({ chords: [] });
      const prompt = buildChatSystemPrompt(context);

      expect(prompt).not.toContain('Chords:');
    });

    it('handles empty recentSnapshots array gracefully', () => {
      const context = createMockSessionContext({ recentSnapshots: [] });
      const prompt = buildChatSystemPrompt(context);

      expect(prompt).not.toContain('Recent insights');
    });

    it('handles a fully minimal context', () => {
      const context = createMinimalSessionContext();
      const prompt = buildChatSystemPrompt(context);

      expect(prompt).toContain(STUDIO_ENGINEER_BASE);
      expect(prompt).toContain('SESSION DATA:');
      expect(prompt).toContain('Timing accuracy: 0%');
      expect(prompt).toContain('CHAT INSTRUCTIONS:');
    });

    it('includes growth mindset language', () => {
      const context = createMockSessionContext();
      const prompt = buildChatSystemPrompt(context);

      expect(prompt).toContain('not yet');
    });
  });

  describe('buildDrillSystemPrompt', () => {
    it('includes the Studio Engineer base text', () => {
      const context = createMockSessionContext();
      const prompt = buildDrillSystemPrompt(context);

      expect(prompt).toContain(STUDIO_ENGINEER_BASE);
    });

    it('includes drill-specific instructions', () => {
      const context = createMockSessionContext();
      const prompt = buildDrillSystemPrompt(context);

      expect(prompt).toContain('DRILL GENERATION INSTRUCTIONS:');
    });

    it('includes session data', () => {
      const context = createMockSessionContext({ key: 'A minor', tempo: 90 });
      const prompt = buildDrillSystemPrompt(context);

      expect(prompt).toContain('Key: A minor');
      expect(prompt).toContain('Tempo: 90 BPM');
    });

    it('mentions drill targeting and growth framing', () => {
      const context = createMockSessionContext();
      const prompt = buildDrillSystemPrompt(context);

      expect(prompt).toContain('targeted drill');
      expect(prompt).toContain('growth opportunity');
    });

    it('includes growth mindset language', () => {
      const context = createMockSessionContext();
      const prompt = buildDrillSystemPrompt(context);

      expect(prompt).toContain('not yet');
    });

    it('handles a fully minimal context', () => {
      const context = createMinimalSessionContext();
      const prompt = buildDrillSystemPrompt(context);

      expect(prompt).toContain(STUDIO_ENGINEER_BASE);
      expect(prompt).toContain('DRILL GENERATION INSTRUCTIONS:');
    });
  });

  describe('buildAnalysisSystemPrompt', () => {
    it('includes the Studio Engineer base text', () => {
      const context = createMockSessionContext();
      const prompt = buildAnalysisSystemPrompt(context);

      expect(prompt).toContain(STUDIO_ENGINEER_BASE);
    });

    it('includes analysis-specific instructions', () => {
      const context = createMockSessionContext();
      const prompt = buildAnalysisSystemPrompt(context);

      expect(prompt).toContain('ANALYSIS INSTRUCTIONS:');
    });

    it('includes session data', () => {
      const context = createMockSessionContext({
        chords: ['Dm7', 'G7', 'Cmaj7'],
        timingAccuracy: 0.95,
      });
      const prompt = buildAnalysisSystemPrompt(context);

      expect(prompt).toContain('Chords: Dm7, G7, Cmaj7');
      expect(prompt).toContain('Timing accuracy: 95%');
    });

    it('mentions skill dimensions and difficulty recommendation', () => {
      const context = createMockSessionContext();
      const prompt = buildAnalysisSystemPrompt(context);

      expect(prompt).toContain('skill dimensions');
      expect(prompt).toContain('difficulty level');
    });

    it('mentions the growth zone concept', () => {
      const context = createMockSessionContext();
      const prompt = buildAnalysisSystemPrompt(context);

      expect(prompt).toContain('growth zone');
    });

    it('includes growth mindset language', () => {
      const context = createMockSessionContext();
      const prompt = buildAnalysisSystemPrompt(context);

      expect(prompt).toContain('not yet');
    });

    it('handles a fully minimal context', () => {
      const context = createMinimalSessionContext();
      const prompt = buildAnalysisSystemPrompt(context);

      expect(prompt).toContain(STUDIO_ENGINEER_BASE);
      expect(prompt).toContain('ANALYSIS INSTRUCTIONS:');
    });
  });
});
