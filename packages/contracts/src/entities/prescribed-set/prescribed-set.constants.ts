export const UNITS = ["KG", "LB"] as const;

export const UNIT_LABELS: Record<(typeof UNITS)[number], string> = {
  KG: "kg",
  LB: "lb",
};
