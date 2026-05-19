import { api, TOKEN_KEY } from "./api";
import * as SecureStore from "expo-secure-store";
import type {
  AuthToken,
  User,
  Session,
  UserLevel,
} from "../types/api.types";

export const authService = {
  async register(email: string, password: string) {
    await api.post("/auth/register", { email, password });
  },

  async registerVerify(email: string, code: string): Promise<AuthToken> {
    const { data } = await api.post<AuthToken>("/auth/register/verify", { email, code });
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    return data;
  },

  async registerResend(email: string) {
    await api.post("/auth/register/resend", { email });
  },

  async login(email: string, password: string) {
    await api.post("/auth/login", { email, password });
  },

  async loginVerify(email: string, code: string): Promise<AuthToken> {
    const { data } = await api.post<AuthToken>("/auth/login/verify", { email, code });
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    return data;
  },

  async loginResend(email: string) {
    await api.post("/auth/login/resend", { email });
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },

  async level(): Promise<UserLevel> {
    const { data } = await api.get<UserLevel>("/me/level");
    return data;
  },

  async logout() {
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
