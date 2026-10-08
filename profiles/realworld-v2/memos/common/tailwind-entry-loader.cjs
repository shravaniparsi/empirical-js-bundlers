const postcss = require('postcss');
const config = require('./postcss.config.cjs');

module.exports = function tailwindEntryLoader(source) {
  const done = this.async();
  postcss(config.plugins)
    .process(source, { from: this.resourcePath, map: false })
    .then((result) => done(null, result.css))
    .catch(done);
};
