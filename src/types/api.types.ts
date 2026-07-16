// Auth
export interface AuthToken {
  token: string;
  expires_at: string;
}

export interface User {
  id: string;
  email: string;
  nickname: string | null;
  avatar_url: string | null;
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
  photo_url: string | null;
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
      exercise_count: number;
      estimated_duration_min: number;
    }>;
  };
  tasks: {
    progress: DayProgress;
    items: Task[];
  };
}

export interface WeeklySummary {
  goal: {
    completed: number;
    scheduled: number;
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

// Groups
export interface Group {
  id: string;
  name: string;
  cover_url: string | null;
  invite_code: string;
  owner_id: string;
  created_at: string;
}

// A group as returned by GET /groups (the list), with member data for the
// avatar stack. Distinct from GroupDetail (the group page header).
export interface GroupListItem extends Group {
  member_count: number;
  member_avatars: string[]; // up to 3 non-null avatar URLs
}

export interface GroupDetail extends Group {
  top_score: number;
  top_name: string;
  top_avatar_url: string | null;
  my_score: number;
  member_count: number;
}

export interface RankingEntry {
  user_id: string;
  name: string;
  avatar_url: string | null;
  points: number;
}

export interface FeedItem {
  session_id: string;
  user_id: string;
  name: string;
  workout_name: string;
  photo_url: string | null;
  created_at: string;
  reaction_count: number;
  comment_count: number;
  my_reaction: string | null; // this viewer's emoji on this session, or null
  top_emoji: string | null; // most-used emoji on this session (tie: earliest), or null
}

export interface CursorMeta {
  next_cursor: string | null;
  has_more: boolean;
}

export interface FeedPage {
  data: FeedItem[];
  cursor: CursorMeta;
}

export interface ReactionCount {
  emoji: string;
  count: number;
}

// SessionSocialDetail is a completed workout viewed inside a group as a post.
export interface SessionSocialDetail {
  session_id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  workout_name: string;
  photo_url: string | null;
  created_at: string;
  reactions: ReactionCount[];
  my_reaction: string | null;
  comment_count: number;
}

export interface SessionComment {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  body: string;
  created_at: string;
  is_mine: boolean;
}

export interface CommentPage {
  data: SessionComment[];
  cursor: CursorMeta;
}

// Generic API error
export interface ApiError {
  error: string;
}
