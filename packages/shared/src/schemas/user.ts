import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, underscores only")
    .optional(),
  bio: z.string().max(300).nullable().optional(),
  avatarUrl: z.string().url().optional(),
  timezone: z.string().min(1).optional(),
  region: z.string().max(10).nullable().optional(),
  notificationPreferences: z.record(z.unknown()).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
