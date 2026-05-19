import { type z } from "zod";

import { type archetypeSchema } from "./archetype.schema";

export type Archetype = z.infer<typeof archetypeSchema>;
