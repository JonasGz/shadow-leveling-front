import axios from "axios";
import { api } from "./api";
import { workoutsService } from "./workouts.service";
import type { DayOfWeek, Workout } from "../types/api.types";

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIProposalExercise {
  exercise_id: string;
  name: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  sort_order: number;
}

export interface AIProposalDay {
  name: string;
  day_of_week: DayOfWeek;
  exercises: AIProposalExercise[];
}

export interface AIProposal {
  name: string;
  days: AIProposalDay[];
}

export interface AIChatResponse {
  state: "question" | "refusal" | "proposal" | "error";
  text?: string;
  health_stop?: boolean;
  proposal?: AIProposal;
}

export type AIBlockedReason =
  "consent_required" | "underage" | "rate_limited" | "unavailable";

export class AIBlockedError extends Error {
  constructor(readonly reason: AIBlockedReason) {
    super(reason);
    this.name = "AIBlockedError";
  }
}

function toBlockedReason(status: number): AIBlockedReason | null {
  switch (status) {
    case 428:
      return "consent_required";
    case 403:
      return "underage";
    case 429:
      return "rate_limited";
    case 404:
      return "unavailable";
    default:
      return null;
  }
}

export const aiService = {
  async chat(messages: AIMessage[]): Promise<AIChatResponse> {
    try {
      const { data } = await api.post<AIChatResponse>("/ai/workout-chat", {
        messages,
      });
      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const reason = toBlockedReason(error.response.status);
        if (reason) throw new AIBlockedError(reason);
      }
      throw error;
    }
  },

  async acceptConsent(birthDate: string): Promise<void> {
    await api.patch("/auth/me/ai-consent", { birth_date: birthDate });
  },

  async report(reason: string, content: string): Promise<void> {
    await api.post("/ai/report", { reason, content });
  },

  async createWorkoutFromProposal(proposal: AIProposal): Promise<Workout[]> {
    const created: Workout[] = [];
    for (const day of proposal.days) {
      const workout = await workoutsService.create({
        name: proposal.days.length === 1 ? proposal.name : day.name,
        days_of_week: [day.day_of_week],
      });
      for (const exercise of day.exercises) {
        await workoutsService.addExercise(workout.id, {
          exercise_id: exercise.exercise_id,
          sets: exercise.sets,
          reps_min: exercise.reps_min,
          reps_max: exercise.reps_max,
          sort_order: exercise.sort_order,
        });
      }
      created.push(workout);
    }
    return created;
  },
};
