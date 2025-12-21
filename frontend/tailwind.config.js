/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Gaming theme colors - pure black base
        primary: {
          purple: '#8B5CF6',
          cyan: '#06B6D4',
          green: '#10B981',
          red: '#EF4444',
          yellow: '#F59E0B',
        },
        bg: {
          primary: '#000000',
          secondary: '#0A0A0A',
          tertiary: '#121212',
          hover: '#1A1A1A',
        },
        status: {
          backlog: '#71717A',
          playing: '#06B6D4',
          finished: '#10B981',
          dropped: '#EF4444',
          completed: '#F59E0B',
        },
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.5)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.5)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.5)',
      },
    },
  },
  plugins: [],
}

