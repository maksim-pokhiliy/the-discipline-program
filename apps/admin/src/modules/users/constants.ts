import { type UserRole } from "@repo/contracts/auth";
import { USER_ROLE_LABELS } from "@repo/contracts/user";

export const ROLE_CONFIG: Record<
  UserRole,
  { label: string; color: "primary" | "secondary" | "success" | "default" }
> = {
  ADMIN: { label: USER_ROLE_LABELS.ADMIN, color: "primary" },
  COACH: { label: USER_ROLE_LABELS.COACH, color: "secondary" },
  USER: { label: USER_ROLE_LABELS.USER, color: "default" },
};
