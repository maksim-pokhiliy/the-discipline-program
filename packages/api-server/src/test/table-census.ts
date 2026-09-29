import { z } from "zod";

import { cleanupRaw } from "./helpers";

const REQUIRED_TABLES = ["_prisma_migrations", "users"];

const tableCensusSchema = z.array(
  z
    .object({
      tableName: z.string(),
      rowCount: z.number().int().nonnegative(),
    })
    .strict(),
);

export type TableCensus = ReadonlyMap<string, number>;

export const parseTableCensus = (rows: unknown): TableCensus => {
  const census = new Map(tableCensusSchema.parse(rows).map((row) => [row.tableName, row.rowCount]));
  const missingTables = REQUIRED_TABLES.filter((table) => !census.has(table));

  if (missingTables.length > 0) {
    throw new Error(
      `the table census misses ${missingTables.join(", ")}, so it does not see the application tables`,
    );
  }

  return census;
};

export const takeTableCensus = async (): Promise<TableCensus> =>
  parseTableCensus(
    await cleanupRaw.$queryRaw`
      SELECT
        table_name::text AS "tableName",
        (xpath(
          '/row/row_count/text()',
          query_to_xml(
            format('SELECT count(*) AS row_count FROM %I.%I', table_schema, table_name),
            false,
            true,
            ''
          )
        ))[1]::text::int AS "rowCount"
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `,
  );

export const describeGrownTables = (before: TableCensus, after: TableCensus): string[] =>
  [...after]
    .filter(([table, count]) => count > (before.get(table) ?? 0))
    .map(([table, count]) => `${table}: ${before.get(table) ?? 0} -> ${count}`);

export const findTablesGrownSince = async (before: TableCensus): Promise<string[]> =>
  describeGrownTables(before, await takeTableCensus());
