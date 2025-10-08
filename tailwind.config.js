/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: '#17153B',
        surface: '#2E236C',
        input: '#433D8B',
        button: '#C8ACD6',
        text: '#ffffff',
        muted: '#bfc3d9'
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px'
      }
    },
  },
  plugins: [],
}

