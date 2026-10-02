module.exports = {
  babelrc: false,
  configFile: false,
  sourceMaps: true,
  presets: [
    ['@babel/preset-react', { runtime: 'automatic' }],
    ['@babel/preset-typescript', { allExtensions: true, isTSX: true }],
  ],
};
