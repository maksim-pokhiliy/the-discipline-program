import { describe, expect, it } from "vitest";

import { type BlockType } from "@repo/contracts/lms/block-type";
import { type DayType } from "@repo/contracts/lms/day-type";
import { type Exercise } from "@repo/contracts/lms/exercise";
import { type SchemeType } from "@repo/contracts/lms/scheme-type";

import {
  buildBlockTypeMap,
  buildDayTypeMap,
  buildExerciseMap,
  buildSchemeTypeMap,
} from "./library-lookup";

const NOW = new Date("2026-01-01T00:00:00.000Z");

const makeExercise = (id: string, name: string): Exercise => ({
  id,
  name,
  urls: [],
  primaryMovement: "SQUAT",
  benchmarkPrKind: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const makeBlockType = (id: string, name: string): BlockType => ({
  id,
  name,
  description: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const makeSchemeType = (id: string, name: string): SchemeType => ({
  id,
  name,
  archetypeKind: "NONE",
  defaultParams: { kind: "NONE" },
  createdAt: NOW,
  updatedAt: NOW,
});

const makeDayType = (id: string, name: string): DayType => ({
  id,
  name,
  color: "#3D7BC4",
  createdAt: NOW,
  updatedAt: NOW,
});

describe("buildExerciseMap", () => {
  it("keys exercises by id when given multiple entries", () => {
    const a = makeExercise("ex-1", "Back Squat");
    const b = makeExercise("ex-2", "Front Squat");

    const map = buildExerciseMap([a, b]);

    expect(map.size).toBe(2);
    expect(map.get("ex-1")).toBe(a);
    expect(map.get("ex-2")).toBe(b);
  });

  it("returns an empty map when given an empty array", () => {
    const map = buildExerciseMap([]);

    expect(map.size).toBe(0);
  });

  it("keeps the last entry when ids collide", () => {
    const first = makeExercise("ex-dup", "First");
    const second = makeExercise("ex-dup", "Second");

    const map = buildExerciseMap([first, second]);

    expect(map.size).toBe(1);
    expect(map.get("ex-dup")).toBe(second);
  });
});

describe("buildBlockTypeMap", () => {
  it("keys block types by id when given multiple entries", () => {
    const a = makeBlockType("bt-1", "Strength");
    const b = makeBlockType("bt-2", "Conditioning");

    const map = buildBlockTypeMap([a, b]);

    expect(map.size).toBe(2);
    expect(map.get("bt-1")).toBe(a);
    expect(map.get("bt-2")).toBe(b);
  });

  it("returns an empty map when given an empty array", () => {
    const map = buildBlockTypeMap([]);

    expect(map.size).toBe(0);
  });

  it("keeps the last entry when ids collide", () => {
    const first = makeBlockType("bt-dup", "First");
    const second = makeBlockType("bt-dup", "Second");

    const map = buildBlockTypeMap([first, second]);

    expect(map.size).toBe(1);
    expect(map.get("bt-dup")).toBe(second);
  });
});

describe("buildSchemeTypeMap", () => {
  it("keys scheme types by id when given multiple entries", () => {
    const a = makeSchemeType("st-1", "AMRAP");
    const b = makeSchemeType("st-2", "EMOM");

    const map = buildSchemeTypeMap([a, b]);

    expect(map.size).toBe(2);
    expect(map.get("st-1")).toBe(a);
    expect(map.get("st-2")).toBe(b);
  });

  it("returns an empty map when given an empty array", () => {
    const map = buildSchemeTypeMap([]);

    expect(map.size).toBe(0);
  });

  it("keeps the last entry when ids collide", () => {
    const first = makeSchemeType("st-dup", "First");
    const second = makeSchemeType("st-dup", "Second");

    const map = buildSchemeTypeMap([first, second]);

    expect(map.size).toBe(1);
    expect(map.get("st-dup")).toBe(second);
  });
});

describe("buildDayTypeMap", () => {
  it("keys day types by id when given multiple entries", () => {
    const a = makeDayType("dt-1", "Strength");
    const b = makeDayType("dt-2", "Rest");

    const map = buildDayTypeMap([a, b]);

    expect(map.size).toBe(2);
    expect(map.get("dt-1")).toBe(a);
    expect(map.get("dt-2")).toBe(b);
  });

  it("returns an empty map when given an empty array", () => {
    const map = buildDayTypeMap([]);

    expect(map.size).toBe(0);
  });

  it("keeps the last entry when ids collide", () => {
    const first = makeDayType("dt-dup", "First");
    const second = makeDayType("dt-dup", "Second");

    const map = buildDayTypeMap([first, second]);

    expect(map.size).toBe(1);
    expect(map.get("dt-dup")).toBe(second);
  });
});
