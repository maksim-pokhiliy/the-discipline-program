import { readFileSync } from "node:fs";

import { type Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { cleanupRaw } from "../../../test/helpers";
import { takeTableCensus } from "../../../test/table-census";

const SQL = readFileSync(
  new URL(
    "../../../../prisma/migrations/20261125120000_cms_product_translations/migration.sql",
    import.meta.url,
  ),
  "utf8",
);
const STATEMENTS = SQL.split(/^-- .*$/m)
  .map((statement) => statement.trim())
  .filter(Boolean);
const STATEMENT_HEADERS = [
  "-- SetLockTimeout",
  "-- AssertProductFeaturesHaveNoNullEntry",
  "-- AlterTable",
  "-- CreateTable",
  "-- CreateIndex",
  "-- CreateIndex",
  "-- AddForeignKey",
  "-- AddForeignKey",
  "-- BackfillFeatureListAndWordsClock",
];
const TX_TIMEOUT = 30_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FEATURES = ["Zone 2 work", 'Coach\'s "notes"', "Zone 2 work", "Ліміт 100%", "Back\\slash"];
const PRODUCT_ID = "product-expand-fixture";
const EMPTY_ID = "product-expand-empty";
const NULL_ID = "product-expand-null";
const DELETED_ID = "product-expand-deleted";
const BAD_ID = "product-expand-null-entry";
const LOCALE = "zz";
const TRANSLATION_ID = "product-expand-translation";
const CREATED_AT = new Date("2026-01-01T10:00:00.123Z");
const UPDATED_AT = new Date("2026-02-01T10:00:00.456Z");
const DELETED_AT = new Date("2026-03-01T10:00:00.789Z");
const TRANSLATION = {
  id: TRANSLATION_ID,
  productId: PRODUCT_ID,
  locale: LOCALE,
  title: "Synthetic translation",
  description: "Synthetic words",
  featureList: [],
  isActive: true,
};

type LegacyProduct = {
  id: string;
  slug: string;
  title: string;
  description: string;
  features: (string | null)[] | null;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};
type ExpandedProduct = LegacyProduct & {
  featureList: Prisma.JsonValue;
  imageUrl: string | null;
  wordsUpdatedAt: Date;
};

class RollbackObservations extends Error {
  constructor(readonly observations: object) {
    super("Roll back the migration observations");
  }
}

const seedProduct = async (
  tx: Prisma.TransactionClient,
  id: string,
  features: readonly (string | null)[] | null,
  deletedAt: Date | null = null,
): Promise<void> => {
  const featureJson = features === null ? null : JSON.stringify(features);

  await tx.$executeRaw`
    INSERT INTO "app_products"
      ("id", "slug", "title", "description", "features", "isFeatured", "isActive",
       "createdAt", "updatedAt", "deletedAt")
    VALUES (
      ${id}, ${id}, 'Synthetic product', 'Synthetic description',
      CASE WHEN ${featureJson}::jsonb IS NULL THEN NULL
        ELSE ARRAY(SELECT jsonb_array_elements_text(${featureJson}::jsonb)) END,
      true, false, ${CREATED_AT}, ${UPDATED_AT}, ${deletedAt}
    )
  `;
};

const readLegacyProducts = (tx: Prisma.TransactionClient): Promise<LegacyProduct[]> =>
  tx.$queryRaw`
    SELECT "id", "slug", "title", "description", "features", "isFeatured", "isActive",
      "createdAt", "updatedAt", "deletedAt"
    FROM "app_products" ORDER BY "id"
  `;

const readExpandedProducts = (tx: Prisma.TransactionClient): Promise<ExpandedProduct[]> =>
  tx.$queryRaw`SELECT * FROM "app_products" ORDER BY "id"`;

const replayMigration = async (tx: Prisma.TransactionClient): Promise<void> => {
  for (const statement of STATEMENTS) {
    await tx.$executeRawUnsafe(statement);
  }
};

const observeAndRollback = async <T extends object>(
  observe: (tx: Prisma.TransactionClient, before: LegacyProduct[]) => Promise<T>,
): Promise<T> => {
  const census = await takeTableCensus();
  let observations: T | undefined;

  try {
    await cleanupRaw.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe('DROP TABLE "app_product_translations"');
        await tx.$executeRawUnsafe(
          'ALTER TABLE "app_products" DROP COLUMN "featureList", DROP COLUMN "imageUrl", DROP COLUMN "wordsUpdatedAt"',
        );
        await seedProduct(tx, PRODUCT_ID, FEATURES);
        await seedProduct(tx, EMPTY_ID, []);
        await seedProduct(tx, NULL_ID, null);
        await seedProduct(tx, DELETED_ID, FEATURES, DELETED_AT);
        observations = await observe(tx, await readLegacyProducts(tx));
        throw new RollbackObservations(observations);
      },
      { timeout: TX_TIMEOUT },
    );
  } catch (error) {
    if (
      error instanceof RollbackObservations &&
      observations !== undefined &&
      error.observations === observations
    ) {
      expect(await takeTableCensus()).toEqual(census);

      return observations;
    }

    throw error;
  }

  throw new Error("The migration observation transaction unexpectedly committed");
};

const rolledBackAttempt = async (
  tx: Prisma.TransactionClient,
  run: () => Promise<unknown>,
): Promise<unknown> => {
  await tx.$executeRawUnsafe("SAVEPOINT migration_attempt");

  try {
    await run();

    return null;
  } catch (error) {
    return error;
  } finally {
    await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT migration_attempt");
  }
};

