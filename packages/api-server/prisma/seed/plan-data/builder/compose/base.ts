import type { Intensity, NotesList } from "@repo/contracts/lms/_shared";
import type { Composition } from "@repo/contracts/lms/composition";
import type { ParallelInterleaveOrder } from "@repo/contracts/lms/schema-group";

import type {
  CanonicalGroupItem,
  CanonicalRow,
  CanonicalRowGroup,
  CanonicalSchemaNode,
} from "../../canonical-schema";
import { schemaNode } from "../entities";

export type ComposeBaseInput = {
  order: number;
  rows?: CanonicalRow[];
  rowGroups?: CanonicalRowGroup[];
  header?: string | null;
  notes?: NotesList | null;
  intensity?: Intensity | null;
  refId?: string;
};

export type ExactOrRange = number | { min: number; max: number };

export const buildComposeNode = (
  base: ComposeBaseInput,
  composition: Composition,
  defaultHeader: string | null,
): CanonicalSchemaNode => {
  const node: CanonicalSchemaNode = {
    order: base.order,
    composition,
    header: base.header === undefined ? defaultHeader : base.header,
    intensity: base.intensity ?? null,
    notes: base.notes ?? null,
    rows: base.rows ?? [],
    rowGroups: base.rowGroups ?? [],
  };

  if (base.refId !== undefined) {
    node.refId = base.refId;
  }

  return schemaNode(node);
};

export type ComposeGroupInput = {
  notes: NotesList | null;
  interleaveOrder?: ParallelInterleaveOrder;
  members: CanonicalSchemaNode[];
};

export const composeGroup = (input: ComposeGroupInput): CanonicalGroupItem => ({
  group: {
    notes: input.notes,
    ...(input.interleaveOrder !== undefined && { interleaveOrder: input.interleaveOrder }),
    members: input.members,
  },
});

export type ComposeRowGroupInput = {
  refId: string;
  notes: NotesList | null;
  memberRowRefIds: string[];
};

export const composeRowGroup = (input: ComposeRowGroupInput): CanonicalRowGroup => ({
  refId: input.refId,
  notes: input.notes,
  memberRowRefIds: input.memberRowRefIds,
});
