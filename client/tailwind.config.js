/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bone: "#e5e1d8",
        ink: "#2a1d17",
        leaf: "#456f3a",
        navy: {
          950: "#111111",
          900: "#1a1a1a",
          800: "#262626",
        },
        paper: "#e5e1d8",
      },
      fontFamily: {
        sans: ["Epilogue", '"Noto Sans Tamil"', "sans-serif"],
        display: ["Epilogue", '"Noto Sans Tamil"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
