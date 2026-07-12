// Single source of truth for the brand color palette (light lavender -> vibrant
// purple -> deep purple-black). Consumed by tailwind.config.js to drive the
// color tokens every component uses via classes. RN/NativeWind has no SCSS;
// this JS module is the equivalent shared palette.
const palette = {
  color1: "#e4d5ff", // lightest — text / on-accent
  color2: "#c8a3ff", // light accent / secondary text
  color3: "#b06cff", // accent (secondary)
  color4: "#9d00ff", // vibrant accent (primary)
  color5: "#6c00b2", // deep accent / high surface
  color6: "#3f006c", // card surface
  color7: "#1e0037", // base background
};

module.exports = { palette, ...palette };
