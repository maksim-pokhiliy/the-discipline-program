import { z } from "zod";

export const benchmarkSourceSchema = z.enum(["MANUAL", "DERIVED_FROM_LOG"]);
