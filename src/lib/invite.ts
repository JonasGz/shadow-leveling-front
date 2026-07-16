import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";

// Invite deep-links look like `shadowleveling://join/<CODE>` (and the dev/exp
// equivalents produced by Linking.createURL). Everything here is about carrying
// that <CODE> from a tapped link to a `groupsService.join` call.

const PENDING_INVITE_KEY = "pending_invite_code";

/**
 * Extracts the group invite code from a `.../join/<CODE>` URL, if any. Matches
 * on the raw URL to cover both custom-scheme links (`shadowleveling://join/ABC`,
 * where `join` parses as the host) and dev links (`exp://…/--/join/ABC`).
 */
export function parseInviteCode(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/[/:]join\/([^/?#]+)/i);
  return match ? decodeURIComponent(match[1]) : null;
}

/** A shareable invite link for a group code. */
export function inviteUrl(code: string): string {
  return Linking.createURL(`/join/${code}`);
}

/** Persists a code tapped while signed out, to resume after login. */
export async function setPendingInvite(code: string): Promise<void> {
  await SecureStore.setItemAsync(PENDING_INVITE_KEY, code);
}

/** Reads and clears the pending invite code (one-shot). */
export async function takePendingInvite(): Promise<string | null> {
  const code = await SecureStore.getItemAsync(PENDING_INVITE_KEY);
  if (code) await SecureStore.deleteItemAsync(PENDING_INVITE_KEY);
  return code;
}
