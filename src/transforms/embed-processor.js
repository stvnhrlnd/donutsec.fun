const { JSDOM } = require('jsdom');

/**
 * Wrap embedded content in container elements.
 * @param {*} content
 * @param {*} outputPath
 */
module.exports = (content, outputPath) => {
  if (outputPath.endsWith('.html')) {
    const dom = new JSDOM(content);
    const embeds = [
      ...dom.window.document.querySelectorAll('embed, iframe, object'),
    ];

    if (embeds.length > 0) {
      embeds.forEach((embed) => {
        const div = dom.window.document.createElement('div');
        div.classList.add('c-embed');
        div.appendChild(embed.cloneNode(true));
        embed.replaceWith(div);
      });

      content = dom.serialize();
    }
  }

  return content;
};
