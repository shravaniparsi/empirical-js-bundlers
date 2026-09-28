module.exports = {
  babelrc: false,
  comments: false,
  sourceMaps: true,
  presets: [
    [require.resolve('@babel/preset-env'), { targets: { chrome: '107' }, modules: false, bugfixes: true }],
    [require.resolve('@babel/preset-react'), { runtime: 'automatic' }],
    [require.resolve('@babel/preset-typescript'), { allExtensions: true, isTSX: true }],
  ],
  plugins: [[require.resolve('babel-plugin-react-compiler'), {}]],
};
