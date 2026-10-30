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
        obsidian: {
          950: '#060709',
          900: '#0c0d12',
          850: '#11131a',
          800: '#161922',
          700: '#212432',
          600: '#2d3144',
          500: '#474c66',
        },
        candle: {
          50: '#fffdf5',
          100: '#fef7dc',
          200: '#fde9a8',
          300: '#fcd36c',
          400: '#fbb733',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        marigold: {
          100: '#ffebd4',
          200: '#ffd0a3',
          300: '#ffa866',
          400: '#ff8533',
          500: '#ea580c',
          600: '#c2410c',
          700: '#9a3412',
          glow: '#ff9800',
        },
        velvet: {
          950: '#1a0404',
          900: '#2c0808',
          800: '#450a0a',
          700: '#5c1111',
          600: '#7f1d1d',
          500: '#991b1b',
        },
        parchment: {
          50: '#faf6f0',
          100: '#f4ede1',
          200: '#e7d8c3',
          300: '#d5bea1',
          400: '#bfa07d',
          800: '#2d241c',
          900: '#1f1812',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', 'serif'],
        cormorant: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        cinzel: ['Cinzel', 'Trajan Pro', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'candle-sm': '0 0 10px rgba(245, 158, 11, 0.25)',
        'candle-md': '0 0 25px rgba(245, 158, 11, 0.35), 0 0 50px rgba(234, 88, 12, 0.15)',
        'candle-lg': '0 0 40px rgba(245, 158, 11, 0.5), 0 0 80px rgba(234, 88, 12, 0.25)',
        'ofrenda': '0 15px 35px -5px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.2)',
        'altar': '0 -10px 40px 10px rgba(245, 158, 11, 0.12)',
      },
      animation: {
        'flicker': 'flicker 2.5s ease-in-out infinite alternate',
        'flicker-subtle': 'flickerSubtle 3s ease-in-out infinite',
        'float-slow': 'floatSlow 7s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '0.95', transform: 'scale(1) rotate(-0.5deg)' },
          '25%': { opacity: '0.85', transform: 'scale(0.98) rotate(0.8deg)' },
          '50%': { opacity: '1', transform: 'scale(1.04) rotate(-0.8deg)' },
          '75%': { opacity: '0.9', transform: 'scale(1.01) rotate(0.4deg)' },
        },
        flickerSubtle: {
          '0%, 100%': { opacity: '0.9' },
          '50%': { opacity: '1', filter: 'brightness(1.15)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(4deg)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(245, 158, 11, 0.25)' },
          '50%': { boxShadow: '0 0 35px rgba(245, 158, 11, 0.5), 0 0 60px rgba(234, 88, 12, 0.2)' },
        }
      }
    },
  },
  plugins: [],
}
