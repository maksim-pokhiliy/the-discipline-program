import { afterEach, describe, expect, it, vi } from "vitest";

import { defaultMonitoring } from "../../../infrastructure/monitoring";

import { type DeleteImage, deleteDroppedPhoto } from "./photo-cleanup";

const PRODUCT_ID = "photo-cleanup-product";
const PREVIOUS = "https://synthetic.public.blob.vercel-storage.com/products/previous.jpg";
const REPLACEMENT = "https://synthetic.public.blob.vercel-storage.com/products/replacement.jpg";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("deleteDroppedPhoto", () => {
  it.each([REPLACEMENT, null])(
    "deletes the previous file when the next photo is %j",
    async (next) => {
      const deleteImage = vi.fn<DeleteImage>().mockResolvedValue(undefined);

      await deleteDroppedPhoto(deleteImage, PRODUCT_ID, PREVIOUS, next);

      expect(deleteImage).toHaveBeenCalledExactlyOnceWith(PREVIOUS);
    },
  );

  it.each([
    { name: "kept", previous: PREVIOUS, next: undefined },
    { name: "unchanged", previous: PREVIOUS, next: PREVIOUS },
    { name: "never set", previous: null, next: null },
    { name: "first set", previous: null, next: REPLACEMENT },
  ])("deletes nothing when the photo is $name", async ({ previous, next }) => {
    const deleteImage = vi.fn<DeleteImage>();

    await deleteDroppedPhoto(deleteImage, PRODUCT_ID, previous, next);

    expect(deleteImage).not.toHaveBeenCalled();
  });

  it.each([new Error("Synthetic delete failure"), "Synthetic non-Error failure"])(
    "turns a failed delete into a monitoring warning and resolves: %s",
    async (error) => {
      const deleteImage = vi.fn<DeleteImage>().mockRejectedValue(error);
      const warnings = vi.spyOn(defaultMonitoring, "captureException").mockReturnValue("captured");

      await expect(
        deleteDroppedPhoto(deleteImage, PRODUCT_ID, PREVIOUS, REPLACEMENT),
      ).resolves.toBeUndefined();
      expect(warnings).toHaveBeenCalledExactlyOnceWith(error, {
        level: "warning",
        tags: { area: "cms.product.photo", productId: PRODUCT_ID },
        extra: { imageUrl: PREVIOUS },
      });
    },
  );
});
