import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080b12',
        surface: '#0e1220',
        card: '#121828',
        border: '#1e2740',
        accent: '#00d4ff',
        accent2: '#ff6b35',
        accent3: '#7fff6b',
        accent4: '#c084fc',
      },
      fontFamily: {
        sans: ['var(--font-epilogue)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
