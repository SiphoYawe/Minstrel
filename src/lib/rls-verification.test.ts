/**
 * SEC-L3: Automated RLS verification test.
 * Parses migration files to ensure every user-data table has RLS enabled
 * and appropriate policies defined.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');

// All tables that contain user data and MUST have RLS + per-user policies
const USER_DATA_TABLES = [
  'users',
  'user_api_keys',
  'sessions',
  'midi_events',
  'analysis_snapshots',
  'drill_records',
  'progress_metrics',
  'personal_records',
  'ai_conversations',
  'user_achievements',
];

// Reference/config tables that need RLS enabled but may have public read policies
const REFERENCE_TABLES = ['achievement_definitions'];

function getAllMigrationSQL(): string {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  return files.map((f) => readFileSync(join(MIGRATIONS_DIR, f), 'utf-8')).join('\n');
}

describe('RLS Policy Verification (SEC-L3)', () => {
  const allSQL = getAllMigrationSQL();

  it('all user-data tables have RLS enabled', () => {
    for (const table of USER_DATA_TABLES) {
      const pattern = new RegExp(
        `alter\\s+table\\s+(?:public\\.)?${table}\\s+enable\\s+row\\s+level\\s+security`,
        'i'
      );
      expect(allSQL).toMatch(pattern);
    }
  });

  it('all reference tables have RLS enabled', () => {
    for (const table of REFERENCE_TABLES) {
      const pattern = new RegExp(
        `alter\\s+table\\s+(?:public\\.)?${table}\\s+enable\\s+row\\s+level\\s+security`,
        'i'
      );
      expect(allSQL).toMatch(pattern);
    }
  });

  it('all user-data tables have SELECT policy with auth.uid() check', () => {
    for (const table of USER_DATA_TABLES) {
      const pattern = new RegExp(
        `create\\s+policy\\s+.+?\\s+on\\s+(?:public\\.)?${table}\\s+for\\s+select\\s+using\\s*\\(\\s*auth\\.uid\\(\\)`,
        'i'
      );
      expect(allSQL).toMatch(pattern);
    }
  });

  it('all user-data tables have INSERT policy', () => {
    for (const table of USER_DATA_TABLES) {
      const pattern = new RegExp(
        `create\\s+policy\\s+.+?\\s+on\\s+(?:public\\.)?${table}\\s+for\\s+insert`,
        'i'
      );
      expect(allSQL).toMatch(pattern);
    }
  });

  it('all user-data tables have UPDATE policy', () => {
    for (const table of USER_DATA_TABLES) {
      const pattern = new RegExp(
        `create\\s+policy\\s+.+?\\s+on\\s+(?:public\\.)?${table}\\s+for\\s+update`,
        'i'
      );
      expect(allSQL).toMatch(pattern);
    }
  });

  it('all user-data tables have DELETE policy', () => {
    for (const table of USER_DATA_TABLES) {
      const pattern = new RegExp(
        `create\\s+policy\\s+.+?\\s+on\\s+(?:public\\.)?${table}\\s+for\\s+delete`,
        'i'
      );
      expect(allSQL).toMatch(pattern);
    }
  });

  it('achievement_definitions has public SELECT policy (reference data)', () => {
    expect(allSQL).toMatch(
      /create\s+policy\s+.+?\s+on\s+(?:public\.)?achievement_definitions\s+for\s+select\s+using\s*\(\s*true\s*\)/i
    );
  });

  it('no user-data table is missing from the known tables list', () => {
    const rlsPattern = /alter\s+table\s+(?:public\.)?(\w+)\s+enable\s+row\s+level\s+security/gi;
    const tablesWithRLS = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = rlsPattern.exec(allSQL)) !== null) {
      tablesWithRLS.add(match[1]);
    }

    const knownTables = new Set([...USER_DATA_TABLES, ...REFERENCE_TABLES]);
    for (const table of tablesWithRLS) {
      expect(knownTables.has(table)).toBe(true);
    }
  });
});
