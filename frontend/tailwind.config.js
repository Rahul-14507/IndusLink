/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAF8F5",
        surface: "#FFFFFF",
        "surface-muted": "#F6F4EE",
        ink: "#1D3225",
        "ink-muted": "#3B4C41",
        primary: "#1D3225",
        accent: "#C0392B",
        "risk-low": "#10B981",
        "risk-medium": "#D97706",
        "risk-high": "#C0392B",
        border: "#E3DFD5",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
