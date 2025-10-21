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