import { type USER_ROLES } from "../auth";

export const USER_ROLE_LABELS: Record<(typeof USER_ROLES)[number], string> = {
  ADMIN: "Admin",
  COACH: "Coach",
  USER: "User",
};
