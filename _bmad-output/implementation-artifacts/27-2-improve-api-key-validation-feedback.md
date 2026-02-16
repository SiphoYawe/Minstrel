# Story 27.2: Improve API Key Validation Feedback

Status: ready-for-dev

## Story

As a user entering my API key,
I want to see clear progress and specific error messages,
So that I know exactly what's happening and can fix problems.

## Acceptance Criteria

1. Given key submitted, When each stage completes, Then UI shows: "Checking format..." -> "Validating with provider..." -> "Active" with green indicator
2. Given key fails format check, When error shows, Then explains: "API keys from [Provider] start with 'sk-'. Check you copied the full key."
3. Given key rejected by provider, When error shows, Then distinguishes: "Key not recognized" vs "Key expired" vs "Insufficient permissions"
4. Given key active, When checked later, Then status badge reflects current state

## Tasks / Subtasks

1. Create multi-stage progress indicator for key validation (SET-C1)
   - Build staged progress UI component
   - Show sequential validation steps with visual feedback
2. Add format-specific error messages per provider (SET-C4)
   - Map provider key formats to validation rules
   - Display provider-specific guidance on format errors
3. Distinguish rejection types from provider responses
   - Parse provider error responses for specific failure reasons
   - Map error codes to user-friendly messages
4. Implement periodic status refresh for active keys
   - Add background check for key validity
   - Update status badge when state changes

## Dev Notes

**Findings Covered**: SET-C1, SET-C4
**Files**: `src/components/settings/api-key-prompt.tsx`, `src/lib/api-key-validation.ts`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
