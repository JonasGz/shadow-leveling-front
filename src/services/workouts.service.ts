import { api } from "./api";
import type { DayOfWeek, Workout, WorkoutExercise } from "../types/api.types";

export interface AddExerciseInput {
  exercise_id: string;
  sets: number;
  reps_min?: number | null;
  reps_max?: number | null;
  duration?: number | null;
  note?: string;
  sort_order: number;
}

export interface CreateWorkoutInput {
  name: string;
  description?: string;
  days_of_week: DayOfWeek[];
}

export interface UpdateWorkoutInput {
  name?: string;
  description?: string;
  days_of_week?: DayOfWeek[];
  active?: boolean;
}

export const workoutsService = {
  async list(): Promise<Workout[]> {
    const { data } = await api.get<Workout[]>("/workouts");
    return data;
  },

  async get(id: string): Promise<Workout> {
    const { data } = await api.get<Workout>(`/workouts/${id}`);
    return data;
  },

  async create(input: CreateWorkoutInput): Promise<Workout> {
    const { data } = await api.post<Workout>("/workouts", input);
    return data;
  },

  async update(id: string, input: UpdateWorkoutInput): Promise<Workout> {
    const { data } = await api.put<Workout>(`/workouts/${id}`, input);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/workouts/${id}`);
  },

  async addExercise(
    workoutId: string,
    input: AddExerciseInput,
  ): Promise<WorkoutExercise> {
    const { data } = await api.post<WorkoutExercise>(
      `/workouts/${workoutId}/exercises`,
      input,
    );
    return data;
  },

  async removeExercise(workoutId: string, weId: string): Promise<void> {
    await api.delete(`/workouts/${workoutId}/exercises/${weId}`);
  },
};
