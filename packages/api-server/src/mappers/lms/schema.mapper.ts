import { type Schema as PrismaSchema, type SchemaRow as PrismaSchemaRow } from "@prisma/client";

import { intensitySchema } from "@repo/contracts/lms/_shared";
import { compositionSchema, deriveCompositionLabel } from "@repo/contracts/lms/composition";
import { type Schema, type SchemaWithBody } from "@repo/contracts/lms/schema";
import { InternalServerError } from "@repo/errors";

import { mapToSchemaRow } from "./schema-row.mapper";

export type PrismaSchemaWithRows = PrismaSchema & {
  rows: PrismaSchemaRow[];
};

export const mapToSchema = (s: PrismaSchema): Schema => {
  const composition = s.composition === null ? null : compositionSchema.parse(s.composition);

  return {
    id: s.id,
    blockId: s.blockId,
    parentSchemaId: s.parentSchemaId,
    order: s.order,
    header: s.header,
    intensity: s.intensity === null ? null : intensitySchema.parse(s.intensity),
    composition,
    label: composition === null ? null : deriveCompositionLabel(composition),
    notes: s.notes,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
};

type ChildrenByParent = Map<string | null, PrismaSchemaWithRows[]>;

const bucketByParent = (flat: PrismaSchemaWithRows[]): ChildrenByParent => {
  const childrenByParent: ChildrenByParent = new Map();

  for (const s of flat) {
    const bucket = childrenByParent.get(s.parentSchemaId) ?? [];

    bucket.push(s);
    childrenByParent.set(s.parentSchemaId, bucket);
  }

  return childrenByParent;
};

const buildNode = (
  node: PrismaSchemaWithRows,
  childrenByParent: ChildrenByParent,
): SchemaWithBody => {
  const subSchemas = (childrenByParent.get(node.id) ?? [])
    .sort((a, b) => a.order - b.order)
    .map((child) => buildNode(child, childrenByParent));
  const schema = mapToSchema(node);

  return {
    schema: {
      ...schema,
      label:
        schema.composition === null
          ? null
          : deriveCompositionLabel(schema.composition, {
              containerChildCount: subSchemas.length,
            }),
    },
    rows: node.rows.map(mapToSchemaRow),
    subSchemas,
  };
};

export const buildSchemaForest = (flat: PrismaSchemaWithRows[]): SchemaWithBody[] => {
  const childrenByParent = bucketByParent(flat);

  return (childrenByParent.get(null) ?? [])
    .sort((a, b) => a.order - b.order)
    .map((node) => buildNode(node, childrenByParent));
};

export const buildSchemaSubtree = (
  flat: PrismaSchemaWithRows[],
  rootId: string,
): SchemaWithBody => {
  const root = flat.find((s) => s.id === rootId);

  if (root === undefined) {
    throw new InternalServerError("Schema subtree root not found", {
      kind: "DbCorruption",
      entity: "Schema",
      schemaId: rootId,
    });
  }

  return buildNode(root, bucketByParent(flat));
};
