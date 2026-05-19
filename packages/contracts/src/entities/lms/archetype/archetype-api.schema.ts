import { z } from "zod";

import { archetypeSchema } from "./archetype.schema";

export const getArchetypesResponseSchema = z.array(archetypeSchema);
