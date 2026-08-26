import { toUtcDateParam } from "../src/utils/date-param";

import {
  type BackfillTarget,
  GENERAL_CHANNEL,
  INDIVIDUAL_CHANNEL,
  type PublishChannel,
} from "./legacy-days-backfill-plan";

export const CONTENTLESS_WHERE = { where: { isRestDay: null } } as const;

export const FILLED_WHERE = { where: { isRestDay: { not: null } } } as const;

export type LedgerRow = {
  id: string;
  scheduledDate: Date;
  legacyRowId: number;
  link: {
    channel: string;
    legacyLevelId: number | null;
    legacyUserId: number | null;
    plan: { name: string };
  };
};

export type BackfillReader = {
  mobilePublishedDay: {
    findMany: (args: typeof CONTENTLESS_WHERE) => Promise<LedgerRow[]>;
    count: (args: typeof FILLED_WHERE) => Promise<number>;
  };
};

export type BackfillSnapshot = {
  targets: readonly BackfillTarget[];
  alreadyFilled: number;
};

const toChannel = (channel: string): PublishChannel => {
  if (channel === INDIVIDUAL_CHANNEL) {
    return INDIVIDUAL_CHANNEL;
  }

  if (channel === GENERAL_CHANNEL) {
    return GENERAL_CHANNEL;
  }

  throw new Error(
    `refusing to run: a publish link carries the channel ${channel}, which this backfill has no ` +
      "matching rule for. A channel it cannot match is a channel it must not guess at; nothing " +
      "was written.",
  );
};

const legacyTargetIdOf = (row: LedgerRow, channel: PublishChannel): number | null =>
  channel === INDIVIDUAL_CHANNEL ? row.link.legacyUserId : row.link.legacyLevelId;

export const toBackfillTarget = (row: LedgerRow): BackfillTarget => {
  const channel = toChannel(row.link.channel);

  return {
    dayId: row.id,
    planName: row.link.plan.name,
    channel,
    legacyTargetId: legacyTargetIdOf(row, channel),
    scheduledDate: toUtcDateParam(row.scheduledDate),
    legacyRowId: row.legacyRowId,
  };
};

export const loadBackfillSnapshot = async (reader: BackfillReader): Promise<BackfillSnapshot> => {
  const rows = await reader.mobilePublishedDay.findMany(CONTENTLESS_WHERE);
  const alreadyFilled = await reader.mobilePublishedDay.count(FILLED_WHERE);

  return { targets: rows.map(toBackfillTarget), alreadyFilled };
};
