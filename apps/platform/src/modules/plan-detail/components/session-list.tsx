"use client";

import { useEffect, useState } from "react";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Box, Stack } from "@mui/material";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type { SessionWithLabel } from "@repo/contracts/lms/day";

import { useReorderSessions } from "@app/lib/hooks";

import { restrictToVerticalAxis } from "../lib/restrict-to-vertical-axis";

import { AddSessionButton } from "./add-session-button";
import { DragGhost } from "./drag-ghost";
import { SessionCard } from "./session-card";

const SESSION_GHOST_FALLBACK = "Session";

type SessionListProps = {
  planId: string;
  startDate: string;
  dayOfWeek: DayOfWeek;
  sessions: SessionWithLabel[];
};

export const SessionList: React.FC<SessionListProps> = ({
  planId,
  startDate,
  dayOfWeek,
  sessions,
}) => {
  const reorderSessions = useReorderSessions(planId, startDate, dayOfWeek);
  const [sortedSessions, setSortedSessions] = useState<SessionWithLabel[]>(sessions);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setSortedSessions(sessions);
  }, [sessions]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const resolveActiveLabel = (id: string): string => {
    const session = sortedSessions.find((s) => s.id === id);

    return session?.label?.name ?? SESSION_GHOST_FALLBACK;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedSessions.findIndex((s) => s.id === active.id);
    const newIndex = sortedSessions.findIndex((s) => s.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const previousOrder = sortedSessions;
    const nextOrder = arrayMove(sortedSessions, oldIndex, newIndex);

    setSortedSessions(nextOrder);
    reorderSessions.mutate(
      { orderedIds: nextOrder.map((s) => s.id) },
      {
        onError: () => setSortedSessions(previousOrder),
      },
    );
  };

  return (
    <Stack spacing={1.5}>
      {sortedSessions.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={(event: DragStartEvent) => setActiveId(String(event.active.id))}
          onDragCancel={() => setActiveId(null)}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedSessions.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <Stack spacing={1}>
              {sortedSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  planId={planId}
                  startDate={startDate}
                  isReorderPending={reorderSessions.isPending}
                />
              ))}
            </Stack>
          </SortableContext>

          <DragOverlay>
            {activeId !== null ? <DragGhost label={resolveActiveLabel(activeId)} /> : null}
          </DragOverlay>
        </DndContext>
      ) : null}

      <Box>
        <AddSessionButton planId={planId} startDate={startDate} dayOfWeek={dayOfWeek} accent />
      </Box>
    </Stack>
  );
};
