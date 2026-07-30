import { describe, expect, it } from "vitest";

import {
  boundAxisRejectMessage,
  classifyProfileSelections,
  type ProfileSelectionAxis,
} from "./profile-selections-guard";

const levelAxis: ProfileSelectionAxis = {
  id: "cprofileaxislevel0000001",
  label: "Level",
  values: ["RX", "Scaled"],
  binding: null,
};

const genderAxis: ProfileSelectionAxis = {
  id: "cprofileaxisgender000001",
  label: "Gender",
  values: ["Male", "Female"],
  binding: "GENDER",
};

const axes = [levelAxis, genderAxis];

describe("classifyProfileSelections", () => {
  it("returns ok when the axis exists, is unbound, and the value is a known coordinate", () => {
    expect(classifyProfileSelections({ [levelAxis.id]: "RX" }, axes)).toEqual([
      { key: levelAxis.id, value: "RX", verdict: "ok", axis: levelAxis },
    ]);
  });

  it("returns bound when the key targets an axis with a binding", () => {
    expect(classifyProfileSelections({ [genderAxis.id]: "Female" }, axes)).toEqual([
      { key: genderAxis.id, value: "Female", verdict: "bound", axis: genderAxis },
    ]);
  });

  it("returns bound for a bound axis even when the value is not a known coordinate", () => {
    const [entry] = classifyProfileSelections({ [genderAxis.id]: "Nonbinary" }, axes);

    expect(entry?.verdict).toBe("bound");
  });

  it("returns orphan when no axis matches the key", () => {
    expect(classifyProfileSelections({ cdeletedaxis000000000001: "RX" }, axes)).toEqual([
      { key: "cdeletedaxis000000000001", value: "RX", verdict: "orphan" },
    ]);
  });

  it("returns orphan for a free-text legacy key that is not an axis id", () => {
    const [entry] = classifyProfileSelections({ Level: "RX" }, axes);

    expect(entry?.verdict).toBe("orphan");
  });

  it("returns stale when the axis exists but the value is no longer one of its values", () => {
    expect(classifyProfileSelections({ [levelAxis.id]: "Intermediate" }, axes)).toEqual([
      { key: levelAxis.id, value: "Intermediate", verdict: "stale", axis: levelAxis },
    ]);
  });

  it("classifies every key independently and preserves insertion order", () => {
    const verdicts = classifyProfileSelections(
      {
        [levelAxis.id]: "RX",
        cdeletedaxis000000000001: "Anything",
        [genderAxis.id]: "Female",
      },
      axes,
    ).map((entry) => entry.verdict);

    expect(verdicts).toEqual(["ok", "orphan", "bound"]);
  });

  it("returns an empty list for an empty selections map", () => {
    expect(classifyProfileSelections({}, axes)).toEqual([]);
  });

  it("treats every key as orphan when the catalogue is empty", () => {
    const verdicts = classifyProfileSelections({ [levelAxis.id]: "RX" }, []).map(
      (entry) => entry.verdict,
    );

    expect(verdicts).toEqual(["orphan"]);
  });
});

describe("boundAxisRejectMessage", () => {
  it("names the axis whose label was rejected", () => {
    expect(boundAxisRejectMessage("Gender")).toContain('"Gender"');
  });
});
