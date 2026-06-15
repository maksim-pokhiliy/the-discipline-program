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

describe("SchemaRowCard summary chips", () => {
  it("renders a chip per prescription category and notes as prose", () => {
    renderRow(
      makeExerciseRow({
        sets: 4,
        reps: { kind: "count", value: 5 },
        load: { kind: "bodyweight" },
        side: { kind: "each_leg" },
        tempo: { eccentric: 3, pauseBottom: 1, concentric: 1, pauseTop: 0 },
        modifiers: [
          {
            id: "ckmod01234567890abcdef0123",
            name: "from sofa",
            nameLower: "from sofa",
            notes: null,
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
            updatedAt: new Date("2025-01-01T00:00:00.000Z"),
          },
        ],
        notes: ["explosive"],
      }),
    );

    expect(screen.getByText("4 × 5 reps")).toBeInTheDocument();
    expect(screen.getByText("BW")).toBeInTheDocument();
    expect(screen.getByText("each leg")).toBeInTheDocument();
    expect(screen.getByText("3-1-1-0")).toBeInTheDocument();
    expect(screen.getByText("from sofa")).toBeInTheDocument();
    expect(screen.getByText("explosive")).toBeInTheDocument();
  });

  it("renders notes as plain prose without quotes", () => {
    renderRow(makeExerciseRow({ notes: ["explosive"] }));

    expect(screen.getByText("explosive")).toBeInTheDocument();
    expect(screen.queryByText("'explosive'")).toBeNull();
  });
});
