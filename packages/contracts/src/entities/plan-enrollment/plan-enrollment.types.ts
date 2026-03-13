import { type z } from "zod";

import {
  type createPlanEnrollmentSchema,
  type enrollmentUserSchema,
  type planEnrollmentSchema,
  type updatePlanEnrollmentSchema,
} from "./plan-enrollment.schema";

export type EnrollmentUser = z.infer<typeof enrollmentUserSchema>;
export type PlanEnrollment = z.infer<typeof planEnrollmentSchema>;
export type CreatePlanEnrollmentData = z.infer<typeof createPlanEnrollmentSchema>;
export type UpdatePlanEnrollmentData = z.infer<typeof updatePlanEnrollmentSchema>;
