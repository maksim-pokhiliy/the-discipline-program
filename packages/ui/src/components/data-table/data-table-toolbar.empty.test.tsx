import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "../../test/render";

import { DataTableToolbar } from "./data-table-toolbar";

describe("DataTableToolbar empty state", () => {
  it("renders without crashing with no filters, no search, no action", () => {
    expect(() => render(<DataTableToolbar />)).not.toThrow();
  });

  it("renders empty toolbar when filters is empty array and searchValue is empty", () => {
    render(<DataTableToolbar searchValue="" filters={[]} />);

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("does not render search input when onSearchChange is not provided", () => {
    render(<DataTableToolbar filters={[]} searchValue="" />);

    expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();
  });

  it("renders search input when onSearchChange is provided and search value is empty", () => {
    render(<DataTableToolbar searchValue="" onSearchChange={() => undefined} filters={[]} />);

    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });
});
