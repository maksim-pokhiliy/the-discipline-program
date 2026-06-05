import type { Intensity } from "@repo/contracts/lms/_shared";
import type { Composition } from "@repo/contracts/lms/composition";

import type { CanonicalRow, CanonicalSchemaNode } from "../../canonical-schema";
import { schemaNode } from "../entities";

export type ComposeBaseInput = {
  order: number;
  rows?: CanonicalRow[];
  subSchemas?: CanonicalSchemaNode[];
  header?: string | null;
  notes?: string | null;
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
    subSchemas: base.subSchemas ?? [],
  };

  if (base.refId !== undefined) {
    node.refId = base.refId;
  }

  return schemaNode(node);
};
