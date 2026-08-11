/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0b1017',
        panel: '#121a24',
        line: '#223043',
        accent: '#38bdf8',
      },
    },
  },
  plugins: [],
}
