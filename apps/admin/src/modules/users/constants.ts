import { type ChipProps } from "@mui/material";

import { UserRole } from "@repo/contracts/iam/auth";
import { USER_ROLE_LABELS } from "@repo/contracts/iam/user";

export const ROLE_CONFIG: Record<UserRole, { label: string; color: ChipProps["color"] }> = {
  [UserRole.ADMIN]: { label: USER_ROLE_LABELS.ADMIN, color: "primary" },
  [UserRole.HEAD_COACH]: { label: USER_ROLE_LABELS.HEAD_COACH, color: "primary" },
  [UserRole.COACH]: { label: USER_ROLE_LABELS.COACH, color: "secondary" },
  [UserRole.ATHLETE]: { label: USER_ROLE_LABELS.ATHLETE, color: "default" },
};
