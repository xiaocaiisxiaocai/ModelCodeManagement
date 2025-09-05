import { defineConfig } from 'unocss';
import { presetUno } from 'unocss';
import { presetIcons } from 'unocss';

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.2,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
      collections: {
        carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default),
      },
    }),
  ],
  theme: {
    colors: {
      primary: {
        50: '#e3f2fd',
        100: '#bbdefb',
        200: '#90caf9',
        300: '#64b5f6',
        400: '#42a5f5',
        500: '#2196f3',
        600: '#1e88e5',
        700: '#1976d2',
        800: '#1565c0',
        900: '#0d47a1',
      },
    },
    fontFamily: {
      sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
    },
    extend: {
      boxShadow: {
        'inner-md': 'inset 0 4px 6px -1px rgba(0, 0, 0, 0.1), inset 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }
    }
  },
  shortcuts: {
    'btn': 'py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none',
    'btn-primary': 'bg-blue-500 text-white hover:bg-blue-600',
    'btn-secondary': 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    'btn-danger': 'bg-red-500 text-white hover:bg-red-600',
    'card': 'bg-white rounded-lg shadow-sm p-4',
    'input': 'border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  },
}); 