import type {
  ComposeBlock,
  ComposeDay,
  ComposeProgram,
  ComposeSession,
  ComposeWeek,
  NodeId,
} from "../compose-tree.types";

import { cloneBlock, cloneDay, cloneSession, cloneWeek } from "./tree-ops";

type Identified = { id: NodeId };

const insertCloneAfter = <T extends Identified>(
  items: T[],
  id: NodeId,
  clone: (item: T) => T,
): T[] => items.flatMap((item) => (item.id === id ? [item, clone(item)] : [item]));

export const duplicateWeek = (program: ComposeProgram, id: NodeId): ComposeProgram => ({
  weeks: insertCloneAfter<ComposeWeek>(program.weeks, id, cloneWeek),
});

const mapDays = (week: ComposeWeek, days: ComposeDay[]): ComposeWeek => ({ ...week, days });

export const duplicateDay = (program: ComposeProgram, id: NodeId): ComposeProgram => ({
  weeks: program.weeks.map((week) =>
    mapDays(week, insertCloneAfter<ComposeDay>(week.days, id, cloneDay)),
  ),
});

const mapSessions = (day: ComposeDay, sessions: ComposeSession[]): ComposeDay => ({
  ...day,
  sessions,
});

export const duplicateSession = (program: ComposeProgram, id: NodeId): ComposeProgram => ({
  weeks: program.weeks.map((week) => ({
    ...week,
    days: week.days.map((day) =>
      mapSessions(day, insertCloneAfter<ComposeSession>(day.sessions, id, cloneSession)),
    ),
  })),
});

const mapBlocks = (session: ComposeSession, blocks: ComposeBlock[]): ComposeSession => ({
  ...session,
  blocks,
});

export const duplicateBlock = (program: ComposeProgram, id: NodeId): ComposeProgram => ({
  weeks: program.weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => ({
      ...day,
      sessions: day.sessions.map((session) =>
        mapBlocks(session, insertCloneAfter<ComposeBlock>(session.blocks, id, cloneBlock)),
      ),
    })),
  })),
});
