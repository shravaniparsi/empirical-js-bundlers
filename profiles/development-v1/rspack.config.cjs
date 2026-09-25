// Development-only overlay. Production acceptance remains pinned separately.
const base = require('./rspack.production-base.cjs');
module.exports = { ...base, devServer: { ...base.devServer, historyApiFallback: true } };
