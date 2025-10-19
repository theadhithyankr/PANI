/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#A38AFF',
          50: '#F5F3FF',
          100: '#EAE5FF',
          200: '#D5CCFF',
          600: '#8F73FF',
        },
      },
    },
  },
  plugins: [
    // Add custom base styles
    function({ addBase }) {
      addBase({
        'body': {
          background: 'linear-gradient(to bottom right, #F9FAFB, #F5F3FF)',
          minHeight: '100vh',
        },
      })
    }
  ],
};
