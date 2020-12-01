const path = require('path');
const { promisify } = require('util');
const sizeOf = promisify(require('image-size'));
const { JSDOM } = require('jsdom');

const env = require('../site/_data/build/env');

/**
 * Set width and height attributes on an image element.
 * @param {*} image
 * @param {*} outputPath
 */
const setDimensions = async (image, outputPath) => {
  let src = image.getAttribute('src');

  if (/^(https?:\/\/|\/\/)/i.test(src)) {
    return;
  }

  if (/^\.+\//.test(src)) {
    src =
      '/' +
      path.relative('./_site/', path.resolve(path.dirname(outputPath), src));
  }

  let dimensions;
  try {
    dimensions = await sizeOf('_site/' + src);
  } catch (e) {
    console.warn(e.message, src);
    return;
  }

  if (dimensions.type === 'svg') {
    return;
  }

  image.setAttribute('width', dimensions.width);
  image.setAttribute('height', dimensions.height);
};

/**
 * Wrap an image element in a figure.
 * @param {*} image
 * @param {*} document
 */
const replaceWithFigure = (image, document) => {
  // Use the image title attribute as the caption
  let figCaption;
  if (image.getAttribute('title')) {
    figCaption = document.createElement('figcaption');
    figCaption.innerHTML = image.getAttribute('title');
    image.removeAttribute('title');
  }

  const figure = document.createElement('figure');
  figure.appendChild(image.cloneNode(true));

  if (figCaption) {
    figure.appendChild(figCaption);
  }

  // Replace the parent because images get wrapped in a paragraph tag which
  // can't have a figure as a child.
  image.parentNode.replaceWith(figure);
};

/**
 * Optimise images in posts.
 * @param {*} content
 * @param {*} outputPath
 */
module.exports = async (content, outputPath) => {
  if (outputPath.endsWith('.html')) {
    const dom = new JSDOM(content);
    const document = dom.window.document;
    const images = [...document.querySelectorAll('.c-post img')];

    if (images.length > 0) {
      await Promise.all(
        images.map(async (image) => {
          // Decode asynchronously to reduce delay in presenting other content
          if (!image.getAttribute('decoding')) {
            image.setAttribute('decoding', 'async');
          }

          // Defer loading until image comes into view
          if (!image.getAttribute('loading')) {
            image.setAttribute('loading', 'lazy');
          }

          // Set width and height to optimise Cumulative Layout Shift (CLS).
          // Only do this in production to keep development builds fast.
          if (env.production && !image.getAttribute('width')) {
            await setDimensions(image, outputPath);
          }

          // Wrap in figure element as this is not supported in Markdown
          replaceWithFigure(image, document);
        })
      );

      content = dom.serialize();
    }
  }

  return content;
};
