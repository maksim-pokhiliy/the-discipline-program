import { describe, expect, it } from "vitest";

import { createLeadSubmissionSchema } from "../entities/cms/contact";

describe("createLeadSubmissionSchema — lead field-rule divergence from contact", () => {
  it("accepts a minimal payload with only contact and program", () => {
    expect(
      createLeadSubmissionSchema.safeParse({ contact: "tg:@x", program: "strength-base" }).success,
    ).toBe(true);
  });

  it("accepts a payload with name absent", () => {
    expect(
      createLeadSubmissionSchema.safeParse({
        contact: "tg:@x",
        program: "strength-base",
        message: "hi",
      }).success,
    ).toBe(true);
  });

  it("accepts a payload with message absent", () => {
    expect(
      createLeadSubmissionSchema.safeParse({
        name: "Sam",
        contact: "tg:@x",
        program: "strength-base",
      }).success,
    ).toBe(true);
  });

  it("rejects a payload with program absent", () => {
    expect(createLeadSubmissionSchema.safeParse({ contact: "tg:@x" }).success).toBe(false);
  });

  it("rejects a payload with contact absent", () => {
    expect(createLeadSubmissionSchema.safeParse({ program: "strength-base" }).success).toBe(false);
  });

  it("rejects a program over the max length", () => {
    expect(
      createLeadSubmissionSchema.safeParse({ contact: "tg:@x", program: "p".repeat(101) }).success,
    ).toBe(false);
  });

  it("strips HTML and control chars from text fields on output", () => {
    const result = createLeadSubmissionSchema.safeParse({
      name: "<i>Sam</i>",
      contact: "tg:@x",
      program: "<b>p</b>x",
      message: "<script>alert(1)</script>hello",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.program).toBe("px");
      expect(result.data.name).toBe("Sam");
      expect(result.data.message).toBe("hello");
    }
  });
});
