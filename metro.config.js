const { getDefaultConfig } = require('@react-native/metro-config');
const path = require('path');

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);

  return {
    ...defaultConfig,
    resolver: {
      extraNodeModules: {
        '@env': path.resolve(__dirname, '.env'),
      },
    },
  };
})();
