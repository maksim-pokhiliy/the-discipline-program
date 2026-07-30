import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";

import { prisma } from "../src/db/client";
import {
  classifyProfileSelections,
  type ProfileSelectionAxis,
  type SelectionVerdict,
} from "../src/endpoints/coaching/profile-selections-guard";

const VERDICT_LABEL: Record<SelectionVerdict, string> = {
  ok: "OK",
  orphan: "ORPHAN",
  stale: "STALE",
  bound: "REJECTED",
};

export type AuditProfile = { id: string; selections: Record<string, string> };

export type AuditRow = { profileId: string; key: string; value: string; verdict: SelectionVerdict };

export type AuditTotals = Record<SelectionVerdict, number>;

export type AuditReport = { rows: AuditRow[]; totals: AuditTotals; hasRejectedKeys: boolean };

export const buildAuditReport = (
  profiles: readonly AuditProfile[],
  axes: readonly ProfileSelectionAxis[],
): AuditReport => {
  const rows: AuditRow[] = [];
  const totals: AuditTotals = { ok: 0, orphan: 0, stale: 0, bound: 0 };

  for (const profile of profiles) {
    for (const entry of classifyProfileSelections(profile.selections, axes)) {
      rows.push({
        profileId: profile.id,
        key: entry.key,
        value: entry.value,
        verdict: entry.verdict,
      });
      totals[entry.verdict] += 1;
    }
  }

  return { rows, totals, hasRejectedKeys: totals.bound > 0 };
};

const rawSelectionsSchema = z.record(z.string(), z.string()).nullable();

const loadProfiles = async (): Promise<{ profiles: AuditProfile[]; malformed: string[] }> => {
  const rows = await prisma.athleteProfile.findMany({
    select: { id: true, profileSelections: true },
  });

  const profiles: AuditProfile[] = [];
  const malformed: string[] = [];

  for (const row of rows) {
    const parsed = rawSelectionsSchema.safeParse(row.profileSelections);

    if (!parsed.success) {
      malformed.push(row.id);
      continue;
    }

    const selections = parsed.data;

    if (selections === null || Object.keys(selections).length === 0) {
      continue;
    }

    profiles.push({ id: row.id, selections });
  }

  return { profiles, malformed };
};

const loadAxes = async (): Promise<ProfileSelectionAxis[]> =>
  prisma.profileAxis.findMany({
    select: { id: true, label: true, values: true, binding: true },
  });

const printReport = (report: AuditReport): void => {
  console.log(`\nper-key verdicts (profileId · key · value · verdict):\n`);

  for (const row of report.rows) {
    console.log(
      `  ${row.profileId} · ${row.key} · ${JSON.stringify(row.value)} · ${VERDICT_LABEL[row.verdict]}`,
    );
  }

  const { totals } = report;

  console.log(
    `\ntotals: OK=${totals.ok} ORPHAN=${totals.orphan} STALE=${totals.stale} REJECTED=${totals.bound}`,
  );

  console.log(
    `\nORPHAN and STALE are INFORMATIONAL ONLY — the guard writes both through unchanged. ` +
      `They are not inert: a published plan carries its own axis snapshot, so a key the ` +
      `catalogue has dropped, or a value the catalogue has renamed, can still resolve a ` +
      `weight for every session built from that plan. Only REJECTED gates the merge.`,
  );
};

const main = async (): Promise<void> => {
  try {
    console.log(`\n=== profileSelections guard audit (read-only, no writes) ===\n`);

    const { profiles, malformed } = await loadProfiles();
    const axes = await loadAxes();

    console.log(`profiles with non-empty profileSelections: ${profiles.length}`);
    console.log(`profile axes in catalogue: ${axes.length}`);

    if (malformed.length > 0) {
      console.log(
        `\n⚠️ ${malformed.length} profile(s) with a malformed profileSelections shape ` +
          `(not classifiable, reported only): ${malformed.join(", ")}`,
      );
    }

    const report = buildAuditReport(profiles, axes);

    printReport(report);

    if (report.hasRejectedKeys) {
      console.log(
        `\n❌ ${report.totals.bound} REJECTED key(s) — the guard would 400 the next profile write ` +
          `for those athletes. Merge is blocked; the data correction is an owner decision.`,
      );
      process.exitCode = 1;

      return;
    }

    console.log(`\n✅ 0 REJECTED — no stored key targets a bound axis. The guard is safe to ship.`);
  } finally {
    await prisma.$disconnect();
  }
};

const entryPath = process.argv[1];
const isDirectRun =
  entryPath !== undefined && resolve(entryPath) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
