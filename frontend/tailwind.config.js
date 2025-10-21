/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'parkchain': {
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        }
      }
    },
  },
  plugins: [],
}