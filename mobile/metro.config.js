const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure that the app directory is properly resolved for expo-router
process.env.EXPO_ROUTER_APP_ROOT = './app';

module.exports = config;