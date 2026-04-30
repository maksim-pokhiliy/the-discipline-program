import { describe, expect, it } from "vitest";

import { PlanOverrideKind } from "@repo/contracts/lms/plan-override";

import { getDecorationStyles } from "./get-decoration-styles";

describe("getDecorationStyles", () => {
  it("returns empty styles when decoration is null", () => {
    const result = getDecorationStyles(null);

    expect(result.badgeLabel).toBeNull();
    expect(result.tooltip).toBeNull();
  });

  it("returns empty styles when not overridden", () => {
    const result = getDecorationStyles({
      isOverridden: false,
      overrideKind: null,
      notes: [],
      suspended: false,
    });

    expect(result.badgeLabel).toBeNull();
  });

  it("renders SUSPEND with warning color and line-through", () => {
    const result = getDecorationStyles({
      isOverridden: true,
      overrideKind: PlanOverrideKind.SUSPEND,
      notes: [],
      suspended: true,
    });

    expect(result.badgeLabel).toBe("SUSPEND");
    expect(result.badgeColor).toBe("warning");
  });

  it("renders REPLACE with success color", () => {
    const result = getDecorationStyles({
      isOverridden: true,
      overrideKind: PlanOverrideKind.REPLACE,
      notes: [],
      suspended: false,
    });

    expect(result.badgeLabel).toBe("REPLACE");
    expect(result.badgeColor).toBe("success");
  });

  it("renders APPEND with info color", () => {
    const result = getDecorationStyles({
      isOverridden: true,
      overrideKind: PlanOverrideKind.APPEND,
      notes: [],
      suspended: false,
    });

    expect(result.badgeLabel).toBe("APPEND");
    expect(result.badgeColor).toBe("info");
  });

  it("renders NOTE with info color and dashed outline", () => {
    const result = getDecorationStyles({
      isOverridden: true,
      overrideKind: PlanOverrideKind.NOTE,
      notes: ["test note"],
      suspended: false,
    });

    expect(result.badgeLabel).toBe("NOTE");
    expect(result.tooltip).toBe("test note");
  });

  it("joins multi-line notes into tooltip", () => {
    const result = getDecorationStyles({
      isOverridden: true,
      overrideKind: PlanOverrideKind.NOTE,
      notes: ["line one", "line two"],
      suspended: false,
    });

    expect(result.tooltip).toBe("line one\n\nline two");
  });
});
