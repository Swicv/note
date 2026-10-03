/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cosmic: {
          950: '#07080d',
          900: '#0b0d14',
          850: '#10131d',
          800: '#161a27',
          700: '#23283b',
          600: '#343b54',
          500: '#4e587d',
          400: '#7582b0',
          300: '#9eaad2',
          200: '#cad3ee',
          100: '#e7ecfa',
          50: '#f5f7fd',
        },
        nebula: {
          cyan: '#00f2fe',
          purple: '#8b5cf6',
          violet: '#a855f7',
          pink: '#f43f5e',
          amber: '#f59e0b',
          emerald: '#10b981',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans SC"',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        glow: {
          '0%': { opacity: '0.4', filter: 'blur(16px)' },
          '100%': { opacity: '0.8', filter: 'blur(24px)' },
        },
      },
    },
  },
  plugins: [],
}
