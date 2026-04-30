import { type z } from "zod";

import { type setGroupSchema } from "./set-group.schema";

export type SetGroup = z.infer<typeof setGroupSchema>;
