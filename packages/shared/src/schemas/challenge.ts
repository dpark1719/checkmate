import { z } from "zod";

export const setPromiseTimeSchema = z.object({
  promiseTime: z.string().datetime({ offset: true }),
});

export type SetPromiseTimeInput = z.infer<typeof setPromiseTimeSchema>;
