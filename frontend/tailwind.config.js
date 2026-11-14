/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#101114',
        surface: {
          DEFAULT: '#191b20',
          secondary: '#22252c',
        },
        mars: {
          primary: '#D97745',
          secondary: '#B85C38',
          accent: '#E65D2F',
        },
        border: '#33363D',
        text: {
          primary: '#F3F3F3',
          secondary: '#A6A8AD',
        }
      }
    },
  },
  plugins: [],
}

