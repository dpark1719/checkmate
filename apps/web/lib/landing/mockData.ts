export interface MockPost {
  id: number;
  username: string;
  avatarInitials: string;
  avatarColor: string;
  goalCategory: string;
  goalEmoji: string;
  goalTitle: string;
  caption: string;
  timeAgo: string;
  reactions: { fire: number; clap: number };
  streakDays: number;
}

export interface MockLeaderboardEntry {
  rank: number;
  username: string;
  avatarInitials: string;
  avatarColor: string;
  goalCategory: string;
  goalEmoji: string;
  streakDays: number;
  badge: string;
}

export interface MockStats {
  lockedInToday: number;
  activeStreaks: number;
}

export const MOCK_STATS: MockStats = {
  lockedInToday: 1247,
  activeStreaks: 8392,
};

export const MOCK_POSTS: MockPost[] = [
  {
    id: 1,
    username: "alex_runs",
    avatarInitials: "AR",
    avatarColor: "#f97316",
    goalCategory: "fitness",
    goalEmoji: "🏃",
    goalTitle: "Marathon Training",
    caption: "Day 23. Legs were dead but I showed up.",
    timeAgo: "4 min ago",
    reactions: { fire: 12, clap: 8 },
    streakDays: 23,
  },
  {
    id: 2,
    username: "priya.saves",
    avatarInitials: "PS",
    avatarColor: "#10b981",
    goalCategory: "finance",
    goalEmoji: "💰",
    goalTitle: "Save $10k by June",
    caption: "Packed lunch instead of eating out. Small wins.",
    timeAgo: "11 min ago",
    reactions: { fire: 6, clap: 19 },
    streakDays: 41,
  },
  {
    id: 3,
    username: "marco_builds",
    avatarInitials: "MB",
    avatarColor: "#6366f1",
    goalCategory: "career",
    goalEmoji: "💼",
    goalTitle: "Launch My Startup",
    caption: "Shipped the auth flow. Finally.",
    timeAgo: "18 min ago",
    reactions: { fire: 31, clap: 14 },
    streakDays: 7,
  },
  {
    id: 4,
    username: "soomin_reads",
    avatarInitials: "SR",
    avatarColor: "#f59e0b",
    goalCategory: "study",
    goalEmoji: "📚",
    goalTitle: "Read 24 Books This Year",
    caption: "Finished chapter 6. This book is changing me.",
    timeAgo: "26 min ago",
    reactions: { fire: 9, clap: 22 },
    streakDays: 15,
  },
  {
    id: 5,
    username: "jade.lifts",
    avatarInitials: "JL",
    avatarColor: "#ec4899",
    goalCategory: "fitness",
    goalEmoji: "🏋️",
    goalTitle: "Hit 135lb Bench Press",
    caption: "135 is so close. Hit 130 today.",
    timeAgo: "33 min ago",
    reactions: { fire: 44, clap: 7 },
    streakDays: 60,
  },
  {
    id: 7,
    username: "nadia_eats",
    avatarInitials: "NE",
    avatarColor: "#84cc16",
    goalCategory: "diet",
    goalEmoji: "🥗",
    goalTitle: "Mediterranean Diet",
    caption: "Meal prepped for the whole week. No excuses now.",
    timeAgo: "52 min ago",
    reactions: { fire: 8, clap: 11 },
    streakDays: 19,
  },
  {
    id: 8,
    username: "kevin.connects",
    avatarInitials: "KC",
    avatarColor: "#f43f5e",
    goalCategory: "relationship",
    goalEmoji: "❤️",
    goalTitle: "Date Night Every Week",
    caption: "Cooked dinner together. No phones.",
    timeAgo: "1 hr ago",
    reactions: { fire: 55, clap: 28 },
    streakDays: 8,
  },
  {
    id: 9,
    username: "lena.codes",
    avatarInitials: "LC",
    avatarColor: "#a855f7",
    goalCategory: "career",
    goalEmoji: "💻",
    goalTitle: "Land a SWE Internship",
    caption: "2 LeetCode mediums done. Grind don't stop.",
    timeAgo: "1 hr ago",
    reactions: { fire: 21, clap: 16 },
    streakDays: 34,
  },
];

export const MOCK_LEADERBOARD: MockLeaderboardEntry[] = [
  {
    rank: 1,
    username: "jade.lifts",
    avatarInitials: "JL",
    avatarColor: "#ec4899",
    goalCategory: "fitness",
    goalEmoji: "🏋️",
    streakDays: 60,
    badge: "👑",
  },
  {
    rank: 2,
    username: "priya.saves",
    avatarInitials: "PS",
    avatarColor: "#10b981",
    goalCategory: "finance",
    goalEmoji: "💰",
    streakDays: 41,
    badge: "🥈",
  },
  {
    rank: 3,
    username: "lena.codes",
    avatarInitials: "LC",
    avatarColor: "#a855f7",
    goalCategory: "career",
    goalEmoji: "💻",
    streakDays: 34,
    badge: "🥉",
  },
];
