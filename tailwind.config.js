/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        /* Legacy alias — keeps old `bg-gold` references working during migration */
        gold: {
          DEFAULT: '#4F8EF7',
          hover: '#3B7BE8',
          light: '#EEF4FF',
          dark: '#2563EB',
        },
        /* New colorful accent system */
        accent: {
          DEFAULT: '#4F8EF7',
          hover: '#3B7BE8',
          light: '#EEF4FF',
          dark: '#2563EB',
          purple: '#8B5CF6',
          pink: '#EC4899',
          orange: '#F97316',
          yellow: '#FBBF24',
        },
        sidebar: '#FAFCFF',
        rs: {
          bg: '#F8F9FC',
          surface: '#FFFFFF',
          surface2: '#F3F4F8',
          surface3: '#ECEEF5',
          text: '#1A1A2E',
          text2: '#4A4A6A',
          text3: '#8B8BA8',
          border: '#E2E4EE',
          'border-light': '#ECEEF5',
          separator: '#E2E4EE',
          green: '#22C55E',
          orange: '#F97316',
          red: '#EF4444',
          blue: '#4F8EF7',
          purple: '#8B5CF6',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        gradient: 'gradient 6s ease infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
