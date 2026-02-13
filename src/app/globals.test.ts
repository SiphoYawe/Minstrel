import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function findFiles(dir: string, ext: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!entry.startsWith('.') && entry !== 'node_modules') {
        results.push(...findFiles(full, ext));
      }
    } else if (full.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

describe('Design System: Amber Not Red', () => {
  it('no hardcoded red Tailwind classes in component files', () => {
    const files = findFiles(join(__dirname, '..'), '.tsx');
    const redPattern = /(?:text|bg|border|ring)-red-\d+/g;
    const violations: string[] = [];
    for (const file of files) {
      if (file.includes('.test.') || file.includes('node_modules')) continue;
      const content = readFileSync(file, 'utf-8');
      const matches = content.match(redPattern);
      if (matches) {
        violations.push(`${file}: ${matches.join(', ')}`);
      }
    }
    expect(violations).toEqual([]);
  });
});
