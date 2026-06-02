/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50:'#EEEDFE', 100:'#CECBF6', 400:'#7F77DD', 600:'#534AB7', 800:'#3C3489' },
        success: { 50:'#E1F5EE', 400:'#1D9E75', 600:'#0F6E56' },
        warn:    { 50:'#FAEEDA', 400:'#BA7517', 600:'#854F0B' },
        danger:  { 50:'#FCEBEB', 400:'#E24B4A', 600:'#A32D2D' },
      },
      // Alturas para móvil con safe area
      spacing: {
        'safe-b': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
};
