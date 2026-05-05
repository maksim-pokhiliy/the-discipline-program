export enum EnrollmentStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  REMOVED = "REMOVED",
}

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.ACTIVE]: "Active",
  [EnrollmentStatus.PAUSED]: "Paused",
  [EnrollmentStatus.REMOVED]: "Removed",
};
