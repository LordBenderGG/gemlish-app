// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

const bundleId = "com.gemlish";
const schemeFromBundleId = "gemlish";

const env = {
  // App branding - update these values directly (do not use env vars)
  appName: "Gemlish: Aprende Inglés Jugando",
  appSlug: "gemlish",
  // S3 URL of the app logo - set this to the URL returned by generate_image when creating custom logo
  // Leave empty to use the default icon from assets/images/icon.png
  logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032356208/HiZUwaORcoYwhUWL.png",
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.55",
  // Play Store: versionCode debe incrementarse en cada release
  // Se gestiona automáticamente por EAS Build con autoIncrement: true en eas.json
  // NOTA Android 16: orientation portrait se ignora en tablets/plegables.
  // La app usa SafeAreaView + ScreenContainer para manejar todos los tamaños.
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "light",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
  },
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
    permissions: ["POST_NOTIFICATIONS", "SCHEDULE_EXACT_ALARM", "USE_EXACT_ALARM"],
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
        // IDs de PRUEBA de Google. Reemplazar con IDs reales de AdMob antes de publicar.
        androidAppId: "ca-app-pub-9019813013540172~8482362619",
        iosAppId: "ca-app-pub-3940256099942544~1458002511",
        // Cumplimiento GDPR/CCPA: solicitar consentimiento antes de mostrar anuncios personalizados
        userTrackingUsageDescription: "This identifier will be used to deliver personalized ads to you.",
        skAdNetworkItems: [
          { skAdNetworkIdentifier: "cstr6suwn9.skadnetwork" },
          { skAdNetworkIdentifier: "4fzdc2evr5.skadnetwork" },
        ],
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
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
          buildArchs: ["arm64-v8a", "x86_64"],
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
