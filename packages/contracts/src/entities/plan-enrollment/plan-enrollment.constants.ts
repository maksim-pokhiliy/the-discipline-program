export const PLAN_ENROLLMENT_STATUSES = ["ACTIVE", "PAUSED", "COMPLETED"] as const;

export const PLAN_ENROLLMENT_STATUS_LABELS: Record<
  (typeof PLAN_ENROLLMENT_STATUSES)[number],
  string
> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
};
