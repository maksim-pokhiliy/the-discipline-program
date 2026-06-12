import { z } from "zod";

export const mediaReferenceSchema = z.object({
  url: z.string().url(),
  label: z.string().min(1).optional(),
});

export type MediaReference = z.infer<typeof mediaReferenceSchema>;
