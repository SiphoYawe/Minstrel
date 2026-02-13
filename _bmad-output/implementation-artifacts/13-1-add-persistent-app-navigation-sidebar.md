# Story 13.1: Add Persistent App Navigation Sidebar

Status: ready-for-dev

## Story

As a musician using Minstrel,
I want a persistent navigation sidebar with links to all major sections,
So that I can navigate the app without typing URLs or using the browser back button.

## Acceptance Criteria

1. Given the user is authenticated and on any page within the (auth) layout, When the page renders, Then a collapsible sidebar is displayed on the left edge with navigation links to: Session (Play), Dashboard, History, Achievements, and Settings
2. Given the sidebar is rendered, When the user views the sidebar, Then each navigation item shows an icon and label, with the currently active route highlighted using accent-blue
3. Given the sidebar is rendered, When the user clicks the collapse toggle, Then the sidebar collapses to icon-only mode (approximately 60px wide) and the main content area expands to fill the freed space
4. Given the sidebar is rendered at the bottom, When the user views the bottom of the sidebar, Then a user avatar/icon is displayed with a dropdown menu containing: Profile, API Key Settings, Sign Out
5. Given the sidebar is in collapsed state, When the user hovers over a navigation icon, Then a tooltip shows the full navigation label
6. Given the viewport width is less than 1024px, When the sidebar renders, Then it defaults to collapsed (icon-only) mode to preserve horizontal space for the visualization canvas

## Tasks / Subtasks

1. Create app-sidebar.tsx component with navigation items
   - Add navigation items: Session (Play), Dashboard, History, Achievements, Settings
   - Implement icon + label layout for each item
   - Add active route highlighting using accent-blue (#7CB9E8)
   - Use Link components from next/link for navigation

2. Add collapse/expand toggle with icon-only mode
   - Create toggle button at top or bottom of sidebar
   - Implement collapsed state (approximately 60px wide)
   - Add transition animations for smooth width changes
   - Update main content area to expand when sidebar collapses

3. Add user avatar dropdown at sidebar bottom
   - Create user avatar/icon component
   - Implement dropdown menu with: Profile, API Key Settings, Sign Out
   - Add click handlers for dropdown actions
   - Style dropdown to match design system

4. Add hover tooltips for collapsed state
   - Implement tooltip component or use shadcn/ui tooltip
   - Show full navigation label on hover when sidebar is collapsed
   - Position tooltips to the right of icons

5. Add responsive behavior for viewport < 1024px
   - Detect viewport width using CSS media query or resize observer
   - Default to collapsed state at < 1024px
   - Ensure functionality remains intact in collapsed mode

6. Modify (auth)/layout.tsx to include sidebar in CSS Grid layout
   - Update layout.tsx to use CSS Grid with grid-template-columns: auto 1fr
   - Ensure sidebar does not conflict with visualization canvas
   - Test layout at multiple viewport sizes

7. Persist collapse state to localStorage via appStore
   - Add sidebarCollapsed state to appStore
   - Save state to localStorage on toggle
   - Restore state on app initialization

8. Add tests for sidebar rendering and navigation
   - Test sidebar renders with all navigation items
   - Test collapse/expand toggle functionality
   - Test active route highlighting
   - Test responsive behavior at < 1024px

## Dev Notes

### Architecture Layer

- **Presentation Layer**: New component (app-sidebar.tsx)
- **Application Layer**: State management via appStore (Zustand)
- **Integration**: Modify (auth)/layout.tsx

### Technical Details

- Component location: src/components/app-sidebar.tsx
- Layout file: src/app/(auth)/layout.tsx
- State store: src/stores/app-store.ts
- Design system: shadcn/ui components + Tailwind CSS
- Navigation icons: Use lucide-react icons
- Color: accent-blue #7CB9E8 for active state
- Border radius: 0px (sharp corners per design system)

### Project Structure Notes

Files to create:

- src/components/app-sidebar.tsx

Files to modify:

- src/app/(auth)/layout.tsx
- src/stores/app-store.ts (add sidebarCollapsed state)

Key implementation notes:

- Use CSS Grid for layout: grid-template-columns: auto 1fr
- Sidebar must NOT conflict with visualization canvas
- Persist collapse state to localStorage
- Navigation links: /session (Play), /dashboard, /history, /achievements, /settings
- Collapsed width: approximately 60px
- Expanded width: approximately 240-280px
- Default to collapsed at viewport width < 1024px

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
