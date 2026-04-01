/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#800000", // Maroon for CHCCI
        secondary: "#FFD700", // Gold accents
        accent: "#1A237E", // Deep Blue
      }
    },
  },
  plugins: [],
}

