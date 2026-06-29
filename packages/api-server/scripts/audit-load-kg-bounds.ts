import { PrismaClient } from "@prisma/client";

import { kgSchema } from "@repo/contracts/lms/_shared";

const prisma = new PrismaClient();

type Violation = {
  source: string;
  rowId: string;
  path: string;
  value: unknown;
  issues: string;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;

const checkKg = (
  source: string,
  rowId: string,
  path: string,
  value: unknown,
  out: Violation[],
): void => {
  const parsed = kgSchema.safeParse(value);

  if (!parsed.success) {
    out.push({
      source,
      rowId,
      path,
      value,
      issues: parsed.error.issues.map((issue) => issue.message).join("; "),
    });
  }
};

const auditLoads = async (out: Violation[]): Promise<number> => {
  const rows = await prisma.schemaRow.findMany({ select: { id: true, load: true } });
  let checked = 0;

  for (const row of rows) {
    const load = asRecord(row.load);

    if (load === null) {
      continue;
    }

    if (load.kind === "absolute") {
      checked += 1;
      checkKg("load.absolute", row.id, "kg", load.kg, out);
    }

    if (load.kind === "byProfile" && Array.isArray(load.cells)) {
      load.cells.forEach((cellRaw, index) => {
        const cell = asRecord(cellRaw);

        checked += 1;
        checkKg("load.byProfile", row.id, `cells[${index}].kg`, cell?.kg, out);
      });
    }
  }

  return checked;
};

const auditResults = async (out: Violation[]): Promise<number> => {
  const results = await prisma.benchmarkResult.findMany({ select: { id: true, result: true } });
  let checked = 0;

  for (const record of results) {
    const result = asRecord(record.result);

    if (result?.type === "load") {
      checked += 1;
      checkKg("result.load", record.id, "kg", result.kg, out);
    }
  }

  return checked;
};

const main = async (): Promise<void> => {
  console.log("\n=== kgSchema prod-data audit (read-only) ===\n");

  const violations: Violation[] = [];
  const loadKgChecked = await auditLoads(violations);
  const resultKgChecked = await auditResults(violations);

  console.log(`load.kg values checked:   ${loadKgChecked}`);
  console.log(`result.kg values checked: ${resultKgChecked}`);
  console.log(`total kg values checked:  ${loadKgChecked + resultKgChecked}`);

  if (violations.length === 0) {
    console.log("\n✅ 0 violations — every stored kg satisfies kgSchema. Tightening is safe.");

    return;
  }

  console.log(`\n❌ ${violations.length} violation(s) — tightening would 500 on read for these:\n`);

  for (const v of violations) {
    console.log(
      `  [${v.source}] row=${v.rowId} ${v.path}=${JSON.stringify(v.value)} — ${v.issues}`,
    );
  }

  process.exitCode = 1;
};

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
