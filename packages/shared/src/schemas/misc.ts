import { z } from "zod";
import { GOAL_CATEGORIES, LEADERBOARD_PERIODS } from "../constants";

export const pushTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android", "web"]).default("web"),
});

export const reportSchema = z.object({
  targetType: z.enum(["post", "comment", "user"]),
  targetId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

export const blockSchema = z.object({
  blockedId: z.string().uuid(),
});

export const leaderboardQuerySchema = z.object({
  period: z.enum(LEADERBOARD_PERIODS).default("weekly"),
  scope: z.enum(["global", "regional"]).default("global"),
});

export const phoneOtpSchema = z.object({
  phone: z.string().min(8).max(20),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(8).max(20),
  token: z.string().min(4).max(10),
});

export const ageGateSchema = z.object({
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()),
  region: z.enum(["us", "eu", "other"]).default("us"),
});
