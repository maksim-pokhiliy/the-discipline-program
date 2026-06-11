import { describe, expect, it } from "vitest";

import {
  CONNECTOR_FORMS,
  COUNT_FORMS,
  OR_ALTERNATIVE_PURPOSES,
  PLACEHOLDER_KINDS,
  connectorFormSchema,
  countFormSchema,
  orAlternativePurposeSchema,
  placeholderKindSchema,
} from "./enums";

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
