import type { GOAL_CATEGORIES, REACTION_TYPES, LEADERBOARD_PERIODS } from "../constants";

export type GoalCategory = (typeof GOAL_CATEGORIES)[number];
export type ReactionType = (typeof REACTION_TYPES)[number];
export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number];

export interface Profile {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  timezone: string;
  region: string | null;
  notificationPreferences: Record<string, unknown>;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  category: GoalCategory;
  description: string | null;
  defaultPromiseTime: string;
  isActive: boolean;
  createdAt: string;
  archivedAt: string | null;
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
