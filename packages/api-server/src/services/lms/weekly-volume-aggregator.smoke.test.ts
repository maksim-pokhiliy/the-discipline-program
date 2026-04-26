import { describe, expect, it } from "vitest";

import { aggregateWeeklyVolume } from "./weekly-volume-aggregator";

describe("aggregateWeeklyVolume", () => {
  it("throws a clear not-implemented message in M0", async () => {
    await expect(
      aggregateWeeklyVolume({
        db: null as never,
        userId: "user-id",
        weekStartDate: new Date("2026-04-26"),
      }),
    ).rejects.toThrow(/not implemented in M0/u);
  });
});
