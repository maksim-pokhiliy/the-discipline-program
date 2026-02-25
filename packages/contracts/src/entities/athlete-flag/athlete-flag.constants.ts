export const FLAG_TYPES = ["INJURY", "RESTRICTION", "ATTENTION"] as const;

export const FLAG_TYPE_LABELS: Record<(typeof FLAG_TYPES)[number], string> = {
  INJURY: "Injury",
  RESTRICTION: "Restriction",
  ATTENTION: "Attention",
};
