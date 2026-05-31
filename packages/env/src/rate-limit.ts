import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const rateLimitEnv = createEnv({
  server: {
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
    RATE_LIMIT_TRUSTED_PROXY_HOPS: z.coerce.number().int().nonnegative().optional(),
  },
  client: {},
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
