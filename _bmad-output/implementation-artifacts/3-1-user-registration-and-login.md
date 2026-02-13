# Story 3.1: User Registration and Login

Status: done

## Story

As a musician,
I want to create an account and log in,
So that my progress and session history are saved across visits.

## Acceptance Criteria

1. **Given** the user wants to persist their data, **When** they navigate to sign up, **Then** they can register with email + password via Supabase Auth and a confirmation email is sent to verify the address.

2. **Given** the Architecture specifies `@supabase/ssr` with cookie-based sessions (AR11), **When** a user logs in, **Then** session management uses `@supabase/ssr` cookie-based sessions with secure, httpOnly, sameSite cookies and the auth state is reflected in `appStore`.

3. **Given** the Architecture requires route protection, **When** an unauthenticated user navigates to `/session`, `/replay`, or `/settings`, **Then** Next.js middleware redirects them to the login page, and after login they are redirected back to the originally requested route.

4. **Given** the Architecture requires a settings page, **When** a logged-in user navigates to `/settings`, **Then** the settings page renders with the dark studio aesthetic, displaying user profile information and placeholder sections for API Keys and Preferences.

5. **Given** the Architecture defines the database schema, **When** the Supabase migration runs, **Then** the following tables are created with correct column types, constraints, and indexes: `users` (profile + preferences), `sessions` (metadata), `midi_events` (time-series), `analysis_snapshots`, `drill_records`, `progress_metrics`, `ai_conversations`, `achievements`, and `user_api_keys` (encrypted key storage).

6. **Given** the Architecture requires per-user data isolation (NFR11), **When** RLS policies are applied, **Then** every table enforces `auth.uid() = user_id` policies for SELECT, INSERT, UPDATE, and DELETE, ensuring no cross-user data access is possible even via direct API manipulation.

7. **Given** COPPA compliance requires age-gating, **When** a user registers, **Then** the registration form includes a date of birth field, and registration is blocked with a clear message if the user is under 13 years old.

8. **Given** a registered user, **When** they log in and subsequently log out, **Then** login creates a valid session with cookie persistence across page reloads, and logout clears the session cookie and redirects to the landing page.

## Tasks / Subtasks

- [ ] Task 1: Create Supabase database migration for all application tables (AC: 5, 6)
  - [ ] Create `supabase/migrations/001_users.sql` with `users` table: `id uuid references auth.users primary key`, `email text not null`, `display_name text`, `date_of_birth date`, `preferences jsonb default '{}'::jsonb`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`
  - [ ] Create `supabase/migrations/002_api_keys.sql` with `user_api_keys` table: `id uuid default gen_random_uuid() primary key`, `user_id uuid references users(id) on delete cascade not null`, `provider text not null`, `encrypted_key text not null`, `key_last_four text not null`, `status text default 'active'`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`, unique constraint on `(user_id, provider)`
  - [ ] Create `supabase/migrations/003_sessions.sql` with `sessions` table: `id uuid default gen_random_uuid() primary key`, `user_id uuid references users(id) on delete cascade not null`, `mode text not null default 'freeform'`, `key_detected text`, `tempo_avg integer`, `timing_accuracy numeric`, `duration_seconds integer`, `summary_insight text`, `started_at timestamptz default now()`, `ended_at timestamptz`, `created_at timestamptz default now()`; add index `idx_sessions_user_id` on `user_id` and `idx_sessions_started_at` on `started_at`
  - [ ] Create `supabase/migrations/004_midi_events.sql` with `midi_events` table: `id uuid default gen_random_uuid() primary key`, `session_id uuid references sessions(id) on delete cascade not null`, `user_id uuid references users(id) on delete cascade not null`, `event_type text not null`, `note integer`, `velocity integer`, `channel integer default 1`, `timestamp_ms numeric not null`, `duration_ms numeric`, `created_at timestamptz default now()`; add composite index `idx_midi_events_session_timestamp` on `(session_id, timestamp_ms)`
  - [ ] Create `supabase/migrations/005_analysis_snapshots.sql` with `analysis_snapshots` table: `id uuid default gen_random_uuid() primary key`, `session_id uuid references sessions(id) on delete cascade not null`, `user_id uuid references users(id) on delete cascade not null`, `snapshot_type text not null default 'silence_triggered'`, `key_detected text`, `chords_used jsonb`, `timing_accuracy numeric`, `tempo_bpm integer`, `key_insight text`, `tendency_data jsonb`, `snapshot_at timestamptz default now()`, `created_at timestamptz default now()`
  - [ ] Create `supabase/migrations/006_drill_records.sql` with `drill_records` table: `id uuid default gen_random_uuid() primary key`, `session_id uuid references sessions(id) on delete cascade`, `user_id uuid references users(id) on delete cascade not null`, `drill_type text not null`, `target_skill text not null`, `difficulty_level numeric`, `attempts integer default 0`, `best_accuracy numeric`, `improvement_delta jsonb`, `status text default 'pending'`, `drill_data jsonb`, `created_at timestamptz default now()`, `completed_at timestamptz`
  - [ ] Create `supabase/migrations/007_progress_metrics.sql` with `progress_metrics` table: `id uuid default gen_random_uuid() primary key`, `user_id uuid references users(id) on delete cascade not null`, `metric_type text not null`, `metric_value numeric not null`, `dimension text`, `period_start timestamptz`, `period_end timestamptz`, `metadata jsonb`, `created_at timestamptz default now()`; add index `idx_progress_metrics_user_type` on `(user_id, metric_type)`; add separate table `personal_records`: `id uuid default gen_random_uuid() primary key`, `user_id uuid references users(id) on delete cascade not null`, `record_type text not null`, `record_value numeric not null`, `session_id uuid references sessions(id)`, `achieved_at timestamptz default now()`, unique on `(user_id, record_type)`
  - [ ] Create `supabase/migrations/008_ai_conversations.sql` with `ai_conversations` table: `id uuid default gen_random_uuid() primary key`, `session_id uuid references sessions(id) on delete cascade`, `user_id uuid references users(id) on delete cascade not null`, `role text not null`, `content text not null`, `token_count integer`, `model text`, `provider text`, `metadata jsonb`, `created_at timestamptz default now()`; add index `idx_ai_conversations_session` on `(session_id, created_at)`
  - [ ] Create `supabase/migrations/009_achievements.sql` with `achievement_definitions` table: `id text primary key`, `name text not null`, `description text not null`, `category text not null`, `icon text`, `criteria jsonb not null`; and `user_achievements` table: `id uuid default gen_random_uuid() primary key`, `user_id uuid references users(id) on delete cascade not null`, `achievement_id text references achievement_definitions(id) not null`, `unlocked_at timestamptz default now()`, `session_id uuid references sessions(id)`, `metadata jsonb`, unique on `(user_id, achievement_id)`
  - [ ] Create `supabase/migrations/010_rls_policies.sql` enabling RLS on all tables and creating SELECT/INSERT/UPDATE/DELETE policies with `auth.uid() = user_id` predicate on each; `achievement_definitions` uses a public SELECT policy (read-only reference data)

