# Story 11.7: Data Export for GDPR Compliance

Status: ready-for-dev

## Story

As a user,
I want to export all my personal data,
So that I can comply with my right to data portability under GDPR.

## Acceptance Criteria

1. Given a user navigates to Settings, When they click "Export My Data", Then a data export is generated containing all their personal data. And the export API returns a downloadable JSON response.

2. Given the export is generated, When it completes, Then it includes: profile data (email, display name, created date), all session recordings (MIDI events from `sessions` and `midiEvents` IndexedDB tables), analysis snapshots (from `analysisSnapshots` table), drill records (from `drillRecords` table), progress metrics (XP, streaks from `progress_metrics` Supabase table), achievements (from Supabase), chat conversations (from `ai_conversations` Supabase table), and API key metadata (provider + last 4 chars of the key, NOT the actual key).

3. Given the export format, When it is downloaded, Then it is a JSON file with clear structure and human-readable field names. And each section is labeled (e.g., `"profile"`, `"sessions"`, `"midiEvents"`, `"analysisSnapshots"`, `"drillRecords"`, `"progressMetrics"`, `"achievements"`, `"chatConversations"`, `"apiKeyMetadata"`).

4. Given the export is in progress, When it takes time, Then a progress indicator shows "Preparing your data export..." and the button is disabled. And the user is notified when the export is ready for download.

5. Given the export is complete, When the user downloads it, Then the file is named `minstrel-data-export-{YYYY-MM-DD}.json`. And the download is triggered automatically via a blob URL.

6. Given the settings page, When the export option is visible, Then it appears in a new "Your Data" section between the Preferences section (line 244) and the Actions section (line 255) at `src/app/(auth)/settings/page.tsx`. And the section header reads "Your Data" in the same mono uppercase style as other section headers.

## Tasks / Subtasks

- [ ] 1. Create server-side data export API route (AC: 1, 2, 3)
  - [ ] 1.1 Create `src/app/api/user/export/route.ts`
  - [ ] 1.2 Authenticate the request using `createClient()` from `@/lib/supabase/server` and verify `supabase.auth.getUser()`
  - [ ] 1.3 Query user profile data from `auth.users` (email, display name, created_at)
  - [ ] 1.4 Query all rows from `progress_metrics` where `user_id` matches
  - [ ] 1.5 Query all rows from `ai_conversations` where `user_id` matches (chat history with token counts)
  - [ ] 1.6 Query API key metadata from `user_api_keys` where `user_id` matches — select only `provider`, `created_at`, `last_four` (or compute last 4 from the key label). NEVER include `encrypted_key`
  - [ ] 1.7 Query achievements data if stored in Supabase
  - [ ] 1.8 Return all data as a structured JSON response with `Content-Disposition: attachment; filename="minstrel-data-export-{date}.json"`

- [ ] 2. Create client-side data export service (AC: 2)
  - [ ] 2.1 Create `src/features/auth/data-export.ts`
  - [ ] 2.2 Export `exportUserData(): Promise<ExportData>` that:
    - Calls the server API route for Supabase data
    - Queries IndexedDB (Dexie) for local-only data: sessions, midiEvents, analysisSnapshots, drillRecords, skillProfiles
  - [ ] 2.3 Use `db.sessions.where('userId').equals(userId).toArray()` to get user's sessions from Dexie (schema at `src/lib/dexie/db.ts:7-20`)
  - [ ] 2.4 Use `db.midiEvents.where('userId').equals(userId).toArray()` for MIDI events (schema at `src/lib/dexie/db.ts:22-34`)
  - [ ] 2.5 Use `db.analysisSnapshots.where('userId').equals(userId).toArray()` for snapshots (schema at `src/lib/dexie/db.ts:64-71`)
  - [ ] 2.6 Use `db.drillRecords.where('userId').equals(userId).toArray()` for drill records (schema at `src/lib/dexie/db.ts:49-62`)
  - [ ] 2.7 Use `db.skillProfiles.where('userId').equals(userId).toArray()` for skill profiles (schema at `src/lib/dexie/db.ts:36-47`)
  - [ ] 2.8 Merge server data and client data into a single export object
  - [ ] 2.9 Export `downloadExportAsJson(data: ExportData): void` that creates a Blob, generates an object URL, and triggers download with filename `minstrel-data-export-{YYYY-MM-DD}.json`

