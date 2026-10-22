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
        cinema: {
          bg: '#0b0b12',
          card: '#141422',
          cardHover: '#1b1b2f',
          glass: 'rgba(20, 20, 34, 0.75)',
          crimson: '#e50914',
          crimsonHover: '#f40612',
          gold: '#d4af37',
          goldHover: '#b8972e',
          muted: '#9494a8',
          border: 'rgba(255, 255, 255, 0.08)'
        }
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'sans-serif'],
        display: ['Bebas Neue', 'sans-serif'],
        heading: ['Poppins', 'sans-serif']
      }
    },
  },
  plugins: [],
}
