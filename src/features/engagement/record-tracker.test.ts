import { describe, it, expect } from 'vitest';
import {
  detectNewRecords,
  updateRecordHistory,
  applyNewRecords,
  createEmptyRecordSet,
  formatNewRecord,
} from './record-tracker';
import {
  PersonalRecordType,
  type PersonalRecord,
  type PersonalRecordWithHistory,
  type RecordDetectionInput,
} from './engagement-types';

function makeInput(overrides: Partial<RecordDetectionInput> = {}): RecordDetectionInput {
  return {
    maxCleanTempo: null,
    bestTimingAccuracy: null,
    maxChordComplexity: null,
    currentStreak: 0,
    sessionId: 'session-1',
    date: '2026-02-13',
    ...overrides,
  };
}

function makeRecord(
  type: PersonalRecordType,
  value: number,
  history: Array<{ value: number; date: string; sessionId: string | null }> = []
): PersonalRecordWithHistory {
  const labels: Record<PersonalRecordType, { label: string; unit: string }> = {
    [PersonalRecordType.CleanTempo]: { label: 'Clean Tempo', unit: 'BPM' },
    [PersonalRecordType.TimingAccuracy]: { label: 'Timing Accuracy', unit: '%' },
    [PersonalRecordType.HarmonicComplexity]: { label: 'Harmonic Complexity', unit: 'chords' },
    [PersonalRecordType.PracticeStreak]: { label: 'Practice Streak', unit: 'days' },
  };
  return {
    recordType: type,
    currentValue: value,
    history,
    ...labels[type],
  };
}

