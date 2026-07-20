import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Content globs must be absolute: the dev server may run with a cwd
// outside this folder, and Tailwind resolves relative globs from cwd.
const __dirname = dirname(fileURLToPath(import.meta.url))
const fromHere = (rel) => join(__dirname, rel).replace(/\\/g, '/')

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    fromHere('index.html'),
    fromHere('src/**/*.{js,ts,jsx,tsx}'),
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      }
    },
  },
  plugins: [],
}
