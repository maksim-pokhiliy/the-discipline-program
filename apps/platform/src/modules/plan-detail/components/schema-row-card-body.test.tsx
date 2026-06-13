import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";
import { theme } from "@repo/mui";

import { CatalogContext, type CatalogContextValue } from "@app/lib/contexts/catalog-provider";
import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import {
  PLAN_ID,
  START_DATE,
  exerciseById,
  makeExerciseRow,
  rowKindCases,
} from "./schema-row-card.fixtures";

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useDeleteSchemaRow: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

const { SchemaRowCard } = await import("./schema-row-card");

const catalogValue: CatalogContextValue = {
  exerciseById,
};

const renderRow = (row: SchemaRow, index = 0) =>
  render(
    <CatalogContext.Provider value={catalogValue}>
      <SchemaRowCard
        row={row}
        planId={PLAN_ID}
        startDate={START_DATE}
        index={index}
        isReorderPending={false}
      />
    </CatalogContext.Provider>,
  );

afterEach(() => {
  vi.clearAllMocks();
});

describe("SchemaRowCard per-RowKind rendering", () => {
  for (const c of rowKindCases) {
    it(`renders ${c.name}: ord, badge, mainText and sub`, () => {
      const { container } = renderRow(c.build(), c.index ?? 0);

      expect(screen.getAllByText(c.ord).length).toBeGreaterThan(0);
      expect(screen.getByText(c.mainText)).toBeInTheDocument();

      if (c.sub !== null) {
        expect(screen.getByText(c.sub)).toBeInTheDocument();
      }

      const kindColor = theme.palette.kind[c.kindCls];
      const badge = container.querySelector(".MuiChip-root");

      expect(badge).not.toBeNull();
      expect(badge?.textContent).toBe(c.badgeLabel);
      expect(badge).toHaveStyle({
        borderColor: kindColor,
        color: kindColor,
        borderStyle: c.dashed ? "dashed" : "solid",
      });
    });
  }
});

describe("SchemaRowCard notes append", () => {
  it("appends notes in single quotes to subParts for a row", () => {
    renderRow(makeExerciseRow({ notes: ["explosive"] }));

    expect(screen.getByText("'explosive'")).toBeInTheDocument();
  });
});

describe("SchemaRowCard duplicate-string sub-parts (anti-pattern #45)", () => {
  it("renders sub-parts without a React duplicate-key warning when same text repeats", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      renderRow(
        makeExerciseRow({
          reps: { kind: "count", value: 5 },
          load: { kind: "bodyweight" },
          notes: ["BW"],
        }),
      );

      const duplicateKeyWarnings = consoleErrorSpy.mock.calls.filter((args) => {
        const first = args[0];

        return typeof first === "string" && first.includes("two children with the same key");
      });

      expect(duplicateKeyWarnings).toHaveLength(0);
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
