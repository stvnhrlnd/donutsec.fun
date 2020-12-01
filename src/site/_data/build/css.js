const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const env = require('./env');
const themes = require('../themes.json');

/**
 * Generate CSS custom properties for the given theme.
 * @param {*} theme
 */
const getThemeProperties = (theme) => {
  return `
    --background-colour: ${theme.backgroundColour};
    --background-colour-offset: ${theme.backgroundColourOffset};
    --background-pattern-image: ${theme.backgroundPatternImage};
    --border-colour: ${theme.borderColour};
    --border-style: ${theme.borderStyle};
    --border-width: ${theme.borderWidth};
    --text-colour: ${theme.textColour};
    --text-colour-offset: ${theme.textColourOffset};
  `;
};

/**
 * Generate CSS for the defined themes.
 */
const getThemeCss = () => {
  let css = `
    :root {
      ${getThemeProperties(themes.light)}
    }

    @media (prefers-color-scheme: dark) {
      :root:not([data-theme]) {
        ${getThemeProperties(themes.dark)}
      }
    }
  `;

  for (const [key, config] of Object.entries(themes)) {
    css += `
      [data-theme='${key}'] {
        ${getThemeProperties(config)}
      }
    `;
  }

  return css;
};

/**
 * Generate a CSS bundle for each file in the CSS includes directory.
 * Returns bundled code in an object keyed by filename (without extension).
 */
module.exports = async () => {
  const cssDir = path.join(__dirname, '../../_includes/css/');
  const cssFiles = fs
    .readdirSync(cssDir, { withFileTypes: true })
    .filter((x) => x.isFile() && x.name.endsWith('.css'));

  let plugins = [require('postcss-import'), require('autoprefixer')];

  // Only minify in production to keep development builds fast
  if (env.production) {
    plugins.push(require('cssnano'));
  }

  const bundles = {};
  const processor = postcss(plugins);

  await Promise.all(
    cssFiles.map(async (file) => {
      const filePath = path.join(cssDir, file.name);
      const css = fs.readFileSync(filePath);
      await processor
        .process(css, { from: filePath })
        .then((result) => (bundles[path.parse(file.name).name] = result.css));
    })
  );

  // Add theme bundle (generated dynamically rather than from a file)
  await processor
    .process(getThemeCss(), { from: undefined })
    .then((result) => (bundles.theme = result.css));

  return bundles;
};
