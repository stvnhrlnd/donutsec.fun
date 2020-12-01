const fs = require('fs');
const path = require('path');
const rollup = require('rollup');
const terser = require('rollup-plugin-terser').terser;

const env = require('./env');

/**
 * Generate a JavaScript bundle for each file in the JS includes directory.
 * Returns bundled code in an object keyed by filename (without extension).
 */
module.exports = async () => {
  const jsDir = path.join(__dirname, '../../_includes/js/');
  const jsFilePaths = fs
    .readdirSync(jsDir, { withFileTypes: true })
    .filter((x) => x.isFile() && x.name.endsWith('.js'))
    .map((x) => path.join(jsDir, x.name));

  let plugins = [];

  // Only minify in production to keep development builds fast
  if (env.production) {
    plugins.push(terser());
  }

  const bundle = await rollup.rollup({
    input: jsFilePaths,
    plugins: plugins,
  });
  const { output } = await bundle.generate({ format: 'es' });

  const bundles = {};
  output.forEach((x) => (bundles[path.parse(x.fileName).name] = x.code));
  return bundles;
};
