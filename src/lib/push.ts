import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { router } from "expo-router";
import { notificationsService } from "../services/notifications.service";

const PUSH_TOKEN_KEY = "push_token";

// Foreground behavior: show the notification as a banner even with the app open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any).easConfig?.projectId
  );
}

// registerForPush requests permission, gets the Expo push token, and registers
// it with the backend. Best-effort: returns null (never throws) if unavailable
// (simulator, denied permission, Expo Go, missing projectId).
export async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId = getProjectId();
  if (!projectId) return null;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
    await notificationsService.registerToken(token, Platform.OS);
    return token;
  } catch {
    return null;
  }
}

// unregisterPush removes the stored token from the backend and device (on logout).
export async function unregisterPush(): Promise<void> {
  try {
    const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    if (token) {
      await notificationsService.deleteToken(token);
    }
  } catch {
    // best-effort
  } finally {
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  }
}

// addNotificationResponseListener opens the Groups tab when a push is tapped.
export function addNotificationResponseListener() {
  return Notifications.addNotificationResponseReceivedListener(() => {
    router.push("/(tabs)/groups");
  });
}
