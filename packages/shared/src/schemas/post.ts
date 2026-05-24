import { z } from "zod";

export const createPostSchema = z.object({
  goalId: z.string().uuid(),
  dailyChallengeId: z.string().uuid(),
  /** Supabase Storage path, e.g. `{userId}/{uuid}.jpg` */
  photoUrl: z.string().min(1),
  caption: z.string().max(280).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
