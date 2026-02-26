export const GENDERS = ["MALE", "FEMALE"] as const;

export const GENDER_ENUM = {
  MALE: "MALE",
  FEMALE: "FEMALE",
} as const;

export const GENDER_LABELS: Record<(typeof GENDERS)[number], string> = {
  MALE: "Male",
  FEMALE: "Female",
};

export const HEALTH_STATUSES = ["HEALTHY", "INJURED", "RESTRICTED"] as const;

export const HEALTH_STATUS_LABELS: Record<(typeof HEALTH_STATUSES)[number], string> = {
  HEALTHY: "Healthy",
  INJURED: "Injured",
  RESTRICTED: "Restricted",
};
