/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Transforms Tailwind CSS directives into standard CSS.
    tailwindcss: {},
    // Adds vendor prefixes to CSS for browser compatibility.
    autoprefixer: {},
  },
};

export default config;