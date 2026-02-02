const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Add .sql extension for Drizzle migrations
// Per 03-RESEARCH.md Pitfall 1: Metro must be configured for .sql or migrations will crash
config.resolver.sourceExts.push('sql');

module.exports = config;
