/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./dashboard.html",
    "./agent-dashboard.html",
    "./test-*.html",
    "./debug-*.html",
    "./js/**/*.{js,ts,jsx,tsx}",
    "./widgets/**/*.{js,ts,jsx,tsx,html}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    colors: {
      // Standard Tailwind colors (essential for compatibility)
      white: '#ffffff',
      black: '#000000',
      transparent: 'transparent',
      current: 'currentColor',
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      red: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
      },
      yellow: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
      },
      green: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
      },
      blue: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },
      indigo: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1',
        600: '#4f46e5',
        700: '#4338ca',
        800: '#3730a3',
        900: '#312e81',
      },
    },
    extend: {
      colors: {
        // Shadcn/UI default colors (preserving existing integration)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        // Dashboard Design System - Primary Colors (Blues)
        primary: {
          DEFAULT: "var(--color-primary)", // #007bff
          dark: "var(--color-primary-dark)", // #0056b3
          light: "var(--color-primary-light)", // #3395ff
          foreground: "var(--color-text-inverse)", // #ffffff
          // Additional blue scale for comprehensive usage
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: 'var(--color-primary)',
          600: 'var(--color-primary-dark)',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        
        // Success Colors (Greens)
        success: {
          DEFAULT: "var(--color-success)", // #28a745
          light: "var(--color-success-light)", // #20c997
          dark: "var(--color-success-dark)", // #1e7e34
          foreground: "var(--color-text-inverse)",
        },
        
        // Warning Colors (Oranges)
        warning: {
          DEFAULT: "var(--color-warning)", // #fd7e14
          light: "var(--color-warning-light)", // #ffc107
          dark: "var(--color-warning-dark)", // #e55a00
          foreground: "var(--color-text-inverse)",
        },
        
        // Danger Colors (Reds)
        danger: {
          DEFAULT: "var(--color-danger)", // #dc3545
          light: "var(--color-danger-light)", // #e74c3c
          dark: "var(--color-danger-dark)", // #c82333
          foreground: "var(--color-text-inverse)",
        },
        
        // Background Colors
        bg: {
          primary: "var(--color-bg-primary)", // #ffffff
          secondary: "var(--color-bg-secondary)", // #f8f9fa
          tertiary: "var(--color-bg-tertiary)", // #e9ecef
        },
        
        
        // Text Colors
        text: {
          primary: "var(--color-text-primary)", // #212529
          secondary: "var(--color-text-secondary)", // #6c757d
          muted: "var(--color-text-muted)", // #adb5bd
          inverse: "var(--color-text-inverse)", // #ffffff
        },
        
        // Border Colors
        'border-color': {
          DEFAULT: "var(--color-border)", // #dee2e6
          dark: "var(--color-border-dark)", // #adb5bd
        },
        
        // Shadcn/UI compatibility aliases
        secondary: {
          DEFAULT: "var(--color-bg-secondary)",
          foreground: "var(--color-text-primary)",
        },
        destructive: {
          DEFAULT: "var(--color-danger)",
          foreground: "var(--color-text-inverse)",
        },
        muted: {
          DEFAULT: "var(--color-text-muted)",
          foreground: "var(--color-text-secondary)",
        },
        accent: {
          DEFAULT: "var(--color-primary-light)",
          foreground: "var(--color-text-inverse)",
        },
        popover: {
          DEFAULT: "var(--color-bg-primary)",
          foreground: "var(--color-text-primary)",
        },
        card: {
          DEFAULT: "var(--color-bg-primary)",
          foreground: "var(--color-text-primary)",
        },
        
        // Dashboard-specific semantic colors
        dashboard: {
          bg: 'var(--color-bg-secondary)',
          card: 'var(--color-bg-primary)',
          border: 'var(--color-border)',
          text: 'var(--color-text-primary)',
          muted: 'var(--color-text-muted)',
        },
        
        // Agent status colors
        agent: {
          active: 'var(--color-success)',
          inactive: 'var(--color-text-muted)',
          error: 'var(--color-danger)',
          warning: 'var(--color-warning)',
        }
      },
      borderRadius: {
        // CSS custom property integration
        'xs': "var(--radius-sm)", // 0.25rem
        'sm': "var(--radius-sm)", // 0.25rem
        DEFAULT: "var(--radius)", // 0.375rem
        'md': "var(--radius)", // 0.375rem
        'lg': "var(--radius-lg)", // 0.75rem
        'xl': '1rem',
        '2xl': '1.5rem',
        // Keep shadcn/ui compatibility
        'shadcn-lg': "var(--radius)",
        'shadcn-md': "calc(var(--radius) - 2px)",
        'shadcn-sm': "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: [
          '-apple-system', 
          'BlinkMacSystemFont', 
          'Segoe UI', 
          'Roboto', 
          'Helvetica Neue', 
          'Arial', 
          'sans-serif'
        ],
        mono: ['Courier New', 'JetBrains Mono', 'Consolas', 'monospace'],
      },
      spacing: {
        // CSS custom property integration
        'xs': "var(--spacing-xs)", // 0.25rem
        'sm': "var(--spacing-sm)", // 0.5rem
        'md': "var(--spacing-md)", // 1rem
        'lg': "var(--spacing-lg)", // 1.5rem
        'xl': "var(--spacing-xl)", // 2rem
        'xxl': "var(--spacing-xxl)", // 3rem
        // Additional spacing for layout
        '18': '4.5rem',
        '88': '22rem',
      },
      boxShadow: {
        // CSS custom property integration
        'sm': "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        'lg': "var(--shadow-lg)",
        // Additional shadows for specific use cases
        'widget': "var(--shadow)",
        'widget-hover': "var(--shadow-lg)",
      },
      transitionTimingFunction: {
        // CSS custom property integration
        'fast': "var(--transition-fast)",
        DEFAULT: "var(--transition)",
        'slow': "var(--transition-slow)",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require("tailwindcss-animate"),
  ],
}