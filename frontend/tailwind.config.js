/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{html,js}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          light: 'var(--color-primary-light)',
        },
        secondary: 'var(--color-secondary)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
      },
      backgroundColor: {
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        tertiary: 'var(--bg-tertiary)',
        dark: 'var(--bg-dark)',
        'dark-secondary': 'var(--bg-dark-secondary)',
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        light: 'var(--text-light)',
        'on-primary': 'var(--text-on-primary)',
      },
      fontFamily: {
        sans: ['var(--font-family)', 'sans-serif'],
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      transitionTimingFunction: {
        'in-out': 'ease-in-out',
      },
      transitionDuration: {
        fast: 'var(--transition-fast)',
        base: 'var(--transition-base)',
        slow: 'var(--transition-slow)',
      },
      screens: {
        'mobile': '320px',
        'tablet': '640px',
        'desktop': '1024px',
        'large-desktop': '1920px',
      },
      spacing: {
        'bento-gap-sm': 'var(--bento-gap-sm)',
        'bento-gap-md': 'var(--bento-gap-md)',
        'bento-gap-lg': 'var(--bento-gap-lg)',
        'bento-gap-xl': 'var(--bento-gap-xl)',
        'bento-padding': 'var(--bento-padding)',
        'bento-card-padding': 'var(--bento-card-padding)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s var(--ease-out-cubic)',
        'slide-up': 'slideUp 0.6s var(--ease-out-cubic)',
        'slide-down': 'slideDown 0.6s var(--ease-out-cubic)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

