const plugin = require('tailwindcss/plugin')

module.exports = plugin(function({ addUtilities, theme }) {
  const newUtilities = {
    '.animate-accordion-down': {
      'from': { height: '0' },
      'to': { height: 'var(--radix-accordion-content-height)' },
    },
    '.animate-accordion-up': {
      'from': { height: 'var(--radix-accordion-content-height)' },
      'to': { height: '0' },
    },
  }

  addUtilities(newUtilities, ['responsive', 'hover'])
})
