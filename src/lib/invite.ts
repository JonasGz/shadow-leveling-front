import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";

const PENDING_INVITE_KEY = "pending_invite_code";

export function parseInviteCode(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/[/:]join\/([^/?#]+)/i);
  return match ? decodeURIComponent(match[1]) : null;
}

export function inviteUrl(code: string): string {
  return Linking.createURL(`/join/${code}`);
}

export async function setPendingInvite(code: string): Promise<void> {
  await SecureStore.setItemAsync(PENDING_INVITE_KEY, code);
}

export async function takePendingInvite(): Promise<string | null> {
  const code = await SecureStore.getItemAsync(PENDING_INVITE_KEY);
  if (code) await SecureStore.deleteItemAsync(PENDING_INVITE_KEY);
  return code;
}
