const minify = require('html-minifier').minify;

const env = require('../site/_data/build/env');

/**
 * Aggressively minify HTML output in production builds.
 * @param {*} content
 * @param {*} outputPath
 */
module.exports = (content, outputPath) => {
  if (env.production && outputPath.endsWith('.html')) {
    return minify(content, {
      collapseBooleanAttributes: true,
      collapseWhitespace: true,
      decodeEntities: true,
      removeAttributeQuotes: true,
      removeComments: true,
      removeOptionalTags: true,
      sortAttributes: true,
      sortClassName: true,
    });
  }

  return content;
};
