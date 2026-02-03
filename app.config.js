// Dynamic Expo config - extends app.json with environment variables
// See: https://docs.expo.dev/workflow/configuration/

const baseConfig = require('./app.json');

module.exports = ({ config }) => {
  return {
    ...baseConfig.expo,
    ...config,
    android: {
      ...baseConfig.expo.android,
      ...config.android,
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
        },
      },
    },
  };
};
