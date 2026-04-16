import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "../test/render";

import { CollapsibleList } from "./collapsible-list";

describe("CollapsibleList empty state", () => {
  it("mounts without crashing when items array is empty", () => {
    expect(() => render(<CollapsibleList items={[]} />)).not.toThrow();
  });

  it("does not render show-more toggle when there are no hidden items", () => {
    render(<CollapsibleList items={[]} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("does not render show-more toggle when items count fits initialCount", () => {
    render(<CollapsibleList items={[]} initialCount={3} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
