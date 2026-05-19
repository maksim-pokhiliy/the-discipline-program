import { type z } from "zod";

import { type getArchetypesResponseSchema } from "./archetype-api.schema";

export type GetArchetypesResponse = z.infer<typeof getArchetypesResponseSchema>;
