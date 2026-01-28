/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk dark background system
        'glass-black': {
          DEFAULT: '#000000',
          light: '#0a0a0a',
          lighter: '#151515'
        },
        // Neon cyan primary accent
        'accent-cyan': {
          DEFAULT: '#00D9FF',
          light: '#33E3FF',
          dark: '#00B8D9',
          glow: 'rgba(0, 217, 255, 0.5)'
        },
        // Neon purple accent
        'accent-purple': {
          DEFAULT: '#B026FF',
          light: '#C552FF',
          dark: '#9000E6',
          glow: 'rgba(176, 38, 255, 0.5)'
        },
        // Neon orange accent
        'accent-orange': {
          DEFAULT: '#FF6B00',
          light: '#FF8C33',
          dark: '#E65C00',
          glow: 'rgba(255, 107, 0, 0.5)'
        },
        // Legacy blue for backwards compatibility
        'accent-blue': {
          DEFAULT: '#00D9FF',
          light: '#33E3FF',
          dark: '#00B8D9'
        },
        // Status colors with cyberpunk flair
        'status-success': '#00FF9F',
        'status-warning': '#FFB800',
        'status-error': '#FF3366',
        'status-info': '#00D9FF',
        // Text colors
        'text-primary': '#ffffff',
        'text-secondary': 'rgba(255, 255, 255, 0.7)',
        'text-tertiary': 'rgba(255, 255, 255, 0.5)'
      },
      fontFamily: {
        'sf-pro': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'system-ui', 'sans-serif'],
        'sf-mono': ['SF Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace']
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '20px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '40px',
        '4xl': '48px'
      },
      spacing: {
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
        '48': '48px',
        '64': '64px',
        '96': '96px'
      },
      borderRadius: {
        'glass': '20px',
        'glass-sm': '12px',
        'glass-lg': '28px'
      },
      backdropBlur: {
        'glass': '40px'
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.6)',
        'glass-lg': '0 12px 48px rgba(0, 0, 0, 0.8)',
        'glow-cyan': '0 0 30px rgba(0, 217, 255, 0.4), 0 0 60px rgba(0, 217, 255, 0.2)',
        'glow-purple': '0 0 30px rgba(176, 38, 255, 0.4), 0 0 60px rgba(176, 38, 255, 0.2)',
        'glow-orange': '0 0 30px rgba(255, 107, 0, 0.4), 0 0 60px rgba(255, 107, 0, 0.2)',
        'glow': '0 0 30px rgba(0, 217, 255, 0.4)'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
        'shimmer': 'shimmer 1.5s infinite linear',
        'pulse-glow': 'pulseGlow 2s infinite',
        'spin-slow': 'spin 2s linear infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 217, 255, 0.4)' },
          '50%': { boxShadow: '0 0 50px rgba(0, 217, 255, 0.7), 0 0 80px rgba(0, 217, 255, 0.3)' }
        }
      },
      transitionTimingFunction: {
        'ease-in-out-smooth': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'ease-out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.glass-card': {
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid rgba(0, 217, 255, 0.15)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        },
        '.glass-button': {
          background: 'rgba(0, 217, 255, 0.1)',
          backdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid rgba(0, 217, 255, 0.3)',
          transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)'
        },
        '.glass-button:hover': {
          background: 'rgba(0, 217, 255, 0.15)',
          border: '1px solid rgba(0, 217, 255, 0.5)',
          transform: 'translateY(-2px)',
          boxShadow: '0 0 20px rgba(0, 217, 255, 0.4), 0 8px 24px rgba(0, 0, 0, 0.3)'
        },
        '.glass-button:active': {
          transform: 'translateY(0)',
          boxShadow: '0 0 15px rgba(0, 217, 255, 0.3)'
        },
        '.glass-input': {
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(40px) saturate(200%)',
          border: '1.5px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          transition: 'all 0.3s ease'
        },
        '.glass-input:focus': {
          background: 'rgba(0, 217, 255, 0.05)',
          border: '1.5px solid #00D9FF',
          boxShadow: '0 0 25px rgba(0, 217, 255, 0.4), 0 0 50px rgba(0, 217, 255, 0.15)',
          outline: 'none'
        },
        '.skeleton': {
          background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(0,217,255,0.1) 50%, rgba(255,255,255,0.03) 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite linear'
        }
      }
      addUtilities(newUtilities)
    }
  ],
}
