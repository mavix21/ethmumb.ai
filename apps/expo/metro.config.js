// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");

const { withNativewind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */

const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config);
