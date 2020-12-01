/**
 * Expose the current build environment in templates and extensions.
 */
module.exports = {
  development: process.env.ELEVENTY_ENV === 'development',
  production: process.env.ELEVENTY_ENV === 'production',
};
