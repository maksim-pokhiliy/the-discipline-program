import { mkdirSync, writeFileSync } from "node:fs";

import { PrismaClient } from "@prisma/client";
import { z } from "zod";

import { profileSelectionsSchema } from "@repo/contracts/coaching/athlete-profile";

import {
  classifyKey,
  normalizeAxisName,
  reKeyProfileSelections,
  type RekeyResult,
} from "../src/utils/profile-selections-rekey";

const WRITE = process.argv.includes("--write");
const backupDirArg = process.argv.find((arg) => arg.startsWith("--backup-dir="));
const BACKUP_DIR = backupDirArg === undefined ? "." : backupDirArg.slice("--backup-dir=".length);

const prisma = new PrismaClient();

const rawSelectionsSchema = z.record(z.string(), z.string()).nullable();

type Profile = { id: string; gender: string | null; selections: Record<string, string> };
type ProfilePlan = {
  id: string;
  gender: string | null;
  result: RekeyResult;
  isValid: boolean;
};

const placeholderCuid = (index: number): string => `c${`name${index}`.padEnd(24, "0")}`;

const loadProfiles = async (): Promise<Profile[]> => {
  const rows = await prisma.athleteProfile.findMany({
    select: { id: true, gender: true, profileSelections: true },
  });

  return rows.flatMap((row) => {
    const selections = rawSelectionsSchema.parse(row.profileSelections);

    if (selections === null || Object.keys(selections).length === 0) {
      return [];
    }

    return [{ id: row.id, gender: row.gender, selections }];
  });
};

const collectNames = (profiles: Profile[]): Map<string, string> => {
  const names = new Map<string, string>();

  for (const profile of profiles) {
    for (const key of Object.keys(profile.selections)) {
      if (classifyKey(key) === "name") {
        names.set(normalizeAxisName(key), key.trim());
      }
    }
  }

  return names;
};

const resolveAxisIdByName = async (names: Map<string, string>): Promise<Record<string, string>> => {
  const axisIdByName: Record<string, string> = {};
  let placeholderIndex = 0;

  for (const [normalized, original] of names) {
    const existing = await prisma.profileAxis.findUnique({ where: { key: original } });

    if (existing !== null) {
      axisIdByName[normalized] = existing.id;
      console.log(`name "${original}" resolves to existing axis ${existing.id}`);
    } else if (WRITE) {
      const created = await prisma.profileAxis.create({
        data: { key: original, label: original, values: [original] },
      });

      axisIdByName[normalized] = created.id;
      console.log(`name "${original}" CREATED axis ${created.id} (binding=null)`);
    } else {
      const placeholder = placeholderCuid(placeholderIndex);

      axisIdByName[normalized] = placeholder;
      console.log(
        `name "${original}" MISSING — WRITE creates it; dry-run placeholder ${placeholder}`,
      );
    }

    placeholderIndex += 1;
  }

  return axisIdByName;
};

const auditProfiles = (profiles: Profile[]): void => {
  const counts = { cuid: 0, genderDrop: 0, genderFlag: 0, name: 0 };

  console.log(`\nprofileSelections audit: ${profiles.length} profile(s) with selections`);

  for (const profile of profiles) {
    const keys = Object.keys(profile.selections);
    const summary = keys.map((key) => {
      const kind = classifyKey(key);

      if (kind === "cuid") {
        counts.cuid += 1;
      } else if (kind === "gender") {
        if (profile.gender !== null) {
          counts.genderDrop += 1;
        } else {
          counts.genderFlag += 1;
        }
      } else {
        counts.name += 1;
      }

      return `${key}->${kind}`;
    });

    console.log(
      `  ${profile.id} gender=${profile.gender ?? "null"} keys=${JSON.stringify(summary)}`,
    );
  }

  console.log(
    `\n  totals: cuid-keep=${counts.cuid} gender-drop=${counts.genderDrop} ` +
      `gender-flag=${counts.genderFlag} name-rekey=${counts.name}`,
  );
};

const planProfile = (profile: Profile, axisIdByName: Record<string, string>): ProfilePlan => {
  const result = reKeyProfileSelections(profile.selections, profile.gender !== null, axisIdByName);
  const isValid = profileSelectionsSchema.safeParse(result.next).success;

  return { id: profile.id, gender: profile.gender, result, isValid };
};

const printPlan = (plan: ProfilePlan): void => {
  const { id, result, isValid } = plan;

  console.log(`\n${isValid ? "OK  " : "FAIL"} ${id}`);
  console.log(`  re-keys: ${JSON.stringify(result.next)}`);
  console.log(`  drops:   ${JSON.stringify(result.drops)}`);
  console.log(`  flags:   ${JSON.stringify(result.flags)}`);
};

const applyWrites = async (profiles: Profile[], plans: ProfilePlan[]): Promise<void> => {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const backupPath = `${BACKUP_DIR}/profileselections-backup-${Date.now()}.json`;
  const originals = profiles.map((profile) => ({ id: profile.id, selections: profile.selections }));

  writeFileSync(backupPath, JSON.stringify(originals, null, 2));
  console.log(`\nbackup of ${originals.length} original selections written: ${backupPath}`);

  await prisma.$transaction(
    plans.map((plan) =>
      prisma.athleteProfile.update({
        where: { id: plan.id },
        data: { profileSelections: plan.result.next },
      }),
    ),
  );
  console.log(`\n✅ WROTE ${plans.length} profile(s) in one transaction.`);

  const reread = await prisma.athleteProfile.findMany({
    where: { id: { in: plans.map((plan) => plan.id) } },
    select: { id: true, profileSelections: true },
  });
  const stillInvalid = reread.filter(
    (row) => !profileSelectionsSchema.safeParse(row.profileSelections).success,
  );

  console.log(
    `post-write re-validation: ${reread.length - stillInvalid.length}/${reread.length} valid`,
  );

  if (stillInvalid.length > 0) {
    console.log(`❌ invalid after write: ${stillInvalid.map((row) => row.id).join(", ")}`);
    process.exitCode = 1;
  }
};

const main = async (): Promise<void> => {
  console.log(
    `\n=== profileSelections re-key backfill — mode: ${WRITE ? "WRITE" : "DRY-RUN"} ===\n`,
  );

  const profiles = await loadProfiles();

  console.log(`profiles with non-empty selections: ${profiles.length}`);

  auditProfiles(profiles);

  const axisIdByName = await resolveAxisIdByName(collectNames(profiles));
  const plans = profiles.map((profile) => planProfile(profile, axisIdByName));

  plans.forEach(printPlan);

  const flagged = plans.filter((plan) => plan.result.flags.length > 0);
  const invalid = plans.filter((plan) => !plan.isValid);

  console.log(
    `\nsummary: ${plans.length} planned / ${flagged.length} flagged / ${invalid.length} invalid`,
  );

  if (flagged.length > 0 || invalid.length > 0) {
    console.log(
      `\n❌ ${flagged.length} flagged + ${invalid.length} invalid — NO writes performed.`,
    );
    process.exitCode = 1;

    return;
  }

  if (!WRITE) {
    console.log(`\n✅ DRY-RUN OK — every re-keyed map is valid. Re-run with --write to apply.`);

    return;
  }

  await applyWrites(profiles, plans);
};

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
