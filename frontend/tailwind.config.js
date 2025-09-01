/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // This ensures Tailwind is applied to all React files!
  ],
   theme: {
    extend: {
      colors: {
        'primary-dark': '#0d1117',
        'secondary-dark': '#1A1A20',
        'text-light': '#E0E0E0',
        'text-dark': '#A0A0A0',
        'accent-purple': '#8A2BE2',
        'accent-purple-hover': '#7A1EE2',
        'border-dark': '#3A3A40',
        'gradient-dark-purple': '#4B0082',
      },
    },
  },
};