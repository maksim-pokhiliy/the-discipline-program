import { z } from "zod";

export const passwordResetInfoSchema = z.object({
  email: z.string().email(),
});
