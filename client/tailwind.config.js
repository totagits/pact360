/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7fc',
          100: '#e1eff9',
          200: '#bcdcf3',
          300: '#82bee9',
          400: '#429cda',
          500: '#0076c0', // Plan International Primary Blue
          600: '#005f9e',
          700: '#004c80',
          800: '#03416b',
          900: '#073659',
          950: '#05233c',
        },
        success: {
          DEFAULT: '#00875a',
          hover: '#006644',
          light: '#e3fcef'
        },
        warning: {
          DEFAULT: '#ffab00',
          hover: '#e69a00',
          light: '#fffae6'
        },
        danger: {
          DEFAULT: '#de350b',
          hover: '#bf2600',
          light: '#ffebe6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out-forward',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
