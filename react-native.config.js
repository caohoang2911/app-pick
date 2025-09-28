// Disable native autolinking for react-native-worklets; we only need its Babel plugin.
module.exports = {
  dependencies: {
    'react-native-worklets': {
      platforms: {
        ios: null,
        android: null,
      },
    },
  },
};


