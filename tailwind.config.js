/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        graph: {
          page: '#60a5fa',
          concept: '#34d399',
          author: '#fbbf24',
          domain: '#a78bfa'
        }
      }
    },
  },
  plugins: [],
}
