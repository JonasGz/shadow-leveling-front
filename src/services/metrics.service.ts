import { api } from "./api";
import type { TodayMetrics } from "../types/api.types";

export const metricsService = {
  async today(): Promise<TodayMetrics> {
    const { data } = await api.get<TodayMetrics>("/user-metrics/today");
    return data;
  },
};