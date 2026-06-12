/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canara: {
          blue: "#004792",
          "blue-dark": "#003366",
          "blue-light": "#005DAC",
          gold: "#FFCC00",
          "gold-dark": "#E6B800",
          yellow: "#FDB913",
          cream: "#FFFDF5",
          gray: "#F5F5F5",
        },
      },
      fontFamily: {
        sans: ["Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(0, 71, 146, 0.1)",
        nav: "0 2px 8px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};
