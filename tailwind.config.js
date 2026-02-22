/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#121212",
        surface: "#1E1E1E",
        primary: "#2563EB",
        text: {
          main: "#FFFFFF",
          secondary: "#9CA3AF"
        }
      }
    },
  },
  plugins: [],
}
