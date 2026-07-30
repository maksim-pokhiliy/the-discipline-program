import { type Load } from "@repo/contracts/lms/_shared";

type ByProfileAxis = Extract<Load, { kind: "byProfile" }>["axes"][number];

export type LevelAxis = {
  id: string;
  label: string;
  values: string[];
  binding: "GENDER" | null;
};

export const toLevelAxes = (axes: readonly ByProfileAxis[]): LevelAxis[] =>
  axes.map(({ axisId, label, values, binding }) => ({ id: axisId, label, values, binding }));
