import { z } from "zod";

import {
  archetypeFamilySchema,
  archetypeNameSchema,
  schemaKindSchema,
} from "../schema/schema.schema";

import { ARCHETYPE_CONSTANTS } from "./archetype.constants";

export const archetypeSchema = z.object({
  id: z.string().cuid(),
  name: archetypeNameSchema,
  kind: schemaKindSchema,
  family: archetypeFamilySchema,
  headerPatternDescription: z.string().max(ARCHETYPE_CONSTANTS.MAX_DESCRIPTION_LENGTH),
  bodyLayoutDescription: z.string().max(ARCHETYPE_CONSTANTS.MAX_DESCRIPTION_LENGTH),
  archetypeParamsSchema: z.unknown(),
  relatedArchetypes: z.unknown(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
