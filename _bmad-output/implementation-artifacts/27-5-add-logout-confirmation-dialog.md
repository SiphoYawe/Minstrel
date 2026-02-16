# Story 27-5: Add Logout Confirmation Dialog

**Status**: ✅ COMPLETE
**Author**: Melchizedek
**Date**: 2026-02-16

## Story Overview

As a user, I want a confirmation before logging out, so that accidental clicks don't interrupt my practice.

## Acceptance Criteria

- ✅ Given user clicks "Sign Out", When action triggers, Then confirmation dialog shows: "Sign out? Your practice data is saved."
- ✅ Given confirmation dialog, When user confirms, Then logout proceeds normally
- ✅ Given confirmation dialog, When user cancels, Then returns to previous state

## Implementation Summary

### Files Created

1. **`src/components/logout-confirmation-dialog.tsx`**
   - Reusable confirmation dialog component using shadcn AlertDialog
   - Props: `open`, `onOpenChange`, `onConfirm`
   - Title: "Sign out?"
   - Description: "Your practice data is saved. You can resume your session when you return."
   - Buttons: "Cancel" (default) and "Sign Out" (text-accent-warm on outline)
   - Sharp corners (0px border-radius), dark theme, font-mono uppercase

2. **`src/components/__tests__/logout-confirmation-dialog.test.tsx`**
   - 7 tests, all passing
   - Tests rendering, open/closed states, button interactions, accessibility

3. **`src/components/__tests__/logout-button.test.tsx`**
   - 4 tests, all passing
   - Tests dialog display, confirmation flow, cancel flow

### Files Modified

#### 1. `src/components/app-sidebar.tsx`

- Added `useState` import
- Added `LogoutConfirmationDialog` import
- Added `showLogoutDialog` state
- Modified sign-out button to call `setShowLogoutDialog(true)` instead of `handleSignOut`
- Added dialog component at bottom of component tree

#### 2. `src/components/profile-menu.tsx`

- Added `useState` import
- Added `LogoutConfirmationDialog` import
- Added `showLogoutDialog` state
- Modified dropdown menu item to call `setShowLogoutDialog(true)` instead of `handleSignOut`
- Added dialog component at bottom of component tree

#### 3. `src/components/logout-button.tsx`

- Added `useState` import
- Added `LogoutConfirmationDialog` import
- Added `showLogoutDialog` state
- Modified button to call `setShowLogoutDialog(true)` instead of `logout`
- Added dialog component wrapped in fragment

#### 4. `src/app/(auth)/settings/page.tsx`

- Added `LogoutConfirmationDialog` import
- Added `showLogoutDialog` state
- Modified "Sign Out" button in account section to call `setShowLogoutDialog(true)` instead of `signOut`
- Added dialog component at bottom of component tree

#### 5. `src/components/profile-menu.test.tsx`

- Updated 2 tests to click confirmation button in dialog
- Changed from `findByText` to `findByRole('menuitem')` for better accessibility
- Changed from `findByText` to `findByRole('button', { name: /^sign out$/i })` for confirmation button
- All 5 tests passing

## Design Adherence

- ✅ Sharp corners (0px border-radius) - inherited from AlertDialog base component
- ✅ Dark theme with bg-background and border-border
- ✅ Font-mono uppercase for all text
- ✅ Text-accent-warm for confirm button
- ✅ Proper tracking and sizing (text-caption for description)
- ✅ Accessible with proper ARIA roles (alertdialog)

## Test Coverage

- **Component tests**: 11 tests across 3 test files, all passing
  - `logout-confirmation-dialog.test.tsx`: 7 tests
  - `logout-button.test.tsx`: 4 tests
  - `profile-menu.test.tsx`: 5 tests (2 updated)
- **Coverage areas**:
  - Dialog rendering and visibility
  - Confirmation flow (logout proceeds)
  - Cancellation flow (logout aborted)
  - Accessibility (ARIA roles)
  - Styling (design system compliance)

## Integration Points

Successfully integrated into 4 sign-out locations:

1. ✅ AppSidebar (bottom of sidebar)
2. ✅ ProfileMenu (dropdown menu item)
3. ✅ LogoutButton (standalone button)
4. ✅ Settings page (account actions section)

All sign-out flows now require confirmation before proceeding.

## Dev Notes

**Findings Covered**: SET-C7
**Files**: `src/components/app-sidebar.tsx`, `src/components/profile-menu.tsx`, `src/components/logout-button.tsx`, `src/app/(auth)/settings/page.tsx`, `src/components/logout-confirmation-dialog.tsx`

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Completion Notes

- Dialog uses Radix UI AlertDialog primitive via shadcn/ui
- State management is local (useState) in each component - no shared state needed
- Dialog is controlled (open/onOpenChange pattern)
- onConfirm callback executes the original sign-out logic unchanged
- Cancel button uses AlertDialogCancel which automatically closes dialog
- No breaking changes - all existing tests updated and passing

### File List

**Created**:

- `src/components/logout-confirmation-dialog.tsx`
- `src/components/__tests__/logout-confirmation-dialog.test.tsx`
- `src/components/__tests__/logout-button.test.tsx`

**Modified**:

- `src/components/app-sidebar.tsx`
- `src/components/profile-menu.tsx`
- `src/components/logout-button.tsx`
- `src/app/(auth)/settings/page.tsx`
- `src/components/profile-menu.test.tsx`
