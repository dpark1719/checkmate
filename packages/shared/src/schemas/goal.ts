import { z } from "zod";
import { GOAL_CATEGORIES } from "../constants";

export const goalCategorySchema = z.enum(GOAL_CATEGORIES);

export const createGoalSchema = z.object({
  title: z.string().min(1).max(120),
  category: goalCategorySchema,
  description: z.string().max(500).optional(),
  defaultPromiseTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Use HH:MM or HH:MM:SS")
    .optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  category: goalCategorySchema.optional(),
  description: z.string().max(500).optional(),
  defaultPromiseTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/)
    .optional(),
  isActive: z.boolean().optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
