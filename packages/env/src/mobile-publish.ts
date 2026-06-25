import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const mobilePublishEnv = createEnv({
  server: {
    MOBILE_PUBLISH_ENCRYPTION_KEY: z.string().length(44),
    LEGACY_MOBILE_API_BASE_URL: z.string().url(),
  },
  client: {},
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
