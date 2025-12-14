/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        russo: ['var(--font-russo)', 'sans-serif'],
      },
      colors: {
        // Colores de Marca Dinámicos (Se llenarán con CSS Variables)
        brand: {
          primary: 'var(--brand-primary)',       // Color principal de la empresa
          secondary: 'var(--brand-secondary)',   // Color secundario/superficies
          bg: 'var(--brand-bg)',                 // Fondo principal
          text: 'var(--brand-text)',             // Color de texto
          accent: 'var(--brand-accent)',         // Acento (calculado)
          DEFAULT: 'var(--brand-primary)',       // Fallback
        },
      },
    },
  },
  plugins: [],
}
