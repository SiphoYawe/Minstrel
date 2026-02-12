import { existsSync, readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '..');

describe('design system configuration (Story 1.2)', () => {
  describe('globals.css design tokens', () => {
    const css = readFileSync(resolve(ROOT, 'src/app/globals.css'), 'utf-8');

    it('defines dark-only background (#0F0F0F = 0 0% 5.9%)', () => {
      expect(css).toContain('--background: 0 0% 5.9%');
    });

    it('defines primary accent (#7CB9E8 = 206 70% 70%)', () => {
      expect(css).toContain('--primary: 206 70% 70%');
    });

    it('defines card surface (#171717 = 0 0% 9%)', () => {
      expect(css).toContain('--card: 0 0% 9%');
    });

    it('defines foreground as white', () => {
      expect(css).toContain('--foreground: 0 0% 100%');
    });

    it('defines 0px border radius', () => {
      expect(css).toContain('--radius: 0rem');
    });

    it('defines surface palette tokens', () => {
      expect(css).toContain('--surface:');
      expect(css).toContain('--surface-light:');
      expect(css).toContain('--surface-lighter:');
      expect(css).toContain('--surface-border:');
    });

    it('defines accent palette tokens', () => {
      expect(css).toContain('--accent-blue:');
      expect(css).toContain('--accent-violet:');
      expect(css).toContain('--accent-green:');
      expect(css).toContain('--accent-warm:');
      expect(css).toContain('--accent-success:');
      expect(css).toContain('--accent-error:');
    });

    it('does not contain light mode (.dark class or :root light values)', () => {
      // Should only have :root, no separate .dark override
      const darkSelectorCount = (css.match(/\.dark\s*\{/g) || []).length;
      expect(darkSelectorCount).toBe(0);
    });

    it('includes prefers-reduced-motion media query', () => {
      expect(css).toContain('prefers-reduced-motion: reduce');
      expect(css).toContain('animation-duration: 0.01ms');
      expect(css).toContain('transition-duration: 0.01ms');
    });

    it('includes focus-visible styles', () => {
      expect(css).toContain(':focus-visible');
    });
  });

  describe('tailwind.config.ts tokens', () => {
    const config = readFileSync(resolve(ROOT, 'tailwind.config.ts'), 'utf-8');

    it('defines 0px border radius for all sizes', () => {
      expect(config).toContain('sm: "0px"');
      expect(config).toContain('md: "0px"');
      expect(config).toContain('lg: "0px"');
      expect(config).toContain('xl: "0px"');
      expect(config).toContain('full: "0px"');
    });

    it('defines Inter and JetBrains Mono font families', () => {
      expect(config).toContain('"Inter"');
      expect(config).toContain('"JetBrains Mono"');
    });

    it('defines surface color tokens', () => {
      expect(config).toContain('surface:');
      expect(config).toContain('var(--surface)');
    });

    it('defines accent-blue, accent-warm, accent-success colors', () => {
      expect(config).toContain('"accent-blue"');
      expect(config).toContain('"accent-warm"');
      expect(config).toContain('"accent-success"');
    });

    it('defines custom typography scale', () => {
      expect(config).toContain('"page-title"');
      expect(config).toContain('"section-heading"');
      expect(config).toContain('"card-heading"');
      expect(config).toContain('"ui-label"');
      expect(config).toMatch(/caption:\s*\[/);
    });

    it('defines micro and layout transition durations', () => {
      expect(config).toContain('micro: "150ms"');
      expect(config).toContain('layout: "300ms"');
    });
  });

  describe('font loading (Google Fonts)', () => {
    const layout = readFileSync(resolve(ROOT, 'src/app/layout.tsx'), 'utf-8');

    it('imports Inter from next/font/google', () => {
      expect(layout).toContain('Inter');
      expect(layout).toContain('next/font/google');
    });

    it('imports JetBrains_Mono from next/font/google', () => {
      expect(layout).toContain('JetBrains_Mono');
    });

    it('does not have unused local font files', () => {
      expect(existsSync(resolve(ROOT, 'src/fonts/inter-variable.woff2'))).toBe(false);
      expect(existsSync(resolve(ROOT, 'public/fonts/inter-variable.woff2'))).toBe(false);
    });
  });

  describe('shadcn/ui components installed', () => {
    const requiredComponents = [
      'button',
      'card',
      'dialog',
      'input',
      'select',
      'tabs',
      'sonner',
      'tooltip',
      'badge',
      'progress',
      'scroll-area',
      'separator',
    ];

    it.each(requiredComponents)('component %s exists', (component) => {
      expect(existsSync(resolve(ROOT, `src/components/ui/${component}.tsx`))).toBe(true);
    });
  });

  describe('component design system compliance', () => {
    it('button uses duration-micro transitions', () => {
      const btn = readFileSync(resolve(ROOT, 'src/components/ui/button.tsx'), 'utf-8');
      expect(btn).toContain('duration-micro');
    });

    it('button default height meets 44px touch target (h-11)', () => {
      const btn = readFileSync(resolve(ROOT, 'src/components/ui/button.tsx'), 'utf-8');
      expect(btn).toContain('h-11');
    });

    it('input height meets 44px touch target (h-11)', () => {
      const input = readFileSync(resolve(ROOT, 'src/components/ui/input.tsx'), 'utf-8');
      expect(input).toContain('h-11');
    });

    it('select trigger height meets 44px touch target (h-11)', () => {
      const select = readFileSync(resolve(ROOT, 'src/components/ui/select.tsx'), 'utf-8');
      expect(select).toContain('h-11');
    });

    it('no components use shadow-md or shadow-lg', () => {
      const uiDir = resolve(ROOT, 'src/components/ui');
      const files = readdirSync(uiDir).filter((f) => f.endsWith('.tsx'));
      for (const file of files) {
        const content = readFileSync(resolve(uiDir, file), 'utf-8');
        expect(content).not.toMatch(/shadow-md|shadow-lg/);
      }
    });

    it('select component does not use dark: conditional prefixes', () => {
      const select = readFileSync(resolve(ROOT, 'src/components/ui/select.tsx'), 'utf-8');
      expect(select).not.toMatch(/dark:/);
    });

    it('no unstyled checkbox component exists', () => {
      expect(existsSync(resolve(ROOT, 'src/components/ui/checkbox.tsx'))).toBe(false);
    });
  });

  describe('marketing landing page', () => {
    it('layout exists at src/app/(marketing)/layout.tsx', () => {
      expect(existsSync(resolve(ROOT, 'src/app/(marketing)/layout.tsx'))).toBe(true);
    });

    it('page exists at src/app/(marketing)/page.tsx', () => {
      expect(existsSync(resolve(ROOT, 'src/app/(marketing)/page.tsx'))).toBe(true);
    });

    it('page is a server component (no "use client")', () => {
      const page = readFileSync(resolve(ROOT, 'src/app/(marketing)/page.tsx'), 'utf-8');
      expect(page).not.toContain('"use client"');
      expect(page).not.toContain("'use client'");
    });

    it('page contains Minstrel branding', () => {
      const page = readFileSync(resolve(ROOT, 'src/app/(marketing)/page.tsx'), 'utf-8');
      expect(page).toContain('Minstrel');
    });

    it('page contains CTA to /play', () => {
      const page = readFileSync(resolve(ROOT, 'src/app/(marketing)/page.tsx'), 'utf-8');
      expect(page).toContain('/play');
      expect(page).toContain('Start Playing');
    });
  });

  describe('root layout', () => {
    const layout = readFileSync(resolve(ROOT, 'src/app/layout.tsx'), 'utf-8');

    it('uses dark class on html element', () => {
      expect(layout).toContain('className="dark"');
    });

    it('uses Inter and JetBrains Mono font variables', () => {
      expect(layout).toContain('--font-inter');
      expect(layout).toContain('--font-jetbrains-mono');
    });

    it('includes TooltipProvider', () => {
      expect(layout).toContain('TooltipProvider');
    });

    it('includes Toaster for toast notifications', () => {
      expect(layout).toContain('Toaster');
      expect(layout).toContain('@/components/ui/sonner');
    });

    it('does not use ThemeProvider (dark-only)', () => {
      expect(layout).not.toContain('ThemeProvider');
      expect(layout).not.toContain('next-themes');
    });
  });
});
