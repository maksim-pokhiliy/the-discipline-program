import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { theme } from "@repo/mui";

import { render } from "../../test/render";

import { BlockLabel } from "./block-label";

describe("BlockLabel", () => {
  it("renders the provided text as the label", () => {
    render(<BlockLabel text="Block A" />);

    expect(screen.getByText("Block A")).toBeInTheDocument();
  });

  it("renders the outlined variant by default with transparent bg and dividerStrong border", () => {
    const { container } = render(<BlockLabel text="Block A" />);
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).toHaveStyle({ backgroundColor: "rgba(0, 0, 0, 0)" });
    expect(chip).toHaveStyle({ borderColor: theme.palette.dividerStrong });
  });

  it("renders the filled variant without the outlined inline overrides when filled is true", () => {
    const { container } = render(<BlockLabel text="Block A" filled={true} />);
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).not.toHaveStyle({ backgroundColor: "transparent" });
    expect(chip).toHaveStyle({ backgroundColor: theme.palette.text.primary });
  });

  it("renders a delete icon and calls onDelete when clicked", () => {
    const onDelete = vi.fn();
    const { container } = render(<BlockLabel text="Block A" onDelete={onDelete} />);
    const deleteIcon = container.querySelector(".MuiChip-deleteIcon");

    if (deleteIcon === null) {
      throw new Error("delete icon not rendered");
    }

    fireEvent.click(deleteIcon);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
