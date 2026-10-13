module.exports = {
  content: ["_site/**/*.html", "_site/**/*.js"],
  css: ["_site/assets/css/*.css"],
  output: "_site/assets/css/",
  skippedContentGlobs: ["_site/assets/**/*.html"],
  safelist: {
    standard: ["is-projected", "is-labelled", "is-selected", "is-related", "is-dim", "is-active", "is-dragging", "label-left"],
  },
};
