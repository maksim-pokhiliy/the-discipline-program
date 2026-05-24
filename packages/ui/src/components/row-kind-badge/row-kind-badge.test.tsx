import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { theme } from "@repo/mui";

import { render } from "../../test/render";

import { RowKindBadge, type RowKind } from "./row-kind-badge";

const KINDS: RowKind[] = ["ex", "rest", "foot", "load", "url", "placeholder", "ladder"];

describe("RowKindBadge", () => {
  for (const kind of KINDS) {
    it(`renders the ${kind} kind with palette color and pinned border shape (MT-04)`, () => {
      const { container } = render(<RowKindBadge kind={kind} />);
      const chip = container.querySelector(".MuiChip-root");
      const expectedColor = theme.palette.kind[kind];

      expect(chip).not.toBeNull();
      expect(chip).toHaveStyle({ borderColor: expectedColor });
      expect(chip).toHaveStyle({ color: expectedColor });
      expect(chip).toHaveStyle({ borderStyle: "solid" });
      expect(chip).toHaveStyle({ borderWidth: "1px" });
    });
  }

  it("defaults the label to the uppercased first two chars of kind", () => {
    render(<RowKindBadge kind="ex" />);

    expect(screen.getByText("EX")).toBeInTheDocument();
  });

  it("renders a provided label override", () => {
    render(<RowKindBadge kind="ex" label="Exercise" />);

    expect(screen.getByText("Exercise")).toBeInTheDocument();
  });

  it("renders without crashing when given an unknown kind value (MT-08)", () => {
    const unknownKind = "unknown" as RowKind;
    const { container } = render(<RowKindBadge kind={unknownKind} label="UN" />);
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(screen.getByText("UN")).toBeInTheDocument();
  });
});
