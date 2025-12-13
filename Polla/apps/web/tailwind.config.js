/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // <--- IMPORTANTE: Cubrir carpeta SRC
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}" // <--- IMPORTANTE: Redundancia
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        russo: ['var(--font-russo)', 'sans-serif'], // Asegura que la fuente cargue
      },
    },
  },
  plugins: [],
}
