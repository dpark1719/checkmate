import { z } from "zod";
import { GOAL_CATEGORIES } from "../constants";

export const goalCategorySchema = z.enum(GOAL_CATEGORIES);

const targetEndDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const createTargetEndDateSchema = targetEndDateSchema.refine((value) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${value}T00:00:00`);
  return end >= today;
}, "Target end date must be today or in the future");

export const createGoalSchema = z.object({
  title: z.string().min(1).max(120),
  category: goalCategorySchema,
  description: z.string().max(500).optional(),
  targetEndDate: createTargetEndDateSchema,
  defaultPromiseTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Use HH:MM or HH:MM:SS")
    .optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  category: goalCategorySchema.optional(),
  description: z.string().max(500).optional(),
  targetEndDate: targetEndDateSchema.optional(),
  defaultPromiseTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/)
    .optional(),
  isActive: z.boolean().optional(),
});

export const completeGoalSchema = z.object({
  completionNote: z.string().max(500).optional(),
  startPostId: z.string().uuid().optional(),
  endPostId: z.string().uuid().optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type CompleteGoalInput = z.infer<typeof completeGoalSchema>;
