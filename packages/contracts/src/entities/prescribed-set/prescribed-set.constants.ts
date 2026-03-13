export enum WeightUnit {
  KG = "KG",
  LB = "LB",
}

export const WEIGHT_UNIT_LABELS: Record<WeightUnit, string> = {
  [WeightUnit.KG]: "kg",
  [WeightUnit.LB]: "lb",
};

export enum WeightType {
  ABSOLUTE = "ABSOLUTE",
  PERCENTAGE = "PERCENTAGE",
}

export const WEIGHT_TYPE_LABELS: Record<WeightType, string> = {
  [WeightType.ABSOLUTE]: "Absolute",
  [WeightType.PERCENTAGE]: "% of 1RM",
};
