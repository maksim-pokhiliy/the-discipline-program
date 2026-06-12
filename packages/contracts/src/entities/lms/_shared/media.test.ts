import { describe, expect, it } from "vitest";

import { mediaReferenceSchema } from "./media";

describe("mediaReferenceSchema", () => {
  it("accepts a valid url with no label", () => {
    expect(mediaReferenceSchema.safeParse({ url: "https://example.com/video.mp4" }).success).toBe(
      true,
    );
  });

  it("accepts optional label", () => {
    expect(
      mediaReferenceSchema.safeParse({
        url: "https://example.com/v.mp4",
        label: "Watch this carefully",
      }).success,
    ).toBe(true);
  });

  it("rejects empty label string", () => {
    expect(
      mediaReferenceSchema.safeParse({ url: "https://example.com/v.mp4", label: "" }).success,
    ).toBe(false);
  });

  it("rejects invalid url", () => {
    expect(mediaReferenceSchema.safeParse({ url: "not-a-url" }).success).toBe(false);
  });

  it("strips the dropped position field (default passthrough)", () => {
    const result = mediaReferenceSchema.safeParse({
      url: "https://example.com/v.mp4",
      position: "inline",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({ url: "https://example.com/v.mp4" });
    }
  });
});
