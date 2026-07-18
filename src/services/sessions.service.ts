import { api } from "./api";
import { buildImageForm } from "./groups.service";
import type {
  SessionStatus,
  WorkoutSession,
  WorkoutSessionDetail,
  ExerciseSet,
  MissedWorkout,
} from "../types/api.types";

export interface ListSessionsParams {
  workout_id?: string;
  from?: string;
  to?: string;
}

export interface CreateSessionInput {
  workout_id: string;
  date: string;
  status: SessionStatus;
}

export interface AddSetInput {
  exercise_id: string;
  set_number: number;
  reps?: number | null;
  weight?: number | null;
  duration?: number | null;
}

export interface UpdateSetInput {
  reps?: number | null;
  weight?: number | null;
  duration?: number | null;
}

export const sessionsService = {
  async create(input: CreateSessionInput): Promise<WorkoutSession> {
    const { data } = await api.post<WorkoutSession>("/workout-sessions", input);
    return data;
  },

  async attachPhoto(id: string, uri: string): Promise<WorkoutSession> {
    const { data } = await api.post<WorkoutSession>(
      `/workout-sessions/${id}/photo`,
      buildImageForm(uri),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  async list(params: ListSessionsParams = {}): Promise<WorkoutSession[]> {
    const { data } = await api.get<WorkoutSession[]>("/workout-sessions", {
      params,
    });
    return data;
  },

  async missed(
    params: { from?: string; to?: string } = {},
  ): Promise<MissedWorkout[]> {
    const { data } = await api.get<MissedWorkout[]>(
      "/workout-sessions/missed",
      { params },
    );
    return data;
  },

  async get(id: string): Promise<WorkoutSessionDetail> {
    const { data } = await api.get<WorkoutSessionDetail>(
      `/workout-sessions/${id}`,
    );
    // O backend pode omitir/retornar null em `sets` quando a sessão
    // não tem séries registradas. Normaliza para sempre ser um array.
    return { ...data, sets: data.sets ?? [] };
  },

  async updateStatus(
    id: string,
    status: SessionStatus,
  ): Promise<WorkoutSession> {
    const { data } = await api.put<WorkoutSession>(`/workout-sessions/${id}`, {
      status,
    });
    return data;
  },

  async addSet(sessionId: string, input: AddSetInput): Promise<ExerciseSet> {
    const { data } = await api.post<ExerciseSet>(
      `/workout-sessions/${sessionId}/sets`,
      input,
    );
    return data;
  },

  async updateSet(
    sessionId: string,
    setId: string,
    input: UpdateSetInput,
  ): Promise<ExerciseSet> {
    const { data } = await api.put<ExerciseSet>(
      `/workout-sessions/${sessionId}/sets/${setId}`,
      input,
    );
    return data;
  },

  async deleteSet(sessionId: string, setId: string): Promise<void> {
    await api.delete(`/workout-sessions/${sessionId}/sets/${setId}`);
  },

  // Última sessão COMPLETA do treino, com os sets — base do autopreenchimento
  // e da dica de progressão. null se o treino nunca foi concluído.
  async lastCompletedDetail(
    workoutId: string,
  ): Promise<WorkoutSessionDetail | null> {
    const sessions = await sessionsService.list({ workout_id: workoutId });
    const last = sessions
      .filter((s) => s.status === "complete")
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    return last ? sessionsService.get(last.id) : null;
  },
};
