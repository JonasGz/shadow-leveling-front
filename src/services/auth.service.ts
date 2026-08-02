import { api, TOKEN_KEY } from "./api";
import * as SecureStore from "expo-secure-store";
import { unregisterPush } from "../lib/push";
import { buildImageForm } from "./groups.service";
import type { AuthToken, User, Session, UserLevel } from "../types/api.types";

export type SocialProvider = "google" | "apple";

export const authService = {
  async requestEmailCode(email: string): Promise<void> {
    await api.post("/auth/email/request", { email });
  },

  async verifyEmailCode(email: string, code: string): Promise<AuthToken> {
    const { data } = await api.post<AuthToken>("/auth/email/verify", {
      email,
      code,
    });
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    return data;
  },

  async socialLogin(
    provider: SocialProvider,
    idToken: string,
  ): Promise<AuthToken> {
    const { data } = await api.post<AuthToken>("/auth/social", {
      provider,
      id_token: idToken,
    });
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    return data;
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },

  async level(): Promise<UserLevel> {
    const { data } = await api.get<UserLevel>("/me/level");
    return data;
  },

  async updateNickname(nickname: string): Promise<User> {
    const { data } = await api.patch<User>("/auth/me", { nickname });
    return data;
  },

  async updateWeeklyGoal(weeklyGoalDays: number): Promise<User> {
    const { data } = await api.patch<User>("/auth/me/weekly-goal", {
      weekly_goal_days: weeklyGoalDays,
    });
    return data;
  },

  async updateAvatar(uri: string): Promise<User> {
    const { data } = await api.patch<User>(
      "/auth/me/avatar",
      buildImageForm(uri),
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return data;
  },

  async logout() {
    await unregisterPush();
    await api.post("/auth/logout");
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  async sessions(): Promise<Session[]> {
    const { data } = await api.get<Session[]>("/auth/sessions");
    return data;
  },

  async revokeSession(id: string) {
    await api.delete(`/auth/sessions/${id}`);
  },

  async getStoredToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
};