describe('record-tracker', () => {
  describe('detectNewRecords', () => {
    it('detects new clean tempo record', () => {
      const records = [makeRecord(PersonalRecordType.CleanTempo, 120)];
      const result = detectNewRecords(records, makeInput({ maxCleanTempo: 140 }));
      expect(result).toHaveLength(1);
      expect(result[0].recordType).toBe(PersonalRecordType.CleanTempo);
      expect(result[0].currentValue).toBe(140);
      expect(result[0].previousValue).toBe(120);
    });

    it('detects new timing accuracy record (converts to percentage)', () => {
      const records = [makeRecord(PersonalRecordType.TimingAccuracy, 80)];
      const result = detectNewRecords(records, makeInput({ bestTimingAccuracy: 0.92 }));
      expect(result).toHaveLength(1);
      expect(result[0].recordType).toBe(PersonalRecordType.TimingAccuracy);
      expect(result[0].currentValue).toBe(92);
    });

    it('detects new harmonic complexity record', () => {
      const records = [makeRecord(PersonalRecordType.HarmonicComplexity, 5)];
      const result = detectNewRecords(records, makeInput({ maxChordComplexity: 8 }));
      expect(result).toHaveLength(1);
      expect(result[0].currentValue).toBe(8);
    });

    it('detects new practice streak record', () => {
      const records = [makeRecord(PersonalRecordType.PracticeStreak, 7)];
      const result = detectNewRecords(records, makeInput({ currentStreak: 10 }));
      expect(result).toHaveLength(1);
      expect(result[0].currentValue).toBe(10);
    });

    it('does NOT detect record on exact tie', () => {
      const records = [makeRecord(PersonalRecordType.CleanTempo, 140)];
      const result = detectNewRecords(records, makeInput({ maxCleanTempo: 140 }));
      expect(result).toHaveLength(0);
    });

    it('does NOT detect record when below current', () => {
      const records = [makeRecord(PersonalRecordType.CleanTempo, 140)];
      const result = detectNewRecords(records, makeInput({ maxCleanTempo: 130 }));
      expect(result).toHaveLength(0);
    });

    it('does NOT detect record for null input', () => {
      const records = [makeRecord(PersonalRecordType.CleanTempo, 140)];
      const result = detectNewRecords(records, makeInput({ maxCleanTempo: null }));
      expect(result).toHaveLength(0);
    });

    it('does NOT detect record for zero input', () => {
      const records = [makeRecord(PersonalRecordType.CleanTempo, 0)];
      const result = detectNewRecords(records, makeInput({ maxCleanTempo: 0 }));
      expect(result).toHaveLength(0);
    });

    it('detects first record when empty record set exists', () => {
      const records = createEmptyRecordSet(); // all values are 0
      const result = detectNewRecords(records, makeInput({ maxCleanTempo: 100 }));
      expect(result).toHaveLength(1);
      // Empty record set has currentValue 0, which maps to previousValue 0
      expect(result[0].previousValue).toBe(0);
    });

    it('detects first record with null previousValue for empty record set', () => {
      const result = detectNewRecords([], makeInput({ maxCleanTempo: 100 }));
      expect(result).toHaveLength(1);
      expect(result[0].previousValue).toBeNull();
    });

    it('detects multiple records in one session', () => {
      const records = createEmptyRecordSet();
      const result = detectNewRecords(
        records,
        makeInput({
          maxCleanTempo: 120,
          bestTimingAccuracy: 0.85,
          maxChordComplexity: 6,
          currentStreak: 5,
        })
      );
      expect(result).toHaveLength(4);
      const types = result.map((r) => r.recordType);
      expect(types).toContain(PersonalRecordType.CleanTempo);
      expect(types).toContain(PersonalRecordType.TimingAccuracy);
      expect(types).toContain(PersonalRecordType.HarmonicComplexity);
      expect(types).toContain(PersonalRecordType.PracticeStreak);
    });

    it('assigns correct sessionId and date', () => {
      const records = createEmptyRecordSet();
      const result = detectNewRecords(
        records,
        makeInput({ maxCleanTempo: 100, sessionId: 'my-session', date: '2026-03-01' })
      );
      expect(result[0].sessionId).toBe('my-session');
      expect(result[0].achievedAt).toBe('2026-03-01');
    });
  });

  describe('updateRecordHistory', () => {
    it('appends old record to history', () => {
      const existing = makeRecord(PersonalRecordType.CleanTempo, 120);
      const newRecord: PersonalRecord = {
        recordType: PersonalRecordType.CleanTempo,
        currentValue: 140,
        previousValue: 120,
        achievedAt: '2026-02-13',
        sessionId: 'session-2',
      };

      const updated = updateRecordHistory(existing, newRecord);
      expect(updated.currentValue).toBe(140);
      expect(updated.history).toHaveLength(1);
      expect(updated.history[0].value).toBe(120);
    });

    it('preserves existing history', () => {
      const existing = makeRecord(PersonalRecordType.CleanTempo, 120, [
        { value: 100, date: '2026-02-01', sessionId: 'session-0' },
      ]);
      const newRecord: PersonalRecord = {
        recordType: PersonalRecordType.CleanTempo,
        currentValue: 140,
        previousValue: 120,
        achievedAt: '2026-02-13',
        sessionId: 'session-2',
      };

      const updated = updateRecordHistory(existing, newRecord);
      expect(updated.history).toHaveLength(2);
      expect(updated.history[0].value).toBe(120); // newest first
      expect(updated.history[1].value).toBe(100); // oldest
    });

    it('does not add history entry for zero-value record', () => {
      const existing = makeRecord(PersonalRecordType.CleanTempo, 0);
      const newRecord: PersonalRecord = {
        recordType: PersonalRecordType.CleanTempo,
        currentValue: 100,
        previousValue: null,
        achievedAt: '2026-02-13',
        sessionId: 'session-1',
      };

      const updated = updateRecordHistory(existing, newRecord);
      expect(updated.history).toHaveLength(0);
      expect(updated.currentValue).toBe(100);
    });
  });

  describe('applyNewRecords', () => {
    it('updates existing records', () => {
      const records = [makeRecord(PersonalRecordType.CleanTempo, 120)];
      const newRecords: PersonalRecord[] = [
        {
          recordType: PersonalRecordType.CleanTempo,
          currentValue: 140,
          previousValue: 120,
          achievedAt: '2026-02-13',
          sessionId: 'session-2',
        },
      ];

      const result = applyNewRecords(records, newRecords);
      const tempo = result.find((r) => r.recordType === PersonalRecordType.CleanTempo);
      expect(tempo!.currentValue).toBe(140);
    });

    it('creates new record type if not existing', () => {
      const result = applyNewRecords(
        [],
        [
          {
            recordType: PersonalRecordType.CleanTempo,
            currentValue: 100,
            previousValue: null,
            achievedAt: '2026-02-13',
            sessionId: 'session-1',
          },
        ]
      );
      expect(result).toHaveLength(1);
      expect(result[0].currentValue).toBe(100);
      expect(result[0].label).toBe('Clean Tempo');
      expect(result[0].unit).toBe('BPM');
      expect(result[0].history).toHaveLength(0);
    });
  });

  describe('createEmptyRecordSet', () => {
    it('creates all four record types', () => {
      const set = createEmptyRecordSet();
      expect(set).toHaveLength(4);
      const types = set.map((r) => r.recordType);
      expect(types).toContain(PersonalRecordType.CleanTempo);
      expect(types).toContain(PersonalRecordType.TimingAccuracy);
      expect(types).toContain(PersonalRecordType.HarmonicComplexity);
      expect(types).toContain(PersonalRecordType.PracticeStreak);
    });

    it('initializes all values to zero', () => {
      const set = createEmptyRecordSet();
      set.forEach((r) => {
        expect(r.currentValue).toBe(0);
        expect(r.history).toEqual([]);
      });
    });
  });

  describe('formatNewRecord', () => {
    it('formats with previous value', () => {
      const record: PersonalRecord = {
        recordType: PersonalRecordType.CleanTempo,
        currentValue: 142,
        previousValue: 128,
        achievedAt: '2026-02-13',
        sessionId: 'session-1',
      };
      expect(formatNewRecord(record)).toBe('New record: 142 BPM clean tempo (previous: 128 BPM)');
    });

    it('formats first record without previous', () => {
      const record: PersonalRecord = {
        recordType: PersonalRecordType.TimingAccuracy,
        currentValue: 92,
        previousValue: null,
        achievedAt: '2026-02-13',
        sessionId: 'session-1',
      };
      expect(formatNewRecord(record)).toBe('First record: 92 % timing accuracy');
    });

    it('does not contain celebratory language', () => {
      const record: PersonalRecord = {
        recordType: PersonalRecordType.CleanTempo,
        currentValue: 200,
        previousValue: 100,
        achievedAt: '2026-02-13',
        sessionId: 'session-1',
      };
      const text = formatNewRecord(record);
      expect(text).not.toMatch(/congrat|amazing|great|awesome|well done/i);
    });
  });
});
