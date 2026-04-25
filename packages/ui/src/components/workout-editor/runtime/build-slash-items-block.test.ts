import { describe, expect, it } from "vitest";

import { type Scheme, SchemeKind } from "@repo/contracts/library/scheme";

import { buildSlashItemsBlock } from "./build-slash-items-block";

const makeScheme = (
  overrides: Partial<Scheme> & { slug: string; name: string; kind: SchemeKind },
): Scheme => ({
  id: `scheme-${overrides.slug}`,
  description: null,
  requiredParams: [],
  paramDefaults: {},
  active: true,
  sortOrder: 0,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const SEED_SCHEMES: ReadonlyArray<Scheme> = [
  makeScheme({ slug: "straight-sets", name: "Straight Sets", kind: SchemeKind.STRAIGHT_SETS }),
  makeScheme({ slug: "for-time", name: "For Time", kind: SchemeKind.FOR_TIME }),
  makeScheme({ slug: "amrap", name: "AMRAP", kind: SchemeKind.AMRAP }),
  makeScheme({
    slug: "emom",
    name: "EMOM",
    kind: SchemeKind.EMOM,
    paramDefaults: { interval: 60, rounds: 10 },
  }),
  makeScheme({ slug: "every-x-min", name: "Every X Min", kind: SchemeKind.EVERY_X_MIN }),
  makeScheme({ slug: "intervals", name: "Intervals", kind: SchemeKind.INTERVALS }),
  makeScheme({ slug: "time-blocks", name: "Time Blocks", kind: SchemeKind.TIME_BLOCKS }),
];

describe("buildSlashItemsBlock", () => {
  it("returns one item per scheme plus Notes and Text callout when query is empty", () => {
    const items = buildSlashItemsBlock("", SEED_SCHEMES);

    expect(items).toHaveLength(SEED_SCHEMES.length + 2);

    const kinds = items.map((item) => item.kind);

    expect(kinds.filter((k) => k === "add-scheme-section")).toHaveLength(SEED_SCHEMES.length);
    expect(kinds).toContain("add-notes-section");
    expect(kinds).toContain("add-text-callout-section");
  });

  it("filters scheme items by EMOM kind name", () => {
    const items = buildSlashItemsBlock("EMOM", SEED_SCHEMES);
    const schemeMatches = items.filter((item) => item.kind === "add-scheme-section");

    expect(schemeMatches).toHaveLength(1);

    if (schemeMatches[0]?.kind === "add-scheme-section") {
      expect(schemeMatches[0].schemeKind).toBe(SchemeKind.EMOM);
      expect(schemeMatches[0].schemeConfig).toEqual({ interval: 60, rounds: 10 });
    }
  });

  it("filters by callout label substring", () => {
    const items = buildSlashItemsBlock("callout", SEED_SCHEMES);
    const calloutItems = items.filter((item) => item.kind === "add-text-callout-section");

    expect(calloutItems).toHaveLength(1);
  });

  it("filters by notes label substring", () => {
    const items = buildSlashItemsBlock("note", SEED_SCHEMES);
    const notesItems = items.filter((item) => item.kind === "add-notes-section");

    expect(notesItems).toHaveLength(1);
  });

  it("populates schemeId, schemeKind, schemeConfig on scheme items", () => {
    const items = buildSlashItemsBlock("Straight", SEED_SCHEMES);
    const first = items[0];

    expect(first?.kind).toBe("add-scheme-section");

    if (first?.kind === "add-scheme-section") {
      expect(first.schemeId).toBe("scheme-straight-sets");
      expect(first.schemeKind).toBe(SchemeKind.STRAIGHT_SETS);
      expect(first.schemeConfig).toEqual({});
    }
  });

  it("filters by scheme description", () => {
    const schemes: Scheme[] = [
      makeScheme({
        slug: "amrap",
        name: "AMRAP",
        kind: SchemeKind.AMRAP,
        description: "as many rounds as possible",
      }),
      makeScheme({ slug: "for-time", name: "For Time", kind: SchemeKind.FOR_TIME }),
    ];

    const items = buildSlashItemsBlock("rounds", schemes);
    const schemeItems = items.filter((item) => item.kind === "add-scheme-section");

    expect(schemeItems).toHaveLength(1);
  });

  it("returns nothing when query matches neither schemes nor static labels", () => {
    const items = buildSlashItemsBlock("totally-unrelated-zzzz", SEED_SCHEMES);

    expect(items).toHaveLength(0);
  });
});
