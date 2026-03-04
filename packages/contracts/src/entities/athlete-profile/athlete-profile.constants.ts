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
