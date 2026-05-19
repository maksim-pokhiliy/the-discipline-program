import { z } from "zod";

import { SCHEMA_PAIRING_RELATIONS } from "./schema-pairing.constants";

export const schemaPairingRelationSchema = z.enum(SCHEMA_PAIRING_RELATIONS);

export const schemaPairingSchema = z.object({
  id: z.string().cuid(),
  schemaAId: z.string().cuid(),
  schemaBId: z.string().cuid(),
  relationKind: schemaPairingRelationSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createSchemaPairingSchema = z
  .object({
    schemaAId: z.string().cuid(),
    schemaBId: z.string().cuid(),
    relationKind: schemaPairingRelationSchema,
  })
  .refine((p) => p.schemaAId !== p.schemaBId, {
    message: "schemaAId and schemaBId must be different",
    path: ["schemaBId"],
  });
