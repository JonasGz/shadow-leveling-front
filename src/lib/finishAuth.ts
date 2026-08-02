import { router } from "expo-router";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../stores/auth.store";
import { registerForPush } from "./push";
import { takePendingInvite } from "./invite";

export async function finishAuth(): Promise<void> {
  const user = await authService.me();
  useAuthStore.getState().setUser(user);
  const pendingInvite = await takePendingInvite();
  router.replace(pendingInvite ? `/join/${pendingInvite}` : "/(tabs)/");
  registerForPush();
}
