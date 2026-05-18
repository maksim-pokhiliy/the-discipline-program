import { describe, expect, it } from "vitest";

import {
  CONNECTOR_FORMS,
  COUNT_FORMS,
  FOOTNOTE_TARGETS,
  OR_ALTERNATIVE_PURPOSES,
  PLACEHOLDER_KINDS,
  STAGED_PROGRAM_KINDS,
  STAGE_INDICATORS,
  STANDALONE_LOAD_SCOPES,
  connectorFormSchema,
  countFormSchema,
  footnoteTargetSchema,
  orAlternativePurposeSchema,
  placeholderKindSchema,
  stageIndicatorSchema,
  stagedProgramKindSchema,
  standaloneLoadScopeSchema,
} from "./enums";

describe("footnoteTargetSchema", () => {
  it("accepts all 3 FOOTNOTE_TARGETS", () => {
    for (const target of FOOTNOTE_TARGETS) {
      expect(footnoteTargetSchema.safeParse(target).success).toBe(true);
    }
  });

  it("rejects unknown value", () => {
    expect(footnoteTargetSchema.safeParse("each_block").success).toBe(false);
  });
});

describe("standaloneLoadScopeSchema", () => {
  it("accepts single canonical value", () => {
    for (const scope of STANDALONE_LOAD_SCOPES) {
      expect(standaloneLoadScopeSchema.safeParse(scope).success).toBe(true);
    }
  });

  it("rejects unknown scope", () => {
    expect(standaloneLoadScopeSchema.safeParse("applies_to_next_row").success).toBe(false);
  });
});

describe("connectorFormSchema", () => {
  it("accepts all 3 CONNECTOR_FORMS", () => {
    for (const form of CONNECTOR_FORMS) {
      expect(connectorFormSchema.safeParse(form).success).toBe(true);
    }
  });

  it("rejects unknown form", () => {
    expect(connectorFormSchema.safeParse("and_then").success).toBe(false);
  });
});

describe("countFormSchema", () => {
  it("accepts all 3 COUNT_FORMS", () => {
    for (const form of COUNT_FORMS) {
      expect(countFormSchema.safeParse(form).success).toBe(true);
    }
  });

  it("rejects unknown form", () => {
    expect(countFormSchema.safeParse("approx").success).toBe(false);
  });
});

describe("stageIndicatorSchema", () => {
  it("accepts all 2 STAGE_INDICATORS", () => {
    for (const indicator of STAGE_INDICATORS) {
      expect(stageIndicatorSchema.safeParse(indicator).success).toBe(true);
    }
  });

  it("rejects unknown indicator", () => {
    expect(stageIndicatorSchema.safeParse("light").success).toBe(false);
  });
});

describe("stagedProgramKindSchema", () => {
  it("accepts all 3 STAGED_PROGRAM_KINDS", () => {
    for (const kind of STAGED_PROGRAM_KINDS) {
      expect(stagedProgramKindSchema.safeParse(kind).success).toBe(true);
    }
  });

  it("rejects unknown kind", () => {
    expect(stagedProgramKindSchema.safeParse("ramp").success).toBe(false);
  });
});

describe("orAlternativePurposeSchema", () => {
  it("accepts all 3 OR_ALTERNATIVE_PURPOSES", () => {
    for (const purpose of OR_ALTERNATIVE_PURPOSES) {
      expect(orAlternativePurposeSchema.safeParse(purpose).success).toBe(true);
    }
  });

  it("rejects unknown purpose", () => {
    expect(orAlternativePurposeSchema.safeParse("warmup").success).toBe(false);
  });
});

describe("placeholderKindSchema", () => {
  it("accepts all 3 PLACEHOLDER_KINDS", () => {
    for (const kind of PLACEHOLDER_KINDS) {
      expect(placeholderKindSchema.safeParse(kind).success).toBe(true);
    }
  });

  it("rejects unknown placeholder kind", () => {
    expect(placeholderKindSchema.safeParse("free_form").success).toBe(false);
  });
});
