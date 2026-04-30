import { LIBRARY_SCOPES, type LibraryScope } from "@repo/contracts/lms/_domain";

export const LIBRARY_SCOPE_OPTIONS = LIBRARY_SCOPES.map((value) => ({
  value,
  label: value === "SYSTEM" ? "System" : "Coach",
}));

export const SCOPE_CHIP_COLOR: Record<LibraryScope, "primary" | "default"> = {
  SYSTEM: "primary",
  COACH: "default",
};
