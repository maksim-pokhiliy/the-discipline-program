export enum WeightUnit {
  KG = "KG",
  LB = "LB",
}

export const UNIT_LABELS: Record<WeightUnit, string> = {
  [WeightUnit.KG]: "kg",
  [WeightUnit.LB]: "lb",
};
