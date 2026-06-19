import { z } from "zod";

import { createBenchmarkResultSchema } from "../benchmark-result/benchmark-result.schema";

import { PERFORMED_SESSION_CONSTANTS } from "./performed-session.constants";

export const performedSessionSchema = z.object({
  id: z.string().cuid(),
  sessionId: z.string().cuid(),
  userId: z.string().cuid(),
  performedAt: z.coerce.date(),
  coachNotes: z.string().nullable(),
  athleteNotes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createPerformedSessionSchema = z
  .object({
    sessionId: z.string().cuid(),
    performedAt: z.coerce.date(),
    athleteNotes: z.string().max(PERFORMED_SESSION_CONSTANTS.MAX_NOTE_LENGTH).nullable().optional(),
    results: z.array(createBenchmarkResultSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.results === undefined) {
      return;
    }

    const seen = new Set<string>();

    data.results.forEach((entry, index) => {
      if (seen.has(entry.plannedSchemaId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate plannedSchemaId in results",
          path: ["results", index, "plannedSchemaId"],
        });

        return;
      }

      seen.add(entry.plannedSchemaId);
    });
  });
