import { Gender } from "@repo/contracts/coaching/athlete-profile";
import { GENDER_AXIS_COORDS } from "@repo/contracts/lms/_shared";

export const GENDER_BY_COORD: Record<string, Gender> = {
  [GENDER_AXIS_COORDS.MALE]: Gender.MALE,
  [GENDER_AXIS_COORDS.FEMALE]: Gender.FEMALE,
};
