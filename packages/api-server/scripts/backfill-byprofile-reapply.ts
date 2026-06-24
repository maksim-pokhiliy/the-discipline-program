import { mkdirSync, writeFileSync } from "node:fs";

import { PrismaClient } from "@prisma/client";

import { GENDER_AXIS_VALUES, loadSchema } from "@repo/contracts/lms/_shared";

const WRITE = process.argv.includes("--write");
const backupDirArg = process.argv.find((arg) => arg.startsWith("--backup-dir="));
const BACKUP_DIR = backupDirArg === undefined ? "." : backupDirArg.slice("--backup-dir=".length);

const SYSTEM_GENDER_AXIS_ID = "cgender000000000000000000";
const GENDER_TOKENS = new Set(["m", "male", "f", "female"]);
const GENDER_KEY_TOKENS = new Set(["gender", "sex"]);
const GENDER_COORD_TO_VALUE: Record<string, string> = {
  m: "Male",
  male: "Male",
  f: "Female",
  female: "Female",
};

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

// distinct valid-cuid placeholder per plain axis, so the dry-run distinct-axisId check is meaningful
const placeholderCuid = (index: number): string => `c${`plain${index}`.padEnd(24, "0")}`;

const transform = (old: OldByProfile, plainAxisId: ReadonlyMap<string, string>) => {
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

    const axisId = plainAxisId.get(axis.name);

    if (axisId === undefined) {
      throw new Error(`no axisId resolved for plain axis ${JSON.stringify(axis.name)}`);
    }

    return { axisId, label: axis.name, values: axis.values, binding: null };
  });

  const cells = old.cells.map((cell) => ({
    kg: cell.kg,
    coords: cell.coords.map((coord, index) =>
      genderPositions.has(index) ? genderValueFor(coord) : coord,
    ),
  }));

  return { kind: "byProfile" as const, axes, cells };
};

const auditProfileSelections = async (): Promise<void> => {
  const profiles = await prisma.athleteProfile.findMany({
    select: { id: true, gender: true, profileSelections: true },
  });
  const withSelections = profiles.filter((p) => {
    const sel = p.profileSelections as Record<string, unknown> | null;

    return sel !== null && Object.keys(sel).length > 0;
  });

  console.log(
    `\nprofileSelections pre-flight: ${profiles.length} profiles, ${withSelections.length} with selections`,
  );
  let inertRisk = 0;

  for (const p of withSelections) {
    const keys = Object.keys(p.profileSelections as Record<string, unknown>);
    const nonGenderKeys = keys.filter((k) => !GENDER_KEY_TOKENS.has(k.trim().toLowerCase()));
    const flag =
      nonGenderKeys.length > 0
        ? `  ⚠️ non-gender name-keys go inert post-backfill: ${JSON.stringify(nonGenderKeys)}`
        : "";

    if (nonGenderKeys.length > 0) {
      inertRisk += 1;
    }

    console.log(`  ${p.id} gender=${p.gender ?? "null"} keys=${JSON.stringify(keys)}${flag}`);
  }
  console.log(
    inertRisk === 0
      ? `  → 0 inert-risk: every saved selection is gender-keyed (resolves from the typed column). PAC-2 safely stays W3.`
      : `  → ${inertRisk} profile(s) carry a non-gender name-keyed pick that would go inert until PAC-2 (W3) — review before cutover.`,
  );
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

  // distinct plain (non-gender) axis names -> union of their values across loads
  const plainValues = new Map<string, Set<string>>();

  for (const r of pending) {
    for (const axis of (r.load as unknown as OldByProfile).axes) {
      if (isGenderAxis(axis.values)) {
        continue;
      }

      const set = plainValues.get(axis.name) ?? new Set<string>();

      axis.values.forEach((v) => set.add(v));
      plainValues.set(axis.name, set);
    }
  }
  console.log(`distinct plain axes: ${JSON.stringify([...plainValues.keys()])}`);

  // one catalog row per distinct plain axis name (find-or-create) — general, not hardcoded to "level"
  const plainAxisId = new Map<string, string>();
  let placeholderIndex = 0;

  for (const [name, valuesSet] of plainValues) {
    const values = [...valuesSet].sort();
    const existing = await prisma.profileAxis.findUnique({ where: { key: name } });

    if (existing !== null) {
      plainAxisId.set(name, existing.id);
      console.log(`plain axis "${name}" exists: ${existing.id}`);
    } else if (WRITE) {
      const created = await prisma.profileAxis.create({ data: { key: name, label: name, values } });

      plainAxisId.set(name, created.id);
      console.log(
        `plain axis "${name}" CREATED: ${created.id} (binding=null, values ${JSON.stringify(values)})`,
      );
    } else {
      const placeholder = placeholderCuid(placeholderIndex);

      plainAxisId.set(name, placeholder);
      console.log(
        `plain axis "${name}" MISSING — WRITE creates it (values ${JSON.stringify(values)}); dry-run placeholder ${placeholder}`,
      );
    }

    placeholderIndex += 1;
  }

  await auditProfileSelections();

  const updates: { id: string; load: ReturnType<typeof transform> }[] = [];
  let failed = 0;

  console.log("");
  for (const r of pending) {
    const old = r.load as unknown as OldByProfile;
    const classification = old.axes
      .map((a) => `${a.name}->${isGenderAxis(a.values) ? "GENDER" : "plain"}`)
      .join(", ");
    const next = transform(old, plainAxisId);
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
