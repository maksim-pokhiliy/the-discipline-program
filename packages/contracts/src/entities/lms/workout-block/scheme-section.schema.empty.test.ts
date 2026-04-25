import { describe, expect, it } from "vitest";

import { SchemeSectionKind } from "./workout-block.constants";
import { schemeSectionSchema } from "./workout-block.schema";

const VALID_CUID = "clz00000000000000000fake1";
const VALID_CUID_2 = "clz00000000000000000fake2";
const VALID_CUID_3 = "clz00000000000000000fake3";
const NOW = new Date();

describe("schemeSectionSchema empty payloads", () => {
  it("rejects empty object (kind, id, blockId, sortOrder, dates required)", () => {
    const result = schemeSectionSchema.safeParse({});

    expect(result.success).toBe(false);

    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));

      expect(paths).toContain("kind");
      expect(paths).toContain("id");
      expect(paths).toContain("blockId");
      expect(paths).toContain("sortOrder");
    }
  });

  it("rejects null", () => {
    const result = schemeSectionSchema.safeParse(null);

    expect(result.success).toBe(false);
  });

  it("rejects undefined", () => {
    const result = schemeSectionSchema.safeParse(undefined);

    expect(result.success).toBe(false);
  });
});

describe("schemeSectionSchema required fields", () => {
  const validSection = {
    id: VALID_CUID,
    blockId: VALID_CUID_2,
    kind: SchemeSectionKind.SCHEME,
    schemeId: null,
    schemeKind: null,
    schemeConfig: null,
    effortPct: null,
    pace: null,
    note: null,
    tone: null,
    sortOrder: 0,
    createdAt: NOW,
    updatedAt: NOW,
  };

  it("accepts a minimal valid SCHEME section with all nullables null", () => {
    const result = schemeSectionSchema.safeParse(validSection);

    expect(result.success).toBe(true);
  });

  it.each([SchemeSectionKind.SCHEME, SchemeSectionKind.NOTES, SchemeSectionKind.TEXT_CALLOUT])(
    "accepts kind: %s",
    (kind) => {
      const result = schemeSectionSchema.safeParse({ ...validSection, kind });

      expect(result.success).toBe(true);
    },
  );

  it("rejects an unknown kind value", () => {
    const result = schemeSectionSchema.safeParse({ ...validSection, kind: "BOGUS" });

    expect(result.success).toBe(false);

    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));

      expect(paths).toContain("kind");
    }
  });

  const baseSectionMinusOne = (omit: "kind" | "id" | "blockId" | "sortOrder") => {
    const full = {
      id: VALID_CUID,
      blockId: VALID_CUID_2,
      kind: SchemeSectionKind.SCHEME,
      schemeId: null,
      schemeKind: null,
      schemeConfig: null,
      effortPct: null,
      pace: null,
      note: null,
      tone: null,
      sortOrder: 0,
      createdAt: NOW,
      updatedAt: NOW,
    };
    const result: Record<string, unknown> = { ...full };

    delete result[omit];

    return result;
  };

  it.each(["kind", "id", "blockId", "sortOrder"] as const)(
    "rejects a section missing %s",
    (field) => {
      const result = schemeSectionSchema.safeParse(baseSectionMinusOne(field));

      expect(result.success).toBe(false);

      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join("."));

        expect(paths).toContain(field);
      }
    },
  );

  it("rejects a negative sortOrder", () => {
    const result = schemeSectionSchema.safeParse({ ...validSection, sortOrder: -1 });

    expect(result.success).toBe(false);

    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));

      expect(paths).toContain("sortOrder");
    }
  });
});

