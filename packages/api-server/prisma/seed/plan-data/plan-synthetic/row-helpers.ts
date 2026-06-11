import { row } from "../builder";
import type { CanonicalRow } from "../canonical-schema";

export type RowKindPayload = CanonicalRow["rowPayload"];
export type RowOptional = {
  load?: CanonicalRow["load"];
  reps?: CanonicalRow["reps"];
  side?: CanonicalRow["side"];
  tempo?: CanonicalRow["tempo"];
  position?: CanonicalRow["position"];
  sequence?: CanonicalRow["sequence"];
  intensity?: CanonicalRow["intensity"];
  media?: CanonicalRow["media"];
  notes?: CanonicalRow["notes"];
  refId?: string;
};

export const mkRow = (
  order: number,
  payload: RowKindPayload,
  extras: RowOptional = {},
): CanonicalRow => {
  const base: CanonicalRow = row({
    order,
    rowKind: payload.rowKind,
    rowPayload: payload,
    load: extras.load ?? null,
    reps: extras.reps ?? null,
    side: extras.side ?? null,
    tempo: extras.tempo ?? null,
    position: extras.position ?? null,
    sequence: extras.sequence ?? null,
    intensity: extras.intensity ?? null,
    media: extras.media ?? null,
    notes: extras.notes ?? null,
  });

  if (extras.refId !== undefined) {
    return { ...base, refId: extras.refId };
  }

  return base;
};
