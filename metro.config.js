const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Exclude native-only modules from web bundle
config.resolver = config.resolver || {};

// Permitir archivos .wasm para expo-sqlite en web
config.resolver.assetExts = [
  ...(config.resolver.assetExts || []).filter(ext => ext !== 'wasm'),
  'wasm',
];

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-google-mobile-ads') {
    return { type: 'empty' };
  }
  // expo-sqlite usa WebAssembly que no es soportado por Metro en web preview
  // En Android/iOS funciona nativamente sin este workaround
  if (platform === 'web' && moduleName && moduleName.includes('wa-sqlite')) {
    return { type: 'empty' };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
