export const TRAINING_PLAN_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export const TRAINING_PLAN_STATUS_LABELS: Record<(typeof TRAINING_PLAN_STATUSES)[number], string> =
  {
    DRAFT: "Draft",
    ACTIVE: "Active",
    ARCHIVED: "Archived",
  };
