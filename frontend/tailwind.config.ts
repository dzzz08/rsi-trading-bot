import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0e17',
        panel: '#121826',
        panel2: '#1a2233',
        edge: '#263248',
        muted: '#8a97ad',
        riskon: '#2ecc71',
        riskoff: '#e74c3c',
        mixed: '#e0a93b',
      },
      fontFamily: { mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'] },
    },
  },
  plugins: [],
};
export default config;
