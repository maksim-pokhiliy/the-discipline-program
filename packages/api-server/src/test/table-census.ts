import { z } from "zod";

import { prisma } from "../db/client";

const tableCensusSchema = z.array(
  z
    .object({
      tableName: z.string(),
      rowCount: z.number().int().nonnegative(),
    })
    .strict(),
);

export type TableCensus = ReadonlyMap<string, number>;

export const takeTableCensus = async (): Promise<TableCensus> => {
  const rows = tableCensusSchema.parse(
    await prisma.$queryRaw`
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

  return new Map(rows.map((row) => [row.tableName, row.rowCount]));
};

export const describeGrownTables = (before: TableCensus, after: TableCensus): string[] =>
  [...after]
    .filter(([table, count]) => count > (before.get(table) ?? 0))
    .map(([table, count]) => `${table}: ${before.get(table) ?? 0} -> ${count}`);
