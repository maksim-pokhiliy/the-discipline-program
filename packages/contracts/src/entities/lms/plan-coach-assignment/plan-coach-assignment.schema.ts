import { z } from "zod";

export const planCoachAssignmentSchema = z.object({
  id: z.string().cuid(),
  planId: z.string().cuid(),
  coachId: z.string().cuid(),
  canEdit: z.boolean(),
  grantedBy: z.string().cuid(),
  grantedAt: z.date(),
});
