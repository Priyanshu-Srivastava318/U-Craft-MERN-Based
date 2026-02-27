/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        craft: {
          50: '#fdf6ee',
          100: '#fae9d4',
          200: '#f4d0a4',
          300: '#edb06c',
          400: '#e48c3a',
          500: '#dc701c',
          600: '#c45812',
          700: '#a34012',
          800: '#843417',
          900: '#6c2d16',
        },
        terracotta: {
          400: '#e07a5f',
          500: '#d4614a',
          600: '#c24f38',
        },
        sage: {
          100: '#e8ede6',
          200: '#c8d8c4',
          300: '#a3bf9e',
          400: '#7da577',
          500: '#5d8a57',
        },
        ink: {
          900: '#1a1208',
          800: '#2d1f0a',
          700: '#3d2b0f',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        accent: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-right': 'slideRight 0.5s ease-out forwards',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    },
  },
  plugins: [],
}
