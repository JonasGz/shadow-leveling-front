// Auth
export interface AuthToken {
  token: string;
  expires_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Session {
  id: string;
  user_agent: string;
  created_at: string;
  expires_at: string;
}

// Tasks
export type TaskLevel = "easy" | "medium" | "hard" | "no_rank";
export type RecurrenceType = "one_time" | "daily" | "weekly" | "monthly" | "custom";
export type DayOfWeek =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export interface Task {
  id: string;
  title: string;
  description: string;
  level: TaskLevel;
  recurrence_type: RecurrenceType;
  is_optional: boolean;
  is_completed: boolean;
  occurrence_date: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  level: TaskLevel;
  initial_date: string;
  final_date: string;
  recurrence_type: RecurrenceType;
  custom_days_of_week?: DayOfWeek[];
  is_optional: boolean;
}

// Exercises
export type ExerciseType = "repetition" | "time";

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  unit: string;
  created_at: string;
}

export interface PaginatedExercises {
  data: Exercise[];
  cursor: {
    next_cursor: string | null;
    has_more: boolean;
  };
}

// Workouts
export interface WorkoutExercise {
  id: string;
  exercise_id: string;
  exercise: Exercise;
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  duration: number | null;
  note: string;
  sort_order: number;
  created_at: string;
}

export interface Workout {
  id: string;
  name: string;
  description: string;
  days_of_week: DayOfWeek[];
  active: boolean;
  done_today: boolean;
  exercises: WorkoutExercise[];
  created_at: string;
  updated_at: string;
}

// Workout Sessions
export type SessionStatus = "complete" | "incomplete" | "skipped";

export interface WorkoutSession {
  id: string;
  workout_id: string;
  date: string;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

export interface ExerciseSet {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  duration: number | null;
  created_at: string;
}

export interface WorkoutSessionDetail extends WorkoutSession {
  sets: ExerciseSet[];
}

export interface MissedWorkout {
  date: string;
  workout_id: string;
  workout_name: string;
}

// Metrics
export interface DayProgress {
  total: number;
  completed: number;
  pending: number;
}

export interface TodayMetrics {
  date: string;
  progress: DayProgress;
  workouts: {
    progress: DayProgress;
    items: Array<{
      id: string;
      name: string;
      description: string;
      is_completed: boolean;
    }>;
  };
  tasks: {
    progress: DayProgress;
    items: Task[];
  };
}

// Nivelamento / XP
export type Rank =
  | "E-Rank"
  | "D-Rank"
  | "C-Rank"
  | "B-Rank"
  | "A-Rank"
  | "S-Rank";

export interface UserLevel {
  level: number;
  rank: Rank;
  total_xp: number;
  xp_into_level: number;
  xp_for_next_level: number;
  progress_pct: number;
  current_streak: number;
}

// Generic API error
export interface ApiError {
  error: string;
}
