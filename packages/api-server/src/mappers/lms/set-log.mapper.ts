import { type SetLog as PrismaSetLog } from "@prisma/client";

import { prescriptionSchema } from "@repo/contracts/lms/_domain";
import { setActualResultSchema, type SetLog } from "@repo/contracts/lms/set-log";

export const mapToSetLog = (s: PrismaSetLog): SetLog => ({
  id: s.id,
  exerciseLogId: s.exerciseLogId,
  order: s.order,
  prescribed: prescriptionSchema.parse(s.prescribed),
  actual: setActualResultSchema.parse(s.actual),
  failed: s.failed,
  notes: s.notes,
  completedAt: s.completedAt,
});
