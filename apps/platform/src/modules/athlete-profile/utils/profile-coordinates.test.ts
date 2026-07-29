import { describe, expect, it } from "vitest";

import { Gender } from "@repo/contracts/coaching/athlete-profile";
import { type ProfileAxis } from "@repo/contracts/coaching/profile-axis";

import {
  GENDER_FIELD_LABEL,
  PICK_FAILED_NOT_PICKED,
  PICK_VALUE_ELLIPSIS,
  PICK_VALUE_MAX_CHARS,
} from "./athlete-profile.constants";
import {
  buildAppliedMessage,
  buildCoordinateParts,
  buildFailedMessage,
  buildMissingCoordinate,
  shortenCoordinate,
} from "./profile-coordinates";

const LEVEL_AXIS_ID = "clz00000000000000000axs01";
const SCALE_AXIS_ID = "clz00000000000000000axs02";
const SYSTEM_GENDER_AXIS_ID = "cgender000000000000000000";
const NOW = new Date("2026-06-16T09:00:00.000Z");

const SURROGATE_RANGE_START = 0xd800;
const SURROGATE_RANGE_END = 0xdfff;

const plainAxis = (id: string, label: string, values: string[]): ProfileAxis => ({
  id,
  key: label.toLowerCase(),
  label,
  values,
  binding: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const LEVEL_AXIS = plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"]);
const SCALE_AXIS = plainAxis(SCALE_AXIS_ID, "Scale", ["M", "F"]);
const AXES = [LEVEL_AXIS, SCALE_AXIS];

const BOUND_GENDER_AXIS: ProfileAxis = {
  id: SYSTEM_GENDER_AXIS_ID,
  key: "gender",
  label: "Gender",
  values: ["Male", "Female"],
  binding: "GENDER",
  createdAt: NOW,
  updatedAt: NOW,
};

const LONG_VALUE = "Advanced masters competitor scaled";
const LONG_VALUE_SHORTENED = "Advanced masters competitor…";

const hasLoneSurrogate = (value: string): boolean =>
  [...value].some((character) => {
    const code = character.codePointAt(0) ?? 0;

    return code >= SURROGATE_RANGE_START && code <= SURROGATE_RANGE_END;
  });

describe("shortenCoordinate", () => {
  it("returns the value untouched when it is under the cap", () => {
    const value = "a".repeat(PICK_VALUE_MAX_CHARS - 1);

    expect(shortenCoordinate(value)).toBe(value);
  });

  it("returns the value untouched when it is exactly at the cap", () => {
    const value = "a".repeat(PICK_VALUE_MAX_CHARS);

    expect(shortenCoordinate(value)).toBe(value);
  });

  it("ellipsizes a value one character past the cap", () => {
    const value = "a".repeat(PICK_VALUE_MAX_CHARS + 1);

    expect(shortenCoordinate(value)).toBe(
      `${"a".repeat(PICK_VALUE_MAX_CHARS)}${PICK_VALUE_ELLIPSIS}`,
    );
  });

  it("trims the whitespace the cut leaves behind before the ellipsis", () => {
    expect(shortenCoordinate(LONG_VALUE)).toBe(LONG_VALUE_SHORTENED);
  });

  it("never cuts an astral character in half at the cap boundary", () => {
    const value = `${"a".repeat(PICK_VALUE_MAX_CHARS - 1)}🔥bbbbb`;
    const shortened = shortenCoordinate(value);

    expect(shortened).toBe(`${"a".repeat(PICK_VALUE_MAX_CHARS - 1)}🔥${PICK_VALUE_ELLIPSIS}`);
    expect(hasLoneSurrogate(shortened)).toBe(false);
  });
});

describe("buildAppliedMessage", () => {
  it("names every coordinate when all axes are picked and gender is set", () => {
    const message = buildAppliedMessage({
      axes: AXES,
      selections: { [LEVEL_AXIS_ID]: "RX", [SCALE_AXIS_ID]: "M" },
      gender: Gender.FEMALE,
    });

    expect(message).toBe("Applied — training weights everywhere now resolve as RX · M · Female.");
  });

  it("names the coordinates it has and the axis still missing when one axis is unpicked", () => {
    const message = buildAppliedMessage({
      axes: AXES,
      selections: { [LEVEL_AXIS_ID]: "RX" },
      gender: Gender.FEMALE,
    });

    expect(message).toBe("Applied — RX · Female. Scale still not picked.");
  });

  it("names Gender as the missing coordinate when every axis is picked but gender is null", () => {
    const message = buildAppliedMessage({
      axes: AXES,
      selections: { [LEVEL_AXIS_ID]: "RX", [SCALE_AXIS_ID]: "M" },
      gender: null,
    });

    expect(message).toBe(`Applied — RX · M. ${GENDER_FIELD_LABEL} still not picked.`);
  });

  it("reports the unpicked axis and never passes gender off as the level when nothing is picked", () => {
    const message = buildAppliedMessage({
      axes: AXES,
      selections: {},
      gender: Gender.FEMALE,
    });

    expect(message).toBe("Applied — Level still not picked.");
    expect(message).not.toContain("Female");
  });

  it("treats a stale pick as not picked and keeps it out of the coordinates", () => {
    const message = buildAppliedMessage({
      axes: [LEVEL_AXIS],
      selections: { [LEVEL_AXIS_ID]: "GONE" },
      gender: Gender.FEMALE,
    });

    expect(message).toBe("Applied — Level still not picked.");
    expect(message).not.toContain("GONE");
  });

  it("ignores a bound gender axis passed among the axes", () => {
    const message = buildAppliedMessage({
      axes: [LEVEL_AXIS, BOUND_GENDER_AXIS],
      selections: { [LEVEL_AXIS_ID]: "RX", [SYSTEM_GENDER_AXIS_ID]: "Male" },
      gender: Gender.FEMALE,
    });

    expect(message).toBe("Applied — training weights everywhere now resolve as RX · Female.");
    expect(message).not.toContain("Male");
  });

  it("ellipsizes a long picked value inside the sentence", () => {
    const message = buildAppliedMessage({
      axes: [plainAxis(LEVEL_AXIS_ID, "Level", [LONG_VALUE])],
      selections: { [LEVEL_AXIS_ID]: LONG_VALUE },
      gender: Gender.FEMALE,
    });

    expect(message).toBe(
      `Applied — training weights everywhere now resolve as ${LONG_VALUE_SHORTENED} · Female.`,
    );
  });
});

describe("buildFailedMessage", () => {
  it("names the coordinates that still hold when the apply fails", () => {
    const message = buildFailedMessage({
      axes: [LEVEL_AXIS],
      selections: { [LEVEL_AXIS_ID]: "SC" },
      gender: Gender.FEMALE,
    });

    expect(message).toBe("Couldn't apply. Your level is still SC · Female.");
  });

  it("names the axis that is still unpicked instead of passing a sibling off as the level", () => {
    const message = buildFailedMessage({
      axes: AXES,
      selections: { [SCALE_AXIS_ID]: "M" },
      gender: Gender.FEMALE,
    });

    expect(message).toBe("Couldn't apply. Your level is still M · Female. Level still not picked.");
  });

  it("falls back to the not-picked sentence and never claims gender is the level", () => {
    const message = buildFailedMessage({
      axes: AXES,
      selections: {},
      gender: Gender.FEMALE,
    });

    expect(message).toBe(PICK_FAILED_NOT_PICKED);
    expect(message).not.toContain("Female");
  });

  it("treats a stale pick as not picked", () => {
    const message = buildFailedMessage({
      axes: [LEVEL_AXIS],
      selections: { [LEVEL_AXIS_ID]: "GONE" },
      gender: Gender.FEMALE,
    });

    expect(message).toBe(PICK_FAILED_NOT_PICKED);
    expect(message).not.toContain("GONE");
  });
});

describe("buildCoordinateParts", () => {
  it("lists every picked axis value followed by the gender label", () => {
    expect(
      buildCoordinateParts({
        axes: AXES,
        selections: { [LEVEL_AXIS_ID]: "RX", [SCALE_AXIS_ID]: "M" },
        gender: Gender.FEMALE,
      }),
    ).toEqual(["RX", "M", "Female"]);
  });

  it("drops a stale pick and a bound gender axis alike", () => {
    expect(
      buildCoordinateParts({
        axes: [LEVEL_AXIS, SCALE_AXIS, BOUND_GENDER_AXIS],
        selections: {
          [LEVEL_AXIS_ID]: "GONE",
          [SCALE_AXIS_ID]: "M",
          [SYSTEM_GENDER_AXIS_ID]: "Male",
        },
        gender: null,
      }),
    ).toEqual(["M"]);
  });
});

describe("buildMissingCoordinate", () => {
  it("returns the first unpicked axis label", () => {
    expect(
      buildMissingCoordinate({
        axes: AXES,
        selections: { [SCALE_AXIS_ID]: "M" },
        gender: Gender.FEMALE,
      }),
    ).toBe("Level");
  });

  it("returns the axis with a stale pick before it looks at gender", () => {
    expect(
      buildMissingCoordinate({
        axes: [LEVEL_AXIS],
        selections: { [LEVEL_AXIS_ID]: "GONE" },
        gender: null,
      }),
    ).toBe("Level");
  });

  it("returns the gender field label when every axis is picked and gender is null", () => {
    expect(
      buildMissingCoordinate({
        axes: AXES,
        selections: { [LEVEL_AXIS_ID]: "RX", [SCALE_AXIS_ID]: "M" },
        gender: null,
      }),
    ).toBe(GENDER_FIELD_LABEL);
  });

  it("returns null when every coordinate is resolved", () => {
    expect(
      buildMissingCoordinate({
        axes: [LEVEL_AXIS, BOUND_GENDER_AXIS],
        selections: { [LEVEL_AXIS_ID]: "RX" },
        gender: Gender.FEMALE,
      }),
    ).toBeNull();
  });
});
