export enum PlanEnrollmentStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
}

export const PLAN_ENROLLMENT_STATUS_LABELS: Record<PlanEnrollmentStatus, string> = {
  [PlanEnrollmentStatus.ACTIVE]: "Active",
  [PlanEnrollmentStatus.PAUSED]: "Paused",
};
