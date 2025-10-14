// ESM
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      spacing: {
        125: "31rem", // por si usas w-125
      },
    },
  },
  plugins: [],
};
