import { z } from "zod";
import { isValidIanaTimezone } from "../city-timezone";
import { SOCIAL_LINK_PLATFORM_IDS } from "../social-links";

const socialLinkValue = z
  .string()
  .max(200)
  .optional()
  .nullable()
  .transform((v) => (v === undefined ? undefined : v ?? ""));

const socialLinksFields = Object.fromEntries(
  SOCIAL_LINK_PLATFORM_IDS.map((id) => [id, socialLinkValue])
) as Record<(typeof SOCIAL_LINK_PLATFORM_IDS)[number], typeof socialLinkValue>;

export const socialLinksInputSchema = z.object(socialLinksFields).partial();

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, underscores only")
    .optional(),
  bio: z.string().max(300).nullable().optional(),
  /** Set to null to remove profile photo */
  avatarPath: z.string().max(120).nullable().optional(),
  avatarUrl: z.string().url().optional(),
  timezone: z
    .string()
    .min(1)
    .refine(isValidIanaTimezone, "Invalid timezone")
    .optional(),
  timezoneLabel: z.string().min(1).max(120).nullable().optional(),
  region: z.string().max(10).nullable().optional(),
  notificationPreferences: z.record(z.unknown()).optional(),
  socialLinks: socialLinksInputSchema.optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
