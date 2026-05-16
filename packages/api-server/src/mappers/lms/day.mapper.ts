import {
  type Day as PrismaDay,
  type Label as PrismaLabel,
  type Session as PrismaSession,
} from "@prisma/client";

import { type DayOfWeek } from "@repo/contracts/lms/_shared";
import { type DaySlot } from "@repo/contracts/lms/day";

import { mapToLabel } from "./label.mapper";
import { mapToSession } from "./session.mapper";

type DayWithRelations = PrismaDay & {
  label: PrismaLabel | null;
  sessions: (PrismaSession & { label: PrismaLabel | null })[];
};

export const mapToDaySlot = (dayOfWeek: DayOfWeek, day: DayWithRelations | null): DaySlot => ({
  dayOfWeek,
  label: day?.label ? mapToLabel(day.label) : null,
  notes: day?.notes ?? null,
  sessions: (day?.sessions ?? []).map((s) => ({
    ...mapToSession(s),
    label: s.label ? mapToLabel(s.label) : null,
  })),
});
