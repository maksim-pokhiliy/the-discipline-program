import { z } from "zod";

export const dayKindSchema = z.enum(["TRAINING", "REST", "YOGA", "OFF"]);
