import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        /* Minstrel extended surface palette */
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          light: 'hsl(var(--surface-light))',
          lighter: 'hsl(var(--surface-lighter))',
          border: 'hsl(var(--surface-border))',
        },
        /* Minstrel semantic accent palette */
        'accent-blue': 'hsl(var(--accent-blue))',
        'accent-violet': 'hsl(var(--accent-violet))',
        'accent-green': 'hsl(var(--accent-green))',
        'accent-warm': 'hsl(var(--accent-warm))',
        'accent-success': 'hsl(var(--accent-success))',
        'accent-error': 'hsl(var(--accent-error))',
      },
      /* 0px border radius everywhere — sharp corners mandate */
      borderRadius: {
        none: '0px',
        sm: '0px',
        DEFAULT: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '0px',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'data-lg': ['2rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'page-title': [
          '1.5rem',
          { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' },
        ],
        'section-heading': [
          '1.125rem',
          { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' },
        ],
        'card-heading': ['1rem', { lineHeight: '1.4', fontWeight: '500' }],
        'ui-label': [
          '0.8125rem',
          { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '500' },
        ],
        caption: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      transitionDuration: {
        '0': '0ms',
        micro: '150ms',
        layout: '300ms',
      },
      maxWidth: {
        content: '90rem',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
