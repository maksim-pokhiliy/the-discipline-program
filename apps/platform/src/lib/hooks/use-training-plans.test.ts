import { describe, expect, it } from "vitest";

import { type TrainingPlan, TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { applyTrainingPlanUpdate } from "./use-training-plans";

const basePlan: TrainingPlan = {
  id: "ckxw5p7gp0000q1mnzv5cuq0a",
  creatorId: "ckxw5p7gp0000q1mnzv5cuq0b",
  name: "Strength Block",
  description: "Initial description",
  status: TrainingPlanStatus.DRAFT,
  licensable: false,
  originalPlanId: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("applyTrainingPlanUpdate", () => {
  it("preserves name when payload omits the field", () => {
    const next = applyTrainingPlanUpdate(basePlan, { description: "Updated copy" });

    expect(next.name).toBe("Strength Block");
    expect(next.description).toBe("Updated copy");
  });

  it("preserves name when payload sets name to undefined", () => {
    const next = applyTrainingPlanUpdate(basePlan, { name: undefined, description: "x" });

    expect(next.name).toBe("Strength Block");
    expect(next.description).toBe("x");
  });

  it("preserves description when payload omits the field", () => {
    const next = applyTrainingPlanUpdate(basePlan, { name: "Renamed" });

    expect(next.name).toBe("Renamed");
    expect(next.description).toBe("Initial description");
  });

  it("applies an explicit description of null (clear)", () => {
    const next = applyTrainingPlanUpdate(basePlan, { description: null });

    expect(next.description).toBeNull();
    expect(next.name).toBe("Strength Block");
  });

  it("applies both name and description when both defined", () => {
    const next = applyTrainingPlanUpdate(basePlan, {
      name: "Renamed",
      description: "Updated copy",
    });

    expect(next.name).toBe("Renamed");
    expect(next.description).toBe("Updated copy");
  });

  it("returns a fresh object instead of mutating the source", () => {
    const next = applyTrainingPlanUpdate(basePlan, { name: "Renamed" });

    expect(next).not.toBe(basePlan);
    expect(basePlan.name).toBe("Strength Block");
  });

  it("rejects a stray null name (name is non-nullable)", () => {
    const payload = { name: null } as unknown as Parameters<typeof applyTrainingPlanUpdate>[1];
    const next = applyTrainingPlanUpdate(basePlan, payload);

    expect(next.name).toBe("Strength Block");
  });
});
