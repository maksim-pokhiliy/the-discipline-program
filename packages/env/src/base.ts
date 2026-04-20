import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const baseEnv = createEnv({
  server: {
    DATABASE_URL: z
      .string()
      .url()
      .refine((url) => url.startsWith("postgres"), "must be a postgres URL"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    REVALIDATE_SECRET: z.string().optional(),
    FEATURE_USER_INVITE_ENABLED: z
      .string()
      .optional()
      .transform((value) => value === "true")
      .default("false"),
    INVITE_TOKEN_TTL_HOURS: z.coerce.number().int().positive().default(72),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_MARKETING_URL: z.string().url(),
    NEXT_PUBLIC_FEATURE_USER_INVITE_ENABLED: z
      .string()
      .optional()
      .transform((value) => value === "true")
      .default("false"),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_MARKETING_URL: process.env.NEXT_PUBLIC_MARKETING_URL,
    NEXT_PUBLIC_FEATURE_USER_INVITE_ENABLED: process.env.NEXT_PUBLIC_FEATURE_USER_INVITE_ENABLED,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
