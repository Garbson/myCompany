/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta paper/warm — usada em toda a UI
        paper: {
          50:  '#FDFBF5', // quase branco quente (page bg fallback)
          100: '#F7F1E1', // bone claro (cards sobre paper)
          200: '#EFE7D2', // bone médio (hover / secondary surface)
          300: '#E4D9BC', // bone escurecido (bordas suaves)
          400: '#C8B995', // sombra warm
        },
        cream: {
          DEFAULT: '#F5EFDF', // fundo padrão da página
          soft: '#EDE4CE',
          deep: '#E0D2AE',
        },
        ink: {
          50:  '#8A8172', // texto desativado
          100: '#6B6558', // texto secundário
          200: '#4A453B', // texto de apoio
          300: '#2E2A22', // texto principal
          400: '#1F1B15', // preto quente (headings)
          500: '#0F0D08', // ultra dark (raro)
        },
        // Acentos terrosos
        olive: {
          400: '#8A9A5B',
          500: '#6B7A3F',
          600: '#556231',
          700: '#3F4A24',
        },
        terra: {
          400: '#D07456',
          500: '#B8593D',
          600: '#994932',
          700: '#7A3927',
        },
        indigo_ink: {
          400: '#3F627A',
          500: '#2C4A5C',
          600: '#213947',
          700: '#182A34',
        },
      },
      fontFamily: {
        // Serif editorial para títulos e brand
        serif: ['"Fraunces"', 'Georgia', 'serif'],
        // Sans humanista para corpo
        sans: ['"Inter Tight"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Mono
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'paper': '0 1px 2px rgba(94, 79, 45, 0.06), 0 8px 24px rgba(94, 79, 45, 0.08)',
        'paper-lg': '0 2px 4px rgba(94, 79, 45, 0.08), 0 16px 40px rgba(94, 79, 45, 0.12)',
        'ink': '0 8px 32px rgba(31, 27, 21, 0.18)',
      },
    },
  },
  plugins: [],
}
