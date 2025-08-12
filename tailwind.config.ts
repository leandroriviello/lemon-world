import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colores oficiales de Lemon
        lemon: {
          greent: '#00F068',
          black: '#000000',
          nebula: '#925DEE',
          starlight: '#E7E7E7',
          solar: '#FF8800',
          moon: '#5B5B5B',
          evergreent: '#00A849',
        },
        // Colores del tema oscuro
        dark: {
          bg: '#000000',
          card: '#1A1A1A',
          input: '#2A2A2A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'in': 'in 0.2s ease-out',
        'slide-in-from-top-2': 'slide-in-from-top-2 0.2s ease-out',
      },
      keyframes: {
        'in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-from-top-2': {
          '0%': { transform: 'translateY(-0.5rem)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
