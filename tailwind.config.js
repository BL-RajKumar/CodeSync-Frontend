/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#0f1115',
        card: 'rgba(26, 29, 36, 0.6)',
        input: 'rgba(15, 17, 21, 0.8)',
        border: 'rgba(255, 255, 255, 0.08)',
        'border-focus': '#4F46E5',
        main: '#f8f9fa',
        muted: '#9ca3af',
        primary: '#6366f1',
        'primary-hover': '#4f46e5',
        danger: '#ef4444',
        success: '#10b981',
      },
    },
  },
  plugins: [],
}
