/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand:   { 50:'#E1F5EE', 100:'#B3E5D0', 400:'#1D9E75', 600:'#0F6E56', 800:'#085041' },
        primary: { 50:'#EEEDFE', 400:'#7F77DD', 600:'#534AB7', 800:'#3C3489' },
        warn:    { 50:'#FAEEDA', 400:'#BA7517', 600:'#854F0B' },
        danger:  { 50:'#FCEBEB', 400:'#E24B4A', 600:'#A32D2D' },
      },
    },
  },
  plugins: [],
};
