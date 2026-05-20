import { type z } from "zod";

import {
  type alternatingGroupSchema,
  type createAlternatingGroupSchema,
} from "./alternating-group.schema";

export type AlternatingGroup = z.infer<typeof alternatingGroupSchema>;
export type CreateAlternatingGroupData = z.infer<typeof createAlternatingGroupSchema>;
