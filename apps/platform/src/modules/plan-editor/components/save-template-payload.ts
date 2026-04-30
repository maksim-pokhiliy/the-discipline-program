import {
  type BlockTemplatePayload,
  type SessionTemplatePayload,
  type WeekTemplatePayload,
} from "@repo/contracts/lms/_domain";
import {
  type PlanStructureBlock,
  type PlanStructureDay,
  type PlanStructureSegment,
  type PlanStructureSession,
  type PlanStructureSetGroup,
  type PlanStructureWeek,
} from "@repo/contracts/lms/training-plan";

export type WeekSnapshotForTemplate = PlanStructureWeek;

const buildSetGroup = (setGroup: PlanStructureSetGroup) => ({
  order: setGroup.order,
  label: setGroup.label,
  restConfig: setGroup.restConfig,
  entries: setGroup.entries.map((entry) => ({
    order: entry.order,
    exerciseId: entry.exerciseId,
    exerciseSnapshot: entry.exerciseSnapshot,
    prescription: entry.prescription,
    alternatives: entry.alternatives,
    externalUrl: entry.externalUrl,
    notes: entry.notes,
  })),
});

const buildSegment = (segment: PlanStructureSegment) => ({
  order: segment.order,
  label: segment.label,
  archetypeKind: segment.archetypeKind,
  schemeParams: segment.schemeParams,
  schemeTemplateId: segment.schemeTemplateId,
  restConfig: segment.restConfig,
  setGroups: segment.setGroups.map(buildSetGroup),
});

const buildBlockSnapshot = (block: PlanStructureBlock) => ({
  order: block.order,
  kindId: block.kindId,
  title: block.title,
  status: block.status,
  weight: block.weight,
  notes: block.notes,
});

export const buildBlockTemplatePayload = (block: PlanStructureBlock): BlockTemplatePayload => ({
  block: buildBlockSnapshot(block),
  segments: block.segments.map(buildSegment),
});

const buildSessionSnapshot = (session: PlanStructureSession) => ({
  order: session.order,
  label: session.label,
  notes: session.notes,
});

export const buildSessionTemplatePayload = (
  session: PlanStructureSession,
): SessionTemplatePayload => ({
  session: buildSessionSnapshot(session),
  blocks: session.blocks.map((block) => buildBlockTemplatePayload(block)),
});

const buildDaySnapshot = (day: PlanStructureDay) => ({
  dayOfWeek: day.dayOfWeek,
  kind: day.kind,
  notes: day.notes,
  sessions: day.sessions.map(buildSessionTemplatePayload),
});

export const buildWeekTemplatePayload = (week: PlanStructureWeek): WeekTemplatePayload => ({
  week: {
    index: week.index,
    label: week.label,
    notes: week.notes,
  },
  days: week.days.map(buildDaySnapshot),
});
