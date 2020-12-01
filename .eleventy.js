const navigationPlugin = require('@11ty/eleventy-navigation');
const rssPlugin = require('@11ty/eleventy-plugin-rss');
const syntaxHighlightPlugin = require('@11ty/eleventy-plugin-syntaxhighlight');
const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');

const datetimeFilter = require('./src/filters/datetime');
const limitFilter = require('./src/filters/limit');
const embedProcessorTransform = require('./src/transforms/embed-processor');
const imageProcessorTransform = require('./src/transforms/image-processor');
const htmlMinifierTransform = require('./src/transforms/html-minifier');

/**
 * Configure Eleventy.
 * @param {*} eleventyConfig
 */
module.exports = (eleventyConfig) => {
  // Plugins
  eleventyConfig.addPlugin(navigationPlugin);
  eleventyConfig.addPlugin(rssPlugin);
  eleventyConfig.addPlugin(syntaxHighlightPlugin);

  // Filters
  eleventyConfig.addFilter('datetime', datetimeFilter);
  eleventyConfig.addFilter('limit', limitFilter);

  // Transforms
  eleventyConfig.addTransform('embed-processor', embedProcessorTransform);
  eleventyConfig.addTransform('image-processor', imageProcessorTransform);
  eleventyConfig.addTransform('html-minifier', htmlMinifierTransform);

  // Static assets
  eleventyConfig.addPassthroughCopy('src/site/fonts');
  eleventyConfig.addPassthroughCopy('src/site/images');
  eleventyConfig.addPassthroughCopy('src/site/videos');
  eleventyConfig.addPassthroughCopy('src/site/robots.txt');

  // Posts collection
  eleventyConfig.addCollection('posts', (collection) => {
    return collection.getFilteredByGlob('src/site/posts/*.md').reverse();
  });

  // Markdown settings
  eleventyConfig.setLibrary(
    'md',
    markdownIt({
      html: true,
      typographer: true,
      quotes: '“”‘’',
    }).use(markdownItAnchor, {
      permalink: true,
      permalinkClass: 'c-permalink',
      permalinkSymbol: '#',
    })
  );

  return {
    dir: {
      input: 'src/site',
    },
    htmlTemplateEngine: false,
    markdownTemplateEngine: 'njk',
  };
};
