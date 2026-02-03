module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for Drizzle migrations - bundles .sql files as strings
      ['inline-import', { extensions: ['.sql'] }],
      // Required for reanimated worklets - MUST be last
      'react-native-reanimated/plugin',
    ]
  };
};
