import { describe, expect, it } from "vitest";

import { cleanupRaw, createTestProduct } from "./helpers";
import {
  describeGrownTables,
  findTablesGrownSince,
  parseTableCensus,
  takeTableCensus,
} from "./table-census";

const PRODUCTS_TABLE = "app_products";

const CENSUS_WITH_REQUIRED_TABLES = [
  { tableName: "_prisma_migrations", rowCount: 7 },
  { tableName: "users", rowCount: 2 },
];

describe("describeGrownTables", () => {
  it("reports a grown table as its name with the count before and after", () => {
    expect(describeGrownTables(new Map([["users", 2]]), new Map([["users", 5]]))).toEqual([
      "users: 2 -> 5",
    ]);
  });

  it("reports neither a table that kept its count nor one that shrank", () => {
    const before = new Map([
      ["users", 3],
      ["training_weeks", 4],
    ]);
    const after = new Map([
      ["users", 3],
      ["training_weeks", 1],
    ]);

    expect(describeGrownTables(before, after)).toEqual([]);
  });

  it("reports a table that appears as grown from zero", () => {
    expect(describeGrownTables(new Map(), new Map([["training_weeks", 2]]))).toEqual([
      "training_weeks: 0 -> 2",
    ]);
  });
});

describe("parseTableCensus", () => {
  it("reads the count of every table", () => {
    expect(parseTableCensus(CENSUS_WITH_REQUIRED_TABLES)).toEqual(
      new Map([
        ["_prisma_migrations", 7],
        ["users", 2],
      ]),
    );
  });

  it("refuses an empty census", () => {
    expect(() => parseTableCensus([])).toThrow("the table census misses _prisma_migrations, users");
  });

  it("refuses a census that misses the users table", () => {
    expect(() => parseTableCensus([{ tableName: "_prisma_migrations", rowCount: 7 }])).toThrow(
      "the table census misses users",
    );
  });
});

describe("findTablesGrownSince", () => {
  it("names a table that grew from a non-zero count and nothing once its rows are gone", async () => {
    const firstProduct = await createTestProduct();
    const productIds = [firstProduct.id];

    try {
      const before = await takeTableCensus();
      const productsBefore = before.get(PRODUCTS_TABLE) ?? 0;
      const secondProduct = await createTestProduct();

      productIds.push(secondProduct.id);

      expect(productsBefore).toBeGreaterThan(0);
      expect(await findTablesGrownSince(before)).toEqual([
        `${PRODUCTS_TABLE}: ${productsBefore} -> ${productsBefore + 1}`,
      ]);

      await cleanupRaw.product.deleteMany({ where: { id: { in: productIds } } });

      expect(await findTablesGrownSince(before)).toEqual([]);
    } finally {
      await cleanupRaw.product.deleteMany({ where: { id: { in: productIds } } });
    }
  });
});