describe("schemeSectionSchema nullable scheme attrs", () => {
  const baseSection = {
    id: VALID_CUID,
    blockId: VALID_CUID_2,
    kind: SchemeSectionKind.SCHEME,
    schemeId: null,
    schemeKind: null,
    schemeConfig: null,
    effortPct: null,
    pace: null,
    note: null,
    tone: null,
    sortOrder: 0,
    createdAt: NOW,
    updatedAt: NOW,
  };

  it("accepts schemeId null", () => {
    const result = schemeSectionSchema.safeParse({ ...baseSection, schemeId: null });

    expect(result.success).toBe(true);
  });

  it("accepts schemeId set to a cuid", () => {
    const result = schemeSectionSchema.safeParse({ ...baseSection, schemeId: VALID_CUID_3 });

    expect(result.success).toBe(true);
  });

  it("rejects schemeId set to an invalid cuid", () => {
    const result = schemeSectionSchema.safeParse({ ...baseSection, schemeId: "not-a-cuid" });

    expect(result.success).toBe(false);
  });

  it("accepts schemeKind null", () => {
    const result = schemeSectionSchema.safeParse({ ...baseSection, schemeKind: null });

    expect(result.success).toBe(true);
  });

  it("accepts schemeKind set to EMOM", () => {
    const result = schemeSectionSchema.safeParse({ ...baseSection, schemeKind: "EMOM" });

    expect(result.success).toBe(true);
  });

  it("rejects schemeKind set to an unknown value", () => {
    const result = schemeSectionSchema.safeParse({ ...baseSection, schemeKind: "BOGUS" });

    expect(result.success).toBe(false);
  });

  it("accepts schemeConfig null", () => {
    const result = schemeSectionSchema.safeParse({ ...baseSection, schemeConfig: null });

    expect(result.success).toBe(true);
  });

  it("accepts schemeConfig as a record of numbers", () => {
    const result = schemeSectionSchema.safeParse({
      ...baseSection,
      schemeConfig: { interval: 60, rounds: 10 },
    });

    expect(result.success).toBe(true);
  });

  it("rejects schemeConfig with non-numeric values", () => {
    const result = schemeSectionSchema.safeParse({
      ...baseSection,
      schemeConfig: { interval: "60" },
    });

    expect(result.success).toBe(false);
  });

  it("accepts effortPct null", () => {
    const result = schemeSectionSchema.safeParse({ ...baseSection, effortPct: null });

    expect(result.success).toBe(true);
  });

  it("accepts effortPct in [0, 100]", () => {
    const result = schemeSectionSchema.safeParse({ ...baseSection, effortPct: 80 });

    expect(result.success).toBe(true);
  });

  it("rejects effortPct above 100", () => {
    const result = schemeSectionSchema.safeParse({ ...baseSection, effortPct: 101 });

    expect(result.success).toBe(false);

    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));

      expect(paths).toContain("effortPct");
    }
  });

  it("accepts pace null", () => {
    const result = schemeSectionSchema.safeParse({ ...baseSection, pace: null });

    expect(result.success).toBe(true);
  });

  it("accepts pace as a string", () => {
    const result = schemeSectionSchema.safeParse({ ...baseSection, pace: "2:00/km" });

    expect(result.success).toBe(true);
  });

  it("accepts note null", () => {
    const result = schemeSectionSchema.safeParse({ ...baseSection, note: null });

    expect(result.success).toBe(true);
  });

  it("accepts note as a non-empty string", () => {
    const result = schemeSectionSchema.safeParse({ ...baseSection, note: "RPE 8" });

    expect(result.success).toBe(true);
  });

  it("accepts tone null", () => {
    const result = schemeSectionSchema.safeParse({ ...baseSection, tone: null });

    expect(result.success).toBe(true);
  });

  it("accepts tone as a string", () => {
    const result = schemeSectionSchema.safeParse({ ...baseSection, tone: "warning" });

    expect(result.success).toBe(true);
  });

  it("rejects tone exceeding 32 chars", () => {
    const result = schemeSectionSchema.safeParse({
      ...baseSection,
      tone: "x".repeat(33),
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));

      expect(paths).toContain("tone");
    }
  });
});

describe("schemeSectionSchema optional child arrays", () => {
  const baseSection = {
    id: VALID_CUID,
    blockId: VALID_CUID_2,
    kind: SchemeSectionKind.SCHEME,
    schemeId: null,
    schemeKind: null,
    schemeConfig: null,
    effortPct: null,
    pace: null,
    note: null,
    tone: null,
    sortOrder: 0,
    createdAt: NOW,
    updatedAt: NOW,
  };

  it("accepts a section with exercises omitted", () => {
    const result = schemeSectionSchema.safeParse(baseSection);

    expect(result.success).toBe(true);
  });

  it("accepts a section with exercises set to an empty array", () => {
    const result = schemeSectionSchema.safeParse({ ...baseSection, exercises: [] });

    expect(result.success).toBe(true);
  });

  it("accepts a section with emomSlots omitted", () => {
    const result = schemeSectionSchema.safeParse(baseSection);

    expect(result.success).toBe(true);
  });

  it("accepts a section with emomSlots set to an empty array", () => {
    const result = schemeSectionSchema.safeParse({ ...baseSection, emomSlots: [] });

    expect(result.success).toBe(true);
  });
});
