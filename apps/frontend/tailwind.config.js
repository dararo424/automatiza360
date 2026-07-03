/** @type {import('tailwindcss').Config} */

// ─────────────────────────────────────────────────────────────
// Identidad "Selva Eléctrica"
// Tinta verde profunda + lima eléctrico sobre lienzo hueso.
// Las escalas `indigo`, `purple` y `slate` se REMAPEAN a la
// nueva marca para que las ~40 páginas existentes adopten la
// identidad sin tocar cada archivo:
//   indigo-* → verde selva (color de acción/marca)
//   purple-* → verde río (secundario, gradientes)
//   slate-*  → neutros cálidos con base tinta
// No usar indigo/purple/slate "reales" en código nuevo; usar
// los tokens semánticos: ink, bone, lima, selva, rio.
// ─────────────────────────────────────────────────────────────

const selva = {
  50:  '#f1f8ee',
  100: '#dfefd8',
  200: '#bfe0b3',
  300: '#93ca84',
  400: '#63ad55',
  500: '#3f8f36',
  600: '#2c7229',
  700: '#235a23',
  800: '#1d481f',
  900: '#0f2e14',
  950: '#081f0e',
};

const rio = {
  50:  '#effaf6',
  100: '#d8f1e7',
  200: '#b3e3d1',
  300: '#81ceb5',
  400: '#4db296',
  500: '#2b967c',
  600: '#1e7864',
  700: '#196052',
  800: '#164d43',
  900: '#134038',
  950: '#0a2420',
};

// Neutros cálidos: sustituyen al slate frío de Tailwind
const humo = {
  50:  '#f6f5f0',
  100: '#eceae2',
  200: '#dcd9cd',
  300: '#bcb9ab',
  400: '#94927f',
  500: '#6f6e5e',
  600: '#57564a',
  700: '#44443a',
  800: '#2a2c24',
  900: '#181b14',
  950: '#0e110c',
};

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        indigo: selva,
        purple: rio,
        slate: humo,

        ink: {
          DEFAULT: '#101b10',
          soft: '#22301f',
        },
        bone: {
          DEFAULT: '#f4f2ea',
          soft: '#faf9f4',
          deep: '#e9e6da',
        },
        lima: {
          DEFAULT: '#c9f24b',
          bright: '#d8ff56',
          dim: '#a8cf37',
          ghost: '#eefbc8',
        },
        selva,
        rio,
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', '"Instrument Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        pop: '4px 4px 0 0 #101b10',
        'pop-sm': '2px 2px 0 0 #101b10',
        'pop-lima': '4px 4px 0 0 #c9f24b',
        card: '0 1px 2px 0 rgb(16 27 16 / 0.06)',
      },
    },
  },
  plugins: [],
};
