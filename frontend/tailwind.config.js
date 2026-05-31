/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      colors: {
        pge: {
          blue:      '#005A92',
          'blue-dark':'#004470',
          'blue-light':'#E8F2FA',
          gold:      '#BB9B32',
          'gold-light':'#F7F1DC',
          green:     '#427942',
          gray:      '#A0A0A0',
        },
        vaga: {
          pg:         '#6b7280',
          nomeacao:   '#C0392B',
          escolha:    '#427942',
          designacao: '#BB9B32',
          acervo:     '#005A92',
        },
      },
    },
  },
  plugins: [],
}
