import type { ReactionType } from "@checkmate/shared";

export interface ReactionRow {
  type: string;
  user_id: string;
}

export function reactionMatches(type: ReactionType, stored: string) {
  if (stored === type) return true;
  if (type === "cheers" && stored === "mind_blown") return true;
  return false;
}

export function reactionsForType(reactions: ReactionRow[], type: ReactionType) {
  return reactions.filter((r) => reactionMatches(type, r.type));
}

export function userHasReaction(
  reactions: ReactionRow[],
  type: ReactionType,
  userId: string | null | undefined
) {
  if (!userId) return false;
  return reactions.some(
    (r) => r.user_id === userId && reactionMatches(type, r.type)
  );
}

export function dbTypesForReaction(type: ReactionType): string[] {
  return type === "cheers" ? ["cheers", "mind_blown"] : [type];
}
