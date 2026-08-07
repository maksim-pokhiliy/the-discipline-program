import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const mobileShimEnv = createEnv({
  server: {
    MOBILE_SHIM_JWT_SECRET: z.string().min(32),
  },
  client: {},
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
