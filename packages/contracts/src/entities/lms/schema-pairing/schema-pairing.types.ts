import { type z } from "zod";

import { type createSchemaPairingSchema, type schemaPairingSchema } from "./schema-pairing.schema";

export type SchemaPairing = z.infer<typeof schemaPairingSchema>;
export type CreateSchemaPairingData = z.infer<typeof createSchemaPairingSchema>;