- [ ] Task 2: Implement Supabase Auth configuration and helpers (AC: 2)
  - [ ] Update `src/lib/supabase/client.ts` to create browser Supabase client using `createBrowserClient` from `@supabase/ssr`
  - [ ] Update `src/lib/supabase/server.ts` to create server Supabase client using `createServerClient` from `@supabase/ssr` with cookie handling
  - [ ] Update `src/lib/supabase/middleware.ts` to export an `updateSession` helper that refreshes auth tokens and manages cookie exchange

- [ ] Task 3: Implement Next.js middleware for auth route protection (AC: 3)
  - [ ] Update `src/middleware.ts` to import `updateSession` from `@/lib/supabase/middleware`
  - [ ] Configure middleware matcher to protect `/session`, `/replay/:path*`, and `/settings` routes
  - [ ] Redirect unauthenticated users to `/login` with a `redirectTo` query parameter preserving the original URL
  - [ ] Allow public routes: `/`, `/play`, `/login`, `/signup`, `/api/*`

- [ ] Task 4: Create authentication UI pages (AC: 1, 7, 8)
  - [ ] Create `src/app/(marketing)/login/page.tsx` with email + password login form using shadcn/ui components (dark studio aesthetic)
  - [ ] Create `src/app/(marketing)/signup/page.tsx` with registration form: email, password, confirm password, date of birth (COPPA age-gating), terms acceptance checkbox
  - [ ] Implement COPPA validation: calculate age from date of birth, block registration if < 13 with message "You must be at least 13 years old to create an account"
  - [ ] Implement form validation using Zod schemas for both login and signup
  - [ ] Handle Supabase Auth errors with growth mindset user-facing messages (not raw error codes)
  - [ ] On successful login, redirect to the `redirectTo` param or `/session`

- [ ] Task 5: Create auth feature module (AC: 2, 8)
  - [ ] Create `src/features/auth/auth-provider.tsx` wrapping app with Supabase auth state listener, syncing auth state to `appStore`
  - [ ] Create `src/features/auth/use-auth.ts` hook exposing `user`, `isAuthenticated`, `isLoading`, `signIn`, `signOut`, `signUp`
  - [ ] Create `src/features/auth/auth-types.ts` with `AuthUser`, `AuthState`, `SignUpData`, `SignInData` types
  - [ ] Create `src/features/auth/index.ts` barrel export

