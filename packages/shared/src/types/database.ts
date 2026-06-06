import type {
  GOAL_CATEGORIES,
  REACTION_TYPES,
  LEADERBOARD_PERIODS,
  USER_ROLES,
} from "../constants";

export type GoalCategory = (typeof GOAL_CATEGORIES)[number];
export type ReactionType = (typeof REACTION_TYPES)[number];
export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number];
export type UserRole = (typeof USER_ROLES)[number];

export interface Profile {
  id: string;
  displayName: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  timezone: string;
  timezoneLabel: string | null;
  region: string | null;
  notificationPreferences: Record<string, unknown>;
  role: UserRole;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  category: GoalCategory;
  description: string | null;
  defaultPromiseTime: string;
  targetEndDate: string | null;
  isActive: boolean;
  createdAt: string;
  archivedAt: string | null;
  completedAt: string | null;
  completionNote: string | null;
  startPostId: string | null;
  endPostId: string | null;
}

export interface DailyChallenge {
  id: string;
  userId: string;
  goalId: string;
  date: string;
  triggerFiredAt: string | null;
  promiseTime: string | null;
  leewayExpiresAt: string | null;
  postedAt: string | null;
  isLate: boolean;
  streakCredited: boolean;
}

export interface Post {
  id: string;
  userId: string;
  goalId: string;
  dailyChallengeId: string;
  photoUrl: string;
  caption: string | null;
  isLate: boolean;
  createdAt: string;
  deletedAt: string | null;
}

export interface Streak {
  id: string;
  userId: string;
  goalId: string;
  currentCount: number;
  longestCount: number;
  lastCreditedDate: string | null;
}
