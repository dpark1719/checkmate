export const GOAL_CATEGORIES = [
  "fitness",
  "diet",
  "career",
  "study",
  "finance",
  "relationship",
  "creative",
  "other",
] as const;

export const REACTION_TYPES = ["heart", "fire", "clap", "cheers"] as const;

/** Display emoji for each reaction (DB still stores snake_case keys). */
export const REACTION_EMOJI: Record<(typeof REACTION_TYPES)[number] | "mind_blown", string> = {
  heart: "❤️",
  fire: "🔥",
  clap: "👏",
  cheers: "🎉",
  mind_blown: "🎉",
};

export function reactionEmoji(type: string): string {
  return REACTION_EMOJI[type as keyof typeof REACTION_EMOJI] ?? type;
}

export const LEADERBOARD_PERIODS = ["weekly", "all_time"] as const;

export const MAX_ACTIVE_GOALS = 5;

export const DEFAULT_PROMISE_TIME = "20:00:00";

export const PROMISE_SET_WINDOW_HOURS = 2;

export const LEEWAY_HOURS = 1;

export const TRIGGER_WINDOW_START_HOUR = 5;

export const TRIGGER_WINDOW_END_HOUR = 22;

export const HARD_DEADLINE_HOUR = 22;

export const USER_ROLES = ["user", "moderator", "admin"] as const;
