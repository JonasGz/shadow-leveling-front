import { router } from "expo-router";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../stores/auth.store";
import { registerForPush } from "./push";
import { takePendingInvite } from "./invite";

/**
 * Completes any successful sign-in: loads the user, updates the store, enters
 * the app, and best-effort registers for push. Shared by every auth method
 * (email code, Google, Apple) so the post-login behaviour stays identical.
 */
export async function finishAuth(): Promise<void> {
  const user = await authService.me();
  useAuthStore.getState().setUser(user);
  // Resume an invite deep-link tapped before login, if any.
  const pendingInvite = await takePendingInvite();
  router.replace(pendingInvite ? `/join/${pendingInvite}` : "/(tabs)/");
  registerForPush();
}
