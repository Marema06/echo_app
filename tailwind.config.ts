import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "var(--surface)",
          glass: "var(--surface-glass)",
        },
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        accent: {
          brand: '#c084fc',
          rose: '#f472b6',
          soft: 'rgba(196, 181, 253, 0.15)',
          cool: 'rgba(147, 197, 253, 0.15)',
          green: 'rgba(110, 231, 183, 0.15)',
        },
        emotion: {
          joie: '#FFD700',
          tristesse: '#4169E1',
          colere: '#DC143C',
          peur: '#2F4F4F',
          serenite: '#98FB98',
          surprise: '#FFFF00',
          nostalgie: '#DDA0DD',
          anxiete: '#A9A9A9',
          espoir: '#87CEEB',
          frustration: '#FF8C00',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Times New Roman', 'serif'],
        sans: ['Manrope', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
        'full': '999px',
      },
      boxShadow: {
        soft: '0 4px 24px rgba(15, 23, 42, 0.06)',
        pop: '0 12px 40px rgba(15, 23, 42, 0.12)',
        glow: '0 0 45px rgba(196, 181, 253, 0.6)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'rise': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.2)', opacity: '0.7' },
        },
        'spin': {
          to: { transform: 'rotate(360deg)' },
        },
        'wave': {
          '0%, 100%': { height: '6px' },
          '50%': { height: '16px' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease both',
        'rise': 'rise 0.4s ease both',
        'pulse-ring': 'pulse-ring 1.4s ease-in-out infinite',
        'spin-slow': 'spin 0.9s linear infinite',
        'wave': 'wave 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
