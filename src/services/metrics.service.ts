import { api } from "./api";
import type { TodayMetrics, WeeklySummary } from "../types/api.types";

export const metricsService = {
  async today(): Promise<TodayMetrics> {
    const { data } = await api.get<TodayMetrics>("/user-metrics/today");
    return data;
  },
  async weekly(): Promise<WeeklySummary> {
    const { data } = await api.get<WeeklySummary>("/user-metrics/weekly");
    return data;
  },
};