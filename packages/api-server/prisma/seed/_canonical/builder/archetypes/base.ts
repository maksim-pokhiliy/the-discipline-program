import type { z } from "zod";

import type { Intensity } from "@repo/contracts/lms/_shared";

import type {
  AlternatingGroupRelation,
  CanonicalRow,
  CanonicalSchemaNode,
} from "../../canonical-schema";
import type { schemaKindSchema } from "../../canonical-schema";
import { schemaNode } from "../entities";

export type SchemaKind = z.infer<typeof schemaKindSchema>;

export type ArchetypeBaseInput = {
  order: number;
  rows?: CanonicalRow[];
  subSchemas?: CanonicalSchemaNode[];
  header?: string | null;
  notes?: string | null;
  intensity?: Intensity | null;
  alternatingGroupRef?: string | null;
  alternatingGroupRelation?: AlternatingGroupRelation | null;
  refId?: string;
};

export type ExactOrRange = number | { min: number; max: number };

export const buildArchetypeNode = (
  base: ArchetypeBaseInput,
  kind: SchemaKind,
  archetype: CanonicalSchemaNode["archetype"],
  defaultHeader: string | null,
): CanonicalSchemaNode => {
  const node: CanonicalSchemaNode = {
    order: base.order,
    kind,
    archetype,
    header: base.header === undefined ? defaultHeader : base.header,
    intensity: base.intensity ?? null,
    notes: base.notes ?? null,
    alternatingGroupRef: base.alternatingGroupRef ?? null,
    alternatingGroupRelation: base.alternatingGroupRelation ?? null,
    rows: base.rows ?? [],
    subSchemas: base.subSchemas ?? [],
  };

  if (base.refId !== undefined) {
    node.refId = base.refId;
  }

  return schemaNode(node);
};
