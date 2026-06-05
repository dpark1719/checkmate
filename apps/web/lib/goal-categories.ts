export const GOAL_CATEGORY_EMOJI: Record<string, string> = {
  fitness: "🏋️",
  diet: "🥗",
  career: "💻",
  study: "📚",
  finance: "💰",
  relationship: "❤️",
  creative: "🎨",
  other: "✨",
};

export function goalCategoryEmoji(category: string): string {
  return GOAL_CATEGORY_EMOJI[category] ?? "✨";
}
