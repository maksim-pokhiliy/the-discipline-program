import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const monobankEnv = createEnv({
  server: {
    MONOBANK_API_URL: z.string().url().default("https://api.monobank.ua"),
    MONOBANK_MERCHANT_TOKEN: z.string().min(1),
    MONOBANK_WEBHOOK_PUBLIC_KEY: z.string().optional(),
  },
  client: {},
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
