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
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
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