- [ ] Task 6: Update appStore with auth state (AC: 2, 8)
  - [ ] Add `user: AuthUser | null`, `isAuthenticated: boolean`, `isLoading: boolean` to `appStore` state
  - [ ] Add `setUser`, `clearUser` actions to `appStore`
  - [ ] Add `hasApiKey: boolean` placeholder (defaults to `false`, populated in Story 3.4)

- [ ] Task 7: Create settings page shell (AC: 4)
  - [ ] Create `src/app/(auth)/settings/page.tsx` with dark studio layout
  - [ ] Add user profile section displaying email and display name
  - [ ] Add placeholder "API Keys" section (populated in Story 3.3)
  - [ ] Add placeholder "Preferences" section
  - [ ] Add "Sign Out" button that calls `signOut` and redirects to landing page
  - [ ] Add "Delete Account" section with confirmation dialog (GDPR NFR15)

- [ ] Task 8: Create auth trigger function for user profile creation (AC: 5)
  - [ ] Add to `supabase/migrations/001_users.sql` a PostgreSQL trigger function `handle_new_user()` that inserts a row into `users` table when a new `auth.users` row is created, copying `id` and `email`
  - [ ] Create trigger `on_auth_user_created` on `auth.users` after INSERT executing `handle_new_user()`

- [ ] Task 9: Write tests (AC: all)
  - [ ] Create `src/features/auth/use-auth.test.ts` testing sign-up validation (COPPA age check, email format, password strength)
  - [ ] Create `src/features/auth/auth-provider.test.tsx` testing auth state sync to appStore
  - [ ] Create `e2e/auth-flow.spec.ts` placeholder for E2E auth flow tests

## Dev Notes

- **Supabase Auth Pattern**: Use `@supabase/ssr` v0.6+ with cookie-based sessions. The browser client uses `createBrowserClient()` and the server client uses `createServerClient()` with cookie get/set/remove callbacks from `next/headers`. See Supabase docs for Next.js App Router integration.
- **Middleware Pattern**: The middleware must call `updateSession()` on every request to refresh the auth token. This prevents stale sessions. The middleware config matcher should exclude static files and api routes that don't need auth.
- **Database Migration Order**: Migrations are numbered 001-010 and must be applied in order due to foreign key dependencies. The `users` table references `auth.users` and all other tables reference `users`.
- **RLS Policy Pattern**: Every table gets four policies (SELECT, INSERT, UPDATE, DELETE). The predicate is always `auth.uid() = user_id`. For `achievement_definitions`, use a public SELECT policy since it's reference data.
- **Trigger for User Profile**: A PostgreSQL trigger on `auth.users` INSERT automatically creates the `users` profile row. This ensures the profile exists immediately after Supabase Auth registration without a separate client call.
- **COPPA Age-Gating**: Validate date of birth client-side before submission AND server-side in the trigger/API. Users under 13 are blocked entirely, not just from certain features.
- **Growth Mindset in Auth Errors**: Auth error messages must follow the growth mindset principle. Examples: "That email is already in use — try logging in instead" rather than "ERROR: duplicate email".
- **Security**: Never log user passwords or auth tokens. Supabase handles password hashing. Cookie settings: `secure: true`, `httpOnly: true`, `sameSite: 'lax'`.
- **GDPR (NFR14/15)**: The settings page must include account deletion. Supabase Auth provides `deleteUser()` admin API. Use `ON DELETE CASCADE` on all foreign keys referencing `users(id)` so that deleting the user cascades to all their data.

### Project Structure Notes

Files created/modified in this story:

```
supabase/migrations/001_users.sql
supabase/migrations/002_api_keys.sql
supabase/migrations/003_sessions.sql
supabase/migrations/004_midi_events.sql
supabase/migrations/005_analysis_snapshots.sql
supabase/migrations/006_drill_records.sql
supabase/migrations/007_progress_metrics.sql
supabase/migrations/008_ai_conversations.sql
supabase/migrations/009_achievements.sql
supabase/migrations/010_rls_policies.sql
src/lib/supabase/client.ts          (update)
src/lib/supabase/server.ts          (update)
src/lib/supabase/middleware.ts       (update)
src/middleware.ts                    (update)
src/features/auth/auth-provider.tsx  (create)
src/features/auth/use-auth.ts       (create)
src/features/auth/auth-types.ts     (create)
src/features/auth/index.ts          (create)
src/stores/app-store.ts             (update)
src/app/(marketing)/login/page.tsx   (create)
src/app/(marketing)/signup/page.tsx  (create)
src/app/(auth)/settings/page.tsx     (create)
src/features/auth/use-auth.test.ts   (create)
src/features/auth/auth-provider.test.tsx (create)
e2e/auth-flow.spec.ts               (create)
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1]
- [Source: _bmad-output/planning-artifacts/prd.md#FR46, NFR9-NFR15]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
