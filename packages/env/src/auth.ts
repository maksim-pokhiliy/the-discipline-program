import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const authEnv = createEnv({
  server: {
    NEXTAUTH_SECRET: z.string().min(32),
    NEXTAUTH_URL: z.string().url(),
  },
  client: {},
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
