import { describe, expect, it } from "vitest";

import {
  MEDIA_APPLIES_TO,
  MEDIA_POSITIONS,
  POSITION_EQUIPMENT_MODIFIERS,
  mediaReferenceSchema,
  positionEquipmentModifierSchema,
} from "./media";

describe("mediaReferenceSchema", () => {
  it("accepts a valid url + position inline + appliesTo current_row", () => {
    expect(
      mediaReferenceSchema.safeParse({
        url: "https://example.com/video.mp4",
        position: "inline",
        appliesTo: "current_row",
      }).success,
    ).toBe(true);
  });

  it("accepts all 3 MEDIA_POSITIONS", () => {
    for (const position of MEDIA_POSITIONS) {
      expect(
        mediaReferenceSchema.safeParse({
          url: "https://example.com/v.mp4",
          position,
          appliesTo: "current_row",
        }).success,
      ).toBe(true);
    }
  });

  it("accepts all 4 MEDIA_APPLIES_TO", () => {
    for (const appliesTo of MEDIA_APPLIES_TO) {
      expect(
        mediaReferenceSchema.safeParse({
          url: "https://example.com/v.mp4",
          position: "inline",
          appliesTo,
        }).success,
      ).toBe(true);
    }
  });

  it("accepts optional label", () => {
    expect(
      mediaReferenceSchema.safeParse({
        url: "https://example.com/v.mp4",
        position: "standalone_row",
        appliesTo: "whole_schema",
        label: "Watch this carefully",
      }).success,
    ).toBe(true);
  });

  it("rejects empty label string", () => {
    expect(
      mediaReferenceSchema.safeParse({
        url: "https://example.com/v.mp4",
        position: "inline",
        appliesTo: "current_row",
        label: "",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid url", () => {
    expect(
      mediaReferenceSchema.safeParse({
        url: "not-a-url",
        position: "inline",
        appliesTo: "current_row",
      }).success,
    ).toBe(false);
  });

  it("rejects unknown position", () => {
    expect(
      mediaReferenceSchema.safeParse({
        url: "https://example.com/v.mp4",
        position: "popup",
        appliesTo: "current_row",
      }).success,
    ).toBe(false);
  });

  it("rejects unknown appliesTo", () => {
    expect(
      mediaReferenceSchema.safeParse({
        url: "https://example.com/v.mp4",
        position: "inline",
        appliesTo: "next_row",
      }).success,
    ).toBe(false);
  });
});

describe("positionEquipmentModifierSchema", () => {
  it("accepts all 11 POSITION_EQUIPMENT_MODIFIERS values", () => {
    for (const modifier of POSITION_EQUIPMENT_MODIFIERS) {
      expect(positionEquipmentModifierSchema.safeParse(modifier).success).toBe(true);
    }
  });

  it("rejects lowercase variant", () => {
    expect(positionEquipmentModifierSchema.safeParse("neutral_grip").success).toBe(false);
  });

  it("rejects unknown value", () => {
    expect(positionEquipmentModifierSchema.safeParse("CUSTOM_POSITION").success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(positionEquipmentModifierSchema.safeParse("").success).toBe(false);
  });
});
