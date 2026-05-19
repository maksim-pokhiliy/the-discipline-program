import { z } from "zod";

import { idParamSchema } from "../../../common";

import { createSchemaPairingSchema, schemaPairingSchema } from "./schema-pairing.schema";

export const getSchemaPairingsResponseSchema = z.array(schemaPairingSchema);

export const createSchemaPairingRequestSchema = createSchemaPairingSchema;
export const createSchemaPairingResponseSchema = schemaPairingSchema;

export const deleteSchemaPairingParamsSchema = idParamSchema;
