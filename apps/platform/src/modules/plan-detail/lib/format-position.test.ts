import { describe, expect, it } from "vitest";

import { formatPosition } from "./format-position";

describe("formatPosition", () => {
  it("lowercases a single-token position", () => {
    expect(formatPosition("NEUTRAL_GRIP")).toBe("neutral grip");
  });

  it("replaces underscores with spaces", () => {
    expect(formatPosition("FROM_BOX_OR_SOFA")).toBe("from box or sofa");
  });

  it("handles a position with two segments", () => {
    expect(formatPosition("FROM_SOFA")).toBe("from sofa");
  });

  it("handles a position with three segments", () => {
    expect(formatPosition("HAND_ON_DB_NEUTRAL_GRIP")).toBe("hand on db neutral grip");
  });

  it("renders WITHOUT_BENCH as 'without bench'", () => {
    expect(formatPosition("WITHOUT_BENCH")).toBe("without bench");
  });
});