const readExpandColumns = (tx: Prisma.TransactionClient): Promise<{ column_name: string }[]> =>
  tx.$queryRaw`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'app_products'
      AND column_name IN ('featureList', 'imageUrl', 'wordsUpdatedAt')
    ORDER BY column_name
  `;

const observeKeys = async (tx: Prisma.TransactionClient): Promise<object> => {
  await tx.marketingLocale.create({ data: { code: LOCALE, name: "Synthetic language" } });
  await tx.productTranslation.create({ data: TRANSLATION });

  const duplicate = await rolledBackAttempt(tx, () =>
    tx.productTranslation.create({
      data: { ...TRANSLATION, id: "product-expand-duplicate" },
    }),
  );
  const restricted = await rolledBackAttempt(tx, () =>
    tx.marketingLocale.delete({ where: { code: LOCALE } }),
  );

  await tx.product.delete({ where: { id: PRODUCT_ID } });

  return {
    duplicate,
    restricted,
    translationsAfterProductDelete: await tx.productTranslation.count({
      where: { productId: PRODUCT_ID },
    }),
    localeAfterProductDelete: await tx.marketingLocale.findUnique({ where: { code: LOCALE } }),
    keys: await tx.$queryRaw<{ name: string; action: string; table: string }[]>`
      SELECT conname AS name, confdeltype::text AS action, confrelid::regclass::text AS table
      FROM pg_constraint WHERE conrelid = 'app_product_translations'::regclass AND contype = 'f'
      ORDER BY conname
    `,
  };
};

describe("migration 20261125120000_cms_product_translations", () => {
  it("holds nine statements, lock timeout first and the guard second", async () => {
    const observations = await observeAndRollback(async (tx) => {
      await replayMigration(tx);

      return { columns: await readExpandColumns(tx) };
    });

    expect(STATEMENTS).toHaveLength(STATEMENT_HEADERS.length);
    expect(SQL.match(/^-- .*$/gm)).toEqual(STATEMENT_HEADERS);
    expect(STATEMENTS[0]).toBe("SET LOCAL lock_timeout = '5s';");
    expect(STATEMENTS[1]).toContain('array_position("features", NULL) IS NOT NULL');
    expect(observations.columns).toHaveLength(3);
  });

  it("keeps every feature's text and order and gives each a distinct uuid", async () => {
    const { products } = await observeAndRollback(async (tx) => {
      await replayMigration(tx);

      return { products: await readExpandedProducts(tx) };
    });

    for (const id of [PRODUCT_ID, DELETED_ID]) {
      const featureList = products.find((product) => product.id === id)?.featureList;

      expect(featureList).toEqual(
        FEATURES.map((text) => ({ id: expect.stringMatching(UUID), text })),
      );

      const ids = Array.isArray(featureList)
        ? featureList.map((row) =>
            row !== null && typeof row === "object" && !Array.isArray(row) ? row.id : undefined,
          )
        : [];

      expect(new Set(ids).size).toBe(FEATURES.length);
    }
  });

  it("turns an empty and a NULL feature list into an empty one", async () => {
    const { products } = await observeAndRollback(async (tx) => {
      await replayMigration(tx);

      return { products: await readExpandedProducts(tx) };
    });

    for (const id of [EMPTY_ID, NULL_ID]) {
      expect(products.find((product) => product.id === id)?.featureList).toEqual([]);
    }
  });

  it("moves no other column: updatedAt keeps its value, wordsUpdatedAt equals it, imageUrl is NULL, features is untouched", async () => {
    const { before, after } = await observeAndRollback(async (tx, before) => {
      await replayMigration(tx);

      return { before, after: await readExpandedProducts(tx) };
    });

    expect(
      after.map(
        ({
          featureList: _featureList,
          imageUrl: _imageUrl,
          wordsUpdatedAt: _wordsUpdatedAt,
          ...product
        }) => product,
      ),
    ).toEqual(before);

    for (const product of after) {
      expect(product.wordsUpdatedAt).toEqual(product.updatedAt);
      expect(product.imageUrl).toBeNull();
    }
  });

  it("refuses a product whose features hold a NULL entry and leaves the table as it was", async () => {
    const observations = await observeAndRollback(async (tx) => {
      await seedProduct(tx, BAD_ID, ["Before null", null, "After null"]);

      const before = await readLegacyProducts(tx);
      const refusal = await rolledBackAttempt(tx, () => replayMigration(tx));

      return {
        before,
        after: await readLegacyProducts(tx),
        refusal,
        columns: await readExpandColumns(tx),
      };
    });

    expect(observations.refusal).toBeInstanceOf(Error);
    expect(observations.refusal).toMatchObject({
      message: expect.stringContaining(`holds a NULL entry in product(s) ${BAD_ID}`),
    });
    expect(observations.after).toEqual(observations.before);
    expect(observations.columns).toEqual([]);
  });

  it("keys a translation to its product with a cascade and to its language with a restrict, one per product and language", async () => {
    const observations = await observeAndRollback(async (tx) => {
      await replayMigration(tx);

      return observeKeys(tx);
    });

    expect(observations).toMatchObject({
      duplicate: { code: "P2002" },
      restricted: { code: "P2003" },
      translationsAfterProductDelete: 0,
      localeAfterProductDelete: { code: LOCALE },
      keys: [
        { name: "app_product_translations_locale_fkey", action: "r", table: "marketing_locales" },
        { name: "app_product_translations_productId_fkey", action: "c", table: "app_products" },
      ],
    });
  });
});
