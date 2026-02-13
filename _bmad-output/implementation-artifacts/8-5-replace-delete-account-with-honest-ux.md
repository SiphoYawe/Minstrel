# Story 8.5: Replace Delete Account With Honest UX

Status: ready-for-dev

## Story

As a user,
I want the settings page to honestly communicate that account deletion is not yet available,
so that I'm not confused by a non-functional button.

## Acceptance Criteria

1. Given a user views the Danger Zone section in Settings, When the section renders, Then the Delete Account button is either removed entirely or clearly marked as unavailable with a non-red, non-destructive appearance. And the section does not use `variant="destructive"` which renders red.

2. Given the design system uses "amber not red" for in-progress/unavailable states, When the Danger Zone renders, Then it uses amber (`--accent-warm` / `text-accent-warm`) instead of red/destructive styling. And the section header uses `text-accent-warm` (already correct in current code). And the button does NOT use `variant="destructive"`.

3. Given account deletion is deferred to Phase 2, When the section renders, Then the copy is clear: "Account deletion -- coming in a future update. Contact support@minstrel.app for removal requests." And there is no disabled button that suggests the feature is imminent.

## Tasks / Subtasks

- [ ] 1. Restyle the Danger Zone section (AC: 1, 2)
  - [ ] 1.1 Open `src/app/(auth)/settings/page.tsx` lines 259-281
  - [ ] 1.2 Current code at line 260: `<h2 className="font-mono text-caption uppercase tracking-wider text-accent-warm">Danger Zone</h2>` -- the header already uses `text-accent-warm` (amber), which is correct
  - [ ] 1.3 Remove the `<Button variant="destructive">` at line 271. This renders a red disabled button which violates the "amber not red" UX principle
  - [ ] 1.4 Remove the entire `<TooltipProvider>/<Tooltip>/<TooltipTrigger>/<TooltipContent>` wrapper (lines 267-279) since the disabled button is being removed

- [ ] 2. Update copy to be honest and helpful (AC: 3)
  - [ ] 2.1 Replace the current copy at line 263-265 with clear, actionable text
  - [ ] 2.2 New copy: "Account deletion -- coming in a future update. Contact support@minstrel.app for removal requests."
  - [ ] 2.3 Style the email as a clickable `mailto:` link using `text-primary` for visibility
  - [ ] 2.4 Remove the Tooltip import if it's no longer used elsewhere in the file

- [ ] 3. Simplify the section markup (AC: 1, 3)
  - [ ] 3.1 The Danger Zone section should be a simple informational block:
    ```
    <div className="border-t border-border pt-6">
      <h2 className="font-mono text-caption uppercase tracking-wider text-accent-warm">
        Danger Zone
      </h2>
      <p className="mt-2 text-caption text-muted-foreground">
        Account deletion — coming in a future update. Contact{' '}
        <a href="mailto:support@minstrel.app" className="text-primary transition-colors hover:brightness-110">
          support@minstrel.app
        </a>{' '}
        for removal requests.
      </p>
    </div>
    ```
  - [ ] 3.2 Remove unused imports: `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger` if not used elsewhere in the file

- [ ] 4. Write test (AC: 1, 2, 3)
  - [ ] 4.1 Update or create `src/app/(auth)/settings/page.test.tsx`
  - [ ] 4.2 Test that no element with `variant="destructive"` renders in the Danger Zone
  - [ ] 4.3 Test that the text "support@minstrel.app" is present as a mailto link
  - [ ] 4.4 Test that no "Delete Account" button renders

## Dev Notes

- **Architecture Layer**: `settings/page.tsx` is Layer 1 (Presentation).
- **Current code** (`src/app/(auth)/settings/page.tsx` lines 259-281):
  ```tsx
  <div className="border-t border-border pt-6">
    <h2 className="font-mono text-caption uppercase tracking-wider text-accent-warm">
      Danger Zone
    </h2>
    <p className="mt-2 text-caption text-muted-foreground">
      Account deletion is not yet available. Contact support for account removal.
    </p>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="mt-4 block w-full">
            <Button variant="destructive" className="w-full" disabled>
              Delete Account
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Account deletion will be available in a future update.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
  ```
- **What's wrong**: The `<Button variant="destructive">` renders a red button (even when disabled), violating the "amber not red" UX principle from the design spec. A disabled red button with a tooltip explaining it doesn't work yet is confusing UX -- it implies the feature is nearly ready.
- **What's already correct**: The section header already uses `text-accent-warm` (amber). The explanatory paragraph already exists but needs updated copy with a specific email address.
- **Tooltip imports**: Check if `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger` are used elsewhere in the file before removing the imports. They are imported at lines 9-13.

### Project Structure Notes

- `src/app/(auth)/settings/page.tsx` -- modify lines 259-281 (Danger Zone section)
- Potentially clean up unused Tooltip imports at lines 9-13

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] -- "Amber, not red" principle: no failure states, only trajectory. Use `--accent-warm` for warning/unavailable states
- [Source: _bmad-output/planning-artifacts/prd.md] -- Account deletion deferred to Phase 2
- [Source: _bmad-output/planning-artifacts/architecture.md] -- Design token usage, component styling patterns

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
