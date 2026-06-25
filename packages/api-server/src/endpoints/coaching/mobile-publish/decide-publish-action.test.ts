import { describe, expect, it } from "vitest";

import { decidePublishAction } from "./decide-publish-action";

describe("decidePublishAction", () => {
  it("creates via POST when there is no legacy row", () => {
    const decision = decidePublishAction({
      isOwned: false,
      hasLegacyRow: false,
      contentMatches: false,
      overwriteUnowned: false,
    });

    expect(decision).toEqual({ action: "created", write: "POST" });
  });

  it("conflicts with no write when an unowned legacy row exists and overwrite is off", () => {
    const decision = decidePublishAction({
      isOwned: false,
      hasLegacyRow: true,
      contentMatches: false,
      overwriteUnowned: false,
    });

    expect(decision).toEqual({ action: "conflict", write: "none" });
  });

  it("updates via PUT when an unowned legacy row exists, overwrite is on, and content differs", () => {
    const decision = decidePublishAction({
      isOwned: false,
      hasLegacyRow: true,
      contentMatches: false,
      overwriteUnowned: true,
    });

    expect(decision).toEqual({ action: "updated", write: "PUT" });
  });

  it("skips with no write when an unowned legacy row exists, overwrite is on, and content matches", () => {
    const decision = decidePublishAction({
      isOwned: false,
      hasLegacyRow: true,
      contentMatches: true,
      overwriteUnowned: true,
    });

    expect(decision).toEqual({ action: "skipped", write: "none" });
  });

  it("skips a content-identical unowned legacy row even when overwrite is off (a row we authored after a timed-out write)", () => {
    const decision = decidePublishAction({
      isOwned: false,
      hasLegacyRow: true,
      contentMatches: true,
      overwriteUnowned: false,
    });

    expect(decision).toEqual({ action: "skipped", write: "none" });
  });

  it("skips with no write when an owned legacy row matches the projected content", () => {
    const decision = decidePublishAction({
      isOwned: true,
      hasLegacyRow: true,
      contentMatches: true,
      overwriteUnowned: false,
    });

    expect(decision).toEqual({ action: "skipped", write: "none" });
  });

  it("updates via PUT when an owned legacy row differs from the projected content", () => {
    const decision = decidePublishAction({
      isOwned: true,
      hasLegacyRow: true,
      contentMatches: false,
      overwriteUnowned: false,
    });

    expect(decision).toEqual({ action: "updated", write: "PUT" });
  });
});
