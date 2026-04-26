import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

type Statement = { label: string; sql: string };

const SQL_FILE_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "prisma",
  "sql",
  "lms-checks.sql",
);

function splitStatements(raw: string): Statement[] {
  const blocks = raw.split(/\n(?=DO \$\$)/u);

  return blocks
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block, index) => {
      const constraintMatch = block.match(/CONSTRAINT\s+(\w+)/u);
      const label = constraintMatch ? constraintMatch[1] : `statement_${index + 1}`;
      const sql = block.endsWith(";") ? block : `${block};`;

      return { label, sql };
    });
}

async function main(): Promise<void> {
  const raw = await readFile(SQL_FILE_PATH, "utf8");
  const statements = splitStatements(raw);

  if (statements.length === 0) {
    console.error("[apply-sql-checks] no statements found in lms-checks.sql");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement.sql);
      console.log(`[apply-sql-checks] applied ${statement.label}`);
    }
    console.log(`[apply-sql-checks] done (${statements.length} constraints)`);
  } catch (error) {
    console.error("[apply-sql-checks] failed", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
