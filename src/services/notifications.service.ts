import { api } from "./api";

export const notificationsService = {
  async registerToken(token: string, platform: string): Promise<void> {
    await api.post("/me/push-token", { token, platform });
  },

  async deleteToken(token: string): Promise<void> {
    await api.delete("/me/push-token", { data: { token } });
  },
};
