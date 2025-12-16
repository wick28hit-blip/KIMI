/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}"
  ],

  safelist: [
    "neu-flat",
    "neu-pressed",
    "neu-btn",
    "neu-btn-round",
    "neu-active"
  ],

  theme: {
    extend: {},
  },

  plugins: [],
};
