import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EEF8FF',
          100: '#D9F0FF',
          200: '#BCE6FF',
          300: '#8ED7FF',
          400: '#5FC7FF',
          500: '#36B5FF',   // primária (azul claro)
          600: '#189AE6',
          700: '#0F79B3',
        },
      },
      boxShadow: {
        soft: '0 6px 20px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        xl2: '1rem',
      },
    },
  },
  plugins: [],
} satisfies Config
