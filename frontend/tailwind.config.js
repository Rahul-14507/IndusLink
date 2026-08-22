/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFAF9",
        surface: "#FFFFFF",
        "surface-muted": "#F3F4F2",
        ink: "#1F2A24",
        "ink-muted": "#5B6660",
        primary: "#0E7C7B",
        accent: "#E8871E",
        "risk-low": "#2E8B57",
        "risk-medium": "#E8871E",
        "risk-high": "#C0392B",
        border: "#E4E6E3",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
