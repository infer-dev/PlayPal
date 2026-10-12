import type { Config } from 'tailwindcss';
const config: Config = { content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'], theme: { extend: { colors: { forest: '#17633D', teal: '#159EAA', leaf: '#6FAF59', cream: '#FAF7EF', ink: '#292D2B' }, fontFamily: { sans: ['var(--font-body)', 'sans-serif'] } } }, plugins: [] };
export default config;
