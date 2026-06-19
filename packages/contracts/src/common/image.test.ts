import { describe, expect, it } from "vitest";

import { blobImageUrlSchema, imageUrlSchema } from "./image";

describe("blobImageUrlSchema", () => {
  it("accepts a vercel blob storage url", () => {
    const result = blobImageUrlSchema.safeParse(
      "https://abc123.public.blob.vercel-storage.com/avatars/x.png",
    );

    expect(result.success).toBe(true);
  });

  it("accepts null", () => {
    expect(blobImageUrlSchema.safeParse(null).success).toBe(true);
  });

  it("rejects an arbitrary external url", () => {
    expect(blobImageUrlSchema.safeParse("https://attacker.example.com/pixel.png").success).toBe(
      false,
    );
  });

  it("rejects a look-alike host that only contains the blob domain mid-string", () => {
    expect(
      blobImageUrlSchema.safeParse("https://public.blob.vercel-storage.com.attacker.com/x.png")
        .success,
    ).toBe(false);
  });

  it("rejects a url longer than the cap", () => {
    const tooLong = `https://x.public.blob.vercel-storage.com/${"a".repeat(3000)}`;

    expect(blobImageUrlSchema.safeParse(tooLong).success).toBe(false);
  });
});

describe("imageUrlSchema", () => {
  it("stays permissive for reads (legacy non-blob urls)", () => {
    expect(imageUrlSchema.safeParse("https://example.com/legacy.jpg").success).toBe(true);
  });
});
