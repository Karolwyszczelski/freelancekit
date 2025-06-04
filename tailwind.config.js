/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
      colors: {
        gradientStart: '#7F00FF',
        gradientEnd: '#00BFA6',
      },
      backdropBlur: {
        xs: '4px',
      },
      boxShadow: {
        neon: '0 0 20px rgba(79,70,229,0.7), 0 0 30px rgba(59,130,246,0.7)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
};