- [ ] 3. Add "Your Data" section to Settings page (AC: 4, 5, 6)
  - [ ] 3.1 Open `src/app/(auth)/settings/page.tsx`
  - [ ] 3.2 Add a new section between the Preferences section (ending at line 252) and the Actions section (starting at line 255)
  - [ ] 3.3 The section should have the header "Your Data" in `font-mono text-caption uppercase tracking-wider text-muted-foreground` style
  - [ ] 3.4 Include descriptive text: "Download a copy of all your Minstrel data including sessions, MIDI recordings, coaching conversations, and progress metrics."
  - [ ] 3.5 Add an "Export My Data" button styled with `variant="outline"` matching existing buttons
  - [ ] 3.6 Add state: `isExporting` boolean, initially false
  - [ ] 3.7 When clicked, set `isExporting = true`, call `exportUserData()`, then call `downloadExportAsJson()`, then set `isExporting = false`
  - [ ] 3.8 While exporting, show "Preparing your data export..." text and disable the button
  - [ ] 3.9 On error, show an amber-colored error message: "Could not generate export. Please try again."

- [ ] 4. Add tests (AC: 1, 2, 3, 5)
  - [ ] 4.1 Create `src/app/api/user/export/route.test.ts` — test the API route returns correct JSON structure, verify `encrypted_key` is NEVER included
  - [ ] 4.2 Create `src/features/auth/data-export.test.ts` — test the export service merges server and client data
  - [ ] 4.3 Test the download function generates correct filename format
  - [ ] 4.4 Test: unauthenticated request returns 401

## Dev Notes

- **Architecture Layer**: Layer 4 (Infrastructure) for the API route and data queries; Layer 2 (Application) for the export service; Layer 1 (Presentation) for the Settings UI.
- **GDPR Requirements**: NFR14 states "MIDI data and session recordings treated as personal data under GDPR." NFR15 states "Users can export all personal data and request complete account deletion." This story covers export; account deletion is deferred (placeholder already exists at `settings/page.tsx:260-281`).
- **Data Sources**:
  - **Supabase (server-side)**: `progress_metrics` (XP, streaks), `ai_conversations` (chat history + tokens), `user_api_keys` (provider metadata ONLY), `auth.users` (profile)
  - **IndexedDB/Dexie (client-side)**: `sessions` (GuestSession), `midiEvents` (StoredMidiEvent), `analysisSnapshots` (AnalysisSnapshot), `drillRecords` (StoredDrillRecord), `skillProfiles` (StoredSkillProfile)
- The Dexie database is defined at `src/lib/dexie/db.ts`. Tables are indexed by `userId` (added in version 3, line 108-109), making user-specific queries efficient.
- **Security**: The `encrypted_key` field in `user_api_keys` must NEVER be included in the export. Only export `provider`, `created_at`, and a safe identifier (e.g., last 4 characters of the key if stored, or just the provider name).
- The Settings page at `src/app/(auth)/settings/page.tsx` has sections in this order: Profile (line 174), API Keys (line 195), Preferences (line 244), Actions/Danger Zone (line 255). The "Your Data" section should go between Preferences and Actions.
- For the download trigger, use the standard pattern: `const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);`

### Project Structure Notes

- `src/app/api/user/export/route.ts` — create new API route for server-side data export
- `src/app/api/user/export/route.test.ts` — create co-located test
- `src/features/auth/data-export.ts` — create client-side export service
- `src/features/auth/data-export.test.ts` — create co-located test
- `src/app/(auth)/settings/page.tsx` — add "Your Data" section (between lines 252 and 255)
- `src/lib/dexie/db.ts` — reference for IndexedDB schema (tables and types)

### References

- [Source: _bmad-output/planning-artifacts/prd.md] — NFR14: MIDI data as personal data under GDPR; NFR15: Data export and account deletion rights
- [Source: _bmad-output/planning-artifacts/architecture.md] — Supabase PostgreSQL for server data, Dexie.js for IndexedDB client data
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3-3.4] — API key management, encrypted storage
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — Settings page layout, dark studio aesthetic

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
