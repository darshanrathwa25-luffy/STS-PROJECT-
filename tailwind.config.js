/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#090A0D',
        panel: {
          DEFAULT: '#12141A',
          secondary: '#181B22',
          subtle: '#1f232c',
        },
        border: {
          DEFAULT: '#292C35',
          subtle: '#1F2229',
          light: '#3A3F4C',
        },
        lab: {
          text: '#E8EAF0',
          muted: '#858B9A',
          accent: '#69A3FF',
          accentHover: '#87B5FF',
          accentMuted: 'rgba(105, 163, 255, 0.15)',
          silver: '#E0E4EC',
          gold: '#FFD166',
          emerald: '#06D6A0',
          ruby: '#EF476F',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Roboto Mono', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-accent': '0 0 15px rgba(105, 163, 255, 0.25)',
        'panel': '0 4px 20px rgba(0, 0, 0, 0.45)',
      },
    },
  },
  plugins: [],
}

