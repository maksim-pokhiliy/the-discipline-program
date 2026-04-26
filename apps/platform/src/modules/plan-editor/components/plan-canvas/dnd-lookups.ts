import {
  type GetPlanStructureResponse,
  type PlanStructureBlock,
  type PlanStructureSegment,
  type PlanStructureSession,
  type PlanStructureSetGroup,
} from "@repo/contracts/lms/training-plan";

import {
  type ContainerInfo,
  type DndLookups,
  type DraggableInfo,
  type DraggableKind,
} from "./dnd-types";

export const buildDndLookups = (data: GetPlanStructureResponse | undefined): DndLookups => {
  const draggables = new Map<string, DraggableInfo>();
  const containers = new Map<string, ContainerInfo>();
  const itemToContainer = new Map<string, string>();

  if (!data) {
    return { draggables, containers, itemToContainer };
  }

  data.plan.weeks.forEach((week) =>
    week.days.forEach((day) =>
      day.sessions.forEach((session: PlanStructureSession) => {
        const sessionContainerId = `session:${session.id}`;
        const blockIds = session.blocks.map((b) => `block:${b.id}`);

        containers.set(sessionContainerId, {
          kind: "session",
          sessionId: session.id,
          blockIds,
        });

        session.blocks.forEach((block: PlanStructureBlock, blockIndex) => {
          const blockKey = `block:${block.id}`;

          draggables.set(blockKey, {
            kind: "block",
            blockId: block.id,
            sourceSessionId: session.id,
            sourceIndex: blockIndex,
            expectedVersion: block.version,
          });
          itemToContainer.set(blockKey, sessionContainerId);

          const blockContainerId = `block-container:${block.id}`;
          const segmentIds = block.segments.map((s) => `segment:${s.id}`);

          containers.set(blockContainerId, {
            kind: "block",
            blockId: block.id,
            segmentIds,
          });

          block.segments.forEach((segment: PlanStructureSegment, segmentIndex) => {
            const segmentKey = `segment:${segment.id}`;

            draggables.set(segmentKey, {
              kind: "segment",
              segmentId: segment.id,
              sourceBlockId: block.id,
              sourceIndex: segmentIndex,
              expectedVersion: segment.version,
            });
            itemToContainer.set(segmentKey, blockContainerId);

            segment.setGroups.forEach((setGroup: PlanStructureSetGroup) => {
              const setGroupContainerId = `setGroup:${setGroup.id}`;
              const entryIds = setGroup.entries.map((e) => `entry:${e.id}`);

              containers.set(setGroupContainerId, {
                kind: "setGroup",
                setGroupId: setGroup.id,
                entryIds,
              });

              setGroup.entries.forEach((entry, entryIndex) => {
                const entryKey = `entry:${entry.id}`;

                draggables.set(entryKey, {
                  kind: "entry",
                  entryId: entry.id,
                  sourceSetGroupId: setGroup.id,
                  sourceIndex: entryIndex,
                  expectedVersion: entry.version,
                });
                itemToContainer.set(entryKey, setGroupContainerId);
              });
            });
          });
        });
      }),
    ),
  );

  return { draggables, containers, itemToContainer };
};

export const resolveContainerForOver = (
  overId: string,
  lookups: DndLookups,
  expectKind: DraggableKind,
): { containerId: string; targetIndex: number } | null => {
  const direct = lookups.containers.get(overId);

  if (direct) {
    if (expectKind === "block" && direct.kind === "session") {
      return { containerId: overId, targetIndex: direct.blockIds.length };
    }

    if (expectKind === "segment" && direct.kind === "block") {
      return { containerId: overId, targetIndex: direct.segmentIds.length };
    }

    if (expectKind === "entry" && direct.kind === "setGroup") {
      return { containerId: overId, targetIndex: direct.entryIds.length };
    }
  }

  const containerId = lookups.itemToContainer.get(overId);

  if (!containerId) {
    return null;
  }

  const container = lookups.containers.get(containerId);

  if (!container) {
    return null;
  }

  if (expectKind === "block" && container.kind === "session") {
    return { containerId, targetIndex: container.blockIds.indexOf(overId) };
  }

  if (expectKind === "segment" && container.kind === "block") {
    return { containerId, targetIndex: container.segmentIds.indexOf(overId) };
  }

  if (expectKind === "entry" && container.kind === "setGroup") {
    return { containerId, targetIndex: container.entryIds.indexOf(overId) };
  }

  return null;
};
