/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'json-bg': '#1e1e1e',
        'json-key': '#9cdcfe',
        'json-string': '#ce9178',
        'json-number': '#b5cea8',
        'json-boolean': '#569cd6',
        'json-null': '#808080',
      },
      fontFamily: {
        'mono': ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
