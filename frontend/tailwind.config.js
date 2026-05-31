/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        vaga: {
          pg:         '#6b7280', // cinza
          nomeacao:   '#ef4444', // vermelho
          escolha:    '#22c55e', // verde
          designacao: '#eab308', // amarelo
          acervo:     '#3b82f6', // azul
        },
      },
    },
  },
  plugins: [],
}
