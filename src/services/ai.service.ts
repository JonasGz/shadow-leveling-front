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
  /** Comes from the catalogue row, not from model output. Display only. */
  name: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  sort_order: number;
}

/** One training day of the plan. Becomes one workout, on one week day. */
export interface AIProposalDay {
  /** From the server's split table, e.g. "Peito e Tríceps". */
  name: string;
  day_of_week: DayOfWeek;
  exercises: AIProposalExercise[];
}

/**
 * A proposal is not a workout. It lives only in the screen's state until the
 * user confirms it, at which point {@link createWorkoutFromProposal} turns it
 * into real ones through the ordinary workout routes.
 *
 * One entry per training day, not one exercise list spread over several days:
 * a five-day plan is five different sessions.
 */
export interface AIProposal {
  name: string;
  days: AIProposalDay[];
}

export interface AIChatResponse {
  state: "question" | "refusal" | "proposal" | "error";
  text?: string;
  /** Terminal refusal: the user mentioned a health condition. */
  health_stop?: boolean;
  proposal?: AIProposal;
}

/** Why a chat call could not proceed, mapped from the HTTP status. */
export type AIBlockedReason =
  | "consent_required" // 428 — show the consent screen, then retry
  | "underage" // 403
  | "rate_limited" // 429
  | "unavailable"; // 404 — backend has no provider configured

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
  /**
   * Advances the conversation by one turn. The server keeps no state, so the
   * full history goes on every call.
   */
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

  /**
   * Records the AI disclosure consent and the birth date, in one call — the
   * user gives both on the same screen.
   */
  async acceptConsent(birthDate: string): Promise<void> {
    await api.patch("/auth/me/ai-consent", { birth_date: birthDate });
  },

  /**
   * Flags AI output as offensive or wrong. Required by Google Play's
   * AI-Generated Content policy to work without leaving the app.
   */
  async report(reason: string, content: string): Promise<void> {
    await api.post("/ai/report", { reason, content });
  },

  /**
   * Turns a confirmed proposal into a real workout. Deliberately built from
   * the same routes the manual flow uses: the assistant proposes, the user
   * creates.
   */
  /**
   * Creates one workout per training day. A single-day plan keeps the plan's
   * own name; a split names each workout after the day it trains, which is
   * what the user sees in the workout list.
   */
  async createWorkoutFromProposal(proposal: AIProposal): Promise<Workout[]> {
    const created: Workout[] = [];
    // Sequential, not Promise.all: sort_order is the display order, and
    // parallel writes would race it.
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
