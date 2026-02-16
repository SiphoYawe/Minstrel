import { describe, it, expect } from 'vitest';
import {
  PROHIBITED_WORDS,
  GROWTH_REFRAMES,
  TRAJECTORY_TEMPLATES,
  validateGrowthMindset,
  replaceProhibitedWords,
  createGrowthMindsetTransform,
} from './growth-mindset-rules';

describe('constants', () => {
  it('PROHIBITED_WORDS has 13 entries', () => {
    expect(PROHIBITED_WORDS).toHaveLength(13);
  });

  it('every prohibited word has a growth reframe', () => {
    for (const word of PROHIBITED_WORDS) {
      expect(GROWTH_REFRAMES[word]).toBeDefined();
      expect(typeof GROWTH_REFRAMES[word]).toBe('string');
    }
  });

  it('TRAJECTORY_TEMPLATES has at least 3 templates', () => {
    expect(TRAJECTORY_TEMPLATES.length).toBeGreaterThanOrEqual(3);
  });
});

describe('validateGrowthMindset', () => {
  it('returns compliant for clean text', () => {
    const result = validateGrowthMindset(
      'Your timing is developing — 65% to 73% over three attempts. Closing in.'
    );
    expect(result.isCompliant).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('detects "wrong"', () => {
    const result = validateGrowthMindset('That chord voicing is wrong for this key.');
    expect(result.isCompliant).toBe(false);
    expect(result.violations.length).toBe(1);
    expect(result.violations[0]).toContain('wrong');
    expect(result.violations[0]).toContain('not yet there');
  });

  it('detects "mistake"', () => {
    const result = validateGrowthMindset('You made a mistake on beat 3.');
    expect(result.isCompliant).toBe(false);
    expect(result.violations[0]).toContain('mistake');
  });

  it('detects "failed"', () => {
    const result = validateGrowthMindset('You failed to hit the target tempo.');
    expect(result.isCompliant).toBe(false);
    expect(result.violations[0]).toContain('failed');
  });

  it('detects multiple violations', () => {
    const result = validateGrowthMindset(
      'That was a bad mistake and you got the wrong notes. Poor timing too.'
    );
    expect(result.isCompliant).toBe(false);
    expect(result.violations.length).toBe(4);
  });

  it('is case-insensitive', () => {
    const result = validateGrowthMindset('WRONG and Bad and TERRIBLE.');
    expect(result.isCompliant).toBe(false);
    expect(result.violations.length).toBe(3);
  });

  it('matches whole words only', () => {
    // "error" should not match "errorStatus" or "errors" as a substring
    // But it will match "errors" because \berror\b actually doesn't match "errors"
    // Let's test with a compound word
    const result = validateGrowthMindset('The errorMessage field needs updating.');
    expect(result.isCompliant).toBe(true);
  });

  it('detects all prohibited words', () => {
    for (const word of PROHIBITED_WORDS) {
      const result = validateGrowthMindset(`This is ${word} playing.`);
      expect(result.isCompliant).toBe(false);
    }
  });
});

describe('replaceProhibitedWords', () => {
  it('replaces all 13 prohibited words with growth reframes', () => {
    for (const word of PROHIBITED_WORDS) {
      const input = `That was ${word} playing.`;
      const result = replaceProhibitedWords(input);
      const expected = GROWTH_REFRAMES[word];
      expect(result).toContain(expected);
      expect(result).not.toContain(word);
    }
  });

  it('does not modify "wrongful" (word boundary)', () => {
    const input = 'That was a wrongful accusation.';
    const result = replaceProhibitedWords(input);
    expect(result).toBe('That was a wrongful accusation.');
  });

  it('does not modify "errors" (word boundary)', () => {
    const input = 'Check the errors in the log.';
    const result = replaceProhibitedWords(input);
    expect(result).toBe('Check the errors in the log.');
  });

  it('does not modify "errorMessage" (compound word)', () => {
    const input = 'The errorMessage field needs updating.';
    const result = replaceProhibitedWords(input);
    expect(result).toBe('The errorMessage field needs updating.');
  });

  it('does not modify "failures" (word boundary)', () => {
    const input = 'Multiple failures occurred.';
    const result = replaceProhibitedWords(input);
    expect(result).toBe('Multiple failures occurred.');
  });

  it('replaces multiple different prohibited words in one string', () => {
    const input = 'That was bad and wrong and terrible playing.';
    const result = replaceProhibitedWords(input);
    expect(result).toContain('developing');
    expect(result).toContain('not yet there');
    expect(result).toContain('early stage');
    expect(result).not.toMatch(/\bbad\b/i);
    expect(result).not.toMatch(/\bwrong\b/i);
    expect(result).not.toMatch(/\bterrible\b/i);
  });

  it('replaces multiple occurrences of the same word', () => {
    const input = 'That was wrong and also wrong.';
    const result = replaceProhibitedWords(input);
    expect(result).toBe('That was not yet there and also not yet there.');
  });

  it('preserves lowercase casing', () => {
    const result = replaceProhibitedWords('That was wrong.');
    expect(result).toBe('That was not yet there.');
  });

  it('preserves uppercase casing', () => {
    const result = replaceProhibitedWords('That was WRONG.');
    expect(result).toBe('That was NOT YET THERE.');
  });

  it('preserves title case (first letter uppercase)', () => {
    const result = replaceProhibitedWords('Wrong note detected.');
    expect(result).toBe('Not yet there note detected.');
  });

  it('preserves casing for "failed" -> "in progress"', () => {
    expect(replaceProhibitedWords('failed')).toBe('in progress');
    expect(replaceProhibitedWords('FAILED')).toBe('IN PROGRESS');
    expect(replaceProhibitedWords('Failed')).toBe('In progress');
  });

  it('returns the same text when no prohibited words are present', () => {
    const input = 'Great playing, keep it up! Your timing is improving.';
    expect(replaceProhibitedWords(input)).toBe(input);
  });

  it('handles empty string', () => {
    expect(replaceProhibitedWords('')).toBe('');
  });

  // AI-L6: New prohibited words
  it('replaces "can\'t" with "haven\'t yet"', () => {
    expect(replaceProhibitedWords("You can't do this yet.")).toBe("You haven't yet do this yet.");
  });

  it('replaces "never" with "not yet"', () => {
    expect(replaceProhibitedWords('You will never master this.')).toBe(
      'You will not yet master this.'
    );
  });

  it('replaces "impossible" with "challenging"', () => {
    expect(replaceProhibitedWords('That tempo is impossible.')).toBe('That tempo is challenging.');
  });

  it('does not match "never" inside "whenever"', () => {
    const result = replaceProhibitedWords('Whenever you play, practice scales.');
    expect(result).toBe('Whenever you play, practice scales.');
  });

  it('does not match "impossible" inside "impossibility"', () => {
    // \b won't match inside a longer word
    const result = replaceProhibitedWords('The impossibility of this task is overstated.');
    expect(result).toBe('The impossibility of this task is overstated.');
  });

  it('does not false-positive on music terms containing prohibited substrings', () => {
    // "bass" contains "bad" as a different word, but \b prevents matching
    // "counterpoint" doesn't contain any prohibited words
    const musicTerms = 'The bass line has great counterpoint with the cantabile melody.';
    expect(replaceProhibitedWords(musicTerms)).toBe(musicTerms);
  });

  it('performance: processes 1000 chars under 5ms', () => {
    const longText = 'Your timing is developing nicely. '.repeat(30); // ~1020 chars
    const start = performance.now();
    replaceProhibitedWords(longText);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5);
  });
});

describe('createGrowthMindsetTransform', () => {
  async function runTransform(chunks: string[]): Promise<string> {
    const transform = createGrowthMindsetTransform();
    const writer = transform.writable.getWriter();
    const reader = transform.readable.getReader();

    const outputParts: string[] = [];

    // Write all chunks
    const writePromise = (async () => {
      for (const chunk of chunks) {
        await writer.write(chunk);
      }
      await writer.close();
    })();

    // Read all output
    const readPromise = (async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        outputParts.push(value);
      }
    })();

    await Promise.all([writePromise, readPromise]);
    return outputParts.join('');
  }

  it('replaces prohibited words in a single chunk', async () => {
    const result = await runTransform(['That was wrong playing.']);
    expect(result).toBe('That was not yet there playing.');
  });

  it('handles word split across chunk boundaries', async () => {
    // "wrong" split as "wr" + "ong"
    const result = await runTransform(['That was wr', 'ong playing.']);
    expect(result).toBe('That was not yet there playing.');
  });

  it('handles multiple chunks with no prohibited words', async () => {
    const result = await runTransform(['Hello ', 'world ', 'test.']);
    expect(result).toBe('Hello world test.');
  });

  it('handles prohibited word at the very end', async () => {
    const result = await runTransform(['That was ', 'bad']);
    expect(result).toBe('That was developing');
  });

  it('handles empty chunks', async () => {
    const result = await runTransform(['', 'Hello', '', ' world', '']);
    expect(result).toBe('Hello world');
  });

  it('replaces multiple prohibited words across chunks', async () => {
    const result = await runTransform(['That was bad ', 'and also wrong ', 'with poor timing.']);
    expect(result).toContain('developing');
    expect(result).toContain('not yet there');
    expect(result).toContain('emerging');
    expect(result).not.toMatch(/\bbad\b/);
    expect(result).not.toMatch(/\bwrong\b/);
    expect(result).not.toMatch(/\bpoor\b/);
  });

  it('preserves text that does not contain prohibited words', async () => {
    const result = await runTransform([
      'Your rhythm accuracy went from 65% to 73%. ',
      'Keep pushing, the trajectory is clear.',
    ]);
    expect(result).toBe(
      'Your rhythm accuracy went from 65% to 73%. Keep pushing, the trajectory is clear.'
    );
  });
});
