import type { Load, PerLimbDistribution, RepNotation } from "@repo/contracts/lms/_shared";

export type RowFormState = {
  exerciseId: string | null;
  sets: number | null;
  reps: RepNotation | null;
  load: Load | null;
  side: PerLimbDistribution | null;
  tempoInput: string;
  modifierIds: string[];
  mediaUrl: string;
  mediaLabel: string;
  notes: string[];
};

export type RowRequestMode = { kind: "create"; schemaId: string } | { kind: "edit" };
