/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EEEDFE', 100: '#CECBF6', 200: '#AFA9EC',
          400: '#7F77DD', 600: '#534AB7', 800: '#3C3489', 900: '#26215C',
        },
        success: { 50: '#E1F5EE', 400: '#1D9E75', 600: '#0F6E56', 800: '#085041' },
        warn:    { 50: '#FAEEDA', 400: '#BA7517', 600: '#854F0B', 800: '#633806' },
        danger:  { 50: '#FCEBEB', 400: '#E24B4A', 600: '#A32D2D', 800: '#791F1F' },
      },
    },
  },
  plugins: [],
};
