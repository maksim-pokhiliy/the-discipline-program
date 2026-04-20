import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const emailEnv = createEnv({
  server: {
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().email().optional(),
    EMAIL_REPLY_TO: z.string().email().optional(),
  },
  client: {},
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
