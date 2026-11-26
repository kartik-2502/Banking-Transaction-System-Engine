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
          cream: '#EFE2CE',         // Rich warm beige tiles/cards over off-white background
          linen: '#F3E7D4',         // Clean warm off-white workspace background
          sand: '#EBDEC8',          // Deeper sand beige for nested sub-cards & table headers
          oat: '#EFE4D2',           // Soft beige for subtle pill highlights
          darkBeige: '#E9D9C0',     // Deep dark beige for upper tiles & summary banners
          darkBeigeHover: '#E2CEAF',
          darkBeigeBorder: '#CEB896',
          taupe: '#D9C7AB',         // Distinct warm border for beige tiles
          espresso: '#1B130D',      // Deep espresso for crisp headings & numbers
          umber: '#3F3124',         // High-contrast dark umber for labels & secondary text
          sidebar: '#261D15',       // Rich dark espresso-brown sidebar
          sidebarHover: '#362A1F',
          bronze: '#70411A',        // Rich cognac bronze
          bronzeDark: '#542F11',
          camel: '#9A7C59',         // Input & focus accent border
          terracotta: '#8E4322',    // Rich burnt sienna
          cocoa: '#4E3424',         // Deep roast cocoa
          gold: '#D9A86C',          // Warm gold highlight on dark espresso sidebar
        }
      }
    },
  },
  plugins: [],
}
