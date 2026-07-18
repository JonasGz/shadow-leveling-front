import { api } from "./api";
import type {
  Exercise,
  ExerciseType,
  PaginatedExercises,
  SubstitutesResponse,
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

export interface ListSubstitutesParams {
  limit?: number;
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

  /**
   * Substitute suggestions for the "máquina ocupada" flow. Returns up to `limit`
   * (default 3) strength-catalog exercises ranked by muscle overlap, force and
   * mechanic, penalizing the same equipment so a duplicate-machine substitute
   * sinks to the bottom. The caller combines this with the manual search
   * (`list`) so the user can always pick something else.
   */
  async substitutes(
    id: string,
    params: ListSubstitutesParams = {},
  ): Promise<SubstitutesResponse> {
    const { data } = await api.get<SubstitutesResponse>(
      `/exercises/${id}/substitutes`,
      { params },
    );
    return data;
  },
};
