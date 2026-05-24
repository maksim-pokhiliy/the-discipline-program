import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { theme } from "@repo/mui";

import { render } from "../../test/render";

import { RowKindBadge, type RowKind } from "./row-kind-badge";

const KINDS: RowKind[] = ["ex", "rest", "foot", "load", "url", "placeholder", "ladder"];

describe("RowKindBadge", () => {
  for (const kind of KINDS) {
    it(`renders the ${kind} kind with the corresponding palette color`, () => {
      const { container } = render(<RowKindBadge kind={kind} />);
      const chip = container.querySelector(".MuiChip-root");
      const expectedColor = theme.palette.kind[kind];

      expect(chip).not.toBeNull();
      expect(chip).toHaveStyle({ borderColor: expectedColor });
      expect(chip).toHaveStyle({ color: expectedColor });
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
});
