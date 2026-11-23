/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bank: {
          navy: '#0B192C',
          dark: '#1E3E62',
          primary: '#0066CC',
          light: '#F1F6F9',
          accent: '#FF6500',
        }
      }
    },
  },
  plugins: [],
}
