import { type z } from "zod";

import { type planCoachAssignmentSchema } from "./plan-coach-assignment.schema";

export type PlanCoachAssignment = z.infer<typeof planCoachAssignmentSchema>;
