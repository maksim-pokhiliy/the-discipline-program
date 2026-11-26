import { describe, expect, it, vi } from "vitest";

import { type UpdateProductData } from "@repo/contracts/cms/product";
import { ConflictError, NotFoundError } from "@repo/errors";

import { cleanupRaw } from "../../../test/helpers";

import { createProductInput, useTestProducts } from "./__fixtures__/admin-products";
import { OLD_WORDS_DATE } from "./__fixtures__/translations";
import { createCmsProductAdminApi } from "./admin";

const cmsProductAdminApi = createCmsProductAdminApi({ deleteImage: vi.fn() });

const createProduct = useTestProducts();
const UNFEATURED_UPDATES: { name: string; data: UpdateProductData }[] = [
  { name: "omitted isFeatured", data: { isActive: false } },
  { name: "false isFeatured", data: { isFeatured: false } },
];

const ageWords = async (id: string): Promise<void> => {
  await cleanupRaw.product.update({ where: { id }, data: { wordsUpdatedAt: OLD_WORDS_DATE } });
};

const expectClockUnchanged = async (id: string): Promise<void> => {
  const product = await cleanupRaw.product.findUniqueOrThrow({ where: { id } });

  expect(product.wordsUpdatedAt).toEqual(OLD_WORDS_DATE);
};

const expectOnlyFeatured = async (id: string): Promise<void> => {
  const featured = await cleanupRaw.product.findMany({
    where: { isFeatured: true, deletedAt: null },
    select: { id: true },
  });

  expect(featured).toEqual([{ id }]);
};

describe("one featured product (SB-103)", () => {
  it("a featured create unfeatures the others without moving their English words clock", async () => {
    const existing = await createProduct({ isFeatured: true });

    await ageWords(existing.id);
    const created = await createProduct({ isFeatured: true });

    await expectOnlyFeatured(created.id);
    expect((await cmsProductAdminApi.getById(existing.id)).isFeatured).toBe(false);
    await expectClockUnchanged(existing.id);
  });

  it("a featured update unfeatures the others without moving either English words clock", async () => {
    const existing = await createProduct({ isFeatured: true });
    const target = await createProduct();

    await ageWords(existing.id);
    await ageWords(target.id);
    const updated = await cmsProductAdminApi.update(target.id, { isFeatured: true });

    expect(updated.isFeatured).toBe(true);
    await expectOnlyFeatured(target.id);
    expect((await cmsProductAdminApi.getById(existing.id)).isFeatured).toBe(false);
    await expectClockUnchanged(existing.id);
    await expectClockUnchanged(target.id);
  });

  it.each(UNFEATURED_UPDATES)(
    "an update with $name leaves the others as they are",
    async ({ data }) => {
      const existing = await createProduct({ isFeatured: true });
      const target = await createProduct();

      await ageWords(existing.id);
      await ageWords(target.id);
      await cmsProductAdminApi.update(target.id, data);
      await expectOnlyFeatured(existing.id);
      await expectClockUnchanged(existing.id);
      await expectClockUnchanged(target.id);
    },
  );

  it("a non-featured create leaves the others as they are", async () => {
    const existing = await createProduct({ isFeatured: true });

    await ageWords(existing.id);
    await createProduct();
    await expectOnlyFeatured(existing.id);
    await expectClockUnchanged(existing.id);
  });

  it("a failed featured create rolls back unfeaturing the others", async () => {
    const existing = await createProduct({ isFeatured: true });

    await ageWords(existing.id);
    const before = await cleanupRaw.product.findUniqueOrThrow({ where: { id: existing.id } });

    await expect(
      cmsProductAdminApi.create(createProductInput({ slug: existing.slug, isFeatured: true })),
    ).rejects.toThrow(ConflictError);
    await expectOnlyFeatured(existing.id);
    expect(await cleanupRaw.product.findUniqueOrThrow({ where: { id: existing.id } })).toEqual(
      before,
    );
  });

  it("a missing product update refuses before unfeaturing the others", async () => {
    const existing = await createProduct({ isFeatured: true });

    await ageWords(existing.id);
    const before = await cleanupRaw.product.findUniqueOrThrow({ where: { id: existing.id } });

    await expect(
      cmsProductAdminApi.update("clxxxxxxxxxxxxxxxxxxxxxxxxx", { isFeatured: true }),
    ).rejects.toThrow(NotFoundError);
    await expectOnlyFeatured(existing.id);
    expect(await cleanupRaw.product.findUniqueOrThrow({ where: { id: existing.id } })).toEqual(
      before,
    );
  });
});
