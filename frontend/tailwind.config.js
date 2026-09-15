/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vegas: {
          bg: '#0A0E17',
          sidebar: '#0F172A',
          card: '#162032',
          cardHover: '#1E293B',
          border: '#243049',
          gold: '#EAB308',
          goldLight: '#FDE047',
          goldDark: '#CA8A04',
          accent: '#F59E0B',
        },
      },
    },
  },
  plugins: [],
}
