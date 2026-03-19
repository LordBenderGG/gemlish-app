const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Config plugin to remove BOOT_COMPLETED and related boot actions from
 * expo-notifications NotificationsService receiver.
 *
 * Required for Android 15 (API 35) compatibility: BOOT_COMPLETED broadcast
 * receivers cannot start microphone or media playback foreground services.
 * Google Play's static analyzer flags this even if code paths never connect.
 *
 * Uses tools:node="replace" to override the library's receiver definition
 * at manifest merge time.
 *
 * @see https://github.com/expo/expo/issues/41627
 * @see https://developer.android.com/about/versions/15/changes/foreground-service-types
 */
const withDisableNotificationsBootActions = (config) => {
  return withAndroidManifest(config, (modConfig) => {
    const mainApplication = modConfig.modResults.manifest.application?.[0];

    if (!mainApplication) {
      return modConfig;
    }

    // Ensure tools namespace is declared in the manifest root
    if (!modConfig.modResults.manifest.$["xmlns:tools"]) {
      modConfig.modResults.manifest.$["xmlns:tools"] =
        "http://schemas.android.com/tools";
    }

    // Initialize receivers array if not exists
    if (!mainApplication.receiver) {
      mainApplication.receiver = [];
    }

    // Remove any existing NotificationsService receiver (from prebuild)
    mainApplication.receiver = mainApplication.receiver.filter(
      (r) =>
        r.$["android:name"] !==
        "expo.modules.notifications.service.NotificationsService"
    );

    // Add replacement receiver WITHOUT BOOT_COMPLETED actions
    // tools:node="replace" overrides the library's version at manifest merge time
    mainApplication.receiver.push({
      $: {
        "android:name":
          "expo.modules.notifications.service.NotificationsService",
        "android:enabled": "true",
        "android:exported": "false",
        "tools:node": "replace",
      },
      "intent-filter": [
        {
          $: {
            "android:priority": "-1",
          },
          action: [
            {
              $: {
                "android:name":
                  "expo.modules.notifications.NOTIFICATION_EVENT",
              },
            },
            {
              $: {
                "android:name": "android.intent.action.MY_PACKAGE_REPLACED",
              },
            },
          ],
        },
      ],
    });

    return modConfig;
  });
};

module.exports = withDisableNotificationsBootActions;
