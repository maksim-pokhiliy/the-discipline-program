import { type z } from "zod";

import {
  type createPlanEnrollmentSchema,
  type enrollmentStatusSchema,
  type planEnrollmentSchema,
} from "./plan-enrollment.schema";

export type PlanEnrollment = z.infer<typeof planEnrollmentSchema>;
export type EnrollmentStatusValue = z.infer<typeof enrollmentStatusSchema>;
export type CreatePlanEnrollmentData = z.infer<typeof createPlanEnrollmentSchema>;
