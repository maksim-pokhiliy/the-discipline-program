import { describe, expect, it } from "vitest";

import { trainingLevelsApi } from "./training-levels";

const CALLER_USER_ID = "clcaller00000000000000000";

describe("trainingLevelsApi.listTrainingLevels", () => {
  it("returns the four legacy levels in catalog order", async () => {
    expect(await trainingLevelsApi.listTrainingLevels(CALLER_USER_ID)).toEqual([
      { id: 1, name: "Scaled" },
      { id: 2, name: "Pro" },
      { id: 3, name: "Advanced" },
      { id: 4, name: "Functional Bodybuilding" },
    ]);
  });
});
