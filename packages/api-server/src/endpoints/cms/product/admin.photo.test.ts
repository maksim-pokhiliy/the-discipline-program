import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConflictError } from "@repo/errors";

import { defaultMonitoring } from "../../../infrastructure/monitoring";
import { cleanupRaw } from "../../../test/helpers";

import { createCmsProductAdminApi } from "./admin";
import { OLD_WORDS_AT, useTestProducts } from "./admin-test.fixtures";
import { type DeleteImage } from "./photo-cleanup";

const PREVIOUS = "https://synthetic.public.blob.vercel-storage.com/products/previous.jpg";
const REPLACEMENT = "https://synthetic.public.blob.vercel-storage.com/products/replacement.jpg";
const deleteImage = vi.fn<DeleteImage>();
const api = createCmsProductAdminApi({ deleteImage });
const createProduct = useTestProducts(api);

beforeEach(() => {
  deleteImage.mockReset();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("product photo", () => {
  it.each([undefined, null, PREVIOUS])("create stores its photo or null: %s", async (imageUrl) => {
    const product = await createProduct(imageUrl === undefined ? {} : { imageUrl });

    expect(product.imageUrl).toBe(imageUrl ?? null);
    expect((await api.getById(product.id)).imageUrl).toBe(imageUrl ?? null);
    expect(deleteImage).not.toHaveBeenCalled();
  });

  it.each([REPLACEMENT, null])(
    "deletes the old file only after the save of %s commits",
    async (imageUrl) => {
      const product = await createProduct({ imageUrl: PREVIOUS });
      let observed: string | null | undefined;

      await cleanupRaw.product.update({
        where: { id: product.id },
        data: { wordsUpdatedAt: OLD_WORDS_AT },
      });
      deleteImage.mockImplementation(async () => {
        const committed = await cleanupRaw.product.findUniqueOrThrow({ where: { id: product.id } });

        observed = committed.imageUrl;
      });
      const saved = await api.update(product.id, { imageUrl });

      expect(deleteImage).toHaveBeenCalledExactlyOnceWith(PREVIOUS);
      expect(observed).toBe(imageUrl);
      expect(saved.imageUrl).toBe(imageUrl);
      expect(
        (await cleanupRaw.product.findUniqueOrThrow({ where: { id: product.id } })).wordsUpdatedAt,
      ).toEqual(OLD_WORDS_AT);
    },
  );

  it.each([
    { name: "omitted", previous: PREVIOUS, body: {} },
    { name: "unchanged", previous: PREVIOUS, body: { imageUrl: PREVIOUS } },
    { name: "never set", previous: null, body: { imageUrl: null } },
    { name: "first set", previous: null, body: { imageUrl: REPLACEMENT } },
  ])("deletes nothing when the photo is $name", async ({ previous, body }) => {
    const product = await createProduct({ imageUrl: previous });
    const saved = await api.update(product.id, body);

    expect(saved.imageUrl).toBe("imageUrl" in body ? body.imageUrl : previous);
    expect(deleteImage).not.toHaveBeenCalled();
  });

  it("a failed save leaves the old photo and deletes nothing", async () => {
    const taken = await createProduct();
    const product = await createProduct({ imageUrl: PREVIOUS });

    await expect(
      api.update(product.id, { slug: taken.slug, imageUrl: REPLACEMENT }),
    ).rejects.toThrow(ConflictError);
    expect((await api.getById(product.id)).imageUrl).toBe(PREVIOUS);
    expect(deleteImage).not.toHaveBeenCalled();
  });

  it("returns the saved product and reports a warning when deletion fails", async () => {
    const product = await createProduct({ imageUrl: PREVIOUS });
    const error = new Error("Synthetic cleanup failure");
    const warnings = vi.spyOn(defaultMonitoring, "captureException").mockReturnValue("captured");

    deleteImage.mockRejectedValueOnce(error);
    const saved = await api.update(product.id, { imageUrl: REPLACEMENT });

    expect(saved.imageUrl).toBe(REPLACEMENT);
    expect((await api.getById(product.id)).imageUrl).toBe(REPLACEMENT);
    expect(warnings).toHaveBeenCalledExactlyOnceWith(error, {
      level: "warning",
      tags: { area: "cms.product.photo", productId: product.id },
      extra: { imageUrl: PREVIOUS },
    });
  });

  it("soft delete keeps the photo file", async () => {
    const product = await createProduct({ imageUrl: PREVIOUS });

    await api.delete(product.id);
    const deleted = await cleanupRaw.product.findUniqueOrThrow({ where: { id: product.id } });

    expect(deleted.deletedAt).not.toBeNull();
    expect(deleted.imageUrl).toBe(PREVIOUS);
    expect(deleteImage).not.toHaveBeenCalled();
  });
});
