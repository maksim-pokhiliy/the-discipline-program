import { describe, expect, it } from "vitest";

import { decidePublishAction } from "./decide-publish-action";

const HASH = "hash-of-the-fresh-projection";
const OTHER_HASH = "hash-of-an-older-projection";

describe("decidePublishAction", () => {
  it("creates when the ledger has no row for the day", () => {
    expect(decidePublishAction(null, HASH)).toBe("created");
  });

  it("skips when the stored row carries content with the same hash", () => {
    expect(decidePublishAction({ contentHash: HASH, hasContent: true, isServed: true }, HASH)).toBe(
      "skipped",
    );
  });

  it("updates when the stored row carries content with a different hash", () => {
    expect(
      decidePublishAction({ contentHash: OTHER_HASH, hasContent: true, isServed: true }, HASH),
    ).toBe("updated");
  });

  it("updates unchanged content that another link's newer row is outserving, to reclaim the day", () => {
    expect(
      decidePublishAction({ contentHash: HASH, hasContent: true, isServed: false }, HASH),
    ).toBe("updated");
  });

  it("updates a content-less row even when its hash matches", () => {
    expect(
      decidePublishAction({ contentHash: HASH, hasContent: false, isServed: false }, HASH),
    ).toBe("updated");
  });
});
