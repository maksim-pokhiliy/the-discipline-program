import { z } from "zod";

export const skillLevelSchema = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "ELITE"]);
