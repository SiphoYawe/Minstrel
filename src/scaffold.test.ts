import { existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '..');

describe('project scaffold (AC 2)', () => {
  const requiredDirs = [
    'src/features/midi',
    'src/features/analysis',
    'src/features/session',
    'src/features/auth',
    'src/features/engagement',
    'src/features/difficulty',
    'src/features/drills',
    'src/features/coaching',
    'src/features/modes',
    'src/components/ui',
    'src/components/viz',
    'src/stores',
    'src/lib/supabase',
    'src/lib/dexie',
    'src/lib/ai',
    'src/types',
    'src/test-utils',
    'e2e/fixtures',
    'public/fonts',
    'public/icons',
    'supabase/migrations',
  ];

  it.each(requiredDirs)('directory %s exists', (dir) => {
    expect(existsSync(resolve(ROOT, dir))).toBe(true);
  });

  const requiredFiles = [
    'vitest.config.ts',
    'playwright.config.ts',
    'sentry.client.config.ts',
    'sentry.server.config.ts',
    '.prettierrc',
    '.env.example',
    '.husky/pre-commit',
    'src/stores/midi-store.ts',
    'src/stores/session-store.ts',
    'src/stores/app-store.ts',
    'src/lib/analytics.ts',
    'src/lib/constants.ts',
    'src/types/api.ts',
    'src/types/midi.ts',
    'src/types/database.ts',
    'src/test-utils/setup.ts',
    'src/test-utils/render.tsx',
    'e2e/fixtures/mock-midi-device.ts',
    'e2e/fixtures/mock-ai-responses.ts',
  ];

  it.each(requiredFiles)('file %s exists', (file) => {
    expect(existsSync(resolve(ROOT, file))).toBe(true);
  });
});

describe('package.json configuration', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pkg = require('../package.json');

  it('has zustand 5.x dependency', () => {
    expect(pkg.dependencies.zustand).toMatch(/\^5/);
  });

  it('has @sentry/nextjs 10.x dependency', () => {
    expect(pkg.dependencies['@sentry/nextjs']).toMatch(/\^10/);
  });

  it('has posthog-js dependency', () => {
    expect(pkg.dependencies['posthog-js']).toBeDefined();
  });

  it('has dexie 4.x dependency', () => {
    expect(pkg.dependencies.dexie).toMatch(/\^4/);
  });

  it('has zod dependency', () => {
    expect(pkg.dependencies.zod).toBeDefined();
  });

  it('has vitest dev dependency', () => {
    expect(pkg.devDependencies.vitest).toBeDefined();
  });

  it('has @testing-library/react dev dependency', () => {
    expect(pkg.devDependencies['@testing-library/react']).toBeDefined();
  });

  it('has @playwright/test dev dependency', () => {
    expect(pkg.devDependencies['@playwright/test']).toBeDefined();
  });

  it('has husky dev dependency', () => {
    expect(pkg.devDependencies.husky).toBeDefined();
  });

  it('has lint-staged dev dependency', () => {
    expect(pkg.devDependencies['lint-staged']).toBeDefined();
  });

  it('has test scripts configured', () => {
    expect(pkg.scripts.test).toBe('vitest run');
    expect(pkg.scripts['test:e2e']).toBe('playwright test');
    expect(pkg.scripts['test:coverage']).toBe('vitest run --coverage');
  });

  it('has lint-staged config', () => {
    expect(pkg['lint-staged']).toBeDefined();
    expect(pkg['lint-staged']['*.{ts,tsx}']).toContain('eslint --fix');
  });
});
