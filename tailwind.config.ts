import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      keyframes: {
        // クーポン適用時の盛り上がり（バウンス + ハイライト）
        'coupon-pop': {
          '0%':   { transform: 'scale(0.96)', opacity: '0' },
          '60%':  { transform: 'scale(1.04)', opacity: '1' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        'coupon-bounce': {
          '0%':   { transform: 'scale(0.6)',  opacity: '0' },
          '50%':  { transform: 'scale(1.15)', opacity: '1' },
          '80%':  { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'coupon-pop':    'coupon-pop 0.45s ease-out',
        'coupon-bounce': 'coupon-bounce 0.8s ease-out',
      },
      fontFamily: {
        sans: ['var(--font-noto-sans-jp)', '"Noto Sans JP"', 'sans-serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#5A5A5A',
          700: '#5A5A5A',
          800: '#5A5A5A',
          900: '#5A5A5A',
        },
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
    },
  },
  plugins: [],
  safelist: [
    // Padding classes
    'py-6',
    'py-5',
    'px-8',
    'p-3',
    'p-4',
    'p-6',
    // Color classes
    'hover:bg-orange-50',
    'hover:bg-gray-50',
    'hover:text-orange-600',
    'text-orange-600',
    'bg-orange-600',
    'hover:bg-orange-700',
    'text-gray-600',
    'text-gray-900',
    // Layout classes
    'flex',
    'flex-col',
    'grid',
    'grid-cols-2',
    'space-y-6',
    'space-y-8',
    'gap-3',
    'gap-4',
    // Size classes
    'w-full',
    'h-full',
    'text-xs',
    'text-sm',
    'text-base',
    'text-lg',
    'text-xl',
    'text-2xl',
    // Border and shadow
    'rounded-xl',
    'rounded-2xl',
    'shadow-md',
    'shadow-lg',
    'overflow-hidden',
  ],
} satisfies Config;