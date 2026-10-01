// Development-only overlay. Production acceptance remains pinned separately.
const base = require('./rspack.production-base.cjs');
module.exports = {
  ...base,
  // Dynamic route chunks must exist before the browser requests them. Serve
  // mode lazy proxies can race their first hot-update request against SPA
  // fallback, which returns HTML for the pending JavaScript asset.
  lazyCompilation: false,
  devServer: { ...base.devServer, historyApiFallback: true },
};
