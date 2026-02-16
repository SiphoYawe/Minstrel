# Story 27.1: Add Step-by-Step BYOK Setup Guide

Status: ready-for-dev

## Story

As a non-technical musician,
I want step-by-step guidance to set up my API key,
So that I can enable AI coaching without needing external help.

## Acceptance Criteria

1. Given user needs API key, When they reach setup screen, Then a step-by-step wizard with numbered steps guides them through the process
2. Given step 2 (external provider), When user clicks "Open [Provider]", Then a tooltip/overlay shows what to look for on the provider site
3. Given "Other Provider" option, When selected, Then documentation explains supported providers and their key formats
4. Given setup flow completed, Then user didn't need to leave the wizard (paste field in same view)

## Tasks / Subtasks

1. Create step-by-step BYOK wizard component (SET-C2)
   - Build multi-step wizard UI with numbered progress indicator
   - Implement step navigation (next/back/skip)
2. Add provider-specific guidance overlays (SET-C3)
   - Create overlay components for each supported provider
   - Show visual cues for what to look for on provider sites
3. Add "Other Provider" documentation
   - List supported providers and their key formats
   - Provide inline help text for custom provider setup
4. Keep paste field in wizard view
   - Ensure API key input field is accessible within the wizard
   - Avoid requiring users to leave the wizard flow

## Dev Notes

**Findings Covered**: SET-C2, SET-C3
**Files**: `src/components/settings/api-key-prompt.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
