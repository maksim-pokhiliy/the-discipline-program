import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const billingEnv = createEnv({
  server: {
    BILLING_ENCRYPTION_KEY: z.string().length(44),
  },
  client: {},
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
