import { api } from "./api";
import type {
  Exercise,
  ExerciseType,
  PaginatedExercises,
} from "../types/api.types";

export interface ListExercisesParams {
  search?: string;
  cursor?: string;
  limit?: number;
}

export interface CreateExerciseInput {
  name: string;
  type: ExerciseType;
  unit: string;
}

export const exercisesService = {
  async list(params: ListExercisesParams = {}): Promise<PaginatedExercises> {
    const { data } = await api.get<PaginatedExercises>("/exercises", { params });
    return data;
  },

  async get(id: string): Promise<Exercise> {
    const { data } = await api.get<Exercise>(`/exercises/${id}`);
    return data;
  },

  async create(input: CreateExerciseInput): Promise<Exercise> {
    const { data } = await api.post<Exercise>("/exercises", input);
    return data;
  },
};
