import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { theme } from "@repo/mui";

import { render } from "../../test/render";

import { TagChip } from "./tag-chip";

describe("TagChip", () => {
  it("renders the provided label", () => {
    render(<TagChip label="metcon" />);

    expect(screen.getByText("metcon")).toBeInTheDocument();
  });

  it("renders the outlined variant by default with transparent bg and dividerStrong border", () => {
    const { container } = render(<TagChip label="metcon" />);
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).toHaveStyle({ backgroundColor: "rgba(0, 0, 0, 0)" });
    expect(chip).toHaveStyle({ borderColor: theme.palette.dividerStrong });
  });

  it("renders the filled variant with text.primary bg and never the action.selected fallback", () => {
    const { container } = render(<TagChip label="metcon" filled={true} />);
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).toHaveStyle({ backgroundColor: theme.palette.text.primary });
    expect(chip).not.toHaveStyle({ backgroundColor: theme.palette.action.selected });
  });

  it("uppercases the label by default and preserves case when preserveCase is set", () => {
    const { container: upper } = render(<TagChip label="From Sofa" />);
    const { container: preserved } = render(<TagChip label="From Sofa" preserveCase={true} />);

    expect(upper.querySelector(".MuiChip-root")).toHaveStyle({ textTransform: "uppercase" });
    expect(preserved.querySelector(".MuiChip-root")).toHaveStyle({ textTransform: "none" });
  });

  it("renders a delete icon and calls onDelete when clicked", () => {
    const onDelete = vi.fn();
    const { container } = render(<TagChip label="metcon" onDelete={onDelete} />);
    const deleteIcon = container.querySelector(".MuiChip-deleteIcon");

    if (deleteIcon === null) {
      throw new Error("delete icon not rendered");
    }

    fireEvent.click(deleteIcon);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("forwards arbitrary Chip props such as size", () => {
    const { container } = render(<TagChip label="metcon" size="small" />);

    expect(container.querySelector(".MuiChip-sizeSmall")).not.toBeNull();
  });
});
