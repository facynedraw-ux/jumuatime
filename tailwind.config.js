/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './assets/*.css', './*.js'],
  theme: {
    extend: {
      colors: {
        teal:         '#5B9EAD',
        'teal-light': '#EBF5F7',
        'teal-dark':  '#3D7A8A',
        gold:         '#C49A5A',
        'gold-light': '#F5EDE0',
        'gold-dark':  '#8B6230',
        pink:         '#F2C4B2',
        'pink-light': '#F7EDE8',
        dark:         '#1A1208',
        bg:           '#FAF6F0',
        border:       '#E2D4BC',
        text:         '#1A1208',
        muted:        '#8B7A5A',
        mauve:        '#9B7FA6',
        rose:         '#C96B8A',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
