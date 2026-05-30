// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";
import fs from "node:fs";
import path from "node:path";

function loadAppVersion() {
  const versionFile = path.resolve(process.cwd(), "version.properties");
  const raw = fs.readFileSync(versionFile, "utf8");
  const lines = raw.split(/\r?\n/);
  let versionName = "1.0.0";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key === "VERSION_NAME" && value) {
      versionName = value;
    }
  }

  return { versionName };
}

const { versionName } = loadAppVersion();

const bundleId = "com.gemlish";
const schemeFromBundleId = "gemlish";

const env = {
  // App branding - update these values directly (do not use env vars)
  appName: "Gemlish: Aprende Inglés Jugando",
  appSlug: "gemlish",
  // S3 URL of the app logo - set this to the URL returned by generate_image when creating custom logo
  // Leave empty to use the default icon from assets/images/icon.png
  logoUrl: "",
  scheme: schemeFromBundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: versionName,
  // Play Store: versionCode debe incrementarse en cada release
  // Se gestiona automáticamente por EAS Build con autoIncrement: true en eas.json
  // NOTA Android 16: orientation portrait se ignora en tablets/plegables.
  // La app usa SafeAreaView + ScreenContainer para manejar todos los tamaños.
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "light",
  newArchEnabled: true,
  android: {
    adaptiveIcon: {
      backgroundColor: "#1A1A2E",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    userInterfaceStyle: "light",
    // edgeToEdgeEnabled: true, // Deprecado en Android 15 - edge-to-edge es obligatorio en SDK 54 + Android 16
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    permissions: ["POST_NOTIFICATIONS"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  backgroundColor: "#F8FAFF",
  plugins: [
    "expo-router",
    // Fix Android 15: elimina BOOT_COMPLETED de expo-notifications para evitar
    // advertencia de servicios en primer plano restringidos en Play Console
    "./plugins/withDisableNotificationsBootActions",
    "expo-sqlite",
    "expo-system-ui",
    [
      "react-native-google-mobile-ads",
       {
         // App ID real de AdMob para Android — usa EXPO_PUBLIC_ADMOB_APP_ID_ANDROID de .env.local
         androidAppId: process.env.EXPO_PUBLIC_ADMOB_APP_ID_ANDROID || 'ca-app-pub-6926294559691397~7792810820',
       },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 320,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#ffffff",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          minSdkVersion: 24,
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          // x86_64 es sólo para emuladores — excluido del build de producción para reducir tamaño del AAB
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
