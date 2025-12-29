const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

// Use Expo's default Metro config as base to avoid missing-assets issues
const config = getDefaultConfig(projectRoot);

// Example safe override (uncomment if you need to add cjs extensions):
// config.resolver.sourceExts.push('cjs');

module.exports = config;
