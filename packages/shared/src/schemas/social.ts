import { z } from "zod";
import { REACTION_TYPES } from "../constants";

export const followSchema = z.object({
  followingId: z.string().uuid(),
});

export const reactionSchema = z.object({
  type: z.enum(REACTION_TYPES),
});

export const commentSchema = z.object({
  body: z.string().min(1).max(500),
});

export type FollowInput = z.infer<typeof followSchema>;
export type ReactionInput = z.infer<typeof reactionSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
