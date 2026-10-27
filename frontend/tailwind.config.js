/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cinema: {
          950: '#060709',
          900: '#0B0C10',
          850: '#111319',
          800: '#171922',
          750: '#1E212D',
          700: '#272B3A',
          600: '#3D4258',
          500: '#5A6180',
          400: '#8A92B2',
          300: '#B8BFD8',
          200: '#E1E4F0',
          100: '#F4F5FA',
        },
        crimson: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#E50914', // Cinematic Signature Red
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          950: '#4C0519',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-crimson': '0 0 25px -5px rgba(229, 9, 20, 0.45)',
        'glow-crimson-sm': '0 0 12px -2px rgba(229, 9, 20, 0.35)',
        'cinema-card': '0 10px 30px -10px rgba(0, 0, 0, 0.8)',
      },
      aspectRatio: {
        'poster': '2 / 3',
        'backdrop': '16 / 9',
        'banner': '21 / 9',
      },
    },
  },
  plugins: [],
}
