const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// expo-sqlite web: support .wasm files
config.resolver.assetExts.push('wasm');

// SharedArrayBuffer (required by expo-sqlite on web).
// Disabled: COEP/COOP can cause "Unknown" fetchThenEval errors. Re-enable for SQLite web.
// config.server.enhanceMiddleware = (middleware) => {
//   return (req, res, next) => {
//     res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
//     res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
//     return middleware(req, res, next);
//   };
// };

module.exports = withNativeWind(config, { input: './global.css' });
