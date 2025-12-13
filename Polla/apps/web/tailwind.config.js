/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Cubrimos TODAS las posibilidades de estructura
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // <--- ESTA ES LA CLAVE PARA TU ESTRUCTURA
    "../../packages/ui/**/*.{js,ts,jsx,tsx}" // Por si usas repo turbo
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        russo: ['var(--font-russo)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
