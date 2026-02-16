export const GENDERS = ["MALE", "FEMALE"] as const;

export const GENDER_ENUM = {
  MALE: "MALE",
  FEMALE: "FEMALE",
} as const;

export const GENDER_LABELS: Record<(typeof GENDERS)[number], string> = {
  MALE: "Male",
  FEMALE: "Female",
};
