import { type z } from "zod";

import { type blockSegmentSchema } from "./block-segment.schema";

export type BlockSegment = z.infer<typeof blockSegmentSchema>;
