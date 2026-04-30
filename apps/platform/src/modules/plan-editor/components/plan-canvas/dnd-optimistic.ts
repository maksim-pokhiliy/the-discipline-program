import {
  type GetPlanStructureResponse,
  type PlanStructureBlock,
  type PlanStructureSegment,
  type PlanStructureSession,
  type PlanStructureSetGroup,
} from "@repo/contracts/lms/training-plan";

import { type DraggableInfo } from "./dnd-types";

const cloneSession = (session: PlanStructureSession): PlanStructureSession => ({
  ...session,
  blocks: session.blocks.slice(),
});

const cloneBlock = (block: PlanStructureBlock): PlanStructureBlock => ({
  ...block,
  segments: block.segments.slice(),
});

const cloneSetGroup = (setGroup: PlanStructureSetGroup): PlanStructureSetGroup => ({
  ...setGroup,
  entries: setGroup.entries.slice(),
});

const moveBlock = (
  current: GetPlanStructureResponse,
  blockId: string,
  targetSessionId: string,
  targetIndex: number,
): GetPlanStructureResponse => {
  let removed: PlanStructureBlock | null = null;
  const stage1 = current.plan.weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => ({
      ...day,
      sessions: day.sessions.map((session) => {
        const next = cloneSession(session);
        const idx = next.blocks.findIndex((b) => b.id === blockId);

        if (idx >= 0) {
          const [block] = next.blocks.splice(idx, 1);

          removed = block ?? null;
        }

        return next;
      }),
    })),
  }));

  if (!removed) {
    return current;
  }

  const finalRemoved = removed;

  return {
    ...current,
    plan: {
      ...current.plan,
      weeks: stage1.map((week) => ({
        ...week,
        days: week.days.map((day) => ({
          ...day,
          sessions: day.sessions.map((session) => {
            if (session.id !== targetSessionId) {
              return session;
            }

            const insertion = Math.min(targetIndex, session.blocks.length);
            const next = cloneSession(session);

            next.blocks.splice(insertion, 0, finalRemoved);

            return next;
          }),
        })),
      })),
    },
  };
};

const moveSegment = (
  current: GetPlanStructureResponse,
  segmentId: string,
  targetBlockId: string,
  targetIndex: number,
): GetPlanStructureResponse => {
  let removed: PlanStructureSegment | null = null;
  const stage1 = current.plan.weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => ({
      ...day,
      sessions: day.sessions.map((session) => ({
        ...session,
        blocks: session.blocks.map((block) => {
          const next = cloneBlock(block);
          const idx = next.segments.findIndex((s) => s.id === segmentId);

          if (idx >= 0) {
            const [segment] = next.segments.splice(idx, 1);

            removed = segment ?? null;
          }

          return next;
        }),
      })),
    })),
  }));

  if (!removed) {
    return current;
  }

  const finalRemoved = removed;

  return {
    ...current,
    plan: {
      ...current.plan,
      weeks: stage1.map((week) => ({
        ...week,
        days: week.days.map((day) => ({
          ...day,
          sessions: day.sessions.map((session) => ({
            ...session,
            blocks: session.blocks.map((block) => {
              if (block.id !== targetBlockId) {
                return block;
              }

              const insertion = Math.min(targetIndex, block.segments.length);
              const next = cloneBlock(block);

              next.segments.splice(insertion, 0, finalRemoved);

              return next;
            }),
          })),
        })),
      })),
    },
  };
};

const moveEntry = (
  current: GetPlanStructureResponse,
  entryId: string,
  targetSetGroupId: string,
  targetIndex: number,
): GetPlanStructureResponse => {
  let removed: PlanStructureSetGroup["entries"][number] | null = null;
  const stage1 = current.plan.weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => ({
      ...day,
      sessions: day.sessions.map((session) => ({
        ...session,
        blocks: session.blocks.map((block) => ({
          ...block,
          segments: block.segments.map((segment) => ({
            ...segment,
            setGroups: segment.setGroups.map((setGroup) => {
              const next = cloneSetGroup(setGroup);
              const idx = next.entries.findIndex((e) => e.id === entryId);

              if (idx >= 0) {
                const [entry] = next.entries.splice(idx, 1);

                removed = entry ?? null;
              }

              return next;
            }),
          })),
        })),
      })),
    })),
  }));

  if (!removed) {
    return current;
  }

  const finalRemoved = removed;

  return {
    ...current,
    plan: {
      ...current.plan,
      weeks: stage1.map((week) => ({
        ...week,
        days: week.days.map((day) => ({
          ...day,
          sessions: day.sessions.map((session) => ({
            ...session,
            blocks: session.blocks.map((block) => ({
              ...block,
              segments: block.segments.map((segment) => ({
                ...segment,
                setGroups: segment.setGroups.map((setGroup) => {
                  if (setGroup.id !== targetSetGroupId) {
                    return setGroup;
                  }

                  const insertion = Math.min(targetIndex, setGroup.entries.length);
                  const next = cloneSetGroup(setGroup);

                  next.entries.splice(insertion, 0, finalRemoved);

                  return next;
                }),
              })),
            })),
          })),
        })),
      })),
    },
  };
};

export const buildOptimisticMover =
  (active: DraggableInfo, targetContainerKey: string, targetIndex: number) =>
  (current: GetPlanStructureResponse): GetPlanStructureResponse => {
    const [targetType, targetId] = targetContainerKey.split(":");

    if (!targetId) {
      return current;
    }

    if (active.kind === "block" && targetType === "session") {
      return moveBlock(current, active.blockId, targetId, targetIndex);
    }

    if (active.kind === "segment" && targetType === "block-container") {
      return moveSegment(current, active.segmentId, targetId, targetIndex);
    }

    if (active.kind === "entry" && targetType === "setGroup") {
      return moveEntry(current, active.entryId, targetId, targetIndex);
    }

    return current;
  };
