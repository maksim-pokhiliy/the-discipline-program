export const ATHLETE_PROFILE_CONSTANTS = {
  MAX_HEALTH_NOTE_LENGTH: 2000,
  MAX_HEIGHT_CM: 300,
  MAX_WEIGHT_KG: 500,
} as const;

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export const GENDER_LABELS: Record<Gender, string> = {
  [Gender.MALE]: "Male",
  [Gender.FEMALE]: "Female",
};

export enum HealthStatus {
  HEALTHY = "HEALTHY",
  INJURED = "INJURED",
  RESTRICTED = "RESTRICTED",
}

export const HEALTH_STATUS_LABELS: Record<HealthStatus, string> = {
  [HealthStatus.HEALTHY]: "Healthy",
  [HealthStatus.INJURED]: "Injured",
  [HealthStatus.RESTRICTED]: "Restricted",
};
