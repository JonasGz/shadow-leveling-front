import { create } from "zustand";
import type { Workout } from "../types/api.types";
import { workoutsService } from "../services/workouts.service";

interface WorkoutsState {
  workouts: Workout[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  refresh: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useWorkoutsStore = create<WorkoutsState>((set, get) => ({
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

  remove: async (id) => {
    // Remoção otimista: tira da lista já e reverte se a API falhar.
    const previous = get().workouts;
    set({ workouts: previous.filter((w) => w.id !== id) });
    try {
      await workoutsService.remove(id);
    } catch (error) {
      set({ workouts: previous });
      throw error;
    }
  },
}));
