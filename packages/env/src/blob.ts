import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const blobEnv = createEnv({
  server: {
    BLOB_READ_WRITE_TOKEN: z.string().min(1),
  },
  client: {},
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
