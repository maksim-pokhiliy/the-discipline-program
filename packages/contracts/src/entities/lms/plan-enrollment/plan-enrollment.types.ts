import { type z } from "zod";

import {
  type createPlanEnrollmentSchema,
  type planEnrollmentSchema,
  type updatePlanEnrollmentSchema,
} from "./plan-enrollment.schema";

export type PlanEnrollment = z.infer<typeof planEnrollmentSchema>;
export type CreatePlanEnrollmentData = z.infer<typeof createPlanEnrollmentSchema>;
export type UpdatePlanEnrollmentData = z.infer<typeof updatePlanEnrollmentSchema>;
