/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#C9362B',
          alert: '#D9362B',
          deep: '#B92F26',
          pale: '#FFF1F0',
          dark: '#172033',
        },
        page: '#FBF9FA',
        card: '#FFFFFF',
        surface: '#F5F5F9',
        border: {
          DEFAULT: '#E1E5ED',
          light: '#ECEEF5',
          pale: '#FCE7E6',
        },
        navy: {
          900: '#172033',
          800: '#1E293B',
          700: '#334155',
        },
        text: {
          primary: '#172033',
          secondary: '#718096',
          muted: '#8995AA',
        },
        healthy: '#4F9D60',
        warning: '#D97706',
        slateIcon: '#718096',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"Geist Mono"', '"JetBrains Mono"', 'Fira Code', 'monospace']
      },
      boxShadow: {
        soc: '0 1px 3px 0 rgba(23, 32, 51, 0.05), 0 1px 2px -1px rgba(23, 32, 51, 0.03)',
        'soc-md': '0 4px 6px -1px rgba(23, 32, 51, 0.07), 0 2px 4px -2px rgba(23, 32, 51, 0.05)',
        'soc-lg': '0 10px 15px -3px rgba(23, 32, 51, 0.08), 0 4px 6px -4px rgba(23, 32, 51, 0.04)',
      }
    },
  },
  plugins: [],
}
