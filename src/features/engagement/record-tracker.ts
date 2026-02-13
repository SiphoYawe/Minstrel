/**
 * Record Tracker — Layer 3 Domain Logic (Story 7.6)
 *
 * Pure functions for detecting and updating personal records.
 * No framework imports, no side effects.
 */

import {
  PersonalRecordType,
  type PersonalRecord,
  type PersonalRecordWithHistory,
  type RecordDetectionInput,
  type RecordHistoryEntry,
} from './engagement-types';
import { RECORD_TYPES } from '@/lib/constants';

/**
 * Detect new personal records from session data.
 * Returns only records that strictly exceed current bests.
 * Ties do NOT count as new records.
 */
export function detectNewRecords(
  currentRecords: PersonalRecordWithHistory[],
  input: RecordDetectionInput
): PersonalRecord[] {
  const recordMap = new Map(currentRecords.map((r) => [r.recordType, r]));
  const newRecords: PersonalRecord[] = [];

  const checks: Array<{
    type: PersonalRecordType;
    value: number | null;
  }> = [
    { type: PersonalRecordType.CleanTempo, value: input.maxCleanTempo },
    {
      type: PersonalRecordType.TimingAccuracy,
      value: input.bestTimingAccuracy !== null ? Math.round(input.bestTimingAccuracy * 100) : null,
    },
    { type: PersonalRecordType.HarmonicComplexity, value: input.maxChordComplexity },
    { type: PersonalRecordType.PracticeStreak, value: input.currentStreak },
  ];

  for (const { type, value } of checks) {
    if (value === null || value <= 0) continue;

    const existing = recordMap.get(type);
    const currentBest = existing?.currentValue ?? null;

    if (currentBest === null || value > currentBest) {
      newRecords.push({
        recordType: type,
        currentValue: value,
        previousValue: currentBest,
        achievedAt: input.date,
        sessionId: input.sessionId,
      });
    }
  }

  return newRecords;
}

/**
 * Update a record's history with a new record entry.
 * Appends the old record to history and updates current value.
 */
export function updateRecordHistory(
  existing: PersonalRecordWithHistory,
  newRecord: PersonalRecord
): PersonalRecordWithHistory {
  const historyEntry: RecordHistoryEntry | null =
    existing.currentValue > 0
      ? {
          value: existing.currentValue,
          date: existing.history.length > 0 ? existing.history[0].date : newRecord.achievedAt,
          sessionId: existing.history.length > 0 ? existing.history[0].sessionId : null,
        }
      : null;

  const updatedHistory = historyEntry ? [historyEntry, ...existing.history] : existing.history;

  return {
    ...existing,
    currentValue: newRecord.currentValue,
    history: updatedHistory,
  };
}

/**
 * Apply new records to the existing record set.
 * Returns the full updated record set.
 */
export function applyNewRecords(
  currentRecords: PersonalRecordWithHistory[],
  newRecords: PersonalRecord[]
): PersonalRecordWithHistory[] {
  const recordMap = new Map(currentRecords.map((r) => [r.recordType, r]));

  for (const newRecord of newRecords) {
    const existing = recordMap.get(newRecord.recordType);

    if (existing) {
      recordMap.set(newRecord.recordType, updateRecordHistory(existing, newRecord));
    } else {
      // First record for this type
      const typeInfo = RECORD_TYPES[newRecord.recordType];
      recordMap.set(newRecord.recordType, {
        recordType: newRecord.recordType,
        currentValue: newRecord.currentValue,
        history: [],
        label: typeInfo.label,
        unit: typeInfo.unit,
      });
    }
  }

  return Array.from(recordMap.values());
}

/**
 * Create an empty record set with all record types initialized.
 */
export function createEmptyRecordSet(): PersonalRecordWithHistory[] {
  return Object.entries(RECORD_TYPES).map(([key, info]) => ({
    recordType: key as PersonalRecordType,
    currentValue: 0,
    history: [],
    label: info.label,
    unit: info.unit,
  }));
}

/**
 * Format a record for display (e.g., "New record: 142 BPM clean tempo (previous: 128 BPM)").
 */
export function formatNewRecord(record: PersonalRecord): string {
  const typeInfo = RECORD_TYPES[record.recordType];
  const base = `New record: ${record.currentValue} ${typeInfo.unit} ${typeInfo.label.toLowerCase()}`;

  if (record.previousValue !== null) {
    return `${base} (previous: ${record.previousValue} ${typeInfo.unit})`;
  }

  return `First record: ${record.currentValue} ${typeInfo.unit} ${typeInfo.label.toLowerCase()}`;
}
