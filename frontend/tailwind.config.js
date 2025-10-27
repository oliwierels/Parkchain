/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'parkchain-500': '#6366F1', 
        'parkchain-600': '#4F46E5',
      },
      fontFamily: { // <-- DODAJ TĘ SEKCJĘ
        sans: ['Inter', 'sans-serif'], // Mówi Tailwindowi, że 'font-sans' to 'Inter'
      },
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'parkchain-400': '#818CF8', // Dodaję jaśniejszy odcień, jeśli go używasz
        'parkchain-500': '#6366F1', 
        'parkchain-600': '#4F46E5',
      },
      fontFamily: { 
        sans: ['Inter', 'sans-serif'],
      },
      // --- DODAJ TE DWIE SEKCJĘ ---
      keyframes: {
        'gradient-animation': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' }, // Dopasuj do @keyframes w CSS
        }
      },
      animation: {
        'gradient-text': 'gradient-animation 1.5s linear infinite', // Zmieniono na linear
      }
      // --- KONIEC DODAWANIA ---
    },
  },
  plugins: [],
}