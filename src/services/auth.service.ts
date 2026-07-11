import { api, TOKEN_KEY } from "./api";
import * as SecureStore from "expo-secure-store";
import { unregisterPush } from "../lib/push";
import type {
  AuthToken,
  User,
  Session,
  UserLevel,
} from "../types/api.types";

export const authService = {
  async register(email: string, password: string): Promise<AuthToken> {
    const { data } = await api.post<AuthToken>("/auth/register", { email, password });
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    return data;
  },

  async login(email: string, password: string): Promise<AuthToken> {
    const { data } = await api.post<AuthToken>("/auth/login", { email, password });
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

  async logout() {
    // Remove the push token while the session is still valid.
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
