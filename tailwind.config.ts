import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"LINE Seed Sans TH"', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: { DEFAULT: '#0B0F0E', soft: '#0F1413', card: '#131A19' },
        line: '#1F2A28',
        brand: { DEFAULT: '#00D67E', dark: '#00A85F', light: '#34F39E' },
        ink: { DEFAULT: '#E6F0EC', dim: '#8FA39C', mute: '#5B6F69' },
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 32px -16px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};
export default config;
