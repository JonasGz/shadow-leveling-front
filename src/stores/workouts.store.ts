import { create } from "zustand";
import type { Workout } from "../types/api.types";
import { workoutsService } from "../services/workouts.service";

interface WorkoutsState {
  workouts: Workout[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useWorkoutsStore = create<WorkoutsState>((set) => ({
  workouts: [],
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const workouts = await workoutsService.list();
      set({ workouts, loading: false });
    } catch {
      set({ loading: false, error: "Não foi possível carregar os treinos." });
    }
  },

  refresh: async () => {
    try {
      const workouts = await workoutsService.list();
      set({ workouts, error: null });
    } catch {
      set({ error: "Não foi possível carregar os treinos." });
    }
  },
}));