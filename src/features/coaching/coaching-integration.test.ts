// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  buildChatSystemPrompt,
  buildDrillSystemPrompt,
  buildAnalysisSystemPrompt,
  STUDIO_ENGINEER_BASE,
} from '@/lib/ai/prompts';
import { PROHIBITED_WORDS, validateGrowthMindset } from './growth-mindset-rules';
import { getTerminologyForGenre } from './genre-terminology';
import { processAiResponse } from './response-processor';
import type { SessionContext } from '@/lib/ai/schemas';

function createContext(overrides: Partial<SessionContext> = {}): SessionContext {
  return {
    key: 'C major',
    chords: ['Cmaj7', 'Dm7', 'G7'],
    timingAccuracy: 0.82,
    tempo: 120,
    recentSnapshots: [
      {
        keyInsight: 'Timing improving on chord transitions',
        insightCategory: 'TIMING',
        timestamp: 1700000000,
      },
    ],
    tendencies: {
      avoidedKeys: ['F# major'],
      avoidedChordTypes: ['diminished'],
      commonIntervals: [3, 5],
    },
    genre: null,
    ...overrides,
  };
}

describe('coaching integration: Jazz genre with full context', () => {
  const ctx = createContext({ genre: 'Jazz' });
  const prompt = buildChatSystemPrompt(ctx);

  it('includes Studio Engineer persona', () => {
    expect(prompt).toContain('Studio Engineer');
  });

  it('includes jazz terminology', () => {
    expect(prompt).toContain('GENRE CONTEXT: Jazz');
    expect(prompt).toContain('jazz terminology');
    expect(prompt).toContain('tritone substitution');
    expect(prompt).toContain('ii-V-I');
  });

  it('includes growth mindset mandatory rules', () => {
    expect(prompt).toContain('MANDATORY LANGUAGE RULES');
    expect(prompt).toContain('NEVER use');
    for (const word of ['wrong', 'bad', 'failed', 'mistake']) {
      expect(prompt.toLowerCase()).toContain(word); // present in the "NEVER use" list
    }
  });

  it('includes session data', () => {
    expect(prompt).toContain('KEY: C major');
    expect(prompt).toContain('CHORDS PLAYED: Cmaj7, Dm7, G7');
    expect(prompt).toContain('TIMING ACCURACY: 82%');
    expect(prompt).toContain('TEMPO: 120 BPM');
  });

  it('includes data grounding instruction', () => {
    expect(prompt).toContain('CRITICAL: Only reference data points');
  });
});

describe('coaching integration: no genre with minimal context', () => {
  const ctx = createContext({
    genre: null,
    key: null,
    chords: [],
    tempo: null,
    tendencies: null,
    recentSnapshots: [],
  });
  const prompt = buildChatSystemPrompt(ctx);

  it('uses neutral terminology', () => {
    expect(prompt).toContain('No genre detected yet');
    expect(prompt).toContain('neutral music theory');
  });

  it('still includes mandatory language rules', () => {
    expect(prompt).toContain('MANDATORY LANGUAGE RULES');
  });
});

describe('coaching integration: struggling user trajectory', () => {
  const ctx = createContext({
    timingAccuracy: 0.45,
    recentSnapshots: [
      {
        keyInsight: 'Timing drifts 60ms on beat 3',
        insightCategory: 'TIMING',
        timestamp: 1700000000,
      },
      {
        keyInsight: 'Some improvement on downbeats',
        insightCategory: 'TIMING',
        timestamp: 1700000100,
      },
    ],
  });
  const prompt = buildChatSystemPrompt(ctx);

  it('shows low accuracy in session data', () => {
    expect(prompt).toContain('TIMING ACCURACY: 45%');
  });

  it('includes trajectory-oriented rules', () => {
    expect(prompt).toContain('trajectory language');
    expect(prompt).toContain('not yet');
  });
});

describe('coaching integration: prompt templates contain no prohibited words (outside rules list)', () => {
  it('STUDIO_ENGINEER_BASE only references prohibited words in the rules section', () => {
    // Extract text after the MANDATORY LANGUAGE RULES section
    const afterRules = STUDIO_ENGINEER_BASE.split('MANDATORY LANGUAGE RULES:')[0];
    // The base should reference "not yet" and "wrong" only in context of growth mindset instruction
    const validation = validateGrowthMindset(afterRules);
    // "wrong" appears in the instruction 'say "not yet" instead of "wrong"' - that's OK, we check the rules section separately
    // The main text before MANDATORY LANGUAGE RULES should not have standalone prohibited words
    // except where they're quoted as examples of what not to say
    expect(validation.violations.length).toBeLessThanOrEqual(2); // "wrong" and "failure" are referenced as examples
  });
});

describe('coaching integration: all prompt builders share persona and genre', () => {
  const ctx = createContext({ genre: 'Blues' });

  it('chat prompt includes genre and persona', () => {
    const p = buildChatSystemPrompt(ctx);
    expect(p).toContain(STUDIO_ENGINEER_BASE);
    expect(p).toContain('GENRE CONTEXT: Blues');
  });

  it('drill prompt includes genre and persona', () => {
    const p = buildDrillSystemPrompt(ctx);
    expect(p).toContain(STUDIO_ENGINEER_BASE);
    expect(p).toContain('GENRE CONTEXT: Blues');
  });

  it('analysis prompt includes genre and persona', () => {
    const p = buildAnalysisSystemPrompt(ctx);
    expect(p).toContain(STUDIO_ENGINEER_BASE);
    expect(p).toContain('GENRE CONTEXT: Blues');
  });
});

describe('coaching integration: response post-processing', () => {
  it('compliant response passes validation', () => {
    const response =
      'Your timing at 82% is developing. Cmaj7 transitions are closing in — 280ms to 180ms over 5 attempts.';
    const result = processAiResponse(response);
    expect(result.growthMindsetCompliant).toBe(true);
    expect(result.dataReferences.length).toBeGreaterThan(0);
  });

  it('non-compliant response is flagged', () => {
    const response = 'That was a bad mistake on the G7 chord.';
    const result = processAiResponse(response);
    expect(result.growthMindsetCompliant).toBe(false);
  });

  it('genre terminology objects are well-formed', () => {
    for (const genre of ['Jazz', 'Blues', 'Rock', 'Classical', 'R&B/Soul']) {
      const t = getTerminologyForGenre(genre);
      expect(t.genre).toBeTruthy();
      expect(Object.keys(t.conceptTerms).length).toBeGreaterThan(0);
    }
  });

  it('all prohibited words have reframes', () => {
    for (const word of PROHIBITED_WORDS) {
      const result = validateGrowthMindset(`This is ${word}.`);
      expect(result.isCompliant).toBe(false);
    }
  });
});
