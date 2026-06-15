export const COACH_PROFILE_CONSTANTS = {
  MAX_NAME_LENGTH: 120,
  MAX_BIO_LENGTH: 2000,
  MAX_LOCATION_LENGTH: 120,
  MAX_SPECIALTIES: 12,
} as const;

export const SPECIALTY_PRESET = [
  "Olympic lifting",
  "Powerlifting",
  "Bodybuilding",
  "CrossFit",
  "Strongman",
  "GPP",
  "Hypertrophy",
  "Return-to-train",
  "Youth athletics",
  "Masters",
  "Endurance",
  "Mobility",
] as const;
