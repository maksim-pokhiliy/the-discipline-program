import {
  dayContentHash,
  toHashable,
} from "../src/endpoints/coaching/mobile-publish/day-content-hash";

import {
  type BackfillAction,
  type BackfillConflict,
  type BackfillPlan,
  type BackfillTarget,
  type BackfillWarning,
  describeDay,
  describeLegacyRow,
  legacyDayKey,
  tableForChannel,
} from "./legacy-days-backfill-plan";
import type { BackfillSnapshot } from "./legacy-days-backfill-snapshot";
import type {
  LegacyDaysDefect,
  NormalizedLegacyDay,
  ParsedLegacyDays,
} from "./legacy-days-backfill-source";

const defectToConflict = (defect: LegacyDaysDefect): BackfillConflict => ({
  subject: describeLegacyRow(defect.table, defect.legacyRowId),
  planName: null,
  reason: defect.reason,
  detail: defect.detail,
});

const indexLegacyDays = (
  rows: readonly NormalizedLegacyDay[],
): ReadonlyMap<string, readonly NormalizedLegacyDay[]> => {
  const byKey = new Map<string, NormalizedLegacyDay[]>();

  for (const row of rows) {
    const key = legacyDayKey(row.table, row.legacyTargetId, row.scheduledDate);

    byKey.set(key, [...(byKey.get(key) ?? []), row]);
  }

  return byKey;
};

const olderRowConflict = (
  target: BackfillTarget,
  legacy: NormalizedLegacyDay,
): BackfillConflict => ({
  subject: describeDay(target),
  planName: target.planName,
  reason: "legacy-row-older-than-ledger",
  detail:
    `the legacy row on this day is ${String(legacy.legacyRowId)}, older than the ` +
    `${String(target.legacyRowId)} the ledger already points at, so it cannot be the ` +
    "re-publish that replaced it; something is out of order and a backfill may not guess which " +
    "of the two the athlete saw",
});

const actionFor = (target: BackfillTarget, legacy: NormalizedLegacyDay): BackfillAction => ({
  kind: legacy.legacyRowId === target.legacyRowId ? "fill" : "fill-from-newer-row",
  target,
  content: {
    legacyRowId: legacy.legacyRowId,
    isRestDay: legacy.isRestDay,
    dailyProgram: legacy.dailyProgram,
  },
  contentHash: dayContentHash(toHashable(legacy.isRestDay, legacy.dailyProgram)),
});

const missingLinkConflict = (target: BackfillTarget): BackfillConflict => ({
  subject: describeDay(target),
  planName: target.planName,
  reason: "link-missing-channel-id",
  detail:
    `the publish link carries no legacy id for its ${target.channel} channel, so there is no ` +
    "legacy day it could be matched against",
});

const namedRowIds = (candidates: readonly NormalizedLegacyDay[]): string =>
  [...candidates]
    .map((row) => row.legacyRowId)
    .sort((left, right) => left - right)
    .join(", ");

const duplicateConflict = (
  target: BackfillTarget,
  candidates: readonly NormalizedLegacyDay[],
): BackfillConflict => ({
  subject: describeDay(target),
  planName: target.planName,
  reason: "duplicate-legacy-row",
  detail:
    `legacy rows ${namedRowIds(candidates)} all sit on this day, and guessing which one the ` +
    "athlete saw is not something a backfill may do",
});

const missingWarning = (target: BackfillTarget): BackfillWarning => ({
  subject: describeDay(target),
  planName: target.planName,
  kind: "missing-in-legacy",
  detail:
    "no legacy day exists on this date; the row is left as it is and keeps answering not-found, " +
    "which is what it does today",
});

export const classifyBackfill = (
  source: ParsedLegacyDays,
  snapshot: BackfillSnapshot,
): BackfillPlan => {
  const byKey = indexLegacyDays(source.rows);
  const conflicts: BackfillConflict[] = source.defects.map(defectToConflict);
  const warnings: BackfillWarning[] = [];
  const actions: BackfillAction[] = [];

  for (const target of snapshot.targets) {
    if (target.legacyTargetId === null) {
      conflicts.push(missingLinkConflict(target));

      continue;
    }

    const candidates =
      byKey.get(
        legacyDayKey(tableForChannel(target.channel), target.legacyTargetId, target.scheduledDate),
      ) ?? [];
    const [legacy] = candidates;

    if (legacy === undefined) {
      warnings.push(missingWarning(target));

      continue;
    }

    if (candidates.length > 1) {
      conflicts.push(duplicateConflict(target, candidates));

      continue;
    }

    if (legacy.legacyRowId < target.legacyRowId) {
      conflicts.push(olderRowConflict(target, legacy));

      continue;
    }

    actions.push(actionFor(target, legacy));
  }

  return { actions, conflicts, warnings, alreadyFilled: snapshot.alreadyFilled };
};
