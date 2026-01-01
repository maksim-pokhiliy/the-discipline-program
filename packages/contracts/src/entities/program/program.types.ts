import { z } from "zod";
import {
  programSchema,
  createProgramSchema,
  updateProgramSchema,
  updateProgramOrderSchema,
} from "./program.schema";

export type Program = z.infer<typeof programSchema>;
export type CreateProgramData = z.infer<typeof createProgramSchema>;
export type UpdateProgramData = z.infer<typeof updateProgramSchema>;
export type UpdateProgramOrder = z.infer<typeof updateProgramOrderSchema>;

export interface ProgramStats {
  total: number;
  active: number;
  inactive: number;
}

export interface AdminProgramsPageData {
  stats: ProgramStats;
  programs: Program[];
}
