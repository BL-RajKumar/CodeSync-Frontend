/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: 'var(--bg-dark)',
        card: 'var(--bg-card)',
        input: 'var(--bg-input)',
        border: 'var(--color-border)',
        'border-focus': 'var(--color-border-focus)',
        main: 'var(--text-main)',
        muted: 'var(--text-muted)',
        primary: 'rgba(var(--color-primary-rgb), <alpha-value>)',
        'primary-hover': 'rgba(var(--color-primary-hover-rgb), <alpha-value>)',
        danger: 'rgba(var(--color-danger-rgb), <alpha-value>)',
        success: 'rgba(var(--color-success-rgb), <alpha-value>)',
      },
    },
  },
  plugins: [],
}
