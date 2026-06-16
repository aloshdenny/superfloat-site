/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        iowan: ["Iowan Old Style BT", "serif"], 
      },
    },
  },
  plugins: [],
};
