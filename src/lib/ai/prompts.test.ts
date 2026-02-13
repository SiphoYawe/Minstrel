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

    it('includes mandatory language rules', () => {
      expect(STUDIO_ENGINEER_BASE).toContain('MANDATORY LANGUAGE RULES');
      expect(STUDIO_ENGINEER_BASE).toContain('NEVER use');
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
      expect(prompt).toContain('KEY: G minor');
    });

    it('includes chords', () => {
      const context = createMockSessionContext({ chords: ['Am', 'Dm', 'E7'] });
      const prompt = buildChatSystemPrompt(context);
      expect(prompt).toContain('CHORDS PLAYED: Am, Dm, E7');
    });

    it('includes timing accuracy as a percentage', () => {
      const context = createMockSessionContext({ timingAccuracy: 0.82 });
      const prompt = buildChatSystemPrompt(context);
      expect(prompt).toContain('TIMING ACCURACY: 82%');
    });

    it('includes tempo in BPM', () => {
      const context = createMockSessionContext({ tempo: 140 });
      const prompt = buildChatSystemPrompt(context);
      expect(prompt).toContain('TEMPO: 140 BPM');
    });

    it('includes genre context section', () => {
      const context = createMockSessionContext({ genre: 'Jazz' });
      const prompt = buildChatSystemPrompt(context);
      expect(prompt).toContain('GENRE CONTEXT: Jazz');
      expect(prompt).toContain('jazz terminology');
    });

    it('includes genre terminology hints for Jazz', () => {
      const context = createMockSessionContext({ genre: 'Jazz' });
      const prompt = buildChatSystemPrompt(context);
      expect(prompt).toContain('tritone substitution');
      expect(prompt).toContain('ii-V-I');
    });

    it('includes genre terminology hints for Blues', () => {
      const context = createMockSessionContext({ genre: 'Blues' });
      const prompt = buildChatSystemPrompt(context);
      expect(prompt).toContain('12-bar blues');
    });

    it('includes tendencies — avoided keys', () => {
      const context = createMockSessionContext({
        tendencies: { avoidedKeys: ['Bb major'], avoidedChordTypes: [], commonIntervals: [] },
      });
      const prompt = buildChatSystemPrompt(context);
      expect(prompt).toContain('AVOIDED KEYS: Bb major');
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
      expect(prompt).toContain('AVOIDED CHORD TYPES: diminished, augmented');
    });

    it('includes recent snapshots', () => {
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
      expect(prompt).toContain('RECENT SNAPSHOTS (1):');
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
      expect(prompt).toContain('RECENT SNAPSHOTS (latest 3 of 5):');
    });

    it('includes chat-specific instructions', () => {
      const prompt = buildChatSystemPrompt(createMockSessionContext());
      expect(prompt).toContain('CHAT INSTRUCTIONS:');
    });

    it('includes data grounding instruction', () => {
      const prompt = buildChatSystemPrompt(createMockSessionContext());
      expect(prompt).toContain('CRITICAL: Only reference data points');
    });

    it('handles null key gracefully', () => {
      const prompt = buildChatSystemPrompt(createMockSessionContext({ key: null }));
      expect(prompt).not.toContain('KEY:');
    });

    it('handles null tempo gracefully', () => {
      const prompt = buildChatSystemPrompt(createMockSessionContext({ tempo: null }));
      expect(prompt).not.toContain('TEMPO:');
    });

    it('handles null genre with fallback', () => {
      const prompt = buildChatSystemPrompt(createMockSessionContext({ genre: null }));
      expect(prompt).toContain('No genre detected yet');
    });

    it('handles a fully minimal context', () => {
      const context = createMinimalSessionContext();
      const prompt = buildChatSystemPrompt(context);
      expect(prompt).toContain(STUDIO_ENGINEER_BASE);
      expect(prompt).toContain('SESSION DATA');
      expect(prompt).toContain('TIMING ACCURACY: 0%');
    });

    it('includes sufficiency info when provided', () => {
      const context = createMockSessionContext();
      const sufficiency = {
        hasSufficientData: false,
        availableInsights: ['Note analysis'],
        missingInsights: ['Chord patterns'],
        recommendation: 'Play more',
      };
      const prompt = buildChatSystemPrompt(context, sufficiency);
      expect(prompt).toContain('DATA SUFFICIENCY: LIMITED');
    });
  });

  describe('buildDrillSystemPrompt', () => {
    it('includes the Studio Engineer base text', () => {
      const prompt = buildDrillSystemPrompt(createMockSessionContext());
      expect(prompt).toContain(STUDIO_ENGINEER_BASE);
    });

    it('includes drill-specific instructions', () => {
      const prompt = buildDrillSystemPrompt(createMockSessionContext());
      expect(prompt).toContain('DRILL GENERATION INSTRUCTIONS:');
    });

    it('includes session data', () => {
      const prompt = buildDrillSystemPrompt(
        createMockSessionContext({ key: 'A minor', tempo: 90 })
      );
      expect(prompt).toContain('KEY: A minor');
      expect(prompt).toContain('TEMPO: 90 BPM');
    });

    it('includes genre section', () => {
      const prompt = buildDrillSystemPrompt(createMockSessionContext({ genre: 'Blues' }));
      expect(prompt).toContain('GENRE CONTEXT: Blues');
    });

    it('mentions drill targeting and growth framing', () => {
      const prompt = buildDrillSystemPrompt(createMockSessionContext());
      expect(prompt).toContain('targeted drill');
      expect(prompt).toContain('growth opportunity');
    });
  });

  describe('buildAnalysisSystemPrompt', () => {
    it('includes the Studio Engineer base text', () => {
      const prompt = buildAnalysisSystemPrompt(createMockSessionContext());
      expect(prompt).toContain(STUDIO_ENGINEER_BASE);
    });

    it('includes analysis-specific instructions', () => {
      const prompt = buildAnalysisSystemPrompt(createMockSessionContext());
      expect(prompt).toContain('ANALYSIS INSTRUCTIONS:');
    });

    it('includes session data', () => {
      const prompt = buildAnalysisSystemPrompt(
        createMockSessionContext({ chords: ['Dm7', 'G7', 'Cmaj7'], timingAccuracy: 0.95 })
      );
      expect(prompt).toContain('CHORDS PLAYED: Dm7, G7, Cmaj7');
      expect(prompt).toContain('TIMING ACCURACY: 95%');
    });

    it('mentions skill dimensions and difficulty recommendation', () => {
      const prompt = buildAnalysisSystemPrompt(createMockSessionContext());
      expect(prompt).toContain('skill dimensions');
      expect(prompt).toContain('difficulty level');
    });

    it('mentions the growth zone concept', () => {
      const prompt = buildAnalysisSystemPrompt(createMockSessionContext());
      expect(prompt).toContain('growth zone');
    });

    it('handles a fully minimal context', () => {
      const prompt = buildAnalysisSystemPrompt(createMinimalSessionContext());
      expect(prompt).toContain(STUDIO_ENGINEER_BASE);
      expect(prompt).toContain('ANALYSIS INSTRUCTIONS:');
    });
  });
});
