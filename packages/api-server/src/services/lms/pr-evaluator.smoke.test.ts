import { describe, expect, it } from "vitest";

import { evaluatePr } from "./pr-evaluator";

describe("evaluatePr", () => {
  it("throws a clear not-implemented message in M0", async () => {
    await expect(
      evaluatePr({
        db: null as never,
        setLogId: "set-log-id",
      }),
    ).rejects.toThrow(/not implemented in M0/u);
  });
});
