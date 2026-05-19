import { type z } from "zod";

import {
  type createSchemaPairingRequestSchema,
  type createSchemaPairingResponseSchema,
  type deleteSchemaPairingParamsSchema,
  type getSchemaPairingsResponseSchema,
} from "./schema-pairing-api.schema";

export type GetSchemaPairingsResponse = z.infer<typeof getSchemaPairingsResponseSchema>;
export type CreateSchemaPairingRequest = z.infer<typeof createSchemaPairingRequestSchema>;
export type CreateSchemaPairingResponse = z.infer<typeof createSchemaPairingResponseSchema>;
export type DeleteSchemaPairingParams = z.infer<typeof deleteSchemaPairingParamsSchema>;
