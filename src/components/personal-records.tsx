'use client';

import { useState } from 'react';
import { usePersonalRecords } from '@/features/engagement/use-personal-records';
import type {
  PersonalRecordWithHistory,
  PersonalRecord,
} from '@/features/engagement/engagement-types';
import { formatNewRecord } from '@/features/engagement/record-tracker';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00'));
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Generates a specific descriptive subtitle for a personal record. */
function getRecordDescription(record: PersonalRecordWithHistory): string | null {
  if (record.currentValue <= 0) return null;
  switch (record.recordType) {
    case 'CleanTempo':
      return `Fastest clean tempo — ${record.currentValue} BPM with accurate timing`;
    case 'TimingAccuracy':
      return `Best session accuracy — ${record.currentValue}% of notes on beat`;
    case 'HarmonicComplexity':
      return `Most diverse session — ${record.currentValue} unique chords played`;
    case 'PracticeStreak':
      return `Longest streak — ${record.currentValue} consecutive days practicing`;
    default:
      return null;
  }
}

function RecordCard({ record, isNew }: { record: PersonalRecordWithHistory; isNew: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const hasValue = record.currentValue > 0;
  const hasHistory = record.history.length > 0;
  const description = getRecordDescription(record);

  const ariaLabel = hasValue
    ? `${record.label} personal record: ${record.currentValue} ${record.unit}`
    : `${record.label}: no record set`;

  return (
    <div
      className={`bg-card border border-surface-light ${isNew ? 'border-l-2 border-l-accent-success' : ''}`}
      aria-label={ariaLabel}
      role="region"
    >
      <div className="px-3 py-3">
        {/* Header row */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {record.label}
          </span>
          {isNew && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-accent-success">
              NEW
            </span>
          )}
        </div>

        {/* Value */}
        {hasValue ? (
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-semibold text-white leading-none">
                {record.currentValue}
              </span>
              <span className="text-xs text-muted-foreground">{record.unit}</span>
            </div>
            {description && (
              <p className="mt-1 text-[10px] text-muted-foreground/70 leading-snug">
                {description}
              </p>
            )}
          </div>
        ) : (
          <span className="font-mono text-2xl text-muted-foreground leading-none">&mdash;</span>
        )}

        {/* History toggle */}
        {hasHistory && (
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors duration-150 tracking-wider uppercase font-mono"
          >
            {expanded ? 'Hide history' : `History (${record.history.length})`}
          </button>
        )}
      </div>

      {/* Expanded history */}
      {expanded && hasHistory && (
        <div className="border-t border-surface-light px-3 py-2">
          {record.history.map((entry, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1.5 border-b border-surface-light last:border-b-0"
            >
              <span className="font-mono text-xs text-muted-foreground">
                {entry.value} <span className="text-muted-foreground">{record.unit}</span>
              </span>
              <span className="text-[10px] text-muted-foreground">{formatDate(entry.date)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PersonalRecords() {
  const { records, recentNewRecords, isLoading } = usePersonalRecords();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground/60">
          Loading records...
        </p>
      </div>
    );
  }

  const recentTypes = new Set(recentNewRecords.map((r) => r.recordType));

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {records.map((record) => (
          <RecordCard
            key={record.recordType}
            record={record}
            isNew={recentTypes.has(record.recordType)}
          />
        ))}
      </div>
    </div>
  );
}

/** Highlight card for new records in session summary. */
export function NewRecordHighlight({ records }: { records: PersonalRecord[] }) {
  if (records.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {records.map((record) => (
        <div
          key={record.recordType}
          className="bg-card border border-surface-light border-l-2 border-l-accent-success px-3 py-2"
        >
          <p className="text-sm text-muted-foreground">{formatNewRecord(record)}</p>
        </div>
      ))}
    </div>
  );
}
