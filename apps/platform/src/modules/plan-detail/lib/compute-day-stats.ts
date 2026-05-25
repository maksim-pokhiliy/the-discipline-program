import type { SessionWithLabel } from "@repo/contracts/lms/day";

const EST_MINUTES_PATTERN = /(\d+)\s*min(?![a-z])/i;

export type DayStats = {
  blocks: number;
  schemas: number;
  estMinutes: number;
};

const parseSessionEstMinutes = (notes: string | null): number => {
  if (notes === null) {
    return 0;
  }

  const match = EST_MINUTES_PATTERN.exec(notes);

  if (match === null) {
    return 0;
  }

  const parsed = Number.parseInt(match[1] ?? "", 10);

  return Number.isNaN(parsed) ? 0 : parsed;
};

export const computeDayStats = (sessions: SessionWithLabel[]): DayStats => {
  let blocks = 0;
  let schemas = 0;
  let estMinutes = 0;

  for (const session of sessions) {
    blocks += session.blocks.length;

    for (const block of session.blocks) {
      schemas += block.schemas.length;
    }

    estMinutes += parseSessionEstMinutes(session.notes);
  }

  return { blocks, schemas, estMinutes };
};
