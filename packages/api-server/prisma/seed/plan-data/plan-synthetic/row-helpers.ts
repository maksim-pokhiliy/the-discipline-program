import { row } from "../builder";
import type { CanonicalRow } from "../canonical-schema";

export type RowOptional = {
  sets?: CanonicalRow["sets"];
  load?: CanonicalRow["load"];
  reps?: CanonicalRow["reps"];
  side?: CanonicalRow["side"];
  tempo?: CanonicalRow["tempo"];
  media?: CanonicalRow["media"];
  modifierRefs?: CanonicalRow["modifierRefs"];
  notes?: CanonicalRow["notes"];
  refId?: string;
};

export const mkRow = (
  order: number,
  exerciseId: string,
  extras: RowOptional = {},
): CanonicalRow => {
  const base: CanonicalRow = row({
    order,
    exerciseId,
    sets: extras.sets ?? null,
    load: extras.load ?? null,
    reps: extras.reps ?? null,
    side: extras.side ?? null,
    tempo: extras.tempo ?? null,
    media: extras.media ?? null,
    modifierRefs: extras.modifierRefs ?? [],
    notes: extras.notes ?? null,
  });

  if (extras.refId !== undefined) {
    return { ...base, refId: extras.refId };
  }

  return base;
};
