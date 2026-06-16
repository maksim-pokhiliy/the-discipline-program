import { describe, expect, it } from "vitest";

import { composeWorkoutTitle } from "./workout-title";

describe("composeWorkoutTitle", () => {
  it("returns the session label name when present", () => {
    const title = composeWorkoutTitle(
      { label: { name: "Back Squat" } },
      { label: { name: "Lower Body" } },
    );

    expect(title).toBe("Back Squat");
  });

  it("falls back to the day label name when the session has no label", () => {
    const title = composeWorkoutTitle({ label: null }, { label: { name: "Lower Body" } });

    expect(title).toBe("Lower Body");
  });

  it("falls back to 'Workout' when neither session nor day has a label", () => {
    const title = composeWorkoutTitle({ label: null }, { label: null });

    expect(title).toBe("Workout");
  });
});
