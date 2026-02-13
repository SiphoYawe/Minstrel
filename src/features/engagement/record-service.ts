/**
 * Record Service — Layer 4 Infrastructure (Story 7.6)
 *
 * Supabase persistence for personal records using JSONB metadata.
 */

import { createClient } from '@/lib/supabase/client';
import {
  PersonalRecordType,
  type PersonalRecordWithHistory,
  type RecordHistoryEntry,
} from './engagement-types';
import { RECORD_TYPES } from '@/lib/constants';

const RECORD_PREFIX = 'record_';

function metricTypeFromRecordType(recordType: PersonalRecordType): string {
  return `${RECORD_PREFIX}${recordType}`;
}

function recordTypeFromMetricType(metricType: string): PersonalRecordType | null {
  const stripped = metricType.replace(RECORD_PREFIX, '');
  if (Object.values(PersonalRecordType).includes(stripped as PersonalRecordType)) {
    return stripped as PersonalRecordType;
  }
  return null;
}

/**
 * Fetch all personal records for a user.
 */
export async function fetchPersonalRecords(userId: string): Promise<PersonalRecordWithHistory[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('progress_metrics')
    .select('metric_type, current_value, best_value, metadata')
    .eq('user_id', userId)
    .like('metric_type', `${RECORD_PREFIX}%`);

  if (error || !data) return [];

  const results: PersonalRecordWithHistory[] = [];

  for (const row of data) {
    const recordType = recordTypeFromMetricType(row.metric_type);
    if (!recordType) continue;

    const typeInfo = RECORD_TYPES[recordType];
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    const history = (metadata.history ?? []) as RecordHistoryEntry[];

    results.push({
      recordType,
      currentValue: row.current_value ?? 0,
      history,
      label: typeInfo.label as string,
      unit: typeInfo.unit as string,
    });
  }

  return results;
}

/**
 * Save updated personal records to Supabase.
 * Uses upsert to create or update records.
 */
export async function saveNewRecords(
  userId: string,
  updatedRecords: PersonalRecordWithHistory[]
): Promise<void> {
  if (updatedRecords.length === 0) return;

  const supabase = createClient();

  const rows = updatedRecords.map((r) => ({
    user_id: userId,
    metric_type: metricTypeFromRecordType(r.recordType),
    current_value: r.currentValue,
    best_value: r.currentValue,
    metadata: { history: r.history },
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('progress_metrics')
    .upsert(rows, { onConflict: 'user_id,metric_type' });

  if (error) {
    throw new Error(`Failed to save personal records: ${error.message}`);
  }
}
