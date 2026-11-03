/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Byrne notebook palette. Keep in sync with src/theme/palette.ts.
      colors: {
        paper: {
          DEFAULT: '#F3EEE2',
          raised: '#FAF7F0',
          sunk: '#E9E2D2',
        },
        rule: {
          DEFAULT: '#D3CAB6',
          strong: '#B3A991',
        },
        ink: {
          DEFAULT: '#1C1B19',
          soft: '#4A463F',
          muted: '#756E61',
          faint: '#A0988A',
        },
        blue: {
          DEFAULT: '#1F4E8C',
          deep: '#163B6C',
        },
        red: '#C23B22',
        yellow: '#E0A526',
        ochre: '#8C6310',
      },
      fontFamily: {
        serif: ['"Newsreader Variable"', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        // A single, soft "sheet lifted off the desk" shadow. No glows.
        sheet: '0 1px 0 rgba(28, 27, 25, 0.04), 0 6px 18px -8px rgba(28, 27, 25, 0.18)',
      },
    },
  },
  plugins: [],
}
