import { Gender, type UpdateAthleteProfileRequest } from "@repo/contracts/coaching/athlete-profile";
import { GENDER_AXIS_COORDS, type Load } from "@repo/contracts/lms/_shared";

type BoundBinding = Exclude<Extract<Load, { kind: "byProfile" }>["axes"][number]["binding"], null>;

export type ProfileBindingEntry = {
  toUpdate: (value: string) => UpdateAthleteProfileRequest | null;
};

const GENDER_BY_COORD: Record<string, Gender> = {
  [GENDER_AXIS_COORDS.MALE]: Gender.MALE,
  [GENDER_AXIS_COORDS.FEMALE]: Gender.FEMALE,
};

export const PROFILE_BINDING_REGISTRY: Record<BoundBinding, ProfileBindingEntry> = {
  GENDER: {
    toUpdate: (value) => {
      const gender = GENDER_BY_COORD[value];

      return gender === undefined ? null : { gender };
    },
  },
};
