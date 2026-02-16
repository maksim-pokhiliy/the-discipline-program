export const ROLE_CONFIG: Record<
  string,
  { label: string; color: "primary" | "secondary" | "success" | "default" }
> = {
  ADMIN: { label: "Admin", color: "primary" },
  COACH: { label: "Coach", color: "secondary" },
  USER: { label: "User", color: "default" },
};
