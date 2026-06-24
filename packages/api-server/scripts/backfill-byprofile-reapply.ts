import { mkdirSync, writeFileSync } from "node:fs";

import { PrismaClient } from "@prisma/client";

import { GENDER_AXIS_VALUES, loadSchema } from "@repo/contracts/lms/_shared";

const WRITE = process.argv.includes("--write");

const SYSTEM_GENDER_AXIS_ID = "cgender000000000000000000";
const PLACEHOLDER_LEVEL_ID = "clevelplaceholder00000000";
const GENDER_TOKENS = new Set(["m", "male", "f", "female"]);
const GENDER_COORD_TO_VALUE: Record<string, string> = {
  m: "Male",
  male: "Male",
  f: "Female",
  female: "Female",
};

const backupDirArg = process.argv.find((arg) => arg.startsWith("--backup-dir="));
const BACKUP_DIR = backupDirArg === undefined ? "." : backupDirArg.slice("--backup-dir=".length);

interface OldAxis {
  name: string;
  values: string[];
}
interface OldCell {
  coords: string[];
  kg: number;
}
interface OldByProfile {
  kind: "byProfile";
  axes: OldAxis[];
  cells: OldCell[];
}

const prisma = new PrismaClient();

const isGenderAxis = (values: string[]): boolean =>
  values.length > 0 && values.every((v) => GENDER_TOKENS.has(v.trim().toLowerCase()));

const genderValueFor = (coord: string): string => {
  const mapped = GENDER_COORD_TO_VALUE[coord.trim().toLowerCase()];

  if (mapped === undefined) {
    throw new Error(`unmappable gender coord ${JSON.stringify(coord)}`);
  }

  return mapped;
};

const isAlreadyMigrated = (load: unknown): boolean => {
  const axes = (load as { axes?: unknown[] })?.axes;

  return (
    Array.isArray(axes) &&
    axes.length > 0 &&
    typeof (axes[0] as { axisId?: unknown })?.axisId === "string"
  );
};

const transform = (old: OldByProfile, levelAxisId: string) => {
  const genderPositions = new Set<number>();

  const axes = old.axes.map((axis, index) => {
    if (isGenderAxis(axis.values)) {
      genderPositions.add(index);

      return {
        axisId: SYSTEM_GENDER_AXIS_ID,
        label: "Gender",
        values: [...GENDER_AXIS_VALUES],
        binding: "GENDER",
      };
    }

    return { axisId: levelAxisId, label: axis.name, values: axis.values, binding: null };
  });

  const cells = old.cells.map((cell) => ({
    kg: cell.kg,
    coords: cell.coords.map((coord, index) =>
      genderPositions.has(index) ? genderValueFor(coord) : coord,
    ),
  }));

  return { kind: "byProfile" as const, axes, cells };
};

const main = async (): Promise<void> => {
  console.log(`\n=== byProfile re-apply backfill — mode: ${WRITE ? "WRITE" : "DRY-RUN"} ===\n`);

  const rows = await prisma.schemaRow.findMany({
    where: { load: { path: ["kind"], equals: "byProfile" } },
    select: { id: true, load: true },
  });

  console.log(`byProfile rows found: ${rows.length}`);

  const pending = rows.filter((r) => !isAlreadyMigrated(r.load));

  console.log(`already migrated (skipped): ${rows.length - pending.length}`);

  const levelValues = new Set<string>();

  for (const r of pending) {
    for (const axis of (r.load as unknown as OldByProfile).axes) {
      if (!isGenderAxis(axis.values)) {
        axis.values.forEach((v) => levelValues.add(v));
      }
    }
  }
  const levelValuesArr = [...levelValues].sort();

  console.log(
    `plain "level" catalog values (union across loads): ${JSON.stringify(levelValuesArr)}`,
  );

  let levelAxisId = PLACEHOLDER_LEVEL_ID;
  const existingLevel = await prisma.profileAxis.findUnique({ where: { key: "level" } });

  if (existingLevel) {
    levelAxisId = existingLevel.id;
    console.log(`"level" axis already exists: ${levelAxisId}`);
  } else if (WRITE) {
    const created = await prisma.profileAxis.create({
      data: { key: "level", label: "level", values: levelValuesArr },
    });

    levelAxisId = created.id;
    console.log(`"level" axis CREATED: ${levelAxisId} (binding=null)`);
  } else {
    console.log(
      `"level" axis MISSING — WRITE would create it; dry-run validates with placeholder ${PLACEHOLDER_LEVEL_ID}`,
    );
  }

  const updates: { id: string; load: ReturnType<typeof transform> }[] = [];
  let failed = 0;

  for (const r of pending) {
    const old = r.load as unknown as OldByProfile;
    const classification = old.axes
      .map((a) => `${a.name}->${isGenderAxis(a.values) ? "GENDER" : "level"}`)
      .join(", ");
    const next = transform(old, levelAxisId);
    const parsed = loadSchema.safeParse(next);

    if (!parsed.success) {
      failed += 1;
      console.log(`\nFAIL ${r.id}  [${classification}]`);
      console.log(`  before: ${JSON.stringify(old)}`);
      console.log(`  after:  ${JSON.stringify(next)}`);
      console.log(`  issues: ${JSON.stringify(parsed.error.issues)}`);
      continue;
    }

    console.log(
      `OK   ${r.id}  [${classification}]  axes=${next.axes.length} cells=${next.cells.length}`,
    );
    updates.push({ id: r.id, load: next });
  }

  console.log(
    `\nsummary: ${updates.length} valid / ${failed} failed / ${rows.length - pending.length} skipped (of ${rows.length})`,
  );

  if (failed > 0) {
    console.log(`\n❌ ${failed} load(s) failed loadSchema validation — NO writes performed.`);
    process.exitCode = 1;

    return;
  }

  if (!WRITE) {
    console.log(
      `\n✅ DRY-RUN OK — every transformed load is valid under the design-A loadSchema. Re-run with --write to apply.`,
    );

    return;
  }

  mkdirSync(BACKUP_DIR, { recursive: true });
  const backupPath = `${BACKUP_DIR}/backfill-backup-${Date.now()}.json`;

  writeFileSync(backupPath, JSON.stringify(pending, null, 2));
  console.log(`\nbackup of ${pending.length} original loads written: ${backupPath}`);

  await prisma.$transaction(
    updates.map((u) => prisma.schemaRow.update({ where: { id: u.id }, data: { load: u.load } })),
  );
  console.log(`\n✅ WROTE ${updates.length} loads in one transaction.`);

  const reread = await prisma.schemaRow.findMany({
    where: { id: { in: updates.map((u) => u.id) } },
    select: { id: true, load: true },
  });
  const stillInvalid = reread.filter((r) => !loadSchema.safeParse(r.load).success);

  console.log(
    `post-write re-validation: ${reread.length - stillInvalid.length}/${reread.length} valid`,
  );

  if (stillInvalid.length > 0) {
    console.log(
      `❌ ${stillInvalid.length} row(s) invalid after write: ${stillInvalid.map((r) => r.id).join(", ")}`,
    );
    process.exitCode = 1;
  }
};

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
